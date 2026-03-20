import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { catchError, of, finalize } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class ImagePreviewService {
  private readonly http = inject(HttpClient);
  public readonly invalidImageLink = signal<boolean>(true);
  public readonly isPreviewImage = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly loadImageCalled = signal<boolean>(false);
  public readonly imgPreviewLink = signal<string>('');
  public isValidPreviewLink(link: string): boolean {
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    this.invalidImageLink.set(!urlRegex.test(link));
    return urlRegex.test(link);
  }

  public loadImage() {
    this.isLoading.set(true);
    this.isPreviewImage.set(false);
    this.http
      .get(this.imgPreviewLink(), { responseType: 'blob' })
      .pipe(
        catchError((err) => {
          this.invalidImageLink.set(true);
          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.loadImageCalled.set(true);
        }),
      )
      .subscribe((res) => {
        if (!res) return;
        if (!res.type.startsWith('image/')) {
          this.invalidImageLink.set(true);
          return;
        }
        this.isPreviewImage.set(true);
      });
  }

  public validateUrl = (value: string): ValidationErrors | null => {
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    this.resetLoadImageCalled();
    this.invalidImageLink.set(!urlRegex.test(value));
    return urlRegex.test(value)
      ? null
      : { invalidUrl: true, feedback: 'Invalid link', icon: 'warningRed' };
  };

  public resetLoadImageCalled() {
    this.loadImageCalled.set(false);
  }

  public resetUploadImageLinkState() {
    this.invalidImageLink.set(false);
    this.isPreviewImage.set(false);
    this.isLoading.set(false);
    this.loadImageCalled.set(false);
  }
}
