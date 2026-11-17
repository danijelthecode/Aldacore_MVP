// Builds a single-file version of the homepage for hosts that wrap the page in their own document
// skeleton (for example a Claude artifact). Output: dist/artifact/newcode-homepage.html plus a
// files.json map of every asset the page references.
//
//   node scripts/build-artifact.mjs
//
// The normal site (index.html + css + js + assets) needs no build step at all.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/styles.css'), 'utf8').replaceAll('url("../assets/', 'url("assets/');
const js = readFileSync(join(root, 'js/main.js'), 'utf8');

const body = html.slice(html.indexOf('<body>') + '<body>'.length, html.lastIndexOf('</body>'))
  .replace(/<script src="js\/main\.js" defer><\/script>/, '');

const page = `<title>Newcode Homepage Refresh</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap">
<style>
${css}
</style>
<script>document.documentElement.classList.add('js');</script>
${body.trim()}
<script>
${js}
</script>
`;

const outDir = join(root, 'dist/artifact');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'newcode-homepage.html'), page);

// Only ship assets the page actually references.
const walk = dir => readdirSync(dir).flatMap(name => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = {};
for (const file of walk(join(root, 'assets'))) {
  const rel = relative(root, file).split('\\').join('/');
  if (page.includes(rel)) files[rel] = `newcode-homepage/${rel}`;
}
writeFileSync(join(outDir, 'files.json'), JSON.stringify(files, null, 2));

const kb = n => Math.round(n / 1024) + ' KB';
console.log('page', kb(Buffer.byteLength(page)), '| assets referenced', Object.keys(files).length,
  '|', kb(Object.keys(files).reduce((sum, rel) => sum + statSync(join(root, rel)).size, 0)));
