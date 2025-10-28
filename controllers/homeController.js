// controllers/homeController.js
const fs = require('fs');
const path = require('path');

const events = [
  { name: "Year planning", date: "11-Jan" },
  { name: "Board meeting", date: "18-Jan" },
  { name: "Giving to the less privileged", date: "25-Jan" },
  { name: "Prayer and fasting", date: "2-Feb" },
  { name: "Communion service", date: "23-Feb" },
  { name: "Night prayer", date: "21-Feb" },
  { name: "Leadership training", date: "01-May" },
  { name: "Marriage seminar", date: "05-Apr" },
  { name: "Open air evangelism", date: "14-Jun" },
  { name: "Children’s conference", date: "21-Jun" },
  { name: "Ketekelo ea mosali ea khabane", date: "1-Aug" },
  { name: "Expedition Saturday Fun Walk from Sekubu", date: "30-Aug" },
  { name: "Rally for missions", date: "2-Nov" },
  { name: "Healing campaign & personal evangelism", date: "29-Nov" },
  { name: "Small business development training", date: "03-Dec" },
  { name: "Revival Speaker", date: "5-Dec" },
  { name: "Children’s dedication and baptism", date: "15-Dec" },
  { name: "Prison visits", date: "ad hoc" },
  { name: "Bible study", date: "Every Sunday" },
  { name: "Church service", date: "Every Sunday" },
  { name: "Intercession", date: "Every Sunday" },
  { name: "Wednesday prayer meeting (Needs modification)", date: "TBD" },
  { name: "Passover Conference", date: "17-Apr" },
];

const routineServices = [
  { 
    name: "Wednesday Prayer Meeting", 
    schedule: "Every Wednesday, 17:00 - 18:00",
    image: "prayer.jpg",
    contact: "Kelebone Lekunya - +266 6320 6940"
  },
  { 
    videoLink: "https://www.youtube.com/embed/wFws66W_Ftc?si=0ZHiZiXZBCDN7bwY"
  },
  { 
    name: "Sunday Service", 
    schedule: "Every Sunday, 10:00 - 13:00",
    image: "service.jpg",
    contact: "Church Office - +266 765 4321"
  },
];

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
    lastModified: document.lastModified || new Date().toLocaleString(),
    upcomingEvents,
    routineServices,
    activePage: 'home'
  });
};
