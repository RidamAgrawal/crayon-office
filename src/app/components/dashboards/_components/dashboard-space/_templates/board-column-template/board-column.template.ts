import { Component, computed, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BoardViewCardTemplate } from '../board-card-template';
import { WorkItem } from '../../_models';
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
  public readonly cardDropped = output<CdkDragDrop<WorkItem[]>>();
  protected readonly isCreating = signal<boolean>(false);

  private autoFocus = effect(() => {
    if (this.isCreating()) {
      this.txtArea()?.nativeElement.focus();
    }
  });
}
