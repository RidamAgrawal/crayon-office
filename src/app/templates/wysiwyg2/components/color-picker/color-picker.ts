import { Component, inject, input } from '@angular/core';
import { EditorCommandsService } from '../../services';

@Component({
  selector: 'app-color-picker',
  imports: [],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss'
})
export class ColorPicker {
  private editorCommandService = inject(EditorCommandsService);
  protected colorPallettes = input.required<any[]>();
  protected onColorSelect(hexCode: string) {
    this.editorCommandService.setTextColor(hexCode);
  }
}
