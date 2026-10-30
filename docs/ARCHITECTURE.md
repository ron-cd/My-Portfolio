# Architecture

PLAYER ONE is a single-page app made of small ES modules. There is no bundler and no dependency.

## Shell and scenes

`index.html` contains one persistent shell:

```text
#app
├── #stage     generated pixel-art scene (sky follows the clock) (js/core/scene.js), dimmed on inner screens
├── .hud       back button, screen name, sound toggle
├── #screen    <main>: the active scene is mounted here
├── #wipe      pixel-bar transition layer
└── #announcer polite live region for screen changes
```

`js/main.js` owns the shell. A **scene** is a module that exports:

```js
export const label = 'SKILL TREE';          // shown in the HUD
export function mount(ctx) {                 // ctx: { param, router, sound, announce, setParam }
  return {
    el,                                      // DOM to place in #screen
    focus(),                                 // where focus lands after opening
    unmount(),                               // cleanup
    onKey(event),                            // return true if you handled the key
    onParam(param),                          // optional: react to #/route/<param> without remounting
  };
}
```

Adding a screen means: create `js/scenes/yours.js`, register it in `SCENES` (and `PARENT`) in `main.js`, add its name to `ROUTES` in `js/core/router.js`, and add an entry in `menuItems` in `js/data/site.js` (used by the village's LOCATIONS drawer and the plain summary). A screen that should count toward the EXPLORED bar also goes in `AREAS` (`js/core/settings.js`); a screen with a building in the village needs an entry in `js/data/world.js` too (the validator reminds you).

## Routing

Only `title.js` is imported statically; the other scenes are loaded with `import()` through `LOADERS` in `main.js` the first time they are shown. Styles are joined into `css/player-one.css` by `scripts/build-css.mjs`; edit the files in `css/`, then run `npm run css`.

Hash routes work on any static host: `#/` (title), `#/profile`, `#/skills`, `#/quests`, `#/achievements`, `#/contact`, `#/world` (village, the hub; the old `#/menu` redirects here with `replaceState`) and `#/summary` (plain recruiter page, not part of the game menu). Screen changes push history entries, so browser Back and Forward work. Selecting a certification or quest updates the URL (`#/skills/databases`) with `replaceState`, so deep links work without polluting history.

## Transitions and focus

`show()` in `main.js` covers the screen with 16 pixel bars, swaps the scene, then reveals it. Requests that arrive mid-transition are coalesced, so double presses never stack animations. With `prefers-reduced-motion`, the wipe is skipped. After each change, focus moves to the new screen heading (or primary control) and a live region announces the screen.

Keyboard handling is global but polite: it ignores modified keys and text inputs, gives the active scene first refusal, and only then treats Escape as "go back".

## Pixel art

Nothing is a raster image.

- `js/core/sprites.js`: sprites are arrays of palette characters, rendered to inline SVG (one `<path>` per colour, `shape-rendering: crispEdges`).
- `js/core/scene.js`: the background (sky bands, stars, moon, skyline, hills, pines, terminal, hero) is generated on a 192 × 108 grid with a seeded random generator.

- `js/core/settings.js`: local preferences (scanlines, always-night, comfort options) and exploration progress, both in `localStorage` behind try/catch, plus `currentSky()`.
- `js/ui/bookart.js`: the quest-book illustrations.

## Skill tree

`js/data/certifications.js` is a graph: unique ids, `x`/`y` in a 1000 × 650 logical space, and explicit `connections`. The player sits at the hub; four branches leave it on diagonal spokes and continue along horizontal rows. `js/scenes/skilltree.js` renders:

- **Radial tree (≥ 960px):** node buttons positioned in percent over an SVG with the same viewBox, so connectors always meet their nodes. Diamond frames show status (earned, in progress, planned). Q / E swap branch, arrow keys move between nodes.
- **List (< 960px):** the same data as branches; the detail panel becomes a bottom sheet with a basic focus trap.
- **Detail panel:** beside the tree at ≥ 1400px, below it otherwise, so opening it never moves a node.

## Achievements (badge wall)

`js/data/achievements.js` holds manual achievements; certifications and completed quests are generated from their own data files. `js/ui/badge.js` turns each one into a pixel-art badge (shape per group, emblem sprite, locked variant for in-progress quests). `js/scenes/achievements.js` lays them on wooden shelves, one per group, with the same detail window / bottom sheet pattern as the skill tree (`.item-window` in `css/skilltree.css`).

## Recruiter summary and SEO

`js/scenes/summary.js` builds a plain page from the same data files, so it cannot disagree with the game. `css/summary.css` has an `@media print` block (white paper, no HUD or buttons, link URLs printed).

`scripts/build-seo.mjs` regenerates two marked regions of `index.html` from `js/data`: the schema.org JSON-LD (`ProfilePage` + `Person`) and the no-JavaScript fallback. `npm test` runs it with `--check`, so a stale `index.html` fails the build; `npm run seo` rewrites it.

## Village (Walk Around)

- `js/data/world.js`: tile coordinates (32 × 20) for roads (rectangles), buildings, doors, trees, lamps, the lake and flowers.
- `js/core/worldmap.js`: pure grid logic (blocked tiles, roads, the path from each door down to the nearest road, breadth-first pathfinding). No DOM, so `validate-data.mjs` loads it and checks that every door can be reached.
- `js/ui/worldart.js`: draws the whole village as one SVG from rectangles and sprites; the sky tints it and lights the windows.
- `js/scenes/world.js`: the full-screen village. The map is larger than the screen; a camera keeps the hero centred by moving the map with one CSS `transform` (same 150 ms stepped transition as the hero, so there is no animation loop). `--tile` is set in JS to a whole multiple of the 16 px art (about 15 tiles across the screen). Movement: arrows / WASD / D-pad / tap / LOCATIONS drawer (key `L`). Held keys are ignored (`event.repeat`), so one press is one tile. An EXPLORED n/5 chip sits in the bar, with a one-time "all explored" message. It shows a speech bubble next to doors, building name labels, a visually hidden live region for screen readers, and visited flags. The shell's top HUD is hidden on this screen (`css/world.css`), so the scene has its own TITLE / LOCATIONS / OPTIONS buttons (`#options-btn` does not exist there, so tests open Options from another screen) (`ctx.openOptions`). Screens entered from the village return to it (`PARENT` in `main.js`). Esc in the village only closes the drawer or message (`ESCAPE_STAYS`).
- `js/scenes/profile.js`: the equipment screen (hero, gear slots from `profile.gear`, stats strip, and a PLAYER STATS view with the written profile). "Used in" lines are worked out from `projects.js`.
- `js/scenes/contact.js`: the post office letter (quest-type chips, stamps for links, CV package, COPY EMAIL).

## Title-screen hot-spots

`js/ui/scenehits.js` places real `<button>`s over the cat, hero and terminal by applying the scene's own `preserveAspectRatio` maths to anchor rectangles that `scene.js` publishes in `data-anchors`. Keyboard and screen-reader users get the same actions; the cat's lines are announced.

## Options, progress, and the sky

`js/ui/options.js` builds a modal dialog (focus trap, Esc to close, focus returns to the gear button). While it is open the shell ignores global keys. `progress.mark(route)` runs on every scene mount; the village chip subscribes to changes so reset updates it live. The shell rebuilds the background scene when the sky setting changes.

## Comfort options

`settings.js` mirrors preferences onto `<html>` as classes (`pref-big`, `pref-readable`, `pref-contrast`, `pref-calm`, `crt-on`). `css/comfort.css` reacts to them: every pixel font size in the CSS is written `calc(Npx * var(--type-scale))`, so one variable scales (and, for readable mode, swaps) all text; contrast overrides the colour tokens; calm mode uses the same rules as `prefers-reduced-motion`, and `prefersReducedMotion()` in `dom.js` returns true for either.

## Sound and music

`js/core/audio.js` synthesises tiny square-wave blips with Web Audio. It is off by default, only creates an `AudioContext` after the visitor turns sound on, and remembers the choice in `localStorage` (guarded by try/catch).

`js/core/music.js` is a separate, opt-in switch. Four original loops are written as data (`THEMES`: `village`, `morning`, `afternoon`, `night`, each with a `level` that evens out loudness) and played by a look-ahead scheduler: square lead, triangle bass, faint arpeggio, through a low-pass filter at a low master gain. A saved "on" waits for the first click or key press (browser autoplay rules); the loop pauses when the tab is hidden; `setScene()` is called by the shell: in the village the Cozy Village tune plays; elsewhere the tune follows the sky (dawn/day = morning, dusk = afternoon, night = night). Tunes switch at a loop or bar boundary.

## Fallbacks

`#screen` ships with a static HTML version of the whole portfolio (contact, about, education, skills, projects, certifications, recognition), generated by `scripts/build-seo.mjs`. It is replaced when JavaScript starts and stays visible if the module fails to load.
