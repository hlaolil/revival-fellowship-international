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
  res.render('join', {
    title: 'Join RFI',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join'
  });
};

// POST /join
exports.submit = async (req, res) => {
  console.log('Form submitted:', req.body);

  const submission = {
    firstName: req.body['first-name'] || '',
    lastName: req.body['last-name'] || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    membership: req.body.membership || '',
    message: req.body.message || '',
    timestamp: req.body.timestamp || new Date().toLocaleString(),
    submittedAt: new Date()
  };

  try {
    const database = await getDb();
    await database.collection(COLLECTION).insertOne(submission);
    console.log('Saved to MongoDB:', submission.email);
  } catch (err) {
    console.error('MongoDB save failed:', err);
    return res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to save your submission. Please try again.'
    });
  }

  // Render thank-you page
  res.render('thankyou', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join',
    ...submission // pass all fields
  });
};
