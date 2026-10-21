const { getDb, loadJSON, slugify, byDisplayOrder } = require('../lib/db');

const imageMap = [
  { keyword: 'youth',        image: 'youth.jpg' },
  { keyword: 'children',     image: 'children.jpg' },
  { keyword: 'sunday school',image: 'children.jpg' },
  { keyword: 'prayer',       image: 'prayer.jpg' },
  { keyword: 'women',        image: 'women.jpg' },
  { keyword: 'ladies',       image: 'women.jpg' },
  { keyword: 'men',          image: 'men.jpg' },
  { keyword: 'worship',      image: 'service.jpg' },
  { keyword: 'leader',       image: 'graduation_hands.jpg' },
  { keyword: 'community',    image: 'wide.jpg' },
  { keyword: 'outreach',     image: 'wide.jpg' },
];

function resolveImage(ministry) {
  if (ministry.image) return ministry.image;
  const name = ministry.name.toLowerCase();
  const match = imageMap.find(e => name.includes(e.keyword));
  return match ? match.image : null;
}

async function loadMinistries() {
  let ministries;
  try {
    const db = await getDb();
    ministries = (await db.collection('ministries').find({}).sort({ _id: 1 }).toArray()).sort(byDisplayOrder);
  } catch {
    ministries = loadJSON('ministries.json');
  }
  return ministries.map(m => ({ ...m, resolvedImage: resolveImage(m), slug: slugify(m.name) }));
}

exports.index = async (req, res) => {
  const ministries = await loadMinistries();
  res.render('ministries', {
    title: 'RFI Ministries',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    ministries,
    activePage: 'ministries'
  });
};

exports.detail = async (req, res) => {
  const { slug } = req.params;
  const all = await loadMinistries();
  const ministry = all.find(m => m.slug === slug);
  if (!ministry) {
    return res.status(404).render('404', {
      title: 'Ministry Not Found',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
    });
  }

  res.render('ministry-detail', {
    title: ministry.name,
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'ministries',
    ministry,
    others: all.filter(m => m.slug !== slug),
  });
};
