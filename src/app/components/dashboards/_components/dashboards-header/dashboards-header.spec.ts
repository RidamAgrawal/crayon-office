import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardsHeader } from './dashboards-header';

describe('DashboardsHeader', () => {
  let component: DashboardsHeader;
  let fixture: ComponentFixture<DashboardsHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardsHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardsHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
