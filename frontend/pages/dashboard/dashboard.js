import * as Api from "./dashboard-api.js";
import * as Builder from "./dashboard-builder.js";
import * as Handler from "./dashboard-handler.js";

document.addEventListener("DOMContentLoaded", async () => {

    // Verify that user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../../index.html"
    }

    const email = localStorage.getItem("login_email");
    const signed_in_user = document.getElementById("signed-in-user");
    signed_in_user.textContent = email;

    // Fetch user's links
    const links = await Api.fetchLinks(token);
    Builder.injectLinks(links);
    Handler.setupAllHandlers();
});
