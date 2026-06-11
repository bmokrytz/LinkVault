import type { Bookmark } from '../types';
import { CONFIG } from '../../config';

export async function fetchLinks(token: string): Promise<Array<Bookmark>> {
    try {
        const result = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if (!result.ok) {
            return [];
        }
        const data = await result.json();
        const bookmarks: Array<Bookmark> = data.bookmarks;
        return bookmarks;
    } catch (error) {
        return [];
    }
}

export async function deleteLink(token: string, link_id: string): Promise<boolean> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/${link_id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        });
        if (!res.ok) {
            return false;
        }
        return true;
    } catch(err) {
        return false;
    }
}

export async function createLink(token: string, url: string, title: string, tags: Array<string> | null): Promise<Bookmark | null> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                },
            body: JSON.stringify({ url, title, tags }),
        });
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        return data.bookmark;
    } catch (err) {
        return null;
    }
}

export async function editLink(link_id: string, token: string, title?: string, url?: string, tags?: string): Promise<Bookmark | null> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/bookmark/${link_id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, url, tags: tags?.split(",") }),
        });
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        const bookmark = data.bookmark;
        return bookmark;
    } catch(err) {
        return null;
    }
}

export async function updateFolderTitle(token: string, old_title: string, new_title: string): Promise<boolean> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/bookmarks/folder`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
                },
            body: JSON.stringify({ old_folder: old_title, new_folder: new_title }),
        });
        if (!res.ok) {
            return false;
        }
        return true;
    } catch (err) {
        return false;
    }
}
