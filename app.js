// app.js
const express = require('express');
const path = require('path');
const app = express();

// Import Controllers
const homeController = require('./controllers/homeController');
const aboutController = require('./controllers/aboutController');
const ministriesController = require('./controllers/ministriesController');
const joinController = require('./controllers/joinController');

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', homeController.index);
app.get('/about', aboutController.index);
app.get('/ministries', ministriesController.index);
app.get('/join', joinController.index);
app.get('/inquire', joinController.inquire);
app.post('/inquire', joinController.submit);

// 404 Page - MUST come AFTER all routes
app.use((req, res, next) => {
  res.status(404);
  res.render('404', {
    title: 'Page Not Found',
    currentYear: new Date().getFullYear(),
    activePage: ''
  }, (err, html) => {
    if (err) {
      res.send(`
        <h1>404 - Not Found</h1>
        <p><a href="/">Go Home</a></p>
      `);
    } else {
      res.send(html);
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// === HTTPS & RENDER FIXES START HERE ===

// Force HTTPS on Render (Production)
app.use((req, res, next) => {
  const isRender = !!process.env.RENDER;
  const isHttps = req.headers['x-forwarded-proto'] === 'https';

  if (isRender && !isHttps) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Dynamic PORT & Host
const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
const PROTOCOL = process.env.RENDER ? 'https' : 'http';

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PROTOCOL}://${HOST}`);
});

module.exports = app;
