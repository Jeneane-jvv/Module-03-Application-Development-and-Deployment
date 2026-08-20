import { Routes } from '@angular/router';

import { authGuard } from './guards/auth-guard';
import { learnerRoleGuard } from './guards/learner-role-guard';
import { reviewerRoleGuard } from './guards/reviewer-role-guard';

import { Landing } from './pages/landing/landing';
import { LearnerDashboard } from './pages/learner-dashboard/learner-dashboard';
import { Login } from './pages/login/login';
import { MissionWorkspace } from './pages/mission-workspace/mission-workspace';
import { ReviewerDashboard } from './pages/reviewer-dashboard/reviewer-dashboard';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'learner',
    component: LearnerDashboard,
    canActivate: [authGuard, learnerRoleGuard],
  },
  {
    path: 'learner/missions/:scenarioId',
    component: MissionWorkspace,
    canActivate: [authGuard, learnerRoleGuard],
  },
  {
    path: 'reviewer',
    component: ReviewerDashboard,
    canActivate: [authGuard, reviewerRoleGuard],
  },
];