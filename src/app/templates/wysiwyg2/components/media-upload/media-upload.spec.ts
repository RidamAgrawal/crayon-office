import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaUpload } from './media-upload';

describe('MediaUpload', () => {
  let component: MediaUpload;
  let fixture: ComponentFixture<MediaUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
