/**
 * badge.js — Draws achievement badges as pixel art (no image files).
 *
 * A badge is a 32 × 32 pixel grid: a metal bezel, a coloured bevelled face, and
 * the icon as a cream silhouette with ink details. The silhouette shape and face
 * colour come from the achievement's group, never from a "rank": a Dean's List
 * badge is not worth more than a certification, they are just different families.
 * Locked badges (things still in progress) use a dim grey face.
 */

import { svg } from '../core/dom.js';
import { SPRITES, PALETTE } from '../core/sprites.js';

const N = 32;

export const GROUP_STYLE = {
  academic: { shape: 'shield', face: '#e0a23a', light: '#f6d28a', dark: '#9a6418' },
  leadership: { shape: 'pentagon', face: '#9a5bd0', light: '#c79bee', dark: '#5f2d8e' },
  competition: { shape: 'diamond', face: '#d9534f', light: '#f08a86', dark: '#8e2623' },
  certification: { shape: 'hexagon', face: '#4a86d0', light: '#8fbcf0', dark: '#27508a' },
  project: { shape: 'circle', face: '#3aa05a', light: '#7fd495', dark: '#1d6a38' },
};
const LOCKED = { face: '#3b4560', light: '#566282', dark: '#252c42' };
const METAL = { light: '#eef2fa', mid: '#aeb8c9', dark: '#6b7692' };
const INK = '#0a0e1a';
const CREAM = '#fff4d6';

const POLYGONS = {
  shield: [[3, 2], [29, 2], [29, 16], [24, 24], [16, 30.5], [8, 24], [3, 16]],
  pentagon: [[16, 1.5], [30.5, 12], [25, 29.5], [7, 29.5], [1.5, 12]],
  hexagon: [[16, 1], [30, 8.5], [30, 23.5], [16, 31], [2, 23.5], [2, 8.5]],
  diamond: [[16, 0.5], [31.5, 16], [16, 31.5], [0.5, 16]],
};

function insidePolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function scaled(pts, k) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
}

/** Returns (x, y) => boolean for a shape at pixel centres. */
function mask(shape, inner) {
  if (shape === 'circle') {
    const r = inner ? 11.6 : 15.6;
    return (x, y) => (x + 0.5 - 16) ** 2 + (y + 0.5 - 16) ** 2 <= r * r;
  }
  const pts = inner ? scaled(POLYGONS[shape], 0.74) : POLYGONS[shape];
  return (x, y) => insidePolygon(x + 0.5, y + 0.5, pts);
}

/** Sprite colour → one of three icon tones, by brightness, so icon details survive on any face. */
function lightness(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
function toneFor(ch, locked) {
  const l = lightness(PALETTE[ch] || '#ffffff');
  if (locked) return l < 0.3 ? '#252c42' : l < 0.55 ? '#6a7594' : '#8f9ab8';
  if (l < 0.3) return INK;
  if (l < 0.6) return '#b3a171';
  return CREAM;
}

const cache = new Map();
let uid = 0;

function build(shape, palette, iconName, locked) {
  const outer = mask(shape, false);
  const inner = mask(shape, true);
  const paths = new Map();
  const add = (colour, x, y, w = 1, h = 1) => {
    if (!paths.has(colour)) paths.set(colour, []);
    paths.get(colour).push(`M${x} ${y}h${w}v${h}h-${w}z`);
  };
  const clip = [];

  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      if (!outer(x, y)) continue;
      clip.push(`M${x} ${y}h1v1h-1z`);
      const rim = !outer(x - 1, y) || !outer(x + 1, y) || !outer(x, y - 1) || !outer(x, y + 1);
      if (rim) { add(INK, x, y); continue; }
      if (inner(x, y)) {
        const lit = !inner(x - 1, y) || !inner(x, y - 1);
        const shade = !inner(x + 1, y) || !inner(x, y + 1);
        let colour = palette.face;
        if (lit) colour = palette.light;
        else if (shade) colour = palette.dark;
        else if (!locked && y < 13 && x + y < 24 && (x + y) % 2 === 0) colour = palette.light; // dithered gloss
        add(colour, x, y);
      } else {
        const tilt = (x - 16) + (y - 16);
        add(tilt < -6 ? METAL.light : tilt > 6 ? METAL.dark : METAL.mid, x, y);
      }
    }
  }

  // Icon: 2× scale, cream silhouette with ink details (dim when locked).
  const rows = SPRITES[iconName] || SPRITES.medal;
  const cols = Math.max(...rows.map(r => r.length));
  const ox = Math.round((N - cols * 2) / 2);
  const oy = Math.round((N - rows.length * 2) / 2) - (shape === 'shield' ? 1 : 0);
  rows.forEach((raw, ry) => {
    const pad = Math.floor((cols - raw.length) / 2);
    [...raw].forEach((ch, i) => {
      if (ch === '.') return;
      add(toneFor(ch, locked), ox + (pad + i) * 2, oy + ry * 2, 2, 2);
    });
  });

  return { paths, clip: clip.join('') };
}

/**
 * @param {object} o  { group, icon, locked?, label? }
 * @returns {SVGElement}
 */
export function badgeSvg({ group, icon, locked = false, label }) {
  const style = GROUP_STYLE[group] || GROUP_STYLE.project;
  const key = `${style.shape}|${group}|${icon}|${locked}`;
  if (!cache.has(key)) cache.set(key, build(style.shape, locked ? LOCKED : style, icon, locked));
  const { paths, clip } = cache.get(key);

  const id = `badge-clip-${uid += 1}`;
  const el = svg('svg', {
    viewBox: `0 0 ${N} ${N}`,
    class: `badge-svg${locked ? ' is-locked' : ''}`,
    'shape-rendering': 'crispEdges',
    focusable: 'false',
    ...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }),
  });
  el.append(svg('defs', {}, svg('clipPath', { id }, svg('path', { d: clip }))));
  for (const [colour, segments] of paths) el.append(svg('path', { d: segments.join(''), fill: colour }));
  if (!locked) {
    el.append(svg('g', { 'clip-path': `url(#${id})` },
      svg('g', { transform: 'rotate(20 16 16)' }, svg('rect', { class: 'badge-shine', x: -12, y: -6, width: 5, height: 44, fill: '#ffffff' }))));
  }
  return el;
}
