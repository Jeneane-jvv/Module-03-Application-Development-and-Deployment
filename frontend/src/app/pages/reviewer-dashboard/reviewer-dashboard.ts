import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';

import {
  Reviewer,
  ReviewerInvestigationDetailResponse,
  ReviewerInvestigationSummary,
} from '../../services/reviewer';

@Component({
  imports: [],
  selector: 'app-reviewer-dashboard',
  styleUrl: './reviewer-dashboard.scss',
  templateUrl: './reviewer-dashboard.html',
})
export class ReviewerDashboard implements OnInit {
  private readonly reviewerService =
    inject(Reviewer);

  @ViewChild('reviewDetail')
  private reviewDetail?: ElementRef<HTMLElement>;

  readonly investigations =
    signal<ReviewerInvestigationSummary[]>([]);

  readonly selectedInvestigation =
    signal<ReviewerInvestigationDetailResponse | null>(
      null,
    );

  readonly isLoading =
    signal(true);

  readonly isLoadingDetail =
    signal(false);

  readonly loadError =
    signal<string | null>(
      null,
    );

  readonly detailError =
    signal<string | null>(
      null,
    );

  ngOnInit(): void {
    this.loadInvestigations();
  }

  openInvestigation(
    attemptId: number,
  ): void {
    if (this.isLoadingDetail()) {
      return;
    }

    this.isLoadingDetail.set(true);
    this.detailError.set(null);

    this.reviewerService
      .getInvestigation(attemptId)
      .subscribe({
        next: (response) => {
          this.selectedInvestigation.set(
            response,
          );

          this.isLoadingDetail.set(false);

          setTimeout(() => {
            this.reviewDetail
              ?.nativeElement
              .scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
          });

          console.log({
            reviewerOpenedAttempt:
              response.attempt.attemptId,

            scenarioCode:
              response.attempt.scenarioCode,

            status:
              response.attempt.status,

            completedSteps:
              response.reviewProgress
                .completedSteps,

            evidenceCount:
              response.evidence.length,

            assessedCauses:
              response.reviewProgress
                .assessedCauseCount,

            totalCauses:
              response.reviewProgress
                .totalCauseCount,

            conclusionComplete:
              response.reviewProgress
                .conclusionComplete,
          });
        },

        error: (error) => {
          this.isLoadingDetail.set(false);

          this.detailError.set(
            error.error?.message ??
              'The submitted investigation could not be opened.',
          );

          console.error({
            reviewerAttemptLoaded: false,
            status: error.status,
          });
        },
      });
  }

  closeInvestigation(): void {
    this.selectedInvestigation.set(null);
    this.detailError.set(null);
  }

  private loadInvestigations(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.reviewerService
      .getSubmittedInvestigations()
      .subscribe({
        next: (response) => {
          this.investigations.set(
            response.investigations,
          );

          this.isLoading.set(false);

          console.log({
            reviewerQueueLoaded: true,

            investigationCount:
              response.investigations.length,

            investigations:
              response.investigations.map(
                (investigation) => ({
                  attemptId:
                    investigation.attemptId,

                  scenarioCode:
                    investigation.scenarioCode,

                  status:
                    investigation.status,
                }),
              ),
          });
        },

        error: (error) => {
          this.isLoading.set(false);

          this.loadError.set(
            error.error?.message ??
              'Submitted investigations could not be loaded.',
          );

          console.error({
            reviewerQueueLoaded: false,
            status: error.status,
          });
        },
      });
  }
}