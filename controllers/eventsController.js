const { getDb, loadJSON } = require('../lib/db');

const categoryStyles = {
  routine:  { label: 'Weekly Service', icon: 'fa-church',         color: 'bg-primary' },
  prayer:   { label: 'Prayer',         icon: 'fa-praying-hands',  color: 'bg-indigo-500' },
  fast:     { label: 'Fasting',        icon: 'fa-hourglass-half', color: 'bg-purple-500' },
  training: { label: 'Training',       icon: 'fa-graduation-cap', color: 'bg-blue-500' },
  special:  { label: 'Special Event',  icon: 'fa-star',           color: 'bg-secondary' },
  outreach: { label: 'Outreach',       icon: 'fa-hands-helping',  color: 'bg-green-500' },
};

function isDated(e) {
  return /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') && !isNaN(new Date(e.date));
}

exports.index = async (req, res) => {
  let events = [];
  try {
    const db = await getDb();
    events = await db.collection('events').find({}).toArray();
  } catch {
    events = loadJSON('events.json');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dated = events.filter(isDated).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = dated.filter(e => new Date(e.date) >= today);
  const past = dated.filter(e => new Date(e.date) < today).reverse();
  const recurring = events.filter(e => !isDated(e));

  // Group upcoming events by "Month Year"
  const months = [];
  upcoming.forEach(e => {
    const label = new Date(e.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    let group = months.find(m => m.label === label);
    if (!group) { group = { label, events: [] }; months.push(group); }
    group.events.push(e);
  });

  res.render('events', {
    title: 'Church Calendar',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'events',
    months,
    past,
    recurring,
    categoryStyles,
    nextEvent: upcoming[0] || null,
  });
};
