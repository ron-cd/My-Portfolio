/**
 * scenehits.js — Clickable hot-spots over the title-screen scenery.
 *
 *   cat      → a speech bubble (a few lines, then a happy ending)
 *   hero     → a short line
 *   terminal → opens CONTACT
 *
 * They are real <button>s, so keyboard and screen-reader users get exactly the
 * same things (Tab to them, Enter to use). Bubble text is also announced.
 * Positions are computed from the scene's own pixel grid (see scene.js).
 */

import { h } from '../core/dom.js';

const GRID = { w: 192, h: 108 };

const LINES = {
  cat: ['MEOW.', '*purr*', 'Press Start. I will wait.', 'Nothing here but cat.', 'MEOW MEOW.', 'You are very persistent.', 'THE CAT IS VERY HAPPY NOW.'],
  hero: ['Ready, Player One.', 'Quest board is inside.', 'Hire me? The terminal has my email.'],
};

export function createSceneHits({ router, sound, announce }) {
  const counts = { cat: 0, hero: 0 };
  let timer = null;

  const bubble = h('p', { class: 'scene-bubble', hidden: true, 'aria-hidden': 'true' });

  const hot = (id, label, tip, onClick) => h('button', {
    class: `scene-hit scene-hit-${id}`,
    type: 'button',
    'aria-label': label,
    dataset: { tip },
    onClick,
  });

  function say(id, target) {
    const lines = LINES[id];
    const text = lines[Math.min(counts[id], lines.length - 1)];
    counts[id] += 1;
    if (counts[id] > lines.length + 2) counts[id] = 0;
    sound.select();
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.dataset.for = id;
    place();
    announce(`${id === 'cat' ? 'Cat' : 'Hero'} says: ${text}`);
    clearTimeout(timer);
    timer = setTimeout(() => { bubble.hidden = true; }, 2800);
    void target;
  }

  const cat = hot('cat', 'Pet the cat', 'PET THE CAT', () => say('cat'));
  const hero = hot('hero', 'Talk to the hero', 'TALK', () => say('hero'));
  const terminal = hot('terminal', 'Use the terminal: open Contact', 'CONTACT', () => {
    sound.select();
    router.go('contact');
  });

  const layer = h('div', { class: 'scene-hits' }, cat, hero, terminal, bubble);

  function geometry() {
    const scene = document.querySelector('#stage .scene');
    if (!scene) return null;
    let anchors;
    try { anchors = JSON.parse(scene.dataset.anchors || 'null'); } catch { anchors = null; }
    return anchors;
  }

  /** Same maths as preserveAspectRatio="xMidYMax slice". */
  function place() {
    const anchors = geometry();
    if (!anchors) { layer.hidden = true; return; }
    layer.hidden = false;
    const W = window.innerWidth; const H = window.innerHeight;
    const k = Math.max(W / GRID.w, H / GRID.h);
    const toX = gx => W / 2 + (gx - GRID.w / 2) * k;
    const toY = gy => H - (GRID.h - gy) * k;
    const box = (el, [x, y, w, hgt], pad = 2) => {
      el.style.left = `${toX(x - pad)}px`;
      el.style.top = `${toY(y - pad)}px`;
      el.style.width = `${(w + pad * 2) * k}px`;
      el.style.height = `${(hgt + pad * 2) * k}px`;
    };
    box(cat, anchors.cat); box(hero, anchors.hero); box(terminal, anchors.terminal);
    if (!bubble.hidden) {
      const r = bubble.dataset.for === 'cat' ? anchors.cat : anchors.hero;
      bubble.style.left = `${toX(r[0] + r[2] / 2)}px`;
      bubble.style.top = `${toY(r[1] - 3)}px`;
    }
  }

  window.addEventListener('resize', place);
  place();
  // The scene may be re-rendered (sky change): re-measure on the next frame.
  requestAnimationFrame(place);

  return {
    el: layer,
    place,
    destroy() { window.removeEventListener('resize', place); clearTimeout(timer); },
  };
}
