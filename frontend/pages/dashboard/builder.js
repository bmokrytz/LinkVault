const folderNames = new Map();
const openPanels = new Set();

const folder_card_template = document.createElement("template");
folder_card_template.innerHTML = `
    <div class="folder-card">
        <div class="folder-card-header-container">
            <div class="folder-card-title-container">
                <span class="folder-card-title"></span>
                <form class="card-title-form hidden">
                    <input class="card-title-form-input"></input>
                </form>
                <button class="folder-title-edit-btn hidden"><span class="material-symbols-outlined folder-title-edit-btn-icon">edit</span></button>
                <button class="accept-card-title-btn hidden"><span class="material-symbols-outlined accept-card-title-icon">check</span></button>
            </div>
            <div class="folder-card-header-buttons-container">
                <button class="open-all-links-btn"><span class="open-all-links-span">Open All </span><span class="open-all-links-icon material-symbols-outlined">arrow_outward</span></button>
                <button class="folder-card-settings-btn"><span class="material-symbols-outlined">settings</span></button>
            </div>
        </div>
        <div class="link-bin">
        </div>
        <div class="drawer-handle">
            <p class="drawer-arrow">&#x25BE;</p>
        </div>
    </div>
    `;

const link_template = document.createElement("template");
link_template.innerHTML = `
    <div class="link-outer-container blue-outline-hover">
        <div class="link-container">
            <span class="link-title"></span>
            <div class="link-container-right">
                <span class="link-url"></span>
                <div class="tags-container">
                </div>
                <span class="link-expander">&#x276F;</span>
            </div>
        </div>
        <div class="link-container-expanded hidden">
            <span class="link-title-expanded"></span>
            <div class="link-container-right-expanded">
                <span class="link-url-expanded"></span>
                <div class="tags-container-expanded">
                </div>
                <span class="link-expander expanded">&#x276F;</span>
            </div>
        </div>
        <div class="link-edit-form-container hidden">
            <form class="link-edit-form">
                <input class="edit-form-id" style="display: none;"></input>
                <label>Link name:</label>
                <label>URL:</label>
                <label>Folder:</label>
                <label class="edit-form-new-folder-name-label hidden">Folder name:</label>
                <label>Tags (comma separated):</label>
                <input type="text" class="edit-form-title-input"></input>
                <input type="text" class="edit-form-url-input"></input>
                <select class="edit-form-folder-select">
                    <option value="none">None</option>
                    <option value="new-folder">Create new folder</option>
                </select>
                <input type="text" class="edit-form-new-folder-name-input hidden"></input>
                <input type="text" class="edit-form-tags-input" placeholder="tag1,tag2,tag3"></input>
            </form>
            <button class="material-symbols-outlined accept-card-title-btn" style="height: 35px; align-self: center; margin-left: 10px;">
                <span class="material-symbols-outlined accept-card-title-icon">check</span>
            </button>
        </div>
        <div class="link-buttons-container hidden">
            <button class="edit-link-btn">
                <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="delete-link-btn">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
    `;

const tag_template = document.createElement("template");
tag_template.innerHTML = `
    <div class="tag">
        <p></p>
    </div>
    `;

export function getFolderCardName(folder_card) {
    return folderNames.get(folder_card);
}

export function getAllFolderCardNames() {
    return [...folderNames.values()];
}

export function isPanelOpen(panel) {
    return openPanels.has(panel);
}

export function setPanelOpen(panel) {
    openPanels.add(panel);
}

export function setPanelClosed(panel) {
    openPanels.delete(panel);
}


// Building links
export function injectLinks(links) {
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
    setLinkCountDisplay();
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

function insertLinkIntoFolder(link, folder) {
    const folder_card = document.getElementById(`folder:${folder}`);
    const link_bin = folder_card.querySelector(`.link-bin`);
    const link_outer_container = buildLink(link);
    link_outer_container.dataset.link = link;
    link_bin.appendChild(link_outer_container);
}

function buildFolderCards(folder_names) {
    const root = document.getElementById("root");
    folder_names.forEach((folder_name) => {
        if (folder_name === "uncategorized") {
            return;
        }
        const fragment = folder_card_template.content.cloneNode(true);
        const folder_card = fragment.querySelector(".folder-card");
        folder_card.setAttribute('id', `folder:${folder_name}`);
        folderNames.set(folder_card, folder_name);
        folder_card.querySelector(".folder-card-title").textContent = `📁 ${folder_name}`;
        root.appendChild(folder_card);
    });
}

function buildLink(link) {
    const fragment = link_template.content.cloneNode(true);
    const link_outer_container = fragment.querySelector(".link-outer-container");
    link_outer_container.setAttribute("id", link.id);
    setLinkTitle(link_outer_container, link.title);
    setLinkUrl(link_outer_container, link.url);
    buildLinkTags(link_outer_container, link.tags);
    setupLinkEditForm(link_outer_container, link);
    return link_outer_container;
}

function setupLinkEditForm(link_outer_container, link) {
    link_outer_container.dataset.link_id = link.id;
    link_outer_container.dataset.link_title = link.title;
    link_outer_container.dataset.link_url = link.url;
    const current_folder_name = getFolderCardName(link_outer_container.closest(".folder-card"));
    getAllFolderCardNames().forEach((name) =>{
        console.log("name: ", name);
    });
    if (current_folder_name === "uncategorized") {
        link_outer_container.querySelector(".edit-form-folder-select").dataset.default_value = "none";
        link_outer_container.querySelector(".edit-form-folder-select").value = "none";
    } else {
        link_outer_container.querySelector(".edit-form-folder-select").dataset.default_value = current_folder_name;
        link_outer_container.querySelector(".edit-form-folder-select").value = current_folder_name;
    }
    if (link.tags.length !== 0) {
        let tags_string = "";
        link.tags.forEach((tag) => {
            if (tags_string === ""){
                tags_string += `${tag}`;
            } else {
                tags_string += `,${tag}`;
            }
        });
        link_outer_container.querySelector(".edit-form-tags-input").value = tags_string;
    }
    getAllFolderCardNames().forEach((folder_name) => {
        const select_option = document.createElement("select");
        if (folder_name !== "uncategorized") {
            select_option.value = folder_name;
            select_option.textContent = folder_name;
        }
        link_outer_container.querySelector(".edit-form-folder-select").appendChild(select_option);
    });
}

function buildLinkTags(link_outer_container, tags_list) {
    const link_container = link_outer_container.querySelector(".link-container");
    const link_container_expanded = link_outer_container.querySelector(".link-container-expanded");
    const tags_container = link_container.querySelector(".tags-container");
    if (tags_list.length > 6) {
        tags_list.slice(0, 6).forEach((link_tag) => {
            const fragment = tag_template.content.cloneNode(true);
            const tag = fragment.querySelector(".tag");
            tag.querySelector("p").textContent = link_tag;
            tags_container.appendChild(tag);
        });
    } else {
        tags_list.forEach((link_tag) => {
            const fragment = tag_template.content.cloneNode(true);
            const tag = fragment.querySelector(".tag");
            tag.querySelector("p").textContent = link_tag;
            tags_container.appendChild(tag);
            const link_container_right = link_container.querySelector(".link-container-right");
        });
    }
    const tags_container_expanded = link_container_expanded.querySelector(".tags-container-expanded");
    tags_list.forEach((link_tag) => {
        const fragment = tag_template.content.cloneNode(true);
        const tag = fragment.querySelector(".tag");
        tag.querySelector("p").textContent = link_tag;
        tags_container_expanded.appendChild(tag);
    });
}


function setLinkTitle(link_outer_container, title) {
    link_outer_container.querySelector(".link-title").textContent = title;
    link_outer_container.querySelector(".link-title-expanded").textContent = title;
}

function setLinkUrl(link_outer_container, URL) {
    link_outer_container.querySelector(".link-url").textContent = URL;
    link_outer_container.querySelector(".link-url-expanded").textContent = URL;
}

function setLinkTagsInputText(link_outer_container, link) {
    const tags = link.tags;
    const link_tags_input = link_outer_container.querySelector(".edit-form-tags-input");
    let link_tags_input_text = "";
    link.tags.forEach((tag) => {
        if (link_tags_input_text !== "") {
            link_tags_input_text += `,${tag}`;
        } else{
            link_tags_input_text += `${tag}`;
        }
    });
    link_tags_input.value = link_tags_input_text;
    link_outer_container.dataset.link_tags = link_tags_input.value;
}

function setLinkCountDisplay() {
    const folder_cards = document.querySelectorAll(".folder-card");
    folder_cards.forEach((folder_card) => {
        const num_links = folder_card.querySelectorAll(".link-outer-container").length;
        const folder_card_title = folder_card.querySelector(".folder-card-title");
        folder_card_title.textContent += ` (${num_links})`;
    });
}