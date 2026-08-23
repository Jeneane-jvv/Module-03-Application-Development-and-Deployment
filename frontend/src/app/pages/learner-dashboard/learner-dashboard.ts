import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  MissionAttemptStatus,
  MissionSummary,
  Missions,
} from '../../services/missions';

@Component({
  imports: [
    RouterLink,
  ],
  selector:
    'app-learner-dashboard',
  styleUrl:
    './learner-dashboard.scss',
  templateUrl:
    './learner-dashboard.html',
})
export class LearnerDashboard
  implements OnInit {
  private readonly missionsService =
    inject(Missions);

  readonly missions =
    signal<MissionSummary[]>([]);

  readonly completedCount =
    signal(0);

  readonly isLoading =
    signal(true);

  readonly loadError =
    signal<string | null>(
      null,
    );

  ngOnInit(): void {
    this.missionsService
      .getMissions()
      .subscribe({
        next: (response) => {
          this.missions.set(
            response.missions,
          );

          this.completedCount.set(
            response.completedCount,
          );

          this.isLoading.set(
            false,
          );

          console.log({
            missionCount:
              response.count,
            completedCount:
              response.completedCount,
            missionCodes:
              response.missions.map(
                (mission) =>
                  mission.scenarioCode,
              ),
          });
        },

        error: (error) => {
          this.isLoading.set(
            false,
          );

          this.loadError.set(
            'The available missions could not be loaded.',
          );

          console.error({
            missionsLoaded: false,
            status:
              error.status,
          });
        },
      });
  }

  missionActionLabel(
    status: MissionAttemptStatus,
  ): string {
    switch (status) {
      case 'reviewed':
        return 'View Completed Mission';

      case 'submitted':
        return 'View Submitted Mission';

      case 'in_progress':
        return 'Continue Mission';

      case 'not_started':
        return 'Open Mission';
    }
  }
}