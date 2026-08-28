import { API_BASE_URL } from '../config/api.config';

import {
  HttpClient,
} from '@angular/common/http';

import {
  computed,
  inject,
  Service,
  signal,
} from '@angular/core';

import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  userId: number;
  fullName: string;
  email: string;
  role: 'learner' | 'reviewer';
}

export interface LoginResponse {
  expiresIn: string;
  user: AuthenticatedUser;
}

interface SessionResponse {
  user: AuthenticatedUser;
}

@Service()
export class Auth {
  private readonly http =
    inject(HttpClient);

  private readonly authUrl =
    API_BASE_URL + '/auth';

  private readonly userState =
    signal<AuthenticatedUser | null>(
      null,
    );

  private sessionChecked = false;

  private sessionRestoreRequest:
    Observable<boolean> | null =
      null;

  readonly currentUser =
    this.userState.asReadonly();

  readonly isAuthenticated =
    computed(
      () =>
        this.userState() !== null,
    );

  login(
    credentials: LoginRequest,
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.authUrl}/login`,
        credentials,
      )
      .pipe(
        tap((response) => {
          this.userState.set(
            response.user,
          );

          this.sessionChecked = true;
        }),
      );
  }

  restoreSession():
    Observable<boolean> {
    if (this.userState() !== null) {
      this.sessionChecked = true;

      return of(true);
    }

    if (this.sessionChecked) {
      return of(false);
    }

    if (this.sessionRestoreRequest) {
      return this.sessionRestoreRequest;
    }

    const restoreRequest =
      this.http
        .get<SessionResponse>(
          `${this.authUrl}/me`,
        )
        .pipe(
          tap((response) => {
            this.userState.set(
              response.user,
            );
          }),

          map(() => true),

          catchError(() => {
            this.userState.set(null);

            return of(false);
          }),

          finalize(() => {
            this.sessionChecked = true;

            this.sessionRestoreRequest =
              null;
          }),

          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
        );

    this.sessionRestoreRequest =
      restoreRequest;

    return restoreRequest;
  }

  logout(): void {
    this.userState.set(null);
    this.sessionChecked = true;
    this.sessionRestoreRequest = null;
  }

  logoutFromServer():
    Observable<void> {
    return this.http
      .post<void>(
        `${this.authUrl}/logout`,
        {},
      )
      .pipe(
        finalize(() => {
          this.logout();
        }),
      );
  }
}
