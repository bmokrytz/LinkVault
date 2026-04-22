document.addEventListener("DOMContentLoaded", () => {

    
    const register_btn = document.getElementById("register-btn");
    register_btn.addEventListener("click", () => {
        window.location.href = "pages/register/register.html";
    });
    
    const login_btn = document.getElementById("login-btn");
    login_btn.addEventListener("click", () => {
        window.location.href = "pages/login/login.html";
    });

});