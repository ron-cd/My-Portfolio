# Customisation Guide

Use this guide when changing personal content or visual direction.

---

## Personal Content

Most copy and links live in `index.html`. Search and replace:

| Placeholder | Replace with |
|---|---|
| `Aaron Dela Cruz` | Your full name |
| `aaron@example.com` | Your email address |
| `github.com/aaron-delacruz` | Your GitHub URL |
| `linkedin.com/in/aaron-delacruz` | Your LinkedIn URL |
| `twitter.com/aarondev` | Your Twitter/X handle |
| `Mabalacat City` | Your city |
| `assets/Aaron_Dela_Cruz_CV.pdf` | Path to your CV file |
| `AKDC` | Your initials (footer wordmark) |

Also update SEO meta tags near the top of `index.html`:

```html
<link rel="canonical" href="https://your-domain.com/" />
<meta property="og:url"   content="https://your-domain.com/" />
<meta property="og:image" content="assets/img/og-image.png" />
```

---

## Theme Tokens

All design values are in `css/base.css` under `:root`. Change these first before touching component CSS.

```css
/* Brand colours — edit these */
--clr-accent:   #64b5f6;   /* primary highlight: links, bars, borders */
--clr-accent-2: #7d719d;   /* secondary accent: gradients, alt buttons */
--clr-accent-3: #00d4aa;   /* tertiary accent: cert links and supporting glows */
--clr-bg:       #060912;   /* main background */
--clr-bg-deep:  #02050b;   /* deepest background (body) */

/* Typography — edit these */
--font-display: 'Syne', sans-serif;         /* headings, nav, buttons */
--font-body:    'DM Sans', sans-serif;      /* body copy */
--font-mono:    'JetBrains Mono', monospace; /* code, labels, kickers */

/* Layout */
--container-max: 1180px;   /* max content width */
--nav-height:    72px;     /* header height (also used for section offset) */
```

---

## Responsive Breakpoints

Breakpoints are defined in `css/sections.css` (in the responsive hardening sections at the bottom):

| Breakpoint | Target |
|---|---|
| `1440px+` | Wide desktop — larger wordmark, wider containers |
| `1200px` | Laptop / tablet landscape — reduce decoration density |
| `900px` | Tablet portrait — stack grids, hide hero badges |
| `768px` | Small tablet — mobile nav, footer stacking |
| `760px` | Mobile hero — hero-content goes full-width |
| `640px` | Mobile — mobile nav padding, smaller section spacing |
| `420px` | Small mobile — font clamps, single-column everything |
| `380px` | Very small — CTAs stack vertically |
| `max-height: 500px` | Landscape phones — reduce hero height |

---

## Satellite Path

Edit `js/satellite.js`. Three waypoint profiles control the satellite's position as the user scrolls:

```js
WAYPOINTS.desktop  // above 1100px
WAYPOINTS.tablet   // 641px to 1100px
WAYPOINTS.mobile   // 640px and below, kept as a fallback profile
```

**Rule:** All profiles must have the same number of waypoints with the same `p` values.
The satellite is hidden on compact, save-data, reduced-motion, and constrained devices for performance.

```js
// Waypoint shape
{ p: 0.20, x: 0.22, y: 0.18, rotZ: -8, scale: 0.78 }
// p     = page scroll progress [0..1]
// x, y  = viewport fractions (0 = left/top, 1 = right/bottom)
// rotZ  = canvas tilt in degrees
// scale = visual size multiplier
```

**Do not** add GSAP tweens that animate `x`, `y`, `scale`, or `rotation` on `#sat-canvas`. ScrollTrigger owns those properties.

---

## Skills Belt

Skills are listed as `.skill-belt-item` elements inside `#skills-belt-track` in `index.html`.

```html
<span class="skill-belt-item">JavaScript ES6+</span>
```

Add, remove, or reorder those items directly. `js/main.js` clones the list once at runtime so the marquee loops cleanly.

---

## Projects

Each project is an `<article class="project-holo-panel">` inside `#projects-dock`. To add a project:

1. Copy an existing `<article>` block.
2. Update these `data-*` attributes on the article:
   - `data-holo-color` — hex colour for the hologram sphere
   - `data-holo-accent` — secondary hex colour
   - `data-holo-label-a/b/c` — three hologram display labels
3. Update the kicker text (`01 / 04`), title, description, metadata, tags, and buttons.
4. Add a matching dot button in `.project-holo-progress`:
   ```html
   <button type="button" data-holo-jump="3" aria-label="Show Your Project Name"></button>
   ```
5. Update all `aria-label` values on the dot buttons.

---

## Certifications

Each cert is a `<div class="cert-stack-card">` inside `.cert-stack-inner`. Copy an existing card and update:

- `cert-media img` — SVG or image source
- `cert-name` — certification title
- `cert-issuer` — issuing organisation
- `cert-date` — completion date
- `cert-desc` — short description
- `cert-topics` — topic chips
- `cert-link` — URL to the credential

---

## Contact Form

The form currently shows local success feedback only. To connect a real service, edit `js/main.js` in the `initContactForm()` function's submit handler.

Options:
- **Formspree:** Add `action="https://formspree.io/f/your-id"` and `method="POST"` to the form, remove `novalidate`, and let Formspree handle submission.
- **EmailJS:** Call `emailjs.sendForm()` inside the submit handler.
- **Netlify Forms:** Add `netlify` attribute to the form element.

See `docs/DEPLOYMENT.md` for full integration notes.

---

## Footer

The large `AKDC` wordmark is intentionally centered to the full viewport width, not the container, so it stays visually centered on ultra-wide displays. Change the text in `index.html` in the `.footer-wordmark` anchor.

Footer star animation speed is controlled by `animation-duration` on `.footer-starfield::before/::after` in `css/sections.css`.
