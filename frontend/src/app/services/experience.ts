import { API_BASE_URL } from '../config/api.config';
import {
  inject,
  Service,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  map,
  Observable,
  of,
} from 'rxjs';

export type VisitorRole =
  | 'learner'
  | 'recruiter'
  | 'educator_assessor'
  | 'guest';

export type VisitorEventType =
  | 'ENTERED_MISSION_CONTROL'
  | 'VIEWED_MISSION'
  | 'OPENED_EVIDENCE'
  | 'STARTED_GUIDED_TOUR'
  | 'COMPLETED_GUIDED_TOUR'
  | 'REQUESTED_MENTOR_GUIDANCE'
  | 'REQUESTED_ERROR_ANALYSIS'
  | 'VIEWED_REVIEWER_FEEDBACK';

export interface VisitorProfile {
  displayName: string;
  visitorRole: VisitorRole;
  consentGiven: boolean;
  persisted: boolean;
  visitorSessionId: number | null;
  startedAt: string;
}

export interface VisitorSession {
  visitorSessionId: number;
  displayName: string;
  visitorRole: VisitorRole;
  consentGiven: true;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
}

export interface CreateVisitorSessionRequest {
  displayName: string;
  visitorRole: VisitorRole;
  consentGiven: true;
}

export interface CreateVisitorSessionResponse {
  persisted: true;
  session: VisitorSession;
}

export interface VisitorEventMetadata {
  source?: string;
  surface?: string;
  evidenceCode?: string;
  supportType?: string;
  tourStep?: string;
}

export interface RecordVisitorEventRequest {
  eventType: VisitorEventType;
  scenarioId?: number | null;
  metadata?: VisitorEventMetadata;
}

export interface VisitorEvent {
  visitorEventId: number;
  visitorSessionId: number;
  eventType: VisitorEventType;
  scenarioId: number | null;
  metadata: VisitorEventMetadata;
  occurredAt: string;
}

export interface RecordVisitorEventResponse {
  recorded: true;

  event:
    VisitorEvent;

  session: {
    visitorSessionId: number;
    displayName: string;
    visitorRole: VisitorRole;
    lastActiveAt: string;
  };
}

@Service()
export class Experience {
  private readonly http =
    inject(HttpClient);

  private readonly experienceUrl =
    API_BASE_URL + '/experience';

  private readonly storageKey =
    'firstcommit_visitor_profile';

  createVisitorProfile(
    displayName: string,
    visitorRole: VisitorRole,
    consentGiven: boolean,
  ): Observable<VisitorProfile> {
    const normalizedDisplayName =
      displayName.trim();

    if (!consentGiven) {
      const profile: VisitorProfile = {
        displayName:
          normalizedDisplayName,

        visitorRole,

        consentGiven:
          false,

        persisted:
          false,

        visitorSessionId:
          null,

        startedAt:
          new Date().toISOString(),
      };

      this.storeProfile(
        profile,
      );

      return of(
        profile,
      );
    }

    const request:
      CreateVisitorSessionRequest = {
        displayName:
          normalizedDisplayName,

        visitorRole,

        consentGiven:
          true,
      };

    return this.http
      .post<CreateVisitorSessionResponse>(
        `${this.experienceUrl}/sessions`,
        request,
      )
      .pipe(
        map((response) => {
          const profile:
            VisitorProfile = {
              displayName:
                response.session
                  .displayName,

              visitorRole:
                response.session
                  .visitorRole,

              consentGiven:
                true,

              persisted:
                true,

              visitorSessionId:
                response.session
                  .visitorSessionId,

              startedAt:
                response.session
                  .startedAt,
            };

          this.storeProfile(
            profile,
          );

          return profile;
        }),
      );
  }

  recordEvent(
    request: RecordVisitorEventRequest,
  ): Observable<
    RecordVisitorEventResponse | null
  > {
    const profile =
      this.getVisitorProfile();

    if (
      !profile ||
      !profile.persisted ||
      !profile.consentGiven ||
      profile.visitorSessionId === null
    ) {
      return of(null);
    }

    return this.http.post<RecordVisitorEventResponse>(
      `${this.experienceUrl}/sessions/${profile.visitorSessionId}/events`,
      {
        eventType:
          request.eventType,

        scenarioId:
          request.scenarioId ?? null,

        metadata:
          request.metadata ?? {},
      },
    );
  }

  getVisitorProfile():
    VisitorProfile | null {
    if (
      typeof sessionStorage ===
      'undefined'
    ) {
      return null;
    }

    try {
      const stored =
        sessionStorage.getItem(
          this.storageKey,
        );

      if (!stored) {
        return null;
      }

      const profile =
        JSON.parse(
          stored,
        ) as VisitorProfile;

      if (
        typeof profile.displayName !==
          'string' ||
        !profile.displayName.trim() ||
        typeof profile.visitorRole !==
          'string'
      ) {
        return null;
      }

      return profile;
    } catch {
      return null;
    }
  }

  clearVisitorProfile(): void {
    if (
      typeof sessionStorage ===
      'undefined'
    ) {
      return;
    }

    try {
      sessionStorage.removeItem(
        this.storageKey,
      );
    } catch {
      // Session storage is optional.
    }
  }

  private storeProfile(
    profile: VisitorProfile,
  ): void {
    if (
      typeof sessionStorage ===
      'undefined'
    ) {
      return;
    }

    try {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify(
          profile,
        ),
      );
    } catch {
      // Personalisation can continue without browser storage.
    }
  }
}