import app from "../app";
import bcrypt from "bcryptjs";
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import pool from "../db/pool";

const test_tags = ["folder:TEST", "tag1", "tag2", "tag3"];

export async function generateEmailValidationToken(): Promise<string> {
    const test_email = process.env.TEST_DB_USER_EMAIL as string;
    const verification_token: string = randomUUID();
    const token_expiry_time = new Date(Date.now() + (1000 * 60 * 60 * 24)); // 24 hours
    try {
        await pool.query(
            `UPDATE users
            SET verification_token = $1, verification_token_expires = $2
            WHERE email = $3`,
            [verification_token, token_expiry_time, test_email]
        );
    } catch(err) {
        console.error(err);
    }
    return verification_token;
}

export async function addTestUserToDB(): Promise<void> {
    const test_email = process.env.TEST_DB_USER_EMAIL as string;
    const test_password = process.env.TEST_DB_USER_PASSWORD as string;
    const password_hash = await bcrypt.hash(test_password, 12);
    try {
        await pool.query(
            `INSERT INTO users
            (email, password_hash, verification_token, verification_token_expires)
            VALUES ($1, $2, $3, $4)`,
            [test_email, password_hash, null, null],
        );
    } catch(err) {
        console.error(err);
    }
}

export async function removeTestUserFromDB(): Promise<void> {
    const test_email = process.env.TEST_DB_USER_EMAIL as string;
    try {
        await pool.query(
            `DELETE FROM users
            WHERE email=$1
            RETURNING id;`,
            [test_email],
        );
    } catch(err) {
        console.error(err);
    }
}

export async function loginAsTestUser(): Promise<string> {
    const test_email = process.env.TEST_DB_USER_EMAIL! as string;
    const test_password = process.env.TEST_DB_USER_PASSWORD! as string;
    const response = await request(app)
        .post('/auth/login')
        .send({ email: test_email, password: test_password });
    const token: string = response.body.token;
    return token;
}

export async function removeTestUserBookmarks(userID: number): Promise<void> {
    try {
        await pool.query(
            `DELETE FROM bookmarks
            WHERE user_id = $1`,
            [userID]
        );
    } catch (err) {
        console.error(err);
    }
}

export async function addMultipleTestBookmarksToDB(auth_token: string): Promise<void> {
    await request(app)
        .post('/bookmarks')
        .set('authorization', `Bearer ${auth_token}`)
        .send({ url: "www.test_url_2.com", title: "Test bookmark 2", tags: test_tags });
    await request(app)
        .post('/bookmarks')
        .set('authorization', `Bearer ${auth_token}`)
        .send({ url: "www.test_url_3.com", title: "Test bookmark 3", tags: test_tags });
    await request(app)
        .post('/bookmarks')
        .set('authorization', `Bearer ${auth_token}`)
        .send({ url: "www.test_url_4.com", title: "Test bookmark 4" });
}

export async function addSingleTestBookmarkToDB(auth_token: string): Promise<number> {
    const test_email = process.env.TEST_DB_USER_EMAIL! as string;
    const test_password = process.env.TEST_DB_USER_PASSWORD! as string;
    const response = await request(app)
        .post('/bookmarks')
        .set('authorization', `Bearer ${auth_token}`)
        .send({ url: "www.test_url_1.com", title: "Test bookmark 1", tags: test_tags });
    const bookmark_id = response.body.bookmark!.id;
    return bookmark_id;
}
