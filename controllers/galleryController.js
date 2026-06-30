const fs = require('fs');
const path = require('path');

const galleryFile = path.join(__dirname, '../data/gallery.json');

function loadGallery() {
  try {
    return JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
  } catch {
    return [];
  }
}

exports.index = (req, res) => {
  const photos = loadGallery();
  const categories = ['All', ...new Set(photos.map(p => p.category))];
  res.render('gallery', {
    title: 'Photo Gallery',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'gallery',
    photos,
    categories,
  });
};
