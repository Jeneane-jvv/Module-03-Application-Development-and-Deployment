const express = require('express');

const {
  pool,
} = require('../config/database');

const authenticate = require('../middleware/authenticate');

const router = express.Router();

const REVIEW_RATINGS = new Set([
  'strong',
  'developing',
  'needs_revision',
]);

function isValidReviewRating(value) {
  return (
    typeof value === 'string' &&
    REVIEW_RATINGS.has(value)
  );
}

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

// ============================================================
// POST /api/reviewer/attempts/:attemptId/review
// Record the reviewer's assessment and complete the review.
// Reviewer access only.
//
// The feedback INSERT, attempt status update, reviewed timestamp,
// and audit event are committed as one database transaction.
// ============================================================

router.post(
  '/attempts/:attemptId/review',
  authenticate,
  async (req, res) => {
    if (req.user.role !== 'reviewer') {
      return res.status(403).json({
        error: 'reviewer_access_required',
        message:
          'Only reviewers can record investigation feedback.',
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

    const reviewerId = Number(
      req.user.userId ??
      req.user.user_id ??
      req.user.id,
    );

    if (
      !Number.isInteger(reviewerId) ||
      reviewerId <= 0
    ) {
      return res.status(401).json({
        error:
          'invalid_authentication_context',

        message:
          'The authenticated reviewer could not be identified.',
      });
    }

    const {
      reasoningQuality,
      evidenceUsage,
      technicalCommunication,
      feedbackText,
    } = req.body ?? {};

    if (
      !isValidReviewRating(
        reasoningQuality,
      )
    ) {
      return res.status(400).json({
        error:
          'invalid_reasoning_quality',

        message:
          'Reasoning quality must be strong, developing, or needs_revision.',
      });
    }

    if (
      !isValidReviewRating(
        evidenceUsage,
      )
    ) {
      return res.status(400).json({
        error:
          'invalid_evidence_usage',

        message:
          'Evidence usage must be strong, developing, or needs_revision.',
      });
    }

    if (
      !isValidReviewRating(
        technicalCommunication,
      )
    ) {
      return res.status(400).json({
        error:
          'invalid_technical_communication',

        message:
          'Technical communication must be strong, developing, or needs_revision.',
      });
    }

    if (
      typeof feedbackText !== 'string' ||
      feedbackText.trim().length === 0
    ) {
      return res.status(400).json({
        error:
          'invalid_feedback_text',

        message:
          'Reviewer feedback text is required.',
      });
    }

    const normalizedFeedbackText =
      feedbackText.trim();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      // ------------------------------------------------------
      // Lock the attempt so two reviewers cannot complete the
      // same submitted investigation concurrently.
      // ------------------------------------------------------

      const attemptResult =
        await client.query(
          `
            SELECT
              a.attempt_id::int
                AS "attemptId",

              a.learner_id::int
                AS "learnerId",

              a.scenario_id::int
                AS "scenarioId",

              a.status,

              a.submitted_at
                AS "submittedAt",

              a.reviewed_at
                AS "reviewedAt",

              s.scenario_code
                AS "scenarioCode",

              s.title

            FROM attempts a

            INNER JOIN scenarios s
              ON s.scenario_id =
                 a.scenario_id

            WHERE a.attempt_id = $1

            LIMIT 1

            FOR UPDATE OF a;
          `,
          [
            attemptId,
          ],
        );

      if (
        attemptResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(404).json({
          error:
            'attempt_not_found',

          message:
            'The requested investigation attempt could not be found.',
        });
      }

      const attempt =
        attemptResult.rows[0];

      // ------------------------------------------------------
      // Feedback may only be recorded after learner submission.
      // A reviewed or in-progress attempt is locked.
      // ------------------------------------------------------

      if (
        attempt.status !== 'submitted'
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(409).json({
          error:
            'invalid_attempt_state',

          message:
            attempt.status === 'reviewed'
              ? 'This investigation has already been reviewed.'
              : 'Only submitted investigations can be reviewed.',
        });
      }

      // ------------------------------------------------------
      // Explicit duplicate check.
      // The database UNIQUE(attempt_id) constraint remains the
      // final protection against duplicate feedback.
      // ------------------------------------------------------

      const existingFeedbackResult =
        await client.query(
          `
            SELECT
              feedback_id::int
                AS "feedbackId"

            FROM feedback

            WHERE attempt_id = $1

            LIMIT 1;
          `,
          [
            attemptId,
          ],
        );

      if (
        existingFeedbackResult.rowCount > 0
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(409).json({
          error:
            'feedback_already_exists',

          message:
            'Reviewer feedback has already been recorded for this investigation.',
        });
      }

      // ------------------------------------------------------
      // Record reviewer feedback.
      //
      // feedback_id is GENERATED ALWAYS AS IDENTITY.
      // created_at uses the database CURRENT_TIMESTAMP default.
      // ------------------------------------------------------

      const feedbackResult =
        await client.query(
          `
            INSERT INTO feedback (
              attempt_id,
              reviewer_id,
              reasoning_quality,
              evidence_usage,
              technical_communication,
              feedback_text
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
              feedback_id::int
                AS "feedbackId",

              attempt_id::int
                AS "attemptId",

              reviewer_id::int
                AS "reviewerId",

              reasoning_quality
                AS "reasoningQuality",

              evidence_usage
                AS "evidenceUsage",

              technical_communication
                AS "technicalCommunication",

              feedback_text
                AS "feedbackText",

              created_at
                AS "createdAt";
          `,
          [
            attemptId,
            reviewerId,
            reasoningQuality,
            evidenceUsage,
            technicalCommunication,
            normalizedFeedbackText,
          ],
        );

      const feedback =
        feedbackResult.rows[0];

      // ------------------------------------------------------
      // Complete the attempt review.
      // ------------------------------------------------------

      const reviewedAttemptResult =
        await client.query(
          `
            UPDATE attempts

            SET
              status = 'reviewed',
              reviewed_at =
                CURRENT_TIMESTAMP

            WHERE attempt_id = $1
              AND status = 'submitted'

            RETURNING
              attempt_id::int
                AS "attemptId",

              status,

              submitted_at
                AS "submittedAt",

              reviewed_at
                AS "reviewedAt";
          `,
          [
            attemptId,
          ],
        );

      if (
        reviewedAttemptResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK',
        );

        return res.status(409).json({
          error:
            'invalid_attempt_state',

          message:
            'The investigation is no longer available for review.',
        });
      }

      const reviewedAttempt =
        reviewedAttemptResult.rows[0];

      // ------------------------------------------------------
      // Record a safe audit event.
      //
      // Deliberately do not store the full reviewer feedback
      // text in audit metadata.
      // ------------------------------------------------------

      const auditMetadata =
        JSON.stringify({
          feedbackId:
            feedback.feedbackId,

          scenarioCode:
            attempt.scenarioCode,

          reasoningQuality,

          evidenceUsage,

          technicalCommunication,
        });

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
            'MISSION_REVIEWED',
            'attempt',
            $2,
            'success',
            $3,
            $4::jsonb
          );
        `,
        [
          reviewerId,
          attemptId,
          `Reviewer completed review for mission ${attempt.scenarioCode}.`,
          auditMetadata,
        ],
      );

      await client.query(
        'COMMIT',
      );

      return res.status(201).json({
        message:
          'Investigation review recorded successfully.',

        attempt: {
          attemptId:
            reviewedAttempt.attemptId,

          scenarioCode:
            attempt.scenarioCode,

          title:
            attempt.title,

          status:
            reviewedAttempt.status,

          submittedAt:
            reviewedAttempt.submittedAt,

          reviewedAt:
            reviewedAttempt.reviewedAt,
        },

        feedback,
      });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch (rollbackError) {
        console.error(
          'Failed to roll back reviewer feedback transaction:',
          rollbackError.message,
        );
      }

      if (
        error.code === '23505'
      ) {
        return res.status(409).json({
          error:
            'feedback_already_exists',

          message:
            'Reviewer feedback has already been recorded for this investigation.',
        });
      }

      console.error(
        'Failed to record reviewer feedback:',
        error.message,
      );

      return res.status(500).json({
        error:
          'review_submission_failed',

        message:
          'Reviewer feedback could not be recorded.',
      });
    } finally {
      client.release();
    }
  },
);

module.exports = router;