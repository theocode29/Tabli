import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('build/index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[patch-build-index] build/index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// Convert absolute asset paths to relative for preview environments
const countAppBefore = (html.match(/\/_app\//g) || []).length;
const countFavBefore = (html.match(/\/favicon\.svg/g) || []).length;
html = html.replace(/\/_app\//g, './_app/');
html = html.replace(/\/favicon\.svg/g, './favicon.svg');
const countAppAfter = (html.match(/\/_app\//g) || []).length;
const countFavAfter = (html.match(/\/favicon\.svg/g) || []).length;
fs.writeFileSync(indexPath, html);
console.log(`[patch-build-index] Rewrote /_app/ (${countAppBefore} -> ${countAppAfter}), /favicon.svg (${countFavBefore} -> ${countFavAfter})`);