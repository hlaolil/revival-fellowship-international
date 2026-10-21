const nodemailer = require('nodemailer');
const { getDb } = require('../lib/db');

const COLLECTION = 'submissions';
const ENQUIRY_TYPES = ['prayer-request', 'appointment-request', 'membership-request', 'information-request'];

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendNotificationEmail(submission) {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const typeLabel = submission.enquiryType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const h = Object.fromEntries(Object.entries(submission).map(([k, v]) => [k, escapeHtml(v)]));
  await transporter.sendMail({
    from: `"RFI Website" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'tlokza@gmail.com',
    subject: `New ${typeLabel} from ${submission.firstName} ${submission.lastName}`,
    text: `
New submission received on the RFI website.

Name: ${submission.firstName} ${submission.lastName}
Email: ${submission.email}
Phone: ${submission.phone}
Type: ${typeLabel}
Message: ${submission.message || 'None'}
Submitted: ${submission.timestamp}
    `.trim(),
    html: `
<h2>New ${typeLabel}</h2>
<table style="border-collapse:collapse;font-family:sans-serif;">
  <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td style="padding:6px 12px">${h.firstName} ${h.lastName}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${h.email}">${h.email}</a></td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td style="padding:6px 12px">${h.phone}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Type</td><td style="padding:6px 12px">${typeLabel}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Message</td><td style="padding:6px 12px">${h.message || 'None'}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Submitted</td><td style="padding:6px 12px">${h.timestamp}</td></tr>
</table>
    `,
  });
}

exports.index = (req, res) => {
  res.render('join-options', {
    title: 'Get Involved',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
  });
};

exports.inquire = (req, res) => {
  res.render('inquire', {
    title: 'Enquiry Form',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    enquiryType: req.query.type || '',
    values: {},
    error: null,
  });
};

exports.submit = async (req, res) => {
  const field = (name, max = 200) => String(req.body[name] || '').trim().slice(0, max);
  const submission = {
    firstName: field('first-name'),
    lastName:  field('last-name'),
    email:     field('email'),
    phone:     field('phone', 40),
    enquiryType: field('enquiry-type', 40),
    message:   field('message', 5000),
    timestamp: field('timestamp', 60) || new Date().toLocaleString(),
    submittedAt: new Date(),
    status: 'new',
  };

  // Honeypot field – real visitors never fill this in
  if (req.body.website) return res.redirect('/join');

  if (!submission.firstName || !submission.lastName || !submission.email || !submission.phone || !ENQUIRY_TYPES.includes(submission.enquiryType)) {
    return res.status(400).render('inquire', {
      title: 'Enquiry Form',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: 'join',
      enquiryType: submission.enquiryType,
      values: submission,
      error: 'Please fill in all required fields and choose an enquiry type.',
    });
  }

  try {
    const database = await getDb();
    await database.collection(COLLECTION).insertOne(submission);
  } catch (err) {
    console.error('MongoDB save failed:', err);
    return res.status(500).render('error', {
      title: 'Submission Error',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
      message: 'Failed to save your submission. Please try again or contact us directly.',
    });
  }

  sendNotificationEmail(submission).catch(err => console.error('Email notification failed:', err));

  res.render('thankyou', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    ...submission,
  });
};
