# Project 03 — Application Development and Deployment

**FirstCommit Engineering Mission Control | Angular + Express + PostgreSQL**

FirstCommit is the third repository in my software-engineering portfolio journey.

It carries the system thinking from **Project 01 — Documentation and System Design** and the data-layer foundations from **Project 02 — Database Design and Manipulation** into a working full-stack application.

The purpose of this repository is not only to show that the application runs. It records how I built and integrated the frontend, backend, authentication, role-based workflows, PostgreSQL persistence, production configuration and deployment preparation.

> **Portfolio progression:**<br>
> Project 01 — Think / Document / Design<br>
> Project 02 — Model / Persist / Validate<br>
> **Project 03 — Build / Integrate / Deploy**<br>
> Project 04 — Test / Diagnose / Fix / Verify

---

## Current status

The full-stack application is implemented and deployed to Azure App Service.

The Azure deployment was completed iteratively. Each deployment exposed the next production-readiness requirement, culminating in secure cookie-based authentication and session restoration in Push 3.

Production verification has confirmed:

- the public application root responds successfully;
- `/api/health` reports the service as available;
- `/api/ready` reports the database as available;
- the Angular production application is served successfully;
- PostgreSQL readiness is confirmed through the backend.

The deployed Push 3 baseline is commit `63cea12`.

Project 04 records the testing, debugging and regression evidence performed against this application.

---

## What FirstCommit is

FirstCommit presents fictional engineering incidents as interactive investigation missions.

A learner works through evidence and technical reasoning rather than being given the answer. The learner can:

1. sign in;
2. select a mission;
3. inspect progressively unlocked evidence;
4. record investigation steps;
5. assess possible causes;
6. prepare a final technical conclusion;
7. submit the investigation for review;
8. receive reviewer feedback.

A reviewer has a separate protected workflow for inspecting submitted investigations and providing structured feedback.

The application also includes a public visitor experience and learner-controlled Mission Support.

---

## What this repository demonstrates

Project 03 demonstrates the implementation of:

- an Angular frontend;
- an Express REST API;
- PostgreSQL persistence;
- relational constraints and transaction-aware workflows;
- JWT authentication;
- role-based authorization;
- learner and reviewer workflows;
- in-progress attempt restoration;
- progressive evidence unlocking;
- final investigation submission;
- reviewer feedback;
- server-side logout token revocation;
- same-origin production architecture;
- production database TLS enforcement;
- health and readiness endpoints;
- privacy-aware public visitor telemetry;
- production build orchestration.

---

## Technology stack

### Frontend

- Angular 22
- TypeScript
- SCSS
- Angular Router
- Angular HttpClient
- RxJS

### Backend

- Node.js 24
- Express 5
- JSON Web Tokens
- bcrypt
- PostgreSQL `pg` driver

### Database

- PostgreSQL
- foreign keys and relational constraints
- JSONB metadata for bounded visitor telemetry
- transaction-protected bootstrap scripts

### Production target

- Azure App Service
- Azure Database for PostgreSQL Flexible Server
- Angular and Express served from the same application origin
- PostgreSQL TLS verification required in production

---

## Application architecture

```text
Browser
   |
   v
Angular frontend
   |
   |  /api/*
   v
Express application
   |
   v
PostgreSQL
```

During local development, Angular uses a development proxy for `/api` requests.

For production, the Angular application and Express API are designed to be served from the same origin. This avoids coupling the frontend to a development-only `localhost` API address and avoids unnecessary cross-origin production configuration.

---

## Roles

### Learner

Learners can:

- view the available missions;
- start or continue an investigation;
- record investigation steps;
- unlock evidence progressively;
- assess possible causes;
- prepare a final technical conclusion;
- submit a completed investigation;
- view reviewer feedback;
- use Mission Support without receiving the investigation answer.

### Reviewer

Reviewers can:

- access the protected reviewer workspace;
- view submitted or reviewed investigations;
- inspect learner reasoning and evidence usage;
- rate reasoning quality;
- rate evidence usage;
- rate technical communication;
- provide final written feedback.

Learner and reviewer responsibilities are enforced at both the frontend routing layer and backend API layer.

---

## Engineering missions

FirstCommit currently contains three fictional engineering incidents.

### FC-001 — Friendly

**The dashboard is online, but production data never arrives**

Focus areas include:

- frontend/API integration;
- deployment configuration;
- production API addressing;
- network-request troubleshooting.

### FC-002 — Medium

**Valid credentials work locally but fail after deployment**

Focus areas include:

- authentication;
- environment configuration;
- password verification;
- JWT creation;
- production troubleshooting.

### FC-003 — High / Intermediate

**Reviewer feedback fails even though the review queue loads**

Focus areas include:

- authorization;
- API business rules;
- PostgreSQL state;
- transactions;
- reviewer workflow integrity.

Mission difficulty is intentionally separate from incident severity.

---

## Mission Support

Mission Support is learner-controlled and designed to support reasoning without solving the investigation.

### Mission Mentor

Mission Mentor helps the learner:

- structure an investigation;
- choose a useful next action;
- question assumptions;
- think through the next engineering decision.

### Error Analyst

Error Analyst helps the learner:

- interpret technical signals;
- separate observations from assumptions;
- narrow technical possibilities;
- examine evidence without inventing logs, responses or conclusions.

Mission Support is difficulty-aware and can appear after a period without meaningful persisted investigation progress. The learner can dismiss it and continue independently.

---

## Authentication and authorization

The authentication flow uses:

- bcrypt password hashing;
- JWT authentication;
- issuer and audience validation;
- active-user validation against PostgreSQL;
- role validation;
- protected Angular routes;
- centralized authenticated API requests through an Angular interceptor.

Authentication tokens are intentionally kept in application memory rather than persisted to browser local storage.

### Logout revocation

Logout is not only a client-side state clear.

Each user has an `auth_version`. The version is included in issued JWTs and checked by authenticated backend requests.

A normal server logout increments the user's authentication version. A token issued with the previous version is therefore rejected on later API requests.

This was introduced after testing demonstrated that a purely client-side logout could leave an already-issued JWT usable until expiry.

---

## Security and production hardening

Implemented protections include:

- parameterized PostgreSQL queries;
- bcrypt password hashing;
- learner/reviewer role checks;
- JWT verification;
- server-side logout token revocation;
- active-user validation;
- restricted JSON request-body size;
- Express `x-powered-by` disabled;
- production PostgreSQL TLS enforcement;
- minimum TLS 1.2 when verified TLS is enabled;
- refusal to start production with database TLS disabled;
- environment-based secrets rather than hard-coded credentials;
- same-origin production API design.

The project does not claim that security is ever "finished." Project 04 records the security-focused tests, findings and regression work performed against this application.

---

## Privacy-aware visitor experience

FirstCommit includes a separate public visitor experience.

Its core privacy rule is:

> **Visitors who do not consent are not persisted.**

For a consented visitor, the experience layer can record a bounded set of structured interaction events.

The design intentionally avoids using visitor telemetry as surveillance and does not use it to store unrestricted learner investigation reasoning.

The visitor experience remains separate from protected learner and reviewer workflows.

---

## Database structure

The PostgreSQL application model includes:

- `users`
- `scenarios`
- `evidence_items`
- `attempts`
- `investigation_steps`
- `cause_options`
- `cause_assessments`
- `feedback`
- `audit_events`
- `visitor_sessions`
- `visitor_events`

Database rules protect important application state, including:

- valid user roles;
- valid mission difficulty values;
- valid attempt states;
- one active investigation per learner and scenario;
- investigation-step chronology;
- unique evidence and cause sequences;
- reviewer feedback integrity;
- visitor-consent requirements.

---

## Fresh database bootstrap

The SQL bootstrap is designed to work against a fresh PostgreSQL database.

Run the database files in this order:

```text
1. database/schema.sql
2. database/seed.sql
3. database/experience-layer.sql
```

The bootstrap scripts are transaction-protected so that a failed bootstrap does not leave a partially initialized database.

After the schema and reference data exist, create or update the two fictional authentication users through the backend seed script.

Required environment variables:

```text
SEED_LEARNER_PASSWORD
SEED_REVIEWER_PASSWORD
```

Each seed password must contain at least 12 characters.

Run:

```powershell
npm --prefix backend run seed:users
```

The seed script hashes passwords with bcrypt and does not require real passwords to be committed to the repository.

---

## Environment configuration

Create a local backend `.env` file from:

```text
backend/.env.example
```

The application expects database settings such as:

```text
NODE_ENV
PORT
PGHOST
PGPORT
PGDATABASE
PGUSER
PGPASSWORD
DATABASE_TLS_MODE
JWT_SECRET
JWT_EXPIRES_IN
```

For local PostgreSQL development:

```text
DATABASE_TLS_MODE=disable
```

For production:

```text
NODE_ENV=production
DATABASE_TLS_MODE=verify-full
```

The backend refuses to start in production when verified PostgreSQL TLS is not enabled.

Never commit the real `.env` file.

---

## Local development

Install the backend and frontend dependencies:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
```

Start the backend in one terminal:

```powershell
npm --prefix backend run dev
```

Start Angular in a second terminal:

```powershell
npm --prefix frontend start
```

Open:

```text
http://localhost:4200
```

The backend runs on:

```text
http://localhost:5000
```

Useful local endpoints:

```text
GET /api/health
GET /api/ready
```

---

## Production build

From the repository root:

```powershell
npm run build
```

The root build performs the production dependency/install and Angular build sequence defined in `package.json`.

After the required production environment variables are configured, the application entry point is:

```powershell
npm start
```

In production, Express serves the compiled Angular application and the `/api` routes from the same application origin.

Angular client-side deep links are returned to the SPA, while unknown API routes remain API `404` responses.

---

## Relationship with Project 04

**Project 04 — Software Testing and Debugging** uses this Module 03 application as the real system under test.

It is not a collection of unrelated test examples.

The Module 04 process applies:

```text
Test
  ↓
Observe
  ↓
Record evidence
  ↓
Diagnose root cause
  ↓
Fix the confirmed problem in Module 03
  ↓
Retest
  ↓
Regression
```

Testing has covered functional, non-functional, security, exploratory and regression areas.

Examples of issues investigated during this phase include:

- submission confirmation state;
- logout-token replay;
- learner/reviewer authorization boundaries;
- reviewer timestamp presentation;
- repeated actions and state integrity;
- visitor consent and telemetry;
- Mission Support timing and navigation;
- shared UI spacing and presentation.

This relationship is intentional:

> **Module 03 contains the application. Module 04 documents how that application was tested, what was discovered, what was corrected, and what passed afterward.**

---

## Repository hygiene

The repository intentionally excludes local or generated material such as:

- `.env`
- dependency folders such as `node_modules`
- Angular build output
- Angular cache output
- log files
- operating-system temporary files

Secrets and local database credentials must remain outside Git.

---

## Current production boundary

The application is deployed to Azure and the deployed application, service health endpoint, readiness endpoint and backend database readiness have been verified.

The verified deployment is:

`https://firstcommit-mission-control-jvv-cxepb9ekbufaarcc.southafricanorth-01.azurewebsites.net`

Production verification currently supports claims for:

- a working public Azure deployment;
- successful application-root response;
- successful `/api/health` response;
- successful `/api/ready` response;
- PostgreSQL availability through the backend;
- successful Angular production delivery.

The following remain separate verification boundaries and are not claimed as independently proven by the health/readiness checks alone:

- live login, logout, protected-role and session-restoration workflows;
- negotiated PostgreSQL TLS connection properties;
- least-privilege production database permissions.

---

## What this repository proves

> **I can take a designed system and database model, implement a working full-stack application, integrate frontend and backend state, persist application workflows, add authentication and authorization, prepare the system for production, investigate defects found through testing, and improve the implementation based on evidence.**

The repository also records an important part of my learning progression: moving from asking only whether a feature works to examining how state, security boundaries, failure cases, persistence, deployment configuration and user experience behave together.

---

## Portfolio continuation

The next repository is:

**Project 04 — Software Testing and Debugging**

Project 04 documents the testing and debugging work performed against FirstCommit, including test planning, evidence, confirmed findings, fixes, regression testing and later production verification.
