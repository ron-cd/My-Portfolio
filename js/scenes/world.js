/**
 * world.js — WALK AROUND: a village you explore on foot, shown full screen.
 *
 * The map is bigger than the screen and the camera follows the hero. The only
 * interface on top of it is a small button bar (TITLE, EXPLORED counter, LOCATIONS,
 * OPTIONS), a speech bubble when you are next to a door, and arrows on touch screens.
 * This is the hub of the site: every other screen is a building here.
 *
 * Ways to get around (all do the same thing). One key press is one tile; holding a key down
 * does not repeat:
 *   • Arrow keys or W A S D walk one tile; Enter goes into the nearest building
 *   • Walking onto a building's door opens it
 *   • Click or tap a building (or any open tile) and the hero walks there
 *   • The LOCATIONS drawer (button, or the L key) works without a mouse or a precise tap
 * Walking is tile by tile with a short CSS transition. There is no animation
 * loop; with reduced motion or CALM MOTION on, moves are instant.
 */

import { h, prefersReducedMotion } from '../core/dom.js';
import { sprite } from '../core/sprites.js';
import { currentSky, progress, prefs } from '../core/settings.js';
import { WORLD } from '../data/world.js';
import { menuItems } from '../data/site.js';
import { buildGrid, findPath } from '../core/worldmap.js';
import { drawWorld, TILE } from '../ui/worldart.js';
import { win, button } from '../ui/components.js';

export const label = 'WALK AROUND';

const STEP_MS = 150;
const OPEN_DELAY_MS = 260;
/** About this many tiles fit across the screen; the tile size is a whole multiple of the 16 px art. */
const TILES_ACROSS = 15;
const DIRS = {
  ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
  ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
};
const IDLE_TEXT = 'Walk with the arrow keys or W A S D. Step onto a door to go in. Press L for the list of places.';

/** Remembered while the page stays open, so coming back from a screen puts you at its door. */
let lastPos = null;

export function mount(ctx) {
  const grid = buildGrid(WORLD);
  const names = Object.fromEntries(menuItems.map(m => [m.id, m.label]));
  let pos = lastPos ? [...lastPos] : [...WORLD.start];
  let facing = 1;
  let frame = 0;
  let walker = null;
  let opener = null;
  let nearId = null;
  let tile = TILE * 6;
  let drawerOpen = false;
  let moved = false;

  const art = drawWorld({ world: WORLD, grid, sky: currentSky() });

  /* ── Hero and cat ─────────────────────────────────────────── */
  const heroA = sprite('hero1', { className: 'world-frame world-frame-a' });
  const heroB = sprite('hero2', { className: 'world-frame world-frame-b' });
  const hero = h('div', { class: 'world-actor world-hero' }, h('div', { class: 'world-flip' }, heroA, heroB));
  const cat = h('div', { class: 'world-actor world-cat' }, h('div', { class: 'world-flip' }, sprite('cat1')));

  const place = (el, [x, y]) => { el.style.setProperty('--x', x); el.style.setProperty('--y', y); };

  const neighbours = ([x, y]) => [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].filter(([nx, ny]) => !grid.isBlocked(nx, ny));
  let catPos = neighbours(pos)[0] || pos;
  place(hero, pos); place(cat, catPos);

  /* ── Names floating over the buildings ────────────────────── */
  const labels = WORLD.buildings.map(b => {
    const el = h('span', { class: `world-label${b.look.kind === 'tower' ? ' is-tall' : ''}`, 'aria-hidden': 'true' }, names[b.id] || b.id.toUpperCase());
    el.style.setProperty('--lx', b.x + b.w / 2);
    el.style.setProperty('--ly', b.y);
    return el;
  });

  /* ── Speech bubble next to a door ─────────────────────────── */
  const bubble = h('button', { class: 'world-bubble', type: 'button', hidden: true });
  bubble.addEventListener('click', event => {
    event.stopPropagation();
    const b = nearBuilding();
    if (b) goTo(b);
  });
  place(bubble, pos);

  /* ── Map and tap targets ──────────────────────────────────── */
  const map = h('div', { class: 'world-map' }, art.el, ...labels, cat, hero, bubble);
  map.addEventListener('click', event => {
    if (drawerOpen) { closeDrawer(); return; }
    const rect = map.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * WORLD.cols);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * WORLD.rows);
    const building = grid.buildingAtTile(x, y);
    if (building) { goTo(building); return; }
    if (!grid.isBlocked(x, y)) walkTo([x, y]);
  });

  const viewport = h('div', { class: 'world-viewport' }, map);

  /* ── Screen-reader status (a polite live region) ──────────── */
  const status = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' }, IDLE_TEXT);

  /* ── Camera ───────────────────────────────────────────────── */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function layout({ instant = false } = {}) {
    const vw = root.clientWidth || window.innerWidth;
    const vh = root.clientHeight || window.innerHeight;
    const scale = clamp(Math.round(vw / TILES_ACROSS / TILE), 3, 8);
    tile = scale * TILE;
    root.style.setProperty('--tile', `${tile}px`);
    map.style.width = `${WORLD.cols * tile}px`;
    map.style.height = `${WORLD.rows * tile}px`;

    const axis = (heroTile, tiles, view) => {
      const total = tiles * tile;
      if (total <= view) return (view - total) / 2;
      return -clamp((heroTile + 0.5) * tile - view / 2, 0, total - view);
    };
    const x = Math.round(axis(pos[0], WORLD.cols, vw));
    const y = Math.round(axis(pos[1], WORLD.rows, vh));
    if (instant) map.classList.add('no-glide');
    map.style.transform = `translate(${x}px, ${y}px)`;
    if (instant) { void map.offsetWidth; map.classList.remove('no-glide'); }
  }

  /* ── Locations drawer ─────────────────────────────────────── */
  const rows = WORLD.buildings.map(b => {
    const checkSlot = h('span', { class: 'loc-check' });
    const button = h('button', { class: 'loc', type: 'button', onClick: () => { ctx.sound.select(); closeDrawer({ refocus: false }); goTo(b); } },
      h('span', { class: 'loc-icon', 'aria-hidden': 'true' }, sprite(b.look.emblem)),
      h('span', { class: 'loc-text' },
        h('strong', {}, names[b.id] || b.id.toUpperCase()),
        h('small', {}, b.place)),
      checkSlot);
    return { b, button, checkSlot, el: h('li', {}, button) };
  });
  /* Visited flags, checkmarks and the EXPLORED counter all follow the saved progress. */
  const exploreChip = h('p', { class: 'world-explore' }, h('span', { class: 'ex-label' }, 'EXPLORED '), h('span', { class: 'ex-count' }));
  function refreshProgress() {
    WORLD.buildings.forEach(b => art.setVisited(b.id, progress.has(b.id)));
    rows.forEach(({ b, checkSlot }) => {
      const seen = progress.has(b.id);
      checkSlot.replaceChildren(...(seen ? [sprite('check'), h('span', { class: 'sr-only' }, ' (visited)')] : []));
    });
    exploreChip.querySelector('.ex-count').textContent = `${progress.count}/${progress.total}`;
    exploreChip.setAttribute('aria-label', `Explored ${progress.count} of ${progress.total} areas`);
    exploreChip.classList.toggle('is-complete', progress.complete);
  }
  refreshProgress();
  const stopWatching = prefs.onChange(refreshProgress);

  const drawerClose = h('button', { class: 'hud-btn world-drawer-close', type: 'button', onClick: () => { ctx.sound.back(); closeDrawer(); } }, 'CLOSE');
  const drawer = h('aside', { class: 'world-drawer', id: 'world-drawer', 'aria-label': 'Locations', hidden: true },
    win('LOCATIONS', [
      h('ul', { class: 'loc-list' }, rows.map(r => r.el)),
      h('p', { class: 'muted world-help' }, 'Choose a place to walk there. You can also click a building, or use the keyboard: arrows or W A S D to walk (one tile per press), Enter to go in, L for this list, Esc to close it.'),
      button({ label: 'PLAIN SUMMARY (NO GAME)', href: '#/summary', variant: 'ghost', icon: 'scroll', className: 'btn-block' }),
      drawerClose,
    ], { className: 'world-locations' }));

  const locationsBtn = h('button', {
    class: 'hud-btn world-locations-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'world-drawer',
    onClick: () => { ctx.sound.select(); drawerOpen ? closeDrawer() : openDrawer(); },
  }, h('span', {}, 'LOCATIONS'), h('span', { class: 'world-key', 'aria-hidden': 'true' }, 'L'));

  function openDrawer() {
    cancelWalk();
    drawerOpen = true;
    drawer.hidden = false;
    locationsBtn.setAttribute('aria-expanded', 'true');
    root.classList.add('has-drawer');
    rows[0].button.focus({ preventScroll: true });
  }
  function closeDrawer({ refocus = true } = {}) {
    if (!drawerOpen) return;
    drawerOpen = false;
    drawer.hidden = true;
    locationsBtn.setAttribute('aria-expanded', 'false');
    root.classList.remove('has-drawer');
    if (refocus) locationsBtn.focus({ preventScroll: true });
  }

  /* ── Button bar ───────────────────────────────────────────── */
  const backLink = h('a', { class: 'hud-btn hud-back', href: '#/', onClick: () => ctx.sound.back() },
    h('span', { class: 'hud-arrow', 'aria-hidden': 'true' }),
    h('span', {}, 'TITLE'));
  const optionsBtn = h('button', {
    class: 'hud-btn hud-icon', type: 'button', 'aria-label': 'Open options', 'aria-haspopup': 'dialog',
    onClick: () => { ctx.sound.select(); ctx.openOptions?.(optionsBtn); },
  }, sprite('gear'));
  const bar = h('div', { class: 'world-bar' },
    h('div', { class: 'world-bar-left' }, backLink, exploreChip),
    h('div', { class: 'world-bar-right' }, locationsBtn, optionsBtn));

  const hint = h('p', { class: 'world-hint', 'aria-hidden': 'true' },
    h('span', {}, 'WASD / ARROWS'), ' walk · ', h('span', {}, 'ENTER'), ' go in · ', h('span', {}, 'L'), ' places');

  /* ── On-screen arrows (touch screens and narrow windows) ──── */
  const arrow = (name, aria, dx, dy) => h('button', {
    class: `dpad-btn dpad-${name}`, type: 'button', 'aria-label': aria, onClick: () => step(dx, dy),
  }, h('span', { 'aria-hidden': 'true' }));
  const dpad = h('div', { class: 'dpad', role: 'group', 'aria-label': 'Walk' },
    arrow('up', 'Walk up', 0, -1), arrow('left', 'Walk left', -1, 0),
    arrow('right', 'Walk right', 1, 0), arrow('down', 'Walk down', 0, 1));

  /* ── Screen root ──────────────────────────────────────────── */
  /* One-time message when every area has been visited. */
  let toast = null;
  const dismissToast = () => { toast?.remove(); toast = null; };
  if (progress.complete && !progress.noticeSeen) {
    progress.markNoticeSeen();
    const post = WORLD.buildings.find(b => b.id === 'contact');
    toast = h('div', { class: 'world-toast', role: 'status' },
      h('p', { class: 'toast-title' }, 'ALL AREAS EXPLORED'),
      h('p', {}, 'You found everything. If you would like to work together, the post office is the quickest way to reach me.'),
      h('div', { class: 'toast-actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onClick: () => { ctx.sound.select(); dismissToast(); if (post) goTo(post); } },
          sprite('envelope'), h('span', {}, 'WALK TO THE POST OFFICE')),
        h('button', { class: 'hud-btn', type: 'button', onClick: () => { ctx.sound.back(); dismissToast(); } }, 'CLOSE')));
  }

  const title = h('h1', { class: 'sr-only', tabindex: '-1' }, 'WALK AROUND');
  const root = h('div', { class: 'world-screen' }, title, viewport, bar, hint, dpad, toast, drawer, status);
  root.dataset.sky = currentSky();

  /* ── Movement ─────────────────────────────────────────────── */
  const cancelWalk = () => { clearInterval(walker); walker = null; };
  const cancelOpen = () => { clearTimeout(opener); opener = null; };

  function nearBuilding() {
    return WORLD.buildings.find(b => Math.abs(pos[0] - b.door[0]) + Math.abs(pos[1] - b.door[1]) <= 1) || null;
  }

  function updatePrompt() {
    const b = nearBuilding();
    const id = b ? b.id : null;
    place(bubble, pos);
    if (id === nearId) return;
    nearId = id;
    if (b) {
      bubble.replaceChildren(
        h('strong', {}, names[b.id]),
        h('small', {}, h('span', { class: 'bubble-key' }, 'ENTER'), ' or tap to go in'));
      bubble.setAttribute('aria-label', `Go in: ${names[b.id]} (${b.place.toLowerCase()})`);
      status.textContent = `Near ${names[b.id]} (${b.place.toLowerCase()}). Press Enter to go in.`;
    } else {
      status.textContent = IDLE_TEXT;
    }
    bubble.hidden = !b;
  }

  function open(b) {
    cancelWalk(); cancelOpen();
    lastPos = [...b.door];
    ctx.sound.select();
    ctx.router.go(b.route);
  }

  function noteMoved() {
    if (moved) return;
    moved = true;
    root.classList.add('has-moved');
  }

  function setPos(next, { quiet = false } = {}) {
    if (next[0] !== pos[0]) { facing = next[0] > pos[0] ? 1 : -1; hero.classList.toggle('is-left', facing < 0); }
    catPos = pos;
    pos = next;
    frame = 1 - frame;
    hero.classList.toggle('is-step', frame === 1);
    place(hero, pos);
    place(cat, catPos);
    layout();
    noteMoved();
    if (!quiet) ctx.sound.move();
    lastPos = [...pos];
    updatePrompt();
    const door = grid.doorAt(pos[0], pos[1]);
    cancelOpen();
    if (door) opener = setTimeout(() => open(door), prefersReducedMotion() ? 120 : OPEN_DELAY_MS);
  }

  function step(dx, dy) {
    cancelWalk();
    const next = [pos[0] + dx, pos[1] + dy];
    if (grid.isBlocked(next[0], next[1])) { ctx.sound.back(); return false; }
    setPos(next);
    return true;
  }

  function walkTo(target) {
    cancelWalk(); cancelOpen();
    const path = findPath(grid, pos, target);
    if (!path || !path.length) return;
    if (prefersReducedMotion()) {
      catPos = path.length > 1 ? path[path.length - 2] : pos;
      pos = [...path[path.length - 1]];
      place(hero, pos); place(cat, catPos);
      layout({ instant: true });
      noteMoved();
      lastPos = [...pos];
      updatePrompt();
      const door = grid.doorAt(pos[0], pos[1]);
      if (door) opener = setTimeout(() => open(door), 120);
      return;
    }
    let i = 0;
    walker = setInterval(() => {
      if (i >= path.length) { cancelWalk(); return; }
      setPos(path[i], { quiet: i % 2 === 1 });
      i += 1;
      if (i >= path.length) cancelWalk();
    }, STEP_MS);
  }

  function goTo(b) {
    if (pos[0] === b.door[0] && pos[1] === b.door[1]) { open(b); return; }
    walkTo(b.door);
  }

  const onResize = () => layout({ instant: true });
  window.addEventListener('resize', onResize);

  // The screen is not in the page yet: measure it on the next frame, then switch the glide on.
  map.classList.add('no-glide');
  const firstFrame = requestAnimationFrame(() => {
    layout({ instant: true });
    root.classList.add('is-ready');
  });
  updatePrompt();

  return {
    el: root,
    focus() { title.focus({ preventScroll: true }); },
    unmount() {
      cancelWalk(); cancelOpen();
      cancelAnimationFrame(firstFrame);
      window.removeEventListener('resize', onResize);
      stopWatching();
    },
    onKey(event) {
      if (drawerOpen) {
        if (event.key === 'Escape') { ctx.sound.back(); closeDrawer(); return true; }
        return false;
      }
      if (event.key === 'Escape' && toast) { ctx.sound.back(); dismissToast(); return true; }
      const dir = DIRS[event.key];
      const isLooking = event.key === 'l' || event.key === 'L';
      // One key press is one tile: the keyboard's auto-repeat (holding a key down) is swallowed.
      if (event.repeat && (dir || isLooking || event.key === 'Enter')) return true;
      if (dir) { step(dir[0], dir[1]); return true; }
      if (isLooking) { ctx.sound.select(); openDrawer(); return true; }
      if (event.key === 'Enter' && !(event.target instanceof Element && event.target.closest('a, button'))) {
        const b = nearBuilding();
        if (b) { goTo(b); return true; }
      }
      return false;
    },
  };
}
