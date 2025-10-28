// controllers/joinController.js
const fs = require('fs');
const path = require('path');

const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');

/**
 * GET /join → render join form
 */
exports.index = (req, res) => {
  res.render('join', {
    title: 'Join RFI',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join'
  });
};

/**
 * POST /join → save data + render thankyou.ejs
 */
exports.submit = (req, res) => {
  console.log('Form submitted:', req.body);

  // ---------- 1. READ (or initialise) ----------
  let entries = [];
  if (fs.existsSync(ENTRIES_FILE)) {
    try {
      const raw = fs.readFileSync(ENTRIES_FILE, 'utf8').trim();
      if (raw) entries = JSON.parse(raw);           // <-- ignore empty file
      if (!Array.isArray(entries)) entries = [];
    } catch (err) {
      console.error('Corrupt entries.json – starting fresh:', err);
      entries = [];
    }
  }

  // ---------- 2. APPEND ----------
  const newEntry = {
    firstName: req.body['first-name'] || '',
    lastName: req.body['last-name'] || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    membership: req.body.membership || '',
    message: req.body.message || '',
    timestamp: req.body.timestamp || new Date().toLocaleString(),
    submittedAt: new Date().toISOString()
  };
  entries.push(newEntry);

  // ---------- 3. WRITE ----------
  try {
    fs.mkdirSync(path.dirname(ENTRIES_FILE), { recursive: true });
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
    console.log('Entry saved to', ENTRIES_FILE);
  } catch (err) {
    console.error('Write error:', err);
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Could not save your submission.'
    });
  }

  // ---------- 4. RENDER ----------
  res.render('thankyou', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    // <-- PASS EXACTLY what the view expects
    firstName: newEntry.firstName,
    lastName: newEntry.lastName,
    email: newEntry.email,
    phone: newEntry.phone,
    membership: newEntry.membership,
    message: newEntry.message,
    timestamp: newEntry.timestamp
  });
};
