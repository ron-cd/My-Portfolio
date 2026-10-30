/**
 * router.js — Minimal hash router (works on any static host, no server rules).
 *
 *   #/            or empty   → title
 *   #/menu                   → the village (the old main menu was removed)
 *   #/profile                → a screen
 *   #/skills/html-css        → a screen with an optional detail param
 *
 * Changing screens pushes history entries, so the browser Back / Forward
 * buttons work. Changing only the detail param uses replaceState so opening
 * a detail panel never pollutes history.
 */

export const ROUTES = ['title', 'profile', 'skills', 'quests', 'achievements', 'contact', 'summary', 'world'];

export function parseHash(hash = window.location.hash) {
  const cleaned = hash.replace(/^#\/?/, '');
  const [name, ...rest] = cleaned.split('/');
  // Old links to the removed main menu land in the village.
  const route = name === 'menu' ? 'world' : (ROUTES.includes(name) ? name : 'title');
  let param = null;
  if (rest.length) {
    // A malformed escape such as %E0%A4%A in a typed or pasted link must not crash the shell.
    try { param = decodeURIComponent(rest.join('/')); } catch { param = null; }
  }
  return { route, param };
}

export function hrefFor(route, param = null) {
  if (route === 'title') return '#/';
  return `#/${route}${param ? `/${encodeURIComponent(param)}` : ''}`;
}

export function createRouter(onRoute) {
  let current = parseHash();

  const handle = () => {
    if (/^#\/?menu(\/|$)/.test(window.location.hash)) history.replaceState(null, '', '#/world');
    const next = parseHash();
    current = next;
    onRoute(next);
  };

  window.addEventListener('hashchange', handle);

  return {
    get current() { return current; },
    start() { handle(); },
    /** Navigate to a screen (adds a history entry). */
    go(route, param = null) {
      const target = hrefFor(route, param);
      if (window.location.hash === target || (route === 'title' && !window.location.hash)) {
        handle();
        return;
      }
      window.location.hash = target;
    },
    /** Update only the detail param without re-rendering or adding history. */
    setParam(route, param) {
      const target = hrefFor(route, param);
      history.replaceState(null, '', target);
      current = { route, param };
    },
  };
}
