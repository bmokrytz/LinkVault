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