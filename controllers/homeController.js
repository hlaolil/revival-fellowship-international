// controllers/homeController.js
const fs = require('fs');
const path = require('path');
const events = [
  // Regular/Recurring services
  { name: "Sunday Services", date: "Every Sunday" },
  { name: "Wednesday Service", date: "Every Wednesday at 20:30" },

  // Prayer & Board Meetings (2026 dates)
  { name: "Night Prayer & Board Meeting", date: "27-Feb-2026" },
  { name: "Night Prayer & Board Meeting", date: "24-Apr-2026" },
  { name: "Night Prayer & Board Meeting", date: "07-Aug-2026" },
  { name: "Night Prayer & Board Meeting", date: "02-Oct-2026" },

  // Fasting Sundays (2026 dates)
  { name: "Fasting Sunday", date: "04-Jan-2026" },
  { name: "Fasting Sunday", date: "01-Feb-2026" },
  { name: "Fasting Sunday", date: "01-Mar-2026" },
  { name: "Fasting Sunday", date: "03-May-2026" },
  { name: "Fasting Sunday", date: "07-Jun-2026" },
  { name: "Fasting Sunday", date: "05-Jul-2026" },
  { name: "Fasting Sunday", date: "02-Aug-2026" },
  { name: "Fasting Sunday", date: "06-Sep-2026" },
  { name: "Fasting Sunday", date: "04-Oct-2026" },
  { name: "Fasting Sunday", date: "01-Nov-2026" },
  { name: "Fasting Sunday", date: "06-Dec-2026" },

  // Leadership Training (2026 dates)
  { name: "Leadership Training", date: "11-Mar-2026" },
  { name: "Leadership Training", date: "25-May-2026" },
  { name: "Leadership Training", date: "17-Jul-2026" },
  { name: "Leadership Training", date: "05-Oct-2026" },

  // Special / One-time events (2026 unless noted)
  { name: "Giving to the Less Privileged", date: "Ad hoc" },
  { name: "Holy Communion", date: "Ad hoc" },
  { name: "Marriage Seminar", date: "27-Jun-2026" },
  { name: "Children’s Dedication", date: "20-Jun-2026" },
  { name: "Mosali ea Khabane", date: "09-Aug-2026" },
  { name: "Prison Visits (Bo-mme)", date: "Every quarter" },
  { name: "Hospital Visits (Bacha)", date: "Bi-annually" },
  { name: "Expedition Khukhune", date: "29-Aug-2026" },
  { name: "Rally", date: "01-Nov-2026" },
  { name: "Crusade", date: "04-Dec-2026" },  // Assuming 2026 based on document context
  { name: "Joint Service with Khukhune", date: "29-Mar-2026" },
  { name: "Joint Service with Khukhune", date: "25-Oct-2026" }
];
const routineServices = [
  {
    name: "Wednesday Prayer Meeting",
    schedule: "Every Wednesday, 17:00 - 18:00",
    image: "prayer.jpg",
    contact: "Kelebone Lekunya +266 6320 6940"
  },
  {
    videoLink: "https://www.youtube.com/shorts/5VWxxSnWsR4?feature=share"
  },
  {
    name: "Sunday Service",
    schedule: "Every Sunday, 10:00 - 13:00",
    image: "service.jpg",
    contact: "59193208"
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
    lastModified: new Date().toLocaleString(),  // ✅ FIXED: Server-side date
    upcomingEvents,
    routineServices,
    activePage: 'home'
  });
};
