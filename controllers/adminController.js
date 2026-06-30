const { getDb, toObjectId } = require('../lib/db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rfi-admin-2026';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function adminRender(res, view, data) {
  res.render(view, { currentYear: new Date().getFullYear(), lastModified: new Date().toLocaleString(), activePage: '', ...data });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

exports.login = (req, res) => adminRender(res, 'admin-login', { title: 'Admin Login', error: null });

exports.doLogin = (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.cookie('rfi_admin', ADMIN_PASSWORD, { httpOnly: true, maxAge: 3600000 });
    return res.redirect('/admin/dashboard');
  }
  adminRender(res, 'admin-login', { title: 'Admin Login', error: 'Incorrect password. Please try again.' });
};

exports.requireAuth = (req, res, next) => {
  if (req.cookies?.rfi_admin === ADMIN_PASSWORD) return next();
  res.redirect('/admin');
};

exports.logout = (req, res) => {
  res.clearCookie('rfi_admin');
  res.redirect('/admin');
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.dashboard = async (req, res) => {
  let submissions = [], dbError = null, eventsCount = 0, newsCount = 0, testimonialsCount = 0, sermonsCount = 0;
  try {
    const db = await getDb();
    [submissions, eventsCount, newsCount, testimonialsCount, sermonsCount] = await Promise.all([
      db.collection('submissions').find({}).sort({ submittedAt: -1 }).limit(50).toArray(),
      db.collection('events').countDocuments(),
      db.collection('news').countDocuments(),
      db.collection('testimonials').countDocuments(),
      db.collection('sermons').countDocuments(),
    ]);
  } catch (err) { dbError = err.message; }

  adminRender(res, 'admin-dashboard', {
    title: 'Dashboard', currentSection: 'dashboard',
    submissions, dbError, eventsCount, newsCount, testimonialsCount, sermonsCount,
  });
};

// ── Events ────────────────────────────────────────────────────────────────────

exports.eventsList = async (req, res) => {
  const db = await getDb();
  const events = await db.collection('events').find({}).sort({ date: 1 }).toArray();
  adminRender(res, 'admin-events', { title: 'Manage Events', currentSection: 'events', events });
};

exports.eventNew = (req, res) =>
  adminRender(res, 'admin-event-form', { title: 'New Event', currentSection: 'events', event: null, error: null });

exports.eventCreate = async (req, res) => {
  const { name, date, category, time } = req.body;
  if (!name || !date) return adminRender(res, 'admin-event-form', { title: 'New Event', currentSection: 'events', event: req.body, error: 'Name and date are required.' });
  const db = await getDb();
  await db.collection('events').insertOne({ name, date, category: category || 'special', time: time || '' });
  res.redirect('/admin/events');
};

exports.eventEdit = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/events');
  const db = await getDb();
  const event = await db.collection('events').findOne({ _id: id });
  if (!event) return res.redirect('/admin/events');
  adminRender(res, 'admin-event-form', { title: 'Edit Event', currentSection: 'events', event, error: null });
};

exports.eventUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/events');
  const { name, date, category, time } = req.body;
  if (!name || !date) {
    const db = await getDb();
    const event = await db.collection('events').findOne({ _id: id });
    return adminRender(res, 'admin-event-form', { title: 'Edit Event', currentSection: 'events', event: { ...event, ...req.body }, error: 'Name and date are required.' });
  }
  const db = await getDb();
  await db.collection('events').updateOne({ _id: id }, { $set: { name, date, category: category || 'special', time: time || '' } });
  res.redirect('/admin/events');
};

exports.eventDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) { const db = await getDb(); await db.collection('events').deleteOne({ _id: id }); }
  res.redirect('/admin/events');
};

// ── Testimonials ──────────────────────────────────────────────────────────────

exports.testimonialsList = async (req, res) => {
  const db = await getDb();
  const testimonials = await db.collection('testimonials').find({}).toArray();
  adminRender(res, 'admin-testimonials', { title: 'Manage Testimonials', currentSection: 'testimonials', testimonials });
};

exports.testimonialNew = (req, res) =>
  adminRender(res, 'admin-testimonial-form', { title: 'New Testimonial', currentSection: 'testimonials', testimonial: null, error: null });

exports.testimonialCreate = async (req, res) => {
  const { name, role, text } = req.body;
  if (!name || !text) return adminRender(res, 'admin-testimonial-form', { title: 'New Testimonial', currentSection: 'testimonials', testimonial: req.body, error: 'Name and testimonial text are required.' });
  const db = await getDb();
  await db.collection('testimonials').insertOne({ name, role: role || '', text, image: null });
  res.redirect('/admin/testimonials');
};

exports.testimonialEdit = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/testimonials');
  const db = await getDb();
  const testimonial = await db.collection('testimonials').findOne({ _id: id });
  if (!testimonial) return res.redirect('/admin/testimonials');
  adminRender(res, 'admin-testimonial-form', { title: 'Edit Testimonial', currentSection: 'testimonials', testimonial, error: null });
};

exports.testimonialUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/testimonials');
  const { name, role, text } = req.body;
  if (!name || !text) {
    const db = await getDb();
    const testimonial = await db.collection('testimonials').findOne({ _id: id });
    return adminRender(res, 'admin-testimonial-form', { title: 'Edit Testimonial', currentSection: 'testimonials', testimonial: { ...testimonial, ...req.body }, error: 'Name and testimonial text are required.' });
  }
  const db = await getDb();
  await db.collection('testimonials').updateOne({ _id: id }, { $set: { name, role: role || '', text } });
  res.redirect('/admin/testimonials');
};

exports.testimonialDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) { const db = await getDb(); await db.collection('testimonials').deleteOne({ _id: id }); }
  res.redirect('/admin/testimonials');
};

// ── News ──────────────────────────────────────────────────────────────────────

exports.newsList = async (req, res) => {
  const db = await getDb();
  const news = await db.collection('news').find({}).sort({ date: -1 }).toArray();
  adminRender(res, 'admin-news', { title: 'Manage News', currentSection: 'news', news });
};

exports.newsNew = (req, res) =>
  adminRender(res, 'admin-news-form', { title: 'New Article', currentSection: 'news', article: null, error: null });

exports.newsCreate = async (req, res) => {
  const { title, date, author, category, excerpt, content, image, featured } = req.body;
  if (!title || !content) return adminRender(res, 'admin-news-form', { title: 'New Article', currentSection: 'news', article: req.body, error: 'Title and content are required.' });
  const db = await getDb();
  const slug = slugify(title);
  await db.collection('news').insertOne({ title, slug, date: date || new Date().toISOString().split('T')[0], author: author || 'RFI Leadership', category: category || 'Announcement', excerpt: excerpt || '', content, image: image || 'service.jpg', featured: featured === 'on' });
  res.redirect('/admin/news');
};

exports.newsEdit = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/news');
  const db = await getDb();
  const article = await db.collection('news').findOne({ _id: id });
  if (!article) return res.redirect('/admin/news');
  adminRender(res, 'admin-news-form', { title: 'Edit Article', currentSection: 'news', article, error: null });
};

exports.newsUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/news');
  const { title, date, author, category, excerpt, content, image, featured } = req.body;
  if (!title || !content) {
    const db = await getDb();
    const article = await db.collection('news').findOne({ _id: id });
    return adminRender(res, 'admin-news-form', { title: 'Edit Article', currentSection: 'news', article: { ...article, ...req.body }, error: 'Title and content are required.' });
  }
  const db = await getDb();
  await db.collection('news').updateOne({ _id: id }, { $set: { title, slug: slugify(title), date, author, category, excerpt, content, image: image || 'service.jpg', featured: featured === 'on' } });
  res.redirect('/admin/news');
};

exports.newsDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) { const db = await getDb(); await db.collection('news').deleteOne({ _id: id }); }
  res.redirect('/admin/news');
};

// ── Sermons ───────────────────────────────────────────────────────────────────

exports.sermonsList = async (req, res) => {
  const db = await getDb();
  const sermons = await db.collection('sermons').find({}).sort({ date: -1 }).toArray();
  adminRender(res, 'admin-sermons', { title: 'Manage Sermons', currentSection: 'sermons', sermons });
};

exports.sermonNew = (req, res) =>
  adminRender(res, 'admin-sermon-form', { title: 'New Sermon', currentSection: 'sermons', sermon: null, error: null });

exports.sermonCreate = async (req, res) => {
  const { title, date, speaker, series, videoId, description, featured } = req.body;
  if (!title || !videoId) return adminRender(res, 'admin-sermon-form', { title: 'New Sermon', currentSection: 'sermons', sermon: req.body, error: 'Title and YouTube Video ID are required.' });
  const db = await getDb();
  await db.collection('sermons').insertOne({ title, date: date || new Date().toISOString().split('T')[0], speaker: speaker || 'RFI Pastorate', series: series || '', videoId, description: description || '', featured: featured === 'on' });
  res.redirect('/admin/sermons');
};

exports.sermonEdit = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/sermons');
  const db = await getDb();
  const sermon = await db.collection('sermons').findOne({ _id: id });
  if (!sermon) return res.redirect('/admin/sermons');
  adminRender(res, 'admin-sermon-form', { title: 'Edit Sermon', currentSection: 'sermons', sermon, error: null });
};

exports.sermonUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/sermons');
  const { title, date, speaker, series, videoId, description, featured } = req.body;
  if (!title || !videoId) {
    const db = await getDb();
    const sermon = await db.collection('sermons').findOne({ _id: id });
    return adminRender(res, 'admin-sermon-form', { title: 'Edit Sermon', currentSection: 'sermons', sermon: { ...sermon, ...req.body }, error: 'Title and YouTube Video ID are required.' });
  }
  const db = await getDb();
  await db.collection('sermons').updateOne({ _id: id }, { $set: { title, date, speaker, series, videoId, description, featured: featured === 'on' } });
  res.redirect('/admin/sermons');
};

exports.sermonDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) { const db = await getDb(); await db.collection('sermons').deleteOne({ _id: id }); }
  res.redirect('/admin/sermons');
};

// ── Site Content (Home Page) ──────────────────────────────────────────────────

exports.contentEdit = async (req, res) => {
  let content = {};
  try {
    const db = await getDb();
    content = await db.collection('site_content').findOne({ key: 'home' }) || {};
  } catch (err) {
    console.error('Failed to load site content:', err.message);
  }
  adminRender(res, 'admin-content', { title: 'Home Page Content', currentSection: 'content', content, success: null, error: null });
};

exports.contentUpdate = async (req, res) => {
  const {
    heroTagline,
    announcementEnabled, announcementText, announcementLink, announcementLinkText,
    scriptureEnabled, scriptureVerse, scriptureReference,
    pastorMessageEnabled, pastorMessageTitle, pastorMessageText, pastorMessageAuthor,
  } = req.body;

  const data = {
    heroTagline: heroTagline || '',
    announcementEnabled: announcementEnabled === 'on',
    announcementText: announcementText || '',
    announcementLink: announcementLink || '',
    announcementLinkText: announcementLinkText || 'Learn more',
    scriptureEnabled: scriptureEnabled === 'on',
    scriptureVerse: scriptureVerse || '',
    scriptureReference: scriptureReference || '',
    pastorMessageEnabled: pastorMessageEnabled === 'on',
    pastorMessageTitle: pastorMessageTitle || 'A Word from the Pastor',
    pastorMessageText: pastorMessageText || '',
    pastorMessageAuthor: pastorMessageAuthor || 'RFI Leadership',
  };

  try {
    const db = await getDb();
    await db.collection('site_content').updateOne({ key: 'home' }, { $set: data }, { upsert: true });
    adminRender(res, 'admin-content', { title: 'Home Page Content', currentSection: 'content', content: { key: 'home', ...data }, success: 'Home page content updated successfully.', error: null });
  } catch (err) {
    adminRender(res, 'admin-content', { title: 'Home Page Content', currentSection: 'content', content: { key: 'home', ...data }, success: null, error: 'Failed to save: ' + err.message });
  }
};
