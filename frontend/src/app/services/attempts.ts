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

export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'reviewed';

export type CauseAssessmentStatus =
  | 'supported'
  | 'eliminated'
  | 'unresolved';

export interface Attempt {
  attemptId: number;
  learnerId: number;
  scenarioId: number;
  status: AttemptStatus;
  startedAt: string;
}

export interface PersistedAttempt
  extends Attempt {
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface StartAttemptRequest {
  scenarioId: number;
}

export interface StartAttemptResponse {
  created: boolean;
  attempt: Attempt;
}

export interface InvestigationStep {
  stepId: number;
  attemptId: number;
  evidenceId: number | null;
  stepNo: number;
  observation: string;
  nextAction: string;
  reasoning: string;
  createdAt: string;
}

export interface InvestigationEvidence {
  evidenceId: number;
  evidenceCode: string;
  title: string;
  evidenceType: string;
  content: string;
  sequenceNo: number;
  unlockAfterStep: number;
}

export interface AttemptProgress {
  completedSteps: number;
}

export interface EvidenceProgress {
  availableEvidenceCount: number;
  totalEvidenceCount: number;
  allEvidenceUnlocked: boolean;
}

export interface CauseProgress {
  assessedCauseCount: number;
  totalCauseCount: number;
  allCausesAssessed: boolean;
}

export interface CauseAssessment {
  causeAssessmentId: number;
  attemptId: number;
  causeOptionId: number;
  causeCode: string;
  label: string;
  assessment: CauseAssessmentStatus;
  reasoning: string;
  assessedAt: string;
  updatedAt: string;
}

export interface FinalConclusion {
  probableRootCause: string | null;
  finalReasoning: string | null;
  recommendedAction: string | null;
}

export interface ConclusionProgress {
  isConclusionComplete: boolean;
}

export interface AttemptStateResponse {
  attempt: PersistedAttempt;
  progress: AttemptProgress;
  evidenceProgress: EvidenceProgress;
  causeProgress: CauseProgress;
  conclusion: FinalConclusion;
  conclusionProgress: ConclusionProgress;
  steps: InvestigationStep[];
  availableEvidence: InvestigationEvidence[];
  causeAssessments: CauseAssessment[];
}

export interface RecordStepRequest {
  evidenceId: number | null;
  observation: string;
  nextAction: string;
  reasoning: string;
}

export interface RecordStepResponse {
  step: InvestigationStep;
  progress: AttemptProgress;
  evidenceProgress: EvidenceProgress;
  availableEvidence: InvestigationEvidence[];
  newlyUnlockedEvidence: InvestigationEvidence[];
}

export interface AssessCauseRequest {
  assessment: CauseAssessmentStatus;
  reasoning: string;
}

export interface AssessedCause {
  causeOptionId: number;
  causeCode: string;
  label: string;
  description: string;
  sequenceNo: number;
}

export interface SavedCauseAssessment {
  causeAssessmentId: number;
  attemptId: number;
  causeOptionId: number;
  assessment: CauseAssessmentStatus;
  reasoning: string;
  assessedAt: string;
  updatedAt: string;
}

export interface AssessCauseResponse {
  cause: AssessedCause;
  assessment: SavedCauseAssessment;
  causeProgress: CauseProgress;
}

export interface SaveConclusionRequest {
  probableRootCause: string;
  finalReasoning: string;
  recommendedAction: string;
}

export interface SaveConclusionResponse {
  conclusion: FinalConclusion;
  conclusionProgress: ConclusionProgress;
  evidenceProgress: EvidenceProgress;
  causeProgress: CauseProgress;
}

@Service()
export class Attempts {
  private readonly http =
    inject(HttpClient);

  private readonly auth =
    inject(Auth);

  private readonly attemptsUrl =
    'http://localhost:5000/api/attempts';

  startAttempt(
    scenarioId: number,
  ): Observable<StartAttemptResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to start an investigation.',
          ),
      );
    }

    const body: StartAttemptRequest = {
      scenarioId,
    };

    return this.http.post<StartAttemptResponse>(
      this.attemptsUrl,
      body,
      {
        headers,
      },
    );
  }

  getAttempt(
    attemptId: number,
  ): Observable<AttemptStateResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to load an investigation.',
          ),
      );
    }

    return this.http.get<AttemptStateResponse>(
      `${this.attemptsUrl}/${attemptId}`,
      {
        headers,
      },
    );
  }

  recordStep(
    attemptId: number,
    request: RecordStepRequest,
  ): Observable<RecordStepResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to record an investigation step.',
          ),
      );
    }

    return this.http.post<RecordStepResponse>(
      `${this.attemptsUrl}/${attemptId}/steps`,
      request,
      {
        headers,
      },
    );
  }

  assessCause(
    attemptId: number,
    causeOptionId: number,
    request: AssessCauseRequest,
  ): Observable<AssessCauseResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to assess a competing cause.',
          ),
      );
    }

    return this.http.put<AssessCauseResponse>(
      `${this.attemptsUrl}/${attemptId}/causes/${causeOptionId}`,
      request,
      {
        headers,
      },
    );
  }

  saveConclusion(
    attemptId: number,
    request: SaveConclusionRequest,
  ): Observable<SaveConclusionResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to save the final technical conclusion.',
          ),
      );
    }

    return this.http.put<SaveConclusionResponse>(
      `${this.attemptsUrl}/${attemptId}/conclusion`,
      request,
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