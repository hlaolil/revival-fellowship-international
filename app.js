// app.js
const express = require('express');
const path = require('path');

const app = express();

// Import Controllers
const homeController = require('./controllers/homeController');
const aboutController = require('./controllers/aboutController');
const ministriesController = require('./controllers/ministriesController');
const joinController = require('./controllers/joinController'); // ← now safe

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // for form data

// Routes
app.get('/', homeController.index);
app.get('/about', aboutController.index);
app.get('/ministries', ministriesController.index);
app.get('/join', joinController.index);
app.post('/join', joinController.submit);

// 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    currentYear: new Date().getFullYear()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
