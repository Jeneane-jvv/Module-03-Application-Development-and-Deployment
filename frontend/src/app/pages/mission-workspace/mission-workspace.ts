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
  InvestigationEvidence,
  InvestigationStep,
  RecordStepResponse,
} from '../../services/attempts';

import {
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
  private readonly route = inject(ActivatedRoute);

  private readonly missionsService =
    inject(Missions);

  private readonly attemptsService =
    inject(Attempts);

  readonly missionData =
    signal<MissionDetailResponse | null>(null);

  readonly currentAttempt =
    signal<Attempt | null>(null);

  readonly investigationSteps =
    signal<InvestigationStep[]>([]);

  readonly completedSteps =
    signal(0);

  readonly newlyUnlockedEvidence =
    signal<InvestigationEvidence[]>([]);

  readonly isLoading = signal(true);

  readonly isStartingAttempt =
    signal(false);

  readonly isSavingStep =
    signal(false);

  readonly loadError =
    signal<string | null>(null);

  readonly attemptError =
    signal<string | null>(null);

  readonly stepError =
    signal<string | null>(null);

  readonly stepSuccess =
    signal<string | null>(null);

  readonly stepForm = new FormGroup({
    evidenceId: new FormControl<number | null>(
      null,
      {
        validators: [
          Validators.required,
        ],
      },
    ),

    observation: new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      },
    ),

    nextAction: new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      },
    ),

    reasoning: new FormControl(
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
    const data = this.missionData();

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
          this.isStartingAttempt.set(false);

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

          console.log({
            savedStep:
              response.step.stepNo,

            completedSteps:
              response.progress
                .completedSteps,

            newlyUnlockedEvidence:
              response
                .newlyUnlockedEvidence
                .map(
                  (evidence) =>
                    evidence.evidenceCode,
                ),
          });
        },

        error: (error) => {
          this.isSavingStep.set(false);

          this.stepError.set(
            error.error?.message ??
              'The investigation step could not be saved.',
          );

          console.error({
            stepSaved: false,
            status: error.status,
          });
        },
      });
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

          console.log({
            scenarioCode:
              response.mission.scenarioCode,

            evidenceCount:
              response.availableEvidence
                .length,

            causeCount:
              response.competingCauses
                .length,
          });
        },

        error: (error) => {
          this.isLoading.set(false);

          this.loadError.set(
            'The selected mission could not be loaded.',
          );

          console.error({
            missionLoaded: false,
            status: error.status,
          });
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
          this.applyAttemptState(state);

          this.isStartingAttempt.set(false);

          console.log({
            restoredAttempt:
              state.attempt.attemptId,

            completedSteps:
              state.progress.completedSteps,

            restoredSteps:
              state.steps.length,

            availableEvidence:
              state.availableEvidence.map(
                (evidence) =>
                  evidence.evidenceCode,
              ),
          });
        },

        error: (error) => {
          this.isStartingAttempt.set(false);

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

    this.investigationSteps.set(
      state.steps,
    );

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