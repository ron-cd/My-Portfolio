/**
 * animation.js — GSAP ScrollTrigger reveals and section animations
 * ─────────────────────────────────────────────────────────────────
 * Author  : Aaron Dela Cruz
 * Updated : 2026
 *
 * EXPORTS
 *   initScrollReveal()  — called from main.js on DOMContentLoaded
 *
 * SECTIONS
 * ────────────────────────────────────────────────────────────────
 * 1. setSkillBarsToFinalWidth() — fallback for reduced-motion / no-GSAP
 * 2. initScrollReveal()         — coordinates all scroll animations:
 *      a. revealFrom()          — generic enter-from utility
 *      b. Skill bar fills       — width tween on scroll into view
 *      c. Hero entrance         — staggered fade-up of hero elements
 *      d. initCertGallery()     — scroll-pinned card-stack for certs
 *      e. initProjectsDock()    — scroll-pinned hologram project viewer
 * 3. initProjectsDock()         — projects hologram: panel switching,
 *                                 dot navigation, GSAP pin + scrub
 * 4. initProjectHologramCanvas()— Three.js WebGL hologram sphere
 * 5. createGlowTexture()        — canvas glow sprite for Three.js
 * 6. initCertGallery()          — GSAP-pinned cert card stack
 */
'use strict';

import { prefersReducedMotion } from './utils.js';

function setSkillBarsToFinalWidth() {
  document.querySelectorAll('.skill-fill').forEach(bar => {
    bar.style.width = (bar.dataset.width || '0') + '%';
  });
}

function initScrollReveal() {
  if (prefersReducedMotion()) {
    setSkillBarsToFinalWidth();
    initCertGallery();
    return;
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    setSkillBarsToFinalWidth();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  function revealFrom(selector, fromVars, extraVars = {}) {
    gsap.utils.toArray(selector).forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) return;

      gsap.fromTo(el,
        { ...fromVars, immediateRender: false },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: extraVars.duration || 0.75,
          delay: extraVars.delay || (i * (extraVars.stagger || 0)),
          ease: extraVars.ease || 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
            once: true,
          },
        }
      );
    });
  }

  const compactReveal = window.matchMedia('(max-width: 760px)').matches;

  revealFrom('.reveal', { opacity: 0, y: compactReveal ? 20 : 32 });
  revealFrom('.reveal-left', compactReveal ? { opacity: 0, y: 22 } : { opacity: 0, x: -44 });
  revealFrom('.reveal-right', compactReveal ? { opacity: 0, y: 22 } : { opacity: 0, x: 44 });
  revealFrom('.reveal-child', { opacity: 0, y: 20 }, { duration: 0.5, stagger: 0.08 });

  gsap.utils.toArray('.skill-fill').forEach(bar => {
    const rect = bar.getBoundingClientRect();
    const targetWidth = (bar.dataset.width || '0') + '%';
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      gsap.set(bar, { width: targetWidth });
      return;
    }
    gsap.fromTo(bar,
      { width: '0%' },
      {
        width: targetWidth,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 88%', once: true },
      }
    );
  });

  initCertGallery();
  initProjectsDock();

  gsap.from(['.hero-eyebrow', '.hero-title', '.hero-desc', '.hero-cta'], {
    y: 28,
    opacity: 0,
    duration: 0.75,
    ease: 'power2.out',
    stagger: 0.1,
    delay: 0.5,
    clearProps: 'all',
  });
  gsap.from('.hero-badge', { y: 12, opacity: 0, duration: 0.6, stagger: 0.15, delay: 0.9, clearProps: 'all' });
  gsap.from('.hero-card', { x: 20, opacity: 0, duration: 0.7, delay: 1.0, clearProps: 'all' });
  gsap.from('.hero-strip', { y: 24, opacity: 0, duration: 0.7, delay: 0.95, clearProps: 'all' });
}

function initProjectsDock() {
  const stage = document.getElementById('projects-dock');
  if (!stage) return;

  const panels = [...stage.querySelectorAll('[data-project-card]')];
  if (!panels.length) return;

  const dots = [...stage.querySelectorAll('[data-holo-jump]')];
  const labels = {
    a: stage.querySelector('.project-holo-label-a [data-holo-label-a]'),
    b: stage.querySelector('.project-holo-label-b [data-holo-label-b]'),
    c: stage.querySelector('.project-holo-label-c [data-holo-label-c]'),
  };
  const status = stage.querySelector('[data-holo-status]');
  const icon = stage.querySelector('[data-holo-icon] i');
  const shell = stage.querySelector('[data-holo-shell]');
  const canvas = stage.querySelector('#projects-hologram-canvas');
  const reduceMotion = prefersReducedMotion();
  const compactMedia = window.matchMedia('(max-width: 760px)');

  const projects = panels.map((panel, index) => ({
    index,
    color: panel.dataset.holoColor || '#2df8ff',
    accent: panel.dataset.holoAccent || '#00d4aa',
    icon: panel.dataset.holoIcon || 'fas fa-globe',
    labelA: panel.dataset.holoLabelA || 'Project Core',
    labelB: panel.dataset.holoLabelB || 'Orbit Path',
    labelC: panel.dataset.holoLabelC || 'Telemetry',
  }));

  let activeIndex = 0;
  let switchTimer = null;
  let scrollTriggerInstance = null;
  let visualParallaxTween = null;
  let compactLayout = compactMedia.matches;
  let showAllPanels = reduceMotion || compactLayout;
  const hologram = initProjectHologramCanvas({
    canvas,
    stage,
    shell,
    projects,
    reduceMotion,
  });

  function setPanelAccessibility(index) {
    panels.forEach((panel, i) => {
      if (showAllPanels) {
        panel.removeAttribute('aria-hidden');
        return;
      }
      panel.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
  }

  function pulseStage() {
    stage.classList.add('is-switching');
    window.clearTimeout(switchTimer);
    switchTimer = window.setTimeout(() => stage.classList.remove('is-switching'), 540);
  }

  function syncProject(index, shouldPulse = true) {
    const nextIndex = Math.max(0, Math.min(index, projects.length - 1));
    const project = projects[nextIndex];
    const changed = nextIndex !== activeIndex;
    activeIndex = nextIndex;

    stage.dataset.activeProject = String(nextIndex);
    stage.style.setProperty('--project-holo-color', project.color);
    stage.style.setProperty('--project-holo-accent', project.accent);

    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === nextIndex));
    dots.forEach((dot, i) => {
      const isActive = i === nextIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    setPanelAccessibility(nextIndex);

    if (labels.a) labels.a.textContent = project.labelA;
    if (labels.b) labels.b.textContent = project.labelB;
    if (labels.c) labels.c.textContent = project.labelC;
    if (status) status.textContent = `Mode ${String(nextIndex + 1).padStart(2, '0')}`;
    if (icon) icon.className = project.icon;

    hologram?.setMode(nextIndex, shouldPulse && changed);
    if (shouldPulse && changed) pulseStage();
  }

  function jumpToProject(index) {
    if (!scrollTriggerInstance) {
      syncProject(index);
      return;
    }

    const progress = projects.length > 1 ? index / (projects.length - 1) : 0;
    const top = scrollTriggerInstance.start + (scrollTriggerInstance.end - scrollTriggerInstance.start) * progress;
    window.scrollTo({
      top,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  syncProject(0, false);

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      jumpToProject(Number(dot.dataset.holoJump || 0));
    });
  });

  if (reduceMotion) {
    stage.classList.add('project-holo-reduced');
    return;
  }

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.fromTo(stage.querySelectorAll('.project-holo-console, .project-holo-visual'),
    { opacity: 0, y: 34 },
    {
      opacity: 1,
      y: 0,
      duration: .9,
      ease: 'power3.out',
      stagger: .12,
      scrollTrigger: { trigger: stage, start: 'top 78%', once: true },
    }
  );

  function createScrollTriggers() {
    if (compactLayout || scrollTriggerInstance) return;

    visualParallaxTween = gsap.to(stage.querySelector('.project-holo-visual'), {
      yPercent: -3,
      ease: 'none',
      scrollTrigger: {
        trigger: stage,
        start: 'top top+=72',
        end: () => `+=${Math.round(window.innerHeight * (projects.length + .7))}`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: stage,
      start: 'top top+=72',
      end: () => `+=${Math.round(window.innerHeight * (projects.length + .7))}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1.05,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const nextIndex = Math.min(projects.length - 1, Math.floor(self.progress * projects.length));
        syncProject(nextIndex, true);
        hologram?.setScrollProgress(self.progress);
      },
      onRefresh: () => {
        syncProject(0, false);
        hologram?.setScrollProgress(0);
      },
    });
  }

  function destroyScrollTriggers() {
    if (visualParallaxTween) {
      visualParallaxTween.scrollTrigger?.kill();
      visualParallaxTween.kill();
      visualParallaxTween = null;
    }

    gsap.set(stage.querySelector('.project-holo-visual'), { clearProps: 'transform' });

    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  }

  function applyResponsiveMode() {
    compactLayout = compactMedia.matches;
    showAllPanels = reduceMotion || compactLayout;
    stage.classList.toggle('project-holo-compact', showAllPanels);
    setPanelAccessibility(activeIndex);

    if (compactLayout) {
      destroyScrollTriggers();
    } else {
      createScrollTriggers();
    }

    ScrollTrigger.refresh();
  }

  if (compactMedia.addEventListener) {
    compactMedia.addEventListener('change', applyResponsiveMode);
  } else if (compactMedia.addListener) {
    compactMedia.addListener(applyResponsiveMode);
  }
  applyResponsiveMode();
}

/* Projects Three.js hologram core */
function initProjectHologramCanvas({ canvas, stage, shell, projects, reduceMotion }) {
  const Three = window.THREE;
  if (!canvas || !Three || !projects.length) {
    stage.classList.add('project-holo-no-webgl');
    return null;
  }

  let renderer;
  try {
    renderer = new Three.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    stage.classList.add('project-holo-no-webgl');
    return null;
  }

  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(42, 1, .1, 100);
  camera.position.set(0, .25, 7);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const root = new Three.Group();
  const core = new Three.Group();
  const latitudeGroup = new Three.Group();
  const ringGroup = new Three.Group();
  const nodeGroup = new Three.Group();
  root.position.y = .45;
  root.add(core, latitudeGroup, ringGroup, nodeGroup);
  scene.add(root);

  const currentColor = new Three.Color(projects[0].color);
  const targetColor = new Three.Color(projects[0].color);
  let activeIndex = 0;
  let burst = 0;
  let ringBoost = 0;
  let scrollProgress = 0;
  let targetScale = 1;
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  const additive = Three.AdditiveBlending;
  const wireMaterial = new Three.MeshBasicMaterial({
    color: currentColor,
    wireframe: true,
    transparent: true,
    opacity: .72,
    blending: additive,
    depthWrite: false,
  });
  const shellMaterial = new Three.MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: .085,
    blending: additive,
    depthWrite: false,
  });
  const lineMaterial = new Three.MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: .52,
    blending: additive,
    depthWrite: false,
  });
  const particleMaterial = new Three.PointsMaterial({
    color: currentColor,
    size: .026,
    transparent: true,
    opacity: .82,
    blending: additive,
    depthWrite: false,
  });
  const nodeMaterial = new Three.MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: .9,
    blending: additive,
    depthWrite: false,
  });

  const coreGeometry = new Three.SphereGeometry(1.42, 56, 28);
  core.add(new Three.Mesh(coreGeometry, shellMaterial));
  core.add(new Three.Mesh(coreGeometry, wireMaterial));

  [-1.12, -.84, -.56, -.28, 0, .28, .56, .84, 1.12].forEach(y => {
    const radius = Math.sqrt(Math.max(0.08, 1.42 * 1.42 - y * y));
    const latitude = new Three.Mesh(new Three.TorusGeometry(radius, .0045, 6, 112), lineMaterial);
    latitude.rotation.x = Math.PI / 2;
    latitude.position.y = y;
    latitudeGroup.add(latitude);
  });

  [
    { radius: 1.88, rotation: [Math.PI / 2.7, .15, .1] },
    { radius: 2.08, rotation: [Math.PI / 2, .65, .32] },
    { radius: 2.34, rotation: [Math.PI / 1.8, -.34, -.18] },
  ].forEach(config => {
    const ring = new Three.Mesh(new Three.TorusGeometry(config.radius, .006, 8, 160), lineMaterial);
    ring.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    ringGroup.add(ring);
  });

  const particleCount = 420;
  const basePositions = new Float32Array(particleCount * 3);
  const burstWeights = new Float32Array(particleCount);
  const particlePhases = new Float32Array(particleCount);
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const radius = 1.45 + Math.random() * .04;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const offset = i * 3;
    basePositions[offset] = x;
    basePositions[offset + 1] = y;
    basePositions[offset + 2] = z;
    particlePositions[offset] = x;
    particlePositions[offset + 1] = y;
    particlePositions[offset + 2] = z;
    burstWeights[i] = .18 + Math.random() * .72;
    particlePhases[i] = Math.random() * Math.PI * 2;
  }

  const particleGeometry = new Three.BufferGeometry();
  particleGeometry.setAttribute('position', new Three.BufferAttribute(particlePositions, 3));
  core.add(new Three.Points(particleGeometry, particleMaterial));

  const nodeGeometry = new Three.SphereGeometry(.045, 14, 14);
  for (let i = 0; i < 8; i++) {
    const node = new Three.Mesh(nodeGeometry, nodeMaterial);
    node.userData = {
      phase: (i / 8) * Math.PI * 2,
      radius: 1.9 + (i % 3) * .18,
      lift: -.65 + (i % 4) * .42,
      speed: .3 + (i % 4) * .05,
    };
    nodeGroup.add(node);
  }

  const beamMaterial = new Three.MeshBasicMaterial({
    color: currentColor,
    transparent: true,
    opacity: .055,
    side: Three.DoubleSide,
    blending: additive,
    depthWrite: false,
  });
  const beam = new Three.Mesh(new Three.ConeGeometry(1.25, 2.8, 64, 1, true), beamMaterial);
  beam.position.y = -1.28;
  root.add(beam);

  const glow = new Three.Sprite(new Three.SpriteMaterial({
    map: createGlowTexture(Three),
    color: currentColor,
    transparent: true,
    opacity: .58,
    blending: additive,
    depthWrite: false,
  }));
  glow.scale.set(4.3, 4.3, 1);
  glow.position.y = .02;
  root.add(glow);

  const materials = [wireMaterial, shellMaterial, lineMaterial, particleMaterial, nodeMaterial, beamMaterial, glow.material];
  const clock = new Three.Clock();
  let frame = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderFrame() {
    renderer.render(scene, camera);
  }

  function updateMaterials() {
    currentColor.lerp(targetColor, .075);
    materials.forEach(material => material.color.copy(currentColor));
  }

  function updateParticles(time) {
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      const offset = i * 3;
      const shimmer = Math.sin(time * 2.2 + particlePhases[i]) * .018;
      const scrollLift = Math.sin(scrollProgress * Math.PI * 2 + particlePhases[i]) * .018;
      const factor = 1 + shimmer + scrollLift + burst * burstWeights[i] * .46;
      positions[offset] = basePositions[offset] * factor;
      positions[offset + 1] = basePositions[offset + 1] * factor;
      positions[offset + 2] = basePositions[offset + 2] * factor;
    }
    particleGeometry.attributes.position.needsUpdate = true;
  }

  function animate() {
    const delta = Math.min(clock.getDelta(), .033);
    const time = clock.elapsedTime;
    mouse.x += (targetMouse.x - mouse.x) * .08;
    mouse.y += (targetMouse.y - mouse.y) * .08;
    burst *= .92;
    ringBoost *= .9;

    updateMaterials();
    updateParticles(time);

    const pulse = Math.sin(time * 2.8) * .5 + .5;
    const desiredScale = targetScale + burst * .11 + pulse * .018;
    core.scale.lerp(new Three.Vector3(desiredScale, desiredScale, desiredScale), .08);
    latitudeGroup.scale.copy(core.scale);

    core.rotation.y += delta * (.22 + ringBoost * .65 + activeIndex * .025);
    core.rotation.x = Math.sin(time * .52) * .055 + mouse.y * .16;
    latitudeGroup.rotation.y = core.rotation.y * .72;
    ringGroup.rotation.x += delta * (.12 + ringBoost * .7);
    ringGroup.rotation.y -= delta * (.16 + ringBoost * .45);
    nodeGroup.rotation.y += delta * (.2 + ringBoost * .35);
    beam.rotation.y -= delta * .14;
    beam.material.opacity = .045 + pulse * .04 + burst * .09;
    glow.material.opacity = .44 + pulse * .16 + burst * .18;

    root.rotation.y += (mouse.x * .24 - root.rotation.y) * .07;
    root.rotation.x += (mouse.y * .12 - root.rotation.x) * .07;
    root.position.y = .45 + Math.sin(time * 1.2) * .035 + Math.sin(scrollProgress * Math.PI) * .08;

    nodeGroup.children.forEach((node, i) => {
      const phase = node.userData.phase + time * node.userData.speed + activeIndex * .42;
      const radius = node.userData.radius + Math.sin(time + i) * .04;
      node.position.set(
        Math.cos(phase) * radius,
        node.userData.lift + Math.sin(phase * 1.7) * .16,
        Math.sin(phase) * radius
      );
      const scale = 1 + pulse * .3 + burst * .8;
      node.scale.setScalar(scale);
    });

    renderFrame();
    frame = window.requestAnimationFrame(animate);
  }

  function setMode(index, shouldPulse = true) {
    activeIndex = index;
    const project = projects[index] || projects[0];
    targetColor.set(project.color);
    targetScale = [1, .94, 1.06, .98][index] || 1;
    ringBoost = Math.max(ringBoost, shouldPulse ? 1 : .28);
    if (shouldPulse) burst = 1;
  }

  function setScrollProgress(value) {
    scrollProgress = value;
    ringBoost = Math.max(ringBoost, .16);
  }

  function handlePointerMove(event) {
    if (reduceMotion) return;
    const rect = stage.getBoundingClientRect();
    targetMouse.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    targetMouse.y = ((event.clientY - rect.top) / rect.height - .5) * -2;
    if (shell) {
      shell.style.transform = `rotateX(${targetMouse.y * 4}deg) rotateY(${targetMouse.x * -5}deg)`;
    }
  }

  function handlePointerLeave() {
    targetMouse.x = 0;
    targetMouse.y = 0;
    if (shell) shell.style.transform = '';
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  stage.addEventListener('pointermove', handlePointerMove, { passive: true });
  stage.addEventListener('pointerleave', handlePointerLeave, { passive: true });

  if (reduceMotion) {
    updateMaterials();
    renderFrame();
  } else {
    animate();
  }

  window.setTimeout(() => stage.classList.add('is-webgl-ready'), 180);

  return {
    setMode,
    setScrollProgress,
    destroy() {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
      renderer.dispose();
      coreGeometry.dispose();
      particleGeometry.dispose();
      nodeGeometry.dispose();
    },
  };
}

function createGlowTexture(Three) {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const context = glowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,.92)');
  gradient.addColorStop(.28, 'rgba(255,255,255,.34)');
  gradient.addColorStop(.72, 'rgba(255,255,255,.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new Three.CanvasTexture(glowCanvas);
  texture.needsUpdate = true;
  return texture;
}

function initCertGallery() {
  const scene = document.querySelector('.cert-stack-scene');
  if (!scene) return;

  const cards = [...scene.querySelectorAll('.cert-stack-card')];
  if (!cards.length) return;

  const reduceMotion = prefersReducedMotion();
  const surfaces = cards.map(card => card.querySelector('.cert-card-surface'));
  const mediaImages = cards.map(card => card.querySelector('.cert-media img'));
  const bodies = cards.map(card => card.querySelector('.cert-body'));
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let currentActiveIndex = -1;

  function setCompactCards() {
    scene.classList.add('cert-stack-compact');
    cards.forEach((card, index) => {
      card.classList.add('is-active');
      card.setAttribute('aria-hidden', 'false');
      card.style.opacity = '';
      card.style.filter = '';
      card.style.transform = '';
      card.style.zIndex = '';
      surfaces[index]?.removeAttribute('style');
      mediaImages[index]?.removeAttribute('style');
      bodies[index]?.removeAttribute('style');
      card.querySelectorAll('a, button').forEach(control => {
        control.removeAttribute('tabindex');
      });
    });
  }

  function setLayering(activeIndex) {
    cards.forEach((card, index) => {
      if (index === activeIndex) {
        card.style.zIndex = String(100 + index);
        return;
      }

      if (index < activeIndex) {
        card.style.zIndex = String(80 - (activeIndex - index));
        return;
      }

      card.style.zIndex = String(60 - (index - activeIndex));
    });
  }

  function setActive(activeIndex) {
    if (currentActiveIndex === activeIndex) return;
    currentActiveIndex = activeIndex;
    setLayering(activeIndex);

    cards.forEach((card, index) => {
      const isActive = index === activeIndex;
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      card.querySelectorAll('a, button').forEach(control => {
        if (isActive) {
          control.removeAttribute('tabindex');
        } else {
          control.setAttribute('tabindex', '-1');
        }
      });
    });
  }

  if (mobileQuery.matches) {
    setCompactCards();
    return;
  }

  if (reduceMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    cards.forEach((card, index) => {
      const depth = Math.min(index, 4);
      card.style.opacity = String(Math.max(0.42, 1 - depth * 0.1));
      card.style.filter = depth ? `blur(${Math.min(depth * 0.28, 1.1)}px)` : 'none';
      card.style.transform = `translate3d(${(index % 2 ? 1 : -1) * depth * 9}px, ${depth * 18}px, ${depth * -42}px) scale(${1 - depth * 0.035}) rotate(${(index % 2 ? 1 : -1) * depth * 1.35}deg)`;
    });
    setActive(0);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const count = cards.length;
  const cardTilts = [-1.4, 1.8, -2.2, 1.3, -1.7, 2.1, -1.1];
  let scrollTriggerInstance;
  let tl;
  let surfaceMotionReady = false;

  function getMetrics() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = mobileQuery.matches;
    const isNarrow = width <= 480;
    const isShort = height <= 700;

    return {
      incomingY: isMobile ? (isShort ? 132 : 168) : 250,
      incomingX: isMobile ? (isNarrow ? 7 : 10) : 24,
      backY: isMobile ? (isShort ? 9 : 12) : 18,
      backX: isMobile ? (isNarrow ? 3 : 4) : 7,
      backZ: isMobile ? -34 : -78,
      scaleStep: isMobile ? (isNarrow ? 0.026 : 0.03) : 0.046,
      opacityStep: isMobile ? 0.1 : 0.17,
      blurStep: isMobile ? 0.22 : 0.48,
      scrollPerCard: isMobile ? (isShort ? 240 : 280) : 430,
      mediaIncomingY: isMobile ? (isShort ? 9 : 13) : 28,
      mediaLift: isMobile ? 3 : 8,
      bodyIncomingY: isMobile ? (isShort ? 7 : 9) : 18,
      transitionDuration: isMobile ? 0.72 : 0.78,
      focusHold: isMobile ? (isShort ? 0.48 : 0.58) : 0.68,
    };
  }

  function cardState(activeIndex, cardIndex, metrics) {
    const tilt = cardTilts[cardIndex % cardTilts.length];

    if (cardIndex === activeIndex) {
      return {
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        rotation: tilt * 0.38,
        rotateX: 0,
        opacity: 1,
        filter: 'blur(0px)',
      };
    }

    if (cardIndex < activeIndex) {
      const depth = activeIndex - cardIndex;
      const side = cardIndex % 2 ? 1 : -1;

      return {
        x: side * depth * metrics.backX,
        y: depth * metrics.backY,
        z: depth * metrics.backZ,
        scale: Math.max(0.76, 1 - depth * metrics.scaleStep),
        rotation: tilt - side * depth * 0.38,
        rotateX: Math.min(depth * 1.6, 6),
        opacity: Math.max(0.58, 1 - depth * metrics.opacityStep),
        filter: `blur(${Math.min(depth * metrics.blurStep, 1.7)}px)`,
      };
    }

    const depth = cardIndex - activeIndex;
    const side = cardIndex % 2 ? 1 : -1;

    return {
      x: side * depth * metrics.incomingX * 0.58,
      y: 42 + depth * (metrics.incomingY * 0.18),
      z: -58 - depth * 28,
      scale: Math.max(0.78, 0.96 - depth * 0.024),
      rotation: tilt * 1.05,
      rotateX: -2.8,
      opacity: Math.max(0.42, 0.76 - depth * 0.07),
      filter: `blur(${Math.min(0.42 + depth * 0.22, 1.45)}px)`,
    };
  }

  function buildTimeline(progress = 0) {
    const metrics = getMetrics();
    const nextTimeline = gsap.timeline({ paused: true });

    cards.forEach((card, index) => {
      gsap.set(card, {
        ...cardState(0, index, metrics),
        force3D: true,
      });
    });
    setLayering(Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1)))));

    surfaces.forEach((surface, index) => {
      if (!surface) return;
      gsap.set(surface, {
        transformPerspective: 900,
        transformOrigin: 'center center',
        z: index === 0 ? 0 : -8,
      });
    });

    mediaImages.forEach((image, index) => {
      if (!image) return;
      gsap.set(image, {
        y: index === 0 ? -metrics.mediaLift : metrics.mediaIncomingY,
        scale: index === 0 ? 1.035 : 1.08,
      });
    });

    bodies.forEach((body, index) => {
      if (!body) return;
      gsap.set(body, {
        y: index === 0 ? 0 : metrics.bodyIncomingY,
        opacity: index === 0 ? 1 : 0.72,
      });
    });

    for (let activeIndex = 1; activeIndex < count; activeIndex += 1) {
      const stepDuration = metrics.transitionDuration + metrics.focusHold;
      const start = (activeIndex - 1) * stepDuration;

      for (let cardIndex = 0; cardIndex < count; cardIndex += 1) {
        nextTimeline.to(cards[cardIndex], {
          ...cardState(activeIndex, cardIndex, metrics),
          duration: metrics.transitionDuration,
          ease: 'power3.out',
        }, start);

        const image = mediaImages[cardIndex];
        if (image) {
          const passedDepth = Math.max(activeIndex - cardIndex, 0);
          const incomingDepth = Math.max(cardIndex - activeIndex, 0);
          nextTimeline.to(image, {
            y: cardIndex === activeIndex
              ? -metrics.mediaLift
              : passedDepth
                ? passedDepth * 6
                : metrics.mediaIncomingY + incomingDepth * 5,
            scale: cardIndex === activeIndex
              ? 1.035
              : passedDepth
                ? Math.max(0.98, 1.02 - passedDepth * 0.01)
                : Math.max(1.01, 1.06 - incomingDepth * 0.012),
            duration: metrics.transitionDuration,
            ease: 'power3.out',
          }, start);
        }

        const body = bodies[cardIndex];
        if (body) {
          const passedDepth = Math.max(activeIndex - cardIndex, 0);
          const incomingDepth = Math.max(cardIndex - activeIndex, 0);
          nextTimeline.to(body, {
            y: cardIndex === activeIndex
              ? 0
              : passedDepth
                ? Math.max(-10, -4 * passedDepth)
                : metrics.bodyIncomingY + incomingDepth * 5,
            opacity: cardIndex === activeIndex
              ? 1
              : passedDepth
                ? Math.max(0.56, 0.86 - passedDepth * 0.1)
                : Math.max(0.46, 0.74 - incomingDepth * 0.06),
            duration: metrics.transitionDuration * 0.82,
            ease: 'power3.out',
          }, start + (cardIndex === activeIndex ? 0.12 : 0));
        }
      }
    }

    nextTimeline.set({}, {}, Math.max(0.01, (count - 1) * (metrics.transitionDuration + metrics.focusHold)));
    nextTimeline.progress(progress);
    return nextTimeline;
  }

  function updateActiveFromProgress(progress) {
    const metrics = getMetrics();
    const stepDuration = metrics.transitionDuration + metrics.focusHold;
    const totalDuration = Math.max(0.01, (count - 1) * stepDuration);
    const time = progress * totalDuration;
    const segmentIndex = Math.min(count - 1, Math.floor(time / stepDuration));
    const segmentProgress = time - segmentIndex * stepDuration;
    const isNextSettled = segmentProgress >= metrics.transitionDuration * 0.58;
    const activeIndex = Math.min(count - 1, segmentIndex + (isNextSettled ? 1 : 0));
    setActive(activeIndex);
    setLayering(activeIndex);
  }

  function initSurfaceMotion() {
    if (surfaceMotionReady) return;
    surfaceMotionReady = true;

    surfaces.forEach((surface, index) => {
      if (!surface) return;
      gsap.to(surface, {
        y: index % 2 ? 4 : -4,
        duration: 3.2 + index * 0.22,
        delay: index * 0.08,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    cards.forEach((card, index) => {
      const surface = surfaces[index];
      if (!surface) return;

      const tiltX = gsap.quickTo(surface, 'rotationX', { duration: 0.42, ease: 'power3.out' });
      const tiltY = gsap.quickTo(surface, 'rotationY', { duration: 0.42, ease: 'power3.out' });

      card.addEventListener('pointermove', event => {
        if (!card.classList.contains('is-active')) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        tiltY(x * 8);
        tiltX(y * -5);
      });

      card.addEventListener('pointerleave', () => {
        tiltX(0);
        tiltY(0);
      });
    });
  }

  function destroyPinnedGallery() {
    scrollTriggerInstance?.kill();
    scrollTriggerInstance = null;
    tl?.kill();
    tl = null;
  }

  function createPinnedGallery(progress = 0) {
    if (mobileQuery.matches) {
      setCompactCards();
      return;
    }

    scene.classList.remove('cert-stack-compact');
    destroyPinnedGallery();
    tl = buildTimeline(progress);
    updateActiveFromProgress(progress);
    initSurfaceMotion();

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: () => `+=${Math.max(1, count - 1) * getMetrics().scrollPerCard}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.95,
      onUpdate: self => {
        tl.progress(self.progress);
        updateActiveFromProgress(self.progress);
      },
      onRefresh: self => {
        tl.progress(self.progress);
        updateActiveFromProgress(self.progress);
      },
      invalidateOnRefresh: true,
    });
  }

  createPinnedGallery(0);

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', () => {
      if (mobileQuery.matches) {
        destroyPinnedGallery();
        setCompactCards();
        ScrollTrigger.refresh();
        return;
      }

      createPinnedGallery(0);
      ScrollTrigger.refresh();
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!scrollTriggerInstance) return;
      const progress = scrollTriggerInstance.progress || 0;
      tl?.kill();
      tl = buildTimeline(progress);
      updateActiveFromProgress(progress);
      ScrollTrigger.refresh();
    }, 140);
  }, { passive: true });
}

export { initScrollReveal };
