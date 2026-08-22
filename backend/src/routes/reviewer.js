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

// ============================================================
// GET /api/reviewer/attempts/:attemptId
// Return one complete investigation for read-only review.
// Reviewer access only.
// ============================================================

router.get(
  '/attempts/:attemptId',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'reviewer') {
      return res.status(403).json({
        error: 'reviewer_access_required',
        message:
          'Only reviewers can access investigation review details.',
      });
    }

    const attemptId = Number(
      req.params.attemptId,
    );

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
      // ------------------------------------------------------
      // Load the submitted or already-reviewed investigation.
      // ------------------------------------------------------

      const attemptResult =
        await pool.query(
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
              s.summary,

              s.severity,

              s.affected_layer
                AS "affectedLayer",

              a.status,

              a.started_at
                AS "startedAt",

              a.submitted_at
                AS "submittedAt",

              a.reviewed_at
                AS "reviewedAt",

              a.probable_root_cause
                AS "probableRootCause",

              a.final_reasoning
                AS "finalReasoning",

              a.recommended_action
                AS "recommendedAction"

            FROM attempts a

            INNER JOIN scenarios s
              ON s.scenario_id =
                 a.scenario_id

            WHERE a.attempt_id = $1
              AND a.status IN (
                'submitted',
                'reviewed'
              )

            LIMIT 1;
          `,
          [
            attemptId,
          ],
        );

      if (
        attemptResult.rowCount === 0
      ) {
        return res.status(404).json({
          error:
            'reviewable_attempt_not_found',

          message:
            'The requested submitted investigation could not be found.',
        });
      }

      const attempt =
        attemptResult.rows[0];

      // ------------------------------------------------------
      // Load the full evidence set for the mission.
      // ------------------------------------------------------

      const evidenceResult =
        await pool.query(
          `
            SELECT
              evidence_id::int
                AS "evidenceId",

              evidence_code
                AS "evidenceCode",

              title,

              evidence_type
                AS "evidenceType",

              content,

              sequence_no::int
                AS "sequenceNo",

              unlock_after_step::int
                AS "unlockAfterStep"

            FROM evidence_items

            WHERE scenario_id = $1

            ORDER BY sequence_no;
          `,
          [
            attempt.scenarioId,
          ],
        );

      // ------------------------------------------------------
      // Load the learner's reasoning trail.
      // ------------------------------------------------------

      const stepsResult =
        await pool.query(
          `
            SELECT
              step_id::int
                AS "stepId",

              attempt_id::int
                AS "attemptId",

              evidence_id::int
                AS "evidenceId",

              step_no::int
                AS "stepNo",

              observation,

              next_action
                AS "nextAction",

              reasoning,

              created_at
                AS "createdAt"

            FROM investigation_steps

            WHERE attempt_id = $1

            ORDER BY step_no;
          `,
          [
            attemptId,
          ],
        );

      // ------------------------------------------------------
      // Load every competing cause and its learner assessment.
      // ------------------------------------------------------

      const causesResult =
        await pool.query(
          `
            SELECT
              co.cause_option_id::int
                AS "causeOptionId",

              co.cause_code
                AS "causeCode",

              co.label,
              co.description,

              co.sequence_no::int
                AS "sequenceNo",

              ca.cause_assessment_id::int
                AS "causeAssessmentId",

              ca.assessment,

              ca.reasoning,

              ca.assessed_at
                AS "assessedAt",

              ca.updated_at
                AS "updatedAt"

            FROM cause_options co

            LEFT JOIN cause_assessments ca
              ON ca.cause_option_id =
                 co.cause_option_id
              AND ca.attempt_id = $2

            WHERE co.scenario_id = $1
              AND co.is_active = TRUE

            ORDER BY co.sequence_no;
          `,
          [
            attempt.scenarioId,
            attemptId,
          ],
        );

      // ------------------------------------------------------
      // Reviewer-facing progress summary.
      // ------------------------------------------------------

      const totalEvidenceCount =
        evidenceResult.rowCount;

      const completedSteps =
        stepsResult.rowCount;

      const totalCauseCount =
        causesResult.rowCount;

      const assessedCauseCount =
        causesResult.rows.filter(
          (cause) =>
            cause.causeAssessmentId !== null,
        ).length;

      const conclusionComplete =
        Boolean(
          attempt.probableRootCause?.trim() &&
          attempt.finalReasoning?.trim() &&
          attempt.recommendedAction?.trim(),
        );

      return res.status(200).json({
        attempt: {
          attemptId:
            attempt.attemptId,

          learnerId:
            attempt.learnerId,

          scenarioId:
            attempt.scenarioId,

          scenarioCode:
            attempt.scenarioCode,

          title:
            attempt.title,

          summary:
            attempt.summary,

          severity:
            attempt.severity,

          affectedLayer:
            attempt.affectedLayer,

          status:
            attempt.status,

          startedAt:
            attempt.startedAt,

          submittedAt:
            attempt.submittedAt,

          reviewedAt:
            attempt.reviewedAt,
        },

        reviewProgress: {
          completedSteps,
          totalEvidenceCount,
          assessedCauseCount,
          totalCauseCount,
          conclusionComplete,
        },

        evidence:
          evidenceResult.rows,

        steps:
          stepsResult.rows,

        causes:
          causesResult.rows,

        conclusion: {
          probableRootCause:
            attempt.probableRootCause,

          finalReasoning:
            attempt.finalReasoning,

          recommendedAction:
            attempt.recommendedAction,
        },
      });
    } catch (error) {
      console.error(
        'Failed to load reviewer investigation detail:',
        error.message,
      );

      return res.status(500).json({
        error:
          'reviewer_investigation_unavailable',

        message:
          'The submitted investigation could not be loaded for review.',
      });
    }
  },
);

module.exports = router;