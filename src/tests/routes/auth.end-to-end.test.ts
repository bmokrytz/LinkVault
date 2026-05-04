import app from "../../app";
import request from 'supertest';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from 'node:crypto';
import pool from "../../db/pool";


const test_email = process.env.TEST_DB_USER_EMAIL as string;
const test_password = process.env.TEST_DB_USER_PASSWORD as string;

describe('Auth Router End to End Testing', () => {
    afterAll(async () => {
        await pool.end();
    });

    describe('End to End Test - POST /auth/register', () => {
        beforeAll(async () => {
            await addTestUserToDB();
        });

        afterAll(async () => {
            await removeTestUserFromDB();
        });
        
        test('POST /auth/register - Success should return 201 with success message', async () => {
            await removeTestUserFromDB();
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(201);
            expect(response.body.message).toEqual(`A verification email has been sent to ${test_email}.\nPlease check your inbox for a verification link.`);
        });
    });

    describe('End to End Test - GET /auth/verify/:verification_token', () => {
        beforeAll(async () => {
            await addTestUserToDB();
        });

        afterAll(async () => {
            await removeTestUserFromDB();
        });

        test('GET /auth/verify/:verification_token - Success should return 200 with success message', async () => {
            const verification_token = await generateEmailValidationToken();

            await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });

            try {
                await pool.query(
                    `UPDATE users
                    SET verification_token = $1
                    WHERE email = $2`,
                    [verification_token, test_email]
                );
            } catch (err) {
                console.error(err);
            }

            const response = await request(app)
                .get(`/auth/verify/${verification_token}`);
            expect(response.status).toEqual(200);
            expect(response.body.message).toEqual("Thank you for verifying your account. You may sign into LinkVault now.");
        });
    });

    describe('End to End Test - POST /auth/verify/resend', () => {
        beforeAll(async () => {
            await addTestUserToDB();
        });

        afterAll(async () => {
            await removeTestUserFromDB();
        });

        test('POST /auth/verify/resend - Success should return 200 with success message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );

            const response = await request(app)
                .post('/auth/verify/resend')
                .set("authorization", `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(200);
            expect(response.body.message).toEqual("Verification email sent");
        });
    });

    describe('End to End Test - POST /auth/login', () => {
        beforeAll(async () => {
            await addTestUserToDB();
        });

        afterAll(async () => {
            await removeTestUserFromDB();
        });

        test('POST /auth/login - Success should return 200 with auth token and user object', async () => {
            const verification_token = await generateEmailValidationToken();

            await request(app)
                .get(`/auth/verify/${verification_token}`);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(200);
            expect(response.body.token).not.toBeUndefined();
            expect(response.body.user).not.toBeUndefined();
            expect(response.body.user.id).not.toBeUndefined();
            expect(response.body.user.email).not.toBeUndefined();
            expect(response.body.user.email).toEqual(test_email);
        });
    });
});


async function generateEmailValidationToken(): Promise<string> {
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

async function addTestUserToDB(): Promise<void> {
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

async function removeTestUserFromDB(): Promise<void> {
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
