import {
  inject,
  Service,
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';

import {
  Observable,
  throwError,
} from 'rxjs';

import { Auth } from './auth';

export type ReviewerAttemptStatus =
  | 'submitted'
  | 'reviewed';

export type ReviewerCauseAssessmentStatus =
  | 'supported'
  | 'eliminated'
  | 'unresolved';

export interface ReviewerInvestigationSummary {
  attemptId: number;
  learnerId: number;
  scenarioId: number;
  scenarioCode: string;
  title: string;
  status: ReviewerAttemptStatus;
  startedAt: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ReviewerInvestigationsResponse {
  investigations: ReviewerInvestigationSummary[];
}

export interface ReviewerAttemptDetail {
  attemptId: number;
  learnerId: number;
  scenarioId: number;
  scenarioCode: string;
  title: string;
  summary: string;
  severity: string;
  affectedLayer: string;
  status: ReviewerAttemptStatus;
  startedAt: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ReviewerProgress {
  completedSteps: number;
  totalEvidenceCount: number;
  assessedCauseCount: number;
  totalCauseCount: number;
  conclusionComplete: boolean;
}

export interface ReviewerEvidence {
  evidenceId: number;
  evidenceCode: string;
  title: string;
  evidenceType: string;
  content: string;
  sequenceNo: number;
  unlockAfterStep: number;
}

export interface ReviewerInvestigationStep {
  stepId: number;
  attemptId: number;
  evidenceId: number | null;
  stepNo: number;
  observation: string;
  nextAction: string;
  reasoning: string;
  createdAt: string;
}

export interface ReviewerCause {
  causeOptionId: number;
  causeCode: string;
  label: string;
  description: string;
  sequenceNo: number;
  causeAssessmentId: number | null;
  assessment: ReviewerCauseAssessmentStatus | null;
  reasoning: string | null;
  assessedAt: string | null;
  updatedAt: string | null;
}

export interface ReviewerConclusion {
  probableRootCause: string | null;
  finalReasoning: string | null;
  recommendedAction: string | null;
}

export interface ReviewerInvestigationDetailResponse {
  attempt: ReviewerAttemptDetail;
  reviewProgress: ReviewerProgress;
  evidence: ReviewerEvidence[];
  steps: ReviewerInvestigationStep[];
  causes: ReviewerCause[];
  conclusion: ReviewerConclusion;
}

@Service()
export class Reviewer {
  private readonly http =
    inject(HttpClient);

  private readonly auth =
    inject(Auth);

  private readonly reviewerUrl =
    'http://localhost:5000/api/reviewer';

  getSubmittedInvestigations():
    Observable<ReviewerInvestigationsResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to access reviewer investigations.',
          ),
      );
    }

    return this.http.get<ReviewerInvestigationsResponse>(
      `${this.reviewerUrl}/attempts`,
      {
        headers,
      },
    );
  }

  getInvestigation(
    attemptId: number,
  ): Observable<ReviewerInvestigationDetailResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to review an investigation.',
          ),
      );
    }

    return this.http.get<ReviewerInvestigationDetailResponse>(
      `${this.reviewerUrl}/attempts/${attemptId}`,
      {
        headers,
      },
    );
  }

  private getAuthHeaders():
    HttpHeaders | null {
    const token =
      this.auth.getToken();

    if (!token) {
      return null;
    }

    return new HttpHeaders({
      Authorization:
        `Bearer ${token}`,
    });
  }
}