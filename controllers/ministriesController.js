const fs = require('fs');
const path = require('path');

const ministriesFile = path.join(__dirname, '../data/ministries.json');
let ministriesData = [];

try {
  ministriesData = JSON.parse(fs.readFileSync(ministriesFile, 'utf8'));
} catch (err) {
  console.error('Error loading ministries data:', err);
}

const imageMap = [
  { keyword: 'worship',      image: 'worship.jpg' },
  { keyword: 'youth',        image: 'youth.jpg' },
  { keyword: 'children',     image: 'children.jpg' },
  { keyword: 'sunday school',image: 'children.jpg' },
  { keyword: 'prayer',       image: 'prayer.jpg' },
  { keyword: 'outreach',     image: 'outreach.jpg' },
  { keyword: 'community',    image: 'outreach.jpg' },
  { keyword: 'bible',        image: 'bible-study.jpg' },
  { keyword: 'choir',        image: 'choir.jpg' },
  { keyword: 'music',        image: 'choir.jpg' },
  { keyword: 'women',        image: 'women.jpg' },
  { keyword: 'ladies',       image: 'women.jpg' },
  { keyword: 'men',          image: 'men.jpg' },
];

function resolveImage(ministry) {
  if (ministry.image) return ministry.image;
  const name = ministry.name.toLowerCase();
  const match = imageMap.find(e => name.includes(e.keyword));
  return match ? match.image : null;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.index = (req, res) => {
  const ministries = ministriesData.map(m => ({
    ...m,
    resolvedImage: resolveImage(m),
    slug: slugify(m.name),
  }));
  res.render('ministries', {
    title: 'RFI Ministries',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    ministries,
    activePage: 'ministries'
  });
};

exports.detail = (req, res) => {
  const { slug } = req.params;
  const ministry = ministriesData.find(m => slugify(m.name) === slug);
  if (!ministry) {
    return res.status(404).render('404', {
      title: 'Ministry Not Found',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
    });
  }
  const others = ministriesData
    .filter(m => slugify(m.name) !== slug)
    .map(m => ({ ...m, resolvedImage: resolveImage(m), slug: slugify(m.name) }));

  res.render('ministry-detail', {
    title: ministry.name,
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'ministries',
    ministry: { ...ministry, resolvedImage: resolveImage(ministry), slug },
    others,
  });
};
