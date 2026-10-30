const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4173/';
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) pass++; else { failN++; console.log('FAIL:', m); } };
(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const newPage = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    return p;
  };
  const hash = p => p.evaluate(() => location.hash);
  const route = p => p.evaluate(() => document.getElementById('app').dataset.scene);

  /* 1-3 keyboard flow */
  let p = await newPage();
  await p.goto(BASE); await p.waitForTimeout(600);
  ok(await route(p) === 'title', 'starts on title');
  await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.keyboard.press(' ');
  await p.waitForTimeout(1700);
  ok(await route(p) === 'world' && await hash(p) === '#/world', 'Enter starts game once -> the village (no main menu)');
  ok(await p.locator('.menu-item').count() === 0, 'there is no main menu');
  await p.goto(BASE + '#/menu'); await p.waitForTimeout(1500);
  ok(await route(p) === 'world' && await hash(p) === '#/world', 'old #/menu links land in the village');
  await p.keyboard.press('l'); await p.waitForTimeout(250);
  await p.locator('.loc', { hasText: 'SKILL TREE' }).click(); await p.waitForTimeout(4500);
  ok(await route(p) === 'skills', 'choosing SKILL TREE in the village opens skills');
  // Tab to first cert node
  await p.locator('.tnode-cert').first().focus();
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok(await p.locator('#tree-detail.is-open').count() === 1, 'Enter opens detail panel');
  ok(await p.evaluate(() => document.activeElement.id === 'tree-detail'), 'focus moved into panel');
  ok((await hash(p)).startsWith('#/skills/html-css'), 'URL reflects selection: ' + await hash(p));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.locator('#tree-detail.is-open').count() === 0, 'Esc closes panel');
  ok(await p.evaluate(() => document.activeElement.classList.contains('tnode-cert')), 'focus returns to node');
  ok(await route(p) === 'skills', 'still on skills after first Esc');
  await p.keyboard.press('ArrowRight');
  ok(await p.evaluate(() => document.activeElement.dataset.id) === 'python-essentials-1', 'ArrowRight moves along branch');
  await p.keyboard.press('ArrowDown');
  ok(await p.evaluate(() => document.activeElement.dataset.id) !== 'python-essentials-1', 'ArrowDown moves to another branch');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1000);
  ok(await route(p) === 'world', 'Esc returns to the village');
  await p.keyboard.press('Escape'); await p.waitForTimeout(1000);
  ok(await route(p) === 'world', 'Esc never leaves the village');
  await p.locator('.world-bar .hud-back').click(); await p.waitForTimeout(1200);
  ok(await route(p) === 'title', 'the TITLE button returns to the title screen');
  // browser back/forward
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  await p.goto(BASE + '#/profile'); await p.waitForTimeout(900);
  ok(await route(p) === 'profile', 'deep link to profile');
  await p.goBack(); await p.waitForTimeout(1000);
  ok(await route(p) !== 'profile', 'browser Back leaves profile (now ' + await route(p) + ')');

  /* tree geometry at multiple widths */
  for (const w of [960, 1000, 1240, 1440, 1700]) {
    const q = await newPage(); await q.setViewportSize({ width: w, height: 900 });
    await q.goto(BASE + '#/skills'); await q.waitForTimeout(900);
    const res = await q.evaluate(() => {
      const svg = document.querySelector('.tree-lines');
      const ctm = svg.getScreenCTM();
      const toScreen = (pt) => ({ x: pt.x * ctm.a + ctm.e, y: pt.y * ctm.d + ctm.f });
      const centers = {};
      document.querySelectorAll('.tnode').forEach(n => { const r = n.getBoundingClientRect(); const id = n.dataset.id || n.querySelector('.tnode-label')?.textContent; centers[id] = { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      const bad = []; let count = 0;
      svg.querySelectorAll('path.edge:not(.edge-stub)').forEach(p => {
        count++;
        const len = p.getTotalLength();
        const a = toScreen(p.getPointAtLength(0)), b = toScreen(p.getPointAtLength(len));
        const near = pt => Object.values(centers).some(c => Math.hypot(c.x - pt.x, c.y - pt.y) < 3);
        if (!near(a) || !near(b)) bad.push({ a, b });
      });
      // label overlap with other node gems
      const gems = [...document.querySelectorAll('.tnode')].map(n => n.querySelector('.tframe').getBoundingClientRect());
      const overlaps = [];
      document.querySelectorAll('.tnode-label').forEach(l => { const r = l.getBoundingClientRect(); const own = l.closest('.tnode').querySelector('.tframe').getBoundingClientRect(); gems.forEach(g => { if (g !== own && !(r.right < g.left || r.left > g.right || r.bottom < g.top || r.top > g.bottom)) overlaps.push(l.textContent); }); });
      const vp = document.querySelector('.tree-viewport');
      return { count, bad, overlaps, hscroll: vp.scrollWidth > vp.clientWidth, docOverflow: document.documentElement.scrollWidth > innerWidth };
    });
    ok(res.count === 11 && res.bad.length === 0, `connectors meet nodes at ${w}px (paths ${res.count}, bad ${JSON.stringify(res.bad).slice(0,120)})`);
    ok(res.overlaps.length === 0, `no label/node overlap at ${w}px: ${res.overlaps}`);
    ok(!res.docOverflow, `no page horizontal overflow at ${w}px`);
    // panel does not shift nodes when opened
    const doc = async () => { const b = await q.locator('.tnode-cert[data-id="databases"]').boundingBox(); const sy = await q.evaluate(() => scrollY); return { x: b.x, y: b.y + sy }; };
    const before = await doc();
    await q.locator('.tnode-cert[data-id="databases"]').click(); await q.waitForTimeout(500);
    const after = await doc();
    ok(Math.abs(before.x - after.x) < 1 && Math.abs(before.y - after.y) < 1, `node stable when panel opens at ${w}px`);
    ok(await q.locator('.tnode-cert.is-selected').count() === 1, 'one selected node');
    ok(await q.locator('.edge.is-lit').count() === 2, 'selected path highlighted (2 edges), got ' + await q.locator('.edge.is-lit').count());
    await q.context().close();
  }

  /* reduced motion */
  const rm = await newPage({ reducedMotion: 'reduce' });
  await rm.goto(BASE); await rm.waitForTimeout(300);
  await rm.getByRole('button', { name: /press start/i }).click();
  await rm.waitForTimeout(250);
  ok(await route(rm) === 'world', 'reduced motion: the village appears without wipe delay');
  const anim = await rm.evaluate(() => document.getAnimations().length);
  ok(anim === 0, 'reduced motion: no running animations (' + anim + ')');
  await rm.context().close();

  /* contact form: no navigation from typing keys, validation, no fake success */
  const cf = await newPage();
  await cf.goto(BASE + '#/contact'); await cf.waitForTimeout(900);
  await cf.locator('#cf-name').focus();
  await cf.keyboard.type('a b'); await cf.keyboard.press('Escape');
  ok(await route(cf) === 'contact', 'typing/Esc in input does not navigate');
  await cf.getByRole('button', { name: /open email draft/i }).click(); await cf.waitForTimeout(200);
  ok((await cf.locator('#cf-email-error').innerText()).length > 0, 'validation error shown');
  ok((await cf.locator('.form-status').innerText()) === '', 'no success text when invalid');
  await cf.context().close();

  /* mobile: overflow on every screen + quest flow */
  const mb = await newPage({ viewport: { width: 360, height: 740 }, hasTouch: true });
  for (const r of ['', '#/world', '#/profile', '#/skills', '#/quests', '#/achievements', '#/contact']) {
    await mb.goto(BASE + r); await mb.waitForTimeout(1300);
    const o = await mb.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(o.sw <= o.iw, `no horizontal overflow at 360px on "${r}" (${o.sw}>${o.iw})`);
  }
  await mb.goto(BASE + '#/quests'); await mb.waitForTimeout(700);
  await mb.locator('.quest-item').nth(2).tap(); await mb.waitForTimeout(500);
  ok(await mb.locator('.quest-layout').getAttribute('data-view') === 'detail', 'mobile quest opens detail');
  await mb.keyboard.press('Escape'); await mb.waitForTimeout(300);
  ok(await mb.locator('.quest-layout').getAttribute('data-view') === 'list', 'mobile Esc returns to list');
  await mb.goto(BASE + '#/skills'); await mb.waitForTimeout(700);
  await mb.locator('.lnode').nth(1).tap(); await mb.waitForTimeout(500);
  const sheet = await mb.locator('#tree-detail').boundingBox();
  ok(sheet && sheet.y > 0 && sheet.y + sheet.height <= 740, 'sheet fully inside viewport');
  await mb.keyboard.press('Escape'); await mb.waitForTimeout(300);
  ok(await mb.locator('#tree-detail.is-open').count() === 0, 'sheet closes on Esc');
  ok(await mb.evaluate(() => !document.body.classList.contains('sheet-open')), 'scroll lock released');

  /* no-JS / failed module fallback */
  const nj = await newPage({ javaScriptEnabled: false });
  await nj.goto(BASE); 
  ok(await nj.locator('.static-fallback').isVisible(), 'no-JS fallback visible');
  await nj.context().close();

  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no page errors');
  console.log(`pass ${pass}, fail ${failN}`);
  await browser.close();
})();
