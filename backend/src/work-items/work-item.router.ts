import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  requireAuth,
  AuthRequest,
} from "../auth/auth.middleware";

const router = Router();

// POST /api/work-items — create a work item
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { spaceId, summary, workType, description, status } = req.body as {
      spaceId: string;
      summary: string;
      workType: string;
      description?: string;
      status?: string;
    };

    if (!spaceId || !summary?.trim() || !workType) {
      return res
        .status(400)
        .json({ error: "spaceId, summary, and workType are required" });
    }

    const validWorkTypes = ["TASK", "BUG", "EPIC", "STORY"];
    if (!validWorkTypes.includes(workType)) {
      return res
        .status(400)
        .json({ error: `workType must be one of: ${validWorkTypes.join(", ")}` });
    }

    const validStatuses = ["OPEN", "IN_PROGRESS", "DONE"];
    if (status && !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    // Atomically increment space counter and create work item
    const workItem = await prisma.$transaction(async (tx) => {
      const space = await tx.space.update({
        where: { id: spaceId },
        data: { counter: { increment: 1 } },
      });

      const key = `${space.key}-${space.counter}`;

      return tx.workItem.create({
        data: {
          key,
          summary: summary.trim(),
          description: description?.trim() || null,
          workType: workType as any,
          status: (status as any) || "OPEN",
          spaceId,
          reporterId: req.userId!,
        },
      });
    });

    return res.status(201).json(workItem);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Space not found" });
    }
    console.error("Create work item error:", err);
    return res.status(500).json({ error: "Failed to create work item" });
  }
});

// GET /api/work-items?spaceId=xxx — list work items in a space
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { spaceId } = req.query as { spaceId?: string };

    if (!spaceId) {
      return res.status(400).json({ error: "spaceId query param is required" });
    }

    const workItems = await prisma.workItem.findMany({
      where: { spaceId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(workItems);
  } catch (err) {
    console.error("List work items error:", err);
    return res.status(500).json({ error: "Failed to list work items" });
  }
});

// GET /api/work-items/:id — get a single work item
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workItem = await prisma.workItem.findUnique({
      where: { id: req.params["id"] },
      include: {
        space: { select: { id: true, name: true, key: true } },
        reporter: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!workItem) {
      return res.status(404).json({ error: "Work item not found" });
    }

    return res.json(workItem);
  } catch (err) {
    console.error("Get work item error:", err);
    return res.status(500).json({ error: "Failed to get work item" });
  }
});

export default router;
