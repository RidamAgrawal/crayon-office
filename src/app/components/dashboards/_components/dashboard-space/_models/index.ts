import { User } from '../../../../../models';
import { OptionsList } from '../../../../../templates/option-wrapper/option-wrapper.model';

export interface SpaceDetails {
  id: string;
  name: string;
  key: string;
  icon: string | null;
  counter: number;
  type: 'JIRA' | 'CONFLUENCE';
  createdAt: string;
  updatedAt: string;
  template: 'kanban' | 'scrum' | 'bugTracking';
  ownerId: string | null;
  members: SpaceMember[];
  optionLists: OptionsList[];
  spaceNavs: SpaceNavs[];
  // workItems: unknown[];
  // views: unknown[];
}

export interface SpaceMember {
  userId: string;
  spaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: {
    avatarUrl: string | null;
    displayName: string;
    id: string;
  };
}

export const SpaceStoreKey = 'SpaceStoreKey';

export interface SpaceStoreState {
  spaceDetails: SpaceDetails;
  spaceBoardDetails: SpaceBoardDetails;
}

export interface SpaceBoardDetails {
  columns: SpaceBoardColumn[];
}

export interface SpaceBoardColumn {
  category: string;
  id: string;
  name: string;
  label: string;
  backgroundColor: string;
  order: number;
  spaceId: string;
  issues: WorkItem[];
}

export interface SpaceNavs {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  optionLists: OptionsList[];
}

export interface WorkItem {
  description: string;
  spaceId: string;
  statusId: string;
  summary: string;
  workType: string;
  rank: string;
  id: string;
}
