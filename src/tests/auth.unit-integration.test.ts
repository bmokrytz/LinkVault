import app from "../app";
import request from 'supertest';
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../lib/email";
import pool from "../db/pool";
import * as TestHelpers from "./test-helpers";

jest.mock("../lib/email");
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;

const test_email = process.env.TEST_DB_USER_EMAIL as string;
const test_password = process.env.TEST_DB_USER_PASSWORD as string;

describe('Testing All Auth Router Endpoints', () => {
    /*  Test Cases
    *   1. successful registration
    *   2. empty email string
    *   3. no email in request body
    *   4. empty password string
    *   5. no password in request body
    *   6. invalid password (less that 8 characters)
    *   7. existing user conflict
    *   8. database error
    *   9. error sending verification email
    */

    afterAll(async () => {
        await pool.end();
    });

    describe('Testing - POST /auth/register', () => {
        afterEach(async () => {
            mockSendVerificationEmail.mockClear();
            await TestHelpers.removeTestUserFromDB();
        });

        // 1. successful registration
        test('POST /auth/register - Case 1 - With valid input should return 201 with a verification email message (mocked email service)', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(201);
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual(`${test_email}`);
            expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
        });
        // 2. empty email string
        test('POST /auth/register - Case 2 - With empty email input should return 400 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ password: test_password });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 3. no email in request body
        test('POST /auth/register - Case 3 - With no email input should return 400 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ email: "", password: test_password });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 4. empty password string
        test('POST /auth/register - Case 4 - With empty password input should return 400 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: "" });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 5. no password in request body
        test('POST /auth/register - Case 5 - With no password input should return 400 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 6. invalid password (less that 8 characters)
        test('POST /auth/register - Case 6 - With password less than 8 characters should return 400 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: "passw" });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Password must be at least 8 characters");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 7. existing user conflict
        test('POST /auth/register - Case 7 - With existing user email should return 409 with error message', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const response_1 = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response_1.status).toEqual(201);
            expect(response_1.body.message).not.toBeUndefined();
            expect(response_1.body.message).toEqual(`${test_email}`);
            expect(mockSendVerificationEmail).toHaveBeenCalled();

            mockSendVerificationEmail.mockClear();
            const response_2 = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response_2.status).toEqual(409);
            expect(response_2.body.error).not.toBeUndefined();
            expect(response_2.body.error).toEqual("Email already in use");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
        });
        // 8. database error
        test('POST /auth/register - Case 8 - With database error should return 500 internal server error', async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValueOnce(new Error("Database connection failed!") as never);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");
            expect(mockSendVerificationEmail).not.toHaveBeenCalled();
            poolQuerySpy.mockRestore();
        });
        // 9. error sending verification email
        test('POST /auth/register - Case 9 - With error while sending verification email should return 500 internal server error', async () => {
            mockSendVerificationEmail.mockReturnValue(false);

            const response = await request(app)
                .post('/auth/register')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");
            expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
        });
    });

    describe('Testing - GET /auth/verify/:verification_token', () => {
        /*  Test Cases
        *   1. missing token
        *   2. invalid token
        *   3. expired token
        *   4. database error
        *   5. successful verification
        */

        // 1. missing token
        test('GET /auth/verify/:verification_token - Case 1 - With missing token should return 404', async () => {
            const response = await request(app)
                .get(`/auth/verify/`);
            expect(response.status).toEqual(404);
        });
        // 2. invalid token
        test('GET /auth/verify/:verification_token - Case 2 - With invalid token should return 400 with error message', async () => {
            const invalid_token = "this_is_an_invalid_token";
            const response = await request(app)
                .get(`/auth/verify/${invalid_token}`);
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid verification token. Sign in again to request a new verification email.");
        });
        // 3. expired token
        test('GET /auth/verify/:verification_token - Case 3 - With expired token should return 400 with error message', async () => {
            await TestHelpers.addTestUserToDB();
            const verification_token = await TestHelpers.generateEmailValidationToken();
            const token_expiry_time = new Date(Date.now() - (1000 * 60 * 60 * 24)); // Expired by 24 hours
            try {
                await pool.query(
                    `UPDATE users
                    SET verification_token_expires=$1`,
                    [token_expiry_time]
                );
            } catch (err) {
                console.error(err);
            }
            const response = await request(app)
                .get(`/auth/verify/${verification_token}`);
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Verification token expired. Sign in again to request a new verification email.")
            
            await TestHelpers.removeTestUserFromDB();
        });
        // 4. database error
        test('GET /auth/verify/:verification_token - Case 4 - With database error should return 500 internal server error', async () => {
            await TestHelpers.addTestUserToDB();
            const verification_token = await TestHelpers.generateEmailValidationToken();

            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .get(`/auth/verify/${verification_token}`);
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");
            
            poolQuerySpy.mockRestore();
            await TestHelpers.removeTestUserFromDB();
        });
        // 5. successful verification
        test('GET /auth/verify/:verification_token - Case 5 - With valid token should return 200 with thank you message', async () => {
            await TestHelpers.addTestUserToDB();
            const verification_token = await TestHelpers.generateEmailValidationToken();

            const response = await request(app)
                .get(`/auth/verify/${verification_token}`);
            expect(response.status).toEqual(200);
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual("Thank you for verifying your account. You may sign into LinkVault now.");

            await TestHelpers.removeTestUserFromDB();
        });
    });

    describe('Testing - POST /auth/verify/resend', () => {
        /*  Test Cases
        *   1. no authorization header
        *   2. invalid authorization header format
        *   3. invalid verification email JWT
        *   4. expired verification email JWT
        *   5. verification email JWT missing email in payload
        *   6. invalid email in verification email JWT payload
        *   7. database error
        *   8. error sending verification email
        *   9. successfully resend verification email
        */

        beforeEach(async () => {
            mockSendVerificationEmail.mockReturnValue(true);
            await TestHelpers.addTestUserToDB();
        });

        afterEach(async () => {
            mockSendVerificationEmail.mockClear();
            await TestHelpers.removeTestUserFromDB();
        });

        // 1. no authorization header
        test('POST /auth/verify/resend - Case 1 - With no authorization header should return 401 with error message', async () => {
            const response = await request(app)
                .post('/auth/verify/resend')
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 2. invalid authorization header format
        test('POST /auth/verify/resend - Case 2 - With invalid authorization header format should return 401 with error message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `baeer ${verification_email_token}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 3. invalid verification email JWT
        test('POST /auth/verify/resend - Case 3 - With invalid JWT should return 401 with error message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, "invalid_jwt_secret", { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid token");
        });
        // 4. expired verification email JWT
        test('POST /auth/verify/resend - Case 4 - With expired JWT should return 401 with error message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "-15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Expired token");
        });
        // 5. verification email JWT missing email in payload
        test('POST /auth/verify/resend - Case 5 - With no email in JWT payload should return 500 internal server error', async () => {
            const verification_email_token = jwt.sign( {  }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual(`No LinkVault account associated with the email undefined has been found.`);
        });
        // 6. invalid email in verification email JWT payload
        test('POST /auth/verify/resend - Case 6 - With invalid email in JWT payload should return 500 internal server error', async () => {
            const invalid_email = "invalid_test_email_1234599";
            const verification_email_token = jwt.sign( { email: invalid_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual(`No LinkVault account associated with the email ${invalid_email} has been found.`);
        });
        // 7. database error
        test('POST /auth/verify/resend - Case 7 - With database error should return 500 internal server error', async () => {
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");
            poolQuerySpy.mockRestore();
        });
        // 8. error sending verification email
        test('POST /auth/verify/resend - Case 8 - With error sending verification email should return 500 internal server error', async () => {
            mockSendVerificationEmail.mockReturnValue(false);
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");
        });
        // 9. successfully resend verification email
        test('POST /auth/verify/resend - Case 9 - With successfully resend verification email should return 200 with success message', async () => {
            const verification_email_token = jwt.sign( { email: test_email }, process.env.JWT_SECRET!, { expiresIn: "15m" } );
            const response = await request(app)
                .post('/auth/verify/resend')
                .set('authorization', `Bearer ${verification_email_token}`);
            expect(response.status).toEqual(200);
            expect(response.body.message).not.toBeUndefined();
            expect(response.body.message).toEqual("Verification email sent");
        });
        
    });

    describe('Testing - POST /auth/login', () => {
        /*  Test Cases
        *   1. no email in request body
        *   2. empty email string
        *   3. no password in request body
        *   4. empty password string
        *   5. no user found
        *   6. invalid credentials
        *   7. user unverified, token has not expired
        *   8. user unverified, token has expired
        *   9. database error
        *   10. successful login
        */

        beforeEach(async () => {
            await TestHelpers.addTestUserToDB();
        });

        afterEach(async () => {
            await TestHelpers.removeTestUserFromDB();
        });

        // 1. no email in request body
        test('POST /auth/login - Case 1 - With no email in request body should return 400 with error message', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ password: test_password });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
        });
        // 2. empty email string
        test('POST /auth/login - Case 2 - With empty email string should return 400 with error message', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: "", password: test_password });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
        });
        // 3. no password in request body
        test('POST /auth/login - Case 3 - With no password in request body should return 400 with error message', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
        });
        // 4. empty password string
        test('POST /auth/login - Case 4 - With empty password string should return 400 with error message', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: "" });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Email and password are required");
        });
        // 5. no user found
        test('POST /auth/login - Case 5 - With no user found should return 400 with error message', async () => {
            const invalid_test_email = "invalid_test_email_12345999";
            const response = await request(app)
                .post('/auth/login')
                .send({ email: invalid_test_email, password: test_password });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid credentials");
        });
        // 6. invalid credentials
        test('POST /auth/login - Case 6 - With invalid credentials should return 400 with error message', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: "wrong_password" });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid credentials");
        });
        // 7. user unverified, token has not expired
        test('POST /auth/login - Case 7 - With user unverified, token has not expired should return 400 with error message', async () => {
            await TestHelpers.generateEmailValidationToken();
            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(403);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Your email has not yet been verified. Please check your inbox for our email verification link.");
            expect(response.body.verification_email_token).not.toBeUndefined();
        });
        // 8. user unverified, token has expired
        test('POST /auth/login - Case 8 - With user unverified, token has expired should return 400 with error message', async () => {
            await TestHelpers.generateEmailValidationToken();
            const token_expiry_time = new Date(Date.now() - (1000 * 60 * 60 * 24)); // Expired by 24 hours

            try {
                const result = await pool.query(
                    `UPDATE users
                    SET verification_token_expires = $1
                    WHERE email = $2`,
                    [token_expiry_time, test_email]
                );
            } catch (err) {
                console.error(err);
            }

            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(403);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("The verification link we sent to your email has expired. Please request a new one and verify your email to register your account.");
            expect(response.body.verification_email_token).not.toBeUndefined();
        });
        // 9. database error
        test('POST /auth/login - Case 9 - With database error should return 500 internal server error', async () => {
            await TestHelpers.generateEmailValidationToken();

            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .post('/auth/login')
                .send({ email: test_email, password: test_password });
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 10. successful login
        test('POST /auth/login - Case 10 - With successful login should return 200', async () => {
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
