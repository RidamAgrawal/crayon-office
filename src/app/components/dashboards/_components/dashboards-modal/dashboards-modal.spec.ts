import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardsModal } from './dashboards-modal';

describe('DashboardsModal', () => {
  let component: DashboardsModal;
  let fixture: ComponentFixture<DashboardsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
