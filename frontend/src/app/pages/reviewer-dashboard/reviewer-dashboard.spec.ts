import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewerDashboard } from './reviewer-dashboard';

describe('ReviewerDashboard', () => {
  let component: ReviewerDashboard;
  let fixture: ComponentFixture<ReviewerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
