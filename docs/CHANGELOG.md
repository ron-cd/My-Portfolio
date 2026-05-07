# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025-05-07

### Added
- Initial public release
- Space-themed design with realistic CSS Earth globe (fixed background)
- ISS-style satellite with scroll-driven sweeping arc path
  - Truss spine, dual solar arrays, thermal foil module, communication dish
  - Blinking signal LED animation
  - Tilt follows direction of travel via waypoint rotation interpolation
- Particle canvas (floating star-dust, 110 desktop / 55 mobile)
- Nebula glow layers (3 animated, blurred ellipses)
- Shooting star CSS animations (3 instances)
- Full responsive navbar with mobile hamburger menu and scroll-glass effect
- Hero section with typewriter role animation and morphing avatar
- About section with highlight cards and scroll-reveal
- Skills section with animated progress bars (IntersectionObserver triggered)
- Projects carousel with keyboard, touch-swipe, dot navigation, auto-play
- Contact section with social links and client-side form feedback
- Footer with auto-updating copyright year
- Scroll-reveal system (fade-up, slide-left, slide-right, staggered children)
- Cursor glow effect (desktop only, lagged radial gradient)
- Preloader fade-out on page load
- Full ARIA labelling and `prefers-reduced-motion` support
- ES Module architecture: `utils.js`, `scroll.js`, `animation.js`, `main.js`
- Full documentation: README, ARCHITECTURE, DEPLOYMENT, CUSTOMISATION, CHANGELOG
- `.gitignore`, `robots.txt`, `sitemap.xml`, `site.webmanifest`
