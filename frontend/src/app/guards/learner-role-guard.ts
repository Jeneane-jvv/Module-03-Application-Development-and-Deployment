import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  map,
} from 'rxjs';

import { Auth } from '../services/auth';

export const learnerRoleGuard:
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
            'learner'
          ) {
            return true;
          }

          return router.createUrlTree([
            '/',
          ]);
        }),
      );
  };
