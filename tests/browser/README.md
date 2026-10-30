# Browser tests (optional, not part of `npm test`)

Two Playwright scripts that drive the real site in Chromium.

```bash
npm run serve                       # terminal 1: http://127.0.0.1:4173/
npm i -D playwright && npx playwright install chromium   # once
node tests/browser/behave.js        # core flows (66 checks)
node tests/browser/extras.js        # newer features (233 checks)
```

Some checks depend on timing; if one fails, rerun it before investigating.
Only Chromium has been tested.
