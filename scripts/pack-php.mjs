// Assembles dist/upload — the built site plus the PHP form handler — ready to upload to classic hosting.
// Usage: npm run build:php
import { cpSync, existsSync, rmSync } from 'node:fs';

const site = 'dist/mysite/browser';
const out = 'dist/upload';
if (!existsSync(site)) {
  console.error('Build the site first: npm run build');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
cpSync(site, out, { recursive: true });
rmSync(`${out}/_headers`, { force: true }); // Cloudflare-only
rmSync(`${out}/index.csr.html`, { force: true }); // 404.html is the same file
cpSync('hosting/php/.htaccess', `${out}/.htaccess`);
cpSync('hosting/php/api', `${out}/api`, { recursive: true });
console.log(`${out}: upload the CONTENTS of this folder to the site root, then create api/config.php from api/config.example.php`);
