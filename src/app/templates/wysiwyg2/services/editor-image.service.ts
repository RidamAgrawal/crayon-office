import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class WysiwygEditorImage2Service {
  private readonly http = inject(HttpClient);
  public readonly invalidImageLink = signal<boolean>(true);
  public readonly isPreviewImage = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly loadImageCalled = signal<boolean>(false);
  public readonly isCameraOpen = signal<boolean>(false);
  public readonly isCameraLoading = signal<boolean>(false);
  public readonly isCameraPermissionDenied = signal<boolean>(false);
  public readonly imgPreviewLink = signal<string>('');
  private closeStream: () => void = () => {};
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
    return urlRegex.test(value)
      ? null
      : { invalidUrl: true, feedback: 'Invalid link', icon: 'warningRed' };
  };

  public resetLoadImageCalled() {
    this.loadImageCalled.set(false);
  }

  public resetUploadImageLinkState() {
    this.invalidImageLink.set(true);
    this.isPreviewImage.set(false);
    this.isLoading.set(false);
    this.loadImageCalled.set(false);
  }

  // ──────────────── file upload validation & reading ────────────────────

  private static readonly VALID_IMAGE_EXTENSIONS = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'svg',
    'bmp',
    'ico',
    'tiff',
    'tif',
    'avif',
  ]);

  private static readonly VALID_IMAGE_MIME_PREFIXES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/x-icon',
    'image/tiff',
    'image/avif',
  ];

  /**
   * Validates that the given `File` is a supported image.
   * Checks both the MIME type reported by the browser *and* the file extension.
   */
  public validateImageFile(file: File): { valid: boolean; error?: string } {
    // 1. MIME type check
    const mimeOk =
      file.type.startsWith('image/') &&
      WysiwygEditorImage2Service.VALID_IMAGE_MIME_PREFIXES.some(
        (prefix) => file.type === prefix,
      );

    // 2. Extension check
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const extOk = WysiwygEditorImage2Service.VALID_IMAGE_EXTENSIONS.has(ext);

    if (!mimeOk && !extOk) {
      return {
        valid: false,
        error: `Unsupported file type "${file.type || ext}". Allowed: ${[...WysiwygEditorImage2Service.VALID_IMAGE_EXTENSIONS].join(', ')}.`, 
      };
    }

    return { valid: true };
  }

  /**
   * Reads a `File` object and returns a base-64 data-URL string that can be
   * used directly in an `<img src="…">` tag.
   */
  public readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  public async onCaptureClick(videoElement: HTMLVideoElement) {
    if (this.isCameraOpen()) {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Save stream reference before stopping — srcObject may be nulled after
      const stream = videoElement.srcObject as MediaStream;
      this.isCameraOpen.set(false);
      this.closeStream();
      videoElement.srcObject = null;

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve('');
            return;
          }
          const file = new File([blob], 'captured-image.png', {
            type: 'image/png',
          });

          this.readFileAsDataUrl(file).then((dataUrl) => {
            resolve(dataUrl);
          });
        }, 'image/png');
      });
    } else {
      await this.beginStream(videoElement);
      return '';
    }
  }

  private async beginStream(videoElement: HTMLVideoElement) {
    try {
      this.isCameraLoading.set(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;

      this.closeStream = () => {
        stream.getTracks().forEach((track) => track.stop());
      }

      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          this.isCameraOpen.set(true);
          this.isCameraLoading.set(false);
          resolve(true);
        };
      });
    } catch (error) {
      this.isCameraOpen.set(false);
      this.isCameraLoading.set(false);
      this.isCameraPermissionDenied.set(true);
      console.log(error);
    }
  }

  // private closeStream(stream: MediaStream) {
  //   stream.getTracks().forEach((track) => track.stop());
  // }

  public closeCamera() {
    this.isCameraOpen.set(false);
    this.closeStream();
  }
}
