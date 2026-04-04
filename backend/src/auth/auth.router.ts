import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { sendOtpEmail } from "../services/mail.service";
import { generateOtp, checkSendRateLimit, storeOtp, deleteOtp, verifyOtp } from "../services/otp.service";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"]!;

// ── Register (direct, no OTP) ───────────────────────────────────

router.post("/register", async (req: Request, res: Response) => {
  const { email, displayName, password } = req.body as {
    email: string;
    displayName: string;
    password: string;
  };

  if (!email || !displayName || !password) {
    res.status(400).json({ error: "email, displayName and password are required" });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, displayName, passwordHash },
      select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("[register error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Login ───────────────────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// ── Signup with OTP ─────────────────────────────────────────────

router.post("/signup/send-otp", async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  // Rate limit: max 3 OTPs per email per 10 min window
  const rateCheck = checkSendRateLimit(email);
  if (!rateCheck.allowed) {
    res.status(429).json({ error: `Too many requests. Try again in ${rateCheck.retryAfterSecs}s.` });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const code = generateOtp();
  storeOtp(email, code);

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    // Email failed — clean up the stored OTP so we don't leave a dangling entry
    deleteOtp(email);
    console.error("[send-otp] email delivery failed:", err);
    res.status(502).json({ error: "Failed to send verification email. Try again." });
    return;
  }

  res.json({ message: "OTP sent" });
});

router.post("/signup/verify-otp", async (req: Request, res: Response) => {
  const { email, code, displayName, password } = req.body as {
    email: string;
    code: string;
    displayName: string;
    password: string;
  };

  if (!email || !code || !displayName || !password) {
    res.status(400).json({ error: "email, code, displayName and password are required" });
    return;
  }

  const result = verifyOtp(email, code);
  if (!result.valid) {
    res.status(result.status!).json({ error: result.error });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, displayName, passwordHash },
      select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error("[signup/verify-otp error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;