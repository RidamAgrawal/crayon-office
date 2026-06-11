import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  signal,
  viewChild,
} from '@angular/core';

export type PanelType = 'info' | 'note' | 'success' | 'warning' | 'error' | 'decision';

export const PANEL_CONFIG: Record<
  PanelType,
  { background: string; iconColor: string; label: string }
> = {
  info: { background: '#DEEBFF', iconColor: '#1558BC', label: 'Info' },
  note: { background: '#EAE6FF', iconColor: '#803FA5', label: 'Note' },
  success: { background: '#E3FCEF', iconColor: '#216E4E', label: 'Success' },
  warning: { background: '#FFFAE6', iconColor: '#E06C00', label: 'Warning' },
  error: { background: '#FFEBE6', iconColor: '#AE2E24', label: 'Error' },
  decision: {
    background: '#0515240F',
    iconColor: '#6A9A23',
    label: 'Decision',
  },
};

@Component({
  selector: 'editor-panel',
  standalone: true,
  templateUrl: './editor-panel.component.html',
  styleUrl: './editor-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPanelComponent {
  @Input() panelType: PanelType = 'info';
  @Input() onDelete!: (e: MouseEvent) => void;
  @Input() onCopy!: (e: MouseEvent) => void;
  @Input() onTypeChange!: (type: PanelType) => void;

  contentSlot = viewChild<ElementRef<HTMLDivElement>>('contentSlot');

  get config() {
    return PANEL_CONFIG[this.panelType] || PANEL_CONFIG['info'];
  }

  get panelTypes(): PanelType[] {
    return Object.keys(PANEL_CONFIG) as PanelType[];
  }

  isEmpty = signal(true);
}
