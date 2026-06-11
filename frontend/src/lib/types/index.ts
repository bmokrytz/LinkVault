export interface User {
    id: string;
    email: string;
    token: string;
}

export interface Bookmark {
    id: string;
    user_id: string;
    url: string;
    title: string;
    tags: Array<string>;
};

export interface VerificationTokenPayload {
    verification_email_token: string;
    error: string;
};
