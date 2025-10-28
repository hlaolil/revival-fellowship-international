// controllers/aboutController.js
exports.index = (req, res) => {
  res.render('about', {
    title: 'RFI About Page',
    currentYear: new Date().getFullYear(),
    lastModified: document.lastModified || new Date().toLocaleString(),
    activePage: 'about'
  });
};
