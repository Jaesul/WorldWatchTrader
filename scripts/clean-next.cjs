/**
 * Remove `.next` before production builds so a stale or partially-written
 * cache cannot cause PageNotFoundError / ENOENT during "Collecting page data".
 * Avoid running two `next build` processes against the same directory at once.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), '.next');
try {
  fs.rmSync(dir, { recursive: true, force: true });
} catch {
  /* ignore missing or unreadable .next */
}
