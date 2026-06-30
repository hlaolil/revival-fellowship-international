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

// Force HTTPS in production (Vercel sets VERCEL=1, Render sets RENDER=1)
app.use((req, res, next) => {
  const inCloud = process.env.VERCEL || process.env.RENDER;
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  if (inCloud && !isHttps) {
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

// Admin – auth
app.get('/admin',           adminController.login);
app.post('/admin/login',    adminController.doLogin);
app.get('/admin/logout',    adminController.logout);

const auth = adminController.requireAuth;

// Admin – dashboard
app.get('/admin/dashboard', auth, adminController.dashboard);

// Admin – events
app.get('/admin/events',                auth, adminController.eventsList);
app.get('/admin/events/new',            auth, adminController.eventNew);
app.post('/admin/events/create',        auth, adminController.eventCreate);
app.get('/admin/events/:id/edit',       auth, adminController.eventEdit);
app.post('/admin/events/:id/update',    auth, adminController.eventUpdate);
app.post('/admin/events/:id/delete',    auth, adminController.eventDelete);

// Admin – testimonials
app.get('/admin/testimonials',              auth, adminController.testimonialsList);
app.get('/admin/testimonials/new',          auth, adminController.testimonialNew);
app.post('/admin/testimonials/create',      auth, adminController.testimonialCreate);
app.get('/admin/testimonials/:id/edit',     auth, adminController.testimonialEdit);
app.post('/admin/testimonials/:id/update',  auth, adminController.testimonialUpdate);
app.post('/admin/testimonials/:id/delete',  auth, adminController.testimonialDelete);

// Admin – news
app.get('/admin/news',              auth, adminController.newsList);
app.get('/admin/news/new',          auth, adminController.newsNew);
app.post('/admin/news/create',      auth, adminController.newsCreate);
app.get('/admin/news/:id/edit',     auth, adminController.newsEdit);
app.post('/admin/news/:id/update',  auth, adminController.newsUpdate);
app.post('/admin/news/:id/delete',  auth, adminController.newsDelete);

// Admin – sermons
app.get('/admin/sermons',               auth, adminController.sermonsList);
app.get('/admin/sermons/new',           auth, adminController.sermonNew);
app.post('/admin/sermons/create',       auth, adminController.sermonCreate);
app.get('/admin/sermons/:id/edit',      auth, adminController.sermonEdit);
app.post('/admin/sermons/:id/update',   auth, adminController.sermonUpdate);
app.post('/admin/sermons/:id/delete',   auth, adminController.sermonDelete);

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

// Only start a local server when running directly (not on Vercel serverless)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
