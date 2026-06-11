import {
  Component,
  input,
  output,
  signal,
  effect,
  computed,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpaceBoardColumn } from '../../_models';
import { MultiSelect } from '../../../../../../templates/multi-select/multi-select';
import { StatusSelectConfig } from './board-column-delete-modal.constants';
import { OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';

@Component({
  selector: 'board-column-delete-modal',
  templateUrl: './board-column-delete-modal.template.html',
  styleUrl: './board-column-delete-modal.template.scss',
  imports: [FormsModule, MultiSelect],
})
export class BoardColumnDeleteModalTemplate {
  readonly source = input.required<SpaceBoardColumn>();
  readonly candidates = input.required<SpaceBoardColumn[]>(); // remaining columns, source excluded

  protected readonly statusOptionTemplate = viewChild<TemplateRef<any>>('statusOptionTemplate');

  readonly confirm = output<string | null>(); // targetStatusId or null when empty
  readonly cancel = output<void>();

  protected readonly targetId = signal<string | null>(null);
  protected readonly isDeleting = signal<boolean>(false);
  protected readonly selectConfig = computed(() => ({
    ...StatusSelectConfig,
    optionLists: [
      {
        ...StatusSelectConfig.optionLists[0],
        options: this.candidates().map((s) => ({
          label: s.label,
          id: s.id,
          type: 'button' as const,
          visible: true,
          contentTemplateRef: this.statusOptionTemplate(),
          outlineColor: s.backgroundColor,
        })),
      },
    ],
  }));

  protected onDelete(): void {
    this.isDeleting.set(true);
    this.confirm.emit(this.source().issues.length ? this.targetId() : null);
  }

  protected onSelect(optionConfigurations: OptionConfigurations[]): void {
    this.targetId.set(optionConfigurations[0].id ?? null);
  }
}
