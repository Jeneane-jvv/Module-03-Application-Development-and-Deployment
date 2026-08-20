import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MissionWorkspace } from './mission-workspace';

describe('MissionWorkspace', () => {
  let component: MissionWorkspace;
  let fixture: ComponentFixture<MissionWorkspace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionWorkspace],
    }).compileComponents();

    fixture = TestBed.createComponent(MissionWorkspace);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
