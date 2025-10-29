// controllers/homeController.js
const fs = require('fs');
const path = require('path');



  res.render('index', {
    title: 'RFI Home Page',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),  // ✅ FIXED: Server-side date
    activePage: 'home'
  });
};
