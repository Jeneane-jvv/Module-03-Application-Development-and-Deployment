import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import {
  Attempt,
  AttemptStateResponse,
  Attempts,
  InvestigationStep,
} from '../../services/attempts';

import {
  MissionDetailResponse,
  Missions,
} from '../../services/missions';

@Component({
  imports: [],
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

  readonly isLoading = signal(true);

  readonly isStartingAttempt =
    signal(false);

  readonly loadError =
    signal<string | null>(null);

  readonly attemptError =
    signal<string | null>(null);

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
}