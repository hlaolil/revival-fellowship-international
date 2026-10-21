const crypto = require('crypto');
const { getDb, toObjectId, slugify, byDisplayOrder } = require('../lib/db');
const { getSettings, saveSettings } = require('../lib/settings');
const { describeRepeat, WEEKDAYS, ORDINALS } = require('../lib/events');
const { saveUpload, deleteUpload } = require('./mediaController');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rfi-admin-2026';
const SESSION_TTL_MS = 8 * 3600000;

// The session cookie holds an expiry plus an HMAC keyed by the admin password,
// so the password itself never leaves the server and changing it logs everyone out.
function sign(expires) {
  return crypto.createHmac('sha256', ADMIN_PASSWORD).update(`rfi-admin:${expires}`).digest('hex');
}

function makeToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  return `${expires}.${sign(expires)}`;
}

function validToken(token) {
  const [expires, sig] = String(token || '').split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Accepts a bare ID or any common YouTube URL form and returns the 11-char video ID
function parseVideoId(input) {
  const str = String(input || '').trim();
  const match = str.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : str;
}

function adminRender(res, view, data) {
  res.render(view, { currentYear: new Date().getFullYear(), lastModified: new Date().toLocaleString(), activePage: '', WEEKDAYS, ORDINALS, ...data });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

exports.login = (req, res) => adminRender(res, 'admin-login', { title: 'Admin Login', error: null });

// ── Login throttling ──────────────────────────────────────────────────────────
// Failed attempts are kept in MongoDB so the limit holds across serverless
// instances; an in-memory map is used if the database is unreachable.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60000;
const memoryAttempts = new Map();

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
}

async function recentFailures(ip) {
  const since = new Date(Date.now() - LOCKOUT_MS);
  try {
    const db = await getDb();
    return await db.collection('login_attempts').countDocuments({ ip, at: { $gte: since } });
  } catch {
    return (memoryAttempts.get(ip) || []).filter(t => t >= since).length;
  }
}

async function recordFailure(ip) {
  try {
    const db = await getDb();
    await db.collection('login_attempts').insertOne({ ip, at: new Date() });
  } catch {
    memoryAttempts.set(ip, [...(memoryAttempts.get(ip) || []), new Date()].slice(-MAX_ATTEMPTS));
  }
}

async function clearFailures(ip) {
  memoryAttempts.delete(ip);
  try {
    const db = await getDb();
    await db.collection('login_attempts').deleteMany({ ip });
  } catch { /* nothing to clear */ }
}

exports.doLogin = async (req, res) => {
  const ip = clientIp(req);
  if (await recentFailures(ip) >= MAX_ATTEMPTS) {
    return res.status(429).render('admin-login', { title: 'Admin Login', currentYear: new Date().getFullYear(), activePage: '', error: 'Too many failed attempts. Please wait 15 minutes and try again.' });
  }
  if (safeEqual(req.body.password || '', ADMIN_PASSWORD)) {
    await clearFailures(ip);
    res.cookie('rfi_admin', makeToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: Boolean(process.env.VERCEL || process.env.RENDER),
      maxAge: SESSION_TTL_MS,
    });
    return res.redirect('/admin/dashboard');
  }
  await recordFailure(ip);
  adminRender(res, 'admin-login', { title: 'Admin Login', error: 'Incorrect password. Please try again.' });
};

exports.requireAuth = (req, res, next) => {
  if (validToken(req.cookies?.rfi_admin)) return next();
  res.redirect('/admin');
};

exports.logout = (req, res) => {
  res.clearCookie('rfi_admin');
  res.redirect('/admin');
};

// Deletes a previously uploaded photo once a record points at a different image
async function removeReplacedUpload(collection, id, field, newSrc) {
  const db = await getDb();
  const old = await db.collection(collection).findOne({ _id: id });
  if (old && old[field] !== newSrc) await deleteUpload(old[field]);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.dashboard = async (req, res) => {
  let submissions = [], dbError = null, counts = {};
  try {
    const db = await getDb();
    const names = ['submissions', 'events', 'news', 'testimonials', 'sermons', 'ministries', 'gallery'];
    const [latest, newCount, ...totals] = await Promise.all([
      db.collection('submissions').find({}).sort({ submittedAt: -1 }).limit(10).toArray(),
      db.collection('submissions').countDocuments({ status: { $ne: 'handled' } }),
      ...names.map(n => db.collection(n).countDocuments()),
    ]);
    submissions = latest;
    names.forEach((n, i) => { counts[n] = totals[i]; });
    counts.newSubmissions = newCount;
  } catch (err) { dbError = err.message; }

  adminRender(res, 'admin-dashboard', {
    title: 'Dashboard', currentSection: 'dashboard',
    submissions, dbError, counts,
  });
};

// ── Events ────────────────────────────────────────────────────────────────────

exports.eventsList = async (req, res) => {
  const db = await getDb();
  const events = await db.collection('events').find({}).sort({ date: 1 }).toArray();
  adminRender(res, 'admin-events', { title: 'Manage Events', currentSection: 'events', events, describeRepeat });
};

exports.eventNew = (req, res) =>
  adminRender(res, 'admin-event-form', { title: 'New Event', currentSection: 'events', event: null, error: null });

function eventFromBody(body) {
  const data = { name: (body.name || '').trim(), date: (body.date || '').trim(), category: body.category || 'special', time: body.time || '' };
  if (body.repeat === 'monthly') {
    Object.assign(data, { repeat: 'monthly', nth: parseInt(body.nth, 10) || 1, weekday: parseInt(body.weekday, 10) || 0, until: body.until || '' });
  } else {
    Object.assign(data, { repeat: '', nth: null, weekday: null, until: '' });
  }
  return data;
}

function eventError(data) {
  if (!data.name || !data.date) return 'Name and date are required.';
  if (data.repeat === 'monthly' && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return 'Monthly events need a start date in YYYY-MM-DD format.';
  return null;
}

exports.eventCreate = async (req, res) => {
  const data = eventFromBody(req.body);
  const error = eventError(data);
  if (error) return adminRender(res, 'admin-event-form', { title: 'New Event', currentSection: 'events', event: data, error });
  const db = await getDb();
  await db.collection('events').insertOne(data);
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
  const data = eventFromBody(req.body);
  const error = eventError(data);
  if (error) return adminRender(res, 'admin-event-form', { title: 'Edit Event', currentSection: 'events', event: { _id: id, ...data }, error });
  const db = await getDb();
  await db.collection('events').updateOne({ _id: id }, { $set: data });
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
  const { title, date, author, category, excerpt, content, featured } = req.body;
  const image = (await saveUpload(req.body.imageUpload)) || req.body.image;
  if (!title || !content) return adminRender(res, 'admin-news-form', { title: 'New Article', currentSection: 'news', article: { ...req.body, image }, error: 'Title and content are required.' });
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
  const { title, date, author, category, excerpt, content, featured } = req.body;
  const image = (await saveUpload(req.body.imageUpload)) || req.body.image;
  if (!title || !content) {
    const db = await getDb();
    const article = await db.collection('news').findOne({ _id: id });
    return adminRender(res, 'admin-news-form', { title: 'Edit Article', currentSection: 'news', article: { ...article, ...req.body, image }, error: 'Title and content are required.' });
  }
  const db = await getDb();
  await removeReplacedUpload('news', id, 'image', image || 'service.jpg');
  await db.collection('news').updateOne({ _id: id }, { $set: { title, slug: slugify(title), date, author, category, excerpt, content, image: image || 'service.jpg', featured: featured === 'on' } });
  res.redirect('/admin/news');
};

exports.newsDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) {
    const db = await getDb();
    const article = await db.collection('news').findOne({ _id: id });
    await db.collection('news').deleteOne({ _id: id });
    if (article) await deleteUpload(article.image);
  }
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
  const { title, date, speaker, series, description, featured } = req.body;
  const videoId = parseVideoId(req.body.videoId);
  if (!title || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return adminRender(res, 'admin-sermon-form', { title: 'New Sermon', currentSection: 'sermons', sermon: req.body, error: 'Title and a valid YouTube link are required.' });
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
  const { title, date, speaker, series, description, featured } = req.body;
  const videoId = parseVideoId(req.body.videoId);
  if (!title || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    const db = await getDb();
    const sermon = await db.collection('sermons').findOne({ _id: id });
    return adminRender(res, 'admin-sermon-form', { title: 'Edit Sermon', currentSection: 'sermons', sermon: { ...sermon, ...req.body }, error: 'Title and a valid YouTube link are required.' });
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

// ── Ministries ────────────────────────────────────────────────────────────────

function ministryFromBody(body) {
  return {
    name: (body.name || '').trim(),
    schedule: body.schedule || '',
    contact: body.contact || '',
    description: body.description || '',
    details: body.details || '',
    image: body.image || '',
    order: parseInt(body.order, 10) || 0,
  };
}

exports.ministriesList = async (req, res) => {
  const db = await getDb();
  const ministries = (await db.collection('ministries').find({}).sort({ _id: 1 }).toArray()).sort(byDisplayOrder);
  adminRender(res, 'admin-ministries', { title: 'Manage Ministries', currentSection: 'ministries', ministries });
};

exports.ministryNew = (req, res) =>
  adminRender(res, 'admin-ministry-form', { title: 'New Ministry', currentSection: 'ministries', ministry: null, error: null });

exports.ministryCreate = async (req, res) => {
  const data = ministryFromBody(req.body);
  data.image = (await saveUpload(req.body.imageUpload)) || data.image;
  if (!data.name) return adminRender(res, 'admin-ministry-form', { title: 'New Ministry', currentSection: 'ministries', ministry: data, error: 'Ministry name is required.' });
  const db = await getDb();
  await db.collection('ministries').insertOne(data);
  res.redirect('/admin/ministries');
};

exports.ministryEdit = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/ministries');
  const db = await getDb();
  const ministry = await db.collection('ministries').findOne({ _id: id });
  if (!ministry) return res.redirect('/admin/ministries');
  adminRender(res, 'admin-ministry-form', { title: 'Edit Ministry', currentSection: 'ministries', ministry, error: null });
};

exports.ministryUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (!id) return res.redirect('/admin/ministries');
  const data = ministryFromBody(req.body);
  data.image = (await saveUpload(req.body.imageUpload)) || data.image;
  if (!data.name) return adminRender(res, 'admin-ministry-form', { title: 'Edit Ministry', currentSection: 'ministries', ministry: { _id: id, ...data }, error: 'Ministry name is required.' });
  const db = await getDb();
  await removeReplacedUpload('ministries', id, 'image', data.image);
  await db.collection('ministries').updateOne({ _id: id }, { $set: data });
  res.redirect('/admin/ministries');
};

exports.ministryDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) {
    const db = await getDb();
    const ministry = await db.collection('ministries').findOne({ _id: id });
    await db.collection('ministries').deleteOne({ _id: id });
    if (ministry) await deleteUpload(ministry.image);
  }
  res.redirect('/admin/ministries');
};

// ── Gallery ───────────────────────────────────────────────────────────────────

exports.galleryList = async (req, res) => {
  const db = await getDb();
  const photos = await db.collection('gallery').find({}).sort({ _id: -1 }).toArray();
  adminRender(res, 'admin-gallery', { title: 'Manage Gallery', currentSection: 'gallery', photos, error: null });
};

exports.galleryCreate = async (req, res) => {
  const src = (await saveUpload(req.body.srcUpload)) || (req.body.src || '').trim();
  const caption = (req.body.caption || '').trim();
  const category = (req.body.category || '').trim() || 'Community';
  const db = await getDb();
  if (!src || !caption) {
    const photos = await db.collection('gallery').find({}).sort({ _id: -1 }).toArray();
    return adminRender(res, 'admin-gallery', { title: 'Manage Gallery', currentSection: 'gallery', photos, error: 'Image and caption are required.' });
  }
  await db.collection('gallery').insertOne({ src, caption, category });
  res.redirect('/admin/gallery');
};

exports.galleryUpdate = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id && req.body.caption) {
    const db = await getDb();
    await db.collection('gallery').updateOne({ _id: id }, { $set: { caption: req.body.caption.trim(), category: (req.body.category || '').trim() || 'Community' } });
  }
  res.redirect('/admin/gallery');
};

exports.galleryDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) {
    const db = await getDb();
    const photo = await db.collection('gallery').findOne({ _id: id });
    await db.collection('gallery').deleteOne({ _id: id });
    if (photo) await deleteUpload(photo.src);
  }
  res.redirect('/admin/gallery');
};

// ── Submissions ───────────────────────────────────────────────────────────────

exports.submissionsList = async (req, res) => {
  const filter = {};
  const { type, status } = req.query;
  if (type) filter.enquiryType = type;
  if (status === 'new') filter.status = { $ne: 'handled' };
  if (status === 'handled') filter.status = 'handled';
  const db = await getDb();
  const submissions = await db.collection('submissions').find(filter).sort({ submittedAt: -1 }).limit(500).toArray();
  adminRender(res, 'admin-submissions', { title: 'Enquiries', currentSection: 'submissions', submissions, type: type || '', status: status || '' });
};

exports.submissionToggle = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) {
    const db = await getDb();
    const sub = await db.collection('submissions').findOne({ _id: id });
    if (sub) await db.collection('submissions').updateOne({ _id: id }, { $set: { status: sub.status === 'handled' ? 'new' : 'handled' } });
  }
  res.redirect(req.get('Referer') || '/admin/submissions');
};

exports.submissionDelete = async (req, res) => {
  const id = toObjectId(req.params.id);
  if (id) { const db = await getDb(); await db.collection('submissions').deleteOne({ _id: id }); }
  res.redirect(req.get('Referer') || '/admin/submissions');
};

exports.submissionsExport = async (req, res) => {
  const db = await getDb();
  const rows = await db.collection('submissions').find({}).sort({ submittedAt: -1 }).toArray();
  const cols = ['firstName', 'lastName', 'email', 'phone', 'enquiryType', 'message', 'status', 'submittedAt'];
  const esc = v => {
    let str = v instanceof Date ? v.toISOString() : String(v ?? '');
    if (/^[=+\-@]/.test(str)) str = "'" + str; // neutralise spreadsheet formulas
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
  res.attachment(`rfi-enquiries-${new Date().toISOString().split('T')[0]}.csv`).type('text/csv').send(csv);
};

// ── Site Settings ─────────────────────────────────────────────────────────────

exports.settingsEdit = async (req, res) => {
  const settings = await getSettings();
  adminRender(res, 'admin-settings', { title: 'Site Settings', currentSection: 'settings', settings, success: null, error: null });
};

exports.settingsUpdate = async (req, res) => {
  try {
    const settings = await saveSettings(req.body);
    res.locals.site = settings;
    adminRender(res, 'admin-settings', { title: 'Site Settings', currentSection: 'settings', settings, success: 'Settings saved.', error: null });
  } catch (err) {
    adminRender(res, 'admin-settings', { title: 'Site Settings', currentSection: 'settings', settings: req.body, success: null, error: 'Failed to save: ' + err.message });
  }
};
