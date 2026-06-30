const fs = require('fs');
const path = require('path');

const eventsFile = path.join(__dirname, '../data/events.json');
const testimonialsFile = path.join(__dirname, '../data/testimonials.json');

function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return []; }
}

const routineServices = [
  {
    name: "Wednesday Prayer Meeting",
    schedule: "Every Wednesday, 17:00 - 18:00",
    image: "prayer.jpg",
    contact: "Kelebone Lekunya +266 6320 6940"
  },
  {
    name: "Sunday Service Highlights",
    schedule: "Watch our latest Sunday service",
    videoLink: "https://www.youtube.com/embed/5VWxxSnWsR4?feature=share",
    contact: "59193208"
  },
  {
    name: "Sunday Service",
    schedule: "Every Sunday, 10:00 - 13:00",
    image: "service.jpg",
    contact: "59193208"
  },
];

exports.index = (req, res) => {
  const events = loadJSON(eventsFile);
  const testimonials = loadJSON(testimonialsFile);

  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);

  const upcomingEvents = events
    .filter(event => {
      const d = event.date;
      if (!d || d === 'Ad hoc' || d === 'Every Sunday' || d === 'TBD' ||
          d === 'Every quarter' || d === 'Bi-annually' || d.startsWith('Every')) return false;
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
    activePage: 'home'
  });
};
