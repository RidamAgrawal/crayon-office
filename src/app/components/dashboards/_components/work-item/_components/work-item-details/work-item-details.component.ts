import { Component, input, output } from "@angular/core";
import { WorkItem } from "../../../../_models";
import { WorkItemDetailService, WorkItemDetailStateService } from "../../_services";


@Component({
    selector: 'work-item-detail',
    templateUrl: './work-item-details.component.html',
    styleUrl: './work-item-details.component.scss',
    providers: [WorkItemDetailService, WorkItemDetailStateService],
})
export class WorkItemDetailComponent {
  issueKey = input.required<string>();      // both hosts supply this
  preloadedIssue = input<WorkItem | null>(null);  // optional seed (modal optimization)
  updated = output<WorkItem>();             // → board sync
  close   = output<void>();                 // → modal host closes
}