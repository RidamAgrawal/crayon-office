import { Component, input, output } from "@angular/core";
import { STATUS_PALETTE_SOLID, STATUS_PALETTE_GRADIENT } from "../../_components/dashboard-space-board-view/dashboard-space-board-view.constants";

@Component({
  selector: 'app-color-picker',
  standalone: true,
  templateUrl: './board-column-color-picker.template.html',
  styleUrl: './board-column-color-picker.template.scss',
})
export class BoardColumnColorPickerComponent {
  readonly current = input<string>('');
  readonly pick = output<string>();
  protected readonly solid = STATUS_PALETTE_SOLID;
  protected readonly gradient = STATUS_PALETTE_GRADIENT;
}
