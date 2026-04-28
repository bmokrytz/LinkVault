document.addEventListener("DOMContentLoaded", () => {

    // Set focus to first form field
    document.getElementById("email").focus();

    // Define back btn behavior
    const back_btn = document.getElementById("back-btn");
    back_btn.addEventListener("click", () => {
        window.location.href = "../../index.html";
    });

    // Error message functionality
    const error_msg_container = document.getElementById("error-msg-container");
    const error_msg_p = document.getElementById("error-msg");
    function showError(message) {
        error_msg_p.textContent = message;
        error_msg_container.style.display = "block";
    }
    function hideError() {
        error_msg_container.style.display = "none";
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

    

    
    // Handle register form submission
    const form = document.getElementById("register-form");
    const submit_btn = document.getElementById("submit-btn");
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const email = document.getElementById("email").value.trim();
        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.");
            return;
        }
        const password = document.getElementById("password").value;
        const password_conf = document.getElementById("password-conf").value;
        if (!isPasswordMatch(password, password_conf)) {
            showError("Passwords do not match.");
            return;
        }
        if (!isValidPassword(password)) {
            showError("Password must be at least 8 characters.");
            return;
        }
        disableSubmitBtn(submit_btn);

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                localStorage.removeItem("login_email");
                showError("Account creation failed. Try again.");
                enableSubmitBtn(submit_btn);
                return;
            }

            const data = await res.json();
            const token = data.token;
            const user = data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("login_email", user.email);
            localStorage.setItem("userID", user.id);

            window.location.href = "../dashboard/dashboard.html";
        } catch (err) {
            showError("Internal server error");
        } finally {
            enableSubmitBtn(submit_btn);
        }
    });

    function disableSubmitBtn(submit_btn) {
        submit_btn.disabled = true;
        submit_btn.value = "Creating account...";
        submit_btn.style.opacity = "0.7";
    }
    function enableSubmitBtn(submit_btn) {
        submit_btn.disabled = false;
        submit_btn.value = "Submit";
        submit_btn.style.opacity = "1";
    }

});