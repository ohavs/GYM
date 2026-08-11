/**
 * Stamps the build id into the exported service worker.
 *
 * The cache name has to change on every deploy. If it does not, the browser
 * keeps the previously installed worker, which serves a cached shell that
 * still points at the last build's fingerprinted chunks. Those files are gone,
 * so the app opens blank offline and stays blank until the cache is cleared by
 * hand. Stamping makes each deploy a new worker with its own caches, and the
 * activate step drops the old ones.
 */
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'out', 'sw.js');
if (!fs.existsSync(file)) {
  console.error('stamp-sw: out/sw.js not found, did next build run?');
  process.exit(1);
}

const build = process.env.BUILD_ID ?? `${Date.now().toString(36)}`;
const source = fs.readFileSync(file, 'utf8');
const stamped = source.replace(/const VERSION = '[^']*';/, `const VERSION = 'maslul-${build}';`);

if (stamped === source) {
  console.error('stamp-sw: VERSION line not found in out/sw.js');
  process.exit(1);
}

fs.writeFileSync(file, stamped);
console.log(`stamp-sw: cache version maslul-${build}`);
