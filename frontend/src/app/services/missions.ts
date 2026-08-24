import { API_BASE_URL } from '../config/api.config';
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

export type MissionDifficulty =
  | 'friendly'
  | 'medium'
  | 'high_intermediate';

export type MissionAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'reviewed';

export interface MissionSummary {
  scenarioId: number;
  scenarioCode: string;
  title: string;
  summary: string;
  severity: string;
  difficulty: MissionDifficulty;
  affectedLayer: string;
  estimatedMinutes: number;
  evidenceCount: number;
  causeCount: number;
  attemptStatus: MissionAttemptStatus;
}

export interface MissionListResponse {
  count: number;
  completedCount: number;
  missions: MissionSummary[];
}

export interface MissionDetail {
  scenarioId: number;
  scenarioCode: string;
  title: string;
  summary: string;
  severity: string;
  difficulty: MissionDifficulty;
  affectedLayer: string;
  estimatedMinutes: number;
}

export interface EvidenceItem {
  evidenceId: number;
  evidenceCode: string;
  title: string;
  evidenceType: string;
  content: string;
  sequenceNo: number;
  unlockAfterStep: number;
}

export interface CauseOption {
  causeOptionId: number;
  causeCode: string;
  label: string;
  description: string;
  sequenceNo: number;
}

export interface MissionDetailResponse {
  mission: MissionDetail;
  availableEvidence: EvidenceItem[];
  competingCauses: CauseOption[];
}

@Service()
export class Missions {
  private readonly http =
    inject(HttpClient);

  private readonly auth =
    inject(Auth);

  private readonly missionsUrl =
    API_BASE_URL + '/missions';

  getMissions():
    Observable<MissionListResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to load missions.',
          ),
      );
    }

    return this.http
      .get<MissionListResponse>(
        this.missionsUrl,
        {
          headers,
        },
      );
  }

  getMission(
    scenarioId: number,
  ): Observable<MissionDetailResponse> {
    const headers =
      this.getAuthHeaders();

    if (!headers) {
      return throwError(
        () =>
          new Error(
            'Authentication is required to load this mission.',
          ),
      );
    }

    return this.http
      .get<MissionDetailResponse>(
        `${this.missionsUrl}/${scenarioId}`,
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