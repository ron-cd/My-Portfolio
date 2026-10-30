const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4173/';
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('FAIL:', m); } };
(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const newCtx = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    return { ctx, p };
  };
  const scene = p => p.evaluate(() => document.getElementById('app').dataset.scene);
  const go = async (p, hash, ms = 1100) => { await p.evaluate(h => { location.hash = h; }, hash); await p.waitForTimeout(ms); };

  /* ── Explore tracker (the chip in the village bar) ── */
  let { ctx, p } = await newCtx();
  await p.goto(BASE + '#/world'); await p.waitForTimeout(1500);
  ok(await p.locator('.world-explore').innerText() === 'EXPLORED 0/5', 'starts at 0/5: ' + await p.locator('.world-explore').innerText());
  ok(await p.locator('.world-explore').getAttribute('aria-label') === 'Explored 0 of 5 areas', 'chip has a screen-reader label');
  ok(await p.locator('.world-flag').evaluateAll(els => els.filter(e => e.style.display !== 'none').length) === 0, 'no flags at start');
  ok(await p.locator('.world-toast').count() === 0, 'no completion message at start');
  await go(p, '#/profile'); await go(p, '#/world', 1600);
  ok(await p.locator('.world-explore').innerText() === 'EXPLORED 1/5', '1/5 after profile');
  ok(await p.locator('.world-flag').evaluateAll(els => els.filter(e => e.style.display !== 'none').length) === 1, 'one flag after one visit');
  await p.reload(); await p.waitForTimeout(1500);
  ok(await p.locator('.world-explore').innerText() === 'EXPLORED 1/5', 'progress persists across reload');
  for (const r of ['skills', 'quests', 'achievements']) { await go(p, '#/' + r); await go(p, '#/world', 1500); }
  ok(await p.locator('.world-toast').count() === 0, 'no completion message at 4/5');
  await go(p, '#/contact'); await go(p, '#/world', 1600);
  ok(await p.locator('.world-explore').innerText() === 'EXPLORED 5/5', '5/5 after all areas');
  ok(await p.locator('.world-explore.is-complete').count() === 1, 'chip turns gold at 5/5');
  ok(await p.locator('.world-toast').isVisible(), 'a one-time message appears when everything is explored');
  ok((await p.locator('.world-toast').innerText()).includes('ALL AREAS EXPLORED'), 'the message says so');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.locator('.world-toast').count() === 0 && await scene(p) === 'world', 'Esc closes the message without leaving the village');
  await go(p, '#/profile'); await go(p, '#/world', 1600);
  ok(await p.locator('.world-toast').count() === 0, 'the message never comes back');

  /* ── Options window ── */
  await go(p, '#/profile');
  await p.locator('#options-btn').click(); await p.waitForTimeout(200);
  ok(await p.locator('.modal:visible').count() === 1, 'options opens');
  ok(await p.locator('[role=dialog][aria-modal=true]').count() >= 1, 'dialog semantics');
  ok(await p.evaluate(() => document.activeElement.getAttribute('role')) === 'switch', 'focus lands on first switch');
  const before = await p.evaluate(() => document.activeElement.textContent);
  await p.keyboard.press('ArrowDown');
  ok(await p.evaluate(() => document.activeElement.textContent) === before, 'ArrowDown is ignored by the menu while modal is open');
  // tab trap
  const seen = new Set();
  for (let i = 0; i < 8; i++) { await p.keyboard.press('Tab'); seen.add(await p.evaluate(() => !!document.activeElement.closest('.modal'))); }
  ok(seen.size === 1 && seen.has(true), 'Tab stays inside the dialog');
  for (let i = 0; i < 3; i++) await p.keyboard.press('Shift+Tab');
  ok(await p.evaluate(() => !!document.activeElement.closest('.modal')), 'Shift+Tab stays inside the dialog');
  // scanlines
  await p.locator('.switch', { hasText: 'SCANLINES' }).click();
  ok(await p.evaluate(() => document.documentElement.classList.contains('crt-on')), 'scanlines on');
  ok(await p.locator('.switch', { hasText: 'SCANLINES' }).getAttribute('aria-checked') === 'true', 'switch aria-checked true');
  await p.locator('.switch', { hasText: 'SCANLINES' }).click();
  ok(!(await p.evaluate(() => document.documentElement.classList.contains('crt-on'))), 'scanlines off again');
  // sound switch syncs with HUD
  await p.locator('.switch', { hasText: 'SOUND' }).click();
  ok(await p.locator('#sound-toggle').getAttribute('aria-pressed') === 'true', 'sound switch updates HUD toggle');
  await p.locator('.switch', { hasText: 'SOUND' }).click();
  // reset
  await p.locator('button', { hasText: 'RESET EXPLORED AREAS' }).click();
  await p.waitForTimeout(100);
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('player-one-visited')).length) === 0, 'reset clears saved progress');
  ok(await p.evaluate(() => localStorage.getItem('player-one-explored-notice')) === null, 'reset also re-arms the completion message');
  // Escape closes the dialog only
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.locator('.modal:visible').count() === 0, 'Esc closes options');
  ok(await scene(p) === 'profile', 'Esc did not navigate away');
  ok(await p.evaluate(() => document.activeElement.id) === 'options-btn', 'focus returns to gear button');
  // backdrop click closes
  await p.locator('#options-btn').click(); await p.mouse.click(10, 400); await p.waitForTimeout(200);
  ok(await p.locator('.modal:visible').count() === 0, 'backdrop click closes');
  // prefs persist
  await p.locator('#options-btn').click(); await p.locator('.switch', { hasText: 'SCANLINES' }).click(); await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.documentElement.classList.contains('crt-on')), 'scanlines persists after reload');
  await go(p, '#/world', 1600);
  ok(/^EXPLORED [0-2]\/5$/.test(await p.locator('.world-explore').innerText()), 'the village chip reflects the reset (only the screens visited since)');
  await ctx.close();

  /* ── Sky ── */
  ({ ctx, p } = await newCtx());
  for (const sky of ['dawn', 'day', 'dusk', 'night']) {
    await p.goto(BASE + '?sky=' + sky); await p.waitForTimeout(500);
    ok(await p.locator('.scene.scene-' + sky).count() === 1, 'scene-' + sky + ' via ?sky');
  }
  await ctx.close();
  ({ ctx, p } = await newCtx());
  await p.clock.setFixedTime(new Date(2026, 5, 15, 12, 0, 0));
  await p.goto(BASE); await p.waitForTimeout(500);
  ok(await p.locator('.scene.scene-day').count() === 1, 'noon is day');
  const dayGreeting = await p.locator('.title-greeting').innerText();
  await p.keyboard.press('Enter'); await p.waitForTimeout(1700);
  await go(p, '#/profile');
  await p.locator('#options-btn').click(); await p.locator('.switch', { hasText: 'ALWAYS NIGHT' }).click(); await p.waitForTimeout(150);
  ok(await p.locator('.scene.scene-night').count() === 1, 'ALWAYS NIGHT swaps the scene live');
  await ctx.close();
  // local clock
  for (const [hour, expect] of [[3, 'night'], [6, 'dawn'], [12, 'day'], [18, 'dusk'], [22, 'night']]) {
    ({ ctx, p } = await newCtx());
    await p.clock.setFixedTime(new Date(2026, 5, 15, hour, 0, 0));
    await p.goto(BASE); await p.waitForTimeout(500);
    ok(await p.locator('.scene.scene-' + expect).count() === 1, `hour ${hour} -> ${expect}`);
    await ctx.close();
  }
  ok(dayGreeting.length > 3, 'greeting present: ' + dayGreeting);

  /* ── Skill tree intro ── */
  ({ ctx, p } = await newCtx());
  await p.goto(BASE + '#/skills'); await p.waitForTimeout(500);
  ok(await p.locator('.skills-screen.tree-intro').count() === 1, 'tree intro plays on first visit');
  await p.waitForTimeout(2600);
  ok(await p.locator('.tree-intro').count() === 0, 'tree intro class removed afterwards');
  ok(await p.locator('.tnode-cert').first().evaluate(e => getComputedStyle(e).opacity) === '1', 'nodes fully visible after intro');
  await go(p, '#/profile'); await go(p, '#/skills', 800);
  ok(await p.locator('.tree-intro').count() === 0, 'no intro on second visit');
  await ctx.close();
  ({ ctx, p } = await newCtx({ reducedMotion: 'reduce' }));
  await p.goto(BASE + '#/skills'); await p.waitForTimeout(400);
  ok(await p.locator('.tree-intro').count() === 0, 'no tree intro with reduced motion');
  await p.goto(BASE); await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok(await scene(p) === 'world', 'reduced motion: start goes straight to the village (no walk delay)');
  await ctx.close();

  /* ── Start walk ── */
  ({ ctx, p } = await newCtx());
  await p.goto(BASE); await p.waitForTimeout(500);
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ok(await p.locator('#app.is-launching').count() === 1, 'is-launching during walk');
  const tr = await p.locator('.scene-hero').evaluate(e => getComputedStyle(e).transform);
  ok(tr && tr !== 'none', 'hero is moving: ' + tr);
  await p.waitForTimeout(1500);
  ok(await p.locator('#app.is-launching').count() === 0, 'is-launching cleared after route change');
  await ctx.close();

  /* ── Skill tree: cursor, swap branch, help, chip, breakpoint ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1440, height: 900 } }));
  await p.goto(BASE + '#/skills'); await p.waitForTimeout(3000);
  ok(await p.locator('.tnode-cert').count() === 7, 'seven certification nodes');
  ok(await p.locator('.tree-cursor.is-on').count() === 1, 'cursor visible');
  const cx = async () => p.locator('.tree-cursor').evaluate(e => e.style.left + '|' + e.style.top);
  const c0 = await cx();
  await p.locator('.tnode-cert[data-id=databases]').focus(); await p.waitForTimeout(100);
  ok(await cx() !== c0, 'cursor follows focus');
  await p.locator('.tnode-cert[data-id=html-css]').focus();
  await p.keyboard.press('e');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'databases', 'E moves to next branch (data)');
  await p.keyboard.press('e');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'itf-plus', 'E again -> support');
  await p.keyboard.press('q'); await p.keyboard.press('q');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'html-css', 'Q twice goes back to web');
  await p.keyboard.press('q');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'excel-2019', 'Q wraps to the last branch (digital)');
  ok(await scene(p) === 'skills', 'still on skills after swapping');
  await p.keyboard.press('?');
  ok(await p.locator('#tree-help:visible').count() === 1, '? opens help');
  ok(await p.locator('.tbtn[aria-controls=tree-help]').getAttribute('aria-expanded') === 'true', 'help aria-expanded');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  ok(await p.locator('#tree-help:visible').count() === 0 && await scene(p) === 'skills', 'Esc closes help without leaving the screen');
  await p.locator('.tnode-cert[data-id=google-tsf]').click(); await p.waitForTimeout(400);
  const gt = await cx();
  ok(gt.startsWith('7%'), 'cursor sits on the selected node: ' + gt);
  const chipText = (await p.locator('.tree-chip').innerText()).split('\n').join(' ');
  ok(/EARNED\s*7/.test(chipText) && /PLANNED\s*0/.test(chipText), 'status chip counts: ' + chipText);
  ok(await p.locator('.tree-layout').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length) === 2, 'panel beside the tree at 1440px');
  await ctx.close();
  for (const [w, graph] of [[959, false], [960, true]]) {
    ({ ctx, p } = await newCtx({ viewport: { width: w, height: 900 } }));
    await p.goto(BASE + '#/skills'); await p.waitForTimeout(600);
    ok((await p.locator('.tree-viewport').isVisible()) === graph, 'width ' + w + ': graph visibility is ' + graph);
    ok((await p.locator('.tree-list').isVisible()) === !graph, 'width ' + w + ': list visibility is ' + !graph);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'width ' + w + ': no page overflow');
    await ctx.close();
  }

  /* ── Quest book ── */
  ({ ctx, p } = await newCtx());
  await p.goto(BASE + '#/quests'); await p.waitForTimeout(800);
  ok(await p.locator('.book .page-left .quest-item').count() === 9, 'book lists all 9 quests');
  ok(await p.locator('.book-tab').count() === 4, 'four bookmark tabs');
  ok(await p.locator('.quest-item.is-selected').count() === 1, 'one quest open by default');
  ok(await p.locator('.quest-detail .book-art-svg').count() === 1, 'right page shows generated illustration');
  await p.locator('.book-tab[data-filter=completed]').click();
  const done = await p.locator('.quest-item').count();
  ok(done === 5, 'COMPLETED tab filters to 5: ' + done);
  ok(await p.locator('.book-tab[data-filter=completed]').getAttribute('aria-pressed') === 'true', 'tab aria-pressed');
  ok((await p.locator('.quest-state .sr-only').allInnerTexts()).every(t => t === 'COMPLETED'), 'status text available to screen readers');
  await p.locator('.quest-item').nth(1).click(); await p.waitForTimeout(300);
  ok((await p.evaluate(() => location.hash)).startsWith('#/quests/'), 'selecting writes the quest id to the URL');
  const name = await p.locator('.quest-name').innerText();
  ok((await p.locator('.quest-item.is-selected strong').innerText()) === name, 'right page matches selected row');
  await p.locator('.quest-item').first().focus(); await p.keyboard.press('ArrowDown');
  ok(await p.evaluate(() => document.activeElement.classList.contains('quest-item')), 'ArrowDown moves between rows');
  await p.screenshot({ path: process.argv[2] + '/shots2/book-final.png' });
  await ctx.close();
  // broken screenshot path falls back to art
  ({ ctx, p } = await newCtx());
  await p.route('**/missing-shot.png', r => r.abort());
  await p.goto(BASE + '#/quests'); await p.waitForTimeout(600);
  await p.evaluate(async () => {
    const m = await import('/js/data/projects.js'); m.projects[0].screenshots = [{ src: 'assets/img/missing-shot.png', alt: 'x' }];
  });
  await p.locator('.quest-item').nth(1).click(); await p.locator('.quest-item').first().click(); await p.waitForTimeout(600);
  ok(await p.locator('.quest-detail .book-art-svg').count() === 1, 'missing screenshot falls back to illustration');
  await ctx.close();

  /* ── Achievements wall ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1440, height: 900 } }));
  await p.goto(BASE + '#/achievements'); await p.waitForTimeout(1500);
  ok(await p.locator('.badge-btn').count() === 20, 'twenty badges on the wall: ' + await p.locator('.badge-btn').count());
  ok(await p.locator('.badge-btn.is-locked').count() === 3, 'three locked badges (in-progress quests)');
  ok(await p.locator('.badge-count').first().innerText() === '×2', "Dean's List shows x2");
  ok((await p.locator('.ach-count').innerText()).replace(/\s+/g, ' ').includes('17 / 20'), 'summary reads 17 / 20');
  ok(await p.locator('.badge-btn svg.badge-svg').count() === 20, 'every badge is generated pixel art');
  ok(await p.locator('.shelf').count() === 5, 'five shelves');
  await p.locator('.badge-btn[data-id=quest-nuspot]').click(); await p.waitForTimeout(300);
  ok(await p.locator('#ach-detail.is-open').count() === 1, 'click opens detail');
  ok((await p.evaluate(() => location.hash)) === '#/achievements/quest-nuspot', 'URL reflects badge');
  ok((await p.locator('#ach-detail .item-name').innerText()) === 'NUSpot', 'detail shows NUSpot');
  ok((await p.locator('#ach-detail a[href="#/quests/nuspot"]').count()) === 1, 'detail links to the quest');
  await p.locator('.badge-btn[data-id=quest-eventify]').click(); await p.waitForTimeout(300);
  ok((await p.locator('#ach-detail').innerText()).includes('LOCKED'), 'locked badge says LOCKED');
  ok((await p.locator('#ach-detail').innerText()).includes('in progress'), 'locked badge explains why');
  // keyboard
  await p.locator('.badge-btn').first().focus();
  await p.keyboard.press('ArrowRight');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'shs-honors', 'ArrowRight moves along the shelf');
  await p.keyboard.press('ArrowDown');
  ok(await p.evaluate(() => document.activeElement.dataset.id) !== 'shs-honors' && await p.evaluate(() => document.activeElement.classList.contains('badge-btn')), 'ArrowDown moves to the shelf below');
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.activeElement.id) === 'ach-detail', 'Enter opens and focuses the detail window');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.locator('#ach-detail.is-open').count() === 0 && await scene(p) === 'achievements', 'Esc closes detail first');
  ok(await p.evaluate(() => document.activeElement.classList.contains('badge-btn')), 'focus returns to the badge');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1100);
  ok(await scene(p) === 'world', 'second Esc goes back to the village');
  await ctx.close();
  // deep link + phone sheet
  ({ ctx, p } = await newCtx({ viewport: { width: 360, height: 740 }, hasTouch: true }));
  await p.goto(BASE + '#/achievements/deans-list'); await p.waitForTimeout(1500);
  ok(await p.locator('#ach-detail.is-open').count() === 1, 'deep link opens the badge');
  ok(await p.locator('#ach-detail').getAttribute('role') === 'dialog', 'phone: detail is a dialog sheet');
  const sheet = await p.locator('#ach-detail').boundingBox();
  ok(sheet && sheet.y >= 0 && sheet.y + sheet.height <= 740 && sheet.x >= 0 && sheet.x + sheet.width <= 360, 'phone: sheet fits the viewport');
  await p.locator('#ach-detail .item-close').tap(); await p.waitForTimeout(300);
  ok(await p.locator('#ach-detail.is-open').count() === 0, 'phone: close button closes the sheet');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: no horizontal overflow');
  await ctx.close();

  /* ── Recruiter summary + SEO ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 800 } }));
  await p.goto(BASE); await p.waitForTimeout(3200);
  ok(await p.locator('.title-skip').count() === 1, 'title has a skip-the-game link');
  await p.locator('.title-skip').click(); await p.waitForTimeout(1500);
  ok(await scene(p) === 'summary', 'skip link opens the summary');
  ok((await p.evaluate(() => document.activeElement.tagName)) === 'H1', 'summary focuses its heading');
  ok(await p.locator('.sum-section').count() === 7, 'summary has seven sections: ' + await p.locator('.sum-section').count());
  ok(await p.locator('.sum-list li').count() >= 9 + 7 + 5, 'summary lists projects, certs and achievements');
  ok(await p.locator('a[href="assets/Aaron_Dela_Cruz_CV.pdf"]').count() >= 1, 'summary has the CV link');
  ok(await p.locator('a[href="mailto:ronkydc@gmail.com"]').count() >= 1, 'summary has the email link');
  const visited = await p.evaluate(() => localStorage.getItem('player-one-visited') || '[]');
  ok(!visited.includes('summary'), 'summary does not count as an explored area');
  ok((await p.title()).includes('SUMMARY'), 'summary sets the document title');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
  ok(await scene(p) === 'title', 'Esc returns to the title');
  await ctx.close();
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 800 } }));
  await p.goto(BASE + '#/summary'); await p.waitForTimeout(1500);
  await p.emulateMedia({ media: 'print' });
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.hud')).display === 'none'), 'print: HUD hidden');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sum-actions')).display === 'none'), 'print: buttons hidden');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.sum-sheet')).backgroundColor === 'rgb(255, 255, 255)'), 'print: white paper');
  await ctx.close();
  // no-JS fallback is real content
  { const c = await browser.newContext({ javaScriptEnabled: false }); const q = await c.newPage();
    await q.goto(BASE); const t = await q.locator('.static-fallback').innerText();
    ok(t.includes('NUSpot') && t.includes('Dean') && t.includes('ronkydc@gmail.com'), 'no-JS fallback lists projects, achievements and contact');
    ok(await q.locator('script[type="application/ld+json"]').count() === 1, 'JSON-LD present');
    await c.close(); }

  /* ── Hot-spots + comfort options ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 800 } }));
  await p.goto(BASE); await p.waitForTimeout(3200);
  await p.locator('.scene-hit-cat').click(); await p.waitForTimeout(250);
  ok(await p.locator('.scene-bubble:not([hidden])').count() === 1, 'clicking the cat shows a speech bubble');
  ok((await p.locator('.scene-bubble').innerText()) === 'MEOW.', 'first cat line');
  ok((await p.locator('#announcer').innerText()).includes('Cat says'), 'cat line is announced to screen readers');
  await p.locator('.scene-hit-hero').click(); await p.waitForTimeout(200);
  ok((await p.locator('.scene-bubble').innerText()) === 'Ready, Player One.', 'hero has a line too');
  await p.locator('.scene-hit-cat').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  ok((await p.locator('.scene-bubble').innerText()) === '*purr*', 'keyboard Enter on the cat works (accessible route)');
  ok(await scene(p) === 'title', 'cat/hero do not navigate');
  const press = await p.locator('.press-start').boundingBox();
  ok(await p.evaluate(([x, y]) => document.elementFromPoint(x, y).closest('.press-start') !== null, [press.x + press.width - 6, press.y + press.height - 6]), 'PRESS START stays on top of the terminal hot-spot');
  await p.locator('.scene-hit-terminal').click(); await p.waitForTimeout(1600);
  ok(await scene(p) === 'contact', 'clicking the terminal opens Contact');
  await ctx.close();
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 800 } }));
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(1500);
  await p.locator('#options-btn').click(); await p.waitForTimeout(200);
  ok(await p.locator('.switch').count() === 8, 'options lists eight switches: ' + await p.locator('.switch').count());
  for (const [label, cls] of [['LARGER TEXT', 'pref-big'], ['READABLE FONT', 'pref-readable'], ['HIGH CONTRAST', 'pref-contrast'], ['CALM MOTION', 'pref-calm']]) {
    await p.locator('.switch', { hasText: label }).click();
    ok(await p.evaluate(c => document.documentElement.classList.contains(c), cls), label + ' sets ' + cls);
  }
  ok(await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)) > 18, 'larger text raises the root size');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.screen-title')).fontFamily.includes('IBM Plex')), 'readable font swaps the pixel font');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.cursor-blink') || document.body).animationName === 'none'), 'calm motion stops animation');
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('player-one-settings')));
  ok(saved.bigText && saved.readable && saved.contrast && saved.calm, 'comfort options persist');
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => ['pref-big', 'pref-readable', 'pref-contrast', 'pref-calm'].every(c => document.documentElement.classList.contains(c))), 'comfort options survive a reload');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow with every comfort option on');
  await ctx.close();

  /* ── Music ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 800 } }));
  await p.addInitScript(() => {
    window.__osc = 0; window.__ctxs = [];
    const AC = window.AudioContext;
    window.AudioContext = class extends AC {
      constructor(...a) { super(...a); window.__ctxs.push(this); const o = this.createOscillator.bind(this); this.createOscillator = () => { window.__osc += 1; return o(); }; }
    };
  });
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => localStorage.getItem('player-one-music')) === null, 'music is off by default');
  await p.waitForTimeout(1200);
  ok(await p.evaluate(() => window.__osc) === 0, 'no audio nodes are created while music is off');
  await p.locator('#options-btn').click();
  ok(await p.locator('.switch', { hasText: 'MUSIC' }).getAttribute('aria-checked') === 'false', 'MUSIC switch starts off');
  await p.locator('.switch', { hasText: 'MUSIC' }).click(); await p.waitForTimeout(1800);
  ok(await p.locator('.switch', { hasText: 'MUSIC' }).getAttribute('aria-checked') === 'true', 'MUSIC switch turns on');
  ok(await p.evaluate(() => window.__osc) >= 3, 'notes are being scheduled: ' + await p.evaluate(() => window.__osc));
  ok(await p.evaluate(() => localStorage.getItem('player-one-sound')) !== 'on', 'music does not turn sound effects on');
  // pause when hidden
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(500);
  const frozen = await p.evaluate(() => window.__osc); await p.waitForTimeout(800);
  ok(await p.evaluate(() => window.__osc) === frozen, 'music stops scheduling when the tab is hidden');
  ok(await p.evaluate(() => window.__ctxs[0].state) === 'suspended', 'audio context is suspended while hidden');
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(1200);
  ok(await p.evaluate(() => window.__osc) > frozen, 'music resumes when the tab returns');
  const tune = () => p.evaluate(async () => (await import(location.origin + '/js/core/music.js')).music.tune);
  ok(['morning', 'afternoon', 'night'].includes(await tune()), 'outside the village a time-of-day tune plays: ' + await tune());
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await go(p, '#/world', 1200); await p.waitForTimeout(4600);
  ok(await tune() === 'village', 'in the village the Cozy Village tune plays');
  await go(p, '#/contact', 1200); await p.waitForTimeout(4600);
  ok(['morning', 'afternoon', 'night'].includes(await tune()), 'leaving the village brings back the time-of-day tune');
  await p.locator('#options-btn').click(); await p.waitForTimeout(250);
  await p.locator('.switch', { hasText: 'MUSIC' }).click(); await p.waitForTimeout(600);
  const stopped = await p.evaluate(() => window.__osc); await p.waitForTimeout(900);
  ok(await p.evaluate(() => window.__osc) === stopped, 'turning music off stops it');
  ok(await p.evaluate(() => localStorage.getItem('player-one-music')) === 'off', 'off is remembered');
  await ctx.close();

  /* ── Walk around (world): full-screen map with a following camera ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 900 } }));
  await p.goto(BASE); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: /press start/i }).click(); await p.waitForTimeout(2200);
  ok(await scene(p) === 'world', 'PRESS START opens the village directly');
  ok(await p.locator('.menu-item').count() === 0, 'there is no main menu');
  ok((await p.locator('.world-bar .hud-back').innerText()).includes('TITLE'), 'the village button says TITLE');
  ok(await p.locator('.world-explore').isVisible(), 'the EXPLORED counter is in the village bar');
  ok(!(await p.locator('.hud').isVisible()), 'full screen: the top HUD is hidden in the village');
  ok(await p.locator('.world-map svg.world-art').count() === 1, 'map is generated art');
  ok(!(await p.locator('.world-drawer').isVisible()), 'locations drawer is closed by default');
  const mapBox = async () => p.locator('.world-map').boundingBox();
  const heroAt = () => p.evaluate(() => { const s = getComputedStyle(document.querySelector('.world-hero')); return [s.getPropertyValue('--x').trim(), s.getPropertyValue('--y').trim()].join(','); });
  const heroScreen = async () => { const r = await p.locator('.world-hero').boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  let mb = await mapBox();
  ok(mb.width > 1280 * 1.5 && mb.height > 900, 'the map is bigger than the screen');
  ok(await heroAt() === '15,10', 'hero starts in the village square at 15,10');
  let hs = await heroScreen();
  ok(Math.abs(hs[0] - 640) < 60 && Math.abs(hs[1] - 450) < 60, 'camera keeps the hero near the middle of the screen');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250);
  ok(await heroAt() === '14,10', 'ArrowLeft walks one tile');
  const mb2 = await mapBox();
  ok(mb2.x > mb.x + 20, 'the camera scrolled when the hero walked');
  hs = await heroScreen();
  ok(Math.abs(hs[0] - 640) < 60, 'hero stays centred while the map scrolls');
  ok(await p.locator('.world-screen.has-moved').count() === 1, 'the key hint fades once you move');
  await p.keyboard.press('d'); await p.waitForTimeout(250);
  ok(await heroAt() === '15,10', 'D walks right');
  await p.keyboard.down('ArrowRight');
  for (let i = 0; i < 8; i += 1) { await p.keyboard.down('ArrowRight'); await p.waitForTimeout(30); }
  await p.keyboard.up('ArrowRight'); await p.waitForTimeout(250);
  ok(await heroAt() === '16,10', 'holding a key down moves exactly one tile');
  await p.keyboard.down('d'); await p.keyboard.down('d'); await p.keyboard.down('d'); await p.keyboard.up('d'); await p.waitForTimeout(200);
  ok(await heroAt() === '17,10', 'holding D also moves one tile');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250);
  ok(await heroAt() === '15,10', 'separate presses each move one tile');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(120);
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(120);
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(150);
  ok(await heroAt() === '13,9', 'a lamp post blocks the hero');
  await p.keyboard.press('d'); await p.waitForTimeout(120); await p.keyboard.press('d'); await p.waitForTimeout(120);
  for (let i = 0; i < 3; i += 1) { await p.keyboard.press('ArrowUp'); await p.waitForTimeout(130); }
  ok(await heroAt() === '15,6', 'walks up the path to the tower');
  ok(await p.locator('.world-bubble').isVisible(), 'a speech bubble appears next to a door');
  ok((await p.locator('.world-bubble').innerText()).includes('SKILL TREE'), 'the bubble names the building');
  ok((await p.locator('.world-screen [role=status]').textContent()).includes('Near'), 'screen readers hear which building is near');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(1900);
  ok(await scene(p) === 'skills', 'walking onto a door opens that screen');
  ok((await p.locator('.hud-back-label').innerText()) === 'VILLAGE', 'HUD back says VILLAGE when you came from the village');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1700);
  ok(await scene(p) === 'world', 'Esc returns to the village');
  ok(await heroAt() === '15,5', 'hero is still standing at the tower door');
  // locations drawer = fast travel
  await p.keyboard.press('l'); await p.waitForTimeout(300);
  ok(await p.locator('.world-drawer').isVisible(), 'L opens the locations drawer');
  ok(await p.locator('.loc').count() === 5, 'five locations listed');
  ok(await p.locator('.world-locations-btn').getAttribute('aria-expanded') === 'true', 'LOCATIONS button reports it is expanded');
  ok(await p.locator('.loc').first().evaluate(el => el === document.activeElement), 'focus moves into the drawer');
  ok(await p.locator('.loc .loc-check svg').count() >= 1, 'visited places get a checkmark in the list');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await scene(p) === 'world' && !(await p.locator('.world-drawer').isVisible()), 'Esc closes the drawer first, without leaving the village');
  ok(await p.locator('.world-locations-btn').evaluate(el => el === document.activeElement), 'focus returns to the LOCATIONS button');
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  ok(await scene(p) === 'world', 'Esc never takes you out of the village');
  await p.keyboard.press('l'); await p.waitForTimeout(250);
  ok(await p.locator('.world-drawer a[href="#/summary"]').isVisible(), 'the drawer links to the plain summary');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  await p.keyboard.press('l'); await p.waitForTimeout(250);
  await p.locator('.loc', { hasText: 'ACHIEVEMENTS' }).click(); await p.waitForTimeout(4200);
  ok(await scene(p) === 'achievements', 'LOCATIONS list walks there and opens it');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1700);
  ok(await scene(p) === 'world', 'back in the village after Achievements');
  ok(await p.locator('.world-flag').evaluateAll(els => els.filter(e => e.style.display !== 'none').length) >= 2, 'visited buildings fly a flag');
  // click an open tile: the hero walks there
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200);
  const preClick = await heroAt();
  mb = await mapBox();
  const tilePx = mb.width / 32;
  const [hx, hy] = preClick.split(',').map(Number);
  await p.mouse.click(mb.x + (hx + 3.5) * tilePx, mb.y + (hy + 0.5) * tilePx); await p.waitForTimeout(900);
  ok(await heroAt() !== preClick, 'clicking an open tile walks the hero there');
  ok((await p.evaluate(() => document.querySelector('.world-art').getAttribute('viewBox'))) === '0 0 512 320', 'the village is 32 x 20 tiles');
  ok(await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'full screen: the page itself does not scroll');
  await ctx.close();
  // reduced motion: instant
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }));
  await p.goto(BASE + '#/world'); await p.waitForTimeout(1200);
  await p.keyboard.press('l'); await p.waitForTimeout(200);
  await p.locator('.loc', { hasText: 'CONTACT' }).click(); await p.waitForTimeout(500);
  ok(await scene(p) === 'contact', 'reduced motion: walks instantly and opens');
  await ctx.close();
  // phone: d-pad, drawer and no overflow
  ({ ctx, p } = await newCtx({ viewport: { width: 360, height: 740 }, hasTouch: true }));
  await p.goto(BASE + '#/world'); await p.waitForTimeout(1500);
  ok(await p.locator('.dpad').isVisible(), 'phone: on-screen arrows visible');
  await p.locator('.dpad-left').tap(); await p.waitForTimeout(250);
  ok(await heroAt() === '14,10', 'phone: arrow moves the hero');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: no horizontal overflow');
  const bar = await p.locator('.world-bar-right').boundingBox();
  ok(bar && bar.x + bar.width <= 360 + 0.5, 'phone: button bar fits the screen');
  await p.locator('.world-locations-btn').tap(); await p.waitForTimeout(300);
  const dr = await p.locator('.world-drawer').boundingBox();
  ok(dr && dr.x >= 0 && dr.x + dr.width <= 360 + 0.5, 'phone: drawer fits the screen');
  await p.locator('.loc', { hasText: 'PROFILE' }).tap(); await p.waitForTimeout(4500);
  ok(await scene(p) === 'profile', 'phone: choosing Profile in the drawer walks there and opens it');
  await ctx.close();

  /* ── Profile: equipment screen ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 900 } }));
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(1500);
  ok(await p.locator('.gear-slot').count() === 6, 'profile: six equipment slots');
  ok((await p.locator('.ribbon').innerText()).includes('RON'), 'profile: ribbon shows the name');
  ok(await p.locator('.stat-strip dd').count() === 4, 'profile: four stats under the hero');
  ok((await p.locator('.stat-strip dd').first().innerText()) === '9', 'profile: project count comes from the project data');
  ok(await p.locator('.view-tab[aria-pressed=true]').innerText() === 'EQUIPMENT', 'profile: equipment is the default view');
  ok(!(await p.locator('#view-stats').isVisible()), 'profile: written profile is hidden by default');
  await p.locator('.gear-slot').nth(3).hover(); await p.waitForTimeout(150);
  ok((await p.locator('.inspect-body').innerText()).includes('Docker'), 'profile: hovering a slot inspects it');
  ok(await p.locator('.inspect-body a[href^="#/quests/"]').count() >= 1, 'profile: inspect lines link to the projects that use the item');
  await p.locator('.gear-slot').first().focus(); await p.waitForTimeout(150);
  ok((await p.locator('.inspect-body').innerText()).includes('JavaScript'), 'profile: keyboard focus inspects a slot');
  await p.locator('.view-tab', { hasText: 'PLAYER STATS' }).click(); await p.waitForTimeout(200);
  ok(await p.locator('#view-stats').isVisible() && !(await p.locator('#view-equipment').isVisible()), 'profile: PLAYER STATS shows the written profile');
  ok((await p.locator('#view-stats').innerText()).includes('National University'), 'profile: education is still on the page');
  await ctx.close();
  ({ ctx, p } = await newCtx({ viewport: { width: 360, height: 740 }, hasTouch: true }));
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'profile: no horizontal overflow at 360px');
  await p.locator('.gear-slot').nth(1).tap(); await p.waitForTimeout(200);
  ok(await p.locator('.gear-list li.is-open .gear-inline').first().isVisible(), 'profile: on a phone the detail opens under the tapped slot');
  await ctx.close();

  /* ── Contact: post office ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 1280, height: 900 } }));
  await p.goto(BASE + '#/contact'); await p.waitForTimeout(1500);
  ok(await p.locator('.topic input').count() === 4, 'contact: four quest types');
  ok(await p.locator('.topic input:checked').getAttribute('value') === 'internship', 'contact: internship offer is the default quest type');
  ok(await p.locator('.stamp-slot').count() === 3, 'contact: email, GitHub and LinkedIn stamps');
  ok((await p.locator('.contact-package a').getAttribute('href')).endsWith('.pdf'), 'contact: the CV package links to the PDF');
  await p.locator('.topic', { hasText: 'A QUESTION' }).click();
  ok(await p.locator('.topic input:checked').getAttribute('value') === 'question', 'contact: choosing a quest type selects it');
  await p.keyboard.press('Tab'); // moves on without trapping
  await p.locator('.compose button[type=submit]').click(); await p.waitForTimeout(200);
  ok(!(await p.locator('.letter').evaluate(el => el.classList.contains('is-posted'))), 'contact: an empty letter is not "posted"');
  await p.locator('#cf-name').fill('Test Person'); await p.locator('#cf-email').fill('test@example.com'); await p.locator('#cf-message').fill('Hello');
  await p.locator('.compose button[type=submit]').click(); await p.waitForTimeout(300);
  ok(await p.locator('.letter').evaluate(el => el.classList.contains('is-posted')), 'contact: a valid letter gets the POSTED stamp');
  ok((await p.locator('.compose .form-status').innerText()).includes('Nothing has been sent'), 'contact: the status says nothing was sent');
  await ctx.close();

  /* ── Mobile ── */
  ({ ctx, p } = await newCtx({ viewport: { width: 360, height: 740 }, hasTouch: true }));
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'profile: no horizontal overflow at 360px');
  const hud = await p.locator('.hud-right').boundingBox();
  ok(hud && hud.x + hud.width <= 360 + 0.5, 'HUD right group fits at 360px');
  await p.locator('#options-btn').tap(); await p.waitForTimeout(250);
  const dlg = await p.locator('.modal-win').boundingBox();
  ok(dlg && dlg.x >= 0 && dlg.x + dlg.width <= 360 && dlg.y >= 0 && dlg.y + dlg.height <= 740, 'options dialog inside viewport on phone');
  await p.screenshot({ path: process.argv[2] + '/shots2/options-mobile.png' });
  await ctx.close();

  /* ── Production-readiness checks ── */
  ({ ctx, p } = await newCtx());
  const cspErrors = [];
  p.on('console', m => { if (/Content Security Policy/i.test(m.text())) cspErrors.push(m.text()); });
  await p.goto(BASE + '#/skills/%E0%A4%A'); await p.waitForTimeout(1500);
  ok(await p.locator('.screen-inner, .skill-screen, [data-scene]').count() > 0 && await scene(p) === 'skills', 'a malformed escape in the URL does not crash the router');
  for (const r of ['world', 'profile', 'quests', 'achievements', 'contact', 'summary']) await go(p, '#/' + r, 1400);
  ok(cspErrors.length === 0, 'the Content-Security-Policy blocks nothing the site needs: ' + cspErrors.join(' | ').slice(0, 200));
  await ctx.close();

  ({ ctx, p } = await newCtx());
  await p.goto(BASE + '#/world'); await p.waitForTimeout(1500);
  await p.route('**/js/scenes/quests.js', route => route.abort());
  await go(p, '#/quests', 1500);
  ok(await scene(p) === 'world', 'a screen that fails to download leaves the current screen in place');
  ok(await p.locator('#announcer').innerText() !== '', 'and says so for screen readers');
  await p.unroute('**/js/scenes/quests.js');
  await ctx.close();

  ({ ctx, p } = await newCtx());
  await p.route('**/js/main.js', route => route.abort());
  await p.goto(BASE); await p.waitForTimeout(1200);
  ok(await p.locator('.static-fallback').isVisible(), 'if the game script cannot load, the plain-text portfolio is shown');
  await ctx.close();

  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(`pass ${pass}, fail ${failN}`);
  await browser.close();
})();
