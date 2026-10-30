#!/usr/bin/env node
'use strict';

/**
 * check-static-site.js — Verifies that the static site is complete:
 * required files exist, every local href/src/url() resolves, imports resolve,
 * and the SEO files agree on the publish URL.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteBase = 'https://ron-cd.github.io/My-Portfolio/';

const requiredFiles = [
  'index.html',
  'css/tokens.css',
  'css/base.css',
  'css/components.css',
  'css/shell.css',
  'css/title.css',
  'css/screens.css',
  'css/skilltree.css',
  'css/book.css',
  'css/badges.css',
  'css/extras.css',
  'css/summary.css',
  'css/comfort.css',
  'css/world.css',
  'css/player-one.css',
  'scripts/build-css.mjs',
  'js/main.js',
  'js/boot.js',
  'js/core/dom.js',
  'js/core/router.js',
  'js/core/sprites.js',
  'js/core/scene.js',
  'js/core/audio.js',
  'js/core/music.js',
  'js/core/settings.js',
  'js/ui/components.js',
  'js/ui/options.js',
  'js/ui/bookart.js',
  'js/ui/badge.js',
  'js/scenes/title.js',
  'js/scenes/summary.js',
  'js/scenes/world.js',
  'js/ui/worldart.js',
  'js/core/worldmap.js',
  'js/data/world.js',
  'js/scenes/profile.js',
  'js/scenes/skilltree.js',
  'js/scenes/quests.js',
  'js/scenes/achievements.js',
  'js/scenes/contact.js',
  'js/data/profile.js',
  'js/data/certifications.js',
  'js/data/projects.js',
  'js/data/achievements.js',
  'js/data/site.js',
  'assets/fonts/press-start-2p-latin-400-normal.woff2',
  'assets/fonts/ibm-plex-sans-latin-400-normal.woff2',
  'assets/fonts/ibm-plex-sans-latin-600-normal.woff2',
  'assets/icons/favicon.ico',
  'assets/icons/site.webmanifest',
  'assets/img/og-image.png',
  'assets/Aaron_Dela_Cruz_CV.pdf',
  'scripts/check-static-site.js',
  'scripts/validate-data.mjs',
  'scripts/serve-static.js',
  'robots.txt',
  'sitemap.xml',
];

const errors = [];
const fail = message => errors.push(message);
const exists = relativePath => fs.existsSync(path.join(root, relativePath));
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const isExternal = url => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url) || /^(?:mailto|tel|data|javascript):/i.test(url);
const cleanUrl = url => url.split('#')[0].split('?')[0].trim();

function checkLocalReference(sourceFile, url) {
  const clean = cleanUrl(url);
  if (!clean || clean.startsWith('#') || isExternal(clean)) return;
  const sourceDir = path.dirname(path.join(root, sourceFile));
  const target = clean.startsWith('/') ? path.join(root, clean.slice(1)) : path.resolve(sourceDir, clean);
  if (!target.startsWith(root)) return fail(`${sourceFile}: escapes project root: ${url}`);
  if (!fs.existsSync(target)) fail(`${sourceFile}: missing local reference: ${url}`);
}

for (const file of requiredFiles) if (!exists(file)) fail(`Missing required file: ${file}`);

// HTML references
if (exists('index.html')) {
  const html = read('index.html');
  for (const match of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)) checkLocalReference('index.html', match[1]);
}

// CSS url() references and font files
for (const file of fs.readdirSync(path.join(root, 'css')).filter(f => f.endsWith('.css'))) {
  const css = read(`css/${file}`);
  for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) checkLocalReference(`css/${file}`, match[1]);
}

// JS module imports
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const rel = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}
for (const file of walk('js').filter(f => f.endsWith('.js'))) {
  const source = read(file);
  for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) checkLocalReference(file, match[1]);
}

// Manifest
if (exists('assets/icons/site.webmanifest')) {
  try {
    const manifest = JSON.parse(read('assets/icons/site.webmanifest'));
    for (const icon of manifest.icons || []) if (icon?.src) checkLocalReference('assets/icons/site.webmanifest', icon.src);
  } catch (error) {
    fail(`Invalid web manifest JSON: ${error.message}`);
  }
}

// Publish URL consistency
const indexHtml = exists('index.html') ? read('index.html') : '';
const sitemap = exists('sitemap.xml') ? read('sitemap.xml') : '';
const robots = exists('robots.txt') ? read('robots.txt') : '';
if (indexHtml && !indexHtml.includes(siteBase)) fail(`index.html does not include publish URL: ${siteBase}`);
if (sitemap && !sitemap.includes(siteBase)) fail(`sitemap.xml does not include publish URL: ${siteBase}`);
if (robots && !robots.includes(`${siteBase}sitemap.xml`)) fail(`robots.txt does not point at ${siteBase}sitemap.xml`);

// Leftovers from the old space portfolio must not creep back in.
for (const leftover of ['libs', 'assets/satellite', 'css/sections.css', 'css/space.css']) {
  if (exists(leftover)) fail(`Obsolete path still present: ${leftover}`);
}

if (errors.length) {
  console.error('Static site check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log('Static site check passed');
