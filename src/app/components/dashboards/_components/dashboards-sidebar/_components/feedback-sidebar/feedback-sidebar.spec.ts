import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackSidebar } from './feedback-sidebar';

describe('FeedbackSidebar', () => {
  let component: FeedbackSidebar;
  let fixture: ComponentFixture<FeedbackSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
