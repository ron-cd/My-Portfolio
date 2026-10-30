/**
 * title.js — The retro title screen.
 *
 * Sequence (CSS-driven, about 2 seconds): scene fades in → logo drops in letter
 * by letter → subtitle → tagline → blinking PRESS START.
 * Start with click / tap, Enter, or Space.
 */

import { h, prefersReducedMotion, wait } from '../core/dom.js';
import { currentSky, GREETING } from '../core/settings.js';
import { sprite } from '../core/sprites.js';
import { site } from '../data/site.js';
import { profile } from '../data/profile.js';
import { createSceneHits } from '../ui/scenehits.js';

export const label = 'TITLE';

function letters(word, startDelay) {
  return [...word].map((ch, i) => h('span', {
    class: 'logo-letter',
    style: `--d:${(startDelay + i * 0.09).toFixed(2)}s`,
    'aria-hidden': 'true',
  }, ch));
}

export function mount(ctx) {
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;
    el.classList.add('is-starting');
    ctx.sound.start();
    // The hero walks up to the terminal before the screen wipes.
    if (!prefersReducedMotion()) {
      document.getElementById('app').classList.add('is-launching');
      await wait(520);
    }
    ctx.router.go('world');
  };

  const startButton = h('button', {
    class: 'press-start',
    type: 'button',
    onClick: start,
    'aria-label': 'Press start',
  }, sprite('cursor'), h('span', {}, 'PRESS START'));

  const [word1, word2] = site.title.split(' ');

  const el = h('section', { class: 'title', 'aria-labelledby': 'title-heading' },
    h('div', { class: 'title-inner' },
      h('h1', { class: 'title-logo', id: 'title-heading' },
        h('span', { class: 'sr-only' }, site.title),
        h('span', { class: 'logo-line logo-line-1', 'aria-hidden': 'true' }, ...letters(word1, 0.5)),
        h('span', { class: 'logo-line logo-line-2', 'aria-hidden': 'true' }, ...letters(word2, 1.05))),
      h('p', { class: 'title-sub' }, site.subtitle),
      h('p', { class: 'title-tag' }, site.tagline),
      startButton,
      h('p', { class: 'title-greeting' }, GREETING[currentSky()]),
      h('p', { class: 'title-hint' }, 'Tap, or press Enter / Space'),
      h('a', { class: 'title-skip', href: '#/summary', onClick: () => ctx.sound.select() }, 'In a hurry? Skip the game: plain summary')),
    h('p', { class: 'title-foot' }, `© ${new Date().getFullYear()} ${profile.fullName.toUpperCase()}`));

  const hits = createSceneHits({ router: ctx.router, sound: ctx.sound, announce: ctx.announce });
  el.append(hits.el);

  return {
    el,
    focus() { startButton.focus({ preventScroll: true }); },
    unmount() { hits.destroy(); },
    onKey(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return false;
      // Let other focused controls (e.g. the sound toggle) keep their own behaviour.
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, select, textarea') && target !== startButton) {
        return false;
      }
      start();
      return true;
    },
  };
}
