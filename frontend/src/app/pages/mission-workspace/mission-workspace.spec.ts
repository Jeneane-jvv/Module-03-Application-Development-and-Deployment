import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MissionWorkspace } from './mission-workspace';

describe('MissionWorkspace', () => {
  let component: MissionWorkspace;
  let fixture: ComponentFixture<MissionWorkspace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionWorkspace],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MissionWorkspace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});