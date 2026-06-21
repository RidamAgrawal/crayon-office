// Copies the generated Prisma client from backend/node_modules up into the repo-root
// node_modules so Netlify's function bundler can include it (it resolves externalized
// modules from the root node_modules, but backend deps live in backend/node_modules).
// Cross-platform (runs on Windows cmd.exe and Netlify Linux) — uses built-in fs only.
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// @prisma/client/default.js re-exports from .prisma/client, so both are required.
for (const name of ['@prisma', '.prisma']) {
  const src = path.join(root, 'backend', 'node_modules', name);
  const dest = path.join(root, 'node_modules', name);
  if (!existsSync(src)) {
    console.error(`[copy-prisma] ERROR: ${src} not found — run "prisma generate" first.`);
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-prisma] ${src} -> ${dest}`);
}
