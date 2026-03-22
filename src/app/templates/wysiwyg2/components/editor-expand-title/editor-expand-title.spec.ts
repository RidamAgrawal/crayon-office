import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorExpandTitle } from './editor-expand-title.component';

describe('EditorExpandTitle', () => {
  let component: EditorExpandTitle;
  let fixture: ComponentFixture<EditorExpandTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorExpandTitle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorExpandTitle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
