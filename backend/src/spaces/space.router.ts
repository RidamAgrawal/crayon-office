import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  requireAuth,
  AuthRequest,
} from "../auth/auth.middleware";

const router = Router();

// POST /api/spaces — create a new space
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, key } = req.body as { name: string; key: string };

    if (!name?.trim() || !key?.trim()) {
      return res.status(400).json({ error: "name and key are required" });
    }

    // Key must be 2-6 uppercase alphanumeric characters
    if (!/^[A-Z0-9]{2,6}$/.test(key)) {
      return res
        .status(400)
        .json({ error: "key must be 2-6 uppercase alphanumeric characters" });
    }

    const existing = await prisma.space.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ error: "A space with this key already exists" });
    }

    const space = await prisma.space.create({
      data: {
        name: name.trim(),
        key,
        ownerId: req.userId!,
      },
    });

    return res.status(201).json(space);
  } catch (err) {
    console.error("Create space error:", err);
    return res.status(500).json({ error: "Failed to create space" });
  }
});

// GET /api/spaces — list spaces the user owns
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { ownerId: req.userId! },
      orderBy: { createdAt: "desc" },
    });

    return res.json(spaces);
  } catch (err) {
    console.error("List spaces error:", err);
    return res.status(500).json({ error: "Failed to list spaces" });
  }
});

// GET /api/spaces/:id — get a single space
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const space = await prisma.space.findUnique({
      where: { id: req.params["id"] as string },
    });

    if (!space) {
      return res.status(404).json({ error: "Space not found" });
    }

    return res.json(space);
  } catch (err) {
    console.error("Get space error:", err);
    return res.status(500).json({ error: "Failed to get space" });
  }
});

export default router;
