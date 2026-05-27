#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteBase = 'https://ron-cd.github.io/My-Portfolio/';

const requiredFiles = [
  'index.html',
  'html/lab-activities.html',
  'css/base.css',
  'css/space.css',
  'css/sections.css',
  'css/lab-activities.css',
  'js/boot.js',
  'js/main.js',
  'js/animation.js',
  'js/scroll.js',
  'js/satellite.js',
  'js/space-bg.js',
  'js/utils.js',
  'libs/gsap.min.js',
  'libs/ScrollTrigger.min.js',
  'libs/three.min.js',
  'libs/OBJLoader.js',
  'assets/icons/favicon.ico',
  'assets/icons/site.webmanifest',
  'assets/img/og-image.png',
  'assets/img/logo-img.png',
  'assets/img/profile-img.png',
  'assets/Aaron_Dela_Cruz_CV.pdf',
  'assets/satellite/Satellite.obj',
  'assets/satellite/textures/BaseColor.jpg',
  'assets/satellite/textures/Normal.jpg',
  'assets/satellite/textures/Metallic.jpg',
  'scripts/check-static-site.js',
  'scripts/serve-static.js',
  'robots.txt',
  'sitemap.xml',
];

const htmlFiles = [
  'index.html',
  'html/lab-activities.html',
];

const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fail(message) {
  errors.push(message);
}

function isExternal(url) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)
    || /^(?:mailto|tel|data|javascript):/i.test(url);
}

function cleanUrl(url) {
  return url.split('#')[0].split('?')[0].trim();
}

function checkLocalReference(sourceFile, url) {
  const clean = cleanUrl(url);
  if (!clean || clean.startsWith('#') || isExternal(clean)) return;

  const sourceDir = path.dirname(path.join(root, sourceFile));
  const target = clean.startsWith('/')
    ? path.join(root, clean.slice(1))
    : path.resolve(sourceDir, clean);

  if (!target.startsWith(root)) {
    fail(`${sourceFile}: escapes project root: ${url}`);
    return;
  }

  if (!fs.existsSync(target)) {
    fail(`${sourceFile}: missing local reference: ${url}`);
  }
}

for (const file of requiredFiles) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

for (const file of htmlFiles) {
  if (!exists(file)) continue;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const attrPattern = /\s(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attrPattern)) {
    checkLocalReference(file, match[1]);
  }
}

const manifestPath = path.join(root, 'assets/icons/site.webmanifest');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    for (const icon of icons) {
      if (icon && icon.src) {
        checkLocalReference('assets/icons/site.webmanifest', icon.src);
      }
    }
  } catch (error) {
    fail(`Invalid web manifest JSON: ${error.message}`);
  }
}

const indexHtml = exists('index.html')
  ? fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  : '';
const sitemap = exists('sitemap.xml')
  ? fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8')
  : '';
const robots = exists('robots.txt')
  ? fs.readFileSync(path.join(root, 'robots.txt'), 'utf8')
  : '';

if (indexHtml && !indexHtml.includes(siteBase)) {
  fail(`index.html does not include publish URL: ${siteBase}`);
}

if (sitemap && !sitemap.includes(siteBase)) {
  fail(`sitemap.xml does not include publish URL: ${siteBase}`);
}

if (robots && !robots.includes(`${siteBase}sitemap.xml`)) {
  fail(`robots.txt does not point at ${siteBase}sitemap.xml`);
}

if (errors.length) {
  console.error('Static site check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Static site check passed');
