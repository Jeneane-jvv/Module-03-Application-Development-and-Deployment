const express = require('express');

const {
  pool,
} = require('../config/database');

const authenticate = require('../middleware/authenticate');

const router = express.Router();

// POST /api/attempts
// Starts a learner investigation for a published mission.
// If an in-progress investigation already exists for the same
// learner and mission, that existing attempt is returned.

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({
      error: 'learner_access_required',
      message: 'Only learners can start an investigation.',
    });
  }

  const scenarioId = Number(req.body?.scenarioId);

  if (
    !Number.isInteger(scenarioId) ||
    scenarioId <= 0
  ) {
    return res.status(400).json({
      error: 'invalid_scenario_id',
      message: 'A valid mission ID is required.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const scenarioResult = await client.query(
      `
        SELECT
          scenario_id::int AS "scenarioId",
          scenario_code AS "scenarioCode",
          title

        FROM scenarios

        WHERE scenario_id = $1
          AND is_published = TRUE

        LIMIT 1;
      `,
      [scenarioId],
    );

    if (scenarioResult.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        error: 'mission_not_found',
        message: 'The requested mission could not be found.',
      });
    }

    const attemptResult = await client.query(
      `
        INSERT INTO attempts (
          learner_id,
          scenario_id
        )
        VALUES ($1, $2)

        ON CONFLICT (learner_id, scenario_id)
          WHERE status = 'in_progress'

        DO NOTHING

        RETURNING
          attempt_id::int AS "attemptId",
          learner_id::int AS "learnerId",
          scenario_id::int AS "scenarioId",
          status,
          started_at AS "startedAt";
      `,
      [
        req.user.userId,
        scenarioId,
      ],
    );

    let attempt;
    let created = false;

    if (attemptResult.rowCount === 1) {
      attempt = attemptResult.rows[0];
      created = true;

      await client.query(
        `
          INSERT INTO audit_events (
            user_id,
            event_type,
            entity_type,
            entity_id,
            outcome,
            description,
            metadata
          )
          VALUES (
            $1,
            'MISSION_STARTED',
            'attempt',
            $2,
            'success',
            $3,
            $4::jsonb
          );
        `,
        [
          req.user.userId,
          attempt.attemptId,
          `Learner started mission ${scenarioResult.rows[0].scenarioCode}.`,
          JSON.stringify({
            scenarioId,
            scenarioCode:
              scenarioResult.rows[0].scenarioCode,
          }),
        ],
      );
    } else {
      const existingAttemptResult =
        await client.query(
          `
            SELECT
              attempt_id::int AS "attemptId",
              learner_id::int AS "learnerId",
              scenario_id::int AS "scenarioId",
              status,
              started_at AS "startedAt"

            FROM attempts

            WHERE learner_id = $1
              AND scenario_id = $2
              AND status = 'in_progress'

            LIMIT 1;
          `,
          [
            req.user.userId,
            scenarioId,
          ],
        );

      attempt = existingAttemptResult.rows[0];
    }

    await client.query('COMMIT');

    return res.status(created ? 201 : 200).json({
      created,
      attempt,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'Failed to start investigation:',
      error.message,
    );

    return res.status(500).json({
      error: 'attempt_unavailable',
      message: 'The investigation could not be started.',
    });
  } finally {
    client.release();
  }
});

module.exports = router;