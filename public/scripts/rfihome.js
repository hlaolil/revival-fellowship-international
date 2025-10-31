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

