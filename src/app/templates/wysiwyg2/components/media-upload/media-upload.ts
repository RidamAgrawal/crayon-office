import { Component, inject } from '@angular/core';
import { TabComponent } from '../../../../components/dashboards/_components/tabs/tabs';
import { TextField } from '../../../text-field/text-field';
import { OverlayService } from '../../../../services/overlay-service/overlay-service';
import { EditorCommandsService } from '../../services';
import { ImageCaptureService } from './services/image-capture.service';
import { ImagePreviewService } from './services/Image-preview.service';

@Component({
  selector: 'app-media-upload',
  imports: [TabComponent, TextField],
  templateUrl: './media-upload.html',
  styleUrl: './media-upload.scss',
})
export class MediaUpload {
  private readonly overlayService = inject(OverlayService);
  protected readonly imageCaptureService = inject(ImageCaptureService);
  protected readonly imagePreviewService = inject(ImagePreviewService);
  private readonly editorCommandService = inject(EditorCommandsService);

  protected onUploadFileClick() {
    const inputEle = document.createElement('input');
    inputEle.type = 'file';
    inputEle.accept = 'image/*';
    inputEle.style.display = 'none';
    document.body.appendChild(inputEle);
    inputEle.addEventListener('change', () => this.onUploadingFile(inputEle));
    inputEle.click();
  }

  private async onUploadingFile(inputEle: HTMLInputElement) {
    const file = inputEle.files?.[0];
    if (!file) return;

    // 1. Validate the uploaded file
    const validation = this.imageCaptureService.validateImageFile(file);
    if (!validation.valid) {
      console.error('[WYSIWYG] Image validation failed:', validation.error);
      alert(validation.error);
      inputEle.remove();
      return;
    }

    // 2. Read file as data-URL and insert into editor
    try {
      const dataUrl = await this.imageCaptureService.readFileAsDataUrl(file);
      this.editorCommandService.insertImage(dataUrl, file.name);
      this.closeOverlay();
    } catch (err) {
      console.error('[WYSIWYG] Failed to read image:', err);
      alert('Failed to read the image file. Please try again.');
    }

    inputEle.remove();
  }

  protected onInsertUrlImage() {
    this.editorCommandService.insertImage(this.imagePreviewService.imgPreviewLink());
    this.imagePreviewService.resetUploadImageLinkState();
    this.overlayService.close();
  }

  protected onCancelBtnClick() {
    this.closeOverlay();
  }

  protected onCaptureCancelClick() {
    this.imageCaptureService.closeCamera();
  }

  protected closeOverlay() {
    this.imageCaptureService.closeCamera();
    this.imagePreviewService.resetUploadImageLinkState();
    this.overlayService.close();
  }
}
