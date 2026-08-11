/**
 * Stamps the build into the exported service worker: a fresh cache name and
 * the list of this build's app assets.
 *
 * The cache name has to change on every deploy. If it does not, the browser
 * keeps the previously installed worker, which serves a cached shell that
 * still points at the last build's fingerprinted chunks. Those files are gone,
 * so the app opens blank offline and stays blank until the cache is cleared by
 * hand. Stamping makes each deploy a new worker with its own caches, and the
 * activate step drops the old ones.
 *
 * The asset list matters for the same reason. A worker installs while the page
 * that registered it has already fetched its stylesheet and chunks, so those
 * requests never passed through the worker and never landed in its cache. Open
 * the app offline afterwards and the shell HTML comes back but its CSS does
 * not: unstyled text on a white page. Precaching the build's own assets is what
 * makes the first offline open look like the app.
 */
import fs from 'node:fs';
import path from 'node:path';

const out = path.join(process.cwd(), 'out');
const file = path.join(out, 'sw.js');
if (!fs.existsSync(file)) {
  console.error('stamp-sw: out/sw.js not found, did next build run?');
  process.exit(1);
}

/** Every file under out/_next/static, as an absolute URL path. */
function collect(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collect(full));
    else found.push(`/${path.relative(out, full).split(path.sep).join('/')}`);
  }
  return found;
}

const staticDir = path.join(out, '_next', 'static');
const assets = fs.existsSync(staticDir) ? collect(staticDir).sort() : [];

const build = process.env.BUILD_ID ?? `${Date.now().toString(36)}`;
const source = fs.readFileSync(file, 'utf8');

let stamped = source.replace(/const VERSION = '[^']*';/, `const VERSION = 'maslul-${build}';`);
if (stamped === source) {
  console.error('stamp-sw: VERSION line not found in out/sw.js');
  process.exit(1);
}

const withAssets = stamped.replace(
  /const BUILD_ASSETS = \[[^\]]*\];/,
  `const BUILD_ASSETS = ${JSON.stringify(assets)};`,
);
if (withAssets === stamped) {
  console.error('stamp-sw: BUILD_ASSETS line not found in out/sw.js');
  process.exit(1);
}
stamped = withAssets;

fs.writeFileSync(file, stamped);
console.log(`stamp-sw: cache version maslul-${build}, ${assets.length} assets precached`);
