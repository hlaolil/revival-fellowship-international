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

exports.index = (req, res) => {
  res.render('ministries', {
    title: 'RFI Ministries Info',
    currentYear: new Date().getFullYear(),
    lastModified: document.lastModified || new Date().toLocaleString(),
    ministries: ministriesData,
    activePage: 'ministries'
  });
};
