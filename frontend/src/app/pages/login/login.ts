import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const credentials = this.loginForm.getRawValue();

  this.auth.login(credentials).subscribe({
    next: () => {
      const currentUser = this.auth.currentUser();

      if (!currentUser) {
        return;
      }

      if (currentUser.role === 'learner') {
        this.router.navigate(['/learner']);
        return;
      }

      if (currentUser.role === 'reviewer') {
        this.router.navigate(['/reviewer']);
      }
    },

    error: (error) => {
      console.error({
        authenticated: false,
        status: error.status,
        errorCode: error.error?.error,
      });
    },
  });
}
}