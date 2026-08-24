-- FirstCommit Engineering Mission Control
-- Module 03: Application Development and Deployment
-- Professional demonstration seed data
--
-- These scenarios are fictional engineering incidents created specifically
-- for the FirstCommit portfolio application.

INSERT INTO scenarios (
    scenario_code,
    title,
    summary,
    severity,
    difficulty,
    affected_layer,
    estimated_minutes,
    is_published
)
VALUES
(
    'FC-001',
    'The dashboard is online, but production data never arrives',
    'The FirstCommit dashboard opens successfully in the hosted environment, but no mission data appears. The same feature works correctly during local development. Use the available evidence to work out why the hosted application cannot load its mission data and identify the correct fix.',
    'medium',
    'friendly',
    'Frontend / API / Deployment',
    20,
    TRUE
),
(
    'FC-002',
    'Valid credentials work locally but fail after deployment',
    'Learners can authenticate successfully in the local environment, but the same valid credentials are rejected by the hosted application. The API is reachable and the database appears available, so the investigation must follow the authentication evidence before deciding on a probable cause.',
    'high',
    'medium',
    'Authentication / API / Environment',
    25,
    TRUE
),
(
    'FC-003',
    'Reviewer feedback fails even though the review queue loads',
    'A reviewer can sign in and open submitted investigations, but completing a review fails unexpectedly. The investigation must trace the request through Angular, JWT authorization, Express business rules and PostgreSQL state before recommending a correction.',
    'high',
    'high_intermediate',
    'Authorization / API / Database',
    30,
    TRUE
);-- ============================================================
-- FC-001 Evidence
-- The dashboard is online, but production data never arrives
-- ============================================================

INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC001-E01',
    'Initial Incident Report',
    'incident_report',
    'The hosted FirstCommit interface loads successfully and navigation works, but the mission dashboard remains empty. The same application displays mission data correctly during local development.',
    1,
    0
FROM scenarios
WHERE scenario_code = 'FC-001';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC001-E02',
    'Hosted Service Status',
    'environment',
    'Frontend: ONLINE. API: ONLINE. Database: READY. The hosting platform reports no active deployment failure.',
    2,
    0
FROM scenarios
WHERE scenario_code = 'FC-001';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC001-E03',
    'Browser Console',
    'browser_console',
    'The mission-loading request failed. Browser console reports: TypeError: Failed to fetch. The Angular application itself continues running.',
    3,
    1
FROM scenarios
WHERE scenario_code = 'FC-001';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC001-E04',
    'Network Request Inspection',
    'http_request',
    'Hosted application: https://mission-control.example. The browser attempted GET http://localhost:5000/api/missions. The request failed before the hosted API returned a response.',
    4,
    2
FROM scenarios
WHERE scenario_code = 'FC-001';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC001-E05',
    'Production Build Configuration',
    'deployment_log',
    'The production build completed successfully, but its API target still points to the local development address. In the hosted version, FirstCommit should use /api so requests go to the API running with the same hosted application.',
    5,
    3
FROM scenarios
WHERE scenario_code = 'FC-001';-- ============================================================
-- FC-001 Competing Causes
-- The learner must support, eliminate, or leave each hypothesis unresolved.
-- No cause is marked as the "correct answer" in the database.
-- ============================================================

INSERT INTO cause_options (
    scenario_id,
    cause_code,
    label,
    description,
    sequence_no
)
VALUES
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-001'),
    'FC001-C01',
    'PostgreSQL database is unavailable',
    'The hosted API may be unable to read mission data because the database is offline or unreachable.',
    1
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-001'),
    'FC001-C02',
    'CORS is blocking the browser request',
    'CORS can block browser requests when the frontend and API use different addresses. Check whether the request actually reaches the hosted API before changing CORS settings.',
    2
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-001'),
    'FC001-C03',
    'The frontend is using the local API address in production',
    'The hosted frontend may still be calling localhost:5000 instead of /api. In production, that would send the request to the wrong place.',
    3
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-001'),
    'FC001-C04',
    'The API returns no published missions',
    'The request may reach the API successfully, but filtering or publication rules could return an empty mission list.',
    4
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-001'),
    'FC001-C05',
    'The frontend receives missions but does not display them',
    'The API may return valid mission records, but a frontend display or data-mapping problem could stop them appearing.',
    5
);-- ============================================================
-- FC-002 Evidence
-- Valid credentials work locally but fail after deployment
-- ============================================================

INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC002-E01',
    'Authentication Incident Report',
    'incident_report',
    'The learner account signs in successfully in the local environment. After deployment, the hosted login screen accepts the same email and password but displays a generic sign-in failure. No frontend crash occurs.',
    1,
    0
FROM scenarios
WHERE scenario_code = 'FC-002';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC002-E02',
    'Hosted Service Readiness',
    'environment',
    'Express API: ONLINE. PostgreSQL: READY. The learner record exists in the hosted database and the account is active. The authentication endpoint is reachable.',
    2,
    0
FROM scenarios
WHERE scenario_code = 'FC-002';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC002-E03',
    'Authentication API Response',
    'api_response',
    'POST /api/auth/login returns HTTP 500 with the safe response body: {"error":"authentication_service_unavailable"}. The response is not HTTP 401 Invalid credentials.',
    3,
    1
FROM scenarios
WHERE scenario_code = 'FC-002';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC002-E04',
    'Authentication Server Trace',
    'deployment_log',
    'The server trace confirms that the user was found and bcrypt password comparison succeeded. The request fails during JWT token generation with a configuration error indicating that the signing secret is unavailable.',
    4,
    2
FROM scenarios
WHERE scenario_code = 'FC-002';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC002-E05',
    'Hosted Environment Configuration',
    'environment',
    'Production configuration includes NODE_ENV and the PostgreSQL connection value. JWT_SECRET is not present in the hosted environment. The local .env configuration contains the required JWT signing secret.',
    5,
    3
FROM scenarios
WHERE scenario_code = 'FC-002';-- ============================================================
-- FC-002 Competing Causes
-- Authentication succeeds locally but fails after deployment
-- ============================================================

INSERT INTO cause_options (
    scenario_id,
    cause_code,
    label,
    description,
    sequence_no
)
VALUES
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-002'),
    'FC002-C01',
    'The learner credentials are invalid',
    'The email or password supplied by the learner may not match the credentials stored in the hosted environment.',
    1
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-002'),
    'FC002-C02',
    'The hosted PostgreSQL database is unavailable',
    'Authentication may fail because Express cannot retrieve the learner account from the production database.',
    2
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-002'),
    'FC002-C03',
    'bcrypt password verification is failing',
    'The user may be found successfully, but the stored password hash or bcrypt comparison process may reject the supplied password.',
    3
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-002'),
    'FC002-C04',
    'JWT signing configuration is missing in production',
    'The credentials may be verified successfully, but Express may be unable to issue an authentication token because the hosted JWT signing secret is unavailable.',
    4
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-002'),
    'FC002-C05',
    'The Angular login component is sending the request incorrectly',
    'The frontend may be submitting an invalid request body or targeting the wrong authentication endpoint in the hosted environment.',
    5
);-- ============================================================
-- FC-003 Evidence
-- Reviewer feedback fails even though the review queue loads
-- ============================================================

INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC003-E01',
    'Reviewer Incident Report',
    'incident_report',
    'A reviewer signs in successfully, opens the review queue, and loads a submitted learner investigation. When the reviewer submits feedback, the interface reports that the review could not be completed.',
    1,
    0
FROM scenarios
WHERE scenario_code = 'FC-003';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC003-E02',
    'Authorization Context',
    'environment',
    'The reviewer JWT is valid, the authenticated user is active, and the token contains the reviewer role. Protected reviewer routes are accessible.',
    2,
    0
FROM scenarios
WHERE scenario_code = 'FC-003';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC003-E03',
    'Feedback API Response',
    'api_response',
    'POST /api/reviews/42/feedback returns HTTP 409 Conflict with the safe response body: {"error":"invalid_attempt_state"}. Authentication and authorization both succeeded before the request reached the review business rule.',
    3,
    1
FROM scenarios
WHERE scenario_code = 'FC-003';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC003-E04',
    'Attempt State Inspection',
    'database_status',
    'The requested attempt exists, but its current status is in_progress. submitted_at is NULL. PostgreSQL has no existing feedback row for the attempt.',
    4,
    2
FROM scenarios
WHERE scenario_code = 'FC-003';


INSERT INTO evidence_items (
    scenario_id,
    evidence_code,
    title,
    evidence_type,
    content,
    sequence_no,
    unlock_after_step
)
SELECT
    scenario_id,
    'FC003-E05',
    'Review Transaction Trace',
    'deployment_log',
    'The Express review service requires an attempt to be submitted before feedback can be created. The transaction is rolled back when the attempt state is invalid, preventing a partial feedback record from being saved.',
    5,
    3
FROM scenarios
WHERE scenario_code = 'FC-003';-- ============================================================
-- FC-003 Competing Causes
-- Reviewer feedback fails even though the review queue loads
-- ============================================================

INSERT INTO cause_options (
    scenario_id,
    cause_code,
    label,
    description,
    sequence_no
)
VALUES
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-003'),
    'FC003-C01',
    'The reviewer JWT is invalid or expired',
    'The feedback request may be rejected because the reviewer authentication token is invalid, expired, or cannot be verified by the Express API.',
    1
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-003'),
    'FC003-C02',
    'The authenticated user does not have reviewer permission',
    'The request may reach the API successfully but fail because the authenticated account is not authorized to perform reviewer actions.',
    2
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-003'),
    'FC003-C03',
    'The investigation has not reached a reviewable state',
    'The reviewer may be attempting to create feedback for an investigation that is still in progress and has not yet been formally submitted.',
    3
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-003'),
    'FC003-C04',
    'A duplicate feedback record already exists',
    'PostgreSQL may reject the review because the attempt already has an authoritative feedback record and the unique feedback constraint prevents another one.',
    4
),
(
    (SELECT scenario_id FROM scenarios WHERE scenario_code = 'FC-003'),
    'FC003-C05',
    'The PostgreSQL transaction fails after feedback is inserted',
    'The feedback insert may succeed initially, but a later database operation could fail and cause the complete review transaction to roll back.',
    5
);