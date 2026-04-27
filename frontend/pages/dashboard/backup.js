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
    const links = await fetchLinks(token);
    insertLinks(links);
    setLinkCountDisplay();
    setupFolderCardButtons();

    // Error message functionality
    function showError(message) {
        alert(message);
    }
    function hideError() {
        const error_msg = document.getElementById("error-msg");
        error_msg.textContent = "";
        error_msg.style.display = "none";
    }

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
            buildFolderCards(folders);
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


    // Fetch the user's links from database
    async function fetchLinks(token) {
        const userID = localStorage.getItem("userID");
        
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, {
                method: "GET",
                headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
            });
            if (!res.ok) {
                showError("Internal server error");
                return [];
            }
            const data = await res.json();
            const bookmarks = data.bookmarks;
            return bookmarks;
        } catch(err) {
            showError("Internal server error.");
            return [];
        }
    }

    // Insert links into page
    function insertLinks(links) {
        const folders = [];
        links.forEach((link) => {
            const result = findLinkFolders(link.tags);
            link.tags = result.tags;
            link.link_folders = result.link_folders;
            link.link_folders.forEach((folder) => {
                if (!folders.includes(folder)) {
                    folders.push(folder);
                }
            });
        });
        buildFolderCards(folders);
        links.forEach((link) => {
            link.link_folders.forEach((folder) => insertLinkIntoFolder(link, folder));
        });
    }

    function findLinkFolders(tags) {
        const remaining_tags = [];
        const link_folders = [];
        tags.forEach((tag) => {
            if (/^folder:.+$/.test(tag)) {
                link_folders.push(tag.replace("folder:", ""));
            } else {
                remaining_tags.push(tag);
            }
        });
        if (link_folders.length === 0) {
            link_folders.push("uncategorized");
        }
        return { tags: remaining_tags, link_folders };
    }

    function buildFolderCards(folders) {
        const root = document.getElementById("root");
        folders.forEach((folder) => {
            if (folder === "uncategorized") {
                return;
            }
            // Build folder card
            const folder_card = document.createElement("div");
            folder_card.classList.add("folder-card");
            folder_card.setAttribute('id', `folder:${folder}`);

            // Build folder card header container
            const folder_card_header_container = document.createElement("div");
            folder_card_header_container.classList.add("folder-card-header-container");

            // Build folder title container
            const folder_card_title_container = document.createElement("div");
            folder_card_title_container.classList.add("folder-card-title-container");
            
            const folder_card_title = document.createElement("span");
            folder_card_title.classList.add("folder-card-title");
            folder_card_title.innerHTML = `📁 ${folder}`;
            folder_card_title_container.appendChild(folder_card_title);
            const card_title_form = document.createElement("form");
            card_title_form.classList.add("card-title-form");
            card_title_form.classList.add("hidden");
            const card_title_form_input = document.createElement("input");
            card_title_form_input.classList.add("card-title-form-input");
            card_title_form.appendChild(card_title_form_input);
            folder_card_title_container.appendChild(card_title_form);
            const folder_card_edit_btn = document.createElement("button");
            folder_card_edit_btn.classList.add("folder-title-edit-btn");
            folder_card_edit_btn.classList.add("hidden");
            folder_card_title.state = "closed";
            const folder_card_edit_btn_icon = document.createElement("span");
            folder_card_edit_btn_icon.classList.add("material-symbols-outlined");
            folder_card_edit_btn_icon.classList.add("folder-title-edit-btn-icon");
            folder_card_edit_btn_icon.innerHTML = "edit";
            folder_card_edit_btn.appendChild(folder_card_edit_btn_icon);
            const accept_card_title_btn = document.createElement("button");
            accept_card_title_btn.classList.add("accept-card-title-btn");
            accept_card_title_btn.classList.add("hidden");
            const accept_card_title_btn_icon = document.createElement("span");
            accept_card_title_btn_icon.classList.add("material-symbols-outlined");
            accept_card_title_btn_icon.classList.add("accept-card-title-icon");
            accept_card_title_btn_icon.innerHTML = "check";
            accept_card_title_btn.appendChild(accept_card_title_btn_icon);
            folder_card_title_container.appendChild(folder_card_edit_btn);
            folder_card_title_container.appendChild(accept_card_title_btn);
            folder_card_header_container.appendChild(folder_card_title_container);

            const folder_card_header_buttons_container = document.createElement("div");
            folder_card_header_buttons_container.classList.add("folder-card-header-buttons-container");
            const open_all_links_btn = document.createElement("button");
            open_all_links_btn.classList.add("open-all-links-btn");
            const open_all_links_btn_span = document.createElement("span");
            open_all_links_btn_span.classList.add("open-all-links-span");
            open_all_links_btn_span.innerHTML = "Open All ";
            const open_all_links_btn_span_icon = document.createElement("span");
            open_all_links_btn_span_icon.classList.add("open-all-links-icon");
            open_all_links_btn_span_icon.classList.add("material-symbols-outlined");
            open_all_links_btn_span_icon.innerHTML = "arrow_outward";

            open_all_links_btn.appendChild(open_all_links_btn_span);
            open_all_links_btn.appendChild(open_all_links_btn_span_icon);
            folder_card_header_buttons_container.appendChild(open_all_links_btn);

            // Build folder card settings button
            const folder_card_settings_btn = document.createElement("button");
            folder_card_settings_btn.classList.add("folder-card-settings-btn");
            folder_card_settings_btn.classList.add("hidden");
            const folder_card_settings_btn_icon = document.createElement("span");
            folder_card_settings_btn_icon.classList.add("material-symbols-outlined");
            folder_card_settings_btn_icon.innerHTML = "settings";
            folder_card_settings_btn.appendChild(folder_card_settings_btn_icon);
            folder_card_header_buttons_container.appendChild(folder_card_settings_btn);
            folder_card_header_container.appendChild(folder_card_header_buttons_container);

            // Add folder card header container to folder card
            folder_card.appendChild(folder_card_header_container);

            // Build link bin
            const link_bin = document.createElement("div");
            link_bin.classList.add("link-bin");
            folder_card.appendChild(link_bin);

            // Build drawer handle
            const drawer_handle = document.createElement("div");
            drawer_handle.classList.add("drawer-handle");
            const p = document.createElement("p");
            p.classList.add("drawer-arrow");
            p.innerHTML = "&#x25BE;";
            drawer_handle.appendChild(p);
            folder_card.appendChild(drawer_handle);

            root.appendChild(folder_card);
        });
    }



    function setupFolderCardButtons() {
        const folder_cards = document.querySelectorAll(".folder-card");
        folder_cards.forEach((folder_card) => {
            const link_edit_button_containers = folder_card.querySelectorAll(".link-buttons-container");
            link_edit_button_containers.forEach((container) => {
                container.addEventListener("click", (e) => {
                    e.stopPropagation();
                });
            });
            const settings_button = folder_card.querySelector(".folder-card-settings-btn");
            settings_button.addEventListener("click", () => {
                const folder_card = settings_button.closest(".folder-card");
                folder_card.classList.toggle("editing");
                const link_outer_containers = folder_card.querySelectorAll(".link-outer-container");
                link_outer_containers.forEach((container) => {
                    container.classList.toggle("blue-outline-hover");
                });
                const title_edit_btn = folder_card.querySelector(".folder-title-edit-btn");
                if (title_edit_btn !== null) {
                    if (title_edit_btn.state === "open") {
                        title_edit_btn.click();
                    }
                    title_edit_btn.classList.toggle("hidden");
                }
                const link_edit_containers = folder_card.querySelectorAll(".link-buttons-container");
                link_edit_containers.forEach((container) => {
                    const link_edit_btn = container.querySelector(".edit-link-btn");
                    if (link_edit_btn.state === "open") {
                        link_edit_btn.click();
                    }
                    container.classList.toggle("hidden");
                });
            });

            const open_all_links_btn = folder_card.querySelector(".open-all-links-btn");
            open_all_links_btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const urls = open_all_links_btn.closest(".folder-card").querySelectorAll(".link-url");
                
                let openedCount = 0;
                urls.forEach((url_element) => {
                    let url = url_element.textContent;
                    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                    const newWindow = window.open(url, "_blank");
                    if (newWindow) {
                        openedCount++;
                    }
                });

                if (openedCount < urls.length) {
                    // Trigger alert abour popup blocker
                    alert("Your browser blocked some tabs. Please click the 'Popup Blocked' icon in your address bar and select 'Always allow from LinkVault.'");
                }
            });

            // Set up link edit buttons
            const link_containers = folder_card.querySelectorAll(".link-container");
            link_containers.forEach((container) => {
                const folder_title = getFolderName(container.closest(".folder-card").querySelector(".folder-card-title").innerHTML);
                const edit_link_form_folder_select = container.closest(".link-outer-container").querySelector(".edit-form-folder-select");
                if (folder_title === "Links") {
                    edit_link_form_folder_select.value = "none";
                } else {
                    edit_link_form_folder_select.value = folder_title;
                }
                edit_link_form_folder_select.state = edit_link_form_folder_select.value;
                const link_edit_form = container.closest(".link-outer-container").querySelector(".link-edit-form");
                const id = container.id;
                const link_outer_container = container.closest(".link-outer-container");
                const edit_link_btn = link_outer_container.querySelector(".edit-link-btn");
                const edit_link_accept_btn = link_outer_container.querySelector(".accept-card-title-btn");
                edit_link_accept_btn.addEventListener("click", async () => {
                    edit_link_accept_btn.disabled = true;
                    const link_edit_form = edit_link_accept_btn.closest(".link-outer-container").querySelector(".link-edit-form");
                    const link_id_input = link_edit_form.querySelector(".edit-form-id");
                    const link_title_input = link_edit_form.querySelector(".edit-form-title-input");
                    const link_url_input = link_edit_form.querySelector(".edit-form-url-input");
                    const link_folder_select = link_edit_form.querySelector(".edit-form-folder-select");
                    const link_tags_input = link_edit_form.querySelector(".edit-form-tags-input");
                    link = { };
                    let folder_changed = false;
                    if (link_title_input.value !== link_title_input.state) {
                        link.title = link_title_input.value;
                        link_title_input.state = link_title_input.value;
                    }
                    if (link_url_input.value !== link_url_input.state) {
                        link.url = link_url_input.value;
                        link_url_input.state = link_url_input.value;
                    }
                    if (link_folder_select.value !== link_folder_select.state) {
                        folder_changed = true;
                        link_folder_select.state = link_folder_select.value;
                    }
                    if (link_tags_input.value !== link_tags_input.state) {
                        link.tags = link_tags_input.value.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
                        link_tags_input.state = link_tags_input.value;
                    }
                    if (Object.keys(link).length === 0 && !folder_changed) {
                        const edit_link_btn = edit_link_accept_btn.closest(".link-outer-container").querySelector(".edit-link-btn");
                        edit_link_btn.click();
                        edit_link_accept_btn.disabled = false;
                        return;
                    } else {
                        console.log("Change detected... link: ", link);
                        if (folder_changed) {
                            if (!("tags" in link)) {
                                link.tags = link_tags_input.value.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
                            }
                            if (link_folder_select.value !== "none") {
                                if (link_folder_select.value === "new-folder") {
                                    const link_new_folder_name_input = link_folder_select.closest(".link-outer-container").querySelector(".edit-form-new-folder-name-input");
                                    const new_folder_name = link_new_folder_name_input.value;
                                    link.tags.push(`folder:${new_folder_name}`);
                                } else {
                                    link.tags.push(`folder:${link_folder_select.value}`);
                                }
                            }
                        }
                        try {
                            const token = localStorage.getItem("token");
                            const bookmark_id = link_id_input.value;
                            console.log(`bookmark_id: _${bookmark_id}_`);
                            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/bookmark/${bookmark_id}`, {
                                method: "PUT",
                                headers: { 
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`
                                },
                                body: JSON.stringify(link),
                            });
                        } catch(err) {
                            console.log(err);
                            showError("Internal server error");
                        } finally {
                            link_edit_form.submit();
                        }
                    }
                    edit_link_accept_btn.disabled = false;
                });
                edit_link_btn.state = "closed";
                edit_link_btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // Enable edit form
                    const link_outer_container = edit_link_btn.closest(".link-outer-container");
                    const link_edit_form_container = link_outer_container.querySelector(".link-edit-form-container");
                    link_edit_form_container.classList.toggle("hidden");
                    const link_container = link_outer_container.querySelector(".link-container");
                    const link_container_expanded = link_outer_container.querySelector(".link-container-expanded");
                    if (edit_link_btn.state === "closed") {
                        if (!link_container.classList.contains("hidden")) {
                            link_container.classList.toggle("hidden");
                        }
                        if (!link_container_expanded.classList.contains("hidden")) {
                            link_container_expanded.classList.toggle("hidden");
                        }
                        edit_link_btn.state = "open";
                    } else {
                        edit_link_btn.state = "closed";
                        if (link_container.classList.contains("hidden")) {
                            link_container.classList.toggle("hidden");
                        }
                        if (!link_container_expanded.classList.contains("hidden")) {
                            link_container_expanded.classList.toggle("hidden");
                        }
                    }
                    
                    
                });
                const delete_link_btn = link_outer_container.querySelector(".delete-link-btn");
                delete_link_btn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (!confirm("Are you sure you want to permanently delete this link?")) {
                        return;
                    }
                    try {
                        const link_container = delete_link_btn.closest(".link-outer-container").querySelector(".link-container");
                        const link_id = link_container.id;
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/${link_id}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            }
                        });
                        if (!res.ok) {
                            showError("There was a problem deleting this link.");
                            console.log(`response status: ${res.status}`);
                            return;
                        }
                        location.reload();
                    } catch(err) {
                        console.log(err);
                        showError("Internal server error.");
                    }
                });
            });

            // Set up folder title editing buttons
            const folder_title_edit_btn = folder_card.querySelector(".folder-title-edit-btn");
            if (folder_title_edit_btn === null) {
                return;
            }
            folder_title_edit_btn.addEventListener("click", () => {
                folder_title_edit_btn.state = (folder_title_edit_btn.state === "open" ? "closed" : "open");
                const accept_card_title_btn = folder_card.querySelector(".accept-card-title-btn");
                const folder_card_title = folder_card.querySelector(".folder-card-title");
                const card_title_form = folder_card.querySelector(".card-title-form");
                accept_card_title_btn.classList.toggle("hidden");
                folder_card_title.classList.toggle("hidden");
                card_title_form.classList.toggle("hidden");
                const folder_title = folder_card.querySelector(".folder-card-title");
                const card_title_form_input = folder_card.querySelector(".card-title-form-input");
                let card_title = folder_title.innerHTML;
                card_title = getFolderName(card_title);
                card_title_form_input.setAttribute('value', card_title);
            });
            const accept_card_title_btn = folder_card.querySelector(".accept-card-title-btn");
            accept_card_title_btn.addEventListener("mouseenter", () => {
                const accept_card_title_icon = folder_card.querySelector(".accept-card-title-icon");
                accept_card_title_icon.classList.toggle("green");
            });
            accept_card_title_btn.addEventListener("mouseleave", () => {
                const accept_card_title_icon = folder_card.querySelector(".accept-card-title-icon");
                accept_card_title_icon.classList.toggle("green");
            });
            accept_card_title_btn.addEventListener("click", async () => {
                const folder_title_edit_btn = folder_card.querySelector(".folder-title-edit-btn");
                folder_title_edit_btn.click();
                const new_title = folder_card.querySelector(".card-title-form-input").value;
                const folder_card_title = folder_card.querySelector(".folder-card-title");
                const folder_card_title_text = folder_card_title.innerHTML;
                const current_title = getFolderName(folder_card_title_text);
                if (new_title === current_title) {
                    return;
                }
                const num_links = folder_card_title.innerHTML.slice(folder_card_title_text.indexOf("("), folder_card_title_text.indexOf(")") + 1);
                await updateFolderTitle(current_title, new_title);
                folder_card_title.innerHTML = `📁 ${new_title} ${num_links}`;
            });
        });
    }


    async function updateFolderTitle(old_title, new_title) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/folder`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                 },
                body: JSON.stringify({ old_folder: old_title, new_folder: new_title }),
            });
        } catch (err) {
            showError("Internal server error.");
        }
    }

    function insertLinkIntoFolder(link, folder) {
        const folder_card = document.getElementById(`folder:${folder}`);
        const link_bin = folder_card.querySelector(`.link-bin`);
        const outer_link_container = buildOuterLinkContainer(link);
        link_bin.appendChild(outer_link_container);
    }

    function buildOuterLinkContainer(link) {
        const link_outer_container = document.createElement("div");
        link_outer_container.classList.add("link-outer-container");
        link_outer_container.classList.add("blue-outline-hover");
        const link_container = buildLinkElement(link);
        const link_container_expanded = buildExpandedLinkElement(link);
        const link_edit_form_container = buildLinkEditForm(link);
        link_outer_container.appendChild(link_container);
        link_outer_container.appendChild(link_container_expanded);
        link_outer_container.appendChild(link_edit_form_container);
        link_outer_container.addEventListener("click", () => {
            const folder_card = link_outer_container.closest(".folder-card");
            if (folder_card.classList.contains("editing")) {
                return;
            }
            const link_url = link_outer_container.querySelector(".link-url");
            let url = link_url.textContent;
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            window.open(url, "_blank");
        });
        const link_buttons_container = document.createElement("div");
        link_buttons_container.classList.add("link-buttons-container");
        link_buttons_container.classList.add("hidden");
        const edit_btn = document.createElement("button");
        edit_btn.classList.add("edit-link-btn");
        const edit_btn_icon = document.createElement("span");
        edit_btn_icon.classList.add("material-symbols-outlined");
        edit_btn_icon.innerHTML = "edit";
        edit_btn.appendChild(edit_btn_icon);
        const delete_btn = document.createElement("button");
        delete_btn.classList.add("delete-link-btn");
        const delete_btn_icon = document.createElement("span");
        delete_btn_icon.classList.add("material-symbols-outlined");
        delete_btn_icon.innerHTML = "delete";
        delete_btn.appendChild(delete_btn_icon);
        link_buttons_container.appendChild(edit_btn);
        link_buttons_container.appendChild(delete_btn);
        link_outer_container.appendChild(link_buttons_container);
        return link_outer_container;
    }

    function buildLinkElement(link) {
        const link_container = document.createElement("div");
        link_container.classList.add("link-container");
        link_container.id = link.id;
        const link_title = document.createElement("span");
        link_title.classList.add("link-title");
        link_title.textContent = link.title;
        const link_container_right = document.createElement("div");
        link_container_right.classList.add("link-container-right");
        const link_url = document.createElement("span");
        link_url.classList.add("link-url");
        link_url.textContent = link.url;
        const tags_container = document.createElement("div");
        tags_container.classList.add("tags-container");
        if (link.tags.length > 6) {
            link.tags.slice(0, 6).forEach((link_tag) => {
                const tag = document.createElement("div");
                tag.classList.add("tag");
                const p = document.createElement("p");
                p.textContent = link_tag;
                tag.appendChild(p);
                tags_container.appendChild(tag);
            });
            const tag_ellipsis = document.createElement("span");
            tag_ellipsis.classList.add("tag-ellipsis");
            link_container_right.appendChild(link_url);
            link_container_right.appendChild(tags_container);
            link_container_right.appendChild(tag_ellipsis);
        } else{
            link.tags.forEach((link_tag) => {
                const tag = document.createElement("div");
                tag.classList.add("tag");
                const p = document.createElement("p");
                p.textContent = link_tag;
                tag.appendChild(p);
                tags_container.appendChild(tag);
            });
            link_container_right.appendChild(link_url);
            link_container_right.appendChild(tags_container);
            link_container_right.style.gridTemplateColumns = "1fr 1fr 0px";
        }  
        const link_expander = document.createElement("span");
        link_expander.classList.add("link-expander");
        link_expander.innerHTML = "&#x276F;";
        link_container.appendChild(link_title);
        link_container.appendChild(link_container_right);
        link_container.appendChild(link_expander);
        return link_container;
    }

    function buildExpandedLinkElement(link) {
        const link_container = document.createElement("div");
        link_container.classList.add("link-container-expanded");
        link_container.classList.add("hidden");
        link_container.id = link.id;
        const link_title = document.createElement("span");
        link_title.classList.add("link-title-expanded");
        link_title.textContent = link.title;
        const link_container_right = document.createElement("div");
        link_container_right.classList.add("link-container-right-expanded");
        const link_url = document.createElement("span");
        link_url.classList.add("link-url-expanded");
        link_url.textContent = link.url;
        const tags_container = document.createElement("div");
        tags_container.classList.add("tags-container-expanded");
        link.tags.forEach((link_tag) => {
            const tag = document.createElement("div");
            tag.classList.add("tag");
            const p = document.createElement("p");
            p.textContent = link_tag;
            tag.appendChild(p);
            tags_container.appendChild(tag);
        });
        link_container_right.appendChild(link_url);
        link_container_right.appendChild(tags_container);
        const link_expander = document.createElement("span");
        link_expander.classList.add("link-expander");
        link_expander.classList.add("expanded");
        link_expander.innerHTML = "&#x276F;";
        link_container.appendChild(link_title);
        link_container.appendChild(link_container_right);
        link_container.appendChild(link_expander);
        return link_container;
    }

    function buildLinkEditForm(link) {
        const link_edit_form_container = document.createElement("div");
        link_edit_form_container.classList.add("link-edit-form-container");
        link_edit_form_container.classList.add("hidden");
        link_edit_form_container.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        const link_edit_form = document.createElement("form");
        link_edit_form.classList.add("link-edit-form");

        const link_id_input = document.createElement("input");
        link_id_input.value = link.id;
        link_id_input.style.display = "none";
        link_id_input.classList.add("edit-form-id");
        link_edit_form.appendChild(link_id_input);

        const link_title_label = document.createElement("label");
        link_title_label.innerHTML = "Link name:";
        link_edit_form.appendChild(link_title_label);
        

        const link_url_label = document.createElement("label");
        link_url_label.innerHTML = "URL:";
        link_edit_form.appendChild(link_url_label);

        const link_folder_label = document.createElement("label");
        link_folder_label.innerHTML = "Folder:";
        link_edit_form.appendChild(link_folder_label);

        const link_new_folder_name_label = document.createElement("label");
        link_new_folder_name_label.innerHTML = "Folder name:";
        link_new_folder_name_label.classList.add("edit-form-new-folder-name-label");
        link_new_folder_name_label.classList.add("hidden");
        link_edit_form.appendChild(link_new_folder_name_label);

        const link_tags_label = document.createElement("label");
        link_tags_label.innerHTML = "Tags (comma separated):";
        link_edit_form.appendChild(link_tags_label);
        
        const link_title_input = document.createElement("input");
        link_title_input.type = "text";
        link_title_input.value = link.title;
        link_title_input.state = link_title_input.value;
        link_title_input.classList.add("edit-form-title-input");
        link_edit_form.appendChild(link_title_input);
        
        const link_url_input = document.createElement("input");
        link_url_input.type = "text";
        link_url_input.value = link.url;
        link_url_input.state = link_url_input.value;
        link_url_input.classList.add("edit-form-url-input");
        link_edit_form.appendChild(link_url_input);
        
        const folder_select = document.createElement("select");
        folder_select.classList.add("edit-form-folder-select");
        const none_option = document.createElement("option");
        none_option.value = "none";
        none_option.innerHTML = "None";
        folder_select.appendChild(none_option);
        const new_folder_option = document.createElement("option");
        new_folder_option.value = "new-folder";
        new_folder_option.innerHTML = "Create new folder";
        folder_select.appendChild(new_folder_option);

        const folder_names = getFolderNamesAll();
        folder_names.forEach((folder_name) => {
            const select_option = document.createElement("option");
            select_option.value = folder_name;
            select_option.innerHTML = folder_name;
            folder_select.appendChild(select_option);
        });
        link_edit_form.appendChild(folder_select);

        const link_new_folder_input = document.createElement("input");
        link_new_folder_input.type = "text";
        link_new_folder_input.classList.add("edit-form-new-folder-name-input");
        link_new_folder_input.classList.add("hidden");
        link_edit_form.appendChild(link_new_folder_input);

        const link_tags_input = document.createElement("input");
        link_tags_input.type = "text";
        link_tags_input.classList.add("edit-form-tags-input");
        let link_tags_input_text = "";
        link.tags.forEach((tag) => {
            if (link_tags_input_text !== "") {
                link_tags_input_text += `,${tag}`;
            } else{
                link_tags_input_text += `${tag}`;
            }
        });
        link_tags_input.value = link_tags_input_text;
        link_tags_input.state = link_tags_input.value;
        link_tags_input.placeholder = "tag1,tag2,tag3";
        link_edit_form.appendChild(link_tags_input);

        folder_select.addEventListener("change", (e) => {
            const new_folder_name_label = link_edit_form.querySelector(".edit-form-new-folder-name-label");
            const new_folder_name_input = link_edit_form.querySelector(".edit-form-new-folder-name-input");
            if (e.target.value === "new-folder") {
                new_folder_name_label.classList.toggle("hidden");
                new_folder_name_input.classList.toggle("hidden");
                link_edit_form.classList.toggle("five-rows");
            } else {
                if (!new_folder_name_label.classList.contains("hidden")) {
                    new_folder_name_label.classList.toggle("hidden");
                    new_folder_name_input.classList.toggle("hidden");
                    link_edit_form.classList.toggle("five-rows");
                }
            }
        });

        link_edit_form_container.appendChild(link_edit_form);

        const link_edit_accept_btn = document.createElement("button");
        link_edit_accept_btn.classList.add("material-symbols-outlined");
        link_edit_accept_btn.classList.add("accept-card-title-btn")
        const link_edit_accept_btn_icon = document.createElement("span");
        link_edit_accept_btn_icon.classList.add("material-symbols-outlined");
        link_edit_accept_btn_icon.classList.add("accept-card-title-icon");
        link_edit_accept_btn.style.height = "35px";
        link_edit_accept_btn.style.alignSelf = "center";
        link_edit_accept_btn.style.marginLeft = "10px";
        link_edit_accept_btn_icon.innerHTML = "check";
        link_edit_accept_btn.addEventListener("mouseenter", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        link_edit_accept_btn.addEventListener("mouseleave", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        link_edit_accept_btn.appendChild(link_edit_accept_btn_icon);
        link_edit_form_container.appendChild(link_edit_accept_btn);
        
        return link_edit_form_container;
    }

/*
folder_select.addEventListener("change", (e) => {
        if (e.target.value === "new-folder") {
            showFolderCreationDiv();
        }
        else {
            hideFolderCreationDiv();
        }
    });
*/

    function getFolderNamesAll() {
        const folder_cards = document.querySelectorAll(".folder-card:not(#folder\\:uncategorized)");
        const folder_names = [];
        folder_cards.forEach((folder) => {
            let folder_title = folder.querySelector(".folder-card-title").innerHTML;
            folder_title = getFolderName(folder_title);
            folder_names.push(folder_title);
        });
        return folder_names;
    }

    function getFolderName(full_name) {
        const start = full_name.indexOf("📁 ") + 3;
        const end = full_name.indexOf(" (");
        if (!full_name.includes("📁")) {
            return full_name.slice(0, end === -1 ? undefined : end);;
        }
        return full_name.slice(start, end === -1 ? undefined : end);
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


    function setLinkCountDisplay() {
        const folder_cards = document.querySelectorAll(".folder-card");
        folder_cards.forEach((folder_card) => {
            const num_links = folder_card.querySelectorAll(".link-outer-container").length;
            const folder_card_title = folder_card.querySelector(".folder-card-title");
            folder_card_title.textContent += ` (${num_links})`;
        });
    }



});



