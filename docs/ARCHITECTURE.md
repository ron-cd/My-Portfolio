# Architecture

This portfolio is a static site with focused JavaScript modules. There is no bundler and no framework runtime.

## Runtime Layers

```text
index.html
├── css/base.css            — tokens, reset, utilities
├── css/space.css           — space background and satellite canvas defaults
├── css/sections.css        — all section & component styles
├── libs/gsap.min.js        — GSAP core
├── libs/ScrollTrigger.min.js
├── libs/three.min.js       — Three.js r139 (UMD build)
├── libs/OBJLoader.js
├── js/space-bg.js          — canvas starfield (deferred)
├── js/satellite.js         — Three.js satellite renderer (deferred)
└── js/main.js              — entry point (type="module")
     ├── imports utils.js
     ├── imports scroll.js
     └── imports animation.js
```

## CSS Responsibilities

| File | Purpose | Edit when… |
|---|---|---|
| `base.css` | Design tokens, reset, typography helpers, buttons, containers | Changing brand colours, fonts, or global spacing |
| `space.css` | Fixed background layer and satellite loader defaults | Adjusting starfield or satellite loading UI |
| `sections.css` | Section layouts, all components, responsive hardening | Adding or styling new sections/components |

Production breakpoint overrides live late in `sections.css` and intentionally override component defaults.

**CSS Table of Contents** (in `sections.css`):
1. Navbar
2. Hero
3. About
4. Skills
5. Contact
6. Footer
7. Certifications
8. Premium About (orbit card)
9. Skills Belt
10. Projects — Hologram Projection Interface
11. Responsive Hardening (1440px → 380px + landscape)

## JavaScript Responsibilities

| File | Purpose |
|---|---|
| `main.js` | App boot: navbar, typing text, contact form, cursor glow, hero parallax |
| `animation.js` | GSAP scroll reveals, skill bar fills, cert gallery, projects hologram |
| `satellite.js` | Three.js satellite renderer, model loading, drag rotation, scroll path |
| `space-bg.js` | Canvas starfield, nebulae, Milky Way, shooting stars |
| `scroll.js` | Scroll progress tracking, active-section detection, `sectionChange` events |
| `utils.js` | Shared math/motion helpers: `lerp`, `clamp`, `debounce`, `prefersReducedMotion` |

## Z-Index Model

| Layer | z-index | Purpose |
|---|---|---|
| Space background | -2 to -1 | Gradients and canvas starfield |
| Satellite canvas | 1 | Fixed Three.js satellite |
| Section content | 2+ | Readable UI above decorative layers |
| Navbar | 100 | Persistent navigation |
| Preloader | 9999 | Initial loading screen |
| Skip link | 10000 | Accessibility shortcut |

Avoid adding `z-index` directly to full `<section>` elements unless necessary. Section-level stacking contexts can trap the satellite behind content.

## Satellite System

`js/satellite.js` owns the Three.js satellite. It loads `assets/satellite/Satellite.obj`, applies the texture maps in `assets/satellite/textures/`, and animates a fixed canvas through GSAP ScrollTrigger.

Three responsive waypoint profiles:
- `WAYPOINTS.desktop`
- `WAYPOINTS.tablet`
- `WAYPOINTS.mobile`

**Rule:** All profiles must have the same number of waypoints with matching `p` values. ScrollTrigger safely refreshes positions on viewport change.

```js
// Example waypoint shape
{ p: 0.60, x: 0.88, y: 0.70, rotZ: -52, scale: 0.72 }
// p     = page scroll progress [0..1]
// x, y  = viewport fractions
// rotZ  = canvas tilt in degrees
// scale = responsive visual size multiplier
```

**Rule:** Do not add GSAP tweens that animate `x`, `y`, `scale`, or `rotation` on `#sat-canvas`. ScrollTrigger owns those transform properties.

## GSAP Reveal System

`animation.js` uses `fromTo` animations for scroll reveals. Skill bar fills are defensive:
- If GSAP is unavailable, bars get their final `data-width` immediately.
- If a bar is already visible on load, it is set immediately.
- If offscreen, it animates when scrolled into view.

## Projects — Hologram Interface

The projects section uses a hologram projection interface (`#projects-dock`):

- **Desktop:** GSAP-pinned stage. Scrolling through the section cycles between projects.
- **Mobile (`≤760px`):** All project panels are shown in a stacked layout (no pin).

The Three.js hologram canvas (`#projects-hologram-canvas`) renders a rotating orbit sphere that responds to mouse position and changes colour per project.

**To add a project:** Copy an existing `<article class="project-holo-panel">` block in `index.html` and update:
- `data-holo-color`, `data-holo-accent`, `data-holo-icon`
- `data-holo-label-a/b/c` (appear in the hologram visual)
- Kicker text, title, description, metadata, tech tags, and action buttons
- Add a corresponding dot button in `.project-holo-progress`

## Certifications Gallery

The certifications section uses a GSAP-pinned card-stack (`initCertGallery` in `animation.js`):

- **Desktop:** Cards stack with 3D transforms as you scroll.
- **Mobile (`≤768px`):** Falls back to a flat grid (`.cert-stack-compact` class applied).
