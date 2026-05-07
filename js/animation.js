/**
 * animation.js — Satellite path, particles, scroll-reveal, parallax
 * ───────────────────────────────────────────────────────────────────
 * Author : Aaron Dela Cruz
 * Updated: 2025
 *
 * Exports:
 *   spaceAnimator   – scroll-driven satellite sweep
 *   initParticles   – floating star-dust canvas
 *   initScrollReveal – IntersectionObserver fade-in
 */

'use strict';

import { lerp, clamp, easeInOutCubic, prefersReducedMotion } from './utils.js';
import { scrollTracker } from './scroll.js';

/* ============================================================
  SATELLITE ANIMATOR
  ============================================================
  The globe is purely CSS — fixed bottom-right, no JS.
  The satellite is completely independent: it follows a
  scroll-driven sweeping arc path defined by waypoints.
  Waypoints  (x, y as fraction of viewport, rot = tilt in °)
  ────────────────────────────────────────────────────────────
  0.00 → top-right   (Hero)
  0.20 → top-centre  (About   — sweeps left)
  0.40 → left mid    (Skills  — arc down-left)
  0.60 → bottom-left (Projects — wide sweep)
  0.80 → right lower (Contact — arc back right)
  1.00 → mid-bottom  (Footer  — lands centre)
   ============================================================ */
const spaceAnimator = {
  satellite: null,
  _raf:      null,
  _reduced:  false,

  // Smoothed current position
  _curX: 0, _curY: 0, _curAngle: 0,

  // Target position driven by scroll
  _tgtX: 0, _tgtY: 0, _tgtAngle: 0,

  _progress: 0,

  _waypoints: [
    { p: 0.00, x: 0.80, y: 0.20, rot:  20 },
    { p: 0.20, x: 0.20, y: 0.17, rot: -15 },
    { p: 0.40, x: 0.08, y: 0.40, rot: -80 },
    { p: 0.60, x: 0.12, y: 0.75, rot: -60 },
    { p: 0.80, x: 0.82, y: 0.70, rot:  50 },
    { p: 1.00, x: 0.50, y: 0.92, rot:   0 },
  ],

  init() {
    this.satellite = document.getElementById('space-satellite');
    if (!this.satellite) return;
    this._reduced = prefersReducedMotion();

    // Seed position — no jump on first frame
    const vw = window.innerWidth, vh = window.innerHeight;
    this._curX     = this._waypoints[0].x * vw;
    this._curY     = this._waypoints[0].y * vh;
    this._curAngle = this._waypoints[0].rot;

    scrollTracker.on(({ progress }) => {
      this._progress = progress;
      this._updateTargets();
    });

    this._updateTargets();
    this._loop();
  },

  _updateTargets() {
    const p   = this._progress;
    const wps = this._waypoints;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    // Locate surrounding waypoints
    let a = wps[0], b = wps[wps.length - 1];
    for (let i = 0; i < wps.length - 1; i++) {
      if (p >= wps[i].p && p <= wps[i + 1].p) {
        a = wps[i]; b = wps[i + 1]; break;
      }
    }

    const span = b.p - a.p;
    const t    = span > 0 ? clamp((p - a.p) / span, 0, 1) : 0;
    const e    = easeInOutCubic(t);

    this._tgtX = lerp(a.x, b.x, e) * vw;
    this._tgtY = lerp(a.y, b.y, e) * vh;

    // Shortest rotation path
    let da = b.rot - a.rot;
    if (da >  180) da -= 360;
    if (da < -180) da += 360;
    this._tgtAngle = a.rot + da * e;
  },

  _loop() {
    if (!this.satellite) return;

    const s = 0.02;
    this._curX     = lerp(this._curX,     this._tgtX,     s);
    this._curY     = lerp(this._curY,     this._tgtY,     s);
    this._curAngle = lerp(this._curAngle, this._tgtAngle, s);

    this.satellite.style.transform =
      `translate(${this._curX}px, ${this._curY}px) ` +
      `translate(-50%, -50%) rotate(${this._curAngle}deg)`;
    this.satellite.style.opacity = '0.92';

    this._raf = requestAnimationFrame(() => this._loop());
  },
};

/* ============================================================
  FLOATING PARTICLES  (canvas, star-dust effect)
   ============================================================ */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * canvas.width;
      this.y    = Math.random() * canvas.height;
      this.size = Math.random() * 1.4 + 0.3;
      this.sx   = (Math.random() - 0.5) * 0.18;
      this.sy   = -Math.random() * 0.12 - 0.04;
      this.op   = Math.random() * 0.55 + 0.1;
    }
    update() {
      this.x += this.sx;
      this.y += this.sy;
      if (this.y < -5) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150,220,255,${this.op})`;
      ctx.fill();
    }
  }

  const count = window.innerWidth < 768 ? 55 : 110;
  const pts   = Array.from({ length: count }, () => new Particle());

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  };
  animate();
}

/* ============================================================
   SCROLL REVEAL  (IntersectionObserver fade-in)
   ============================================================ */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        // Stagger direct .reveal-child descendants
        entry.target.querySelectorAll('.reveal-child').forEach((child, i) => {
          child.style.transitionDelay = `${i * 0.08}s`;
          child.classList.add('revealed');
        });
      });
    },
    { rootMargin: '0px 0px -55px 0px', threshold: 0.1 }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}

export { spaceAnimator, initParticles, initScrollReveal };
