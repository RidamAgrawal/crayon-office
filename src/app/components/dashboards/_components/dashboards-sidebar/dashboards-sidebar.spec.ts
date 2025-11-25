import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardsSidebar } from './dashboards-sidebar';

describe('DashboardsSidebar', () => {
  let component: DashboardsSidebar;
  let fixture: ComponentFixture<DashboardsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardsSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardsSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
