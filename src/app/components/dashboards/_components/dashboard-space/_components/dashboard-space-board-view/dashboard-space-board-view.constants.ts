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
