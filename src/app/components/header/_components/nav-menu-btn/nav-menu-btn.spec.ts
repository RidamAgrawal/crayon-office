import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavMenuBtn } from './nav-menu-btn';

describe('NavMenuBtn', () => {
  let component: NavMenuBtn;
  let fixture: ComponentFixture<NavMenuBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMenuBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavMenuBtn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
