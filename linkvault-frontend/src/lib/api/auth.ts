import type { User } from '../types/index';
import { CONFIG } from '../../config';

export async function login(email: string, password: string): Promise<User | null> {
    try {
        const result = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!result.ok) {
            alert("Login failed");
            return null;
        }
        const data = await result.json();
        const user: User = { id: data.id as number, email: data.email as string, token: data.token as string };
        return user;
    } catch (error) {
        alert("Login failed");
        return null;
    }
};

export async function register(email: string, password: string): Promise<string | null> {
    try {
        const result = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!result.ok) {
            alert("Account creation failed. Try again.");
            return null;
        }
        const data = await result.json();
        return data.message;
    } catch (error) {
        return null;
    }
}