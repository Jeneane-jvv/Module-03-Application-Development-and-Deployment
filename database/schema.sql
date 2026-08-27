-- FirstCommit Engineering Mission Control
-- Module 03: Application Development and Deployment
-- PostgreSQL application schema
--
-- This schema evolves the relational design demonstrated in Module 02
-- into the persistent data layer for a full-stack Angular + Express application.

BEGIN;

CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    full_name VARCHAR(120) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('learner', 'reviewer')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    auth_version INTEGER NOT NULL DEFAULT 1
        CHECK (auth_version > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_users_full_name_not_blank
        CHECK (BTRIM(full_name) <> ''),

    CONSTRAINT ck_users_email_not_blank
        CHECK (BTRIM(email) <> '')
);

CREATE UNIQUE INDEX uq_users_email_lower
    ON users (LOWER(email));-- Engineering scenarios are presented as "missions" in the Angular interface.
-- Keeping the relational name "scenarios" preserves continuity with Module 02.

CREATE TABLE scenarios (
    scenario_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    scenario_code VARCHAR(20) NOT NULL UNIQUE,

    title VARCHAR(180) NOT NULL,

    summary TEXT NOT NULL,

    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    difficulty VARCHAR(30) NOT NULL
        CHECK (difficulty IN ('friendly', 'medium', 'high_intermediate')),

    affected_layer VARCHAR(100) NOT NULL,

    estimated_minutes SMALLINT
        CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),

    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_scenarios_code_not_blank
        CHECK (BTRIM(scenario_code) <> ''),

    CONSTRAINT ck_scenarios_title_not_blank
        CHECK (BTRIM(title) <> ''),

    CONSTRAINT ck_scenarios_summary_not_blank
        CHECK (BTRIM(summary) <> ''),

    CONSTRAINT ck_scenarios_affected_layer_not_blank
        CHECK (BTRIM(affected_layer) <> '')
);-- Evidence items represent the technical artefacts available during a mission.
-- unlock_after_step controls progressive disclosure:
-- 0 = visible when the mission starts
-- 1 = visible after the first investigation step
-- 2 = visible after the second investigation step, and so on.

CREATE TABLE evidence_items (
    evidence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    scenario_id BIGINT NOT NULL
        REFERENCES scenarios(scenario_id)
        ON DELETE CASCADE,

    evidence_code VARCHAR(30) NOT NULL,

    title VARCHAR(160) NOT NULL,

    evidence_type VARCHAR(30) NOT NULL
        CHECK (
            evidence_type IN (
                'incident_report',
                'browser_console',
                'api_response',
                'http_request',
                'environment',
                'database_status',
                'deployment_log'
            )
        ),

    content TEXT NOT NULL,

    sequence_no SMALLINT NOT NULL
        CHECK (sequence_no > 0),

    unlock_after_step SMALLINT NOT NULL DEFAULT 0
        CHECK (unlock_after_step >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_evidence_code_per_scenario
        UNIQUE (scenario_id, evidence_code),

    CONSTRAINT uq_evidence_sequence_per_scenario
        UNIQUE (scenario_id, sequence_no),

    CONSTRAINT ck_evidence_title_not_blank
        CHECK (BTRIM(title) <> ''),

    CONSTRAINT ck_evidence_content_not_blank
        CHECK (BTRIM(content) <> '')
);-- An attempt represents one learner investigation of one engineering mission.
-- Learners may have historical attempts, but only one active attempt
-- for the same scenario at a time.

CREATE TABLE attempts (
    attempt_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    learner_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    scenario_id BIGINT NOT NULL
        REFERENCES scenarios(scenario_id)
        ON DELETE RESTRICT,

    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted', 'reviewed')),

    probable_root_cause TEXT,

    final_reasoning TEXT,

    recommended_action TEXT,

    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    submitted_at TIMESTAMPTZ,

    reviewed_at TIMESTAMPTZ,

    CONSTRAINT ck_attempt_submission_state
    CHECK (
        (
            status = 'in_progress'
            AND submitted_at IS NULL
            AND reviewed_at IS NULL
        )
        OR
        (
            status = 'submitted'
            AND submitted_at IS NOT NULL
            AND reviewed_at IS NULL

            AND probable_root_cause IS NOT NULL
            AND BTRIM(probable_root_cause) <> ''

            AND final_reasoning IS NOT NULL
            AND BTRIM(final_reasoning) <> ''

            AND recommended_action IS NOT NULL
            AND BTRIM(recommended_action) <> ''
        )
        OR
        (
            status = 'reviewed'
            AND submitted_at IS NOT NULL
            AND reviewed_at IS NOT NULL

            AND probable_root_cause IS NOT NULL
            AND BTRIM(probable_root_cause) <> ''

            AND final_reasoning IS NOT NULL
            AND BTRIM(final_reasoning) <> ''

            AND recommended_action IS NOT NULL
            AND BTRIM(recommended_action) <> ''
               )
               )
        ); -- PostgreSQL partial unique index:
-- a learner may revisit a mission later, but cannot accidentally
-- create two simultaneous in-progress investigations for it.

CREATE UNIQUE INDEX uq_one_active_attempt_per_scenario
    ON attempts (learner_id, scenario_id)
    WHERE status = 'in_progress';-- Investigation steps preserve the learner's reasoning trail.
-- Each step records what was observed, what should be checked next,
-- and why that next action makes sense.

CREATE TABLE investigation_steps (
    step_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    attempt_id BIGINT NOT NULL
        REFERENCES attempts(attempt_id)
        ON DELETE CASCADE,

    evidence_id BIGINT
        REFERENCES evidence_items(evidence_id)
        ON DELETE RESTRICT,

    step_no SMALLINT NOT NULL
        CHECK (step_no > 0),

    observation TEXT NOT NULL,

    next_action TEXT NOT NULL,

    reasoning TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_investigation_step_sequence
        UNIQUE (attempt_id, step_no),

    CONSTRAINT ck_step_observation_not_blank
        CHECK (BTRIM(observation) <> ''),

    CONSTRAINT ck_step_next_action_not_blank
        CHECK (BTRIM(next_action) <> ''),

    CONSTRAINT ck_step_reasoning_not_blank
        CHECK (BTRIM(reasoning) <> '')
);-- Cause options represent competing technical explanations for a mission.
-- They are hypotheses to investigate, not multiple-choice answers.

CREATE TABLE cause_options (
    cause_option_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    scenario_id BIGINT NOT NULL
        REFERENCES scenarios(scenario_id)
        ON DELETE CASCADE,

    cause_code VARCHAR(30) NOT NULL,

    label VARCHAR(160) NOT NULL,

    description TEXT NOT NULL,

    sequence_no SMALLINT NOT NULL
        CHECK (sequence_no > 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cause_code_per_scenario
        UNIQUE (scenario_id, cause_code),

    CONSTRAINT uq_cause_sequence_per_scenario
        UNIQUE (scenario_id, sequence_no),

    CONSTRAINT ck_cause_label_not_blank
        CHECK (BTRIM(label) <> ''),

    CONSTRAINT ck_cause_description_not_blank
        CHECK (BTRIM(description) <> '')
);-- Cause assessments record the learner's judgement about each possible cause.
-- The learner must classify a hypothesis and explain the reasoning behind it.

CREATE TABLE cause_assessments (
    cause_assessment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    attempt_id BIGINT NOT NULL
        REFERENCES attempts(attempt_id)
        ON DELETE CASCADE,

    cause_option_id BIGINT NOT NULL
        REFERENCES cause_options(cause_option_id)
        ON DELETE RESTRICT,

    assessment VARCHAR(20) NOT NULL
        CHECK (
            assessment IN (
                'supported',
                'eliminated',
                'unresolved'
            )
        ),

    reasoning TEXT NOT NULL,

    assessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cause_assessment_per_attempt
        UNIQUE (attempt_id, cause_option_id),

    CONSTRAINT ck_cause_assessment_reasoning_not_blank
        CHECK (BTRIM(reasoning) <> '')
);-- Feedback completes the learner-to-reviewer workflow.
-- One submitted investigation receives one final reviewer assessment.
-- Express will enforce that reviewer_id belongs to an active reviewer account.

CREATE TABLE feedback (
    feedback_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    attempt_id BIGINT NOT NULL
        REFERENCES attempts(attempt_id)
        ON DELETE CASCADE,

    reviewer_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    reasoning_quality VARCHAR(20) NOT NULL
        CHECK (
            reasoning_quality IN (
                'strong',
                'developing',
                'needs_revision'
            )
        ),

    evidence_usage VARCHAR(20) NOT NULL
        CHECK (
            evidence_usage IN (
                'strong',
                'developing',
                'needs_revision'
            )
        ),

    technical_communication VARCHAR(20) NOT NULL
        CHECK (
            technical_communication IN (
                'strong',
                'developing',
                'needs_revision'
            )
        ),

    feedback_text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_feedback_per_attempt
        UNIQUE (attempt_id),

    CONSTRAINT ck_feedback_text_not_blank
        CHECK (BTRIM(feedback_text) <> '')
);-- Audit events provide a chronological record of important application activity.
-- Module 03 builds and writes this capability.
-- Module 04 will interrogate it during functional, security,
-- regression and production testing.
--
-- user_id is nullable because some events, such as a failed login,
-- may occur before the application can identify an authenticated user.
--
-- metadata uses PostgreSQL JSONB for small structured technical details
-- that do not justify additional relational columns.

CREATE TABLE audit_events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    event_type VARCHAR(50) NOT NULL,

    entity_type VARCHAR(40),

    entity_id BIGINT,

    outcome VARCHAR(20) NOT NULL DEFAULT 'success'
        CHECK (outcome IN ('success', 'failure')),

    description TEXT NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_audit_event_type_not_blank
        CHECK (BTRIM(event_type) <> ''),

    CONSTRAINT ck_audit_entity_type_not_blank
        CHECK (
            entity_type IS NULL
            OR BTRIM(entity_type) <> ''
        ),

    CONSTRAINT ck_audit_description_not_blank
        CHECK (BTRIM(description) <> ''),

    CONSTRAINT ck_audit_metadata_is_object
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX ix_audit_events_user
    ON audit_events (user_id);

CREATE INDEX ix_audit_events_type
    ON audit_events (event_type);

CREATE INDEX ix_audit_events_entity
    ON audit_events (entity_type, entity_id);

CREATE INDEX ix_audit_events_occurred_at
    ON audit_events (occurred_at DESC);-- Final lifecycle integrity checks.
-- Application timestamps must follow the real investigation sequence:
-- started -> submitted -> reviewed.

ALTER TABLE attempts
    ADD CONSTRAINT ck_attempt_submission_chronology
    CHECK (
        submitted_at IS NULL
        OR submitted_at >= started_at
    );

ALTER TABLE attempts
    ADD CONSTRAINT ck_attempt_review_chronology
    CHECK (
        reviewed_at IS NULL
        OR (
            submitted_at IS NOT NULL
            AND reviewed_at >= submitted_at
        )
    );

COMMIT;