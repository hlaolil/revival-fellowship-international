const { getDb } = require('../lib/db');
const { expandEvents, todayIso, addMonthsIso } = require('../lib/events');
const fs = require('fs');
const path = require('path');

function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8')); } catch { return []; }
}


const defaultContent = {
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
};

exports.index = async (req, res) => {
  let events = [], testimonials = [], sermons = [], siteContent = defaultContent;

  try {
    const db = await getDb();
    [events, testimonials, siteContent, sermons] = await Promise.all([
      db.collection('events').find({}).toArray(),
      db.collection('testimonials').find({}).toArray(),
      db.collection('site_content').findOne({ key: 'home' }),
      db.collection('sermons').find({}).sort({ date: -1 }).limit(10).toArray(),
    ]);
    siteContent = siteContent || defaultContent;
  } catch {
    events = loadJSON('events.json');
    testimonials = loadJSON('testimonials.json');
    sermons = loadJSON('sermons.json').sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Featured sermon if one is marked, otherwise the most recent
  const latestSermon = sermons.find(s => s.featured) || sermons[0] || null;

  const upcomingEvents = expandEvents(events, todayIso(), addMonthsIso(3)).slice(0, 8);

  res.render('index', {
    title: 'RFI Home Page',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    upcomingEvents,
    latestSermon,
    testimonials,
    siteContent,
    activePage: 'home',
  });
};
