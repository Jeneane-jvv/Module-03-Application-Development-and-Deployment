import { TestBed } from '@angular/core/testing';
import { Missions } from './missions';

describe('Missions', () => {
  let service: Missions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Missions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
