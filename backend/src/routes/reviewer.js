const express = require('express');

const {
  pool,
} = require('../config/database');

const authenticate = require('../middleware/authenticate');

const router = express.Router();

// ============================================================
// GET /api/reviewer/attempts
// Return investigations that have been submitted for review.
// Reviewer access only.
// ============================================================

router.get(
  '/attempts',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'reviewer') {
      return res.status(403).json({
        error: 'reviewer_access_required',
        message:
          'Only reviewers can access submitted investigations.',
      });
    }

    try {
      const result = await pool.query(
        `
          SELECT
            a.attempt_id::int
              AS "attemptId",

            a.learner_id::int
              AS "learnerId",

            a.scenario_id::int
              AS "scenarioId",

            s.scenario_code
              AS "scenarioCode",

            s.title,

            a.status,

            a.started_at
              AS "startedAt",

            a.submitted_at
              AS "submittedAt",

            a.reviewed_at
              AS "reviewedAt"

          FROM attempts a

          INNER JOIN scenarios s
            ON s.scenario_id =
               a.scenario_id

          WHERE a.status = 'submitted'

          ORDER BY
            a.submitted_at ASC,
            a.attempt_id ASC;
        `,
      );

      return res.status(200).json({
        investigations:
          result.rows,
      });
    } catch (error) {
      console.error(
        'Failed to load reviewer investigations:',
        error.message,
      );

      return res.status(500).json({
        error:
          'reviewer_investigations_unavailable',

        message:
          'Submitted investigations could not be loaded.',
      });
    }
  },
);

module.exports = router;