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

export interface Attempt {
  attemptId: number;
  learnerId: number;
  scenarioId: number;
  status: 'in_progress' | 'submitted' | 'reviewed';
  startedAt: string;
}

export interface PersistedAttempt extends Attempt {
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

export interface AttemptStateResponse {
  attempt: PersistedAttempt;
  progress: AttemptProgress;
  steps: InvestigationStep[];
  availableEvidence: InvestigationEvidence[];
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
  availableEvidence: InvestigationEvidence[];
  newlyUnlockedEvidence: InvestigationEvidence[];
}

@Service()
export class Attempts {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);

  private readonly attemptsUrl =
    'http://localhost:5000/api/attempts';

  startAttempt(
    scenarioId: number,
  ): Observable<StartAttemptResponse> {
    const headers = this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () => new Error(
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
    const headers = this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () => new Error(
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
    const headers = this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () => new Error(
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

  private getAuthHeaders(): HttpHeaders | null {
    const token = this.auth.getToken();

    if (!token) {
      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}