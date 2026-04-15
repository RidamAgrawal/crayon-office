import "dotenv/config"; // no-op on Netlify (env vars already injected), loads .env locally

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

export const prisma = new PrismaClient({
  accelerateUrl: process.env["DATABASE_URL"],
}).$extends(withAccelerate());
