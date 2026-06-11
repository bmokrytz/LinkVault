import type { User, VerificationTokenPayload } from '../types/index';
import { CONFIG } from '../../config';

export async function login(email: string, password: string): Promise<User | VerificationTokenPayload | null> {
    try {
        const result = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!result.ok) {
            if (result.status === 403) {
                const payload: VerificationTokenPayload = await result.json();
                return payload;
            }
            return null;
        }
        const data = await result.json();
        const user: User = { id: data.user.id, email: data.user.email, token: data.token };
        return user;
    } catch (error) {
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
            return null;
        }
        const data = await result.json();
        return data.message;
    } catch (error) {
        return null;
    }
}

export async function verify(token: string): Promise<string | null> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/verify/${token}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
            const data = await res.json();
            const error_message: string | undefined = data.error;
            if (error_message !== undefined) {
                return error_message;
            }
            return null;
        }
        return null;
    } catch (error) {
        return null;
    }
}

export async function resendVerification(token: string): Promise<string | null> {
    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/auth/verify/resend/`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
             }
        });
        if (!res.ok) {
            const data = await res.json();
            const error_message: string | undefined = data.error;
            if (error_message !== undefined) {
                return error_message;
            }
            return null;
        }
        return "200";
    } catch (error) {
        return null;
    }
}
