# Design Reference

This document captures the design system decisions behind the portfolio. Use it as a reference when adding new sections or components so everything stays visually consistent.

---

## Concept

The portfolio uses a **deep-space / orbital** aesthetic — dark backgrounds, glowing accents, and Three.js 3D elements to create depth and a sense of technological precision. The tone is ambitious and focused: a developer who treats craft seriously.

Key differentiators:
- Full-screen animated space canvas (stars, nebulae, Milky Way, shooting stars)
- Three.js satellite model that moves through the page as you scroll
- Hologram projection interface for the Projects section
- Scroll-driven 3D card stack for Certifications

---

## Colour System

Defined in `css/base.css` under `:root`.

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--clr-bg` | `#060912` | Primary section backgrounds |
| `--clr-bg-2` | `#0a0e1c` | Alternate section backgrounds |
| `--clr-bg-3` | `#10182b` | Card backgrounds, elevated surfaces |
| `--clr-bg-deep` | `#02050b` | Body background (deepest layer) |
| `--clr-surface` | `rgba(232,237,248, 0.045)` | Card fills, subtle overlays |
| `--clr-surface-2` | `rgba(232,237,248, 0.075)` | Hovered card fills |
| `--clr-surface-3` | `rgba(232,237,248, 0.11)` | Active/selected surfaces |

### Text

| Token | Value | Usage |
|---|---|---|
| `--clr-text` | `#e8edf8` | Primary body text |
| `--clr-text-muted` | `#7a8aaa` | Secondary text, descriptions |
| `--clr-text-dim` | `#3d4a63` | Placeholder text, very quiet labels |

### Accent

| Token | Value | Usage |
|---|---|---|
| `--clr-accent` | `#64b5f6` | Links, active states, skills belt dots, borders |
| `--clr-accent-2` | `#7d719d` | Gradients, secondary buttons |
| `--clr-accent-3` | `#00d4aa` | Tertiary pop colour (teal/green), cert links |
| `--clr-glow` | `rgba(100,181,246, 0.22)` | Box-shadow glow for accented elements |

### Borders

| Token | Value | Usage |
|---|---|---|
| `--clr-border` | `rgba(232,237,248, 0.095)` | Default card/input borders |
| `--clr-border-2` | `rgba(108,176,235, 0.24)` | Hovered/focused borders |

---

## Typography

Defined in `css/base.css`.

### Font Stack

| Role | Family | Weights | Usage |
|---|---|---|---|
| Display | `Syne` | 400, 600, 700, 800 | Headings, nav, buttons, section titles |
| Body | `DM Sans` | 300, 400, 500 | Paragraphs, descriptions, card copy |
| Mono | `JetBrains Mono` | 400, 500 | Code labels, kickers, percentages, form labels |

Loaded via Google Fonts with `<link rel="preload">` for performance.

### Scale

| Element | Size | Weight | Font |
|---|---|---|---|
| `.section-title` | `clamp(2.2rem, 5vw, 3.5rem)` | 800 | Display |
| `.hero-title` | `clamp(2rem, 4.5vw, 3.6rem)` | 800 | Display |
| `h3` in sections | ~1.5–2rem | 700–800 | Display |
| Body copy | 0.88–0.93rem | 400 | Body |
| `.section-label` | 0.75rem | — | Mono, uppercase, 0.15em tracking |
| `.tag` | 0.72rem | — | Mono |
| Kicker/eyebrow | 0.76rem | — | Mono |

---

## Motion & Animation

Defined in `css/base.css` and `js/animation.js`.

### Easing Tokens

| Token | Value | Use case |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | UI enters, reveals, hover transitions |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Thruster pulse, symmetrical loops |

### Transition Durations

| Token | Value | Use case |
|---|---|---|
| `--transition-fast` | `160ms` | Hover colour/border changes |
| `--transition-normal` | `280ms` | Card lifts, nav glass |
| `--transition-spring` | `420ms` | Buttons and lifted interactive surfaces |

### GSAP Animations

| Animation | Duration | Trigger |
|---|---|---|
| Scroll reveal (`.reveal`) | 0.75s | Element enters viewport (top 90%) |
| Scroll reveal (`.reveal-left/right`) | 0.75s | Same, with x offset |
| Child stagger (`.reveal-child`) | 0.5s per child | 0.08s stagger |
| Hero entrance | 0.75s | Page load, 0.5s delay |
| Cert card stack | Scrub | GSAP ScrollTrigger pin |
| Project hologram | Scrub | GSAP ScrollTrigger pin |

**Reduced motion:** All GSAP animations respect `prefers-reduced-motion`. When set, elements jump to their final state immediately and the cert/project pins are disabled in favour of a flat layout.

---

## Spacing Scale

The site does not use a rigid spacing scale token system. Key values used consistently:

| Size | Usage |
|---|---|
| `0.4–0.6rem` | Tight gaps within components (icon + label) |
| `1rem` | Standard gap between list items |
| `1.5–2rem` | Intra-section padding, form groups |
| `2.5–3rem` | Section header bottom margin |
| `4–5rem` | Between major blocks within a section |
| `clamp(5.5rem, 10vw, 8.5rem)` | `.section-inner` vertical padding |

Container max-width: `1180px` (token: `--container-max`), expanding to `1280px` at `≥1440px`.

---

## Shape & Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Skill icons, small badges, nav toggle |
| `--radius-md` | `14px` | Cards, form inputs, about highlights |
| `--radius-lg` | `24px` | Large cards, cert cards, about image |
| `--radius-full` | `9999px` | Pills, tags, buttons, eyebrow badges |

---

## Iconography

Icons use **Font Awesome 6.4.0** via CDN (loaded with `<link rel="preload">`). All decorative icons have `aria-hidden="true"`. Interactive icons inside buttons use the button's label for accessible text.

Icon sizes used:
- `1.1rem` — contact link icons
- `1.2rem` — about highlight icons
- `font-size: 5rem+` — large decorative feature icons (about image placeholder)

---

## Component Inventory

### Buttons

| Class | Appearance | Use |
|---|---|---|
| `.btn.btn-primary` | Solid accent gradient, glow shadow | Primary CTA |
| `.btn.btn-ghost` | Transparent, outlined | Secondary action |
| `.btn.btn-sm` | Smaller padding | Compact contexts (project cards) |
| `.btn-submit` | Full-width, accent gradient | Contact form submit |

### Cards

| Component | Location | Description |
|---|---|---|
| Skills belt | `#skills` | Full-width scrolling skill list |
| About highlight | `#about` | Small feature box with icon + short text |
| Hero profile card | `#hero` | Mini card visible on desktop (hidden ≤900px) |
| Contact link | `#contact` | Social/email row with icon and text |
| Contact form | `#contact` | Glassmorphic form container |
| Cert stack card | `#certifications` | 3D-stacked card with image + body |
| Project holo panel | `#projects` | Scrollable panel in hologram interface |

### Section Layout Pattern

Every section follows:
```html
<section id="sectionname">
  <div class="container">
    <div class="section-inner">
      <!-- section-head (label + title) -->
      <!-- section body content -->
    </div>
  </div>
</section>
```

`.section-inner` provides `clamp(5.5rem, 10vw, 8.5rem)` vertical padding. `.container` provides `max-width` and horizontal padding.

---

## Background & Atmosphere

The site's depth comes from layered backgrounds:

1. **`body::before`** — subtle dot grain overlay (`pointer-events: none`, `mix-blend-mode: screen`)
2. **`#space-canvas`** — full-page animated starfield (canvas, `position: fixed`)
3. **`.bg-gradient`** — subtle dark gradient layer
4. **`#hero::before`** — animated geometric line grid with `mask-image` fade
5. **Hero ambient rings/arcs** — CSS-animated orbital rings (`mix-blend-mode: screen`)
6. **Per-section backgrounds** — each section has its own subtle gradient to maintain dark-space atmosphere

---

## Accessibility Notes

- All sections have `aria-labelledby` pointing to their heading.
- Decorative elements use `aria-hidden="true"`.
- The navbar toggle uses `aria-expanded` and `aria-controls`.
- Skip-to-content link is present and visible on focus.
- Form fields use `aria-describedby` for error messages; error paragraphs use `role="alert"`.
- All interactive elements have `:focus-visible` outlines.
- Motion animations respect `prefers-reduced-motion: reduce`.
- Minimum tap target of `44px` enforced on inputs and buttons at `≤640px`.

---

## File Map for Quick Edits

| I want to change… | Edit this file | Look for… |
|---|---|---|
| Brand colours | `css/base.css` | `§1 DESIGN TOKENS` → `:root` |
| Font families | `css/base.css` | `§1 DESIGN TOKENS` → `--font-*` |
| Nav links | `index.html` | `§1 NAVIGATION` comment |
| Hero heading / CTA | `index.html` | `§2 HERO SECTION` comment |
| About text & highlights | `index.html` | `#about` section |
| Skills list | `index.html` | `#skills-belt-track` items |
| Project cards | `index.html` | `#projects-dock` articles |
| Cert cards | `index.html` | `.cert-stack-inner` cards |
| Contact links | `index.html` | `§6 CONTACT SECTION` comment |
| Footer initials | `index.html` | `.footer-wordmark` |
| Satellite path | `js/satellite.js` | `WAYPOINTS` object |
| Typing role strings | `js/main.js` | `initTyping()` → `texts` array |
| Section layout / spacing | `css/sections.css` | Numbered `§` section comments |
