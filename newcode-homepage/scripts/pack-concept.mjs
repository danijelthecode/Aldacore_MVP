// Packs concepts/<key>/ into one artifact page plus a files map of the assets it references.
//   node pack-concept.mjs <key> "<Title>"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const [key, title] = process.argv.slice(2);
const dir = join(root, 'concepts', key);
const fix = s => s.replaceAll('../../assets/', 'assets/');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const css = fix(readFileSync(join(dir, 'style.css'), 'utf8'));
const js = fix(readFileSync(join(dir, 'app.js'), 'utf8'));
const bodyTag = html.match(/<body([^>]*)>/);
const bodyClass = (bodyTag[1].match(/class="([^"]*)"/) || [])[1];
const headStyles = [...html.slice(0, bodyTag.index).matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map(m => m[0]).join('\n');
const headScripts = [...html.slice(0, bodyTag.index).matchAll(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/g)].map(m => m[0]).join('\n');
const body = fix(html.slice(bodyTag.index + bodyTag[0].length, html.lastIndexOf('</body>')))
  .replace(/<script[^>]*src="app\.js"[^>]*><\/script>/, '');
assert(!/<script[^>]*src="(?!http)/.test(body), 'unhandled local script');
const htmlClass = (html.match(/<html[^>]*class="([^"]*)"/) || [])[1];

const page = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
${fix(headStyles)}
${htmlClass ? `<script>document.documentElement.className += ${JSON.stringify(' ' + htmlClass)};</script>` : ''}
${headScripts}
${bodyClass ? `<script>document.body.className += ${JSON.stringify(' ' + bodyClass)};</script>` : ''}
${body.trim()}
<script>
${js}
</script>
`;
function assert(c, m) { if (!c) throw new Error(m); }

const files = {};
for (const m of page.matchAll(/assets\/[\w./-]+\.(?:webp|png|jpe?g|svg|woff2|mp4|webm|mov|gif)/g)) {
  const rel = m[0];
  assert(existsSync(join(root, rel)), 'missing ' + rel);
  files[rel] = `newcode-homepage/${rel}`;
}
const out = join(root, 'dist/artifact');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${key}.html`), page);
writeFileSync(join(out, `files-${key}.json`), JSON.stringify(files, null, 2));
console.log(key, Math.round(page.length / 1024) + ' KB', Object.keys(files).length, 'assets');
