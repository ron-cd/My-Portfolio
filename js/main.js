/**
 * main.js — Entry point: wires all modules and boots the portfolio
 * ─────────────────────────────────────────────────────────────────
 * Author : Aaron Dela Cruz
 * Updated: 2025
 *
 * Load order (all deferred via type="module"):
 *   utils.js → scroll.js → animation.js → main.js
 */

'use strict';

import { lerp, debounce, prefersReducedMotion } from './utils.js';
import { scrollTracker }                         from './scroll.js';
import { spaceAnimator, initParticles, initScrollReveal } from './animation.js';

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

  // Mobile hamburger toggle
  toggle?.addEventListener('click', () => {
    const isOpen = links.classList.toggle('nav-links--open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
  });

  // Close menu on any link click (mobile)
  navAs.forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('nav-links--open');
      toggle?.setAttribute('aria-expanded', 'false');
      const icon = toggle?.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
    });
  });

  // Highlight active section link
  document.addEventListener('sectionChange', e => {
    const { section } = e.detail;
    navAs.forEach(a => {
      a.classList.toggle('active', !!section && a.getAttribute('href') === `#${section}`);
    });
  });
}

/* ============================================================
  PROJECTS CAROUSEL
  Keyboard, touch-swipe, auto-play, dot navigation
   ============================================================ */
function initCarousel() {
  const track  = document.getElementById('projects-track');
  const dotsEl = document.getElementById('carousel-dots');
  const prev   = document.querySelector('.carousel-prev');
  const next   = document.querySelector('.carousel-next');
  if (!track) return;

  const cards = [...track.querySelectorAll('.project-card')];
  if (!cards.length) return;

  let cur = 0, animating = false;

  // Build dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className    = `carousel-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to project ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl?.appendChild(dot);
  });

  function goTo(idx) {
    if (animating || window.innerWidth <= 768) return;
    animating = true;
    cur = (idx + cards.length) % cards.length;

    cards.forEach((card, i) => {
      card.classList.remove('active', 'prev', 'next');
      if      (i === cur)                                card.classList.add('active');
      else if (i === (cur - 1 + cards.length) % cards.length) card.classList.add('prev');
      else if (i === (cur + 1) % cards.length)           card.classList.add('next');
    });

    document.querySelectorAll('.carousel-dot')
      .forEach((d, i) => d.classList.toggle('active', i === cur));

    setTimeout(() => { animating = false; }, 520);
  }

  prev?.addEventListener('click', () => goTo(cur - 1));
  next?.addEventListener('click', () => goTo(cur + 1));

  // Keyboard arrows (only when projects section is visible)
  document.addEventListener('keydown', e => {
    const projectsEl = document.getElementById('projects');
    if (!projectsEl) return;
    const rect = projectsEl.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.5) {
      if (e.key === 'ArrowLeft')  goTo(cur - 1);
      if (e.key === 'ArrowRight') goTo(cur + 1);
    }
  });

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) goTo(delta > 0 ? cur + 1 : cur - 1);
  });

  // Auto-play; pause on hover
  let autoPlay = setInterval(() => goTo(cur + 1), 4200);
  track.addEventListener('mouseenter', () => clearInterval(autoPlay));
  track.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => goTo(cur + 1), 4200);
  });

  goTo(0);
}

/* ============================================================
  SKILL BARS
  Animate width when bar scrolls into view
   ============================================================ */
function initSkillBars() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      bar.style.width = (bar.dataset.width || '0') + '%';
      observer.unobserve(bar);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-fill').forEach(bar => {
    bar.style.width = '0';
    observer.observe(bar);
  });
}

/* ============================================================
  CONTACT FORM
  Client-side submit feedback (no backend wired here yet)
  See docs/DEPLOYMENT.md for how to connect a form service
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('submit-btn');
  if (!form || !btn) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
    btn.classList.add('sent');
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('sent');
      btn.disabled = false;
      form.reset();
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
  if (window.innerWidth < 768 || prefersReducedMotion()) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function animateGlow() {
    cx = lerp(cx, mx, 0.09);
    cy = lerp(cy, my, 0.09);
    glow.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateGlow);
  })();

  // Grow on interactive elements
  document.querySelectorAll('a, button, .project-card, .skill-icon').forEach(el => {
    el.addEventListener('mouseenter', () => glow.classList.add('cursor-glow--hover'));
    el.addEventListener('mouseleave', () => glow.classList.remove('cursor-glow--hover'));
  });
}

/* ============================================================
  RESIZE HANDLER
  Resets carousel state when crossing the mobile breakpoint
   ============================================================ */
function initResizeHandler() {
  window.addEventListener('resize', debounce(() => {
    const isMobile = window.innerWidth <= 768;
    const cards    = document.querySelectorAll('.project-card');
    if (isMobile) {
      cards.forEach(c => c.classList.remove('active', 'prev', 'next'));
    } else {
      const hasActive = [...cards].some(c => c.classList.contains('active'));
      if (!hasActive && cards[0]) cards[0].classList.add('active');
    }
  }, 150));
}

/* ============================================================
  BOOT — DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Core systems
  scrollTracker.registerSections(['hero', 'about', 'skills', 'certifications', 'projects', 'contact']);
  scrollTracker.init();
  scrollTracker._detectActive();

  // Space
  spaceAnimator.init();
  initParticles();

  // UI
  initScrollReveal();
  initNavbar();
  initCarousel();
  initSkillBars();
  initContactForm();
  initTyping();
  initCursorGlow();
  initResizeHandler();

  // Remove preloader
  setTimeout(() => document.body.classList.add('loaded'), 600);
});
