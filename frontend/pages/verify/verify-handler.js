export function setupHandlers() {
    signInButtonHandler();
}

function signInButtonHandler() {
    document.getElementById("login-btn").addEventListener("click", () => {
        window.location.href = "../../pages/login/login.html";
    });
}