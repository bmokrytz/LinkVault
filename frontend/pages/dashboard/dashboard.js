import * as Api from "./api.js";
import * as Builder from "./builder.js";
import * as Handler from "./handler.js";











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
    Handler.addLinkHandlers();  

    // Sign out button functionality
    const sign_out_btn = document.getElementById("sign-out-btn");
    sign_out_btn.addEventListener("click", (e) => {
        disableSignOutBtn(sign_out_btn);
        localStorage.removeItem("login_email");
        localStorage.removeItem("token");
        localStorage.removeItem("userID");
        window.location.href = "../../index.html";
    });
    function disableSignOutBtn(sign_out_btn) {
        sign_out_btn.disabled = true;
        sign_out_btn.textContent = "Signing out...";
        sign_out_btn.style.opacity = "0.7";
    }

    // Toggle link creation container
    const add_link_btn = document.getElementById("add-link-btn");
    add_link_btn.addEventListener("click", (e) => {
        if (add_link_btn.value == "closed") {
            add_link_btn.value = "open";
            add_link_btn.classList.add("add-link-btn-open");
            add_link_btn.classList.remove("add-link-btn-closed");
            add_link_btn.textContent = "Cancel"
            showLinkCreator();
        } else {
            let btn_text = " Add Link";
            add_link_btn.value = "closed";
            add_link_btn.classList.add("add-link-btn-closed");
            add_link_btn.classList.remove("add-link-btn-open");
            add_link_btn.innerHTML = '<span style="font-size: 20px; padding-right: 5px;">+</span> Add Link';
            hideLinkCreator();
            const folder_creation_container = document.querySelector(".folder-creation-container");
            if (!folder_creation_container.classList.contains("hidden")) {
                folder_creation_container.classList.toggle("hidden");
            }
        }
    });
    function showLinkCreator() {
        const add_link_container = document.getElementById("add-link-form-container");
        add_link_container.style.display = "block";
        const folder_select = add_link_container.querySelector("#folder-select");
        folder_select.value = "none";
        const folder_name = add_link_container.querySelector("#folder-name");
        folder_name.value = "";
    }
    function hideLinkCreator() {
        const add_link_container = document.getElementById("add-link-form-container");
        add_link_container.style.display = "none";
    }

    // Toggle folder creation field in link creation form
    const folder_select = document.getElementById("folder-select");
    folder_select.addEventListener("change", (e) => {
        console.log("here");
        if (e.target.value === "new-folder") {
            showFolderCreationDiv();
        }
        else {
            hideFolderCreationDiv();
        }
    });
    function showFolderCreationDiv() {
        const folder_creation_container = document.getElementById("folder-creation-container");
        console.log(folder_creation_container);
        if (folder_creation_container.classList.contains("hidden")) {
            folder_creation_container.classList.toggle("hidden");
        }
        console.log(folder_creation_container);
    }

    function hideFolderCreationDiv() {
        const folder_creation_container = document.getElementById("folder-creation-container");
        if (!folder_creation_container.classList.contains("hidden")) {
            folder_creation_container.classList.toggle("hidden");
        }
    }


    // Link creation form
    const add_link_form = document.getElementById("add-link-form");
    add_link_form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();
        disableSubmitBtn();
        const title_state = document.getElementById("link-name-state");
        const url_state = document.getElementById("link-url-state");
        const tags_state = document.getElementById("link-tags-state");
        const folder_name_state = document.getElementById("link-folder-name-state");
        const title = document.getElementById("link-name").value.trim();
        const url = document.getElementById("link-url").value.trim();
        if (!title || !url) {
            showError("Link name and URL are required");
            enableSubmitBtn();
            return;
        }
        const link_tags = document.getElementById("link-tags").value;
        let tags = [];
        if (link_tags) {
            tags = link_tags.split(",");
        }
        const folder_select = document.getElementById("folder-select");
        if (folder_select.value === "new-folder") {
            const folder_name = document.getElementById("folder-name");
            tags.push("folder:" + folder_name.value);
        }

        try {
            const body = { title, url };
            if (tags.length > 0 && tags[0] !== "") {
                body.tags = tags;
            }
            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                 },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                showError("Unable to add link");
                enableSubmitBtn();
                return;
            }

            const data = await res.json();
            const link = data.bookmark;
            const result = findLinkFolders(link.tags);
            link.tags = result.tags;
            link.link_folders = result.link_folders;
            const folders = [];
            link.link_folders.forEach((folder) => {
                if (!folders.includes(folder)) {
                    folders.push(folder);
                }
            });
            if (folders.length === 0) {
                folders.push("uncategorized");
            }
            link.link_folders.forEach((folder) => insertLinkIntoFolder(link, folder));
        } catch (err) {
            showError("Internal server error");
        } finally {
            const title = document.getElementById("link-name");
            const url = document.getElementById("link-url");
            const folder_select = document.getElementById("folder-select");
            const link_tags = document.getElementById("link-tags");
            title.value = title_state.value;
            console.log(`title: _${title.value}_ title_state: _${title_state.value}_`);
            url.value = url_state.value;
            link_tags.value = tags_state.value;
            folder_select.value = "none";
            if (folder_select.value === "new-folder") {
                const folder_name = document.getElementById("folder-name");
                folder_name.value = folder_name_state.value;
            }
            const add_link_btn = document.getElementById("add-link-btn");
            add_link_btn.click();
            const folder_creation_container = document.querySelector(".folder-creation-container");
            folder_creation_container.classList.toggle("hidden");
            enableSubmitBtn();
        }
    });

    function disableSubmitBtn() {
        const submit_btn = document.getElementById("submit-btn");
        submit_btn.disabled = true;
        submit_btn.value = "Adding link...";
        submit_btn.style.opacity = "0.7";
    }
    function enableSubmitBtn() {
        const submit_btn = document.getElementById("submit-btn");
        submit_btn.disabled = false;
        submit_btn.value = "Submit";
        submit_btn.style.opacity = "1";
    }


 



    

    






    // Link expander functionality (toggles full link view)
    document.querySelectorAll(".link-expander").forEach((chevron) => {
        chevron.addEventListener("click", (e) => {
            e.stopPropagation();
            const regular = chevron.closest(".link-outer-container").querySelector(".link-container");
            regular.classList.toggle("hidden");
            const expanded = chevron.closest(".link-outer-container").querySelector(".link-container-expanded");
            expanded.classList.toggle("hidden");
        });
    });


    document.querySelectorAll(".drawer-handle").forEach((handle) => {
        handle.addEventListener("click", () => {
            const arrow = handle.querySelector(`.drawer-arrow`);
            arrow.classList.toggle("drawer-arrow-flipped");
            const link_bin = handle.closest(".folder-card").querySelector(".link-bin");
            link_bin.classList.toggle("hidden");
        });
    });





});


























