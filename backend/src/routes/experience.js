const crypto = require('crypto');
const express = require('express');

const {
  pool,
} = require('../config/database');

const router = express.Router();

const VISITOR_CAPABILITY_HEADER =
  'x-visitor-capability';

function createVisitorCapability() {
  return crypto
    .randomBytes(32)
    .toString('hex');
}

function hashVisitorCapability(
  visitorCapability,
) {
  return crypto
    .createHash('sha256')
    .update(
      visitorCapability,
      'utf8',
    )
    .digest('hex');
}

const VISITOR_ROLES = new Set([
  'learner',
  'recruiter',
  'educator_assessor',
  'guest',
]);

const VISITOR_EVENT_TYPES = new Set([
  'ENTERED_MISSION_CONTROL',
  'VIEWED_MISSION',
  'OPENED_EVIDENCE',
  'STARTED_GUIDED_TOUR',
  'COMPLETED_GUIDED_TOUR',
  'REQUESTED_MENTOR_GUIDANCE',
  'REQUESTED_ERROR_ANALYSIS',
  'VIEWED_REVIEWER_FEEDBACK',
]);

const VISITOR_METADATA_KEYS = new Set([
  'source',
  'surface',
  'evidenceCode',
  'supportType',
  'tourStep',
]);

function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateEventMetadata(metadata) {
  if (!isPlainObject(metadata)) {
    return {
      valid: false,
      error: 'invalid_event_metadata',
      message:
        'Visitor event metadata must be a JSON object.',
    };
  }

  const keys = Object.keys(metadata);

  const unsupportedKey =
    keys.find(
      (key) =>
        !VISITOR_METADATA_KEYS.has(key),
    );

  if (unsupportedKey) {
    return {
      valid: false,
      error: 'unsupported_event_metadata',
      message:
        `Visitor event metadata field "${unsupportedKey}" is not allowed.`,
    };
  }

  const serializedMetadata =
    JSON.stringify(metadata);

  if (
    serializedMetadata.length > 2000
  ) {
    return {
      valid: false,
      error: 'event_metadata_too_large',
      message:
        'Visitor event metadata must be 2000 characters or fewer.',
    };
  }

  return {
    valid: true,
    metadata,
  };
}

// ============================================================
// POST /api/experience/sessions
// Create a consented visitor experience session.
//
// This endpoint is intentionally public because a portfolio
// visitor may identify themselves before authentication.
//
// Privacy rules:
// - consent must be explicitly true;
// - non-consenting visitors are not persisted;
// - no IP address, token, fingerprint, or password is stored;
// - display names are treated as experience labels only.
// ============================================================

router.post(
  '/sessions',
  async (req, res) => {
    const rawDisplayName =
      req.body?.displayName;

    const visitorRole =
      req.body?.visitorRole;

    const consentGiven =
      req.body?.consentGiven;

    // --------------------------------------------------------
    // Display name validation.
    // --------------------------------------------------------

    if (
      typeof rawDisplayName !== 'string'
    ) {
      return res.status(400).json({
        error:
          'display_name_required',

        message:
          'A display name is required to enter Mission Control.',
      });
    }

    const displayName =
      rawDisplayName.trim();

    if (!displayName) {
      return res.status(400).json({
        error:
          'display_name_required',

        message:
          'A display name is required to enter Mission Control.',
      });
    }

    if (displayName.length > 80) {
      return res.status(400).json({
        error:
          'display_name_too_long',

        message:
          'The display name must be 80 characters or fewer.',
      });
    }

    // --------------------------------------------------------
    // Visitor role validation.
    // --------------------------------------------------------

    if (
      typeof visitorRole !== 'string' ||
      !VISITOR_ROLES.has(visitorRole)
    ) {
      return res.status(400).json({
        error:
          'invalid_visitor_role',

        message:
          'Choose learner, recruiter, educator_assessor, or guest.',
      });
    }

    // --------------------------------------------------------
    // Consent validation.
    //
    // A session is persisted only when consent is explicitly
    // true. The database also enforces this requirement.
    // --------------------------------------------------------

    if (consentGiven !== true) {
      return res.status(400).json({
        error:
          'visitor_logging_consent_required',

        message:
          'Visitor activity can only be stored after explicit consent.',
      });
    }

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      // ------------------------------------------------------
      // Create the visitor session.
      // ------------------------------------------------------

      const visitorCapability =
        createVisitorCapability();

      const visitorCapabilityHash =
        hashVisitorCapability(
          visitorCapability,
        );

      const sessionResult =
        await client.query(
          `
            INSERT INTO visitor_sessions (
              display_name,
              visitor_role,
              consent_given,
              visitor_capability_hash
            )

            VALUES (
              $1,
              $2,
              TRUE,
              $3
            )

            RETURNING
              visitor_session_id::int
                AS "visitorSessionId",

              display_name
                AS "displayName",

              visitor_role
                AS "visitorRole",

              consent_given
                AS "consentGiven",

              started_at
                AS "startedAt",

              last_active_at
                AS "lastActiveAt",

              completed_at
                AS "completedAt";
          `,
          [
            displayName,
            visitorRole,
            visitorCapabilityHash,
          ],
        );

      const session =
        sessionResult.rows[0];

      await client.query(
        'COMMIT',
      );

      return res.status(201).json({
        persisted:
          true,

        visitorCapability,

        session,
      });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch (rollbackError) {
        console.error(
          'Failed to roll back visitor session transaction:',
          rollbackError.message,
        );
      }

      console.error(
        'Failed to create visitor experience session:',
        error.message,
      );

      return res.status(500).json({
        error:
          'visitor_session_unavailable',

        message:
          'The visitor experience session could not be created.',
      });
    } finally {
      client.release();
    }
  },
);

// ============================================================
// POST /api/experience/sessions/:visitorSessionId/events
// Record one approved, consent-aware visitor interaction event.
//
// The endpoint intentionally accepts only:
// - a fixed event type;
// - an optional valid FirstCommit scenario ID;
// - small, whitelisted metadata.
//
// Arbitrary prompts, passwords, authentication tokens, IP addresses, browser
// fingerprints, and unrestricted payloads are not accepted.
// ============================================================

router.post(
  '/sessions/:visitorSessionId/events',
  async (req, res) => {
    const visitorSessionId =
      Number(
        req.params.visitorSessionId,
      );

    if (
      !Number.isInteger(
        visitorSessionId,
      ) ||
      visitorSessionId <= 0
    ) {
      return res.status(400).json({
        error:
          'invalid_visitor_session_id',

        message:
          'A valid visitor session ID is required.',
      });
    }

    const visitorCapability =
      req.get(
        VISITOR_CAPABILITY_HEADER,
      );

    if (
      typeof visitorCapability !==
        'string' ||
      !/^[0-9a-f]{64}$/.test(
        visitorCapability,
      )
    ) {
      return res.status(401).json({
        error:
          'visitor_session_access_denied',

        message:
          'Visitor session access could not be verified.',
      });
    }

    const visitorCapabilityHash =
      hashVisitorCapability(
        visitorCapability,
      );

    const eventType =
      req.body?.eventType;

    if (
      typeof eventType !== 'string' ||
      !VISITOR_EVENT_TYPES.has(
        eventType,
      )
    ) {
      return res.status(400).json({
        error:
          'invalid_visitor_event_type',

        message:
          'The requested visitor event type is not supported.',
      });
    }

    const rawScenarioId =
      req.body?.scenarioId;

    let scenarioId = null;

    if (
      rawScenarioId !== undefined &&
      rawScenarioId !== null
    ) {
      scenarioId =
        Number(rawScenarioId);

      if (
        !Number.isInteger(
          scenarioId,
        ) ||
        scenarioId <= 0
      ) {
        return res.status(400).json({
          error:
            'invalid_scenario_id',

          message:
            'A valid scenario ID is required when one is supplied.',
        });
      }
    }

    const rawMetadata =
      req.body?.metadata ?? {};

    const metadataValidation =
      validateEventMetadata(
        rawMetadata,
      );

    if (
      !metadataValidation.valid
    ) {
      return res.status(400).json({
        error:
          metadataValidation.error,

        message:
          metadataValidation.message,
      });
    }

    const metadata =
      metadataValidation.metadata;

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      // ------------------------------------------------------
      // Lock and verify the consented visitor session.
      // Completed sessions cannot receive more events.
      // ------------------------------------------------------

      const sessionResult =
        await client.query(
          `
            SELECT
              visitor_session_id::int
                AS "visitorSessionId",

              display_name
                AS "displayName",

              visitor_role
                AS "visitorRole",

              consent_given
                AS "consentGiven",

              completed_at
                AS "completedAt"

            FROM visitor_sessions

            WHERE visitor_session_id = $1
              AND visitor_capability_hash = $2

            FOR UPDATE;
          `,
          [
            visitorSessionId,
            visitorCapabilityHash,
          ],
        );

      if (
        sessionResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(401).json({
          error:
            'visitor_session_access_denied',

          message:
            'Visitor session access could not be verified.',
        });
      }

      const session =
        sessionResult.rows[0];

      if (
        session.consentGiven !== true
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(409).json({
          error:
            'visitor_session_not_consented',

          message:
            'Visitor activity cannot be recorded without consent.',
        });
      }

      if (session.completedAt) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(409).json({
          error:
            'visitor_session_completed',

          message:
            'This visitor session has already been completed.',
        });
      }

      // ------------------------------------------------------
      // Validate the optional scenario before recording it.
      // ------------------------------------------------------

      if (scenarioId !== null) {
        const scenarioResult =
          await client.query(
            `
              SELECT
                scenario_id::int
                  AS "scenarioId"

              FROM scenarios

              WHERE scenario_id = $1

              LIMIT 1;
            `,
            [
              scenarioId,
            ],
          );

        if (
          scenarioResult.rowCount === 0
        ) {
          await client.query(
            'ROLLBACK',
          );

          return res.status(404).json({
            error:
              'scenario_not_found',

            message:
              'The visitor event references a scenario that does not exist.',
          });
        }
      }

      // ------------------------------------------------------
      // Record the approved event.
      // ------------------------------------------------------

      const eventResult =
        await client.query(
          `
            INSERT INTO visitor_events (
              visitor_session_id,
              event_type,
              scenario_id,
              metadata
            )

            VALUES (
              $1,
              $2,
              $3,
              $4::jsonb
            )

            RETURNING
              visitor_event_id::int
                AS "visitorEventId",

              visitor_session_id::int
                AS "visitorSessionId",

              event_type
                AS "eventType",

              scenario_id::int
                AS "scenarioId",

              metadata,

              occurred_at
                AS "occurredAt";
          `,
          [
            visitorSessionId,
            eventType,
            scenarioId,
            JSON.stringify(
              metadata,
            ),
          ],
        );

      // ------------------------------------------------------
      // Touch session activity as part of the same transaction.
      // ------------------------------------------------------

      const sessionActivityResult =
        await client.query(
          `
            UPDATE visitor_sessions

            SET
              last_active_at =
                CURRENT_TIMESTAMP

            WHERE visitor_session_id = $1

            RETURNING
              last_active_at
                AS "lastActiveAt";
          `,
          [
            visitorSessionId,
          ],
        );

      await client.query(
        'COMMIT',
      );

      return res.status(201).json({
        recorded:
          true,

        event:
          eventResult.rows[0],

        session: {
          visitorSessionId:
            session.visitorSessionId,

          displayName:
            session.displayName,

          visitorRole:
            session.visitorRole,

          lastActiveAt:
            sessionActivityResult
              .rows[0]
              .lastActiveAt,
        },
      });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch (rollbackError) {
        console.error(
          'Failed to roll back visitor event transaction:',
          rollbackError.message,
        );
      }

      console.error(
        'Failed to record visitor experience event:',
        error.message,
      );

      return res.status(500).json({
        error:
          'visitor_event_unavailable',

        message:
          'The visitor interaction event could not be recorded.',
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;