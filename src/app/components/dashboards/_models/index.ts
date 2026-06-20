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