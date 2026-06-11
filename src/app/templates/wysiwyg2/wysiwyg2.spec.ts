import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wysiwyg2 } from './wysiwyg2';

describe('Wysiwyg2', () => {
  let component: Wysiwyg2;
  let fixture: ComponentFixture<Wysiwyg2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wysiwyg2],
    }).compileComponents();

    fixture = TestBed.createComponent(Wysiwyg2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
