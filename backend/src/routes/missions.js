const express = require('express');

const {
  pool,
} = require('../config/database');

const router = express.Router();

// GET /api/missions
// Returns the published FirstCommit engineering missions
// that are available to learners.

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.scenario_id::int AS "scenarioId",
        s.scenario_code AS "scenarioCode",
        s.title,
        s.summary,
        s.severity,
        s.affected_layer AS "affectedLayer",
        s.estimated_minutes AS "estimatedMinutes",

        (
          SELECT COUNT(*)::int
          FROM evidence_items e
          WHERE e.scenario_id = s.scenario_id
        ) AS "evidenceCount",

        (
          SELECT COUNT(*)::int
          FROM cause_options c
          WHERE c.scenario_id = s.scenario_id
            AND c.is_active = TRUE
        ) AS "causeCount"

      FROM scenarios s

      WHERE s.is_published = TRUE

      ORDER BY s.scenario_code;
    `);

    res.status(200).json({
      count: result.rowCount,
      missions: result.rows,
    });
  } catch (error) {
    console.error('Failed to load missions:', error.message);

    res.status(500).json({
      error: 'missions_unavailable',
      message: 'The available missions could not be loaded.',
    });
  }
});
// GET /api/missions/:scenarioId
// Returns one published mission together with the evidence available
// when the investigation begins and its active competing causes.

router.get('/:scenarioId', async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);

  if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
    return res.status(400).json({
      error: 'invalid_scenario_id',
      message: 'A valid mission ID is required.',
    });
  }

  try {
    const missionResult = await pool.query(
      `
        SELECT
          scenario_id::int AS "scenarioId",
          scenario_code AS "scenarioCode",
          title,
          summary,
          severity,
          affected_layer AS "affectedLayer",
          estimated_minutes AS "estimatedMinutes"

        FROM scenarios

        WHERE scenario_id = $1
          AND is_published = TRUE;
      `,
      [scenarioId]
    );

    if (missionResult.rowCount === 0) {
      return res.status(404).json({
        error: 'mission_not_found',
        message: 'The requested mission could not be found.',
      });
    }

    const evidenceResult = await pool.query(
      `
        SELECT
          evidence_id::int AS "evidenceId",
          evidence_code AS "evidenceCode",
          title,
          evidence_type AS "evidenceType",
          content,
          sequence_no AS "sequenceNo",
          unlock_after_step AS "unlockAfterStep"

        FROM evidence_items

        WHERE scenario_id = $1
          AND unlock_after_step = 0

        ORDER BY sequence_no;
      `,
      [scenarioId]
    );

    const causesResult = await pool.query(
      `
        SELECT
          cause_option_id::int AS "causeOptionId",
          cause_code AS "causeCode",
          label,
          description,
          sequence_no AS "sequenceNo"

        FROM cause_options

        WHERE scenario_id = $1
          AND is_active = TRUE

        ORDER BY sequence_no;
      `,
      [scenarioId]
    );

    res.status(200).json({
      mission: missionResult.rows[0],
      availableEvidence: evidenceResult.rows,
      competingCauses: causesResult.rows,
    });
  } catch (error) {
    console.error('Failed to load mission:', error.message);

    res.status(500).json({
      error: 'mission_unavailable',
      message: 'The requested mission could not be loaded.',
    });
  }
});
module.exports = router;