# PLAYER ONE: A Developer Quest

A retro 16-bit RPG portfolio for Aaron Dela Cruz. Visitors start at a pixel-art title screen, press Start, and land straight in a full-screen village (there is no main menu). Every building is one screen: **Profile** (an equipment screen), **Skill Tree** (certifications as a radial tree), **Quest Log** (projects as an open book), **Achievements** (a badge wall), and **Contact** (a post office letter). The camera follows the hero.

In a hurry? **Skip the game** on the title screen (or open `#/summary`) shows a plain one-page summary with a CV button and a print stylesheet.

It is plain HTML, CSS, and ES modules. No framework, no bundler, no runtime dependencies, and no build step, so it deploys to GitHub Pages as-is.

![Preview](assets/img/og-image.png)

## Run it

Use a local server (ES modules do not load from `file://`).

```bash
npm run serve        # http://127.0.0.1:4173/
npm run serve -- 8080
npm test             # file checks + content validation
```

## Controls

| Input | Action |
|---|---|
| Enter / Space / click | Press Start on the title screen |
| Arrow Up / Down | Move through quest lists and the places drawer |
| Arrow keys / Tab | Move between skill-tree nodes and achievement badges |
| Q / E | Swap skill-tree branch |
| Arrow keys or W A S D (village) | Walk one tile per key press (holding a key does not repeat); stepping onto a door opens it |
| Enter / Space | Open the focused item; in the village, go into the nearest building |
| L | In the village, open the list of places |
| Esc | Close a detail panel or the places drawer, or go back one screen (in the village it never leaves) |
| Gear button (top right) | Options (see below) |
| Sound button (top right) | Turn optional sound effects on (off by default) |

**Options** (gear button): sound effects, **music** (original chiptune, off by default: Cozy Village in the village, and a morning, afternoon or night tune elsewhere), scanlines, **larger text**, **readable font**, **high contrast**, **calm motion**, always-night, and reset explored areas. All are remembered in the browser only.

On the title screen you can also click (or Tab to) the cat, the hero, and the terminal; the terminal opens Contact.

Everything also works with mouse and touch, and with reduced-motion enabled.

## Editing content

All content lives in `js/data/`. You never need to touch UI code to update it:

| File | Controls |
|---|---|
| `profile.js` | Profile screen and hub status panel |
| `certifications.js` | Skill-tree nodes, positions, connections, status, credential links |
| `projects.js` | Quest log entries |
| `achievements.js` | Manual achievements (certifications and completed quests are added automatically) |
| `site.js` | Title text, building list, contact links, CV path |
| `world.js` | The village map (32 × 20): roads, building positions, doors, trees, lamps, lake |

Run `npm test` after editing. It catches broken connections, duplicate ids, non-HTTPS links, missing files, unreachable village doors, and an out-of-date no-JS fallback.

After changing `profile.js`, `site.js`, certifications, projects or achievements, run `npm run seo` to regenerate the search-engine data (JSON-LD) and the no-JavaScript fallback in `index.html` from the same files. See [docs/CUSTOMISATION.md](docs/CUSTOMISATION.md) for step-by-step recipes.

## Project structure

```text
index.html              App shell + no-JS fallback
css/                    tokens, base, components, shell, title, screens, skilltree, book, badges, extras, summary, world, comfort
js/main.js              Shell: routing, transitions, focus, global keys
js/boot.js              tiny pre-paint script (marks JS as available)
js/core/                dom, router, sprites, scene (pixel background), audio, music, settings, worldmap
js/scenes/              title, profile, skilltree, quests, achievements, contact, summary, world
js/ui/                  components, options window, quest-book art, badge art, scene hot-spots, village art
js/data/                All editable content
assets/fonts/           Self-hosted Press Start 2P and IBM Plex Sans (OFL)
assets/                 CV, icons, social image
html/                   Original standalone lab activity pages
scripts/                serve-static.js, check-static-site.js, validate-data.mjs, build-seo.mjs
docs/                   Architecture, customisation, design, deployment, changelog
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Customisation](docs/CUSTOMISATION.md)
- [Design reference](docs/DESIGN.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Changelog](docs/CHANGELOG.md)

## License

MIT. Fonts are licensed under the SIL Open Font License (see `assets/fonts/`).
