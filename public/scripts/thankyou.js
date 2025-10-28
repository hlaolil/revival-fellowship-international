// Function to get query parameters from the URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        firstName: params.get("first-name") || "Not provided",
        lastName: params.get("last-name") || "Not provided",
        email: params.get("email") || "Not provided",
        phone: params.get("phone") || "Not provided",
        description: params.get("message") || "Not provided",
        timestamp: params.get("timestamp") || "Not available",
    };
}

// Populate the page with the submitted form data
document.addEventListener("DOMContentLoaded", () => {
    const data = getQueryParams();
    document.getElementById("submitted-first-name").textContent = data.firstName;
    document.getElementById("submitted-last-name").textContent = data.lastName;
    document.getElementById("submitted-email").textContent = data.email;
    document.getElementById("submitted-phone").textContent = data.phone;
    document.getElementById("submitted-message").textContent = data.description;
    document.getElementById("submitted-timestamp").textContent = data.timestamp;
});
