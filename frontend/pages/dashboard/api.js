// Error message functionality
function showError(message) {
    alert(message);
}

// Fetch the user's links from database
export async function fetchLinks(token) {
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

export async function editLink(link, link_id) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/bookmark/${link_id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(link),
        });
    } catch(err) {
        showError("Internal server error");
    }
}

export async function deleteLink(link_id) {
    try {
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
            return false;
        }
        return true;
    } catch(err) {
        showError("Internal server error.");
    }
}

export async function updateFolderTitle(old_title, new_title) {
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