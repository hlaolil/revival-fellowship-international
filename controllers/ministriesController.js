// controllers/ministriesController.js
const fs = require('fs');
const path = require('path');

const ministriesFile = path.join(__dirname, '../data/ministries.json');
let ministriesData = [];

try {
  const data = fs.readFileSync(ministriesFile, 'utf8');
  ministriesData = JSON.parse(data);
} catch (err) {
  console.error('Error loading ministries data:', err);
  ministriesData = [];
}

const imageMap = [
  { keyword: 'worship',     image: 'worship.jpg' },
  { keyword: 'youth',       image: 'youth.jpg' },
  { keyword: 'children',    image: 'children.jpg' },
  { keyword: 'sunday school', image: 'children.jpg' },
  { keyword: 'prayer',      image: 'prayer.jpg' },
  { keyword: 'outreach',    image: 'outreach.jpg' },
  { keyword: 'community',   image: 'outreach.jpg' },
  { keyword: 'bible',       image: 'bible-study.jpg' },
  { keyword: 'choir',       image: 'choir.jpg' },
  { keyword: 'music',       image: 'choir.jpg' },
  { keyword: 'women',       image: 'women.jpg' },
  { keyword: 'ladies',      image: 'women.jpg' },
  { keyword: 'men',         image: 'men.jpg' },
];

function resolveImage(ministry) {
  if (ministry.image) return ministry.image;
  const name = ministry.name.toLowerCase();
  const match = imageMap.find(entry => name.includes(entry.keyword));
  return match ? match.image : null;
}

exports.index = (req, res) => {
  const ministries = ministriesData.map(m => ({
    ...m,
    resolvedImage: resolveImage(m),
  }));

  res.render('ministries', {
    title: 'RFI Ministries',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    ministries,
    activePage: 'ministries'
  });
};
