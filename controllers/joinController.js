// controllers/joinController.js
const fs = require('fs');
const path = require('path');

const ENTRIES_FILE = path.join(__dirname, '..', 'data', 'entries.json');

/**
 * GET  /join  →  render join form
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
 * POST  /join  →  save data + render thankyou.ejs
 */
exports.submit = (req, res) => {
  console.log('Form submitted:', req.body);

  // 1. Read existing entries (or start with an empty array)
  let entries = [];
  if (fs.existsSync(ENTRIES_FILE)) {
    try {
      const fileData = fs.readFileSync(ENTRIES_FILE, 'utf8');
      entries = JSON.parse(fileData);
      // safety – make sure it really is an array
      if (!Array.isArray(entries)) entries = [];
    } catch (err) {
      console.error('Failed to parse entries.json, starting fresh:', err);
      entries = [];
    }
  }

  // 2. Append the new submission
  const newEntry = {
    ...req.body,
    submittedAt: new Date().toISOString()
  };
  entries.push(newEntry);

  // 3. Write back to file (pretty-printed)
  try {
    fs.mkdirSync(path.dirname(ENTRIES_FILE), { recursive: true }); // ensure folder exists
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
    console.log('Entry saved to', ENTRIES_FILE);
  } catch (err) {
    console.error('Failed to write entries.json:', err);
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Could not save your submission. Please try again later.'
    });
  }

  // 4. Render the thank-you page
  res.render('thankyou', {          // ← change this to whatever your file is named
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    // you can pass the submitted data back if you want to show it:
    submittedData: newEntry
  });
};
