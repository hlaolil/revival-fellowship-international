const { getDb } = require('../lib/db');
const fs = require('fs');
const path = require('path');

function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data', file), 'utf8')); } catch { return []; }
}

const routineServices = [
  { name: "Wednesday Prayer Meeting", schedule: "Every Wednesday, 17:00 - 18:00", image: "prayer.jpg", contact: "Kelebone Lekunya +266 6320 6940" },
  { name: "Sunday Service Highlights", schedule: "Watch our latest Sunday service", videoLink: "https://www.youtube.com/embed/5VWxxSnWsR4?feature=share", contact: "59193208" },
  { name: "Sunday Service", schedule: "Every Sunday, 10:00 - 13:00", image: "service.jpg", contact: "59193208" },
];

exports.index = async (req, res) => {
  let events = [], testimonials = [];

  try {
    const db = await getDb();
    [events, testimonials] = await Promise.all([
      db.collection('events').find({}).toArray(),
      db.collection('testimonials').find({}).toArray(),
    ]);
  } catch {
    events = loadJSON('events.json');
    testimonials = loadJSON('testimonials.json');
  }

  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);

  const upcomingEvents = events
    .filter(e => {
      const d = e.date;
      if (!d || ['Ad hoc', 'Every quarter', 'Bi-annually'].includes(d) || d.startsWith('Every')) return false;
      const parsed = new Date(d);
      return !isNaN(parsed) && parsed >= today && parsed <= threeMonthsLater;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  res.render('index', {
    title: 'RFI Home Page',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    upcomingEvents,
    routineServices,
    testimonials,
    activePage: 'home',
  });
};
