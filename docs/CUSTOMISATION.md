# Customisation Guide

Everything you need to make this portfolio your own.

---

## Personal Information

All content is in `index.html`. Use your editor's **Find & Replace** (`Ctrl+H` / `Cmd+H`) for each:

| Find | Replace with |
|---|---|
| `Aaron Dela Cruz` | Your full name |
| `aaron@example.com` | Your email |
| `aaron-delacruz.github.io` | Your GitHub Pages domain |
| `github.com/aaron-delacruz` | Your GitHub profile URL |
| `linkedin.com/in/aaron-delacruz` | Your LinkedIn URL |
| `@aarondev` | Your Twitter/X handle |
| `Quezon City, PH` | Your city / country |
| `Aaron-Dela-Cruz-CV.pdf` | Your CV filename |

---

## Colours

Edit the `:root` block at the top of `css/base.css`:

```css
:root {
  /* Primary accent — used for links, glows, active states */
  --clr-accent:   #4da6ff;   /* blue */

  /* Secondary accent — gradient end, skill icons */
  --clr-accent-2: #7b5ea7;   /* purple */

  /* Tertiary accent — typing cursor, teal highlights */
  --clr-accent-3: #00d4aa;   /* teal */

  /* Backgrounds */
  --clr-bg:       #050810;   /* deepest dark */
  --clr-bg-2:     #0a0f1e;   /* section alternate */
  --clr-bg-3:     #0d1426;   /* card/input backgrounds */

  /* Text */
  --clr-text:       #e8edf8;  /* primary text */
  --clr-text-muted: #7a8aaa;  /* secondary / descriptions */
}
```

For a different colour theme (e.g. green-space):
```css
--clr-accent:   #00ff88;
--clr-accent-2: #005540;
--clr-accent-3: #88ffcc;
```

---

## Typography

Fonts are loaded from Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800
  &family=DM+Sans:opsz,wght@9..40,400;9..40,500
  &family=JetBrains+Mono:wght@400;500
  &display=swap" rel="stylesheet" />
```

Then referenced in `css/base.css`:
```css
--font-display: 'Syne', sans-serif;      /* headings */
--font-body:    'DM Sans', sans-serif;   /* body text */
--font-mono:    'JetBrains Mono', monospace; /* labels, code */
```

To change fonts: replace the Google Fonts URL and update the three `--font-*` variables.

---

## Hero Section

### Typing animation roles

In `js/main.js`, find `initTyping()`:

```js
const texts = [
  'Frontend Developer',
  'Backend Developer',
  'Tech Enthusiast',
  'Problem Solver',
  'UI/UX Craftsman',
];
```

Add, remove, or reorder these strings freely.

### Stats numbers

In `index.html`, find the `.hero-stats` block and update the numbers:

```html
<div class="hero-stat-num">3+</div>
<div class="hero-stat-label">Years Exp.</div>
```

---

## About Section

### Bio text

Find the two `<p class="about-text">` paragraphs and rewrite them entirely.

### Highlight cards

The four `.about-highlight-item` cards can be updated or extended:

```html
<div class="about-highlight-item reveal-child">
  <div class="about-highlight-icon">🚀</div>
  <div>
    <div class="about-highlight-title">Your Trait</div>
    <div class="about-highlight-desc">Brief description</div>
  </div>
</div>
```

---

## Skills Section

### Progress bars

Each bar has a `data-width` attribute that controls how far it fills:

```html
<div class="skill-bar-label"><span>React / Vue</span><span>75%</span></div>
<div class="skill-bar-track">
  <div class="skill-fill" data-width="75"></div>
</div>
```

Change both the label text and `data-width` value.

### Skill icons

```html
<div class="skill-icon">
  <i class="fab fa-react tech-react" aria-hidden="true"></i>
  <span>React</span>
</div>
```

Browse [fontawesome.com/icons](https://fontawesome.com/icons) for available icons. Add a colour class in `css/space.css`:

```css
.tech-swift { color: #f05138; }
```

### Certifications section

Customize each card by editing:

- `cert-title` for the certification name
- `cert-desc` for the credential summary
- `cert-badge` for issuer or platform
- `cert-link` for the details page or credential URL

If you want to add or remove certifications, duplicate or delete this block:

```html
<article class="cert-card reveal">
  <div class="cert-card-top">
    <div class="cert-logo" aria-hidden="true"><i class="fas fa-award"></i></div>
    <div class="cert-label">Category</div>
  </div>
  <div>
    <h3 class="cert-title">Certification name</h3>
    <p class="cert-desc">Brief summary of what the certification covers.</p>
  </div>
  <div class="cert-footer">
    <span class="cert-badge">Issued by Platform</span>
    <a href="#" class="cert-link">View credential</a>
  </div>
</article>
```

### Adding the section to navigation

The navigation link uses `#certifications` so the new section is reachable from the menu.

### Styling

The section is styled in `css/sections.css` under the `#certifications` block. Adjust the `--clr-accent`, `--clr-accent-2`, and `--clr-accent-3` values in `css/base.css` to shift the entire theme.

### Adding a new certification card

Duplicate an existing `<article class="cert-card reveal">` block and update the title, description, issuer, and link.

```html
<article class="cert-card reveal">
  <div class="cert-card-top">
    <div class="cert-logo" aria-hidden="true"><i class="fas fa-award"></i></div>
    <div class="cert-label">Category</div>
  </div>
  <div>
    <h3 class="cert-title">Certification name</h3>
    <p class="cert-desc">Brief summary of what the certification covers.</p>
  </div>
  <div class="cert-footer">
    <span class="cert-badge">Issued by Platform</span>
    <a href="#" class="cert-link">View credential</a>
  </div>
</article>
```

---

## Projects Section

### Adding a project

Copy an existing `<article class="project-card">` block:

```html
<article class="project-card">
  <div class="project-img"
       style="background:linear-gradient(135deg,#YOUR_COLOUR_1,#YOUR_COLOUR_2)"
       role="img" aria-label="Project name preview">
    <span class="project-num">05 / 05</span>🔥
  </div>
  <div class="project-info">
    <div>
      <div class="project-meta">
        <span class="tag">Category</span>
      </div>
      <h3 class="project-title">Project Name</h3>
      <p class="project-desc">What it does and why it matters.</p>
      <div class="project-tech">
        <span class="tag">Tech 1</span>
        <span class="tag">Tech 2</span>
      </div>
    </div>
    <div class="project-actions">
      <a href="LIVE_URL" class="btn btn-primary btn-sm" target="_blank" rel="noopener">
        <i class="fas fa-external-link-alt" aria-hidden="true"></i> Live Demo
      </a>
      <a href="GITHUB_URL" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">
        <i class="fab fa-github" aria-hidden="true"></i> Source
      </a>
    </div>
  </div>
</article>
```

The carousel JS picks up new cards automatically.

### Auto-play speed

In `js/main.js`, `initCarousel()`:

```js
let autoPlay = setInterval(() => goTo(cur + 1), 4200); // ms between slides
```

---

## Satellite Path

In `js/animation.js`, edit `_waypoints`:

```js
_waypoints: [
  { p: 0.00, x: 0.88, y: 0.10, rot:  20 },
  //  ^        ^        ^        ^
  //  scroll   left     top      tilt (deg)
  //  progress fraction fraction
],
```

- `p` — when this point is reached (0 = page top, 1 = page bottom)
- `x` — horizontal position as fraction of viewport width
- `y` — vertical position as fraction of viewport height
- `rot` — rotation of the satellite body in degrees

The satellite smoothly interpolates between consecutive waypoints using `easeInOutCubic`.

### Lerp speed (trailing lag)

```js
// js/animation.js — in _loop()
const s = 0.07;  // increase for snappier, decrease for more inertia
```

---

## Globe

The Earth is CSS-only. To reposition it:

```css
/* css/space.css */
#space-globe {
  bottom: -28vw;   /* negative = partially off-screen below */
  right:  -16vw;   /* negative = partially off-screen right */
  width:   88vw;   /* sphere size */
}
```

To change the continent/ocean colours, edit the `background:` property on `.globe-body`.

---

## Contact Links

In `index.html`, find `.contact-links` and update `href` attributes:

```html
<a href="mailto:YOUR_EMAIL" class="contact-link">...</a>
<a href="https://github.com/YOUR_USERNAME" ...>...</a>
<a href="https://linkedin.com/in/YOUR_USERNAME" ...>...</a>
```

---

## Footer

The copyright year auto-updates via a small inline script:

```js
document.getElementById('footer-year').textContent = new Date().getFullYear();
```

Update the name and social links in `.footer-inner`.
