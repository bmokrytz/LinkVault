export async function verify() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/verify/${token}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
            return data.error;
        }
        return data.message;
    } catch {
        alert("Internal server error")
    }
}