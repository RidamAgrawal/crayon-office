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
  // workItems: unknown[];
  views: SpaceView[];
  currentUser: {
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    can: SpaceCapabilities;
  };
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

export interface SpaceNav {
  id: string;
  label: string;
  icon: string;
  routerLink: string;
  optionsList: OptionsList[];
}

export interface WorkItem {
  description: string;
  spaceId: string;
  statusId: string;
  summary: string;
  workType: string;
  rank: string;
  id: string;
  key: string;
  priority: string;
  reporterId: string;
  assigneeId: string | null;
  parentId: string | null;
  status: WorkItemStatus;
  assignee: SpaceMember | null;
}

export interface WorkItemStatus {
  category: string;
  id: string;
  name: string;
  label: string;
  backgroundColor: string;
  order: number;
  spaceId: string;
}

export interface SpaceCapabilities {
  addPeople: boolean;
  manageSettings: boolean;
  deleteSpace: boolean;
  setBackground: boolean;
  manageStatuses: boolean;
}

export interface SpaceView {
  id: string;
  spaceId: string;
  type: 'BOARD' | 'LIST' | 'CALENDAR' | 'SUMMARY' | 'FORM' | 'CODE' | 'TIMELINE';
  name: string;
  ownerId: string | null;
}

export type BoardFilterState = {
  assignee: Set<string | null>;
  workType: Set<string>;
  status: Set<string>;
};

export type BoardFilterOptions = {
  id: string;
  text: string;
  isInfoIcon?: boolean;
};
