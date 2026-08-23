import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  HttpErrorResponse,
} from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  Auth,
} from '../../services/auth';

@Component({
  imports: [
    RouterLink,
    ReactiveFormsModule,
  ],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth =
    inject(Auth);

  private readonly router =
    inject(Router);

  readonly loginError =
    signal<string | null>(
      null,
    );

  readonly isSubmitting =
    signal(false);

  readonly loginForm =
    new FormGroup({
      email: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
        ],
      }),

      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      }),
    });

  onSubmit(): void {
    this.loginError.set(null);

    if (
      this.loginForm.invalid ||
      this.isSubmitting()
    ) {
      this.loginForm
        .markAllAsTouched();

      return;
    }

    const credentials =
      this.loginForm
        .getRawValue();

    this.isSubmitting.set(true);

    this.auth
      .login(credentials)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);

          const currentUser =
            this.auth.currentUser();

          if (!currentUser) {
            this.loginError.set(
              'Mission Control could not confirm your account. Please try again.',
            );

            return;
          }

          if (
            currentUser.role ===
            'learner'
          ) {
            void this.router
              .navigate(['/learner']);

            return;
          }

          if (
            currentUser.role ===
            'reviewer'
          ) {
            void this.router
              .navigate(['/reviewer']);
          }
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.isSubmitting.set(false);

          if (
            error.status === 401 &&
            error.error?.error ===
              'invalid_credentials'
          ) {
            this.loginError.set(
              'The supplied email or password is incorrect.',
            );

            return;
          }

          this.loginError.set(
            'Mission Control could not sign you in right now. Please try again.',
          );

          console.error({
            authenticated: false,
            status: error.status,
            errorCode:
              error.error?.error,
          });
        },
      });
  }
}