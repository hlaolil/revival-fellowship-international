// Updated public/scripts/thankyou.js (client-side for any additional handling, but mainly server-rendered now)
document.addEventListener("DOMContentLoaded", () => {
    // Data is now server-rendered, but keep for any dynamic needs
    const data = {
        firstName: document.getElementById("submitted-first-name").textContent,
        // ... other fields if needed for client-side logic
    };
    // No further action needed as it's pre-populated
});
