// controllers/joinController.js

exports.index = (req, res) => {
  res.render('join', {
    title: 'Join RFI',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(), // FIXED: Server-side date
    activePage: 'join'
  });
};

exports.submit = (req, res) => {
  const formData = req.body;
  console.log('Form submitted:', formData);
  res.render('join-success', {
    title: 'Thank You',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'join'
  });
};
