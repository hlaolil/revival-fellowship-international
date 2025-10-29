// controllers/joinController.js
const { MongoClient } = require('mongodb');

// ---- CONFIG ----
const MONGODB_URI = process.env.MONGODB_URI; // Set in Render > Environment
const DB_NAME = 'rfi';
const COLLECTION = 'submissions';
let client;
let db;

// Connect once (re-use connection)
async function getDb() {
  if (db) return db;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');
  client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

// GET /join
exports.index = (req, res) => {
  res.render('join-options', {
    title: 'Join RFI',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    // expose the four options to the template
    options: [
  { value: 'give',      label: 'Give',      icon: 'fa-heart',           href: '/give' },
  { value: 'volunteer', label: 'Volunteer', icon: 'fa-hands-helping',   href: '/volunteer' },
  { value: 'register',  label: 'Register Membership',  icon: 'fa-user-plus',       href: '/register' },
  { value: 'inquire',   label: 'Inquire',   icon: 'fa-question-circle', href: '/inquire' },
],
    
  });
};
// GET /inquire
exports.inquire = (req, res) => {
  res.render('inquire', {
    title: 'inquire',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'inquire'
  });
};

// POST /inquire  (unchanged – just kept for context)
exports.submit = async (req, res) => {
  console.log('Form submitted:', req.body);
  const submission = {
    firstName: req.body['first-name'] || '',
    lastName: req.body['last-name'] || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    type: req.body.type || '',   // <-- now populated by the button click
    message: req.body.message || '',
    timestamp: req.body.timestamp || new Date().toLocaleString(),
    submittedAt: new Date(),
  };

  try {
    const database = await getDb();
    await database.collection(COLLECTION).insertOne(submission);
    console.log('Saved to MongoDB:', submission.email);
  } catch (err) {
    console.error('MongoDB save failed:', err);
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to save your submission. Please try again.',
    });
  }

  res.render('thankyou', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    ...submission,
  });
};
