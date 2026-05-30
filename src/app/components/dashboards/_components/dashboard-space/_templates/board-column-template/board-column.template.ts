import { Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BoardViewCardTemplate } from '../board-card-template';
import { SpaceBoardColumn, WorkItem } from '../../_models';
import { ClickOutside } from '../../../../../../directives';

@Component({
  selector: 'board-view-column-template',
  templateUrl: './board-column.template.html',
  styleUrl: './board-column.template.scss',
  imports: [BoardViewCardTemplate, DragDropModule, ClickOutside],
})
export class BoardViewColumnTemplate {
  public readonly columnDetails = input.required<any>();
  protected readonly txtArea = viewChild<ElementRef<HTMLTextAreaElement>>('txtArea');
  protected readonly columnIssues = computed(() => this.columnDetails().issues);
  public readonly connectedTo = input<string[]>([]);
  protected readonly isCreating = signal<boolean>(false);
  public readonly index = input.required<number>();
  public readonly total = input.required<number>();

  public readonly columnOptionsClick = output<{ column: SpaceBoardColumn; trigger: HTMLElement }>();
  public readonly cardDropped = output<CdkDragDrop<WorkItem[]>>();

  private autoFocus = effect(() => {
    if (this.isCreating()) {
      this.txtArea()?.nativeElement.focus();
    }
  });

  protected onMoreClick(e: MouseEvent): void {
    this.columnOptionsClick.emit({
      column: this.columnDetails(),
      trigger: e.currentTarget as HTMLElement,
    });
  }
}
