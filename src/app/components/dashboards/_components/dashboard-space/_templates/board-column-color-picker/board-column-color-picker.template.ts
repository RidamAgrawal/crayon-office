import { Component, input, output } from '@angular/core';
import { TabComponent } from '../../../tabs/tabs';
import {
  STATUS_PALETTE_GRADIENT,
  STATUS_PALETTE_SOLID,
  STATUS_PALLETTES,
} from '../../../../../../styles/palettes';

@Component({
  selector: 'app-color-picker',
  templateUrl: './board-column-color-picker.template.html',
  styleUrl: './board-column-color-picker.template.scss',
  imports: [TabComponent],
})
export class BoardColumnColorPickerComponent {
  public readonly current = input<string>('');
  public readonly pick = output<string>();
  public readonly close = output<void>();
  protected readonly solid = STATUS_PALETTE_SOLID;
  protected readonly gradient = STATUS_PALETTE_GRADIENT;

  protected readonly statusPalletes: Record<string, string> = STATUS_PALLETTES;
}
