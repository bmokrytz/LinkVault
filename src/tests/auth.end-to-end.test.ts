import app from "../app";
import request from 'supertest';
import jwt from "jsonwebtoken";
import pool from "../db/pool";
import * as TestHelpers from "./test-helpers";


const test_email = process.env.TEST_DB_USER_EMAIL as string;
const test_password = process.env.TEST_DB_USER_PASSWORD as string;

describe('Auth Router End to End Testing', () => {
    afterAll(async () => {
        await pool.end();
    });

    describe('End to End Test - POST /auth/register', () => {
        beforeAll(async () => {
            await TestHelpers.addTestUserToDB();
        });

        afterAll(async () => {
            await TestHelpers.removeTestUserFromDB();
        });
        
        test('POST /auth/register - Success should return 201 with success message', async () => {
            await TestHelpers.removeTestUserFromDB();
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(201);
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual(`${test_email}`);
        });
    });

    describe('End to End Test - GET /auth/verify/:verification_token', () => {
        beforeAll(async () => {
            await TestHelpers.addTestUserToDB();
        });

        afterAll(async () => {
            await TestHelpers.removeTestUserFromDB();
        });

        test('GET /auth/verify/:verification_token - Success should return 200 with success message', async () => {
            const verification_token = await TestHelpers.generateEmailValidationToken();

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
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual("Thank you for verifying your account. You may sign into LinkVault now.");
        });
    });

    describe('End to End Test - POST /auth/verify/resend', () => {
        beforeAll(async () => {
            await TestHelpers.addTestUserToDB();
        });

        afterAll(async () => {
            await TestHelpers.removeTestUserFromDB();
        });

        test('POST /auth/verify/resend - Success should return 200 with success message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );

            const response = await request(app)
                .post('/auth/verify/resend')
                .set("authorization", `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(200);
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual("Verification email sent");
        });
    });

    describe('End to End Test - POST /auth/login', () => {
        beforeAll(async () => {
            await TestHelpers.addTestUserToDB();
        });

        afterAll(async () => {
            await TestHelpers.removeTestUserFromDB();
        });

        test('POST /auth/login - Success should return 200 with auth token and user object', async () => {
            const verification_token = await TestHelpers.generateEmailValidationToken();

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
