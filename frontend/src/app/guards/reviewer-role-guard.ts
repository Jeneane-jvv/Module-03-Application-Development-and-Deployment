import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  map,
} from 'rxjs';

import { Auth } from '../services/auth';

export const reviewerRoleGuard:
  CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    return auth
      .restoreSession()
      .pipe(
        map((authenticated) => {
          if (!authenticated) {
            return router.createUrlTree([
              '/login',
            ]);
          }

          const currentUser =
            auth.currentUser();

          if (
            currentUser?.role ===
            'reviewer'
          ) {
            return true;
          }

          return router.createUrlTree([
            '/',
          ]);
        }),
      );
  };
