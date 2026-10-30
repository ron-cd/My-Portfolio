#!/usr/bin/env node
/**
 * validate-data.mjs — Sanity-checks the content in js/data/*.js.
 * Run by `npm test`. Catches broken skill-tree links, duplicate ids, bad URLs,
 * and missing local files before they reach the live site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Data files are plain ES modules without imports. Loading them through a data: URL
// works on every Node version and avoids the "typeless package.json" warning.
const load = file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};

const [{ nodes, branches, TREE_SIZE, STATUS_LABEL }, { projects, CATEGORY_LABEL }, achievements, { menuItems, contact }, { WORLD }, { buildGrid, findPath }, { profile }] = await Promise.all([
  load('js/data/certifications.js'),
  load('js/data/projects.js'),
  load('js/data/achievements.js'),
  load('js/data/site.js'),
  load('js/data/world.js'),
  load('js/core/worldmap.js'),
  load('js/data/profile.js'),
]);

const errors = [];
const fail = message => errors.push(message);
const isHttps = url => /^https:\/\//i.test(url);

/* ── Skill tree graph ── */
const ids = new Set();
for (const n of nodes) {
  if (ids.has(n.id)) fail(`certifications: duplicate node id "${n.id}"`);
  ids.add(n.id);
  if (typeof n.x !== 'number' || typeof n.y !== 'number') fail(`certifications: "${n.id}" needs numeric x and y`);
  if (n.x < 0 || n.x > TREE_SIZE.width || n.y < 0 || n.y > TREE_SIZE.height) fail(`certifications: "${n.id}" is outside the ${TREE_SIZE.width}×${TREE_SIZE.height} canvas`);
}
const parents = new Map();
for (const n of nodes) {
  for (const child of n.connections) {
    if (!ids.has(child)) fail(`certifications: "${n.id}" connects to unknown node "${child}"`);
    if (parents.has(child)) fail(`certifications: "${child}" has more than one parent`);
    parents.set(child, n.id);
  }
  if (n.kind === 'cert') {
    if (!STATUS_LABEL[n.status]) fail(`certifications: "${n.id}" has invalid status "${n.status}"`);
    if (!n.title || !n.issuer || !n.description || !n.skills?.length) fail(`certifications: "${n.id}" is missing title, issuer, description, or skills`);
    if (n.url && !isHttps(n.url)) fail(`certifications: "${n.id}" url must be https`);
    if (n.status === 'earned' && !n.title) fail(`certifications: earned node "${n.id}" has no title`);
  }
  if (n.kind !== 'root' && !parents.has(n.id) && !nodes.some(p => p.connections.includes(n.id))) fail(`certifications: "${n.id}" is not connected to the tree`);
}
for (const b of branches) if (!ids.has(b.id)) fail(`certifications: branch "${b.id}" has no node`);

/* ── Projects ── */
const projectIds = new Set();
for (const p of projects) {
  if (projectIds.has(p.id)) fail(`projects: duplicate id "${p.id}"`);
  projectIds.add(p.id);
  if (!CATEGORY_LABEL[p.category]) fail(`projects: "${p.id}" has invalid category "${p.category}"`);
  if (!p.name || !p.summary) fail(`projects: "${p.id}" needs name and summary`);
  for (const key of ['repo', 'demo']) if (p.links?.[key] && !isHttps(p.links[key])) fail(`projects: "${p.id}" ${key} link must be https`);
  for (const shot of p.screenshots || []) {
    if (!fs.existsSync(path.join(root, shot.src))) fail(`projects: "${p.id}" screenshot missing: ${shot.src}`);
  }
  for (const item of p.items || []) {
    if (!/^https?:/i.test(item.href) && !fs.existsSync(path.join(root, item.href))) fail(`projects: "${p.id}" item missing file: ${item.href}`);
  }
}
if (projects.filter(p => p.featured).length > 1) fail('projects: more than one featured project');

/* ── Achievements ── */
const groupIds = new Set(achievements.GROUPS.map(g => g.id));
const achievementIds = new Set();
for (const a of achievements.manual) {
  if (achievementIds.has(a.id)) fail(`achievements: duplicate id "${a.id}"`);
  achievementIds.add(a.id);
  if (!groupIds.has(a.group)) fail(`achievements: "${a.id}" has unknown group "${a.group}"`);
  if (a.count !== undefined && !(Number.isInteger(a.count) && a.count >= 2)) fail(`achievements: "${a.id}" count must be a whole number of 2 or more`);
}

/* ── Menu and contact ── */
const routes = new Set(['profile', 'skills', 'quests', 'achievements', 'contact', 'world']);
for (const item of menuItems) if (!routes.has(item.id)) fail(`site: menu item "${item.id}" is not a known screen`);
if (contact.resume && !fs.existsSync(path.join(root, contact.resume.href))) fail(`site: resume file missing: ${contact.resume.href}`);
for (const link of contact.links) if (!isHttps(link.href)) fail(`site: contact link "${link.id}" must be https`);

/* ── Profile equipment screen ── */
const abilityTags = new Set(profile.abilities.flatMap(g => g.tags));
const SPRITE_NAMES = new Set(['sparkle', 'chip', 'book', 'shield', 'gear', 'chart', 'flask', 'globe', 'phone', 'star', 'tree', 'scroll', 'crown', 'trophy', 'medal']);
for (const side of ['left', 'right']) {
  const group = profile.gear?.[side];
  if (!group || !group.title || !Array.isArray(group.slots) || !group.slots.length) { fail(`profile: gear.${side} needs a title and slots`); continue; }
  for (const slot of group.slots) {
    if (!slot.slot) fail(`profile: a ${side} gear slot has no label`);
    if (!SPRITE_NAMES.has(slot.icon)) fail(`profile: gear slot "${slot.slot}" uses unknown icon "${slot.icon}"`);
    if (!slot.items?.length) fail(`profile: gear slot "${slot.slot}" is empty`);
    for (const item of slot.items || []) {
      if (!abilityTags.has(item.name)) fail(`profile: gear item "${item.name}" is not listed in abilities (only real skills belong here)`);
    }
  }
}

/* ── Village (WALK AROUND) ── */
const worldGrid = buildGrid(WORLD);
const sceneRoutes = new Set(['profile', 'skills', 'quests', 'achievements', 'contact']);
const [startX, startY] = WORLD.start;
if (worldGrid.isBlocked(startX, startY)) fail('world: the start tile is blocked');
for (const b of WORLD.buildings) {
  if (!sceneRoutes.has(b.route)) fail(`world: building "${b.id}" opens unknown screen "${b.route}"`);
  if (!menuItems.some(m => m.id === b.id)) fail(`world: building "${b.id}" has no matching menu item for its name`);
  if (b.door[0] < b.x || b.door[0] >= b.x + b.w || b.door[1] !== b.y + b.h) fail(`world: the door of "${b.id}" is not directly below the building`);
  if (!findPath(worldGrid, WORLD.start, b.door)) fail(`world: the door of "${b.id}" cannot be reached from the start tile`);
}
for (const item of menuItems) {
  if (sceneRoutes.has(item.id) && !WORLD.buildings.some(b => b.id === item.id)) fail(`world: menu screen "${item.id}" has no building in the village`);
}

if (errors.length) {
  console.error('Data validation failed:');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log(`Data validation passed (${nodes.filter(n => n.kind === 'cert').length} certifications, ${projects.length} projects)`);
