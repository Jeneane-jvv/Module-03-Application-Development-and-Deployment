-- ============================================================
-- FIRSTCOMMIT
-- EXPERIENCE LAYER
--
-- Visitor identity, consent-aware sessions, and safe
-- interaction telemetry.
--
-- Privacy rule:
-- Visitors who do not consent are not persisted.
-- ============================================================

BEGIN;

CREATE TABLE visitor_sessions (
  visitor_session_id BIGINT
    GENERATED ALWAYS AS IDENTITY,

  display_name VARCHAR(80) NOT NULL,

  visitor_role VARCHAR(40) NOT NULL,

  consent_given BOOLEAN NOT NULL,

  started_at TIMESTAMP WITH TIME ZONE
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  last_active_at TIMESTAMP WITH TIME ZONE
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT visitor_sessions_pkey
    PRIMARY KEY (visitor_session_id),

  CONSTRAINT ck_visitor_display_name_not_blank
    CHECK (
      btrim(display_name) <> ''
    ),

  CONSTRAINT ck_visitor_role
    CHECK (
      visitor_role IN (
        'learner',
        'recruiter',
        'educator_assessor',
        'guest'
      )
    ),

  CONSTRAINT ck_visitor_session_requires_consent
    CHECK (
      consent_given = TRUE
    ),

  CONSTRAINT ck_visitor_last_active_valid
    CHECK (
      last_active_at >= started_at
    ),

  CONSTRAINT ck_visitor_completed_valid
    CHECK (
      completed_at IS NULL
      OR completed_at >= started_at
    )
);


CREATE TABLE visitor_events (
  visitor_event_id BIGINT
    GENERATED ALWAYS AS IDENTITY,

  visitor_session_id BIGINT NOT NULL,

  event_type VARCHAR(80) NOT NULL,

  scenario_id BIGINT,

  metadata JSONB
    NOT NULL
    DEFAULT '{}'::jsonb,

  occurred_at TIMESTAMP WITH TIME ZONE
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT visitor_events_pkey
    PRIMARY KEY (visitor_event_id),

  CONSTRAINT visitor_events_session_id_fkey
    FOREIGN KEY (visitor_session_id)
    REFERENCES visitor_sessions(visitor_session_id)
    ON DELETE CASCADE,

  CONSTRAINT visitor_events_scenario_id_fkey
    FOREIGN KEY (scenario_id)
    REFERENCES scenarios(scenario_id)
    ON DELETE SET NULL,

  CONSTRAINT ck_visitor_event_type_not_blank
    CHECK (
      btrim(event_type) <> ''
    ),

  CONSTRAINT ck_visitor_event_metadata_is_object
    CHECK (
      jsonb_typeof(metadata) = 'object'
    )
);


CREATE INDEX idx_visitor_events_session_time
  ON visitor_events (
    visitor_session_id,
    occurred_at
  );


CREATE INDEX idx_visitor_events_event_type
  ON visitor_events (
    event_type
  );


CREATE INDEX idx_visitor_events_scenario
  ON visitor_events (
    scenario_id
  );

COMMIT;