import * as Builder from "./builder.js";

export function addLinkHandlers() {
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
        const link_edit_accept_btn = link_outer_container.querySelector(".link-edit-form-container").querySelector(".accept-card-title-btn");
        link_edit_accept_btn.addEventListener("mouseenter", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        })
        link_edit_accept_btn.addEventListener("mouseleave", () => {
            link_edit_accept_btn.querySelector(".accept-card-title-icon").classList.toggle("green");
        });
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
    // Settings (cog) button action
    const settings_buttons = document.querySelectorAll(".folder-card-settings-btn");
    settings_buttons.forEach((settings_button) => {
        settings_button.addEventListener("click", () => {
            settings_button.closest(".folder-card").classList.toggle("editing");
            settings_button.closest(".folder-card").querySelectorAll(".link-outer-container").forEach((container) => {
                container.classList.toggle("blue-outline-hover");
                const edit_link_btn = container.querySelector(".edit-link-btn");
                if (Builder.isPanelOpen(edit_link_btn)) {
                    edit_link_btn.click();
                }
                container.classList.toggle("hidden");
            });
            const title_edit_btn = settings_button.closest(".folder-card").querySelector("folder-title-edit-btn");
            if (title_edit_btn !== null) {
                if (Builder.isPanelOpen(title_edit_btn)) {
                    title_edit_btn.click();
                }
                title_edit_btn.classList.toggle("hidden");
            }
        });
    });

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

    // Set up link editing buttons
    document.querySelectorAll(".")
        


    
}