const { getDb } = require('../lib/db');
const fs = require('fs');
const path = require('path');

function fallback() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sermons.json'), 'utf8')); } catch { return []; }
}

exports.index = async (req, res) => {
  let sermons = [];
  try {
    const db = await getDb();
    sermons = await db.collection('sermons').find({}).sort({ date: -1 }).toArray();
  } catch { sermons = fallback().sort((a, b) => new Date(b.date) - new Date(a.date)); }

  const series = [...new Set(sermons.map(s => s.series).filter(Boolean))];
  res.render('sermons', {
    title: 'Sermon Archive',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'sermons',
    sermons,
    series,
  });
};
