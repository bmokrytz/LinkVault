import * as Builder from "./verify-builder.js";
import * as Handler from "./verify-handler.js";
import * as Api from "./verify-api.js";

document.addEventListener("DOMContentLoaded", async () => {

    Builder.setVerificationMessage(await Api.verify());
    Handler.setupHandlers();
});