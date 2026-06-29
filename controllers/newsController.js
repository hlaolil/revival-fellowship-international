const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, '../data/news.json');

function loadNews() {
  try {
    return JSON.parse(fs.readFileSync(newsFile, 'utf8'));
  } catch {
    return [];
  }
}

exports.index = (req, res) => {
  const news = loadNews().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('news', {
    title: 'News & Announcements',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'news',
    news,
  });
};

exports.post = (req, res) => {
  const { slug } = req.params;
  const news = loadNews();
  const post = news.find(n => n.slug === slug);
  if (!post) {
    return res.status(404).render('404', {
      title: 'Article Not Found',
      currentYear: new Date().getFullYear(),
      lastModified: new Date().toLocaleString(),
      activePage: '',
    });
  }
  const related = news.filter(n => n.id !== post.id).slice(0, 3);
  res.render('news-post', {
    title: post.title,
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),
    activePage: 'news',
    post,
    related,
  });
};
