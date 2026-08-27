import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  Auth,
} from '../../services/auth';

import {
  Reviewer,
  ReviewerInvestigationDetailResponse,
  ReviewerInvestigationSummary,
  ReviewerRating,
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

  private readonly auth =
    inject(Auth);

  private readonly router =
    inject(Router);

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

  readonly reasoningQuality =
    signal<ReviewerRating | null>(
      null,
    );

  readonly evidenceUsage =
    signal<ReviewerRating | null>(
      null,
    );

  readonly technicalCommunication =
    signal<ReviewerRating | null>(
      null,
    );

  readonly feedbackText =
    signal('');

  readonly reviewConfirmed =
    signal(false);

  readonly isSubmittingReview =
    signal(false);

  readonly reviewError =
    signal<string | null>(
      null,
    );

  readonly reviewSuccess =
    signal<string | null>(
      null,
    );

  ngOnInit(): void {
    this.loadInvestigations();
  }

  logout(): void {
    this.auth
      .logoutFromServer()
      .subscribe({
        next: () => {
          void this.router.navigate([
            '/login',
          ]);
        },
        error: () => {
          void this.router.navigate([
            '/login',
          ]);
        },
      });
  }

  openInvestigation(
    attemptId: number,
  ): void {
    if (this.isLoadingDetail()) {
      return;
    }

    this.isLoadingDetail.set(true);
    this.detailError.set(null);
    this.reviewError.set(null);
    this.reviewSuccess.set(null);

    this.reviewerService
      .getInvestigation(attemptId)
      .subscribe({
        next: (response) => {
          this.selectedInvestigation.set(
            response,
          );

          this.resetReviewForm();

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
    this.reviewError.set(null);
    this.reviewSuccess.set(null);

    this.resetReviewForm();
  }

  setReasoningQuality(
    rating: ReviewerRating,
  ): void {
    if (this.reviewLocked()) {
      return;
    }

    this.reasoningQuality.set(
      rating,
    );

    this.reviewError.set(null);
  }

  setEvidenceUsage(
    rating: ReviewerRating,
  ): void {
    if (this.reviewLocked()) {
      return;
    }

    this.evidenceUsage.set(
      rating,
    );

    this.reviewError.set(null);
  }

  setTechnicalCommunication(
    rating: ReviewerRating,
  ): void {
    if (this.reviewLocked()) {
      return;
    }

    this.technicalCommunication.set(
      rating,
    );

    this.reviewError.set(null);
  }

  updateFeedbackText(
    event: Event,
  ): void {
    if (this.reviewLocked()) {
      return;
    }

    const textarea =
      event.target as HTMLTextAreaElement;

    this.feedbackText.set(
      textarea.value,
    );

    this.reviewError.set(null);
  }

  formatSouthAfricaTimestamp(
    value: string | null | undefined,
  ): string {
    if (!value) {
      return 'Not recorded';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            'Africa/Johannesburg',

          day: '2-digit',
          month: 'short',
          year: 'numeric',

          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        },
      ).formatToParts(date);

    const getPart = (
      type: string,
    ): string =>
      parts.find(
        (part) =>
          part.type === type,
      )?.value ?? '';

    return (
      `${getPart('day')} ` +
      `${getPart('month')} ` +
      `${getPart('year')} at ` +
      `${getPart('hour')}:` +
      `${getPart('minute')} SAST`
    );
  }

  updateReviewConfirmation(
    event: Event,
  ): void {
    if (this.reviewLocked()) {
      return;
    }

    const checkbox =
      event.target as HTMLInputElement;

    this.reviewConfirmed.set(
      checkbox.checked,
    );

    this.reviewError.set(null);
  }

  reviewFormComplete(): boolean {
    return Boolean(
      this.reasoningQuality() &&
      this.evidenceUsage() &&
      this.technicalCommunication() &&
      this.feedbackText().trim(),
    );
  }

  reviewCanSubmit(): boolean {
    return (
      this.reviewFormComplete() &&
      this.reviewConfirmed() &&
      !this.isSubmittingReview() &&
      !this.reviewLocked()
    );
  }

  reviewLocked(): boolean {
    return (
      this.selectedInvestigation()
        ?.attempt.status === 'reviewed'
    );
  }

  submitReview(): void {
    const review =
      this.selectedInvestigation();

    if (!review) {
      this.reviewError.set(
        'No investigation is currently open for review.',
      );

      return;
    }

    if (review.attempt.status !== 'submitted') {
      this.reviewError.set(
        'Only submitted investigations can be reviewed.',
      );

      return;
    }

    const reasoningQuality =
      this.reasoningQuality();

    const evidenceUsage =
      this.evidenceUsage();

    const technicalCommunication =
      this.technicalCommunication();

    const feedbackText =
      this.feedbackText().trim();

    if (
      !reasoningQuality ||
      !evidenceUsage ||
      !technicalCommunication ||
      !feedbackText
    ) {
      this.reviewError.set(
        'Complete all three assessment categories and provide reviewer feedback before submitting.',
      );

      return;
    }

    if (!this.reviewConfirmed()) {
      this.reviewError.set(
        'Confirm that the reviewer assessment is final before submitting.',
      );

      return;
    }

    if (this.isSubmittingReview()) {
      return;
    }

    this.isSubmittingReview.set(true);
    this.reviewError.set(null);
    this.reviewSuccess.set(null);

    this.reviewerService
      .submitReview(
        review.attempt.attemptId,
        {
          reasoningQuality,
          evidenceUsage,
          technicalCommunication,
          feedbackText,
        },
      )
      .subscribe({
        next: (response) => {
          this.isSubmittingReview.set(
            false,
          );

          this.reviewSuccess.set(
            response.message,
          );

          this.selectedInvestigation.update(
            (current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,

                attempt: {
                  ...current.attempt,

                  status:
                    response.attempt.status,

                  reviewedAt:
                    response.attempt.reviewedAt,
                },
              };
            },
          );

          this.investigations.update(
            (current) =>
              current.filter(
                (investigation) =>
                  investigation.attemptId !==
                  response.attempt.attemptId,
              ),
          );

          this.reviewConfirmed.set(
            false,
          );

          console.log({
            reviewerAssessmentSubmitted:
              true,

            attemptId:
              response.attempt.attemptId,

            scenarioCode:
              response.attempt.scenarioCode,

            status:
              response.attempt.status,

            feedbackId:
              response.feedback.feedbackId,
          });
        },

        error: (error) => {
          this.isSubmittingReview.set(
            false,
          );

          this.reviewError.set(
            error.error?.message ??
              'Reviewer feedback could not be submitted.',
          );

          console.error({
            reviewerAssessmentSubmitted:
              false,

            attemptId:
              review.attempt.attemptId,

            status:
              error.status,

            error:
              error.error?.error,
          });
        },
      });
  }

  private resetReviewForm(): void {
    this.reasoningQuality.set(
      null,
    );

    this.evidenceUsage.set(
      null,
    );

    this.technicalCommunication.set(
      null,
    );

    this.feedbackText.set('');

    this.reviewConfirmed.set(
      false,
    );

    this.isSubmittingReview.set(
      false,
    );

    this.reviewError.set(null);
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