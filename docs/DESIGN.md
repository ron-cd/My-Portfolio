# Design Reference

## Concept

A SNES-era RPG interface: night-sky title screen, framed menu windows, item-description windows, a talent-tree style skill graph. It borrows the genre's visual language without copying any specific game's characters, maps, or artwork.

## Palette (defined in `css/tokens.css`)

| Role | Tokens |
|---|---|
| Midnight surfaces | `--void`, `--night`, `--panel`, `--panel-2`, `--line`, `--ink` |
| Accents | `--teal`, `--green` (forest), `--gold` (earned/achievements), `--orange`/`--red` (warnings, unavailable) |
| Text | `--cream`, `--pale`, `--muted` |

Gold means "earned". Orange marks planned or experimental items. Nothing else uses them.

## Typography

- **Press Start 2P**: headings, buttons, small labels (never for paragraphs).
- **IBM Plex Sans**: all readable copy.
Both are self-hosted in `assets/fonts/` (SIL OFL).

## Pixel language

- Borders are stacked box-shadows offset by `--px`, producing notched corners.
- All sprites and scenery are inline SVG with crisp edges at integer scales.
- Animation uses `steps()` timing so motion feels frame-based, and only `transform`/`opacity`.
- The UI itself has no glass or glow effects. Gradients are used only where a pixel-art object needs them (the wooden shelf planks). The checkerboard fills mimic old tile backgrounds.

## Quest book

The only place the site leaves the midnight palette: warm parchment pages inside a stone frame, to read as a book. Ribbon title, red selection arrow, vertical bookmark tabs (all: red, completed: green, in progress: blue, experimental: purple). Status is never colour-only: each row has a distinct icon and hidden text.

## Skill tree, badge wall, village

- **Skill tree:** a radial "circuits" layout: hub at the centre, four diagonal spokes, diamond nodes. Status shows by frame style and a text label, never colour alone.
- **Badge wall:** badges on wooden shelves, shaped by group. Locked badges are grey, not hidden.
- **Village:** a top-down 16 × 10 tile map, 16 px tiles. Buildings use one colour per screen; flags show visited screens.
- **Plain summary:** the one other place that uses light paper (like the quest book), so it prints cleanly.

## Comfort options

LARGER TEXT (+20%), READABLE FONT (plain sans for UI text; the PLAYER ONE logo stays pixel art), HIGH CONTRAST (brighter tokens, thick white focus rings, darker backdrop) and CALM MOTION (no animation). They stack, are remembered locally, and layouts are checked with them on.

## Motion rules

Short and deliberate: title reveal (~2s), pixel-bar wipe (~0.4s), node pop, panel slide. The background scene pauses whenever it is only a dimmed backdrop. `prefers-reduced-motion` or the CALM MOTION option disables all animation and the wipe, and makes village walking instant. Music is opt-in and never starts by itself.

## Accessibility

Semantic landmarks and headings, visible gold focus rings, 44px touch targets, live-region announcements, labelled nodes ("name, issuer. Status: …"), keyboard access to every control, and a no-JS fallback.
