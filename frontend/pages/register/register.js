import * as Builder from "./register-builder.js";
import * as Handler from "./register-handler.js";

document.addEventListener("DOMContentLoaded", async () => {
    
    Builder.buildContainers();
    document.getElementById("email").focus();
    await Handler.setupHandlers();
});