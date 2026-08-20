import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { reviewerRoleGuard } from './reviewer-role-guard';

describe('reviewerRoleGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => reviewerRoleGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
