# Changelog

All notable changes are documented here.

## [Unreleased] — May 2026

### Fixed
- Corrected the Lab Activities route to `html/lab-activities.html` and fixed nested-page asset paths.
- Aligned canonical, Open Graph, robots, sitemap, and web manifest URLs for the GitHub Pages project URL.
- Replaced stale package checks with `scripts/check-static-site.js`.
- Normalized satellite waypoint profiles so ScrollTrigger refreshes safely across breakpoints.

### Removed
- Removed unused skill-bar CSS and JS after the skills section moved to the belt carousel.
- Removed unused hologram icon-core markup hooks and CSS.
- Removed unused npm runtime dependencies; the site uses committed files in `libs/`.

### Removed (Dead Code Cleanup)
- **`css/sections.css`** — Removed entire old `project-card` / `project-dock-grid` layout system (~300 lines). This was the original grid-based projects layout, fully superseded by the hologram projection interface in January 2026 but never deleted.
- **`css/sections.css`** — Removed duplicate `.hero-ambient-drift` stub rule that was being silently overridden by the full rule 50 lines below it.
- **`css/sections.css`** — Removed orphaned `.project-shuttle`, `.project-tether`, `.project-thruster` decorative element rules and their keyframe animations (referenced no HTML elements).
- **`css/sections.css`** — Removed `.project-card` from shared box-shadow rule (class no longer exists in HTML).
- **`css/sections.css`** — Removed dead responsive media queries for `project-dock-grid` and `project-card-featured/wide`.

### Added
- **`docs/DESIGN.md`** — New design reference document: colour system, typography, motion principles, spacing scale, component inventory.
- **Section comments** — All CSS files (`base.css`, `sections.css`) now have numbered section headers with inline edit guides so you know exactly where to change each part of the UI.
- **JS doc headers** — `main.js` and `animation.js` now include a full table of contents describing every function.
- **Mobile fixes** — Added `@media (max-width: 380px)` block for very small screens (button stacking, font scaling) and `@media (max-height: 500px)` block for landscape phones.
- **`aria-live` roles** — Contact form error paragraphs now include `role="alert"` alongside `aria-live="polite"` for improved screen-reader compatibility.

### Changed
- **`docs/ARCHITECTURE.md`** — Fully updated to reflect the hologram project interface, current JS module structure, and removed references to the old dock system.
- **`docs/CUSTOMISATION.md`** — Updated Projects section to describe the hologram panel system (was still describing old `project-card-dock` workflow).
- **`docs/CHANGELOG.md`** — Restructured with version and date headers.

## [1.1.0] — 2026-01-15

### Added
- Projects hologram projection interface (Three.js + GSAP pin).
- Premium About section with orbit card animation.
- Skills belt marquee component.
- Certifications scroll-driven card stack (GSAP pin).
- Footer redesign with large wordmark and starfield.

### Changed
- Moved from grid project cards to hologram panel system.
- Satellite scroll path updated with three responsive breakpoint profiles.

## [1.0.0] — 2025-05-07

### Added
- Initial space-themed portfolio.
- Animated canvas space background (stars, nebulae, Milky Way, shooting stars).
- Three.js satellite model with scroll-driven movement.
- Responsive navbar with mobile hamburger.
- Hero, About, Skills, Certifications, Projects, Contact, Footer sections.
- GSAP scroll reveal animations and skill bar fills.
- Client-side contact form validation.
- Documentation: ARCHITECTURE, CHANGELOG, CUSTOMISATION, DEPLOYMENT.
