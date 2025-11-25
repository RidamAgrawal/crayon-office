import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSearchBar } from './dashboard-search-bar';

describe('DashboardSearchBar', () => {
  let component: DashboardSearchBar;
  let fixture: ComponentFixture<DashboardSearchBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSearchBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSearchBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
