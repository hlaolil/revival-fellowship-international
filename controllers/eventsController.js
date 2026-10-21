const { getDb, loadJSON } = require('../lib/db');
const { isMonthly, isOneOff, expandEvents, describeRepeat, todayIso, addMonthsIso } = require('../lib/events');

const categoryStyles = {
  routine:  { label: 'Weekly Service', icon: 'fa-church',         color: 'bg-primary' },
  prayer:   { label: 'Prayer',         icon: 'fa-praying-hands',  color: 'bg-indigo-500' },
  fast:     { label: 'Fasting',        icon: 'fa-hourglass-half', color: 'bg-purple-500' },
  training: { label: 'Training',       icon: 'fa-graduation-cap', color: 'bg-blue-500' },
  special:  { label: 'Special Event',  icon: 'fa-star',           color: 'bg-secondary' },
  outreach: { label: 'Outreach',       icon: 'fa-hands-helping',  color: 'bg-green-500' },
};

exports.index = async (req, res) => {
  let events = [];
  try {
    const db = await getDb();
    events = await db.collection('events').find({}).toArray();
  } catch {
    events = loadJSON('events.json');
  }

  const today = todayIso();
  const upcoming = expandEvents(events, today, addMonthsIso(12));
  const past = events.filter(e => isOneOff(e) && e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  const recurring = events
    .filter(e => !isOneOff(e))
    .map(e => ({ ...e, when: describeRepeat(e) }))
    .sort((a, b) => isMonthly(a) - isMonthly(b));

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
