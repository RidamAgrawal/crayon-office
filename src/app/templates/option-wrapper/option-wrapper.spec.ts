import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionWrapper } from './option-wrapper';

describe('OptionWrapper', () => {
  let component: OptionWrapper;
  let fixture: ComponentFixture<OptionWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
