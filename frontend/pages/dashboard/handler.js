import * as Builder from "./builder.js";
import * as Api from "./api.js";

export function addLinkHandlers() {
    addLinkClickHandler();
    addFolderCreationHandler();
    addLinkContainerPropagationHandler();
    addFolderCardSettingsButtonHandler();
    addOpenAllLinksButtonHandler();
    addLinkEditButtonHandler();
    addLinkDeleteButtonHandler();
    addFolderCardTitleEditButtonHandler();
    addFolderCardTitleEditAcceptButtonHandler();
}

function addLinkClickHandler() {
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

function addFolderCreationHandler() {
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

function addLinkContainerPropagationHandler() {
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

function addFolderCardSettingsButtonHandler() {
    // Settings (cog) button action
    const settings_buttons = document.querySelectorAll(".folder-card-settings-btn");
    settings_buttons.forEach((settings_button) => {
        settings_button.addEventListener("click", () => {
            settings_button.closest(".folder-card").classList.toggle("editing");
            const title_edit_btn = settings_button.closest(".folder-card").querySelector(".folder-title-edit-btn");
            if (title_edit_btn !== null) {
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
            if (title_edit_btn !== null) {
                if (Builder.isPanelOpen(title_edit_btn)) {
                    title_edit_btn.click();
                }
                title_edit_btn.classList.toggle("hidden");
            }
        });
    });
}

function addOpenAllLinksButtonHandler() {
    // Open all links button
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

function addLinkEditButtonHandler() {
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

function addLinkEditAcceptButtonHandler() {
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
            edit_link_accept_btn.disabled = false;
            link_edit_form.submit();
        });
    });
}

function addLinkDeleteButtonHandler() {
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
                folder_card.remove(link_outer_container);
            }
        });
    });
}

function addFolderCardTitleEditButtonHandler() {
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

function addFolderCardTitleEditAcceptButtonHandler() {
    document.querySelectorAll(".folder-card").forEach((folder_card) => {
        const accept_card_title_button = folder_card.querySelector(".accept-card-title-btn");
        accept_card_title_button.addEventListener("mouseenter", () => {
            accept_card_title_button.closest(".folder-card").querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        accept_card_title_button.addEventListener("mouseleave", () => {
            accept_card_title_button.closest(".folder-card").querySelector(".accept-card-title-icon").classList.toggle("green");
        });
        accept_card_title_button.addEventListener("click", async () => {
            const folder_card = accept_card_title_button.closest(".folder-card");
            const folder_title_edit_btn = folder_card.querySelector(".folder-title-edit-btn");
            folder_title_edit_btn.click();
            const new_title = folder_card.querySelector(".card-title-form-input").value;
            const current_title = Builder.getFolderCardName(folder_card);
            if (new_title === current_title) {
                return;
            }
            const num_links = folder_card_title.innerHTML.slice(folder_card_title_text.indexOf("("), folder_card_title_text.indexOf(")") + 1);
            await Api.updateFolderTitle(current_title, new_title);
            folder_card_title.innerHTML = `📁 ${new_title} ${num_links}`;
        });
    });
}