exports.index = (req, res) => {
  res.render('about', {
    title: 'RFI About Page',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),  // ✅ FIXED
    activePage: 'about'
  });
};
