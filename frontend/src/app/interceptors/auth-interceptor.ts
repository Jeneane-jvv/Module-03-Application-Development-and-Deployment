import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

import {
  inject,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  catchError,
  throwError,
} from 'rxjs';

import {
  API_BASE_URL,
} from '../config/api.config';

import {
  Auth,
} from '../services/auth';

export const authInterceptor:
  HttpInterceptorFn =
    (request, next) => {
      const auth =
        inject(Auth);

      const router =
        inject(Router);

      const token =
        auth.getToken();

      const isFirstCommitApiRequest =
        request.url.startsWith(
          API_BASE_URL,
        );

      const isLoginRequest =
        request.url ===
        `${API_BASE_URL}/auth/login`;

      if (
        !isFirstCommitApiRequest ||
        isLoginRequest ||
        !token
      ) {
        return next(request);
      }

      const authenticatedRequest =
        request.clone({
          setHeaders: {
            Authorization:
              `Bearer ${token}`,
          },
        });

      return next(
        authenticatedRequest,
      ).pipe(
        catchError(
          (error: unknown) => {
            if (
              error instanceof
                HttpErrorResponse &&
              error.status === 401
            ) {
              auth.logout();

              void router.navigate([
                '/login',
              ]);
            }

            return throwError(
              () => error,
            );
          },
        ),
      );
    };