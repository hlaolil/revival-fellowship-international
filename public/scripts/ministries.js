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


document.addEventListener("DOMContentLoaded", async () => {
    const gridContainer = document.getElementById("ministriesGrid");
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modal-title");
    const modalDescription = document.getElementById("modal-description");
    const closeModal = document.querySelector(".close");

    // Ensure modal starts hidden
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    try {
        // Fetch ministries from JSON file
        const response = await fetch("ministries.json");
        const routineServices = await response.json();

        // Populate ministries dynamically
        gridContainer.innerHTML = routineServices.map((service, index) => `
            <div class="card" data-index="${index}" role="button" tabindex="0">
                <img src="${service.image}" alt="${service.name}" loading="lazy">
                <h3>${service.name}</h3>
                <p>${service.schedule}</p>
                <button class="learn-more" data-index="${index}">Learn More</button>
            </div>
        `).join("");

        // Event delegation for opening modal
        gridContainer.addEventListener("click", (event) => {
            const target = event.target.closest(".card, .learn-more");
            if (!target) return;
            
            const index = target.dataset.index;
            const service = routineServices[index];

            modalTitle.textContent = service.name;
            modalDescription.innerHTML = `
                <strong>Schedule:</strong> ${service.schedule}<br>
                <strong>Contact:</strong> ${service.contact}
            `;
            modal.style.display = "flex";
            modal.setAttribute("aria-hidden", "false");
        });

    } catch (error) {
        console.error("Error loading ministries data:", error);
    }

    // Close modal when clicking the close button
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }
    });

    // Allow closing modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }
    });
});
