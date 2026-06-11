import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabTemplate2 } from './tab-template-2';

describe('TabTemplate2', () => {
  let component: TabTemplate2;
  let fixture: ComponentFixture<TabTemplate2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTemplate2],
    }).compileComponents();

    fixture = TestBed.createComponent(TabTemplate2);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
