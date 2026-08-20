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

export interface StartAttemptRequest {
  scenarioId: number;
}

export interface StartAttemptResponse {
  created: boolean;
  attempt: Attempt;
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
    const token = this.auth.getToken();

    if (!token) {
      return throwError(
        () => new Error(
          'Authentication is required to start an investigation.',
        ),
      );
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

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
}