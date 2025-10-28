// app.js - Main server file
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Controllers
const homeController = require('./controllers/homeController');
const aboutController = require('./controllers/aboutController');
const ministriesController = require('./controllers/ministriesController');
const joinController = require('./controllers/joinController');
const joinController = require('./controllers/joinController');   // <-- ADD THIS

// Routes
app.get('/', homeController.index);
app.get('/about', aboutController.index);
app.get('/ministries', ministriesController.index);
app.get('/join', joinController.index);
app.post('/join', joinController.submit);
app.get('/thankyou', joinController.thankyou);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
