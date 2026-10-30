/**
 * scene.js — Generates the pixel-art scene used behind every screen.
 *
 * Everything is drawn procedurally into one SVG on a 192 × 108 pixel grid, so it
 * needs no image files and always stays crisp. A seeded random generator keeps
 * the scene identical on every load. The "sky" option (dawn / day / dusk /
 * night) swaps the palette, celestial body, stars, clouds and lit windows.
 */

import { svg } from './dom.js';
import { spritePaths, spriteSize } from './sprites.js';

export const GRID = { width: 192, height: 108 };

/** Per-period palettes. Night is the "home" look. */
const SKIES = {
  night: {
    bands: ['#04061a', '#070b24', '#0a1030', '#0e173d', '#132049', '#1a2b57', '#223763', '#2d4670'],
    stars: 80, starLight: true, body: 'moon', bodyAt: [152, 22],
    skyline: '#101a38', windows: 0.82, clouds: false, shooting: true,
    hillFar: '#14354a', hillMid: '#14473f', ground: '#0d2b26', grass: '#2f8f5b', grassLight: '#3aa05a',
  },
  dawn: {
    bands: ['#1a1740', '#2d2358', '#4a2f6b', '#7a3f7a', '#b0527a', '#df7a7a', '#f2a381', '#f7c98d'],
    stars: 26, starLight: false, body: 'sun', bodyAt: [46, 66],
    skyline: '#2a2450', windows: 0.9, clouds: false, shooting: false,
    hillFar: '#3a3a63', hillMid: '#2c5a4a', ground: '#16433a', grass: '#3d9a63', grassLight: '#52b374',
  },
  day: {
    bands: ['#2b64b0', '#3a75c0', '#4b87cf', '#5e99dc', '#73abe6', '#8bbdee', '#a4cdf3', '#bddbf6'],
    stars: 0, starLight: false, body: 'sun', bodyAt: [152, 22],
    skyline: '#46688f', windows: 1.01, clouds: true, shooting: false,
    hillFar: '#4a8a98', hillMid: '#2f8a4f', ground: '#1f6b3a', grass: '#5bc06a', grassLight: '#7ad384',
  },
  dusk: {
    bands: ['#10163a', '#252a5e', '#43366f', '#6f4577', '#a2527a', '#d56a6c', '#ee8f63', '#f6b866'],
    stars: 34, starLight: false, body: 'sun', bodyAt: [150, 68],
    skyline: '#241f48', windows: 0.8, clouds: false, shooting: true,
    hillFar: '#3a3a63', hillMid: '#2c5a4a', ground: '#16433a', grass: '#3d9a63', grassLight: '#52b374',
  },
};

const C = {
  moon: '#efe6cf', moonShade: '#cfc5a8', crater: '#b4ab90',
  sun: '#fbe08a', sunCore: '#fff3c4', sunEdge: '#f2b84b',
  window: '#f6d77a',
  trunk: '#5e452f', pineDark: '#14402c', pineLight: '#1f6b3a',
  frame: '#4d5a7a', body: '#26385e', bodyDark: '#16213a', screen: '#0c2a2e',
  teal: '#2bb5a0', ink: '#0a0e1a', red: '#d9534f', gold: '#e8b84a',
  star: '#efe6cf', starDim: '#8f9bb8', cloud: '#f4f8fc', cloudShade: '#cfe0f0',
};

/** Small deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Collects rectangles by colour and emits one <path> per colour. */
export class Layer {
  constructor() { this.byColour = new Map(); }
  rect(x, y, w, h, colour) {
    if (w <= 0 || h <= 0) return;
    if (!this.byColour.has(colour)) this.byColour.set(colour, []);
    this.byColour.get(colour).push(`M${x} ${y}h${w}v${h}h-${w}z`);
  }
  px(x, y, colour) { this.rect(x, y, 1, 1, colour); }
  toGroup(className) {
    const g = svg('g', className ? { class: className } : {});
    for (const [colour, segments] of this.byColour) {
      g.append(svg('path', { d: segments.join(''), fill: colour }));
    }
    return g;
  }
}

export function buildScene({ seed = 7, sky: period = 'night' } = {}) {
  const S = SKIES[period] || SKIES.night;
  const rand = rng(seed);
  const root = svg('svg', {
    class: `scene scene-${period}`,
    viewBox: `0 0 ${GRID.width} ${GRID.height}`,
    preserveAspectRatio: 'xMidYMax slice',
    'shape-rendering': 'crispEdges',
    'aria-hidden': 'true',
    focusable: 'false',
  });

  /* ── Sky: banded gradient with a dithered seam between bands ── */
  const sky = new Layer();
  const bandH = 11;
  S.bands.forEach((colour, i) => {
    sky.rect(0, i * bandH, GRID.width, bandH + 1, colour);
    if (i > 0) {
      const above = S.bands[i - 1];
      for (let x = 0; x < GRID.width; x += 2) sky.px(x + (i % 2), i * bandH - 1, above);
      for (let x = 0; x < GRID.width; x += 2) sky.px(x + ((i + 1) % 2), i * bandH, above);
    }
  });
  root.append(sky.toGroup('scene-sky'));

  /* ── Stars (static + twinkling) ── */
  if (S.stars > 0) {
    const stars = new Layer();
    for (let i = 0; i < S.stars; i += 1) {
      stars.px(Math.floor(rand() * GRID.width), Math.floor(rand() * (S.starLight ? 58 : 36)), rand() > 0.55 ? C.star : C.starDim);
    }
    root.append(stars.toGroup('scene-stars'));

    const twinkles = svg('g', { class: 'scene-twinkles' });
    const count = S.starLight ? 18 : 6;
    for (let i = 0; i < count; i += 1) {
      twinkles.append(svg('rect', {
        x: Math.floor(rand() * GRID.width), y: Math.floor(rand() * (S.starLight ? 52 : 30)),
        width: 1, height: 1, fill: C.star, class: 'twinkle',
        style: `animation-delay:${(rand() * 3).toFixed(2)}s;animation-duration:${(2 + rand() * 2).toFixed(2)}s`,
      }));
    }
    if (S.starLight) {
      for (const [x, y] of [[26, 16], [96, 8], [172, 44], [58, 36]]) {
        const star = new Layer();
        star.rect(x, y - 2, 1, 5, C.star);
        star.rect(x - 2, y, 5, 1, C.star);
        const g = star.toGroup('twinkle twinkle-big');
        g.style.animationDelay = `${(rand() * 2).toFixed(2)}s`;
        twinkles.append(g);
      }
    }
    root.append(twinkles);
  }

  /* ── Shooting star (rare, night and dusk only) ── */
  if (S.shooting) {
    const trail = new Layer();
    trail.rect(0, 0, 4, 1, C.star);
    trail.rect(-3, -1, 3, 1, C.starDim);
    trail.rect(-6, -2, 3, 1, '#4d5a7a');
    const g = trail.toGroup('shooting-star');
    g.style.transform = 'translate(150px, 6px)';
    const mover = svg('g', { class: 'shooting-star-mover' }, g);
    root.append(mover);
  }

  /* ── Moon or sun ── */
  const [bx, by] = S.bodyAt;
  const body = new Layer();
  if (S.body === 'moon') {
    const mr = 8;
    for (let dy = -mr; dy <= mr; dy += 1) {
      for (let dx = -mr; dx <= mr; dx += 1) {
        if (dx * dx + dy * dy <= mr * mr + 1) body.px(bx + dx, by + dy, dx + dy > 6 ? C.moonShade : C.moon);
      }
    }
    body.rect(bx - 4, by - 3, 3, 2, C.crater);
    body.rect(bx + 2, by + 1, 3, 3, C.crater);
    body.px(bx - 2, by + 4, C.crater);
  } else {
    const sr = period === 'day' ? 7 : 8;
    for (let dy = -sr; dy <= sr; dy += 1) {
      for (let dx = -sr; dx <= sr; dx += 1) {
        const d = dx * dx + dy * dy;
        if (d <= sr * sr + 1) body.px(bx + dx, by + dy, d > (sr - 2) * (sr - 2) ? C.sunEdge : d < 10 ? C.sunCore : C.sun);
      }
    }
    // Pixel rays
    if (period === 'day') {
      for (const [dx, dy] of [[0, -11], [0, 11], [-11, 0], [11, 0], [-8, -8], [8, 8], [-8, 8], [8, -8]]) body.rect(bx + dx, by + dy, 2, 2, C.sun);
    }
  }
  root.append(body.toGroup('scene-body'));

  /* ── Clouds (day) ── */
  if (S.clouds) {
    const clouds = svg('g', { class: 'scene-clouds' });
    [[10, 18, 60], [70, 34, 90], [120, 12, 75], [40, 48, 110]].forEach(([cx, cy, dur], i) => {
      const cloud = new Layer();
      cloud.rect(0, 2, 16, 3, C.cloud);
      cloud.rect(3, 0, 8, 2, C.cloud);
      cloud.rect(1, 5, 14, 1, C.cloudShade);
      const g = cloud.toGroup('cloud');
      g.style.transform = `translate(${cx}px, ${cy}px)`;
      const mover = svg('g', { class: 'cloud-mover', style: `--cx:${cx}px;animation-duration:${dur}s;animation-delay:-${i * 17}s` }, g);
      clouds.append(mover);
    });
    root.append(clouds);
  }

  /* ── Far skyline (distant city) ── */
  const skyline = new Layer();
  const blink = svg('g', { class: 'scene-windows' });
  const baseY = 76;
  let x = 0;
  while (x < GRID.width) {
    const w = 4 + Math.floor(rand() * 6);
    const hgt = 8 + Math.floor(rand() * 20);
    const top = baseY - hgt;
    skyline.rect(x, top, w, baseY - top + 6, S.skyline);
    if (rand() > 0.7) skyline.rect(x + Math.floor(w / 2), top - 3, 1, 3, S.skyline); // antenna
    for (let wy = top + 2; wy < baseY - 1; wy += 3) {
      for (let wx = x + 1; wx < x + w - 1; wx += 2) {
        const lit = rand() > S.windows;
        if (!lit) continue;
        if (rand() > 0.8) {
          blink.append(svg('rect', {
            x: wx, y: wy, width: 1, height: 1, fill: C.window, class: 'window-blink',
            style: `animation-delay:${(rand() * 4).toFixed(2)}s`,
          }));
        } else skyline.px(wx, wy, C.window);
      }
    }
    x += w + Math.floor(rand() * 2);
  }
  root.append(skyline.toGroup('scene-skyline'), blink);

  /* ── Hills ── */
  const ridge = (layer, base, amp, freq, phase, colour) => {
    const heights = [];
    for (let px = 0; px < GRID.width; px += 1) {
      const y = Math.round(base + Math.sin(px * freq + phase) * amp + Math.sin(px * freq * 2.3 + phase * 1.7) * amp * 0.4);
      heights.push(y);
      layer.rect(px, y, 1, GRID.height - y, colour);
    }
    return heights;
  };

  const far = new Layer();
  ridge(far, 74, 3, 0.045, 1.2, S.hillFar);
  root.append(far.toGroup('scene-hill-far'));

  const mid = new Layer();
  const midHeights = ridge(mid, 80, 3.5, 0.05, 3.4, S.hillMid);
  root.append(mid.toGroup('scene-hill-mid'));

  /* ── Pine trees on the mid hill ── */
  const trees = new Layer();
  const pine = (tx, ty, tiers) => {
    trees.rect(tx - 1, ty - 3, 2, 3, C.trunk);
    for (let i = 0; i < tiers; i += 1) {
      const rowTop = ty - 3 - (i + 1) * 4;
      for (let r = 0; r < 4; r += 1) {
        const half = Math.floor((r + 1) * 0.9) + 1;
        trees.rect(tx - half, rowTop + r, half * 2, 1, C.pineDark);
        trees.rect(tx, rowTop + r, half, 1, C.pineLight);
      }
    }
  };
  for (const [tx, tiers] of [[8, 3], [19, 2], [30, 3], [47, 2], [66, 2], [150, 3], [164, 2], [176, 3], [186, 2]]) {
    pine(tx, midHeights[tx] + 3, tiers);
  }
  root.append(trees.toGroup('scene-trees'));

  /* ── Near ground ── */
  const near = new Layer();
  const nearHeights = ridge(near, 90, 1.6, 0.04, 0.4, S.ground);
  for (let px = 0; px < GRID.width; px += 1) {
    near.px(px, nearHeights[px], S.grass);
    if ((px + nearHeights[px]) % 3 === 0) near.px(px, nearHeights[px] + 1, S.grassLight);
  }
  for (let i = 0; i < 28; i += 1) {
    const px = Math.floor(rand() * GRID.width);
    near.px(px, nearHeights[px] - 1, i % 4 === 0 ? C.gold : S.grassLight);
  }
  for (let py = 96; py < GRID.height; py += 3) near.rect(92 + ((py - 96) % 2) * 2, py, 6, 1, '#1a4a44');
  root.append(near.toGroup('scene-ground'));

  const groundY = nearHeights[100];

  /* ── Terminal structure (technology cue) ── */
  const term = new Layer();
  const tx = 108; const ty = groundY - 21;
  term.rect(tx - 1, ty - 1, 24, 22, C.ink);
  term.rect(tx, ty, 22, 20, C.body);
  term.rect(tx, ty, 22, 1, C.frame);
  term.rect(tx + 2, ty + 2, 18, 12, C.ink);
  term.rect(tx + 3, ty + 3, 16, 10, C.screen);
  term.px(tx + 5, ty + 5, C.teal); term.px(tx + 6, ty + 6, C.teal); term.px(tx + 5, ty + 7, C.teal);
  term.rect(tx + 9, ty + 5, 6, 1, C.teal);
  term.rect(tx + 9, ty + 7, 4, 1, '#1d7f73');
  term.rect(tx + 3, ty + 16, 16, 1, C.bodyDark);
  term.rect(tx + 3, ty + 18, 16, 1, C.bodyDark);
  term.rect(tx + 11, ty - 9, 1, 8, C.frame);
  term.rect(tx + 9, ty - 4, 5, 1, C.frame);
  root.append(term.toGroup('scene-terminal'));

  const live = svg('g', { class: 'scene-terminal-live' });
  live.append(
    svg('rect', { x: tx + 9, y: ty + 9, width: 3, height: 1, fill: C.teal, class: 'cursor-blink' }),
    svg('rect', { x: tx + 10, y: ty - 11, width: 3, height: 2, fill: C.red, class: 'beacon' }),
  );
  root.append(live);

  /* ── Companion cat (blinks now and then) ── */
  const { height: ch } = spriteSize('cat1');
  const cat = svg('g', { class: 'scene-cat' });
  const c1 = svg('g', { class: 'cat-frame cat-open' });
  const c2 = svg('g', { class: 'cat-frame cat-shut' });
  spritePaths('cat1', 77, groundY - ch + 1).forEach(p => c1.append(p));
  spritePaths('cat2', 77, groundY - ch + 1).forEach(p => c2.append(p));
  cat.append(c1, c2);
  root.append(cat);

  /* ── Hero sprite: two idle frames ── */
  const { height: hh } = spriteSize('hero1');
  const heroX = 90; const heroY = groundY - hh + 1;
  const hero = svg('g', { class: 'scene-hero' });
  const f1 = svg('g', { class: 'hero-frame hero-frame-a' });
  const f2 = svg('g', { class: 'hero-frame hero-frame-b' });
  spritePaths('hero1', heroX, heroY).forEach(p => f1.append(p));
  spritePaths('hero2', heroX, heroY).forEach(p => f2.append(p));
  hero.append(f1, f2);
  root.append(hero);

  /* Where things stand on the grid (x, y, w, h), for the clickable hot-spots on the title screen. */
  const { width: cw } = spriteSize('cat1');
  const { width: hw } = spriteSize('hero1');
  root.dataset.anchors = JSON.stringify({
    cat: [77, groundY - ch + 1, cw, ch],
    hero: [heroX, heroY, hw, hh],
    terminal: [tx, ty - 11, 22, 31],
  });

  return root;
}
