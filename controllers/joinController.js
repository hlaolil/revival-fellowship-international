// controllers/joinController.js
exports.index = (req, res) => {
  res.render('join', {
    title: 'Join RFI',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join'
  });
};

exports.submit = (req, res) => {
  console.log('Form data:', req.body);
  res.render('join-success', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join'
  });
};
