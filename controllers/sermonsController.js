const fs = require('fs');
const path = require('path');

const sermonsFile = path.join(__dirname, '../data/sermons.json');

function loadSermons() {
  try {
    return JSON.parse(fs.readFileSync(sermonsFile, 'utf8'));
  } catch {
    return [];
  }
}

exports.index = (req, res) => {
  const sermons = loadSermons().sort((a, b) => new Date(b.date) - new Date(a.date));
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
