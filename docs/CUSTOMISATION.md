# Customisation

All content is in `js/data/`. Run `npm test` after changes.

## Update my profile

Edit `js/data/profile.js` (name, intro, education, abilities, strengths, goals). Abilities are plain tags on purpose: no made-up skill percentages.

The EQUIPMENT screen reads `gear` in the same file: six slots, each holding items that must also appear in `abilities` (`npm test` checks this). "Used in N projects" is calculated from each project's `tech` list; add a `match` array to an item when the project spells it differently (for example Docker matches `Docker Compose`). The stats strip (projects, certifications, achievements, start year) is calculated too, so nothing there is typed by hand.

## Add or change a certification

In `js/data/certifications.js`, copy the template at the bottom of `nodes`:

1. Give it a unique `id`, a `title`, `issuer`, `description`, `skills`, and (if available) `date`, `credentialId`, `url`.
2. Set `status` to `'earned'`, `'in-progress'`, or `'planned'`. Only use `'earned'` for credentials you hold. Planned and in-progress nodes are styled differently and labelled.
3. Pick `x`/`y` on the 1000 × 650 canvas. The four branches use rows at y = 155 (top) and y = 495 (bottom); slots are 130 apart (x = 800, 930 on the right; 200, 70 on the left). A row holds two certifications; for more, widen `TREE_SIZE.width` and shift the nodes. `npm test` fails if a node leaves the canvas.
4. Add its `id` to the previous node's `connections` so a line is drawn.

Connections show topic grouping, not official prerequisites. To add a new branch, add a `kind: 'branch'` node, connect it from `player`, and list it in `branches` (this drives the mobile list).

## Add a quest (project)

Add an object to `js/data/projects.js`. Required: `id`, `name`, `category` (`completed` | `in-progress` | `experimental`), `summary`. Fields you leave out are simply hidden. Links that are `null` show a fallback instead of a button.

Screenshots: put images in `assets/img/` and list them as `screenshots: [{ src: 'assets/img/x.png', alt: 'What it shows' }]`. Pixel-art images should be given `image-rendering: pixelated` in CSS.

The quest log is drawn as a book. If a quest has no screenshots, its right page shows a pixel illustration generated from the quest's `icon` (see `js/ui/bookart.js`); a screenshot that fails to load falls back to the same illustration. Page colours are the `--page*` variables at the top of `css/book.css`.

## Sky, greeting, and cat

`SKIES` in `js/core/scene.js` defines the four skies; the greeting lines are `GREETING` in `js/core/settings.js`. The hour windows are in `currentSky()` there. Remove the cat by deleting the "Companion cat" block in `scene.js`.

## Achievements

Add manual entries in `js/data/achievements.js` (`group`, `icon`, `name`, `description`, optional `date`, `short` caption and `count` for "×2"). Earned certifications and completed quests appear automatically as badges and link back to their details; quests that are still in progress show as locked badges.

## The village (Walk Around)

`js/data/world.js` describes a 32 × 20 tile map. Each building has a footprint (`x`, `y`, `w`, `h`), a `door` tile directly below it, the screen it opens (`route`) and its colours and emblem. Roads are rectangles (`x1, y1` to `x2, y2`); a path from each door down to the nearest road is added automatically. Trees, lamps, the lake and flowers are plain tile lists. Run `npm test`: it checks that every door is below its building and can be reached from the start tile. To change how big things look on screen, change `TILES_ACROSS` in `js/scenes/world.js`.

## The plain summary page

`#/summary` is generated from the same data files. To change what it lists, edit `js/scenes/summary.js`; its print layout is at the bottom of `css/summary.css`.

## Search and social data

After editing content, run `npm run seo`. It rewrites the JSON-LD block and the no-JavaScript fallback in `index.html` (between the `seo:` comment markers). Never edit those regions by hand.

## Contact and CV

Edit `js/data/site.js`. The CV path points at `assets/Aaron_Dela_Cruz_CV.pdf`; replace that file to update it. The letter opens the visitor's email app with a pre-filled draft (it never claims to have sent anything). The quest-type chips come from `contact.topics` in the same file; each `subject` starts the email subject line. To use a real form backend, replace the submit handler in `js/scenes/contact.js`.

## Colours, fonts, pixel size

`css/tokens.css` holds every colour, the two fonts, and `--px` (the base pixel unit that borders and shadows are built from). When you add CSS, write pixel-font sizes as `calc(10px * var(--type-scale))` so the LARGER TEXT and READABLE FONT options keep working. Sprite colours are in `PALETTE` in `js/core/sprites.js`; the background scene colours are at the top of `js/core/scene.js`.

## The no-JavaScript fallback

Generated: see "Search and social data" above. `npm test` fails if `index.html` is out of date with `js/data`.

## Music

The four tunes are data at the top of `js/core/music.js` (`THEMES`: `village`, `morning`, `afternoon`, `night`; each has tempo, key, chords, a melody and `bass` written as chord degrees, and a `level` that balances loudness). `village` plays on the map; the others follow the time of day (change which plays when in `chooseTheme()`). Edit them or add notes; keep the master gain low.
