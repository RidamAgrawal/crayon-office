import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleBtn } from './toggle-btn';

describe('ToggleBtn', () => {
  let component: ToggleBtn;
  let fixture: ComponentFixture<ToggleBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleBtn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
