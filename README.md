# LinkVault

LinkVault is a full-stack web application for managing web bookmarks. Using LinkVault allows users to easily access their web bookmarks privately on any device or browser.

### Motivation

My motivation behind creating LinkVault was to gain backend development experience and exposure to a tech stack that I was not familiar with. This is my first project with TypeScript and AWS Lambda and it provided me with valuable experience to carry forward.

### Features

- User registration and JWT-based authentication
- Create, list, update, and delete web bookmarks
- Per-user bookmark isolation
- Global and route-specific rate limiting
- Structured logging via AWS CloudWatch
- Comprehensive test coverage using Jest and Supertest
- Health check endpoint for dependency monitoring
- Cloud-deployed with AWS Lambda, API Gateway, Supabase PostgreSQL, and Netlify

---
High-Level Architecture
---
```mermaid
flowchart LR
    C@{ shape: cloud, label: "API Gateway"}
    L@{ shape: cloud, label: "AWS Lambda"}

    Frontend_Server[Netlify] <-- Serve static frontend html/css/js files --> Client[Web Browser]
    Client[Web Browser] -- LinkVault API requests --> C
    C --> L
    L --> DB[(Supabase PostgreSQL Database)]
```

---
Request-Response Cycle
---
```mermaid
flowchart TD
    Client[Web Browser] --> Req[Request]
    Req[Request] --> Sec["Security Middleware (Helmet / CORS)"]
    Sec["Security Middleware (Helmet / CORS)"] --> Log[Request Logging]
    Log[Request Logging] --> Rate[Rate Limiter]
    Rate[Rate Limiter] -- Requests for protected endpoints --> JWT["JWT Authentication Middleware"]
    JWT["JWT Authentication Middleware"] -- Requests for protected endpoints --> End[Endpoint function]
    Rate[Rate Limiter] --> End[Endpoint Function]
    End[Endpoint function] --> DB[(PostgreSQL Database)]
    DB[(PostgreSQL Database)] --> End[Endpoint function]
    End[Endpoint function] --> Res[Response]
    Res[Response] --> Client[Web Browser]
```

### Endpoints

| Endpoint Path | Protected Endpoint | Usage |
| -------- | -------- | -------- |
| POST /auth/register | No | Register a new LinkVault user |
| GET /auth/verify/:verification_token | No | Verify a LinkVault Account (accessed via verification email link) |
| POST /auth/verify/resend | Yes - Email Verification JWT | Resend a verfication email with a new verification token. |
| POST /auth/login | No | Login to a LinkVault account |
| POST /bookmarks | Yes - Auth JWT | Create a new web bookmark |
| GET /bookmarks | Yes - Auth JWT | Fetch all of the logged-in user's bookmarks |
| GET /bookmarks/:id | Yes - Auth JWT | Fetch a bookmark by id |
| PUT /bookmarks/folder | Yes - Auth JWT | Change the name of a bookmark folder |
| PUT /bookmarks/bookmark/:id | Yes - Auth JWT | Update a bookmark by id |
| DELETE /bookmarks/:id | Yes - Auth JWT | Delete a bookmark by id |

### Project Status

LinkVault is complete and deployed. Future improvements may be considered and implemented at a later date.
