const nodemailer = require('nodemailer');
const { getDb } = require('../lib/db');
const { getSettings } = require('../lib/settings');

const COLLECTION = 'members';

const GENDERS = ['male', 'female'];
const MARITAL = ['single', 'married', 'widowed', 'divorced'];
const YES_NO = ['yes', 'no'];
const NO_GROUP = 'Not yet in a life group';

async function lifeGroupNames() {
  const { lifeGroups } = await getSettings();
  return String(lifeGroups || '').split(',').map(s => s.trim()).filter(Boolean);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const cap = s => String(s || '').replace(/\b\w/g, l => l.toUpperCase());

// Labelled rows used for the notification email and the thank-you page
function summaryRows(m) {
  return [
    ['Name', `${m.firstName} ${m.lastName}`],
    ['Gender', cap(m.gender)],
    ['Date of birth', m.dateOfBirth],
    ['Marital status', cap(m.maritalStatus) || '—'],
    ['Contact number', m.phone],
    ['Email', m.email || '—'],
    ['Village', m.village],
    ['City / Town', m.city],
    ['Country', m.country],
    ['Year saved', m.yearSaved],
    ['Water baptism', cap(m.waterBaptism) + (m.waterBaptism === 'yes' && m.baptismYear ? ` (${m.baptismYear})` : '')],
    ['Life group', m.lifeGroup || '—'],
    ['Emergency contact', m.emergencyName ? `${m.emergencyName} (${m.emergencyPhone || 'no number'})` : '—'],
  ];
}

async function sendNotificationEmail(m) {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const rows = summaryRows(m);
  await transporter.sendMail({
    from: `"RFI Website" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL || 'tlokza@gmail.com',
    subject: `New membership application from ${m.firstName} ${m.lastName}`,
    text: 'New membership application received on the RFI website.\n\n' + rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<h2>New Membership Application</h2>
<table style="border-collapse:collapse;font-family:sans-serif;">
${rows.map(([k, v]) => `  <tr><td style="padding:6px 12px;font-weight:bold">${escapeHtml(k)}</td><td style="padding:6px 12px">${escapeHtml(v)}</td></tr>`).join('\n')}
</table>`,
  });
}

async function renderForm(res, status, values, error) {
  res.status(status).render('membership', {
    title: 'Membership Form',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    lifeGroupOptions: [...await lifeGroupNames(), NO_GROUP],
    values,
    error,
  });
}

exports.form = async (req, res) => renderForm(res, 200, {}, null);

exports.submit = async (req, res) => {
  // Honeypot field – real visitors never fill this in
  if (req.body.website) return res.redirect('/join');

  const field = (name, max = 120) => String(req.body[name] || '').trim().slice(0, max);
  const pick = (name, allowed) => (allowed.includes(field(name, 20)) ? field(name, 20) : '');
  const thisYear = new Date().getFullYear();
  const year = name => {
    const y = parseInt(field(name, 4), 10);
    return y >= 1900 && y <= thisYear ? String(y) : '';
  };
  const dob = field('date-of-birth', 10);
  const validDob = /^\d{4}-\d{2}-\d{2}$/.test(dob) && !isNaN(Date.parse(dob)) && new Date(dob) < new Date();


  const member = {
    firstName:        field('first-name'),
    lastName:         field('last-name'),
    gender:           pick('gender', GENDERS),
    dateOfBirth:      validDob ? dob : '',
    maritalStatus:    pick('marital-status', MARITAL),
    phone:            field('phone', 40),
    email:            field('email', 200),
    village:          field('village'),
    city:             field('city'),
    country:          field('country') || 'Lesotho',
    yearSaved:        year('year-saved'),
    waterBaptism:     pick('water-baptism', YES_NO),
    baptismYear:      '',
    lifeGroup:        [...await lifeGroupNames(), NO_GROUP].includes(field('life-group')) ? field('life-group') : '',
    emergencyName:    field('emergency-name'),
    emergencyPhone:   field('emergency-phone', 40),
    consent:          req.body.consent === 'yes',
    submittedAt:      new Date(),
    status:           'pending',
  };
  if (member.waterBaptism === 'yes') member.baptismYear = year('baptism-year');

  const missing = [];
  if (!member.firstName) missing.push('name');
  if (!member.lastName) missing.push('surname');
  if (!member.gender) missing.push('gender');
  if (!member.dateOfBirth) missing.push('a valid date of birth');
  if (!member.phone) missing.push('contact number');
  if (!member.village) missing.push('village');
  if (!member.city) missing.push('city / town');
  if (!member.yearSaved) missing.push('year saved');
  if (!member.waterBaptism) missing.push('water baptism');
  if (!member.lifeGroup) missing.push('life group');
  if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) missing.push('a valid email address');
  if (!member.consent) missing.push('your consent to store these details');

  if (missing.length) {
    return renderForm(res, 400, member, `Please provide: ${missing.join(', ')}.`);
  }

  try {
    const db = await getDb();
    await db.collection(COLLECTION).insertOne(member);
  } catch (err) {
    console.error('MongoDB save failed:', err);
    return res.status(500).render('error', {
      title: 'Submission Error',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
      message: 'Failed to save your membership form. Please try again or contact us directly.',
    });
  }

  sendNotificationEmail(member).catch(err => console.error('Email notification failed:', err));

  res.render('membership-thankyou', {
    title: 'Welcome',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    member,
    rows: summaryRows(member),
  });
};

exports.summaryRows = summaryRows;
