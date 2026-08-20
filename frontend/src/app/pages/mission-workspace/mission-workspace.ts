import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

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
  private readonly missionsService = inject(Missions);

  readonly missionData =
    signal<MissionDetailResponse | null>(null);

  readonly isLoading = signal(true);

  readonly loadError =
    signal<string | null>(null);

  ngOnInit(): void {
    const scenarioId = Number(
      this.route.snapshot.paramMap.get('scenarioId'),
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
              response.availableEvidence.length,
            causeCount:
              response.competingCauses.length,
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
}