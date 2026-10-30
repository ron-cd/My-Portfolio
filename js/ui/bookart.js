/**
 * bookart.js — Generates the pixel illustration for a quest's page in the QUEST LOG book.
 *
 * It is drawn in code (no image files): a parchment panel with a crescent moon,
 * sparkles, distant hills, and the quest's icon as a large silhouette. The
 * sparkle positions come from the quest id, so every quest looks a little different
 * but always the same between visits. Real screenshots, when a project has them,
 * replace this art (see quests.js).
 */

import { svg } from '../core/dom.js';
import { SPRITES } from '../core/sprites.js';

const W = 96;
const H = 40;
const TONE = { bg: '#ecdab4', mid: '#dcc08e', dark: '#c49f6b' };

function hash(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

class Paint {
  constructor() { this.paths = new Map(); }
  rect(x, y, w, h, colour) {
    if (!this.paths.has(colour)) this.paths.set(colour, []);
    this.paths.get(colour).push(`M${x} ${y}h${w}v${h}h-${w}z`);
  }
}

export function questArt(project) {
  const paint = new Paint();
  let seed = hash(project.id || project.name);
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  paint.rect(0, 0, W, H, TONE.bg);

  // Dithered top and bottom edges
  for (let x = 0; x < W; x += 2) { paint.rect(x, 0, 1, 1, TONE.mid); paint.rect(x + 1, H - 1, 1, 1, TONE.mid); }

  // Crescent moon
  const [mx, my] = [16 + Math.floor(rand() * 8), 12 + Math.floor(rand() * 4)];
  for (let dy = -7; dy <= 7; dy += 1) {
    for (let dx = -7; dx <= 7; dx += 1) {
      const inMoon = dx * dx + dy * dy <= 49;
      const bite = (dx - 3) * (dx - 3) + (dy + 2) * (dy + 2) <= 40;
      if (inMoon && !bite) paint.rect(mx + dx, my + dy, 1, 1, TONE.mid);
    }
  }

  // Sparkles (plus shapes) on both sides of the silhouette
  const sparkle = (x, y) => {
    paint.rect(x, y - 2, 1, 5, TONE.mid);
    paint.rect(x - 2, y, 5, 1, TONE.mid);
    paint.rect(x, y, 1, 1, TONE.bg);
  };
  for (let i = 0; i < 4; i += 1) {
    const left = i % 2 === 0;
    sparkle((left ? 6 : 72) + Math.floor(rand() * 18), 5 + Math.floor(rand() * 20));
  }

  // Distant hills
  let height = 6;
  for (let x = 0; x < W; x += 1) {
    height = Math.max(3, Math.min(9, height + (rand() < 0.2 ? (rand() < 0.5 ? -1 : 1) : 0)));
    paint.rect(x, H - height, 1, height, TONE.mid);
  }
  for (let x = 0; x < W; x += 2) paint.rect(x, H - 2, 1, 2, TONE.dark);

  // The quest icon as a big two-tone silhouette (outline darker than fill), centred
  const rows = SPRITES[project.icon] || SPRITES.scroll;
  const cols = Math.max(...rows.map(r => r.length));
  const scale = 4;
  const ox = Math.round((W - cols * scale) / 2);
  const oy = 4;
  rows.forEach((raw, y) => {
    const pad = Math.floor((cols - raw.length) / 2);
    [...raw].forEach((ch, i) => {
      if (ch !== '.') paint.rect(ox + (pad + i) * scale, oy + y * scale, scale, scale, ch === 'k' ? TONE.dark : TONE.mid);
    });
  });

  const el = svg('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'book-art-svg',
    'shape-rendering': 'crispEdges',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  for (const [colour, segments] of paint.paths) el.append(svg('path', { d: segments.join(''), fill: colour }));
  return el;
}
