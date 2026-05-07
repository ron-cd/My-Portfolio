/**
 * utils.js — Math helpers & browser utilities
 * ─────────────────────────────────────────────
 * Author : Aaron Dela Cruz
 * Updated: 2025
 */

'use strict';

/**
 * Linear interpolation between two values.
 * @param {number} a  Start value
 * @param {number} b  End value
 * @param {number} t  Progress 0→1
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max.
 * @param {number} v
 * @param {number} mn  Minimum
 * @param {number} mx  Maximum
 * @returns {number}
 */
export function clamp(v, mn, mx) {
  return Math.min(Math.max(v, mn), mx);
}

/**
 * Ease-in-out cubic — smooth acceleration and deceleration.
 * @param {number} t  Progress 0→1
 * @returns {number}
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Map a value from one range to another.
 * @param {number} v    Input value
 * @param {number} iMin Input min
 * @param {number} iMax Input max
 * @param {number} oMin Output min
 * @param {number} oMax Output max
 * @returns {number}
 */
export function mapRange(v, iMin, iMax, oMin, oMax) {
  return oMin + clamp((v - iMin) / (iMax - iMin), 0, 1) * (oMax - oMin);
}

/**
 * Debounce — delays execution until after `delay` ms of silence.
 * @param {Function} fn
 * @param {number}   delay  Milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Returns true if the user has requested reduced motion.
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
