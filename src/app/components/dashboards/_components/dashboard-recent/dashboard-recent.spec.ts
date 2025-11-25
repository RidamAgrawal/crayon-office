import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRecent } from './dashboard-recent';

describe('DashboardRecent', () => {
  let component: DashboardRecent;
  let fixture: ComponentFixture<DashboardRecent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRecent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRecent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
