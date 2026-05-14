import { ConnectedPosition } from "@angular/cdk/overlay";

export const SpaceBoardsFilters = [
    { id: 'parent', text: 'Parent', isInfoIcon: true },
    { id: 'assignee', text: 'Assignee', },
    { id: 'workType', text: 'Work type', },
    { id: 'labels', text: 'Labels', },
    { id: 'status', text: 'Status', },
    { id: 'priority', text: 'Priority', },
];

export const SpaceBoardsModalFilterPosition: ConnectedPosition[] = [
    {
        originX: 'start',
        overlayX: 'start',
        originY: 'bottom',
        overlayY: 'top',
        offsetY: 6,
    }
];