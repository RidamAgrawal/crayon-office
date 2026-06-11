import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BoardViewCardTemplate } from '../board-card-template';
import { SpaceBoardColumn, WorkItem } from '../../_models';
import { ClickOutside } from '../../../../../../directives';
import { BoardSpaceTextFieldWrapperTemplate } from '../board-space-text-field-wrapper-template';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { OptionsList, OptionConfigurations } from '../../../../../../templates/option-wrapper/option-wrapper.model';
import { WORK_TYPES } from '../../_components/dashboard-space-board-view/dashboard-space-board-view.constants';

@Component({
  selector: 'board-view-column-template',
  templateUrl: './board-column.template.html',
  styleUrl: './board-column.template.scss',
  imports: [BoardViewCardTemplate, DragDropModule, ClickOutside, BoardSpaceTextFieldWrapperTemplate],
})
export class BoardViewColumnTemplate {
  private readonly overlayService = inject(OverlayService);
  public readonly columnDetails = input.required<any>();
  protected readonly txtArea = viewChild<ElementRef<HTMLTextAreaElement>>('txtArea');
  protected readonly columnIssues = computed(() => this.columnDetails().issues);
  public readonly connectedTo = input<string[]>([]);
  protected readonly isCreating = signal<boolean>(false);
  protected readonly isColumnNameEditing = signal<boolean>(false);
  protected readonly draftSummary = signal('');
  protected readonly draftWorkType = signal<string>('TASK');
  protected readonly draftDueDate = signal<string | null>(null);
  public readonly index = input.required<number>();
  public readonly total = input.required<number>();
  public readonly isLoading = input<boolean>(false);

  public readonly columnOptionsClick = output<{ column: SpaceBoardColumn; trigger: HTMLElement }>();
  public readonly cardDropped = output<CdkDragDrop<WorkItem[]>>();
  public readonly columnRenamed = output<{ columnId: string; label: string }>();
  public readonly issueCreate = output<{
    statusId: string;
    summary: string;
    workType: string;
    dueDate: string | null;
  }>();

  protected canSubmit = computed(() => this.draftSummary().trim().length > 0);

  private autoFocus = effect(() => {
    if (this.isCreating()) {
      this.txtArea()?.nativeElement.focus();
    }
  });

  protected onMoreClick(e: MouseEvent, columnOptionBtn: HTMLButtonElement): void {
    this.columnOptionsClick.emit({
      column: this.columnDetails(),
      trigger: columnOptionBtn as HTMLElement,
    });
  }

  protected onColumnNameEdited(label: string): void {
    const trimmed = label.trim();
    if (!trimmed || trimmed === this.columnDetails().label) {
      this.isColumnNameEditing.set(false);
      return;
    }
    this.columnRenamed.emit({ columnId: this.columnDetails().id, label: trimmed });
    this.isColumnNameEditing.set(false);
  }

  protected submitDraft(): void {
    if (!this.canSubmit()) return;
    this.issueCreate.emit({
      statusId: this.columnDetails().id,
      summary: this.draftSummary().trim(),
      workType: this.draftWorkType(),
      dueDate: this.draftDueDate(),
    });
    this.draftSummary.set('');
    this.draftDueDate.set(null);
    this.draftWorkType.set('TASK');
    this.isCreating.set(false);
  }

  protected openWorkTypePicker(trigger: HTMLElement): void {
    const optionLists: OptionsList[] = [{
      options: WORK_TYPES.map(wt => ({
        type: 'button' as const,
        id: wt.id.toUpperCase(),  // matches the WorkType enum: TASK/BUG/EPIC/STORY
        label: wt.label,
        icon: wt.icon,
        visible: true,
      })),
    }];
    this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: {
          optionLists,
          handleOptionEvent: (action: OptionConfigurations) => {
            if (action.id) this.draftWorkType.set(action.id);
            this.overlayService.close();
          },
        },
      },
      connectedTo: new ElementRef(trigger),
      positions: [{ originX: 'start', overlayX: 'start', originY: 'bottom', overlayY: 'top', offsetY: 4 }],
    });
  }

  protected openDatePicker(trigger: HTMLElement): void {
    // Open a date picker overlay → this.draftDueDate.set(iso);
  }
}
