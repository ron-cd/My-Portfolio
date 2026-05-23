/**
 * utils.js - shared math and browser helpers
 */
'use strict';

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, mn, mx) {
  return Math.min(Math.max(v, mn), mx);
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
