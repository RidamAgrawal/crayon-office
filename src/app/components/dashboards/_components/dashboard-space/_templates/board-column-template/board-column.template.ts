import { Component, computed, input, output } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { BoardViewCardTemplate } from '../board-card-template';
import { WorkItem } from '../../_models';

@Component({
  selector: 'board-view-column-template',
  templateUrl: './board-column.template.html',
  styleUrl: './board-column.template.scss',
  imports: [BoardViewCardTemplate, DragDropModule],
})
export class BoardViewColumnTemplate {
  public readonly columnDetails = input.required<any>();
  protected readonly columnIssues = computed(() => this.columnDetails().issues);
  public readonly connectedTo = input<string[]>([]);
  public readonly cardDropped = output<CdkDragDrop<WorkItem[]>>();
}
