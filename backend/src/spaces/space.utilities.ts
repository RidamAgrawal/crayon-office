import { Response } from 'express';
import { prisma } from '../lib/prisma';

// A small helper — returns the space or sends 403/404 and returns null
export async function getSpaceForMember(
  id: string,
  userId: string,
  res: Response,
): Promise<any | null> {
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
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
  return space;
}
