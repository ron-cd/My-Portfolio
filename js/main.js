/**
 * main.js — Entry point: wires all modules and boots the portfolio
 * ─────────────────────────────────────────────────────────────────
 * Author  : Aaron Dela Cruz
 * Updated : 2026
 *
 * Load order (all deferred via type="module"):
 *   utils.js → scroll.js → animation.js → main.js
 *
 * SECTIONS
 * ────────────────────────────────────────────────────────────────
 * 1. initNavbar()       — scroll-glass nav, hamburger, active link
 * 2. initScrollProgress()— top-of-page progress bar
 * 3. initSkillsBelt()   — clones skill items for seamless CSS loop
 * 4. initContactForm()  — client-side validation + static form POST
 * 5. initTyping()       — typewriter role-text cycle in the hero
 * 6. initCursorGlow()   — desktop-only mouse-following glow
 * 7. initHeroMotion()   — GSAP parallax on hero ambient layers
 * 8. DOMContentLoaded   — boot sequence
 */

'use strict';

import { isLowPowerMode, lerp, prefersReducedMotion } from './utils.js';
import { scrollTracker }                         from './scroll.js';
import { initScrollReveal } from './animation.js';

/* ============================================================
   NAVBAR
   Active link highlighting + mobile toggle + scroll-glass
   ============================================================ */
function initNavbar() {
  const nav    = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!nav || !links) return;

  const navAs = links.querySelectorAll('a');

  // Glass background once user scrolls past 60 px
  scrollTracker.on(({ scrollY }) => {
    nav.classList.toggle('nav--scrolled', scrollY > 60);
  });

  const setMenuOpen = isOpen => {
    links.classList.toggle('nav-links--open', isOpen);
    nav.classList.toggle('nav--menu-open', isOpen);
    document.body.classList.toggle('nav-menu-open', isOpen);
    toggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const icon = toggle?.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
  };

  // Mobile hamburger toggle
  toggle?.addEventListener('click', () => {
    setMenuOpen(!links.classList.contains('nav-links--open'));
  });

  // Close menu on any link click (mobile)
  navAs.forEach(a => {
    a.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('nav-links--open')) {
      setMenuOpen(false);
      toggle?.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && links.classList.contains('nav-links--open')) {
      setMenuOpen(false);
    }
  }, { passive: true });

  // Highlight active section link
  document.addEventListener('sectionChange', e => {
    const { section } = e.detail;
    navAs.forEach(a => {
      a.classList.toggle('active', !!section && a.getAttribute('href') === `#${section}`);
    });
  });
}

/* ============================================================
   SCROLL PROGRESS
   Lightweight transform-only progress indicator
   ============================================================ */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  scrollTracker.on(({ progress }) => {
    bar.style.transform = `scaleX(${progress})`;
  });
}

/* ============================================================
   SKILLS BELT
   Duplicates the editable skill panels once for a seamless CSS loop.
   ============================================================ */
function initSkillsBelt() {
  const track = document.getElementById('skills-belt-track');
  if (!track || prefersReducedMotion()) return;
  if (track.dataset.cloned === 'true') return;

  const originals = [...track.querySelectorAll(':scope > .skill-belt-item')];
  if (originals.length < 4) return;

  originals.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  track.dataset.cloned = 'true';
  track.classList.add('is-looping');
}

/* ============================================================
   CONTACT FORM
   Client-side validation + Netlify Forms POST
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('submit-btn');
  if (!form || !btn) return;
  const status = document.getElementById('form-status');

  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    message: form.elements.message,
  };

  const errors = {
    name: document.getElementById('name-error'),
    email: document.getElementById('email-error'),
    message: document.getElementById('message-error'),
  };

  function setError(field, message) {
    const input = fields[field];
    if (!input) return;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errors[field]) errors[field].textContent = message;
  }

  function setStatus(message, state = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function validate() {
    let valid = true;
    const emailValue = fields.email?.value.trim() || '';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (!fields.name?.value.trim()) {
      setError('name', 'Enter your name.');
      valid = false;
    } else {
      setError('name', '');
    }

    if (!emailValue) {
      setError('email', 'Enter an email address.');
      valid = false;
    } else if (!emailOk) {
      setError('email', 'Enter a valid email address.');
      valid = false;
    } else {
      setError('email', '');
    }

    if (!fields.message?.value.trim()) {
      setError('message', 'Write a short message.');
      valid = false;
    } else {
      setError('message', '');
    }

    return valid;
  }

  function setSubmitButton(iconClass, label) {
    const icon = document.createElement('i');
    icon.className = iconClass;
    icon.setAttribute('aria-hidden', 'true');
    btn.replaceChildren(icon, document.createTextNode(label));
  }

  function resetSubmitButton() {
    setSubmitButton('fas fa-paper-plane', 'Send Message');
  }

  Object.values(fields).forEach(input => {
    input?.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('');
    if (!validate()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    setSubmitButton('fas fa-circle-notch fa-spin', 'Sending...');
    btn.disabled = true;

    try {
      const data = new FormData(form);
      const response = await fetch(form.getAttribute('action') || '/', {
        method: form.getAttribute('method') || 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });

      if (!response.ok) throw new Error(`Netlify form post failed: ${response.status}`);

      setSubmitButton('fas fa-check', 'Message Sent');
      btn.classList.add('sent');
      form.reset();
      Object.keys(fields).forEach(field => setError(field, ''));
      setStatus('Thanks. Your message was sent.', 'success');
    } catch {
      resetSubmitButton();
      btn.classList.remove('sent');
      btn.disabled = false;
      setStatus('Message could not be sent. Please email me directly.', 'error');
      return;
    }

    setTimeout(() => {
      resetSubmitButton();
      btn.classList.remove('sent');
      btn.disabled = false;
      setStatus('');
    }, 3000);
  });
}

/* ============================================================
   TYPING ANIMATION
   Cycles through role strings with a typewriter effect
   ============================================================ */
function initTyping() {
  const el = document.querySelector('.typing-text');
  if (!el) return;
  if (prefersReducedMotion()) {
    el.textContent = 'Full-Stack Developer';
    return;
  }

  const texts = [
    'Frontend Developer',
    'Backend Developer',
    'Tech Enthusiast',
    'Problem Solver',
    'UI/UX Craftsman',
  ];
  let ti = 0, ci = 0, deleting = false;

  function type() {
    const current = texts[ti];
    if (deleting) {
      el.textContent = current.substring(0, ci - 1);
      ci--;
    } else {
      el.textContent = current.substring(0, ci + 1);
      ci++;
    }

    if (!deleting && ci === current.length) {
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
    if (deleting && ci === 0) {
      deleting = false;
      ti = (ti + 1) % texts.length;
    }
    setTimeout(type, deleting ? 55 : 105);
  }
  setTimeout(type, 900);
}

/* ============================================================
   CURSOR GLOW  (desktop only)
   Soft radial gradient that follows the mouse with lag
   ============================================================ */
function initCursorGlow() {
  if (window.innerWidth < 1024 || prefersReducedMotion() || isLowPowerMode()) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mx = 0, my = 0, cx = 0, cy = 0;
  let frame = 0;
  let lastFrameTime = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  (function animateGlow(now = 0) {
    frame = requestAnimationFrame(animateGlow);
    if (document.hidden || now - lastFrameTime < 33) return;
    lastFrameTime = now;
    cx = lerp(cx, mx, 0.09);
    cy = lerp(cy, my, 0.09);
    glow.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  })();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else frame = requestAnimationFrame(animateGlow);
  });

  // Grow on interactive elements
  document.querySelectorAll('a, button, .project-holo-panel').forEach(el => {
    el.addEventListener('mouseenter', () => glow.classList.add('cursor-glow--hover'));
    el.addEventListener('mouseleave', () => glow.classList.remove('cursor-glow--hover'));
  });
}

/* ============================================================
   HERO MOTION
   Decorative scroll depth for existing hero layers
   ============================================================ */
function initHeroMotion() {
  if (prefersReducedMotion()) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.to('.hero-ambient', {
    yPercent: 8,
    scale: 1.04,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  gsap.to('.hero-grid-overlay', {
    yPercent: -6,
    opacity: .55,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

/* ============================================================
   BOOT — DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Core systems
  scrollTracker.init();
  scrollTracker.registerSections(['hero', 'about', 'skills', 'certifications', 'projects', 'contact']);

  // UI
  initScrollReveal();
  initScrollProgress();
  initNavbar();
  initSkillsBelt();
  initContactForm();
  initTyping();
  initCursorGlow();
  initHeroMotion();
});
