import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { sendOtpEmail, sendRecoveryLinkEmail } from "../services/mail.service";
import { generateOtp, checkSendRateLimit, storeOtp, deleteOtp, verifyOtp } from "../services/otp.service";
import { googleClient } from "../services/google-verify.service";
import { verifyMicrosoftToken } from "../services/microsoft-verify.service";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"]!;

// ── Password validation (mirrors frontend rules) ────────────────
function validateNewPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
}

// ── Rate limiter for reset-password attempts ────────────────────
const resetAttemptStore = new Map<string, { count: number; windowStart: number }>();
const RESET_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

function checkResetRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = resetAttemptStore.get(email);
  if (!entry || now - entry.windowStart > RESET_ATTEMPT_WINDOW_MS) {
    resetAttemptStore.set(email, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_RESET_ATTEMPTS) return false;
  entry.count++;
  return true;
}

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

  try {
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
  } catch (err: any) {
    console.error("[login error] code:", err?.code, "message:", err?.message);
    res.status(500).json({ error: "Internal server error" });
  }
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

  let existing;
  try {
    existing = await prisma.user.findUnique({ where: { email } });
  } catch (err: any) {
    console.error("[send-otp] db error — code:", err?.code, "| message:", err?.message, "| meta:", JSON.stringify(err?.meta));
    res.status(500).json({ error: "Internal server error" });
    return;
  }

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

router.post("/signup/send-recovery-link", async (req: Request, res: Response) => {
  const { email } = req.body as {
    email: string;
  };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      // Don't reveal whether the email is registered
      res.status(200).json({ message: 'If this email is registered, a recovery link has been sent.' });
      return;
    }
  } catch (err) {
    console.error("[password reset error]", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const token = jwt.sign({ email, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: "15m" });
  try {
    await sendRecoveryLinkEmail(email, `${process.env.FRONTEND_URL}/resetPassword?token=${token}`);
  } catch (err) {
    console.error("[send-reset-link] email delivery failed:", err);
    res.status(502).json({ error: "Failed to send verification email. Try again." });
    return;
  }

  res.status(200).json({ message: 'Recovery link sent' });
});

router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as {
    token: string;
    newPassword: string;
  };

  if (!token || !newPassword) {
    res.status(400).json({ error: "token and password are required" });
    return;
  }

  // #6 — validate password strength before doing any DB work
  const passwordError = validateNewPassword(newPassword);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  let email: string;
  try {
    const result = jwt.verify(token, JWT_SECRET) as { email: string; purpose: string };
    if (result.purpose !== 'password-reset') {
      res.status(400).json({ error: "invalid token" });
      return;
    }
    email = result.email;
  } catch (err) {
    res.status(400).json({ error: "invalid token" });
    return;
  }

  // #8 — rate limit reset attempts per email to prevent token brute-force
  if (!checkResetRateLimit(email)) {
    res.status(429).json({ error: "Too many attempts. Please request a new recovery link." });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }
  } catch (err) {
    console.error("[reset-password] db lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;  // #2 — was missing, execution fell through to update
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    // #7 — use select to avoid returning passwordHash
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
      select: { id: true },
    });
  } catch (err) {
    console.error("[reset-password] update error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;  // #3 — was missing, double response crash
  }

  res.status(200).json({ message: 'Password updated' });
});

router.post("/google", async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken: string; };

  if (!idToken) {
    return res.status(400).json({ error: "Missing credential" });
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
  } catch (err) {
    console.error("[google verification error]", err);
    res.status(500).json({ error: "Google Sign up error" });
    return;
  }

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.email_verified) {
    res.status(401).json({ error: "Invalid or unverified Google account" });
    return;
  }

  const user = {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    profileUrl: payload.profile,
    picture: payload.picture,
    emailVerified: payload.email_verified
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      const { passwordHash: _, ...safeUser } = existing;
      const token = jwt.sign({ userId: existing.id }, JWT_SECRET, { expiresIn: "7d" });
      res.status(200).json({ token, user: safeUser });
    } else {
      const randomHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const newUser = await prisma.user.create({
        data: {
          email: user.email!,
          displayName: user.name ?? user.email!.split('@')[0],
          passwordHash: randomHash,
          avatarUrl: user.picture ?? null,
        },
        select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
      });
      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ token, user: newUser });
    }
  } catch (err) {
    console.error("[google auth] db error:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

});

router.post("/microsoft", async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken: string };
  if (!idToken) {
    return res.status(400).json({ error: "Missing credential" });
  }

  let payload;
  try {
    payload = await verifyMicrosoftToken(idToken);
  } catch (err) {
    console.error("[microsoft auth] verification error:", err);
    return res.status(401).json({ error: "Invalid Microsoft token" });
  }

  const email = payload.email ?? payload.preferred_username;
  if (!email) {
    return res.status(401).json({ error: "No email in Microsoft token" });
  }

  // Same logic as Google route — find or create user
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const { passwordHash: _, ...safeUser } = existing;
      const token = jwt.sign({ userId: existing.id }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({ token, user: safeUser });
    }

    const randomHash = await bcrypt.hash(crypto.randomUUID(), 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        displayName: payload.name ?? email.split('@')[0],
        passwordHash: randomHash,
        avatarUrl: null,
      },
      select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
    });
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error("[microsoft auth] db error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;