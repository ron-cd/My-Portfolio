/**
 * dom.js — Tiny helpers for building DOM without a framework.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * h('button', { class: 'btn', onClick: fn, 'aria-label': 'x' }, 'Text', childNode)
 * - `class` / `className` set the class attribute
 * - `on*` props attach event listeners
 * - `dataset` accepts an object
 * - null / undefined / false children are skipped
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class' || key === 'className') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

export function svg(tag, props = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export const prefersReducedMotion = () =>
  document.documentElement.classList.contains('pref-calm')
  || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Is the keyboard event aimed at something the user is typing in? */
export function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
