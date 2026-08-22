import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ActivatedRoute } from '@angular/router';

import {
  Attempt,
  AttemptStateResponse,
  Attempts,
  CauseAssessment,
  CauseAssessmentStatus,
  CauseProgress,
  ConclusionProgress,
  EvidenceProgress,
  FinalConclusion,
  InvestigationEvidence,
  InvestigationStep,
  RecordStepResponse,
} from '../../services/attempts';

import {
  CauseOption,
  MissionDetailResponse,
  Missions,
} from '../../services/missions';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-mission-workspace',
  styleUrl: './mission-workspace.scss',
  templateUrl: './mission-workspace.html',
})
export class MissionWorkspace implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly missionsService =
    inject(Missions);

  private readonly attemptsService =
    inject(Attempts);

  readonly missionData =
    signal<MissionDetailResponse | null>(
      null,
    );

  readonly currentAttempt =
    signal<Attempt | null>(
      null,
    );

  readonly investigationSteps =
    signal<InvestigationStep[]>([]);

  readonly completedSteps =
    signal(0);

  readonly evidenceProgress =
    signal<EvidenceProgress>({
      availableEvidenceCount: 0,
      totalEvidenceCount: 0,
      allEvidenceUnlocked: false,
    });

  readonly newlyUnlockedEvidence =
    signal<InvestigationEvidence[]>([]);

  readonly causeAssessments =
    signal<CauseAssessment[]>([]);

  readonly causeProgress =
    signal<CauseProgress>({
      assessedCauseCount: 0,
      totalCauseCount: 0,
      allCausesAssessed: false,
    });

  readonly selectedCause =
    signal<CauseOption | null>(
      null,
    );

  readonly conclusion =
    signal<FinalConclusion>({
      probableRootCause: null,
      finalReasoning: null,
      recommendedAction: null,
    });

  readonly conclusionProgress =
    signal<ConclusionProgress>({
      isConclusionComplete: false,
    });

  readonly isLoading =
    signal(true);

  readonly isStartingAttempt =
    signal(false);

  readonly isSavingStep =
    signal(false);

  readonly isSavingCause =
    signal(false);

  readonly isSavingConclusion =
    signal(false);

  readonly isSubmittingAttempt =
    signal(false);

  readonly loadError =
    signal<string | null>(
      null,
    );

  readonly attemptError =
    signal<string | null>(
      null,
    );

  readonly stepError =
    signal<string | null>(
      null,
    );

  readonly stepSuccess =
    signal<string | null>(
      null,
    );

  readonly causeError =
    signal<string | null>(
      null,
    );

  readonly causeSuccess =
    signal<string | null>(
      null,
    );

  readonly conclusionError =
    signal<string | null>(
      null,
    );

  readonly conclusionSuccess =
    signal<string | null>(
      null,
    );

  readonly submitError =
    signal<string | null>(
      null,
    );

  readonly submitSuccess =
    signal<string | null>(
      null,
    );

  readonly stepForm = new FormGroup({
    evidenceId:
      new FormControl<number | null>(
        null,
        {
          validators: [
            Validators.required,
          ],
        },
      ),

    observation:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),

    nextAction:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),

    reasoning:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),
  });

  readonly causeForm = new FormGroup({
    assessment:
      new FormControl<CauseAssessmentStatus | null>(
        null,
        {
          validators: [
            Validators.required,
          ],
        },
      ),

    reasoning:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),
  });

  readonly conclusionForm = new FormGroup({
    probableRootCause:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),

    finalReasoning:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),

    recommendedAction:
      new FormControl(
        '',
        {
          nonNullable: true,
          validators: [
            Validators.required,
          ],
        },
      ),
  });

  ngOnInit(): void {
    const scenarioId = Number(
      this.route.snapshot.paramMap.get(
        'scenarioId',
      ),
    );

    if (
      !Number.isInteger(scenarioId) ||
      scenarioId <= 0
    ) {
      this.isLoading.set(false);

      this.loadError.set(
        'A valid mission ID is required.',
      );

      return;
    }

    this.loadMission(scenarioId);
  }

  startInvestigation(): void {
    const data =
      this.missionData();

    if (
      !data ||
      this.isStartingAttempt()
    ) {
      return;
    }

    this.isStartingAttempt.set(true);
    this.attemptError.set(null);

    this.attemptsService
      .startAttempt(
        data.mission.scenarioId,
      )
      .subscribe({
        next: (response) => {
          this.currentAttempt.set(
            response.attempt,
          );

          this.restoreAttemptState(
            response.attempt.attemptId,
          );

          console.log({
            attemptId:
              response.attempt.attemptId,

            scenarioId:
              response.attempt.scenarioId,

            status:
              response.attempt.status,

            created:
              response.created,
          });
        },

        error: (error) => {
          this.isStartingAttempt.set(
            false,
          );

          this.attemptError.set(
            'The investigation could not be started.',
          );

          console.error({
            attemptStarted: false,
            status: error.status,
          });
        },
      });
  }

  submitInvestigationStep(): void {
    const attempt =
      this.currentAttempt();

    if (
      !attempt ||
      this.isSavingStep()
    ) {
      return;
    }

    if (
      this.evidenceProgress()
        .allEvidenceUnlocked
    ) {
      this.stepError.set(
        'All mission evidence is available. Continue with cause assessment.',
      );

      return;
    }

    if (this.stepForm.invalid) {
      this.stepForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.stepForm.getRawValue();

    const observation =
      formValue.observation.trim();

    const nextAction =
      formValue.nextAction.trim();

    const reasoning =
      formValue.reasoning.trim();

    if (
      !observation ||
      !nextAction ||
      !reasoning
    ) {
      this.stepError.set(
        'Observation, next action and reasoning are required.',
      );

      return;
    }

    this.isSavingStep.set(true);
    this.stepError.set(null);
    this.stepSuccess.set(null);
    this.newlyUnlockedEvidence.set([]);

    this.attemptsService
      .recordStep(
        attempt.attemptId,
        {
          evidenceId:
            formValue.evidenceId,

          observation,
          nextAction,
          reasoning,
        },
      )
      .subscribe({
        next: (response) => {
          this.applyStepResponse(
            response,
          );

          this.isSavingStep.set(false);

          this.stepForm.reset({
            evidenceId: null,
            observation: '',
            nextAction: '',
            reasoning: '',
          });

          if (
            response
              .newlyUnlockedEvidence
              .length > 0
          ) {
            const evidenceCodes =
              response
                .newlyUnlockedEvidence
                .map(
                  (evidence) =>
                    evidence.evidenceCode,
                )
                .join(', ');

            this.stepSuccess.set(
              `Investigation step saved. New evidence unlocked: ${evidenceCodes}.`,
            );
          } else {
            this.stepSuccess.set(
              'Investigation step saved.',
            );
          }
        },

        error: (error) => {
          this.isSavingStep.set(false);

          this.stepError.set(
            error.error?.message ??
              'The investigation step could not be saved.',
          );
        },
      });
  }

  editCause(
    cause: CauseOption,
  ): void {
    this.selectedCause.set(cause);

    this.causeError.set(null);
    this.causeSuccess.set(null);

    const existing =
      this.findCauseAssessment(
        cause.causeOptionId,
      );

    this.causeForm.reset({
      assessment:
        existing?.assessment ?? null,

      reasoning:
        existing?.reasoning ?? '',
    });
  }

  cancelCauseAssessment(): void {
    this.selectedCause.set(null);

    this.causeError.set(null);
    this.causeSuccess.set(null);

    this.causeForm.reset({
      assessment: null,
      reasoning: '',
    });
  }

  submitCauseAssessment(): void {
    const attempt =
      this.currentAttempt();

    const cause =
      this.selectedCause();

    if (
      !attempt ||
      !cause ||
      this.isSavingCause()
    ) {
      return;
    }

    if (this.causeForm.invalid) {
      this.causeForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.causeForm.getRawValue();

    const assessment =
      formValue.assessment;

    const reasoning =
      formValue.reasoning.trim();

    if (
      !assessment ||
      !reasoning
    ) {
      this.causeError.set(
        'Choose an assessment and explain your reasoning.',
      );

      return;
    }

    this.isSavingCause.set(true);
    this.causeError.set(null);
    this.causeSuccess.set(null);

    this.attemptsService
      .assessCause(
        attempt.attemptId,
        cause.causeOptionId,
        {
          assessment,
          reasoning,
        },
      )
      .subscribe({
        next: (response) => {
          const restoredAssessment:
            CauseAssessment = {
              causeAssessmentId:
                response.assessment
                  .causeAssessmentId,

              attemptId:
                response.assessment
                  .attemptId,

              causeOptionId:
                response.assessment
                  .causeOptionId,

              causeCode:
                response.cause
                  .causeCode,

              label:
                response.cause
                  .label,

              assessment:
                response.assessment
                  .assessment,

              reasoning:
                response.assessment
                  .reasoning,

              assessedAt:
                response.assessment
                  .assessedAt,

              updatedAt:
                response.assessment
                  .updatedAt,
            };

          this.causeAssessments.update(
            (assessments) => {
              const remaining =
                assessments.filter(
                  (item) =>
                    item.causeOptionId !==
                    restoredAssessment
                      .causeOptionId,
                );

              return [
                ...remaining,
                restoredAssessment,
              ].sort(
                (a, b) =>
                  a.causeOptionId -
                  b.causeOptionId,
              );
            },
          );

          this.causeProgress.set(
            response.causeProgress,
          );

          this.isSavingCause.set(false);

          this.causeSuccess.set(
            `${response.cause.causeCode} saved as ${response.assessment.assessment}.`,
          );

          this.selectedCause.set(null);

          this.causeForm.reset({
            assessment: null,
            reasoning: '',
          });
        },

        error: (error) => {
          this.isSavingCause.set(false);

          this.causeError.set(
            error.error?.message ??
              'The cause assessment could not be saved.',
          );
        },
      });
  }

  submitConclusion(): void {
    const attempt =
      this.currentAttempt();

    if (
      !attempt ||
      this.isSavingConclusion()
    ) {
      return;
    }

    if (
      !this.evidenceProgress()
        .allEvidenceUnlocked
    ) {
      this.conclusionError.set(
        'Complete the evidence investigation before saving the final technical conclusion.',
      );

      return;
    }

    if (
      !this.causeProgress()
        .allCausesAssessed
    ) {
      this.conclusionError.set(
        'Assess every competing cause before saving the final technical conclusion.',
      );

      return;
    }

    if (this.conclusionForm.invalid) {
      this.conclusionForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.conclusionForm.getRawValue();

    const probableRootCause =
      formValue.probableRootCause.trim();

    const finalReasoning =
      formValue.finalReasoning.trim();

    const recommendedAction =
      formValue.recommendedAction.trim();

    if (!probableRootCause) {
      this.conclusionError.set(
        'Identify the most probable root cause.',
      );

      return;
    }

    if (!finalReasoning) {
      this.conclusionError.set(
        'Explain how the evidence supports your final technical conclusion.',
      );

      return;
    }

    if (!recommendedAction) {
      this.conclusionError.set(
        'Recommend the technical action that should be taken.',
      );

      return;
    }

    this.isSavingConclusion.set(true);
    this.conclusionError.set(null);
    this.conclusionSuccess.set(null);

    this.attemptsService
      .saveConclusion(
        attempt.attemptId,
        {
          probableRootCause,
          finalReasoning,
          recommendedAction,
        },
      )
      .subscribe({
        next: (response) => {
          this.conclusion.set(
            response.conclusion,
          );

          this.conclusionProgress.set(
            response.conclusionProgress,
          );

          this.evidenceProgress.set(
            response.evidenceProgress,
          );

          this.causeProgress.set(
            response.causeProgress,
          );

          this.conclusionForm.reset({
            probableRootCause:
              response.conclusion
                .probableRootCause ?? '',

            finalReasoning:
              response.conclusion
                .finalReasoning ?? '',

            recommendedAction:
              response.conclusion
                .recommendedAction ?? '',
          });

          this.isSavingConclusion.set(
            false,
          );

          this.conclusionSuccess.set(
            'Final technical conclusion saved. You can continue reviewing and editing it before submission.',
          );
        },

        error: (error) => {
          this.isSavingConclusion.set(
            false,
          );

          this.conclusionError.set(
            error.error?.message ??
              'The final technical conclusion could not be saved.',
          );
        },
      });
  }

  submitForReview(): void {
    const attempt =
      this.currentAttempt();

    if (
      !attempt ||
      this.isSubmittingAttempt()
    ) {
      return;
    }

    if (
      attempt.status !==
      'in_progress'
    ) {
      this.submitError.set(
        'Only an in-progress investigation can be submitted for review.',
      );

      return;
    }

    if (
      !this.evidenceProgress()
        .allEvidenceUnlocked
    ) {
      this.submitError.set(
        'Complete the evidence investigation before submitting for review.',
      );

      return;
    }

    if (
      !this.causeProgress()
        .allCausesAssessed
    ) {
      this.submitError.set(
        'Assess every competing cause before submitting for review.',
      );

      return;
    }

    if (
      !this.conclusionProgress()
        .isConclusionComplete
    ) {
      this.submitError.set(
        'Save a complete final technical conclusion before submitting for review.',
      );

      return;
    }

    this.isSubmittingAttempt.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(null);

    this.attemptsService
      .submitAttempt(
        attempt.attemptId,
      )
      .subscribe({
        next: (response) => {
          this.currentAttempt.set(
            response.attempt,
          );

          this.evidenceProgress.set(
            response.evidenceProgress,
          );

          this.causeProgress.set(
            response.causeProgress,
          );

          this.conclusionProgress.set(
            response.conclusionProgress,
          );

          this.isSubmittingAttempt.set(
            false,
          );

          this.submitSuccess.set(
            'Investigation submitted for review. Learner editing is now locked.',
          );
        },

        error: (error) => {
          this.isSubmittingAttempt.set(
            false,
          );

          this.submitError.set(
            error.error?.message ??
              'The investigation could not be submitted for review.',
          );
        },
      });
  }

  findCauseAssessment(
    causeOptionId: number,
  ): CauseAssessment | undefined {
    return this.causeAssessments()
      .find(
        (assessment) =>
          assessment.causeOptionId ===
          causeOptionId,
      );
  }

  private loadMission(
    scenarioId: number,
  ): void {
    this.missionsService
      .getMission(scenarioId)
      .subscribe({
        next: (response) => {
          this.missionData.set(response);
          this.isLoading.set(false);
        },

        error: () => {
          this.isLoading.set(false);

          this.loadError.set(
            'The selected mission could not be loaded.',
          );
        },
      });
  }

  private restoreAttemptState(
    attemptId: number,
  ): void {
    this.attemptsService
      .getAttempt(attemptId)
      .subscribe({
        next: (state) => {
          this.applyAttemptState(
            state,
          );

          this.isStartingAttempt.set(
            false,
          );

          console.log({
            restoredAttempt:
              state.attempt.attemptId,

            completedSteps:
              state.progress.completedSteps,

            evidenceProgress:
              state.evidenceProgress,

            causeProgress:
              state.causeProgress,

            conclusionProgress:
              state.conclusionProgress,

            restoredSteps:
              state.steps.length,

            availableEvidence:
              state.availableEvidence.map(
                (evidence) =>
                  evidence.evidenceCode,
              ),

            restoredCauseAssessments:
              state.causeAssessments.map(
                (assessment) => ({
                  causeCode:
                    assessment.causeCode,

                  assessment:
                    assessment.assessment,
                }),
              ),
          });
        },

        error: (error) => {
          this.isStartingAttempt.set(
            false,
          );

          this.attemptError.set(
            'The investigation state could not be restored.',
          );

          console.error({
            attemptRestored: false,
            status: error.status,
          });
        },
      });
  }

  private applyAttemptState(
    state: AttemptStateResponse,
  ): void {
    this.currentAttempt.set(
      state.attempt,
    );

    this.completedSteps.set(
      state.progress.completedSteps,
    );

    this.evidenceProgress.set(
      state.evidenceProgress,
    );

    this.investigationSteps.set(
      state.steps,
    );

    this.causeAssessments.set(
      state.causeAssessments,
    );

    this.causeProgress.set(
      state.causeProgress,
    );

    this.conclusion.set(
      state.conclusion,
    );

    this.conclusionProgress.set(
      state.conclusionProgress,
    );

    this.conclusionForm.reset({
      probableRootCause:
        state.conclusion
          .probableRootCause ?? '',

      finalReasoning:
        state.conclusion
          .finalReasoning ?? '',

      recommendedAction:
        state.conclusion
          .recommendedAction ?? '',
    });

    const currentMission =
      this.missionData();

    if (!currentMission) {
      return;
    }

    this.missionData.set({
      ...currentMission,

      availableEvidence:
        state.availableEvidence,
    });
  }

  private applyStepResponse(
    response: RecordStepResponse,
  ): void {
    this.investigationSteps.update(
      (steps) => [
        ...steps,
        response.step,
      ],
    );

    this.completedSteps.set(
      response.progress.completedSteps,
    );

    this.evidenceProgress.set(
      response.evidenceProgress,
    );

    this.newlyUnlockedEvidence.set(
      response.newlyUnlockedEvidence,
    );

    const currentMission =
      this.missionData();

    if (!currentMission) {
      return;
    }

    this.missionData.set({
      ...currentMission,

      availableEvidence:
        response.availableEvidence,
    });
  }
}