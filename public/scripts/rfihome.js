const hamButton = document.querySelector('.ham-button');
const navigation = document.querySelector('.navigation');

// Initial HTML content for the hamburger icon
const hamburgerHTML = `
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        `;

// Close icon HTML
const closeIconHTML = '✖';

// Track the state of the menu
let isMenuOpen = false;

hamButton.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen; // Toggle the menu state

     if (isMenuOpen) {
        hamButton.innerHTML = closeIconHTML; // Change to close icon
        navigation.classList.add('show'); // Show the navigation
        hamButton.setAttribute('aria-expanded', 'true'); // Update ARIA attribute
    } else {
        hamButton.innerHTML = hamburgerHTML; // Change back to hamburger icon
        navigation.classList.remove('show'); // Hide the navigation
        hamButton.setAttribute('aria-expanded', 'false'); // Update ARIA attribute
    }
});


const year = document.querySelector("#currentyear");
const lastModified = document.querySelector("#lastModified");

// Get the current year for footer
const date = new Date();
year.textContent = date.getFullYear();

// Get the last modification date of the home page
let lastMod = document.lastModified;
lastModified.textContent = `Last Modified: ${lastMod}`;

document.addEventListener("DOMContentLoaded", () => {
    const eventsDiv = document.querySelector(".events");
  
    if (eventsDiv) {
      const eventsList = document.createElement("ul");
      eventsList.classList.add("events-list");
  
      // Define events with names and dates
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
        { name: "Revival", date: "5-Dec" },
        { name: "Children’s dedication and baptism", date: "15-Dec" },
        { name: "Prison visits", date: "ad hoc" },
        { name: "Bible study", date: "Every Sunday" },
        { name: "Church service", date: "Every Sunday" },
        { name: "Intercession", date: "Every Sunday" },
        { name: "Wednesday prayer meeting (Needs modification)", date: "TBD" },
        { name: "Passover Conference", date: "17-Apr" },
      ];
  
      // Get today's date
      const today = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(today.getMonth() + 3);
  
      // Function to convert "dd-MMM" format to a Date object
      function parseEventDate(eventDate) {
        const [day, month] = eventDate.split("-");
        const year = today.getFullYear();
        return new Date(`${month} ${day}, ${year}`);
      }
  
      // Filter events within the next 3 months and sort them by date
      const upcomingEvents = events
        .filter(event => {
          if (event.date === "ad hoc" || event.date === "Every Sunday" || event.date === "TBD") {
            return false;
          }
  
          const eventDate = parseEventDate(event.date);
          return eventDate >= today && eventDate <= threeMonthsLater;
        })
        .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date)); // Sort by date
  
      // Use DocumentFragment for performance
      const fragment = document.createDocumentFragment();
  
      upcomingEvents.forEach(event => {
        const listItem = document.createElement("li");
        listItem.textContent = `${event.name} - ${event.date}`;
        fragment.appendChild(listItem);
      });
  
      eventsList.appendChild(fragment);
      eventsDiv.appendChild(eventsList);
    } else {
      console.error("The '.events' div was not found.");
    }
  });

document.addEventListener('DOMContentLoaded', function () {
    let currentLocation = window.location.pathname;

    // Normalize by ensuring it doesn't end with a trailing slash unless it's root
    if (currentLocation.length > 1) {
        currentLocation = currentLocation.replace(/\/$/, '');
    }

    // Treat root `/` as `/index.html` (modify if your home page has a different file name)
    if (currentLocation === '/') {
        currentLocation = '/index.html';
    }

    const navLinks = document.querySelectorAll('nav ul li a'); // Select all nav links

    navLinks.forEach(link => {
        const linkPath = new URL(link.getAttribute('href'), window.location.origin).pathname;

        // Normalize the link path
        if (linkPath.length > 1) {
            linkPath = linkPath.replace(/\/$/, '');
        }

        // Add active class to the matching link
        if (linkPath === currentLocation) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    displaySpotlight(); // Load spotlight section
});

// Function to display the spotlight (Routine Services)
function displaySpotlight() {
    const spotlightSection = document.querySelector(".spotlight"); // Select the spotlight section

    if (spotlightSection) {
        // Define routine services (Spotlighted section)
        const routineServices = [
            { 
                name: "Wednesday Prayer Meeting", 
                schedule: "Every Wednesday, 17:00 - 18:00",
                image: "prayer.jpg",
                contact: "Kelebone Lekunya - +266 6320 6940"
            },

            { 
                
                videoLink: "https://www.youtube.com/embed/wFws66W_Ftc?si=0ZHiZiXZBCDN7bwY" // Use the embedded video link
            },
            { 
                name: "Sunday Service", 
                schedule: "Every Sunday, 10:00 - 13:00",
                image: "service.jpg",
                contact: "Church Office - +266 5919 3208"
            },
        ];

        // Use a DocumentFragment for performance
        const fragment = document.createDocumentFragment();

        // Generate spotlight cards for routine services
        routineServices.forEach(service => {
            const serviceCard = document.createElement("div");
            serviceCard.classList.add("spotlight-card"); // Add class for styling

            // If the service has a video link, embed the video
            if (service.videoLink) {
                serviceCard.innerHTML = `
                    
                    <div class="video-container">
                        <iframe width="400" height="315" src="${service.videoLink}" 
                        title="YouTube video player" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen></iframe>
                    </div>
                `;
            } else {
                serviceCard.innerHTML = `
                    <img src="images/${service.image}" alt="${service.name}" class="service-image" loading="lazy">
                    <h3>${service.name}</h3>
                    <p><strong>Schedule:</strong> ${service.schedule}</p>
                    <p><strong>Contact:</strong> ${service.contact}</p>
                `;
            }

            fragment.appendChild(serviceCard);
        });

        // Append to the spotlight section
        spotlightSection.innerHTML = ''; // Clear previous content
        spotlightSection.appendChild(fragment);
    } else {
        console.error("The '.spotlight' section was not found.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let timestampInput = document.getElementById('timestamp');
    if (timestampInput) {
        timestampInput.value = new Date().toLocaleString();
    }
});

