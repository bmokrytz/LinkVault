import * as Builder from "./register-builder.js";

export async function register(email, password) {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            localStorage.removeItem("login_email");
            Builder.showError("Account creation failed. Try again.");
            Builder.enableSubmitBtn();
            return;
        }

        const data = await res.json();
        const token = data.token;
        const user = data.user;

        console.log(data.message);

        localStorage.setItem("token", token);
        localStorage.setItem("login_email", user.email);
        localStorage.setItem("userID", user.id);

        window.location.href = "../dashboard/dashboard.html";
    } catch (err) {
        showError("Internal server error");
    } finally {
        Builder.enableSubmitBtn();
    }
}