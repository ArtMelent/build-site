// Writes sitemap.xml and robots.txt into the build output.
// Lists the pages that were prerendered (one folder with index.html per page).
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist/mysite/browser';
const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!existsSync(out)) process.exit(0);

const pages = [];
const walk = (dir, url) => {
  if (existsSync(join(dir, 'index.html'))) pages.push(url || '/');
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory() && !['assets', 'media', 'font'].includes(name)) walk(p, `${url}/${name}`);
  }
};
walk(out, '');

const today = new Date().toISOString().slice(0, 10);
if (site) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(out, 'sitemap.xml'), xml);
}
writeFileSync(
  join(out, 'robots.txt'),
  `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`,
);
console.log(`sitemap: ${pages.length} pages${site ? '' : ' (SITE_URL not set — sitemap.xml skipped)'}`);
