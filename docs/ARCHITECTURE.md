# Architecture

A deep-dive into how the codebase is structured, why each decision was made, and how the pieces connect.

---

## Philosophy

- **Zero dependencies** — no React, no Vue, no GSAP, no bundler. Ships as-is.
- **ES Modules** — `import`/`export` for clean separation of concerns and tree-shaking potential.
- **Performance first** — every animation uses only `transform` + `opacity` (GPU composited). No layout-triggering properties (no `top`, `left`, `width`, `height` in animation loops).
- **Progressive enhancement** — the page is readable without JS. Animations layer on top.
- **Accessibility** — ARIA attributes, semantic HTML, reduced-motion support throughout.

---

## Module Map

```
js/
├── utils.js        Pure math functions — no DOM, no side effects
│                   lerp · clamp · easeInOutCubic · mapRange · debounce
│
├── scroll.js       Scroll tracker singleton
│                   - Listens to window scroll with rAF-gated updates
│                   - Computes scrollProgress [0..1] across full page
│                   - Detects active section; fires 'sectionChange' event
│                   - Exposes .on(fn) subscription API
│
├── animation.js    Three independent systems, all imported by main.js
│   ├── spaceAnimator   Scroll-driven satellite sweep (waypoint lerp)
│   ├── initParticles   Canvas floating star-dust
│   └── initScrollReveal IntersectionObserver fade-in
│
└── main.js         Boot file — imports everything, calls init()
    ├── initNavbar          Scroll glass + mobile toggle + active links
    ├── initCarousel        Keyboard / touch / autoplay project carousel
    ├── initSkillBars       IntersectionObserver bar animation
    ├── initContactForm     Client-side submit feedback
    ├── initTyping          Typewriter role animation
    ├── initCursorGlow      Lagged mouse radial glow (desktop only)
    └── initResizeHandler   Carousel breakpoint reset
```

---

## Z-Index Stack

| Layer | z-index | Elements |
|-------|---------|----------|
| Background | -1 | `.bg-gradient`, `.space-layer` (particles, nebulas), `#space-globe` |
| Satellite | 1 | `#space-satellite` — above section BGs, below content |
| Section content | 2 | `section .container`, `section > .section-inner` |
| Navbar | 100 | `.nav` |
| Preloader | 9999 | `.preloader` |

**Why sections don't have `z-index`:**  
If a section element has both `position: relative` and `z-index`, it creates a stacking context that completely isolates its children. Nothing from outside (like the satellite) can appear between the section and its children. By removing `z-index` from sections and only setting it on their `.container` wrappers, the satellite (at z-index 1) correctly appears above section backgrounds but below content (z-index 2).

---

## Satellite Animation System

```
scrollTracker.on(progress)
        │
        ▼
spaceAnimator._updateTargets(progress)
  - Finds surrounding waypoints A and B
  - Computes t = (progress - A.p) / (B.p - A.p)
  - Applies easeInOutCubic(t)
  - Sets _tgtX, _tgtY (viewport fraction → px)
  - Interpolates rotation via shortest-path angle
        │
        ▼
spaceAnimator._loop()  [rAF — every frame]
  - lerp(_cur*, _tgt*, 0.07) for smooth trailing
  - Applies transform: translate() rotate()
  - opacity: 0.92 constant (always visible)
```

**Waypoints** define the path as `{ p, x, y, rot }` where:
- `p` — scroll progress trigger (0 = top, 1 = bottom)
- `x` — viewport fraction from left (0.0–1.0)
- `y` — viewport fraction from top  (0.0–1.0)
- `rot` — satellite tilt in degrees

The `lerp` speed `0.07` creates a trailing lag. Increase it (e.g. `0.15`) for snappier following, decrease it (e.g. `0.03`) for more inertia.

---

## Globe

The Earth is **100% CSS** — no JS ever touches it.

```
#space-globe
  position: fixed; bottom: -28vw; right: -16vw;
  width: 88vw; max-width: 920px;
  z-index: -1;
  transform: none !important;   ← prevents any JS from moving it
```

The realistic texture is built from ~14 layered `radial-gradient()` calls:
- Deep ocean base
- Continental masses (Africa, Americas, Asia, Europe, Australia)
- Coastal shallow teal
- Polar ice caps
- Atmospheric haze at the limb

Two `::before`/`::after` pseudo-elements add cloud drift and specular highlight. The `cloudDrift` animation rotates the cloud layer at a different speed from the subtle hue-shift on the sphere body.

---

## Scroll Reveal

Uses a single `IntersectionObserver` watching all `.reveal`, `.reveal-left`, `.reveal-right` elements. When they enter the viewport (with a -55px bottom rootMargin so they trigger slightly early):

1. The element gets `.revealed` → CSS transitions `opacity` and `transform`
2. Any `.reveal-child` descendants get `.revealed` with staggered `transitionDelay` (80ms per child)

The observer `unobserve`s after triggering — once revealed, always revealed.

---

## CSS Architecture

```
base.css      Design tokens (:root) + reset + global utilities
              (buttons, tags, containers, reveal classes)
              Loaded first — sets the foundation.

space.css     All space elements:
              - .bg-gradient, .space-layer, .nebula, .shooting-star
              - #space-globe (Earth sphere, atmosphere, ring)
              - #space-satellite (ISS-style: truss, modules, solar arrays)
              Loaded second — overrides nothing in base.

sections.css  Per-section layout and component styles:
              .nav, #hero, #about, #skills, #projects, #contact, .footer
              Loaded last — most specific rules.
```

**No `!important` anywhere** except `transform: none !important` on `#space-globe` to explicitly block the old JS transform in case the file is patched.

---

## Adding a New Section

1. Add the HTML in `index.html` between existing sections
2. Register the section ID in `main.js`:
   ```js
   scrollTracker.registerSections(['hero','about','skills','projects','NEW_SECTION','contact']);
   ```
3. Add a nav link in the `<nav>` block
4. Add CSS in `sections.css`
5. Optionally add a waypoint in `animation.js` to route the satellite past it

---

## Adding a New Project Card

Copy an existing `<article class="project-card">` block in `index.html` and update:
- `project-num` span (e.g. `05 / 05`)
- `style="background:..."` on `.project-img` — use any gradient
- Emoji icon
- `.project-meta` tags
- `h3.project-title`
- `p.project-desc`
- `.project-tech` tags
- `href` on both action buttons

The carousel picks up new cards automatically — no JS changes needed.
