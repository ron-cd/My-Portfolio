/**
 * scroll.js — Scroll tracking & active-section detection
 * ────────────────────────────────────────────────────────
 * Author : Aaron Dela Cruz
 * Updated: 2025
 *
 * Usage:
 *   import { scrollTracker } from './scroll.js';
 *   scrollTracker.init();
 *   scrollTracker.registerSections(['hero','about','skills','projects','contact']);
 *   scrollTracker.on(({ scrollY, progress }) => { ... });
 */

'use strict';

import { clamp, debounce } from './utils.js';

const scrollTracker = {
  /** Current scroll position in px */
  scrollY: 0,

  /** Normalised scroll progress across the full page [0..1] */
  scrollProgress: 0,

  /** Pixels scrolled since last frame (positive = down) */
  velocity: 0,

  _last:     0,
  _listeners: [],
  _sections:  [],
  _active:    null,
  _tick:      false,

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Initialise scroll and resize listeners. Call once on DOMContentLoaded.
   */
  init() {
    window.addEventListener('scroll', () => this._onScroll(), { passive: true });
    window.addEventListener('resize', debounce(() => this._detectActive(), 200));
    // Seed values immediately
    this.scrollY = window.scrollY;
    this._last   = window.scrollY;
  },

  /**
   * Register section IDs for active-section detection.
   * Fires a 'sectionChange' CustomEvent on document when the active section changes.
   * @param {string[]} ids  Array of element IDs in DOM order
   */
  registerSections(ids) {
    this._sections = ids
      .map(id => ({ id, el: document.getElementById(id) }))
      .filter(s => s.el);
  },

  /**
   * Subscribe to scroll updates.
   * @param {Function} fn  Called with { scrollY, progress, velocity }
   */
  on(fn) {
    this._listeners.push(fn);
  },

  /**
   * Unsubscribe a previously registered listener.
   * @param {Function} fn
   */
  off(fn) {
    this._listeners = this._listeners.filter(l => l !== fn);
  },

  /** Currently active section ID, or null */
  get activeSection() {
    return this._active;
  },

  // ─── Private ───────────────────────────────────────────────────────────────

  _onScroll() {
    if (!this._tick) {
      requestAnimationFrame(() => {
        this._update();
        this._tick = false;
      });
      this._tick = true;
    }
  },

  _update() {
    this.scrollY  = window.scrollY;
    this.velocity = this.scrollY - this._last;
    this._last    = this.scrollY;

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress = docH > 0 ? clamp(this.scrollY / docH, 0, 1) : 0;

    this._detectActive();
    this._notify();
  },

  _detectActive() {
    const mid = window.innerHeight * 0.4;
    let found = null;
    for (const s of this._sections) {
      const r = s.el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { found = s.id; break; }
    }
    if (found !== this._active) {
      this._active = found;
      document.dispatchEvent(
        new CustomEvent('sectionChange', { detail: { section: found } })
      );
    }
  },

  _notify() {
    const payload = {
      scrollY:   this.scrollY,
      progress:  this.scrollProgress,
      velocity:  this.velocity,
    };
    for (const fn of this._listeners) fn(payload);
  },
};

export { scrollTracker };
