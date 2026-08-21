const express = require('express');

const {
  pool,
} = require('../config/database');

const authenticate = require('../middleware/authenticate');

const router = express.Router();

// ============================================================
// POST /api/attempts
// Start or resume a learner investigation.
// ============================================================

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

// ============================================================
// GET /api/attempts/:attemptId
// Restore a learner's persisted investigation state.
// ============================================================

router.get(
  '/:attemptId',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'learner') {
      return res.status(403).json({
        error: 'learner_access_required',
        message:
          'Only learners can access investigation attempts.',
      });
    }

    const attemptId = Number(req.params.attemptId);

    if (
      !Number.isInteger(attemptId) ||
      attemptId <= 0
    ) {
      return res.status(400).json({
        error: 'invalid_attempt_id',
        message:
          'A valid investigation attempt ID is required.',
      });
    }

    try {
      // Ownership is checked here as well.
      // A learner cannot retrieve another learner's attempt.
      const attemptResult = await pool.query(
        `
          SELECT
            a.attempt_id::int AS "attemptId",
            a.learner_id::int AS "learnerId",
            a.scenario_id::int AS "scenarioId",
            a.status,
            a.started_at AS "startedAt",
            a.submitted_at AS "submittedAt",
            a.reviewed_at AS "reviewedAt"

          FROM attempts a

          WHERE a.attempt_id = $1
            AND a.learner_id = $2

          LIMIT 1;
        `,
        [
          attemptId,
          req.user.userId,
        ],
      );

      if (attemptResult.rowCount === 0) {
        return res.status(404).json({
          error: 'attempt_not_found',
          message:
            'The requested investigation could not be found.',
        });
      }

      const attempt = attemptResult.rows[0];

      const stepsResult = await pool.query(
        `
          SELECT
            step_id::int AS "stepId",
            attempt_id::int AS "attemptId",
            evidence_id::int AS "evidenceId",
            step_no::int AS "stepNo",
            observation,
            next_action AS "nextAction",
            reasoning,
            created_at AS "createdAt"

          FROM investigation_steps

          WHERE attempt_id = $1

          ORDER BY step_no;
        `,
        [attemptId],
      );

      const progressResult = await pool.query(
        `
          SELECT
            COALESCE(
              MAX(step_no),
              0
            )::int AS "completedSteps"

          FROM investigation_steps

          WHERE attempt_id = $1;
        `,
        [attemptId],
      );

      const completedSteps =
        progressResult.rows[0].completedSteps;

      const availableEvidenceResult =
        await pool.query(
          `
            SELECT
              evidence_id::int AS "evidenceId",
              evidence_code AS "evidenceCode",
              title,
              evidence_type AS "evidenceType",
              content,
              sequence_no::int AS "sequenceNo",
              unlock_after_step::int AS "unlockAfterStep"

            FROM evidence_items

            WHERE scenario_id = $1
              AND unlock_after_step <= $2

            ORDER BY sequence_no;
          `,
          [
            attempt.scenarioId,
            completedSteps,
          ],
        );

      return res.status(200).json({
        attempt,

        progress: {
          completedSteps,
        },

        steps: stepsResult.rows,

        availableEvidence:
          availableEvidenceResult.rows,
      });
    } catch (error) {
      console.error(
        'Failed to load investigation:',
        error.message,
      );

      return res.status(500).json({
        error: 'attempt_unavailable',
        message:
          'The investigation could not be loaded.',
      });
    }
  },
);

// ============================================================
// POST /api/attempts/:attemptId/steps
// Record one learner reasoning step.
// ============================================================

router.post(
  '/:attemptId/steps',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'learner') {
      return res.status(403).json({
        error: 'learner_access_required',
        message:
          'Only learners can record investigation steps.',
      });
    }

    const attemptId = Number(req.params.attemptId);

    if (
      !Number.isInteger(attemptId) ||
      attemptId <= 0
    ) {
      return res.status(400).json({
        error: 'invalid_attempt_id',
        message:
          'A valid investigation attempt ID is required.',
      });
    }

    const evidenceInput = req.body?.evidenceId;

    const evidenceId =
      evidenceInput === null ||
      evidenceInput === undefined
        ? null
        : Number(evidenceInput);

    if (
      evidenceId !== null &&
      (
        !Number.isInteger(evidenceId) ||
        evidenceId <= 0
      )
    ) {
      return res.status(400).json({
        error: 'invalid_evidence_id',
        message: 'A valid evidence ID is required.',
      });
    }

    const observation =
      typeof req.body?.observation === 'string'
        ? req.body.observation.trim()
        : '';

    const nextAction =
      typeof req.body?.nextAction === 'string'
        ? req.body.nextAction.trim()
        : '';

    const reasoning =
      typeof req.body?.reasoning === 'string'
        ? req.body.reasoning.trim()
        : '';

    if (!observation) {
      return res.status(400).json({
        error: 'observation_required',
        message:
          'Describe what you observed before continuing.',
      });
    }

    if (!nextAction) {
      return res.status(400).json({
        error: 'next_action_required',
        message:
          'Describe what you should investigate next.',
      });
    }

    if (!reasoning) {
      return res.status(400).json({
        error: 'reasoning_required',
        message:
          'Explain why your next action follows from the evidence.',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Lock the attempt so simultaneous requests cannot
      // calculate the same next step number.
      const attemptResult = await client.query(
        `
          SELECT
            a.attempt_id::int AS "attemptId",
            a.learner_id::int AS "learnerId",
            a.scenario_id::int AS "scenarioId",
            a.status,
            s.scenario_code AS "scenarioCode"

          FROM attempts a

          INNER JOIN scenarios s
            ON s.scenario_id = a.scenario_id

          WHERE a.attempt_id = $1
            AND a.learner_id = $2

          FOR UPDATE OF a;
        `,
        [
          attemptId,
          req.user.userId,
        ],
      );

      if (attemptResult.rowCount === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
          error: 'attempt_not_found',
          message:
            'The requested investigation could not be found.',
        });
      }

      const attempt = attemptResult.rows[0];

      if (attempt.status !== 'in_progress') {
        await client.query('ROLLBACK');

        return res.status(409).json({
          error: 'invalid_attempt_state',
          message:
            'Only an in-progress investigation can record new reasoning steps.',
        });
      }

      const progressResult = await client.query(
        `
          SELECT
            COALESCE(
              MAX(step_no),
              0
            )::int AS "completedSteps"

          FROM investigation_steps

          WHERE attempt_id = $1;
        `,
        [attemptId],
      );

      const completedSteps =
        progressResult.rows[0].completedSteps;

      const nextStepNo =
        completedSteps + 1;

      if (evidenceId !== null) {
        const evidenceResult = await client.query(
          `
            SELECT
              evidence_id::int AS "evidenceId",
              evidence_code AS "evidenceCode",
              unlock_after_step::int AS "unlockAfterStep"

            FROM evidence_items

            WHERE evidence_id = $1
              AND scenario_id = $2

            LIMIT 1;
          `,
          [
            evidenceId,
            attempt.scenarioId,
          ],
        );

        if (evidenceResult.rowCount === 0) {
          await client.query('ROLLBACK');

          return res.status(400).json({
            error: 'invalid_evidence',
            message:
              'The selected evidence does not belong to this mission.',
          });
        }

        const evidence =
          evidenceResult.rows[0];

        if (
          evidence.unlockAfterStep >
          completedSteps
        ) {
          await client.query('ROLLBACK');

          return res.status(409).json({
            error: 'evidence_locked',
            message:
              'That evidence is not available at the current investigation step.',
          });
        }
      }

      const stepResult = await client.query(
        `
          INSERT INTO investigation_steps (
            attempt_id,
            evidence_id,
            step_no,
            observation,
            next_action,
            reasoning
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )

          RETURNING
            step_id::int AS "stepId",
            attempt_id::int AS "attemptId",
            evidence_id::int AS "evidenceId",
            step_no::int AS "stepNo",
            observation,
            next_action AS "nextAction",
            reasoning,
            created_at AS "createdAt";
        `,
        [
          attemptId,
          evidenceId,
          nextStepNo,
          observation,
          nextAction,
          reasoning,
        ],
      );

      const step = stepResult.rows[0];

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
            'INVESTIGATION_STEP_RECORDED',
            'attempt',
            $2,
            'success',
            $3,
            $4::jsonb
          );
        `,
        [
          req.user.userId,
          attemptId,
          `Learner recorded investigation step ${nextStepNo} for mission ${attempt.scenarioCode}.`,
          JSON.stringify({
            attemptId,
            scenarioId:
              attempt.scenarioId,
            stepId:
              step.stepId,
            stepNo:
              step.stepNo,
            evidenceId:
              step.evidenceId,
          }),
        ],
      );

      const availableEvidenceResult =
        await client.query(
          `
            SELECT
              evidence_id::int AS "evidenceId",
              evidence_code AS "evidenceCode",
              title,
              evidence_type AS "evidenceType",
              content,
              sequence_no::int AS "sequenceNo",
              unlock_after_step::int AS "unlockAfterStep"

            FROM evidence_items

            WHERE scenario_id = $1
              AND unlock_after_step <= $2

            ORDER BY sequence_no;
          `,
          [
            attempt.scenarioId,
            nextStepNo,
          ],
        );

      const newlyUnlockedEvidence =
        availableEvidenceResult.rows.filter(
          (evidence) =>
            evidence.unlockAfterStep ===
            nextStepNo,
        );

      await client.query('COMMIT');

      return res.status(201).json({
        step,

        progress: {
          completedSteps: nextStepNo,
        },

        availableEvidence:
          availableEvidenceResult.rows,

        newlyUnlockedEvidence,
      });
    } catch (error) {
      await client.query('ROLLBACK');

      console.error(
        'Failed to record investigation step:',
        error.message,
      );

      return res.status(500).json({
        error: 'investigation_step_unavailable',
        message:
          'The investigation step could not be recorded.',
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;