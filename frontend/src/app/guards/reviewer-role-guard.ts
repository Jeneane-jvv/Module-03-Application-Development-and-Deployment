import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { Auth } from '../services/auth';

export const reviewerRoleGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const currentUser = auth.currentUser();

  if (!currentUser) {
    return router.createUrlTree(['/login']);
  }

  if (currentUser.role === 'reviewer') {
    return true;
  }

  return router.createUrlTree(['/']);
};