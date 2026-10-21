const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'rfi';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  cachedClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await cachedClient.connect();
  cachedDb = cachedClient.db(DB_NAME);
  await seedIfEmpty(cachedDb);
  return cachedDb;
}

async function seedIfEmpty(db) {
  const dataDir = path.join(__dirname, '../data');
  const seeds = [
    { collection: 'events',       file: 'events.json' },
    { collection: 'testimonials', file: 'testimonials.json' },
    { collection: 'news',         file: 'news.json' },
    { collection: 'sermons',      file: 'sermons.json' },
    { collection: 'ministries',   file: 'ministries.json' },
    { collection: 'gallery',      file: 'gallery.json' },
  ];

  // Seed default site content if missing
  const existing = await db.collection('site_content').findOne({ key: 'home' });
  if (!existing) {
    await db.collection('site_content').insertOne({
      key: 'home',
      heroTagline: 'An assembly of faithful stewards of the manifold grace of God',
      announcementEnabled: false,
      announcementText: '',
      announcementLink: '',
      announcementLinkText: 'Learn more',
      scriptureEnabled: false,
      scriptureVerse: '',
      scriptureReference: '',
      pastorMessageEnabled: false,
      pastorMessageTitle: 'A Word from the Pastor',
      pastorMessageText: '',
      pastorMessageAuthor: 'RFI Leadership',
    });
    console.log('Seeded default site content');
  }
  // Expire login attempt records after a day
  await db.collection('login_attempts').createIndex({ at: 1 }, { expireAfterSeconds: 86400 }).catch(() => {});

  for (const { collection, file } of seeds) {
    const count = await db.collection(collection).countDocuments();
    if (count === 0) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
        if (data.length > 0) {
          await db.collection(collection).insertMany(data);
          console.log(`Seeded ${data.length} docs into ${collection}`);
        }
      } catch (err) {
        console.error(`Seed failed for ${collection}:`, err.message);
      }
    }
  }
}

function toObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

// Read a seed file directly – used as a fallback when MongoDB is unavailable
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8')); } catch { return []; }
}

function slugify(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Ministries keep their insertion order unless an explicit display order is set
function byDisplayOrder(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0);
}

module.exports = { getDb, ObjectId, toObjectId, loadJSON, slugify, byDisplayOrder };
