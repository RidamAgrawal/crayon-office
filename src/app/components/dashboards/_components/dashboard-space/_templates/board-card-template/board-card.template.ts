import { Component, input } from '@angular/core';
import { WorkItem } from '../../_models';

@Component({
  selector: 'board-view-card-template',
  templateUrl: './board-card.template.html',
  styleUrl: './board-card.template.scss',
})
export class BoardViewCardTemplate {
  public issue = input<WorkItem>();
}
