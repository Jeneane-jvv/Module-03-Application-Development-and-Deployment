import { TestBed } from '@angular/core/testing';
import { Attempts } from './attempts';

describe('Attempts', () => {
  let service: Attempts;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Attempts);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
