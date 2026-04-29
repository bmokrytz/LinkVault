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
            return res;
        }

        Builder.enableSubmitBtn();
        return res;
    } catch (err) {
        Builder.showError("Internal server error");
        Builder.enableSubmitBtn();
        return null;
    }
}