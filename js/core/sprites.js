/**
 * sprites.js — Tiny pixel-art engine.
 *
 * Sprites are written as rows of palette characters ('.' = transparent).
 * Rows shorter than the widest row are centered. Each sprite renders to one
 * inline SVG (one <path> per colour) with crisp edges, so it stays sharp at any
 * integer scale and needs no image files.
 */

import { svg } from './dom.js';

export const PALETTE = {
  k: '#0a0e1a', // outline ink
  w: '#efe6cf', // cream
  W: '#aeb8c9', // pale gray
  g: '#e8b84a', // gold
  G: '#a8762a', // gold shade
  y: '#f6d77a', // gold light
  t: '#2bb5a0', // teal
  T: '#1d7f73', // teal dark
  f: '#3aa05a', // forest green
  F: '#1f6b3a', // forest dark
  r: '#d9534f', // red
  o: '#e07b39', // orange
  n: '#26385e', // navy
  N: '#16213a', // navy dark
  b: '#7aa7d9', // light blue
  B: '#4a76b0', // mid blue
  s: '#e0ac82', // skin
  S: '#b98062', // skin shade
  h: '#1b1b2f', // hair
  H: '#3a3a62', // hair light
  m: '#8a4f46', // mouth
  e: '#0a0e1a', // eye
  p: '#8a6a4a', // wood
  P: '#5e452f', // wood dark
  d: '#4d5a7a', // slate
};

export const SPRITES = {
  /* ── Menu / UI icons (8×8) ─────────────────────────────── */
  user: [
    '..kkkk..',
    '.kttttk.',
    '.kttttk.',
    '..kkkk..',
    '.kkkkkk.',
    'kttttttk',
    'kttttttk',
    'kkkkkkkk',
  ],
  tree: [
    '...kk...',
    '..kffk..',
    '.kffffk.',
    'kffffffk',
    '.kffffk.',
    'kffffffk',
    '..kppk..',
    '..kPPk..',
  ],
  scroll: [
    '.kkkkkk.',
    'kwwwwwwk',
    'kwkkkwwk',
    'kwwwwwwk',
    'kwkkkkwk',
    'kwwwwwwk',
    'kwkkwwwk',
    '.kkkkkk.',
  ],
  trophy: [
    'kggggggk',
    'kgyyggGk',
    'kgyyggGk',
    '.kgggGk.',
    '..kggk..',
    '...kk...',
    '..kGGk..',
    '.kkkkkk.',
  ],
  envelope: [
    'kkkkkkkk',
    'kwkkkkwk',
    'kwwkkwwk',
    'kwkwwkwk',
    'kwwwwwwk',
    'kwwwwwwk',
    'kkkkkkkk',
    '........',
  ],
  phone: [
    '.kkkkkk.',
    '.kbbbbk.',
    '.kbBBbk.',
    '.kbbbbk.',
    '.kbbbbk.',
    '.kbbbbk.',
    '.kkttkk.',
    '.kkkkkk.',
  ],
  globe: [
    '..kkkk..',
    '.kbbtbk.',
    'kbttbbtk',
    'kbtbbtbk',
    'kbbbttbk',
    'kbtbbbbk',
    '.kbbbbk.',
    '..kkkk..',
  ],
  chip: [
    '.k.k.k..',
    'kkkkkkkk',
    'kTttttTk',
    'kttkktTk',
    'kttkkttk',
    'kTttttTk',
    'kkkkkkkk',
    '.k.k.k..',
  ],
  chart: [
    'k.......',
    'k.....gg',
    'k.....gg',
    'k..tt.gg',
    'k..tt.gg',
    'ktttt.gg',
    'kkkkkkkk',
    '........',
  ],
  gear: [
    '..k..k..',
    '.kTkkTk.',
    'kkttttkk',
    '.ktkktk.',
    '.ktkktk.',
    'kkttttkk',
    '.kTkkTk.',
    '..k..k..',
  ],
  book: [
    '.kkkkkk.',
    'kBBBBBBk',
    'kBwwwwBk',
    'kBwkkwBk',
    'kBwwwwBk',
    'kBBBBBBk',
    'kwwwwwwk',
    '.kkkkkk.',
  ],
  star: [
    '...kk...',
    '...kyk..',
    'kkkkyykk',
    'kyyyyyyk',
    '.kyyyyk.',
    '.kyykyyk',
    'kyk..kyk',
    'kk....kk',
  ],
  medal: [
    '.kbkkbk.',
    '.kbkkbk.',
    '..kbbk..',
    '.kkggkk.',
    'kgyyggGk',
    'kgyggGGk',
    '.kgGGGk.',
    '..kkkk..',
  ],
  crown: [
    '........',
    'k..k..k.',
    'kk.kk.kk',
    'kgkgygkg',
    'kgggggGk',
    'kgygggGk',
    'kGGGGGGk',
    '.kkkkkk.',
  ],
  flag: [
    'kkkkkk..',
    'kttttttk',
    'kttttTk.',
    'ktttTk..',
    'kttk....',
    'kk......',
    'k.......',
    'k.......',
  ],
  shield: [
    'kkkkkkkk',
    'kbbbBBbk',
    'kbbbBBbk',
    'kbbbBBbk',
    '.kbbBBk.',
    '..kbBk..',
    '...kk...',
    '........',
  ],
  heart: [
    '.kk..kk.',
    'krrkkrrk',
    'krwrrrrk',
    'krrrrrrk',
    '.krrrrk.',
    '..krrk..',
    '...kk...',
    '........',
  ],

  /* ── Selection arrow (7×9) ─────────────────────────────── */
  cursor: [
    'k......',
    'kk.....',
    'kgk....',
    'kggk...',
    'kgggk..',
    'kggk...',
    'kgk....',
    'kk.....',
    'k......',
  ],
  sparkle: [
    '..y..',
    '..y..',
    'yywyy',
    '..y..',
    '..y..',
  ],

  check: [
    '........',
    '......kk',
    '.....kfk',
    'k...kffk',
    'kk.kffk.',
    'kfkffk..',
    '.kffk...',
    '..kk....',
  ],

  hourglass: [
    'kkkkkkkk',
    '.kwwwwk.',
    '..kggk..',
    '...kk...',
    '...kk...',
    '..kggk..',
    '.kggggk.',
    'kkkkkkkk',
  ],
  flask: [
    '..kkkk..',
    '...kk...',
    '...kk...',
    '..kttk..',
    '.kttttk.',
    'kttwttTk',
    'kttttTTk',
    '.kkkkkk.',
  ],

  /* ── Companion cat (8×8), eyes open / shut ─────────────── */
  cat1: [
    'k....k',
    'kooooook',
    'koeooeok',
    'kooppook',
    '.kooook.',
    'koowwook',
    'kooooook',
    'kkk..kkk',
  ],
  cat2: [
    'k....k',
    'kooooook',
    'kookkook',
    'kooppook',
    '.kooook.',
    'koowwook',
    'kooooook',
    'kkk..kkk',
  ],

  /* ── Character portrait (16×16) ────────────────────────── */
  portrait: [
    '................',
    'kkkkkk',
    'khhhhhhk',
    'khhhhhhhhk',
    'khhHHhhhhhhk',
    'khhhhhhhhhhk',
    'khhsssssshhk',
    'khsssssssshk',
    'kssessssessk',
    'kssssssssssk',
    'kssssmmssssk',
    'kksssssssskk',
    'kSssssSk',
    'kknnnbttbnnnkk',
    'knnnnnbttbnnnnnk',
    'knnnnnnttnnnnnnk',
  ],

  /* ── Character, full body (10×16), two idle frames ─────── */
  hero1: [
    '..kkkkkk..',
    '.khhhhhhk.',
    '.khhhhhhk.',
    '.khssssHk.',
    '.ksessesk.',
    '.kssssssk.',
    '..kssssk..',
    '..kkbbkk..',
    '.knnbtnnk.',
    'knnnbtnnnk',
    'ksnnbtnnsk',
    'ksnnnnnnsk',
    '.kNNNNNNk.',
    '..kNNkNNk.',
    '..kNNkNNk.',
    '.kkookkook',
  ],
  hero2: [
    '..kkkkkk..',
    '.khhhhhhk.',
    '.khhhhhhk.',
    '.khssssHk.',
    '.ksessesk.',
    '.kssssssk.',
    '..kssssk..',
    '..kkbbkk..',
    '.knnbtnnk.',
    'knnnbtnnnk',
    'ksnnbtnnsk',
    'ksnnnnnnsk',
    '.kNNNNNNk.',
    '..kNNkNNk.',
    '..kNNkNNk.',
    '..kookkoo.',
  ],
};

/* Same portrait with the eyes closed, for the occasional blink. */
SPRITES.portraitBlink = SPRITES.portrait.map((row, i) => (i === 8 ? 'kssssssssssk' : row));

/* ── Rendering ─────────────────────────────────────────── */

const cache = new Map();

function parse(rows) {
  const width = Math.max(...rows.map(r => r.length));
  const height = rows.length;
  const byColour = new Map();
  rows.forEach((raw, y) => {
    const pad = Math.floor((width - raw.length) / 2);
    const row = '.'.repeat(pad) + raw + '.'.repeat(width - raw.length - pad);
    let x = 0;
    while (x < width) {
      const ch = row[x];
      if (ch === '.') { x += 1; continue; }
      let run = 1;
      while (x + run < width && row[x + run] === ch) run += 1;
      if (!byColour.has(ch)) byColour.set(ch, []);
      byColour.get(ch).push(`M${x} ${y}h${run}v1h-${run}z`);
      x += run;
    }
  });
  return { width, height, byColour };
}

function getParsed(name) {
  if (!cache.has(name)) {
    const rows = SPRITES[name];
    if (!rows) throw new Error(`Unknown sprite: ${name}`);
    cache.set(name, parse(rows));
  }
  return cache.get(name);
}

/**
 * Create an inline SVG for a sprite.
 * @param {string} name   key in SPRITES
 * @param {object} opts   { label?: string (alt text; omit for decorative), className?: string }
 */
export function sprite(name, { label, className = '' } = {}) {
  const { width, height, byColour } = getParsed(name);
  const el = svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: `sprite sprite-${name} ${className}`.trim(),
    'shape-rendering': 'crispEdges',
    focusable: 'false',
    ...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }),
  });
  for (const [ch, segments] of byColour) {
    el.append(svg('path', { d: segments.join(''), fill: PALETTE[ch] || '#f0f' }));
  }
  return el;
}

/** Path data grouped by colour, for use inside a bigger generated SVG (scene.js). */
export function spritePaths(name, dx = 0, dy = 0) {
  const { byColour } = getParsed(name);
  return [...byColour].map(([ch, segments]) => {
    const p = svg('path', { d: segments.join(''), fill: PALETTE[ch] || '#f0f' });
    if (dx || dy) p.setAttribute('transform', `translate(${dx} ${dy})`);
    return p;
  });
}

/** Sprite dimensions, useful for layout math. */
export function spriteSize(name) {
  const { width, height } = getParsed(name);
  return { width, height };
}
