const register_container_template = document.createElement("template");
register_container_template.innerHTML = `
    <div id="register-container">
        <div id="form-container">
            <h1>Create an Account</h1>
            <form id="register-form">
                <div id="submit-btn-container">
                    <div class="auth-input" style="padding-bottom: 30px;">
                        <label for="email">Email:</label><br>
                        <input type="text" id="email" name="user-email" placeholder="you@example.com">
                    </div>
                    <div class="auth-input" style="padding-bottom: 30px;">
                        <label for="password">Password:</label><br>
                        <input type="password" id="password" name="user-password" placeholder="••••••••••••••••">
                    </div>
                    <div class="auth-input">
                        <label for="password-conf">Confirm password:</label><br>
                        <input type="password" id="password-conf" name="user-password-conf" placeholder="••••••••••••••••">
                    </div>
                    <div id="submit-container">
                        <input type="submit" id="submit-btn" value="Submit">
                    </div>
                </div>
            </form>
        </div>
    </div>
    `;

const email_verification_message_container_template = document.createElement("template");
email_verification_message_container_template.innerHTML = `
    <div id="email-verification-message-container" class="hidden">
        <span class="email-verification-message"></span>
        <div class="email-verification-button-box">
            <button class="resend-verification-email-btn">
                <span class="resend-verification-email-content"></span>
            </button>
        </div>
    </div>
    `;
let register_container;
let email_verification_message_container;

export function buildContainers() {
    const root = document.getElementById("root");
    const fragment = register_container_template.content.cloneNode(true);
    register_container = fragment.querySelector("#register-container");
    root.appendChild(register_container);
    const email_verification_fragment = email_verification_message_container_template.content.cloneNode(true);
    email_verification_message_container = email_verification_fragment.querySelector("#email-verification-message-container");
}

export function disableSubmitBtn() {
    const submit_btn = document.getElementById("submit-btn");
    submit_btn.disabled = true;
    submit_btn.value = "Creating account...";
    submit_btn.style.opacity = "0.7";
}
export function enableSubmitBtn() {
    const submit_btn = document.getElementById("submit-btn");
    submit_btn.disabled = false;
    submit_btn.value = "Submit";
    submit_btn.style.opacity = "1";
}

export function showError(message) {
    alert(message);
}