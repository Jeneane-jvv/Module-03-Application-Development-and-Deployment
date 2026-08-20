import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { learnerRoleGuard } from './learner-role-guard';

describe('learnerRoleGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => learnerRoleGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
