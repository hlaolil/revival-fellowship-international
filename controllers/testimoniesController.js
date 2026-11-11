const nodemailer = require('nodemailer');
const { getDb } = require('../lib/db');
const { getSettings } = require('../lib/settings');

const COLLECTION = 'testimonials';
const MAX_TEXT = 4000;

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function lifeGroupNames() {
  const { lifeGroups } = await getSettings();
  return String(lifeGroups || '').split(',').map(s => s.trim()).filter(Boolean);
}

// Only testimonies an admin has approved are ever shown publicly
async function approvedTestimonies(limit = 0) {
  try {
    const db = await getDb();
    let cursor = db.collection(COLLECTION).find({ status: 'approved' }).sort({ approvedAt: -1, _id: -1 });
    if (limit) cursor = cursor.limit(limit);
    return await cursor.toArray();
  } catch {
    return [];
  }
}

async function sendNotificationEmail(t) {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"RFI Website" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'tlokza@gmail.com',
    subject: `New testimony from ${t.name} – waiting for approval`,
    text: `A new testimony was shared on the RFI website. It will not appear on the site until it is approved in Admin > Testimonies.\n\nName: ${t.name}\nLife group: ${t.role || '—'}\nPhone: ${t.phone || '—'}\n\n${t.text}`,
    html: `<h2>New Testimony</h2>
<p>It will not appear on the website until it is approved in <strong>Admin &gt; Testimonies</strong>.</p>
<p><strong>Name:</strong> ${escapeHtml(t.name)}<br><strong>Life group:</strong> ${escapeHtml(t.role || '—')}<br><strong>Phone:</strong> ${escapeHtml(t.phone || '—')}</p>
<blockquote style="border-left:3px solid #FFA500;padding-left:12px;white-space:pre-line">${escapeHtml(t.text)}</blockquote>`,
  });
}

async function renderPage(res, status, extra) {
  res.status(status).render('testimonies', {
    title: 'Testimonies',
    metaDescription: 'Testimonies of what God is doing in the lives of the Revival Fellowship International family – and share your own.',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'testimonies',
    testimonies: await approvedTestimonies(),
    lifeGroupOptions: await lifeGroupNames(),
    values: {},
    error: null,
    submitted: false,
    maxText: MAX_TEXT,
    ...extra,
  });
}

exports.approvedTestimonies = approvedTestimonies;

exports.index = (req, res) => renderPage(res, 200, {});

exports.submit = async (req, res) => {
  // Honeypot field – real visitors never fill this in
  if (req.body.website) return res.redirect('/testimonies');

  const field = (name, max = 120) => String(req.body[name] || '').trim().slice(0, max);
  const groups = await lifeGroupNames();
  const testimony = {
    name:  field('name'),
    role:  groups.includes(field('life-group')) ? `${field('life-group')} Life Group` : '',
    text:  field('testimony', MAX_TEXT),
    phone: field('phone', 40),
    image: null,
    source: 'website',
    status: 'pending',
    submittedAt: new Date(),
  };
  const consent = req.body.consent === 'yes';

  const missing = [];
  if (!testimony.name) missing.push('your name');
  if (testimony.text.length < 20) missing.push('your testimony (at least a few sentences)');
  if (!consent) missing.push('permission to share it on the website');
  if (missing.length) {
    return renderPage(res, 400, {
      values: { ...testimony, lifeGroup: field('life-group'), consent },
      error: `Please provide ${missing.join(', ')}.`,
    });
  }

  try {
    const db = await getDb();
    await db.collection(COLLECTION).insertOne(testimony);
  } catch (err) {
    console.error('MongoDB save failed:', err);
    return renderPage(res, 500, {
      values: { ...testimony, lifeGroup: field('life-group'), consent },
      error: 'Sorry, we could not save your testimony. Please try again later.',
    });
  }

  sendNotificationEmail(testimony).catch(err => console.error('Email notification failed:', err));
  renderPage(res, 200, { submitted: true });
};
