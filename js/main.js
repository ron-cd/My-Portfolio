/**
 * main.js — Application shell for PLAYER ONE.
 *
 * One persistent shell (background scene, HUD, main region, transition layer)
 * hosts whichever "scene" is active. Scenes are plain modules exporting:
 *
 *   label                      – text shown in the HUD
 *   mount(ctx) → { el, focus(), unmount(), onKey(event) → boolean }
 *
 * The shell owns routing, the pixel-wipe transition, focus management,
 * global keyboard handling (Escape = back), and the sound toggle.
 */

import { h, prefersReducedMotion, wait, isTypingTarget } from './core/dom.js';
import { createRouter } from './core/router.js';
import { buildScene } from './core/scene.js';
import { sound } from './core/audio.js';
import { music } from './core/music.js';
import { prefs, progress, currentSky } from './core/settings.js';
import { sprite } from './core/sprites.js';
import { createOptions } from './ui/options.js';

import * as title from './scenes/title.js';

/**
 * Only the title screen is in the first download. Every other screen is a separate
 * module that is fetched the first time it is visited (and the village is fetched
 * while the title is idle, because PRESS START opens it).
 */
const LOADERS = {
  profile: () => import('./scenes/profile.js'),
  skills: () => import('./scenes/skilltree.js'),
  quests: () => import('./scenes/quests.js'),
  achievements: () => import('./scenes/achievements.js'),
  contact: () => import('./scenes/contact.js'),
  summary: () => import('./scenes/summary.js'),
  world: () => import('./scenes/world.js'),
};
const loadedScenes = { title };
async function loadScene(route) {
  loadedScenes[route] ||= await LOADERS[route]();
  return loadedScenes[route];
}

/** Where Escape / the HUD back button goes from each scene. The village is the hub. */
const PARENT = {
  profile: 'world',
  skills: 'world',
  quests: 'world',
  achievements: 'world',
  contact: 'world',
  summary: 'title',
  world: 'title',
};

/** Escape never takes you out of the village (it only closes the LOCATIONS drawer there). */
const ESCAPE_STAYS = new Set(['world']);
const parentOf = name => PARENT[name];
const PARENT_LABEL = { title: 'TITLE', world: 'VILLAGE' };

const WIPE_COLUMNS = 16;
const WIPE_MS = 200;

const app = document.getElementById('app');
const stage = document.getElementById('stage');
const screen = document.getElementById('screen');
const wipe = document.getElementById('wipe');
const announcer = document.getElementById('announcer');
const hudBack = document.getElementById('hud-back');
const hudTitle = document.getElementById('hud-title');
const soundToggle = document.getElementById('sound-toggle');

let active = null;        // { name, instance }
let busy = false;
let pending = null;       // latest route requested during a transition
let firstRender = true;

/* ── Background scene (follows the sky setting) ─────────────── */
function renderStage() {
  try {
    const next = buildScene({ sky: currentSky() });
    const current = stage.querySelector('.scene');
    if (current) current.replaceWith(next); else stage.prepend(next);
  } catch (error) {
    // The site stays fully usable on the CSS fallback gradient.
    console.warn('Scene failed to render:', error);
  }
}
renderStage();

/* ── Options window, scanlines ──────────────────────────────── */
const optionsBtn = document.getElementById('options-btn');
optionsBtn.append(sprite('gear'));
const options = createOptions({ mount: app, sound, music, prefs, progress });
optionsBtn.addEventListener('click', () => { sound.select(); options.open(optionsBtn); });

let lastNight = prefs.nightLock;
prefs.onChange(() => {
  document.documentElement.classList.toggle('crt-on', prefs.scanlines);
  if (prefs.nightLock !== lastNight) { lastNight = prefs.nightLock; renderStage(); }
});
document.documentElement.classList.toggle('crt-on', prefs.scanlines);

/* ── Transition layer ───────────────────────────────────────── */
for (let i = 0; i < WIPE_COLUMNS; i += 1) {
  wipe.append(h('i', { style: `--i:${i}` }));
}

async function coverScreen() {
  wipe.classList.add('is-active', 'is-covering');
  wipe.classList.remove('is-revealing');
  await wait(WIPE_MS + WIPE_COLUMNS * 12);
}

async function revealScreen() {
  wipe.classList.remove('is-covering');
  wipe.classList.add('is-revealing');
  await wait(WIPE_MS + WIPE_COLUMNS * 12);
  wipe.classList.remove('is-active', 'is-revealing');
}

/* ── Sound toggle ───────────────────────────────────────────── */
function renderSoundToggle() {
  const on = sound.enabled;
  soundToggle.setAttribute('aria-pressed', String(on));
  soundToggle.setAttribute('aria-label', on ? 'Sound on. Press to mute.' : 'Sound off. Press to turn on.');
  soundToggle.querySelector('.sound-state').textContent = on ? 'ON' : 'OFF';
}
soundToggle.addEventListener('click', () => sound.toggle());
sound.onChange(renderSoundToggle);
renderSoundToggle();

/* ── Scene switching ────────────────────────────────────────── */
function announce(text) {
  announcer.textContent = '';
  // Re-set on the next frame so repeated identical text is still announced.
  requestAnimationFrame(() => { announcer.textContent = text; });
}

function mountScene({ route, param }, scene) {
  const from = active ? active.name : null;
  active?.instance.unmount?.();

  app.classList.remove('is-launching');
  const instance = scene.mount({
    param,
    router,
    sound,
    announce,
    openOptions: el => options.open(el),
    setParam: value => router.setParam(route, value),
  });

  screen.replaceChildren(instance.el);
  active = { name: route, instance, from };

  progress.mark(route);
  music.setScene(route);
  app.dataset.scene = route;
  hudTitle.textContent = scene.label;
  const parent = parentOf(route);
  hudBack.hidden = !parent;
  if (parent) {
    hudBack.setAttribute('href', parent === 'title' ? '#/' : `#/${parent}`);
    hudBack.querySelector('.hud-back-label').textContent = PARENT_LABEL[parent] || 'VILLAGE';
  }

  window.scrollTo(0, 0);
  document.title = route === 'title'
    ? 'PLAYER ONE | Aaron Dela Cruz — Developer Portfolio'
    : `${scene.label} | PLAYER ONE — Aaron Dela Cruz`;

  // Focus the new screen (heading or primary control) for keyboard and screen-reader users.
  instance.focus?.();
  if (!firstRender) announce(`${scene.label} screen`);
}

async function show(target) {
  if (busy) { pending = target; return; }

  // Already on this screen (a second Start press, or only the detail param changed):
  // never remount, just let the scene react to the new param if it cares.
  if (active && active.name === target.route) {
    active.instance.onParam?.(target.param);
    return;
  }

  busy = true;
  app.classList.add('is-busy');

  let scene;
  try {
    scene = await loadScene(target.route);
  } catch (error) {
    // Offline or a failed download: keep the current screen (or the plain-text fallback on first load).
    console.warn('Screen failed to load:', error);
    busy = false;
    app.classList.remove('is-busy');
    if (firstRender) document.documentElement.classList.remove('js-enabled');
    else announce('That screen could not be loaded. Check your connection and try again.');
    return;
  }

  const animate = !firstRender && !prefersReducedMotion();
  if (animate) await coverScreen();
  mountScene(target, scene);
  if (animate) await revealScreen();

  firstRender = false;
  busy = false;
  app.classList.remove('is-busy');

  if (pending) {
    const next = pending;
    pending = null;
    show(next);
  }
}

const router = createRouter(target => {
  show(target);
});

/* ── Global keyboard handling ───────────────────────────────── */
document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;
  if (busy || !active || options.isOpen) return;

  if (active.instance.onKey?.(event)) {
    event.preventDefault();
    return;
  }

  if (event.key === 'Escape' && !ESCAPE_STAYS.has(active.name)) {
    const parent = parentOf(active.name);
    if (parent) {
      event.preventDefault();
      sound.back();
      router.go(parent);
    }
  }
});

/* The HUD back link plays the back sound; the link itself does the navigation. */
hudBack.addEventListener('click', () => sound.back());

music.init();

/* Warm up the village while the title screen is idle. */
(window.requestIdleCallback || (fn => setTimeout(fn, 1500)))(() => { loadScene('world').catch(() => {}); });

/* ── Go ─────────────────────────────────────────────────────── */
router.start();
