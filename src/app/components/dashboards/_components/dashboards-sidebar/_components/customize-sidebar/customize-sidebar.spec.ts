import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeSidebar } from './customize-sidebar';

describe('CustomizeSidebar', () => {
  let component: CustomizeSidebar;
  let fixture: ComponentFixture<CustomizeSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizeSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizeSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
