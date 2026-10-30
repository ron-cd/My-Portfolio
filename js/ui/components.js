/**
 * components.js — Reusable retro UI pieces shared by every screen.
 */

import { h, prefersReducedMotion } from '../core/dom.js';
import { sprite } from '../core/sprites.js';

/** The pixel portrait, with an occasional blink (two stacked frames, CSS-timed). */
export function animatedPortrait({ large = false } = {}) {
  return h('div', { class: `portrait-frame${large ? ' portrait-frame-lg' : ''}` },
    h('div', { class: 'portrait-wrap' },
      sprite('portrait', { label: 'Pixel-art portrait of the developer', className: 'portrait' }),
      sprite('portraitBlink', { className: 'portrait portrait-blink' })));
}

/** A framed RPG window (pixel border, optional title bar). */
export function win(title, children, { className = '', tag = 'section', id, labelledBy } = {}) {
  const titleId = title && !labelledBy ? `${id || `win-${Math.random().toString(36).slice(2, 8)}`}-title` : labelledBy;
  return h(tag, {
    class: `win ${className}`.trim(),
    id,
    'aria-labelledby': title ? titleId : undefined,
  },
  title ? h('h2', { class: 'win-title', id: titleId }, title) : null,
  h('div', { class: 'win-body' }, children));
}

/** Screen heading. Receives focus when a screen opens. */
export function screenHeader(title, subtitle) {
  return h('header', { class: 'screen-header' },
    h('h1', { class: 'screen-title', tabindex: '-1' }, title),
    subtitle ? h('p', { class: 'screen-subtitle' }, subtitle) : null);
}

export function tag(text, className = '') {
  return h('span', { class: `tag ${className}`.trim() }, text);
}

export function tagList(items, label) {
  return h('ul', { class: 'tag-list', 'aria-label': label },
    items.map(item => h('li', {}, tag(item))));
}

/** Pixel button. Pass href for links, onClick for buttons. */
export function button({ label, href, onClick, variant = 'primary', external = false, download = false, icon, ariaLabel, className = '' }) {
  const props = {
    class: `btn btn-${variant} ${className}`.trim(),
    'aria-label': ariaLabel,
  };
  const content = [icon ? sprite(icon) : null, h('span', {}, label)];
  if (href) {
    return h('a', {
      ...props,
      href,
      ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      ...(download ? { download: '' } : {}),
    }, ...content);
  }
  return h('button', { ...props, type: 'button', onClick }, ...content);
}

/** Status pill for certifications and projects. */
export function statusBadge(status, label) {
  return h('span', { class: `badge badge-${status}` }, label);
}

/**
 * Typewriter text. Screen readers get the full text immediately; sighted
 * users see it typed out (instantly when reduced motion is on).
 * Returns { cancel, finish }.
 */
export function typewriter(container, text, { speed = 18 } = {}) {
  const typed = h('span', { 'aria-hidden': 'true', class: 'typed' });
  const full = h('span', { class: 'sr-only' }, text);
  container.replaceChildren(full, typed);

  if (prefersReducedMotion()) {
    typed.textContent = text;
    return { cancel() {}, finish() {} };
  }

  let i = 0;
  const timer = setInterval(() => {
    i += 1;
    typed.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(timer);
  }, speed);

  return {
    cancel() { clearInterval(timer); },
    finish() { clearInterval(timer); typed.textContent = text; },
  };
}

/** Small "back to the village" row used at the bottom of screens. */
export function returnRow() {
  return h('div', { class: 'return-row' },
    button({ label: 'RETURN TO VILLAGE', href: '#/world', variant: 'ghost', icon: 'cursor' }));
}
