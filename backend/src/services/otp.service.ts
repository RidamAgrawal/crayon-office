interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateEntry {
  count: number;
  windowStart: number;
}

const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SEND_PER_WINDOW = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min

const otpStore = new Map<string, OtpEntry>();
const sendRateStore = new Map<string, RateEntry>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function checkSendRateLimit(email: string): { allowed: boolean; retryAfterSecs?: number } {
  const now = Date.now();
  const entry = sendRateStore.get(email);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    sendRateStore.set(email, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_SEND_PER_WINDOW) {
    const retryAfterSecs = Math.ceil((entry.windowStart + RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSecs };
  }

  entry.count++;
  return { allowed: true };
}

export function storeOtp(email: string, code: string): void {
  otpStore.set(email, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function deleteOtp(email: string): void {
  otpStore.delete(email);
}

export function verifyOtp(
  email: string,
  code: string,
): { valid: boolean; error?: string; status?: number } {
  const entry = otpStore.get(email);

  if (!entry) {
    return { valid: false, error: 'No OTP found for this email. Request a new one.', status: 400 };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return { valid: false, error: 'OTP has expired. Request a new one.', status: 410 };
  }

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(email);
    return { valid: false, error: 'Too many attempts. Request a new OTP.', status: 429 };
  }

  entry.attempts++;

  if (entry.code !== code) {
    const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;
    return {
      valid: false,
      error: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      status: 401,
    };
  }

  otpStore.delete(email);
  return { valid: true };
}
