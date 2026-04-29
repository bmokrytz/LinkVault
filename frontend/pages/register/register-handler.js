import * as Builder from "./register-builder.js";
import * as Api from "./register-api.js";

export async function setupHandlers() {
    backButtonHandler();
    await registerFormSubmitHandler();
}

function backButtonHandler() {
    const back_btn = document.getElementById("back-btn");
    back_btn.addEventListener("click", () => {
        window.location.href = "../../index.html";
    });
}

async function registerFormSubmitHandler() {
    const form = document.getElementById("register-form");
    const submit_btn = document.getElementById("submit-btn");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        if (!isValidEmail(email)) {
            Builder.showError("Please enter a valid email address.");
            return;
        }
        const password = document.getElementById("password").value;
        const password_conf = document.getElementById("password-conf").value;
        if (!isPasswordMatch(password, password_conf)) {
            Builder.showError("Passwords do not match.");
            return;
        }
        if (!isValidPassword(password)) {
            Builder.showError("Password must be at least 8 characters.");
            return;
        }
        Builder.disableSubmitBtn();

        const response = await Api.register(email, password);
    });
}

// Form input validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPassword(password) {
    return password.length >= 8;
}
function isPasswordMatch(password, confirmation) {
    return password === confirmation;
}