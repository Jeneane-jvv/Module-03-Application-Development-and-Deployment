import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import {
  computed,
  inject,
  Service,
  signal,
} from '@angular/core';
import { Observable, tap } from 'rxjs';

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
  token: string;
  expiresIn: string;
  user: AuthenticatedUser;
}

@Service()
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly authUrl =
    API_BASE_URL + '/auth';

  private readonly tokenState =
    signal<string | null>(null);

  private readonly userState =
    signal<AuthenticatedUser | null>(null);

  readonly currentUser =
    this.userState.asReadonly();

  readonly isAuthenticated = computed(
    () => this.tokenState() !== null,
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
          this.tokenState.set(response.token);
          this.userState.set(response.user);
        }),
      );
  }

  getToken(): string | null {
    return this.tokenState();
  }
}