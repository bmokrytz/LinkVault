import * as Builder from "./dashboard-builder.js";
import * as Api from "./dashboard-api.js";

export function setupAllHandlers() {
    addLinkHandlers();
    signOutButtonHandler();
    createLinkButtonHandler();
    linkCreationFormHandler();
    linkExpanderHandler();
    drawerHandleHandler();
}

function addLinkHandlers() {
    linkClickHandler();
    folderCreationHandler();
    linkContainerPropagationHandler();
    folderCardSettingsButtonHandler();
    openAllLinksButtonHandler();
    linkEditButtonHandler();
    linkEditAcceptButtonHandler();
    linkDeleteButtonHandler();
    folderCardTitleEditButtonHandler();
    folderCardTitleEditAcceptButtonHandler();
}

function linkClickHandler() {
    document.querySelectorAll(".link-outer-container").forEach((link_outer_container) => {
        // Open new tab to link
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
    });
}

function folderCreationHandler() {
    document.querySelectorAll(".link-outer-container").forEach((link_outer_container) => {
        // Toggle folder creation name input field
        const folder_select = link_outer_container.querySelector(".edit-form-folder-select");
        folder_select.addEventListener("change", (e) => {
            const link_edit_form = folder_select.closest(".link-edit-form");
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
    });
}

function linkContainerPropagationHandler() {
    document.querySelectorAll(".link-outer-container").forEach((link_outer_container) => {
        // Stop click propagation
        link_outer_container.querySelector(".link-edit-form").addEventListener("click", (e) => {
            e.stopPropagation();
        });
        link_outer_container.querySelectorAll(".link-buttons-container").forEach((container) => {
            container.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        });
    });
}

function folderCardSettingsButtonHandler() {
    // Settings (cog) button action
    const settings_buttons = document.querySelectorAll(".folder-card-settings-btn");
    settings_buttons.forEach((settings_button) => {
        settings_button.addEventListener("click", () => {
            const folder_card = settings_button.closest(".folder-card");
            folder_card.closest(".folder-card").classList.toggle("editing");
            const title_edit_btn = folder_card.querySelector(".folder-title-edit-btn");
            if (title_edit_btn !== null) {
                if (Builder.isPanelOpen(title_edit_btn)) {
                    title_edit_btn.click();
                }
                title_edit_btn.classList.toggle("hidden");
            }
            settings_button.closest(".folder-card").querySelectorAll(".link-outer-container").forEach((container) => {
                container.classList.toggle("blue-outline-hover");
                const edit_link_btn = container.querySelector(".edit-link-btn");
                if (Builder.isPanelOpen(edit_link_btn)) {
                    edit_link_btn.click();
                }   
                container.querySelector(".link-buttons-container").classList.toggle("hidden");
            });
        });
    });
}

function openAllLinksButtonHandler() {
    const open_all_links_btns = document.querySelectorAll(".open-all-links-btn");
    open_all_links_btns.forEach((open_all_links_btn) => {
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
                // Trigger alert about popup blocker
                alert("Your browser blocked some tabs. Please click the 'Popup Blocked' icon in your address bar and select 'Always allow from LinkVault.'");
            }
        });
    });
}

function linkEditButtonHandler() {
    // Set up link editing buttons
    const edit_link_btns = document.querySelectorAll(".edit-link-btn");
    edit_link_btns.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            const link_edit_form_container = button.closest(".link-outer-container").querySelector(".link-edit-form-container");
            link_edit_form_container.classList.toggle("hidden");
            const link_container = button.closest(".link-outer-container").querySelector(".link-container");
            const link_container_expanded = button.closest(".link-outer-container").querySelector(".link-container-expanded");
            if (!Builder.isPanelOpen(button)) {
                if (!link_container.classList.contains("hidden")) {
                    link_container.classList.toggle("hidden");
                }
                Builder.setPanelOpen(button);
            } else {
                if (link_container.classList.contains("hidden")) {
                    link_container.classList.toggle("hidden");
                }
                Builder.setPanelClosed(button);
            }
            if (!link_container_expanded.classList.contains("hidden")) {
                link_container_expanded.classList.toggle("hidden");
            }
        });
    });
}

function linkEditAcceptButtonHandler() {
    document.querySelectorAll(".link-outer-container").forEach((link_outer_container) => {
        const link_edit_accept_btn = link_outer_container.querySelector(".link-edit-form-container").querySelector(".accept-card-title-btn");
        link_edit_accept_btn.addEventListener("mouseenter", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        })
        link_edit_accept_btn.addEventListener("mouseleave", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        link_edit_accept_btn.addEventListener("click", async (e) => {
            link_edit_accept_btn.disabled = true;
            const link_edit_form = link_edit_accept_btn.closest(".link-outer-container").querySelector(".link-edit-form");
            const link_id_input = link_edit_form.querySelector(".edit-form-id");
            const link_title_input = link_edit_form.querySelector(".edit-form-title-input");
            const link_url_input = link_edit_form.querySelector(".edit-form-url-input");
            const link_folder_select = link_edit_form.querySelector(".edit-form-folder-select");
            const link_tags_input = link_edit_form.querySelector(".edit-form-tags-input");
            const link = { };
            let folder_changed = false;
            if (link_title_input.value !== link_edit_form.dataset.link_title) {
                link.title = link_title_input.value;
                link_edit_form.dataset.link_title = link_title_input.value;
            }
            if (link_url_input.value !== link_edit_form.dataset.link_url) {
                link.url = link_url_input.value;
                link_edit_form.dataset.link_url = link_url_input.value;
            }
            if (link_folder_select.value !== link_folder_select.dataset.default_value) {
                folder_changed = true;
                link_folder_select.dataset.default_value = link_folder_select.value;
            }
            if (link_tags_input.value !== link_edit_form.dataset.link_tags) {
                link.tags = link_tags_input.value.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
                link_edit_form.dataset.link_tags = link_tags_input.value;
            }
            if (Object.keys(link).length === 0 && !folder_changed) {
                const edit_link_btn = link_edit_accept_btn.closest(".link-outer-container").querySelector(".edit-link-btn");
                edit_link_btn.click();
                link_edit_accept_btn.disabled = false;
                return;
            } else {
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
                await Api.editLink(link, link_id_input.value);
            }
            link_edit_accept_btn.disabled = false;
            link_edit_form.submit();
        });
    });
}

function linkDeleteButtonHandler() {
    document.querySelectorAll(".delete-link-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (!confirm("Are you sure you want to permanently delete this link?")) {
                return;
            }
            const link_id = button.closest(".link-outer-container").id;
            if (await Api.deleteLink(link_id)) {
                const link_outer_container = button.closest(".link-outer-container");
                const folder_card = button.closest(".folder-card");
                link_outer_container.remove();
            }
        });
    });
}

function folderCardTitleEditButtonHandler() {
    document.querySelectorAll(".folder-title-edit-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const folder_card = button.closest(".folder-card");
            if (Builder.isPanelOpen(button)) {
                Builder.setPanelClosed(button);
            } else {
                Builder.setPanelOpen(button);
            }
            folder_card.querySelector(".accept-card-title-btn").classList.toggle("hidden");
            folder_card.querySelector(".folder-card-title").classList.toggle("hidden");
            folder_card.querySelector(".card-title-form").classList.toggle("hidden");
            const card_title = Builder.getFolderCardName(folder_card);
            folder_card.querySelector(".card-title-form-input").value = card_title;
        });
    });
}

function folderCardTitleEditAcceptButtonHandler() {
    document.querySelectorAll(".folder-card").forEach((folder_card) => {
        if (Builder.getFolderCardName(folder_card) === "uncategorized") {
            return;
        }
        const accept_card_title_button = folder_card.querySelector(".accept-card-title-btn");
        accept_card_title_button.addEventListener("mouseenter", () => {
            accept_card_title_button.closest(".folder-card").querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        accept_card_title_button.addEventListener("mouseleave", () => {
            accept_card_title_button.closest(".folder-card").querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        accept_card_title_button.addEventListener("click", async () => {
            const folder_card = accept_card_title_button.closest(".folder-card");
            const current_title = Builder.getFolderCardName(folder_card);
            const new_title = folder_card.querySelector(".card-title-form-input").value;
            if (current_title === new_title) {
                return;
            }
            const full_card_title = folder_card.querySelector(".folder-card-title").textContent;
            await Api.updateFolderTitle(current_title, new_title);
            Builder.setFolderCardName(folder_card, new_title);
            const num_links = folder_card.dataset.link_count;
            folder_card.querySelector(".folder-card-title").textContent = `📁 ${new_title} (${num_links})`;
            folder_card.querySelector(".folder-title-edit-btn").click();
            folder_card.querySelector(".card-title-form").submit();
        });
    });
}

function createLinkButtonHandler() {
    const add_link_btn = document.getElementById("add-link-btn");
    add_link_btn.addEventListener("click", (e) => {
        if (!Builder.isPanelOpen(add_link_btn)) {
            Builder.setPanelOpen(add_link_btn);
            add_link_btn.classList.add("add-link-btn-open");
            add_link_btn.classList.remove("add-link-btn-closed");
            add_link_btn.textContent = "Cancel";
            const add_link_container = document.getElementById("add-link-form-container");
            add_link_container.style.display = "block";
            add_link_container.querySelector("#folder-select").value = "none";
            add_link_container.querySelector("#folder-name").value = "";
        } else {
            Builder.setPanelClosed(add_link_btn);
            add_link_btn.classList.add("add-link-btn-closed");
            add_link_btn.classList.remove("add-link-btn-open");
            add_link_btn.innerHTML = '<span style="font-size: 20px; padding-right: 5px;">+</span> Add Link';
            const folder_creation_container = document.querySelector(".folder-creation-container");
            if (!folder_creation_container.classList.contains("hidden")) {
                folder_creation_container.classList.toggle("hidden");
            }
            const add_link_container = document.getElementById("add-link-form-container");
            add_link_container.style.display = "none";
        }
    });
    addFolderCreationFieldHandler();
}

function addFolderCreationFieldHandler() {
    const folder_select = document.getElementById("folder-select");
    folder_select.addEventListener("change", (e) => {
        if (e.target.value === "new-folder") {
            Builder.showFolderCreationDiv();
        }
        else {
            Builder.hideFolderCreationDiv();
        }
    });
}

function signOutButtonHandler() {
    const sign_out_btn = document.getElementById("sign-out-btn");
    sign_out_btn.addEventListener("click", (e) => {
        Builder.disableSignOutBtn(sign_out_btn);
        localStorage.removeItem("login_email");
        localStorage.removeItem("token");
        localStorage.removeItem("userID");
        window.location.href = "../../index.html";
    });
}

function linkCreationFormHandler() {
    const add_link_form = document.getElementById("add-link-form");
    add_link_form.addEventListener("submit", async (e) => {
        e.preventDefault();
        Builder.disableSubmitBtn();
        const link = {}
        link.url = document.getElementById("link-url").value.trim();
        link.title = document.getElementById("link-name").value.trim();
        const link_tags = document.getElementById("link-tags").value;
        if (!link.url || !link.title) {
            showError("Link name and URL are required");
            Builder.enableSubmitBtn();
            return;
        }
        let tags = [];
        if (link_tags && link_tags !== "") {
            tags = link_tags.split(",");
        }
        const folder_select = document.getElementById("folder-select");
        if (folder_select.value === "new-folder") {
            const folder_name = document.getElementById("folder-name");
            tags.push(`folder:${folder_name.value}`);
        }
        link.tags = tags;
        const new_link = await Api.createLink(link);
        if (new_link === null) {
            showError("Internal server error");
            Builder.enableSubmitBtn();
            return;
        }
        Builder.buildNewLink(new_link);
        document.getElementById("add-link-btn").click();
        Builder.resetLinkCreationForm();
        Builder.enableSubmitBtn();
        location.reload();
    });
}

function linkExpanderHandler() {
    document.querySelectorAll(".link-expander").forEach((chevron) => {
        chevron.addEventListener("click", (e) => {
            e.stopPropagation();
            const regular = chevron.closest(".link-outer-container").querySelector(".link-container");
            regular.classList.toggle("hidden");
            const expanded = chevron.closest(".link-outer-container").querySelector(".link-container-expanded");
            expanded.classList.toggle("hidden");
        });
    });
}

function drawerHandleHandler() {
    document.querySelectorAll(".drawer-handle").forEach((handle) => {
        handle.addEventListener("click", () => {
            const arrow = handle.querySelector(`.drawer-arrow`);
            arrow.classList.toggle("drawer-arrow-flipped");
            const link_bin = handle.closest(".folder-card").querySelector(".link-bin");
            link_bin.classList.toggle("hidden");
        });
    });
}

function showError(message) {
    alert(message);
}