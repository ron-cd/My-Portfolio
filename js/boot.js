/*
 * boot.js — runs before first paint (classic script, so it is not deferred).
 *   1. Marks the page as JavaScript-enabled so the plain-text fallback can be hidden.
 *   2. If the game's module fails to download, un-marks it so the fallback stays visible.
 * Kept as a file (not inline) so the Content-Security-Policy can forbid inline scripts.
 */
document.documentElement.classList.add('js-enabled');
window.addEventListener('error', event => {
  const el = event.target;
  if (el && el.tagName === 'SCRIPT' && /\/main\.js(\?|$)/.test(el.src)) {
    document.documentElement.classList.remove('js-enabled');
  }
}, true);
