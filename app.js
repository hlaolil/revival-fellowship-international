const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

const homeController        = require('./controllers/homeController');
const aboutController       = require('./controllers/aboutController');
const ministriesController  = require('./controllers/ministriesController');
const joinController        = require('./controllers/joinController');
const newsController        = require('./controllers/newsController');
const sermonsController     = require('./controllers/sermonsController');
const galleryController     = require('./controllers/galleryController');
const adminController       = require('./controllers/adminController');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Force HTTPS on Render
app.use((req, res, next) => {
  const isRender = !!process.env.RENDER;
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  if (isRender && !isHttps) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Public routes
app.get('/',            homeController.index);
app.get('/about',       aboutController.index);
app.get('/ministries',  ministriesController.index);
app.get('/ministries/:slug', ministriesController.detail);
app.get('/join',        joinController.index);
app.get('/inquire',     joinController.inquire);
app.post('/inquire',    joinController.submit);
app.get('/news',        newsController.index);
app.get('/news/:slug',  newsController.post);
app.get('/sermons',     sermonsController.index);
app.get('/gallery',     galleryController.index);

// Admin routes
app.get('/admin',              adminController.login);
app.post('/admin/login',       adminController.doLogin);
app.get('/admin/dashboard',    adminController.requireAuth, adminController.dashboard);
app.get('/admin/logout',       adminController.logout);

// 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: ''
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: '',
    message: 'Something went wrong. Please try again later.',
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;
const PROTOCOL = process.env.RENDER ? 'https' : 'http';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PROTOCOL}://${HOST}`);
});

module.exports = app;
