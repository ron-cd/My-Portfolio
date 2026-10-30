/**
 * worldart.js — Draws the village (WALK AROUND) as one pixel-art SVG.
 *
 * Everything is generated from js/data/world.js with rectangles and the shared
 * sprites, so there are no image files. 16 × 16 pixels per tile. The sky only
 * tints the picture (night / dusk / dawn) and lights the windows.
 */

import { svg } from '../core/dom.js';
import { Layer, rng } from '../core/scene.js';
import { spritePaths, spriteSize } from '../core/sprites.js';

export const TILE = 16;

const INK = '#0a0e1a';
const COLOURS = {
  grass: '#2f8f5b', grassDark: '#277a4d', grassLight: '#3aa05a',
  sand: '#d4b87a', sandDark: '#b8995a', sandSpeck: '#c4a468',
  water: '#2b64b0', waterLight: '#73abe6', waterEdge: '#1f4d85',
};

const TINT = {
  night: { fill: '#0a1030', opacity: 0.5, lit: true },
  dusk: { fill: '#c4553a', opacity: 0.2, lit: true },
  dawn: { fill: '#f0a080', opacity: 0.15, lit: false },
  day: null,
};

const TREE = [
  '.....kkkkkk.....',
  '...kkfffyyfkk...',
  '..kfffyyfffffk..',
  '.kfffffffffFFfk.',
  '.kffyyfffffFFFk.',
  '.kfffffffFFFFFk.',
  '..kfffFFFFFFFk..',
  '...kkFFFFFFkk...',
  '.....kkppkk.....',
  '......kppk......',
  '......kPpk......',
  '......kPpk......',
  '.....kkPPkk.....',
];
const TREE_COLOURS = { k: INK, f: '#3aa05a', F: '#1f6b3a', y: '#5bc06a', p: '#8a6a4a', P: '#5e452f' };

function drawRows(layer, rows, colours, x, y) {
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx += 1) {
      const ch = row[rx];
      if (ch !== '.' && colours[ch]) layer.px(x + rx, y + ry, colours[ch]);
    }
  });
}

function drawBuilding(layer, b, lit) {
  const { look } = b;
  const px = b.x * TILE; const py = b.y * TILE;
  const W = b.w * TILE; const H = b.h * TILE;
  const cx = px + W / 2;

  // Ground shadow
  layer.rect(px + 1, py + H - 1, W - 1, 2, '#1f6b3a');

  // Walls
  layer.rect(px + 3, py + 11, W - 6, H - 11, INK);
  layer.rect(px + 4, py + 12, W - 8, H - 13, look.wall);
  layer.rect(px + 4, py + H - 5, W - 8, 4, look.wallShade);

  // Tower turret goes up behind the roof
  if (look.kind === 'tower') {
    layer.rect(cx - 7, py - 4, 14, 14, INK);
    layer.rect(cx - 6, py - 3, 12, 14, look.wall);
    layer.rect(cx - 6, py + 1, 12, 1, look.wallShade);
    layer.rect(cx - 6, py + 5, 12, 1, look.wallShade);
    for (let r = 0; r < 8; r += 1) {
      const inset = 7 - r;
      layer.rect(cx - 8 + inset - (r === 0 ? 0 : 0), py - 14 + r, 16 - inset * 2 + 0, 1, INK);
    }
    for (let r = 0; r < 7; r += 1) {
      const half = 1 + r;
      layer.rect(cx - half, py - 13 + r, half * 2, 1, look.roof);
    }
    layer.rect(cx - 1, py - 4, 2, 3, INK); // arrow slit
  }

  // Roof: a trapezoid built from rows, with an ink outline.
  for (let r = 0; r < 10; r += 1) {
    const inset = 9 - r;
    layer.rect(px + 1 + inset - 1, py + 2 + r, W - 2 - inset * 2 + 2, 1, INK);
  }
  for (let r = 0; r < 10; r += 1) {
    const inset = 9 - r;
    const colour = r < 2 ? look.roof : (r % 3 === 2 ? look.roofDark : look.roof);
    layer.rect(px + 1 + inset, py + 2 + r, W - 2 - inset * 2, 1, colour);
  }
  layer.rect(px + 1, py + 12, W - 2, 1, INK);

  // Emblem plaque on the roof
  const { width: ew, height: eh } = spriteSize(look.emblem);
  layer.rect(cx - 7, py + 1, 14, 11, INK);
  layer.rect(cx - 6, py + 2, 12, 9, '#efe6cf');

  // Door
  layer.rect(cx - 6, py + H - 14, 12, 14, INK);
  layer.rect(cx - 5, py + H - 13, 10, 13, '#8a6a4a');
  layer.rect(cx - 5, py + H - 13, 5, 13, '#a07e58');
  layer.rect(cx + 2, py + H - 7, 2, 2, '#f6d77a');
  layer.rect(cx - 6, py + H - 15, 12, 1, look.roofDark);

  // Windows (lit at dusk and night)
  const glass = lit ? '#f6d77a' : '#9fc6ea';
  for (const wx of [px + 7, px + W - 13]) {
    layer.rect(wx - 1, py + 15, 8, 8, INK);
    layer.rect(wx, py + 16, 6, 6, glass);
    layer.rect(wx + 2, py + 16, 1, 6, look.wallShade);
    layer.rect(wx, py + 18, 6, 1, look.wallShade);
  }

  // Per-building details
  if (look.kind === 'hall') {
    for (const colx of [px + 5, px + W - 9]) {
      layer.rect(colx - 1, py + 13, 6, H - 13, INK);
      layer.rect(colx, py + 13, 4, H - 14, '#fff8e6');
    }
    layer.rect(cx - 9, py + H - 2, 18, 2, '#aeb8c9');
  }
  if (look.kind === 'guild') {
    for (const bx of [px + 6, px + W - 11]) {
      layer.rect(bx - 1, py + 14, 6, 12, INK);
      layer.rect(bx, py + 14, 4, 11, '#d9534f');
      layer.rect(bx + 1, py + 17, 2, 3, '#e8b84a');
    }
  }
  if (look.kind === 'post') {
    // A red mailbox beside the building
    const mx = px + W + 3;
    layer.rect(mx + 3, py + H - 8, 2, 8, INK);
    layer.rect(mx + 3, py + H - 8, 1, 8, '#8a6a4a');
    layer.rect(mx - 1, py + H - 15, 10, 8, INK);
    layer.rect(mx, py + H - 14, 8, 6, '#d9534f');
    layer.rect(mx, py + H - 14, 8, 2, '#e8806c');
    layer.rect(mx + 5, py + H - 18, 1, 4, INK);
    layer.rect(mx + 6, py + H - 18, 3, 2, '#e8b84a');
  }
  void ew; void eh;
}

function drawFlag(b) {
  const px = b.x * TILE; const py = b.y * TILE;
  const W = b.w * TILE;
  const g = new Layer();
  const fx = px + W - 5;
  g.rect(fx, py - 8, 1, 14, INK);
  g.rect(fx + 1, py - 8, 7, 5, INK);
  g.rect(fx + 1, py - 7, 6, 3, '#e8b84a');
  g.rect(fx + 2, py - 7, 2, 1, '#f6d77a');
  const el = g.toGroup('world-flag');
  el.dataset.for = b.id;
  el.style.display = 'none';
  return el;
}

/** Returns { el, setVisited(id, boolean) }. */
export function drawWorld({ world, grid, sky = 'day' }) {
  const W = world.cols * TILE; const H = world.rows * TILE;
  const rand = rng(11);
  const tint = TINT[sky] || null;
  const lit = Boolean(tint?.lit);

  const root = svg('svg', {
    class: 'world-art',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'none',
    'shape-rendering': 'crispEdges',
    'aria-hidden': 'true',
    focusable: 'false',
  });

  // Ground
  const ground = new Layer();
  ground.rect(0, 0, W, H, COLOURS.grass);
  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      if (grid.isRoad(x, y)) continue;
      for (let i = 0; i < 5; i += 1) {
        const colour = i < 3 ? COLOURS.grassDark : COLOURS.grassLight;
        ground.px(x * TILE + Math.floor(rand() * TILE), y * TILE + Math.floor(rand() * TILE), colour);
      }
    }
  }
  root.append(ground.toGroup('world-ground'));

  // Road
  const road = new Layer();
  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      if (!grid.isRoad(x, y)) continue;
      const tx = x * TILE; const ty = y * TILE;
      road.rect(tx, ty, TILE, TILE, COLOURS.sand);
      for (let i = 0; i < 4; i += 1) road.px(tx + Math.floor(rand() * 14) + 1, ty + Math.floor(rand() * 14) + 1, COLOURS.sandSpeck);
      if (!grid.isRoad(x, y - 1)) road.rect(tx, ty, TILE, 1, COLOURS.sandDark);
      if (!grid.isRoad(x, y + 1)) road.rect(tx, ty + TILE - 1, TILE, 1, COLOURS.sandDark);
      if (!grid.isRoad(x - 1, y)) road.rect(tx, ty, 1, TILE, COLOURS.sandDark);
      if (!grid.isRoad(x + 1, y)) road.rect(tx + TILE - 1, ty, 1, TILE, COLOURS.sandDark);
    }
  }
  root.append(road.toGroup('world-road'));

  // Pond and flowers
  const decor = new Layer();
  for (const [x, y] of world.ponds) {
    const tx = x * TILE; const ty = y * TILE;
    decor.rect(tx, ty, TILE, TILE, COLOURS.water);
    decor.rect(tx + 3, ty + 4, 5, 1, COLOURS.waterLight);
    decor.rect(tx + 9, ty + 10, 4, 1, COLOURS.waterLight);
    const has = (dx, dy) => world.ponds.some(([px, py]) => px === x + dx && py === y + dy);
    if (!has(0, -1)) decor.rect(tx, ty, TILE, 1, COLOURS.waterEdge);
    if (!has(0, 1)) decor.rect(tx, ty + TILE - 1, TILE, 1, COLOURS.waterEdge);
    if (!has(-1, 0)) decor.rect(tx, ty, 1, TILE, COLOURS.waterEdge);
    if (!has(1, 0)) decor.rect(tx + TILE - 1, ty, 1, TILE, COLOURS.waterEdge);
  }
  for (const [x, y] of world.flowers) {
    if (grid.isRoad(x, y)) continue;
    const tx = x * TILE; const ty = y * TILE;
    decor.px(tx + 4, ty + 6, '#e8b84a'); decor.px(tx + 5, ty + 6, '#e8b84a');
    decor.px(tx + 10, ty + 11, '#efe6cf'); decor.px(tx + 10, ty + 10, '#d9534f');
    decor.px(tx + 4, ty + 7, '#277a4d'); decor.px(tx + 10, ty + 12, '#277a4d');
  }
  root.append(decor.toGroup('world-decor'));

  // Lamp posts: they glow at dusk and night.
  const lampLayer = new Layer();
  const glows = [];
  for (const [x, y] of world.lamps || []) {
    if (grid.isRoad(x, y)) continue;
    const tx = x * TILE; const ty = y * TILE;
    lampLayer.rect(tx + 6, ty + 5, 4, 11, INK);
    lampLayer.rect(tx + 7, ty + 6, 2, 10, '#5a4a38');
    lampLayer.rect(tx + 4, ty + 0, 8, 7, INK);
    lampLayer.rect(tx + 5, ty + 1, 6, 5, lit ? '#f6d77a' : '#cfd8e6');
    lampLayer.rect(tx + 5, ty + 1, 2, 5, lit ? '#fff3c4' : '#eef2f8');
    if (lit) glows.push(svg('circle', { cx: tx + 8, cy: ty + 4, r: 15, fill: '#f6d77a', opacity: 0.15 }));
  }
  glows.forEach(g => root.append(g));
  root.append(lampLayer.toGroup('world-lamps'));

  // Forest border + trees, drawn back to front so they overlap nicely.
  const trees = new Layer();
  const treeTiles = [];
  for (let x = 0; x < world.cols; x += 1) { treeTiles.push([x, 0]); treeTiles.push([x, world.rows - 1]); }
  for (let y = 1; y < world.rows - 1; y += 1) { treeTiles.push([0, y]); treeTiles.push([world.cols - 1, y]); }
  for (const t of world.trees) treeTiles.push(t);
  treeTiles
    .filter(([x, y]) => !grid.isRoad(x, y) && !grid.buildingAtTile(x, y))
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, y]) => drawRows(trees, TREE, TREE_COLOURS, x * TILE, y * TILE));
  root.append(trees.toGroup('world-trees'));

  // Buildings
  const flags = {};
  for (const b of world.buildings) {
    const layer = new Layer();
    drawBuilding(layer, b, lit);
    const g = layer.toGroup(`world-building world-building-${b.id}`);
    const px = b.x * TILE + b.w * TILE / 2;
    const py = b.y * TILE;
    for (const p of spritePaths(b.look.emblem, px - 4, py + 2)) g.append(p);
    root.append(g);
    flags[b.id] = drawFlag(b);
    root.append(flags[b.id]);
  }

  if (tint) {
    root.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: tint.fill, opacity: tint.opacity, class: 'world-tint' }));
  }

  return {
    el: root,
    setVisited(id, visited) { if (flags[id]) flags[id].style.display = visited ? '' : 'none'; },
  };
}
