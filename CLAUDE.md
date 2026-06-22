# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

LinkVault is a full-stack bookmark manager. The backend is an Express/TypeScript REST API deployed to AWS Lambda; the frontend is a React/TypeScript SPA deployed to Netlify.

## Commands

### Backend (root)
```sh
npm run dev          # Run locally with nodemon + ts-node
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled output (dist/index.js)
npm run test-full    # Run all tests (auth + bookmarks)
npm run test-unit-integration  # Run unit/integration tests only
ts-node src/db/migrate.ts      # Apply DB migrations
```

### Frontend (frontend/)
```sh
npm run dev      # Vite dev server
npm run build    # Type-check + Vite build
npm run lint     # ESLint
```

### Running a single test file
```sh
npx jest --runInBand --verbose src/tests/bookmarks.unit-integration.test.ts
```
Tests must use `--runInBand` because they share a live database test user and run serially.

## Environment variables

**Backend** (`.env` in root):
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `JWT_SECRET` — secret for signing auth JWTs
- `RESEND_API_KEY` — Resend API key for verification emails
- `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins
- `TEST_DB_USER_EMAIL` / `TEST_DB_USER_PASSWORD` — credentials for the test user (tests only)

**Frontend** (`frontend/.env`):
- `VITE_API_BASE_URL` — base URL for the backend API

## Architecture

### Backend (`src/`)

Two entry points depending on environment:
- `src/index.ts` — starts a local Express server on `PORT` (default 3000)
- `src/lambda.ts` — wraps the app with `@codegenie/serverless-express` for AWS Lambda

`src/app.ts` wires all middleware and routes:
1. Helmet + CORS
2. Request body logging (Buffer passthrough for Lambda)
3. `express.json()`
4. Global rate limiter (100 req / 15 min) and auth-specific rate limiter (20 req / 15 min) — both skipped when `NODE_ENV === "test"`
5. `/auth` → `src/routes/auth.ts` (unauthenticated)
6. `/bookmarks` → `src/routes/bookmarks.ts` behind `authenticate` middleware

**Database** (`src/db/`): raw `pg` Pool, no ORM. `pool.ts` reads `DATABASE_URL` with SSL. `migrate.ts` is an idempotent migration script run once to set up schema.

**Auth flow** (`src/routes/auth.ts`):
- Registration creates a user and sends a verification email via Resend; if the email send fails the user row is deleted
- Login returns a 403 with a short-lived `verification_email_token` (15 min) if the account is unverified, or a 7-day auth JWT on success
- Verification token resend (`POST /auth/verify/resend`) requires the 15-min verification JWT in the `Authorization` header

**JWT types** (`src/types/index.ts`):
- `AuthPayload` — `{ userId, email }` — used for protected API access
- `VerificationEmailPayload` — `{ email }` — used only for the resend-verification flow

**Folder/tag system**: bookmarks store tags as a PostgreSQL `TEXT[]`. Folders are encoded as tags with the `folder:` prefix (e.g. `folder:Tech`). `PUT /bookmarks/folder` uses `array_replace` to rename a folder across all bookmarks atomically.

### Frontend (`frontend/src/`)

React Router v7 SPA with these routes:
- `/` → `Landing`
- `/login` → `Login`
- `/register` → `Register`
- `/dashboard` → `Dashboard`
- `/verify/:verification_token` → `Verify`

**State**: User session (`{ id, email, token }`) is persisted to `localStorage` and exposed app-wide via `UserContext` in `context.tsx`. All context types are defined centrally in `context.tsx`.

**API layer** (`src/lib/api/`): thin fetch wrappers — `auth.ts` for registration/login/verification, `bookmarks.ts` for CRUD. The base URL is read from `CONFIG.API_BASE_URL` (`frontend/src/config.ts`), which pulls from `VITE_API_BASE_URL`.

**Dashboard**: bookmark data is organized client-side into a `folderMap` (`Record<string, Bookmark[]>`) passed via `FolderMapContext`. Individual bookmark and folder components live in `pages/dashboard/`.

### Test structure (`src/tests/`)

Tests are integration tests that hit a real Supabase database using `TEST_DB_USER_EMAIL` / `TEST_DB_USER_PASSWORD`. `test-helpers.ts` provides setup/teardown helpers (add/remove test user, add/remove bookmarks, generate verification tokens). Email sending is mocked via `jest.mock("../lib/email")`.

Test files:
- `auth.unit-integration.test.ts`
- `auth.end-to-end.test.ts`
- `bookmarks.unit-integration.test.ts`
