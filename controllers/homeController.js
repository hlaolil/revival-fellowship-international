// controllers/homeController.js
const fs = require('fs');
const path = require('path');

exports.index = (req, res) => {
  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);

  function parseEventDate(eventDate) {
    const [day, month] = eventDate.split("-");
    const year = today.getFullYear();
    return new Date(`${month} ${day}, ${year}`);
  }

  const upcomingEvents = events
    .filter(event => {
      if (event.date === "ad hoc" || event.date === "Every Sunday" || event.date === "TBD") {
        return false;
      }
      const eventDate = parseEventDate(event.date);
      return eventDate >= today && eventDate <= threeMonthsLater;
    })
    .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));

  res.render('index', {
    title: 'RFI Home Page',
    currentYear: new Date().getFullYear(),
    lastModified: new Date().toLocaleString(),  // ✅ FIXED: Server-side date
    activePage: 'home'
  });
};
