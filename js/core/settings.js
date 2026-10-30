/**
 * settings.js — Visitor preferences and "game progress", stored locally.
 *
 * Everything is optional: if localStorage is blocked, the site still works and
 * simply forgets between visits. Nothing here leaves the visitor's browser.
 */

const KEY = 'player-one-settings';
const VISITED_KEY = 'player-one-visited';
const NOTICE_KEY = 'player-one-explored-notice';

const defaults = { scanlines: false, nightLock: false, bigText: false, contrast: false, calm: false, readable: false };
let settings = { ...defaults };
let visited = new Set();
let noticeSeen = false;
const listeners = new Set();

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || '{}'));
  visited = new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'));
  noticeSeen = localStorage.getItem(NOTICE_KEY) === '1';
} catch { /* storage unavailable: keep defaults */ }

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
  } catch { /* ignore */ }
};

/** Mirror the comfort options onto <html> so CSS can react (see css/comfort.css). */
const CLASSES = { scanlines: 'crt-on', bigText: 'pref-big', contrast: 'pref-contrast', calm: 'pref-calm', readable: 'pref-readable' };
function applyClasses() {
  if (typeof document === 'undefined') return;
  for (const [key, cls] of Object.entries(CLASSES)) document.documentElement.classList.toggle(cls, Boolean(settings[key]));
}
applyClasses();

const emit = () => { applyClasses(); listeners.forEach(fn => fn()); };

export const prefs = {
  get scanlines() { return Boolean(settings.scanlines); },
  get nightLock() { return Boolean(settings.nightLock); },
  get bigText() { return Boolean(settings.bigText); },
  get contrast() { return Boolean(settings.contrast); },
  get calm() { return Boolean(settings.calm); },
  get readable() { return Boolean(settings.readable); },
  set(key, value) {
    if (!(key in defaults)) return;
    settings[key] = Boolean(value);
    save();
    emit();
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

/** The five explorable areas (the buildings of the village). */
export const AREAS = ['profile', 'skills', 'quests', 'achievements', 'contact'];

export const progress = {
  has: route => visited.has(route),
  get count() { return AREAS.filter(a => visited.has(a)).length; },
  get total() { return AREAS.length; },
  get complete() { return this.count === this.total; },
  mark(route) {
    if (!AREAS.includes(route) || visited.has(route)) return false;
    visited.add(route);
    save();
    emit();
    return true;
  },
  /** The one-time "all areas explored" message in the village. */
  get noticeSeen() { return noticeSeen; },
  markNoticeSeen() {
    noticeSeen = true;
    try { localStorage.setItem(NOTICE_KEY, '1'); } catch { /* ignore */ }
  },
  reset() {
    visited = new Set();
    noticeSeen = false;
    try { localStorage.removeItem(NOTICE_KEY); } catch { /* ignore */ }
    save();
    emit();
  },
};

/**
 * Which sky to show: dawn, day, dusk or night.
 * Order of precedence: ?sky= in the URL (handy for sharing and testing),
 * the "lock to night" option, then the visitor's own local clock.
 */
export function currentSky() {
  const forced = new URLSearchParams(window.location.search).get('sky');
  if (['dawn', 'day', 'dusk', 'night'].includes(forced)) return forced;
  if (settings.nightLock) return 'night';
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

export const GREETING = {
  dawn: 'GOOD MORNING, PLAYER',
  day: 'GOOD DAY, PLAYER',
  dusk: 'GOOD EVENING, PLAYER',
  night: 'WELCOME BACK, NIGHT OWL',
};
