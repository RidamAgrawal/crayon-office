import { Response } from 'express';
import { prisma } from '../lib/prisma';
import type { MemberRole } from '@prisma/client';

export interface SpaceCapabilities {
  addPeople: boolean;
  manageSettings: boolean;
  deleteSpace: boolean;
  setBackground: boolean;
  manageStatuses: boolean;
}

export const defaultViewsByTemplate: Record<
  string,
  Array<{
    type: 'BOARD' | 'LIST' | 'CALENDAR' | 'SUMMARY' | 'TIMELINE' | 'FORM' | 'CODE';
    name: string;
  }>
> = {
  kanban: [
    { type: 'BOARD', name: 'Board' },
    { type: 'LIST', name: 'List' },
    { type: 'CALENDAR', name: 'Calendar' },
    { type: 'SUMMARY', name: 'Summary' },
  ],
  scrum: [
    { type: 'BOARD', name: 'Board' },
    { type: 'LIST', name: 'List' },
    { type: 'TIMELINE', name: 'Timeline' },
    { type: 'SUMMARY', name: 'Summary' },
  ],
  bugTracking: [
    { type: 'LIST', name: 'List' },
    { type: 'SUMMARY', name: 'Summary' },
  ],
};

// A small helper — returns the space or sends 403/404 and returns null
export async function getSpaceForMember(
  id: string,
  userId: string,
  res: Response,
): Promise<any | null> {
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      views: true,
      members: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!space) {
    res.status(404).json({ error: 'Space not found' });
    return null;
  }
  const isMember = space.members.some((m: any) => m.userId === userId);
  if (!isMember) {
    res.status(403).json({ error: 'Not a member' });
    return null;
  }
  const me = space.members.find((m: any) => m.userId === userId)!;

  return {
    ...space,
    currentUser: { role: me.role, can: capsForRole(me.role) },
  };
}

export function capsForRole(role: MemberRole): SpaceCapabilities {
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;
  const isMember = role === 'MEMBER' || isAdmin;
  return {
    addPeople: isAdmin,
    manageSettings: isAdmin,
    deleteSpace: isOwner,
    setBackground: isMember,
    manageStatuses: isAdmin,
  };
}
