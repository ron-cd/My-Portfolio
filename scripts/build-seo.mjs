#!/usr/bin/env node
/**
 * build-seo.mjs — Regenerates the parts of index.html that search engines and
 * no-JavaScript visitors see, straight from js/data/*.js:
 *
 *   • the JSON-LD (schema.org ProfilePage + Person) block
 *   • the static fallback content inside <main id="screen">
 *
 * Usage:
 *   node scripts/build-seo.mjs          rewrite index.html
 *   node scripts/build-seo.mjs --check  fail if index.html is out of date (used by npm test)
 *
 * Only data that already exists in the data files is emitted. Nothing is invented.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};

const [{ profile }, { site, contact }, { nodes }, { projects, CATEGORY_LABEL }, { manual }] = await Promise.all([
  load('js/data/profile.js'),
  load('js/data/site.js'),
  load('js/data/certifications.js'),
  load('js/data/projects.js'),
  load('js/data/achievements.js'),
]);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const earned = nodes.filter(n => n.kind === 'cert' && n.status === 'earned');
const github = contact.links.find(l => l.id === 'github');
const linkedin = contact.links.find(l => l.id === 'linkedin');

/* ── JSON-LD ── */
const school = profile.education[0];
const person = {
  '@type': 'Person',
  '@id': `${site.url}#person`,
  name: profile.fullName,
  alternateName: profile.nickname,
  jobTitle: profile.title,
  description: profile.intro[0],
  url: site.url,
  email: `mailto:${contact.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Pampanga', addressCountry: 'PH' },
  affiliation: { '@type': 'CollegeOrUniversity', name: school.school },
  sameAs: contact.links.map(l => l.href),
  knowsAbout: profile.abilities.flatMap(g => g.tags),
  hasCredential: earned.map(c => ({
    '@type': 'EducationalOccupationalCredential',
    name: c.title,
    ...(c.url ? { url: c.url } : {}),
    recognizedBy: { '@type': 'Organization', name: c.issuer },
  })),
};
const jsonld = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  name: `${site.title} | ${profile.shortName} — Developer Portfolio`,
  url: site.url,
  mainEntity: person,
};
const jsonBlock = `<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2).replace(/</g, '\\u003c')}\n  </script>`;

/* ── No-JS fallback ── */
const li = (text, href) => `<li>${href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text)}</li>`;
const fallback = [
  '<div class="static-fallback">',
  `  <h1>${esc(profile.fullName)}</h1>`,
  `  <p>${esc(profile.title)} · ${esc(school.school)} · ${esc(profile.location)}</p>`,
  `  <p>${esc(site.title)} is an interactive, game-style portfolio. It needs JavaScript. Here is everything it contains, as plain text:</p>`,
  '  <ul>',
  `    ${li(contact.email, `mailto:${contact.email}`)}`,
  `    ${li(`GitHub: ${github.value}`, github.href)}`,
  `    ${li('LinkedIn', linkedin.href)}`,
  `    ${li('Download CV (PDF)', contact.resume.href)}`,
  '  </ul>',
  '  <h2>About</h2>',
  ...profile.intro.map(t => `  <p>${esc(t)}</p>`),
  '  <h2>Education</h2>',
  '  <ul>',
  ...profile.education.map(e => `    <li>${esc(e.program)}, ${esc(e.school)} (${esc(e.years)}). ${esc(e.detail)}</li>`),
  '  </ul>',
  '  <h2>Skills</h2>',
  '  <ul>',
  ...profile.abilities.map(g => `    <li>${esc(g.group)}: ${esc(g.tags.join(', '))}</li>`),
  '  </ul>',
  '  <h2>Projects</h2>',
  '  <ul>',
  ...projects.map(p => {
    const links = [p.links?.repo && `<a href="${esc(p.links.repo)}">source</a>`, p.links?.demo && `<a href="${esc(p.links.demo)}">live demo</a>`].filter(Boolean);
    return `    <li><strong>${esc(p.name)}</strong> (${esc(CATEGORY_LABEL[p.category].toLowerCase())}): ${esc(p.summary)} Tech: ${esc(p.tech.join(', '))}.${links.length ? ` ${links.join(' · ')}` : ''}</li>`;
  }),
  '  </ul>',
  '  <h2>Certifications</h2>',
  '  <ul>',
  ...earned.map(c => `    ${li(`${c.title} (${c.issuer}${c.date ? `, ${c.date}` : ''})`, c.url)}`),
  '  </ul>',
  '  <h2>Leadership and recognition</h2>',
  '  <ul>',
  ...manual.map(a => `    <li>${esc(a.name)}${a.date ? ` (${esc(a.date)})` : ''}: ${esc(a.description)}</li>`),
  '  </ul>',
  '</div>',
].join('\n');

/* ── Splice into index.html between markers ── */
const file = path.join(root, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const splice = (source, name, body, indent) => {
  const re = new RegExp(`(<!-- seo:${name}:start[^>]*-->)[\\s\\S]*?(<!-- seo:${name}:end -->)`);
  if (!re.test(source)) throw new Error(`index.html is missing the "seo:${name}" markers`);
  const pad = body.split('\n').map(line => (line ? indent + line : line)).join('\n');
  return source.replace(re, (_, a, b) => `${a}\n${pad}\n${indent}${b}`);
};
let next = splice(html, 'jsonld', jsonBlock, '  ');
next = splice(next, 'fallback', fallback, '      ');

if (process.argv.includes('--check')) {
  if (next !== html) {
    console.error('index.html SEO block / no-JS fallback is out of date. Run: node scripts/build-seo.mjs');
    process.exit(1);
  }
  console.log('SEO block and no-JS fallback are up to date');
} else {
  fs.writeFileSync(file, next);
  console.log(next === html ? 'index.html already up to date' : 'index.html updated');
}
