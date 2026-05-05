import app from "../app";
import jwt from "jsonwebtoken";
import request from 'supertest';
import { sendVerificationEmail } from "../lib/email";
import { AuthPayload } from "../types";
import pool from "../db/pool";
import * as TestHelpers from "./test-helpers";

jest.mock("../lib/email");
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;

let auth_token = null;
let user_id = null;
const test_email = process.env.TEST_DB_USER_EMAIL! as string;
const test_url = "www.test_url_linkvault.com";
const test_title = "Test Bookmark Title";
const test_tags = ["folder:TEST", "tag1", "tag2", "tag3"];

describe('Testing All Bookmarks Router Endpoints', () => {
    beforeAll(async () => {
        mockSendVerificationEmail.mockReturnValue(true);
        await TestHelpers.addTestUserToDB();
        const verification_token = await TestHelpers.generateEmailValidationToken();
        await request(app)
            .get(`/auth/verify/${verification_token}`);
        auth_token = await TestHelpers.loginAsTestUser();
        const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as AuthPayload;
        user_id = decoded.userId;
    });

    afterAll(async () => {
        await TestHelpers.removeTestUserBookmarks(user_id! as number);
        await TestHelpers.removeTestUserFromDB();
        mockSendVerificationEmail.mockClear();
        await pool.end();
    });
    
    describe('Testing - POST /bookmarks', () => {
        /*  Test Cases
        *   1. no url in request body
        *   2. url is empty string
        *   3. no title in request body
        *   4. title is empty string
        *   5. no tags in request body
        *   6. title exceeds 255 characters
        *   7. database error
        *   8. successful bookmark creation
        *   9. no authentication token provided in request header
        *   10. request sent without auth header
        *   11. authentication token expired
        *   12. authentication token invalid
        */

        afterEach(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. no url in request body
        test('POST /bookmarks - Case 1 - With no url in request body should return 400 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ title: test_title, tags: test_tags });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("URL and title are required");
        });
        // 2. url is empty string
        test('POST /bookmarks - Case 2 - With url is empty string should return 400 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: "", title: test_title, tags: test_tags });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("URL and title are required");
        });
        // 3. no title in request body
        test('POST /bookmarks - Case 3 - With no title in request body should return 400 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, tags: test_tags });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("URL and title are required");
        });
        // 4. title is empty string
        test('POST /bookmarks - Case 4 - With title is empty string should return 400 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, title: "", tags: test_tags });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("URL and title are required");
        });
        // 5. no tags in request body
        test('POST /bookmarks - Case 5 - With no tags in request body should return 201 with bookmark object', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, title: test_title });
            expect(response.status).toEqual(201);
            expect(response.body.bookmark).not.toBeUndefined();
            expect(response.body.bookmark.id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).toEqual(user_id! as number);
            expect(response.body.bookmark.url).not.toBeUndefined();
            expect(response.body.bookmark.url).toEqual(test_url);
            expect(response.body.bookmark.title).not.toBeUndefined();
            expect(response.body.bookmark.title).toEqual(test_title);
            expect(response.body.bookmark.tags).not.toBeUndefined();
            expect(response.body.bookmark.tags).toEqual([]);
            expect(response.body.bookmark.created_at).not.toBeUndefined();
            expect(response.body.bookmark.updated_at).not.toBeUndefined();
        });
        // 6. title exceeds 255 characters
        test('POST /bookmarks - Case 6 - With title exceeds 255 characters should return 400 with error message', async () => {
            const test_title_long = `this is a long test title this is a long test title this is a long test title
            this is a long test title this is a long test title this is a long test title
            this is a long test title this is a long test title this is a long test title
            this is a long test title this is a long test title this is a long test title
            this is a long test title this is a long test title this is a long test title
            this is a long test title this is a long test title this is a long test title`;
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, title: test_title_long, tags: test_tags });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Title must be 255 characters or less");
        });
        // 7. database error
        test('POST /bookmarks - Case 7 - With database error should return 500 internal server error', async () => {
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 8. successful bookmark creation
        test('POST /bookmarks - Case 8 - With successful bookmark creation should return 201 with bookmark object', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(201);
            expect(response.body.bookmark).not.toBeUndefined();
            expect(response.body.bookmark.id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).toEqual(user_id! as number);
            expect(response.body.bookmark.url).not.toBeUndefined();
            expect(response.body.bookmark.url).toEqual(test_url);
            expect(response.body.bookmark.title).not.toBeUndefined();
            expect(response.body.bookmark.title).toEqual(test_title);
            expect(response.body.bookmark.tags).not.toBeUndefined();
            expect(response.body.bookmark.tags).toEqual(test_tags);
            expect(response.body.bookmark.created_at).not.toBeUndefined();
            expect(response.body.bookmark.updated_at).not.toBeUndefined();
        });
        // 9. no authentication token provided in request header
        test('POST /bookmarks - Case 9 - With no authentication token provided in request header should return 401 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer `)
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 10. request sent without auth header
        test('POST /bookmarks - Case 10 - With request sent without auth header should return 401 with error message', async () => {
            const response = await request(app)
                .post('/bookmarks')
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 11. authentication token expired
        test('POST /bookmarks - Case 11 - With authentication token expired should return 401 with error message', async () => {
            const authentication_token_expired = jwt.sign( { userId: user_id! as number, email: test_email }, process.env.JWT_SECRET!, { expiresIn: "-7d" } );
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${authentication_token_expired}`)
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 12. authentication token invalid
        test('POST /bookmarks - Case 12 - With authentication token invalid should return 401 with error message', async () => {
            const authentication_token_invalid = jwt.sign( { userId: user_id! as number, email: test_email }, "invalid_jwt_secret", { expiresIn: "7d" } );
            const response = await request(app)
                .post('/bookmarks')
                .set('authorization', `Bearer ${authentication_token_invalid}`)
                .send({ url: test_url, title: test_title, tags: test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
    });

    describe('Testing - GET /bookmarks', () => {
        /*  Test Cases
        *   1. successful bookmark retrieval
        *   2. user has no bookmarks
        *   3. database error
        *   4. no authentication token provided
        *   5. request sent with no auth header
        *   6. authentication token expired
        *   7. authentication token invalid
        */

        beforeAll(async () => {
            await TestHelpers.addMultipleTestBookmarksToDB(auth_token! as string);
        });

        afterAll(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. successful bookmark retrieval
        test('GET /bookmarks - Case 1 - With successful bookmark retrieval should return 200 with bookmarks array', async () => {
            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
            expect(response.status).toEqual(200);
            expect(response.body.bookmarks).not.toBeUndefined();
            expect(Array.isArray(response.body.bookmarks)).toEqual(true);
            expect(response.body.bookmarks.length).not.toEqual(0);
        });
        // 2. user has no bookmarks
        test('GET /bookmarks - Case 2 - With user has no bookmarks should return 200 with empty array', async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
            expect(response.status).toEqual(200);
            expect(response.body.bookmarks).not.toBeUndefined();
            expect(Array.isArray(response.body.bookmarks)).toEqual(true);
            expect(response.body.bookmarks.length).toEqual(0);
            await TestHelpers.addMultipleTestBookmarksToDB(auth_token! as string);
        });
        // 3. database error
        test('GET /bookmarks - Case 3 - With database error should return 500 internal server error', async () => {
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer ${auth_token! as string}`)
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 4. no authentication token provided
        test('GET /bookmarks - Case 4 - With no authentication token provided should return 401 with error message', async () => {
            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer `)
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 5. request sent with no auth header
        test('GET /bookmarks - Case 5 - With request sent with no auth header should return 401 with error message', async () => {
            const response = await request(app)
                .get('/bookmarks')
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 6. authentication token expired
        test('GET /bookmarks - Case 6 - With authentication token expired should return 401 with error message', async () => {
            const authentication_token_expired = jwt.sign( { userId: user_id! as number, email: test_email }, process.env.JWT_SECRET!, { expiresIn: "-7d" } );
            
            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer ${authentication_token_expired}`)
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 7. authentication token invalid
        test('GET /bookmarks - Case 7 - With authentication token invalid should return 401 with error message', async () => {
            const authentication_token_expired = jwt.sign( { userId: user_id! as number, email: test_email }, "invalid_jwt_secret", { expiresIn: "7d" } );
            
            const response = await request(app)
                .get('/bookmarks')
                .set('authorization', `Bearer ${authentication_token_expired}`)
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
    });

    describe('Testing - GET /bookmarks/:id', () => {
        /*  Test Cases
        *   1. bookmark not found
        *   2. database error
        *   3. successful retrieval
        *   4. no authentication token provided in auth header
        *   5. request sent with no auth header
        *   6. authentication token is expired
        *   7. authentication token is invalid
        *   8. invalid bookmark id type
        */

        afterEach(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. bookmark not found
        test('GET /bookmarks/:id - Case 1 - With bookmark not found should return 404 with error message', async () => {
            await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const nonexistent_id = -100;
            const response = await request(app)
                .get(`/bookmarks/${nonexistent_id}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Bookmark not found");
        });
        // 2. database error
        test('GET /bookmarks/:id - Case 2 - With database error should return 500 internal server error', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);

            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 3. successful retrieval
        test('GET /bookmarks/:id - Case 3 - With successful retrieval should return 200 with bookmark object', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(200);
            expect(response.body.bookmark).not.toBeUndefined();
            expect(response.body.bookmark.id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).toEqual(user_id! as number);
            expect(response.body.bookmark.url).not.toBeUndefined();
            expect(response.body.bookmark.url).toEqual("www.test_url_1.com");
            expect(response.body.bookmark.title).not.toBeUndefined();
            expect(response.body.bookmark.title).toEqual("Test bookmark 1");
            expect(response.body.bookmark.tags).not.toBeUndefined();
            expect(Array.isArray(response.body.bookmark.tags)).toEqual(true);
            expect(response.body.bookmark.tags.length).toEqual(4);
            expect(response.body.bookmark.created_at).not.toBeUndefined();
            expect(response.body.bookmark.updated_at).not.toBeUndefined();
        });
        // 4. no authentication token provided in auth header
        test('GET /bookmarks/:id - Case 4 - With no authentication token provided in auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer `);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 5. request sent with no auth header
        test('GET /bookmarks/:id - Case 5 - With request sent with no auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 6. authentication token is expired
        test('GET /bookmarks/:id - Case 6 - With authentication token is expired should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token_expired = jwt.sign( { userId: user_id! as number, email: test_email }, process.env.JWT_SECRET!, { expiresIn: "-7d" } );
            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token_expired}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 7. authentication token is invalid
        test('GET /bookmarks/:id - Case 7 - With authentication token is invalid should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token_expired = jwt.sign( { userId: user_id! as number, email: test_email }, "invalid_jwt_secret", { expiresIn: "7d" } );
            const response = await request(app)
                .get(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token_expired}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 8. invalid bookmark id type
        test('GET /bookmarks/:id - Case 8 - With invalid bookmark id type should return 400 with error message', async () => {
            await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .get(`/bookmarks/this-is-an-invalid-id`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid bookmark id");
        });
    });

    describe('Testing - PUT /bookmarks/folder', () => {
        /*  Test Cases
        *   1. old folder not provided in request body
        *   2. old folder is empty string
        *   3. new folder not provided in request body
        *   4. new folder is empty string
        *   5. old folder does not exist
        *   6. database error
        *   7. successful folder update
        *   8. no authentication token provided in auth header
        *   9. request sent with no auth header
        *   10. authentication token is expired
        *   11. authentication token is invalid
        */

        beforeEach(async () =>{
            await TestHelpers.addMultipleTestBookmarksToDB(auth_token! as string);
        });

        afterEach(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. old folder not provided in request body
        test('PUT /bookmarks/folder - Case 1 - With old folder not provided in request body should return 400 with error message', async () => {
            const new_folder = "TV";
            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ new_folder: new_folder })
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Current folder name and new folder name are required");
        });
        // 2. old folder is empty string
        test('PUT /bookmarks/folder - Case 2 - With old folder is empty string should return 400 with error message', async () => {
            const old_folder = "";
            const new_folder = "TV";
            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Current folder name and new folder name are required");
        });
        // 3. new folder not provided in request body
        test('PUT /bookmarks/folder - Case 3 - With new folder not provided in request body should return 400 with error message', async () => {
            const old_folder = "folder:TEST";
            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder })
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Current folder name and new folder name are required");
        });
        // 4. new folder is empty string
        test('PUT /bookmarks/folder - Case 4 - With new folder is empty string should return 400 with error message', async () => {
            const old_folder = "folder:TEST";
            const new_folder = "";
            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Current folder name and new folder name are required");
        });
        // 5. old folder does not exist
        test('PUT /bookmarks/folder - Case 5 - With old folder does not exist should return 404 with error message', async () => {
            const old_folder = "folder:TESTFOLDERDOESNTEXIST";
            const new_folder = "TV";
            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual(`No \'${old_folder}\' folder found.`);
        });
        // 6. database error
        test('PUT /bookmarks/folder - Case 6 - With database error should return 500 internal server error', async () => {
            const old_folder = "folder:TEST";
            const new_folder = "TV";
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 7. successful folder update
        test('PUT /bookmarks/folder - Case 7 - With successful folder update should return 200 with array of updated bookmarks', async () => {
            const old_folder = "TEST";
            const new_folder = "TV";

            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(200);
            expect(response.body.updated).not.toBeUndefined();
            expect(Array.isArray(response.body.updated)).toEqual(true);
            expect(response.body.updated[0].tags).toContain(`folder:${new_folder}`);
            expect(response.body.updated[0].tags).not.toContain(`folder:${old_folder}`);
        });
        // 8. no authentication token provided in auth header
        test('PUT /bookmarks/folder - Case 8 - With no authentication token provided in auth header should return 401 with error message', async () => {
            const old_folder = "folder:TEST";
            const new_folder = "TV";

            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer `)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 9. request sent with no auth header
        test('PUT /bookmarks/folder - Case 9 - With request sent with no auth header should return 401 with error message', async () => {
            const old_folder = "folder:TEST";
            const new_folder = "TV";

            const response = await request(app)
                .put('/bookmarks/folder')
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 10. authentication token is expired
        const authentication_token = jwt.sign( { userId: user_id! as number, email: test_email as string } as AuthPayload, process.env.JWT_SECRET!, { expiresIn: "-7d" } );
        test('PUT /bookmarks/folder - Case 10 - With authentication token is expired should return 401 with error message', async () => {
            const old_folder = "folder:TEST";
            const new_folder = "TV";

            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${authentication_token}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 11. authentication token is invalid
        test('PUT /bookmarks/folder - Case 11 - With authentication token is invalid should return 401 with error message', async () => {
            const authentication_token = jwt.sign( { userId: user_id! as number, email: test_email as string } as AuthPayload, "invalid_jwt_secret", { expiresIn: "7d" } );
            const old_folder = "folder:TEST";
            const new_folder = "TV";

            const response = await request(app)
                .put('/bookmarks/folder')
                .set('authorization', `Bearer ${authentication_token}`)
                .send({ old_folder: old_folder, new_folder: new_folder })
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
    });

    describe('Testing - PUT /bookmarks/:id', () => {
        /*  Test Cases
        *   1. bookmark not found
        *   2. no fields provided in request body
        *   3. database error
        *   4. successful bookmark update
        *   5. no authentication token provided in auth header
        *   6. request sent with no auth header
        *   7. authentication token is expired
        *   8. authentication token is invalid
        */

        afterEach(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. bookmark not found
        test('PUT /bookmarks/bookmark/:id - Case 1 - With bookmark not found should return 404 with error message', async () => {
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${-100}`)
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Bookmark not found");
        });
        // 2. no fields provided in request body
        test('PUT /bookmarks/bookmark/:id - Case 2 - With no fields provided in request body should return 400 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({  });
            expect(response.status).toEqual(400);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No fields to update");
        });
        // 3. database error
        test('PUT /bookmarks/bookmark/:id - Case 3 - With database error should return 500 internal server error', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);

            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 4. successful bookmark update
        test('PUT /bookmarks/bookmark/:id - Case 4 - With successful bookmark update should return 200 with bookmark object', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(200);
            expect(response.body.bookmark).not.toBeUndefined();
            expect(response.body.bookmark.id).not.toBeUndefined();
            expect(response.body.bookmark.id).toEqual(bookmark_id! as number);
            expect(response.body.bookmark.user_id).not.toBeUndefined();
            expect(response.body.bookmark.user_id).toEqual(user_id! as number);
            expect(response.body.bookmark.url).not.toBeUndefined();
            expect(response.body.bookmark.url).toEqual(temp_test_url);
            expect(response.body.bookmark.title).not.toBeUndefined();
            expect(response.body.bookmark.title).toEqual(temp_test_title);
            expect(response.body.bookmark.tags).not.toBeUndefined();
            expect(response.body.bookmark.tags).toEqual(temp_test_tags);
            expect(response.body.bookmark.created_at).not.toBeUndefined();
            expect(response.body.bookmark.updated_at).not.toBeUndefined();
        });
        // 5. no authentication token provided in auth header
        test('PUT /bookmarks/bookmark/:id - Case 5 - With no authentication token provided in auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer `)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 6. request sent with no auth header
        test('PUT /bookmarks/bookmark/:id - Case 6 - With request sent with no auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 7. authentication token is expired
        test('PUT /bookmarks/bookmark/:id - Case 7 - With authentication token is expired should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token = jwt.sign( {userId: user_id! as number, email: test_email as string}, process.env.JWT_SECRET!, { expiresIn: "-7d" } );
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 8. authentication token is invalid
        test('PUT /bookmarks/bookmark/:id - Case 8 - With authentication token is invalid should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token = jwt.sign( {userId: user_id! as number, email: test_email as string}, "invalid_jwt_secret", { expiresIn: "7d" } );
            const temp_test_url = "www.test_dummy_url.com";
            const temp_test_title = "Test title";
            const temp_test_tags = ["folder:TEST", "tags1", "tags2", "tags3"];
            const response = await request(app)
                .put(`/bookmarks/bookmark/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token}`)
                .send({ url: temp_test_url, title: temp_test_title, tags: temp_test_tags });
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
    });

    describe('Testing - DELETE /bookmarks/:id', () => {
        /*  Test Cases
        *   1. no bookmark found
        *   2. database error
        *   3. successful bookmark deletion
        *   4. no authentication token provided in auth header
        *   5. request sent with no auth header
        *   6. authentication token expired
        *   7. authentication token invalid
        */

        afterEach(async () => {
            await TestHelpers.removeTestUserBookmarks(user_id! as number);
        });

        // 1. no bookmark found
        test('DELETE /bookmarks/:id - Case 1 - With no bookmark found should return 404 with error message', async () => {
            const response = await request(app)
                .delete(`/bookmarks/${-100}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(404);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Bookmark not found");
        });
        // 2. database error
        test('DELETE /bookmarks/:id - Case 2 - With database error should return 500 internal server error', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            
            const poolQuerySpy = jest.spyOn(pool, 'query');
            poolQuerySpy.mockRejectedValue(new Error("Database connection failed!") as never);

            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(500);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Internal server error");

            poolQuerySpy.mockRestore();
        });
        // 3. successful bookmark deletion
        test('DELETE /bookmarks/:id - Case 3 - With successful bookmark deletion should return 204', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${auth_token! as string}`);
            expect(response.status).toEqual(204);
        });
        // 4. no authentication token provided in auth header
        test('DELETE /bookmarks/:id - Case 4 - With no authentication token provided in auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer `);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 5. request sent with no auth header
        test('DELETE /bookmarks/:id - Case 5 - With request sent with no auth header should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("No token provided");
        });
        // 6. authentication token expired
        test('DELETE /bookmarks/:id - Case 6 - With authentication token expired should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token = jwt.sign({userId: user_id! as number, email: test_email as string} as AuthPayload, process.env.JWT_SECRET!, {expiresIn: "-7d"});
            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
        // 7. authentication token invalid
        test('DELETE /bookmarks/:id - Case 7 - With authentication token invalid should return 401 with error message', async () => {
            const bookmark_id = await TestHelpers.addSingleTestBookmarkToDB(auth_token! as string);
            const authentication_token = jwt.sign({userId: user_id! as number, email: test_email as string} as AuthPayload, "invalid_jwt_secret", {expiresIn: "7d"});
            const response = await request(app)
                .delete(`/bookmarks/${bookmark_id! as number}`)
                .set('authorization', `Bearer ${authentication_token}`);
            expect(response.status).toEqual(401);
            expect(response.body.error).not.toBeUndefined();
            expect(response.body.error).toEqual("Invalid or expired token");
        });
    });
});
