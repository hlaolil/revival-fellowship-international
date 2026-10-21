const { getDb, loadJSON, slugify } = require('../lib/db');
const { getSettings } = require('../lib/settings');

function baseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
}

exports.robots = (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\n\nSitemap: ${baseUrl(req)}/sitemap.xml\n`);
};

exports.sitemap = async (req, res) => {
  let news = [], ministries = [];
  try {
    const db = await getDb();
    [news, ministries] = await Promise.all([
      db.collection('news').find({}, { projection: { slug: 1 } }).toArray(),
      db.collection('ministries').find({}, { projection: { name: 1 } }).toArray(),
    ]);
  } catch {
    news = loadJSON('news.json');
    ministries = loadJSON('ministries.json');
  }

  const base = baseUrl(req);
  const site = await getSettings();
  const paths = [
    '/', '/visit', '/about', '/ministries', '/events', '/sermons', '/news', '/gallery', '/join',
    ...(site.givingEnabled ? ['/give'] : []),
    ...ministries.map(m => `/ministries/${slugify(m.name)}`),
    ...news.filter(n => n.slug).map(n => `/news/${n.slug}`),
  ];
  const urls = paths.map(p => `  <url><loc>${base}${p}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
};
