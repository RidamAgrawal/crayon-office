import { ConnectedPosition } from '@angular/cdk/overlay';

export const SpaceBoardsFilters = [
  { id: 'parent', text: 'Parent', isInfoIcon: true },
  { id: 'assignee', text: 'Assignee' },
  { id: 'workType', text: 'Work type' },
  { id: 'labels', text: 'Labels' },
  { id: 'status', text: 'Status' },
  { id: 'priority', text: 'Priority' },
];

export const SpaceBoardsModalFilterPosition: ConnectedPosition[] = [
  {
    originX: 'start',
    overlayX: 'start',
    originY: 'bottom',
    overlayY: 'top',
    offsetY: 6,
  },
  {
    originX: 'start',
    overlayX: 'center',
    originY: 'bottom',
    overlayY: 'top',
    offsetY: 6,
  },
];

export const spaceIconUrl1 =
  'https://demo1234.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/';

export const spaceIconUrl2 =
  'https://demo1234.atlassian.net/secure/viewavatar?size=xxxlarge@2x&avatarId=10400&avatarType=project';

export const WORK_TYPES = [
  { label: 'Epic', id: 'epic', icon: 'action' },
  { label: 'Subtask', id: 'subtask', icon: 'action' },
  { label: 'Task', id: 'task', icon: 'action' },
];

export const STATUS_PALETTE = ['#dddee1', '#8fb8f6', '#b3df72', '#f5c5a4', '#c4b5fd', '#fda4af'];

export function pickNextPaletteColor(columns: { backgroundColor: string }[] | null): string {
  const used = new Set((columns ?? []).map(c => c.backgroundColor));
  return STATUS_PALETTE.find(c => !used.has(c)) ?? STATUS_PALETTE[(columns?.length ?? 0) % STATUS_PALETTE.length];
}

export const STATUS_OPTION_IDS = {
  moveLeft: 'moveColumnLeft',
  moveRight: 'moveColumnRight',
  setLimit: 'setColumnLimit',
  setColor: 'setColumnColor',
  delete: 'deleteColumn',
} as const;