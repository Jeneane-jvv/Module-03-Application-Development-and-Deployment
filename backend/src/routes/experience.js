const express = require('express');

const {
  pool,
} = require('../config/database');

const router = express.Router();

const VISITOR_ROLES = new Set([
  'learner',
  'recruiter',
  'educator_assessor',
  'guest',
]);

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

      const sessionResult =
        await client.query(
          `
            INSERT INTO visitor_sessions (
              display_name,
              visitor_role,
              consent_given
            )

            VALUES (
              $1,
              $2,
              TRUE
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

module.exports = router;