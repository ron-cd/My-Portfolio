/**
 * skilltree.js — SKILL TREE: certifications as a radial, connected graph.
 *
 * Rendering strategy
 *  • ≥ 960px wide: absolutely-positioned diamond nodes over an SVG rail layer.
 *    Both share one 1000 × 650 logical coordinate space (percent-based positions
 *    plus a fixed aspect ratio), so rails always meet the right nodes and nothing
 *    moves when the detail panel opens. Narrower desktop windows scroll the canvas
 *    sideways a little instead of shrinking nodes into dots.
 *  • < 960px: a compact branch list that keeps the hub → branch → certification
 *    structure, with the detail panel as a bottom sheet.
 *
 * The hub sits in the middle; four branches leave it on 45° diagonals and then run
 * along horizontal rows (see the layout note in js/data/certifications.js).
 * A game-style cursor (orange diamond) follows focus and hover.
 *
 * All data lives in js/data/certifications.js.
 */

import { h, svg, prefersReducedMotion } from '../core/dom.js';
import { sprite } from '../core/sprites.js';
import { nodes, branches, TREE_SIZE, STATUS_LABEL } from '../data/certifications.js';
import { screenHeader, tagList, button, statusBadge, returnRow } from '../ui/components.js';

export const label = 'SKILL TREE';

const { width: W, height: H } = TREE_SIZE;
const STUB = 46; // how far an end-of-line rail extends past its last node
const compactQuery = '(max-width: 959px)';

/** Colour family of a node: certs carry a category; branch nodes are named b-<category>. */
const catOf = n => n.category || (n.kind === 'branch' ? n.id.replace(/^b-/, '') : 'root');

/** A diamond frame with the glyph counter-rotated inside it. */
const frame = (n, className = '') => h('span', { class: `tframe ${className}`.trim(), 'aria-hidden': 'true' },
  // The glyph is drawn by CSS (attr()) so it is decoration, not text that a button's name must repeat.
  h('span', { class: `tgem${n.glyph.length > 2 ? ' tgem-long' : ''}`, dataset: { glyph: n.glyph } }));

const INTRO_KEY = 'player-one-tree-intro';
function introSeen() {
  try {
    if (sessionStorage.getItem(INTRO_KEY)) return true;
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch { /* private mode: just play it */ }
  return false;
}

export function mount(ctx) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const parentOf = new Map();
  nodes.forEach(n => n.connections.forEach(child => parentOf.set(child, n.id)));
  const certs = nodes.filter(n => n.kind === 'cert');

  /** Ids from a node up to the root (inclusive). */
  const pathToRoot = id => {
    const out = [];
    let cursor = id;
    while (cursor) { out.push(cursor); cursor = parentOf.get(cursor); }
    return out;
  };

  const compact = window.matchMedia(compactQuery);
  let selectedId = null;
  let lastTrigger = null; // element to refocus when the panel closes

  const rootNode = nodes.find(n => n.kind === 'root');
  const depthOf = id => pathToRoot(id).length - 1;
  const pct = (x, y) => `left:${(x / W) * 100}%;top:${(y / H) * 100}%`;
  const place = n => pct(n.x, n.y);

  /* ── Rail layer ──────────────────────────────────────────── */
  const edgeEls = new Map(); // `${from}>${to}` → <path> (the coloured core of each rail)
  const lines = svg('svg', {
    class: 'tree-lines',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const casings = svg('g', { class: 'rail-casings' });
  const cores = svg('g', { class: 'rail-cores' });
  lines.append(casings, cores);
  const joints = [];

  const railPath = (d, className, depth) => {
    const p = svg('path', { d, class: className, 'vector-effect': 'non-scaling-stroke', fill: 'none' });
    p.style.setProperty('--depth', String(depth));
    return p;
  };

  nodes.forEach(from => from.connections.forEach(toId => {
    const to = byId.get(toId);
    const d = `M${from.x} ${from.y}L${to.x} ${to.y}`;
    const cat = catOf(to);
    const depth = depthOf(to.id);
    casings.append(railPath(d, 'rail-casing', depth));
    const core = railPath(d, `edge edge-${to.status || 'earned'} cat-${cat}`, depth);
    edgeEls.set(`${from.id}>${to.id}`, core);
    cores.append(core);
    joints.push(h('span', {
      class: `tjoint cat-${cat}`,
      style: `${pct((from.x + to.x) / 2, (from.y + to.y) / 2)};--depth:${depth}`,
      'aria-hidden': 'true',
    }));
  }));

  // End-of-line stubs: a short dim rail with a cap, so rows read as "the line continues".
  certs.filter(n => !n.connections.length).forEach(n => {
    const dir = n.x >= rootNode.x ? 1 : -1;
    const end = n.x + dir * STUB;
    cores.append(
      railPath(`M${n.x} ${n.y}H${end}`, `edge edge-stub cat-${catOf(n)}`, depthOf(n.id) + 1),
      railPath(`M${end} ${n.y - 12}V${n.y + 12}`, `edge edge-stub cat-${catOf(n)}`, depthOf(n.id) + 1));
  });

  /* ── Desktop graph nodes ─────────────────────────────────── */
  const nodeButtons = new Map(); // id → [elements] (graph + list share selection state)

  const track = (id, el) => {
    if (!nodeButtons.has(id)) nodeButtons.set(id, []);
    nodeButtons.get(id).push(el);
  };

  const labelSide = n => (n.y < rootNode.y ? ' label-up' : '');

  function ariaLabelFor(n) {
    // Starts with the visible label so the accessible name contains the visible text (WCAG 2.5.3).
    const shown = n.status === 'earned' ? n.short : `${n.short} ${STATUS_LABEL[n.status]}`;
    return `${shown}. ${n.title}, ${n.issuer}. Status: ${STATUS_LABEL[n.status]}.`;
  }

  function graphCert(n) {
    const btn = h('button', {
      class: `tnode tnode-cert cat-${catOf(n)} is-${n.status}${labelSide(n)}`,
      type: 'button',
      style: `${place(n)};--depth:${depthOf(n.id)}`,
      dataset: { id: n.id },
      'aria-label': ariaLabelFor(n),
      'aria-pressed': 'false',
      onClick: event => choose(n.id, { viaKeyboard: event.detail === 0, trigger: event.currentTarget }),
      onMouseenter: () => { lightPath(n.id); moveCursor(n.id); },
      onMouseleave: () => lightPath(selectedId),
      onFocus: () => { lightPath(n.id); moveCursor(n.id); },
      onBlur: () => lightPath(selectedId),
    },
    frame(n),
    n.status === 'earned' ? h('span', { class: 'tnode-star', 'aria-hidden': 'true' }, sprite('sparkle')) : null,
    h('span', { class: 'tnode-label', 'aria-hidden': 'true' },
      n.short,
      n.status !== 'earned' ? h('span', { class: 'tnode-state' }, STATUS_LABEL[n.status]) : null));
    track(n.id, btn);
    return btn;
  }

  function graphBranch(n) {
    return h('div', { class: `tnode tnode-branch cat-${catOf(n)}${labelSide(n)}`, style: `${place(n)};--depth:${depthOf(n.id)}` },
      frame(n),
      h('h2', { class: 'tnode-label' }, n.title));
  }

  const graphNodes = [
    h('div', { class: 'tnode tnode-root', style: place(rootNode), 'aria-hidden': 'true' },
      h('span', { class: 'tframe tframe-hub' }, sprite('hero1')),
      h('span', { class: 'tnode-label' }, rootNode.title)),
  ];
  branches.forEach(branch => {
    const start = byId.get(branch.id);
    graphNodes.push(graphBranch(start));
    let cursorId = start.connections[0];
    while (cursorId) {
      const cert = byId.get(cursorId);
      graphNodes.push(graphCert(cert));
      cursorId = cert.connections[0];
    }
  });

  /* The orange diamond cursor: follows focus and hover, like a gamepad menu. */
  const cursor = h('span', { class: 'tree-cursor', 'aria-hidden': 'true' });
  let cursorId = null;
  function moveCursor(id) {
    const n = byId.get(id);
    if (!n) return;
    cursorId = id;
    cursor.style.left = `${(n.x / W) * 100}%`;
    cursor.style.top = `${(n.y / H) * 100}%`;
    cursor.classList.add('is-on');
  }

  const canvas = h('div', {
    class: 'tree-canvas',
    role: 'group',
    'aria-label': 'Certification skill tree. Lines group certifications by topic and are not official prerequisites.',
  }, lines, ...joints, ...graphNodes, cursor);

  const graph = h('div', { class: 'tree-viewport' }, canvas);

  /* ── Compact (mobile) list ───────────────────────────────── */
  const listBranches = branches.map(branch => {
    const start = byId.get(branch.id);
    const items = [];
    let cursorId = start.connections[0];
    while (cursorId) {
      const cert = byId.get(cursorId);
      const btn = h('button', {
        class: `lnode cat-${catOf(cert)} is-${cert.status}`,
        type: 'button',
        dataset: { id: cert.id },
        'aria-pressed': 'false',
        onClick: event => choose(cert.id, { viaKeyboard: event.detail === 0, trigger: event.currentTarget }),
      },
      h('span', { class: 'lnode-mark', 'aria-hidden': 'true' }, frame(cert, 'tframe-sm')),
      h('span', { class: 'lnode-text' },
        h('strong', {}, cert.short),
        h('small', {}, `${cert.issuer} · ${cert.date || 'Date not listed'}`)),
      h('span', { class: `lnode-status lnode-status-${cert.status}` }, STATUS_LABEL[cert.status]));
      track(cert.id, btn);
      items.push(h('li', {}, btn));
      cursorId = cert.connections[0];
    }
    return h('li', { class: `branch cat-${catOf(start)}` },
      h('h2', { class: 'branch-title' }, h('span', { class: 'lnode-mark', 'aria-hidden': 'true' }, frame(start, 'tframe-sm tframe-branch')), start.title),
      h('ol', { class: 'branch-nodes' }, ...items));
  });
  const list = h('ol', { class: 'tree-list', 'aria-label': 'Certification branches' }, ...listBranches);

  /* ── Detail panel ────────────────────────────────────────── */
  const panelBody = h('div', { class: 'item-body' });
  const panel = h('div', {
    class: 'win item-window',
    id: 'tree-detail',
    tabindex: '-1',
    'aria-labelledby': 'tree-detail-heading',
  },
  h('h2', { class: 'win-title', id: 'tree-detail-heading' }, 'ITEM'),
  h('div', { class: 'win-body' }, panelBody));
  const backdrop = h('div', { class: 'sheet-backdrop', onClick: () => close({ restoreFocus: true }) });
  const liveRegion = h('p', { class: 'sr-only', 'aria-live': 'polite' });

  function renderEmpty() {
    panelBody.replaceChildren(
      h('p', { class: 'item-empty-title' }, 'SELECT A NODE'),
      h('p', { class: 'muted' }, 'Choose a certification to read its details, skills covered, and credential link.'),
      h('p', { class: 'muted' }, 'Keyboard: Tab or arrow keys to move, Enter or Space to open, Esc to close.'));
  }

  function renderDetail(n) {
    const rows = [
      ['ISSUER', n.issuer],
      ['DATE', n.date || 'Date not listed yet'],
    ];
    if (n.credentialId) rows.push(['CREDENTIAL ID', n.credentialId]);

    panelBody.replaceChildren(...[
      h('div', { class: 'item-head' },
        h('span', { class: `item-gem cat-${catOf(n)} is-${n.status}`, 'aria-hidden': 'true' }, frame(n, 'tframe-md')),
        h('div', {},
          h('h3', { class: 'item-name' }, n.title),
          statusBadge(n.status, STATUS_LABEL[n.status]))),
      h('dl', { class: 'item-rows' }, rows.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))),
      h('p', { class: 'item-desc' }, n.description),
      h('h4', { class: 'sub-label' }, 'SKILLS COVERED'),
      tagList(n.skills, 'Skills covered'),
      n.status !== 'earned' ? h('p', { class: 'item-warn' }, n.status === 'planned' ? 'Future goal. Not earned yet.' : 'Currently in progress. Not earned yet.') : null,
      n.url
        ? button({ label: 'VIEW CREDENTIAL', href: n.url, external: true, icon: 'trophy', ariaLabel: `View credential for ${n.title} (opens in a new tab)` })
        : h('p', { class: 'muted' }, 'No public credential link yet.'),
      h('div', { class: 'item-actions' },
        button({ label: 'CLOSE', variant: 'ghost', onClick: () => close({ restoreFocus: true }), className: 'item-close' }))].filter(Boolean));
  }

  /* ── Selection ───────────────────────────────────────────── */
  function lightPath(id) {
    const ids = id ? new Set(pathToRoot(id)) : new Set();
    edgeEls.forEach((path, key) => {
      const [from, to] = key.split('>');
      path.classList.toggle('is-lit', ids.has(from) && ids.has(to));
    });
  }

  function syncButtons() {
    nodeButtons.forEach((els, id) => els.forEach(el => {
      const on = id === selectedId;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    }));
  }

  function flash(id) {
    if (prefersReducedMotion()) return;
    (nodeButtons.get(id) || []).forEach(el => {
      el.classList.remove('just-selected');
      void el.offsetWidth; // restart the animation
      el.classList.add('just-selected');
    });
  }

  function choose(id, { viaKeyboard = false, trigger = null, silent = false } = {}) {
    const n = byId.get(id);
    if (!n || n.kind !== 'cert') return;
    const reopen = selectedId === id && panel.classList.contains('is-open');
    selectedId = id;
    lastTrigger = trigger || (nodeButtons.get(id) || []).find(el => el.offsetParent !== null) || null;

    renderDetail(n);
    panel.classList.add('is-open');
    root.classList.add('has-selection');
    if (compact.matches) document.body.classList.add('sheet-open');
    syncButtons();
    lightPath(id);
    moveCursor(id);
    flash(id);
    if (!silent) ctx.sound.select();
    liveRegion.textContent = `${n.title}. ${STATUS_LABEL[n.status]}. Details opened.`;
    ctx.setParam(id);

    // Keyboard and sheet users land inside the panel; pointer users keep their place.
    if (viaKeyboard || compact.matches) panel.focus({ preventScroll: true });
    if (!compact.matches && !reopen && !sideLayout()) {
      panel.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function close({ restoreFocus = false } = {}) {
    if (!selectedId) return false;
    selectedId = null;
    panel.classList.remove('is-open');
    root.classList.remove('has-selection');
    document.body.classList.remove('sheet-open');
    renderEmpty();
    syncButtons();
    lightPath(null);
    ctx.sound.back();
    ctx.setParam(null);
    if (restoreFocus && lastTrigger && document.contains(lastTrigger) && lastTrigger.offsetParent !== null) {
      lastTrigger.focus({ preventScroll: true });
    }
    return true;
  }

  const sideLayout = () => window.matchMedia('(min-width: 1400px)').matches;

  /* ── Assemble ────────────────────────────────────────────── */
  const statusCount = status => certs.filter(c => c.status === status).length;
  const chip = h('ul', { class: 'tree-chip', 'aria-label': 'Totals' },
    ...Object.keys(STATUS_LABEL).map(status => h('li', {},
      h('span', { class: `legend-swatch is-${status}`, 'aria-hidden': 'true' }),
      `${STATUS_LABEL[status]} `, h('b', {}, String(statusCount(status))))));
  const footer = h('div', { class: 'tree-footer' },
    chip,
    h('p', { class: 'legend-note' }, 'Lines group topics. They are not official prerequisites.'));

  const helpPanel = h('div', { class: 'tree-help', id: 'tree-help', role: 'region', 'aria-label': 'Skill tree controls', hidden: true },
    h('p', { class: 'tree-help-title' }, 'CONTROLS'),
    h('ul', {},
      h('li', {}, h('kbd', {}, 'ARROWS'), ' move between nodes'),
      h('li', {}, h('kbd', {}, 'Q'), h('kbd', {}, 'E'), ' swap branch'),
      h('li', {}, h('kbd', {}, 'ENTER'), ' open details'),
      h('li', {}, h('kbd', {}, 'ESC'), ' close, then go back'),
      h('li', {}, 'Mouse: hover lights the path, click opens.')));

  const helpBtn = h('button', {
    class: 'tbtn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'tree-help',
    onClick: () => toggleHelp(),
  }, h('kbd', {}, '?'), ' HELP');
  const swapBtn = h('button', { class: 'tbtn tbtn-swap', type: 'button', onClick: () => swapBranch(1) },
    h('kbd', {}, 'Q'), h('kbd', {}, 'E'), ' SWAP BRANCH');
  const bar = h('div', { class: 'tree-bar' },
    h('span', { class: 'tree-tab' }, 'CERTIFICATIONS'),
    h('div', { class: 'tree-bar-actions' }, swapBtn, helpBtn));

  function toggleHelp(force) {
    const open = typeof force === 'boolean' ? force : helpPanel.hidden;
    helpPanel.hidden = !open;
    helpBtn.setAttribute('aria-expanded', String(open));
    if (typeof force !== 'boolean') ctx.sound.select();
  }

  /** Focus a node (graph button when visible, otherwise its list row). */
  function focusNode(id) {
    const el = (nodeButtons.get(id) || []).find(e => e.offsetParent !== null);
    if (!el) return;
    el.focus({ preventScroll: false });
    moveCursor(id);
    ctx.sound.move();
  }

  /** Q / E: jump to the first certification of the next or previous branch. */
  function swapBranch(step) {
    const hereId = document.activeElement?.dataset?.id && byId.has(document.activeElement.dataset.id)
      ? document.activeElement.dataset.id
      : (selectedId || cursorId);
    let index = -1;
    if (hereId) {
      const path = pathToRoot(hereId);
      index = branches.findIndex(b => b.id === path[path.length - 2]);
    }
    for (let i = 1; i <= branches.length; i += 1) {
      const next = branches[(index + step * i + branches.length * 2) % branches.length];
      const first = byId.get(next.id)?.connections[0];
      if (first) { focusNode(first); return; }
    }
  }

  const heading = screenHeader('SKILL TREE', 'Certifications and learning branches');

  const root = h('div', { class: 'screen-inner skills-screen' },
    heading,
    h('div', { class: 'tree-layout' },
      h('div', { class: 'tree-stage win' }, bar, helpPanel, graph, list, footer),
      panel),
    backdrop,
    liveRegion,
    returnRow());

  renderEmpty();
  if (certs[0]) moveCursor(certs[0].id);

  /* Power-on intro: the tree lights up from the root outward, once per visit session. */
  let introTimer = null;
  if (!prefersReducedMotion() && !introSeen()) {
    root.classList.add('tree-intro');
    introTimer = setTimeout(() => root.classList.remove('tree-intro'), 2400);
  }

  if (ctx.param) {
    const n = byId.get(ctx.param);
    if (n && n.kind === 'cert') queueMicrotask(() => choose(n.id, { silent: true }));
  }

  /* Sheet mode: keep Tab inside the dialog while it is open. */
  panel.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !compact.matches || !selectedId) return;
    const focusables = [...panel.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusables.length) { event.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const onViewportChange = () => {
    document.body.classList.toggle('sheet-open', compact.matches && Boolean(selectedId));
    panel.toggleAttribute('data-sheet', compact.matches);
    if (compact.matches) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
  };
  compact.addEventListener('change', onViewportChange);
  onViewportChange();

  /** Move to the nearest cert node in an arrow direction. */
  function arrowFrom(currentId, key) {
    const here = byId.get(currentId);
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[key];
    let best = null;
    let bestScore = Infinity;
    for (const n of certs) {
      if (n.id === currentId) continue;
      const dx = n.x - here.x;
      const dy = n.y - here.y;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 0) continue;
      const across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
      const score = along + across * 2.5;
      if (score < bestScore) { bestScore = score; best = n; }
    }
    return best;
  }

  return {
    el: root,
    focus() { heading.querySelector('h1').focus({ preventScroll: true }); },
    unmount() {
      clearTimeout(introTimer);
      compact.removeEventListener('change', onViewportChange);
      document.body.classList.remove('sheet-open');
    },
    onParam(param) {
      const n = param ? byId.get(param) : null;
      if (n && n.kind === 'cert') choose(n.id, { silent: true });
      else if (selectedId) {
        selectedId = null;
        panel.classList.remove('is-open');
        root.classList.remove('has-selection');
        document.body.classList.remove('sheet-open');
        renderEmpty(); syncButtons(); lightPath(null);
      }
    },
    onKey(event) {
      if (event.key === 'Escape' && !helpPanel.hidden) {
        toggleHelp(false);
        helpBtn.focus({ preventScroll: true });
        return true;
      }
      if (event.key === 'Escape' && selectedId) {
        close({ restoreFocus: true });
        return true;
      }
      if (event.key === '?') { toggleHelp(); return true; }
      if (!compact.matches && /^[qe]$/i.test(event.key)) {
        swapBranch(event.key.toLowerCase() === 'e' ? 1 : -1);
        return true;
      }
      const target = event.target;
      if (target instanceof Element && target.matches('.tnode-cert') && event.key.startsWith('Arrow')) {
        const next = arrowFrom(target.dataset.id, event.key);
        if (next) {
          nodeButtons.get(next.id)?.find(el => el.classList.contains('tnode'))?.focus();
          ctx.sound.move();
        }
        return true;
      }
      return false;
    },
  };
}
