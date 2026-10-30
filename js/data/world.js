/**
 * world.js — The map for WALK AROUND (#/world).
 *
 * The village is a grid of 32 × 20 tiles. The screen shows only part of it at a
 * time (the camera follows the hero). Each building is one of the site's
 * screens: stepping on its door tile (or pressing Enter next to it, or tapping
 * the building, or choosing it in the LOCATIONS drawer) opens that screen.
 *
 * To move or add a building:
 *   • x, y, w, h  — its footprint in tiles (blocked for walking)
 *   • door        — the tile directly below the building that opens the screen. A path from
 *                   the door down to the nearest road is added automatically;
 *                   scripts/validate-data.mjs checks that every door is reachable.
 *   • route       — a screen id (must exist in js/main.js)
 *   • look        — colours and the emblem sprite (a name from js/core/sprites.js)
 * Roads are rectangles of tiles (x1, y1 to x2, y2, both included). Trees, lamps,
 * the lake and flowers are plain tile coordinates. The outer ring of tiles is
 * always forest.
 */

export const WORLD = {
  cols: 32,
  rows: 20,
  start: [15, 10],

  roads: [
    { x1: 3, y1: 7, x2: 29, y2: 7 },     // upper road
    { x1: 3, y1: 14, x2: 29, y2: 14 },   // lower road
    { x1: 15, y1: 7, x2: 15, y2: 14 },   // road between them
    { x1: 13, y1: 9, x2: 17, y2: 12 },   // the village square
  ],

  buildings: [
    {
      id: 'profile', route: 'profile', place: 'COTTAGE',
      x: 4, y: 3, w: 3, h: 2, door: [5, 5],
      look: { roof: '#d9534f', roofDark: '#a63c39', wall: '#efe6cf', wallShade: '#cdbf9e', emblem: 'user', kind: 'cottage' },
    },
    {
      id: 'skills', route: 'skills', place: 'TOWER',
      x: 14, y: 3, w: 3, h: 2, door: [15, 5],
      look: { roof: '#4a76b0', roofDark: '#36588a', wall: '#aeb8c9', wallShade: '#8793ac', emblem: 'tree', kind: 'tower' },
    },
    {
      id: 'quests', route: 'quests', place: 'GUILD HALL',
      x: 25, y: 3, w: 3, h: 2, door: [26, 5],
      look: { roof: '#8a4f46', roofDark: '#6a3a34', wall: '#e0ac82', wallShade: '#b98062', emblem: 'scroll', kind: 'guild' },
    },
    {
      id: 'achievements', route: 'achievements', place: 'TROPHY HALL',
      x: 7, y: 10, w: 3, h: 2, door: [8, 12],
      look: { roof: '#e8b84a', roofDark: '#a8762a', wall: '#efe6cf', wallShade: '#cdbf9e', emblem: 'trophy', kind: 'hall' },
    },
    {
      id: 'contact', route: 'contact', place: 'POST OFFICE',
      x: 22, y: 10, w: 3, h: 2, door: [23, 12],
      look: { roof: '#2bb5a0', roofDark: '#1d7f73', wall: '#efe6cf', wallShade: '#cdbf9e', emblem: 'envelope', kind: 'post' },
      blockedExtra: [[25, 11]],
    },
  ],

  trees: [
    [2, 3], [2, 4], [3, 5], [2, 8], [3, 9], [2, 10], [3, 11], [2, 12], [5, 9], [6, 12], [10, 13],
    [9, 2], [10, 2], [10, 4], [11, 3], [11, 9], [11, 11], [12, 4],
    [19, 3], [20, 4], [21, 3], [21, 5], [20, 9], [19, 12],
    [29, 3], [29, 5], [30, 4], [27, 9], [28, 10], [29, 9], [28, 12], [29, 11],
    [3, 16], [2, 17], [4, 18], [5, 16], [6, 16], [7, 17], [9, 17], [10, 16], [11, 17], [12, 16], [13, 17], [14, 17],
    [16, 17], [17, 16], [25, 18], [26, 16], [27, 17], [28, 16], [29, 17], [28, 18],
  ],
  lamps: [[12, 9], [18, 9], [12, 12], [18, 12], [3, 6], [28, 6]],
  ponds: [
    [20, 16], [21, 16], [22, 16],
    [19, 17], [20, 17], [21, 17], [22, 17], [23, 17],
    [20, 18], [21, 18], [22, 18],
  ],
  flowers: [
    [4, 6], [6, 6], [10, 6], [12, 8], [18, 8], [20, 6], [24, 6], [27, 6], [29, 6],
    [4, 9], [6, 11], [11, 12], [19, 10], [21, 12], [26, 12], [27, 11],
    [5, 13], [9, 13], [13, 13], [18, 13], [24, 13], [4, 15], [8, 15], [12, 15], [17, 15], [24, 15], [27, 15],
  ],
};
