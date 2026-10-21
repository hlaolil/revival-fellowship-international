const { getDb, loadJSON } = require('../lib/db');

exports.index = async (req, res) => {
  let photos;
  try {
    const db = await getDb();
    photos = await db.collection('gallery').find({}).sort({ _id: -1 }).toArray();
  } catch {
    photos = loadJSON('gallery.json');
  }
  const categories = ['All', ...new Set(photos.map(p => p.category).filter(Boolean))];
  res.render('gallery', {
    title: 'Photo Gallery',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'gallery',
    photos: photos.map(({ src, caption, category }) => ({ src, caption, category })),
    categories,
  });
};
