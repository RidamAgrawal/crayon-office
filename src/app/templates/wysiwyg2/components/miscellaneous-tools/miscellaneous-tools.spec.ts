import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiscellaneousTools } from './miscellaneous-tools';

describe('MiscellaneousTools', () => {
  let component: MiscellaneousTools;
  let fixture: ComponentFixture<MiscellaneousTools>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiscellaneousTools]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiscellaneousTools);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
