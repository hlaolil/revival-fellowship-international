const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'rfi';
const COLLECTION = 'submissions';

let client;
let db;

async function getDb() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
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
  <tr><td style="padding:6px 12px;font-weight:bold">Name</td><td style="padding:6px 12px">${submission.firstName} ${submission.lastName}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px"><a href="mailto:${submission.email}">${submission.email}</a></td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Phone</td><td style="padding:6px 12px">${submission.phone}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Type</td><td style="padding:6px 12px">${typeLabel}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Message</td><td style="padding:6px 12px">${submission.message || 'None'}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold">Submitted</td><td style="padding:6px 12px">${submission.timestamp}</td></tr>
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
    enquiryType: req.query.type || ''
  });
};

exports.submit = async (req, res) => {
  const submission = {
    firstName: req.body['first-name'] || '',
    lastName:  req.body['last-name'] || '',
    email:     req.body.email || '',
    phone:     req.body.phone || '',
    enquiryType: req.body['enquiry-type'] || '',
    message:   req.body.message || '',
    timestamp: req.body.timestamp || new Date().toLocaleString(),
    submittedAt: new Date(),
  };

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
