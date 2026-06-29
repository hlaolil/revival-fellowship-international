const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'rfi';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rfi-admin-2026';

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

// GET /admin
exports.login = (req, res) => {
  res.render('admin-login', {
    title: 'Admin Login',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: '',
    error: null,
  });
};

// POST /admin/login
exports.doLogin = (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.cookie('rfi_admin', ADMIN_PASSWORD, { httpOnly: true, maxAge: 3600000 });
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login', {
    title: 'Admin Login',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: '',
    error: 'Incorrect password. Please try again.',
  });
};

// Middleware to protect admin routes
exports.requireAuth = (req, res, next) => {
  if (req.cookies && req.cookies.rfi_admin === ADMIN_PASSWORD) {
    return next();
  }
  res.redirect('/admin');
};

// GET /admin/dashboard
exports.dashboard = async (req, res) => {
  let submissions = [];
  let dbError = null;
  try {
    const database = await getDb();
    submissions = await database.collection('submissions').find({}).sort({ submittedAt: -1 }).limit(50).toArray();
  } catch (err) {
    dbError = 'Could not load submissions: ' + err.message;
  }

  const newsFile = path.join(__dirname, '../data/news.json');
  const eventsFile = path.join(__dirname, '../data/events.json');
  const testimonialsFile = path.join(__dirname, '../data/testimonials.json');

  let news = [], events = [], testimonials = [];
  try { news = JSON.parse(fs.readFileSync(newsFile, 'utf8')); } catch {}
  try { events = JSON.parse(fs.readFileSync(eventsFile, 'utf8')); } catch {}
  try { testimonials = JSON.parse(fs.readFileSync(testimonialsFile, 'utf8')); } catch {}

  res.render('admin-dashboard', {
    title: 'Admin Dashboard',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: '',
    submissions,
    dbError,
    newsCount: news.length,
    eventsCount: events.length,
    testimonialsCount: testimonials.length,
  });
};

// GET /admin/logout
exports.logout = (req, res) => {
  res.clearCookie('rfi_admin');
  res.redirect('/admin');
};
