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
const eventsController      = require('./controllers/eventsController');
const seoController         = require('./controllers/seoController');

// Express 4 does not catch rejected promises – forward them to the error handler
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Cache-busting token for the built stylesheet (changes whenever site.css is rebuilt)
try {
  const css = require('fs').readFileSync(path.join(__dirname, 'public/styles/site.css'));
  app.locals.assetVersion = require('crypto').createHash('md5').update(css).digest('hex').slice(0, 8);
} catch {
  app.locals.assetVersion = '0';
}

// Resolve an image reference: full URLs are used as-is, anything else lives in /public/images
app.locals.img = src => (/^(https?:)?\/\//.test(src || '') || (src || '').startsWith('/')) ? src : `/images/${src}`;

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
app.get('/',            wrap(homeController.index));
app.get('/about',       aboutController.index);
app.get('/ministries',  wrap(ministriesController.index));
app.get('/ministries/:slug', wrap(ministriesController.detail));
app.get('/events',      wrap(eventsController.index));
app.get('/join',        joinController.index);
app.get('/inquire',     joinController.inquire);
app.post('/inquire',    wrap(joinController.submit));
app.get('/news',        wrap(newsController.index));
app.get('/news/:slug',  wrap(newsController.post));
app.get('/sermons',     wrap(sermonsController.index));
app.get('/gallery',     wrap(galleryController.index));
app.get('/robots.txt',  seoController.robots);
app.get('/sitemap.xml', wrap(seoController.sitemap));

// Admin – auth
app.get('/admin',           adminController.login);
app.post('/admin/login',    adminController.doLogin);
app.get('/admin/logout',    adminController.logout);

const auth = adminController.requireAuth;

// Admin – dashboard
app.get('/admin/dashboard', auth, wrap(adminController.dashboard));

// Admin – events
app.get('/admin/events',                auth, wrap(adminController.eventsList));
app.get('/admin/events/new',            auth, wrap(adminController.eventNew));
app.post('/admin/events/create',        auth, wrap(adminController.eventCreate));
app.get('/admin/events/:id/edit',       auth, wrap(adminController.eventEdit));
app.post('/admin/events/:id/update',    auth, wrap(adminController.eventUpdate));
app.post('/admin/events/:id/delete',    auth, wrap(adminController.eventDelete));

// Admin – testimonials
app.get('/admin/testimonials',              auth, wrap(adminController.testimonialsList));
app.get('/admin/testimonials/new',          auth, wrap(adminController.testimonialNew));
app.post('/admin/testimonials/create',      auth, wrap(adminController.testimonialCreate));
app.get('/admin/testimonials/:id/edit',     auth, wrap(adminController.testimonialEdit));
app.post('/admin/testimonials/:id/update',  auth, wrap(adminController.testimonialUpdate));
app.post('/admin/testimonials/:id/delete',  auth, wrap(adminController.testimonialDelete));

// Admin – news
app.get('/admin/news',              auth, wrap(adminController.newsList));
app.get('/admin/news/new',          auth, wrap(adminController.newsNew));
app.post('/admin/news/create',      auth, wrap(adminController.newsCreate));
app.get('/admin/news/:id/edit',     auth, wrap(adminController.newsEdit));
app.post('/admin/news/:id/update',  auth, wrap(adminController.newsUpdate));
app.post('/admin/news/:id/delete',  auth, wrap(adminController.newsDelete));

// Admin – sermons
app.get('/admin/sermons',               auth, wrap(adminController.sermonsList));
app.get('/admin/sermons/new',           auth, wrap(adminController.sermonNew));
app.post('/admin/sermons/create',       auth, wrap(adminController.sermonCreate));
app.get('/admin/sermons/:id/edit',      auth, wrap(adminController.sermonEdit));
app.post('/admin/sermons/:id/update',   auth, wrap(adminController.sermonUpdate));
app.post('/admin/sermons/:id/delete',   auth, wrap(adminController.sermonDelete));

// Admin – ministries
app.get('/admin/ministries',              auth, wrap(adminController.ministriesList));
app.get('/admin/ministries/new',          auth, wrap(adminController.ministryNew));
app.post('/admin/ministries/create',      auth, wrap(adminController.ministryCreate));
app.get('/admin/ministries/:id/edit',     auth, wrap(adminController.ministryEdit));
app.post('/admin/ministries/:id/update',  auth, wrap(adminController.ministryUpdate));
app.post('/admin/ministries/:id/delete',  auth, wrap(adminController.ministryDelete));

// Admin – gallery
app.get('/admin/gallery',                 auth, wrap(adminController.galleryList));
app.post('/admin/gallery/create',         auth, wrap(adminController.galleryCreate));
app.post('/admin/gallery/:id/update',     auth, wrap(adminController.galleryUpdate));
app.post('/admin/gallery/:id/delete',     auth, wrap(adminController.galleryDelete));

// Admin – enquiry submissions
app.get('/admin/submissions',             auth, wrap(adminController.submissionsList));
app.get('/admin/submissions/export',      auth, wrap(adminController.submissionsExport));
app.post('/admin/submissions/:id/toggle', auth, wrap(adminController.submissionToggle));
app.post('/admin/submissions/:id/delete', auth, wrap(adminController.submissionDelete));

// Admin – home page content
app.get('/admin/content',         auth, wrap(adminController.contentEdit));
app.post('/admin/content/update', auth, wrap(adminController.contentUpdate));

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
    message: req.path.startsWith('/admin')
      ? `Admin action failed: ${err.message}`
      : 'Something went wrong. Please try again later.',
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
