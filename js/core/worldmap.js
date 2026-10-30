/**
 * worldmap.js — Pure grid logic for the village: which tiles are blocked or
 * road, where each door is, and shortest paths. No DOM, so it can be tested
 * from Node (scripts/validate-data.mjs does).
 */

const key = (x, y) => `${x},${y}`;

export function buildGrid(world) {
  const { cols, rows } = world;
  const blocked = new Set();
  const road = new Set();
  const doors = new Map();
  const buildingAt = new Map();

  // Forest border.
  for (let x = 0; x < cols; x += 1) { blocked.add(key(x, 0)); blocked.add(key(x, rows - 1)); }
  for (let y = 0; y < rows; y += 1) { blocked.add(key(0, y)); blocked.add(key(cols - 1, y)); }

  for (const [x, y] of world.trees) blocked.add(key(x, y));
  for (const [x, y] of world.ponds) blocked.add(key(x, y));
  for (const [x, y] of world.lamps || []) blocked.add(key(x, y));

  // Roads are rectangles of tiles.
  for (const { x1, y1, x2, y2 } of world.roads) {
    for (let x = x1; x <= x2; x += 1) for (let y = y1; y <= y2; y += 1) road.add(key(x, y));
  }
  const mainRoad = new Set(road);

  for (const b of world.buildings) {
    for (let dx = 0; dx < b.w; dx += 1) {
      for (let dy = 0; dy < b.h; dy += 1) {
        blocked.add(key(b.x + dx, b.y + dy));
        buildingAt.set(key(b.x + dx, b.y + dy), b);
      }
    }
    for (const [x, y] of b.blockedExtra || []) blocked.add(key(x, y));
    const [doorX, doorY] = b.door;
    doors.set(key(doorX, doorY), b);
    // A path from the door straight down to the nearest road.
    for (let y = doorY; y < rows - 1; y += 1) {
      road.add(key(doorX, y));
      if (mainRoad.has(key(doorX, y))) break;
    }
  }

  // Roads and doors always win over scenery placed on the same tile.
  for (const tile of road) blocked.delete(tile);

  return {
    cols, rows, blocked, road, doors, buildingAt,
    isBlocked: (x, y) => x < 0 || y < 0 || x >= cols || y >= rows || blocked.has(key(x, y)),
    isRoad: (x, y) => road.has(key(x, y)),
    doorAt: (x, y) => doors.get(key(x, y)) || null,
    buildingAtTile: (x, y) => buildingAt.get(key(x, y)) || null,
  };
}

/** Shortest walkable path (list of [x, y] steps, excluding the start), or null. */
export function findPath(grid, from, to) {
  const [sx, sy] = from; const [tx, ty] = to;
  if (grid.isBlocked(tx, ty)) return null;
  if (sx === tx && sy === ty) return [];
  const queue = [[sx, sy]];
  const prev = new Map([[key(sx, sy), null]]);
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head]; head += 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx; const ny = y + dy;
      const k = key(nx, ny);
      if (prev.has(k) || grid.isBlocked(nx, ny)) continue;
      prev.set(k, [x, y]);
      if (nx === tx && ny === ty) {
        const path = [];
        let cur = [nx, ny];
        while (cur && !(cur[0] === sx && cur[1] === sy)) { path.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
        return path;
      }
      queue.push([nx, ny]);
    }
  }
  return null;
}
