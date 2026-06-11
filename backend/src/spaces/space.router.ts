import { Router, Response } from 'express';
import {
  type SpaceType,
  type WorkType,
  type StatusCategory,
  Prisma,
  Priority,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';
import { defaultViewsByTemplate, getSpaceForMember } from './space.utilities';

const router = Router();

// POST /api/spaces — create a new space
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      key,
      icon = '',
      type = 'JIRA',
    } = req.body as {
      name: string;
      key: string;
      icon?: string;
      type?: string;
    };

    if (!name?.trim() || !key?.trim()) {
      return res.status(400).json({ error: 'name and key are required' });
    }

    // Key must be 2-6 uppercase alphanumeric characters
    if (!/^[A-Z0-9]{2,6}$/.test(key)) {
      return res.status(400).json({ error: 'key must be 2-6 uppercase alphanumeric characters' });
    }

    const existing = await prisma.space.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ error: 'A space with this key already exists' });
    }

    const [space] = await prisma.$transaction([
      prisma.space.create({
        data: {
          name: name.trim(),
          key,
          icon: icon.trim(),
          type: type as SpaceType,
          ownerId: req.userId!,
        },
      }),
    ]);

    await prisma.$transaction([
      prisma.spaceMember.create({
        data: { spaceId: space.id, userId: req.userId!, role: 'OWNER' },
      }),
      prisma.status.create({
        data: {
          spaceId: space.id,
          name: 'TO_DO',
          label: 'To do',
          backgroundColor: '#dddee1',
          category: 'TODO',
          order: 0,
        },
      }),
      prisma.status.create({
        data: {
          spaceId: space.id,
          name: 'IN_PROGRESS',
          label: 'In progress',
          backgroundColor: '#8fb8f6',
          category: 'IN_PROGRESS',
          order: 1,
        },
      }),
      prisma.status.create({
        data: {
          spaceId: space.id,
          name: 'DONE',
          label: 'Done',
          backgroundColor: '#b3df72',
          category: 'DONE',
          order: 2,
        },
      }),
      ...defaultViewsByTemplate[space.template].map((v) =>
        prisma.view.create({
          data: {
            spaceId: space.id,
            type: v.type,
            name: v.name,
            config: {},
          },
        }),
      ),
    ]);

    return res.status(201).json(space);
  } catch (err) {
    console.error('Create space error:', err);
    return res.status(500).json({ error: 'Failed to create space' });
  }
});

// GET /api/spaces — list spaces the user owns
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { ownerId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(spaces);
  } catch (err) {
    console.error('List spaces error:', err);
    return res.status(500).json({ error: 'Failed to list spaces' });
  }
});

// GET /api/spaces/:id — get a single space
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    return res.json(space);
  } catch (err) {
    console.error('Get space error:', err);
    return res.status(500).json({ error: 'Failed to get space' });
  }
});

router.get('/:id/statuses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;
    const statuses = await prisma.status.findMany({
      where: { spaceId: req.params.id },
      orderBy: { order: 'asc' },
    });
    return res.json(statuses);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get statuses' });
  }
});

router.get('/:id/issues', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const { status, assignee } = req.query as Record<string, string>;
    const where: any = { spaceId: req.params.id };
    if (status) where.statusId = status;
    if (assignee) where.assigneeId = assignee;

    const issues = await prisma.workItem.findMany({
      where,
      orderBy: { rank: 'asc' }, // lexorank → cards stay in drag order
      include: {
        status: true,
        assignee: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return res.json(issues);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get issues' });
  }
});

router.post('/:id/issues', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const {
      summary,
      statusId,
      workType = 'TASK',
      description,
      dueDate,
    } = req.body as {
      summary: string;
      statusId: string;
      workType?: string;
      description?: string;
      dueDate?: string | null;
    };
    if (!summary?.trim()) return res.status(400).json({ error: 'summary is required' });

    // Atomically bump counter to generate DS-1, DS-2 …
    const updated = await prisma.space.update({
      where: { id: req.params.id },
      data: { counter: { increment: 1 } },
      select: { key: true, counter: true },
    });

    const issue = await prisma.workItem.create({
      data: {
        key: `${updated.key}-${updated.counter}`,
        summary: summary.trim(),
        spaceId: req.params.id,
        statusId,
        reporterId: req.userId!,
        workType: workType as WorkType,
        description,
        rank: String(Date.now()),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
    return res.status(201).json(issue);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create issue' });
  }
});

router.post('/:id/statuses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const { name, label, backgroundColor, category } = req.body as {
      name: string;
      label: string;
      backgroundColor: string;
      category: string;
    };
    if (!name?.trim() || !label?.trim() || !backgroundColor?.trim())
      return res.status(400).json({ error: 'name, label, and backgroundColor are required' });

    const last = await prisma.status.findFirst({
      where: { spaceId: req.params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const status = await prisma.status.create({
      data: {
        spaceId: req.params.id,
        name: name.trim(),
        label: label.trim(),
        backgroundColor: backgroundColor.trim(),
        category: (category ?? 'TODO') as StatusCategory,
        order: (last?.order ?? -1) + 1,
      },
    });
    return res.status(201).json(status);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
      return res.status(409).json({ error: 'A status with this name already exists' });
    return res.status(500).json({ error: 'Failed to create status' });
  }
});

router.patch('/:id/issues/:issueId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const { summary, statusId, rank, assigneeId, description, priority } = req.body as {
      summary?: string;
      statusId?: string;
      rank?: string;
      assigneeId?: string | null;
      description?: string;
      priority?: string;
    };

    // Confirm the issue belongs to this space — prevents cross-space mutation
    const existing = await prisma.workItem.findFirst({
      where: { id: req.params.issueId, spaceId: req.params.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    const updated = await prisma.workItem.update({
      where: { id: req.params.issueId },
      data: {
        ...(summary !== undefined && { summary: summary.trim() }),
        ...(statusId !== undefined && { statusId }),
        ...(rank !== undefined && { rank }),
        ...(assigneeId !== undefined && { assigneeId }), // null clears it
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority: priority as Priority }),
      },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update issue' });
  }
});

router.patch('/:id/statuses/reorder', requireAuth, async (req, res) => {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    await prisma.$transaction(
      orderedIds.map((id, order) => prisma.status.update({ where: { id }, data: { order } })),
    );
    return res.status(204).end();
  } catch {
    return res.status(500).json({ error: 'Failed to reorder' });
  }
});

router.patch('/:id/statuses/:statusId', requireAuth, async (req, res) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const { name, label, backgroundColor, category } = req.body as {
      name?: string;
      label?: string;
      backgroundColor?: string;
      category?: string;
    };

    const updated = await prisma.status.update({
      where: { id: req.params.statusId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(label !== undefined && { label }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(category !== undefined && { category }),
      },
    });
    return res.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ error: 'A status with this name already exists' });
    }
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// space.router.ts — new endpoint
router.delete('/:id/statuses/:statusId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await getSpaceForMember(req.params.id, req.userId!, res);
    if (!space) return;

    const { targetStatusId } = req.body as { targetStatusId?: string };

    // Verify the source belongs to this space
    const source = await prisma.status.findFirst({
      where: { id: req.params.statusId, spaceId: req.params.id },
      include: { _count: { select: { items: true } } },
    });
    if (!source) return res.status(404).json({ error: 'Status not found' });

    // Don't allow deleting the last column
    const totalStatuses = await prisma.status.count({ where: { spaceId: req.params.id } });
    if (totalStatuses <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining status' });
    }

    // If there are items, require a valid target
    if (source._count.items > 0) {
      if (!targetStatusId || targetStatusId === source.id) {
        return res.status(400).json({ error: 'targetStatusId is required to move existing items' });
      }
      const target = await prisma.status.findFirst({
        where: { id: targetStatusId, spaceId: req.params.id },
        select: { id: true },
      });
      if (!target) return res.status(400).json({ error: 'targetStatusId not in this space' });
    }

    await prisma.$transaction([
      // Move items first (no-op if there are none)
      prisma.workItem.updateMany({
        where: { statusId: source.id },
        data: { statusId: targetStatusId! },
      }),
      prisma.status.delete({ where: { id: source.id } }),
    ]);

    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete status' });
  }
});

export default router;
