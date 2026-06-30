const { getDb } = require('../lib/db');
const fs = require('fs');
const path = require('path');

function fallback() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/news.json'), 'utf8')); } catch { return []; }
}

exports.index = async (req, res) => {
  let news = [];
  try {
    const db = await getDb();
    news = await db.collection('news').find({}).sort({ date: -1 }).toArray();
  } catch { news = fallback().sort((a, b) => new Date(b.date) - new Date(a.date)); }

  res.render('news', {
    title: 'News & Announcements',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'news',
    news,
  });
};

exports.post = async (req, res) => {
  const { slug } = req.params;
  let post = null, related = [];
  try {
    const db = await getDb();
    post = await db.collection('news').findOne({ slug });
    if (post) {
      related = await db.collection('news')
        .find({ slug: { $ne: slug } })
        .sort({ date: -1 })
        .limit(3)
        .toArray();
    }
  } catch {
    const all = fallback();
    post = all.find(n => n.slug === slug) || null;
    related = all.filter(n => n.slug !== slug).slice(0, 3);
  }

  if (!post) {
    return res.status(404).render('404', {
      title: 'Article Not Found',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
    });
  }
  res.render('news-post', {
    title: post.title,
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'news',
    post,
    related,
  });
};
