/**
 * achievements.js — ACHIEVEMENTS: a wall of pixel badges on shelves.
 *
 * Manual entries come from js/data/achievements.js. Certification and
 * completed-project badges are generated from their own data files, so each fact
 * lives in exactly one place and links back to its full details. Quests that are
 * still in progress appear as locked badges (real status, no invented goals).
 *
 * Click, tap, or press Enter on a badge to open its details (a side window on
 * wide screens, a bottom sheet on small ones). Arrow keys move across the wall.
 */

import { h, prefersReducedMotion } from '../core/dom.js';
import { GROUPS, manual } from '../data/achievements.js';
import { nodes } from '../data/certifications.js';
import { projects } from '../data/projects.js';
import { badgeSvg } from '../ui/badge.js';
import { screenHeader, button, statusBadge, returnRow } from '../ui/components.js';

export const label = 'ACHIEVEMENTS';

const compactQuery = '(max-width: 959px)';
const CERT_ICON = { web: 'globe', data: 'chip', support: 'gear', digital: 'chart' };

function collect() {
  const items = manual.map(a => ({ ...a, locked: false }));

  nodes.filter(n => n.kind === 'cert' && n.status === 'earned').forEach(n => items.push({
    id: `cert-${n.id}`,
    group: 'certification',
    icon: CERT_ICON[n.category] || 'medal',
    name: n.title,
    short: n.short,
    description: `${n.issuer}${n.date ? `, ${n.date}` : ''}.`,
    date: n.date,
    locked: false,
    link: { href: `#/skills/${n.id}`, label: 'View in skill tree' },
  }));

  projects.filter(p => p.category === 'completed').forEach(p => items.push({
    id: `quest-${p.id}`,
    group: 'project',
    icon: p.icon || 'star',
    name: p.name,
    description: p.subtitle,
    date: null,
    locked: false,
    link: { href: `#/quests/${p.id}`, label: 'Open quest' },
  }));

  // Still in progress: shown locked, so the wall tells the truth about what is unfinished.
  projects.filter(p => p.category === 'in-progress').forEach(p => items.push({
    id: `quest-${p.id}`,
    group: 'project',
    icon: 'hourglass',
    name: p.name,
    description: p.subtitle,
    date: null,
    locked: true,
    note: 'Quest in progress. This badge unlocks when the project is completed.',
    link: { href: `#/quests/${p.id}`, label: 'Open quest' },
  }));

  return items;
}

/** How many badges are unlocked out of the whole wall (used by the profile screen). */
export function achievementCounts() {
  const items = collect();
  return { unlocked: items.filter(i => !i.locked).length, total: items.length };
}

export function mount(ctx) {
  const items = collect();
  const byId = new Map(items.map(i => [i.id, i]));
  const groupLabel = Object.fromEntries(GROUPS.map(g => [g.id, g.label]));
  const unlocked = items.filter(i => !i.locked).length;
  const compact = window.matchMedia(compactQuery);
  let selectedId = null;
  let lastTrigger = null;

  const heading = screenHeader('ACHIEVEMENTS', 'Milestones collected so far');

  /* ── Summary bar ─────────────────────────────────────────── */
  const summary = h('div', { class: 'ach-summary win' },
    h('p', { class: 'ach-count' }, 'UNLOCKED ', h('b', {}, `${unlocked} / ${items.length}`)),
    h('div', {
      class: 'ach-bar', role: 'progressbar', 'aria-label': 'Badges unlocked',
      'aria-valuemin': '0', 'aria-valuemax': String(items.length), 'aria-valuenow': String(unlocked),
    }, h('i', { style: `width:${Math.round((unlocked / items.length) * 100)}%` })),
    h('p', { class: 'muted ach-note' }, 'Locked badges are projects that are still in progress.'));

  /* ── The wall ────────────────────────────────────────────── */
  let order = 0;
  const shelves = GROUPS
    .map(group => ({ group, list: items.filter(i => i.group === group.id).sort((a, b) => Number(a.locked) - Number(b.locked)) }))
    .filter(entry => entry.list.length)
    .map(({ group, list }) => {
      const open = list.filter(i => !i.locked).length;
      return h('section', { class: 'shelf', 'aria-labelledby': `shelf-${group.id}` },
        h('h2', { class: 'shelf-title', id: `shelf-${group.id}` },
          h('span', { class: 'shelf-icon', 'aria-hidden': 'true' }, badgeSvg({ group: group.id, icon: GROUP_ICON[group.id] })),
          `${group.label} `, h('span', { class: 'shelf-count' }, `${open}${open !== list.length ? ` / ${list.length}` : ''}`)),
        h('ul', { class: 'badge-wall' }, list.map(item => {
          const btn = h('button', {
            class: `badge-btn${item.locked ? ' is-locked' : ''}`,
            type: 'button',
            dataset: { id: item.id },
            style: `--i:${order += 1}`,
            'aria-pressed': 'false',
            onClick: event => choose(item.id, { viaKeyboard: event.detail === 0, trigger: event.currentTarget }),
          },
          h('span', { class: 'badge-art', 'aria-hidden': 'true' },
            badgeSvg({ group: item.group, icon: item.icon, locked: item.locked }),
            item.count > 1 ? h('span', { class: 'badge-count' }, `×${item.count}`) : null),
          h('span', { class: 'badge-caption' }, item.short || item.name),
          // The visible caption is the start of the accessible name; this adds the rest.
          h('span', { class: 'sr-only' }, [
            item.short ? `. ${item.name}` : '',
            `. ${groupLabel[item.group]}`,
            item.locked ? '. Locked, in progress' : '. Unlocked',
            item.count > 1 ? `. Earned ${item.count} times` : '',
          ].join('')));
          return h('li', {}, btn);
        })));
    });

  /* ── Detail window ───────────────────────────────────────── */
  const panelBody = h('div', { class: 'item-body' });
  const panel = h('div', { class: 'win item-window ach-detail', id: 'ach-detail', tabindex: '-1', 'aria-labelledby': 'ach-detail-heading' },
    h('h2', { class: 'win-title', id: 'ach-detail-heading' }, 'BADGE'),
    h('div', { class: 'win-body' }, panelBody));
  const backdrop = h('div', { class: 'sheet-backdrop', onClick: () => close({ restoreFocus: true }) });
  const liveRegion = h('p', { class: 'sr-only', 'aria-live': 'polite' });

  function renderEmpty() {
    panelBody.replaceChildren(
      h('p', { class: 'item-empty-title' }, 'SELECT A BADGE'),
      h('p', { class: 'muted' }, 'Pick any badge to read what it is for, when it happened, and where to see more.'),
      h('p', { class: 'muted' }, 'Keyboard: arrow keys move across the wall, Enter opens, Esc closes.'));
  }

  function renderDetail(item) {
    panelBody.replaceChildren(...[
      h('div', { class: 'ach-hero', 'aria-hidden': 'true' }, badgeSvg({ group: item.group, icon: item.icon, locked: item.locked }),
        item.count > 1 ? h('span', { class: 'badge-count badge-count-lg' }, `×${item.count}`) : null),
      h('h3', { class: 'item-name' }, item.name),
      h('p', { class: 'ach-tags' },
        statusBadge(item.locked ? 'in-progress' : 'earned', item.locked ? 'LOCKED' : 'UNLOCKED'),
        h('span', { class: 'ach-group' }, groupLabel[item.group])),
      item.date ? h('p', { class: 'badge-date' }, item.date) : null,
      h('p', { class: 'item-desc' }, item.description),
      item.locked ? h('p', { class: 'item-warn' }, item.note) : null,
      item.link ? button({ label: item.link.label.toUpperCase(), href: item.link.href, variant: item.locked ? 'ghost' : 'primary', icon: item.group === 'certification' ? 'tree' : 'scroll' }) : null,
      h('div', { class: 'item-actions' },
        button({ label: 'CLOSE', variant: 'ghost', onClick: () => close({ restoreFocus: true }), className: 'item-close' }))].filter(Boolean));
  }

  /* ── Selection ───────────────────────────────────────────── */
  const sideLayout = () => window.matchMedia('(min-width: 1100px)').matches;
  const allButtons = () => [...root.querySelectorAll('.badge-btn')];

  function syncButtons() {
    allButtons().forEach(el => {
      const on = el.dataset.id === selectedId;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-pressed', String(on));
    });
  }

  function choose(id, { viaKeyboard = false, trigger = null, silent = false } = {}) {
    const item = byId.get(id);
    if (!item) return;
    const reopen = selectedId === id && panel.classList.contains('is-open');
    selectedId = id;
    lastTrigger = trigger || root.querySelector(`.badge-btn[data-id="${id}"]`);
    renderDetail(item);
    panel.classList.add('is-open');
    root.classList.add('has-selection');
    if (compact.matches) document.body.classList.add('sheet-open');
    syncButtons();
    if (!silent) ctx.sound.select();
    liveRegion.textContent = `${item.name}. ${item.locked ? 'Locked' : 'Unlocked'}. Details opened.`;
    ctx.setParam(id);
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
    ctx.sound.back();
    ctx.setParam(null);
    if (restoreFocus && lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    return true;
  }

  /* ── Assemble ────────────────────────────────────────────── */
  const root = h('div', { class: 'screen-inner achievements-screen' },
    heading,
    summary,
    h('div', { class: 'ach-layout' },
      h('div', { class: 'ach-wall' }, ...shelves),
      panel),
    backdrop,
    liveRegion,
    returnRow());

  renderEmpty();
  if (ctx.param && byId.has(ctx.param)) queueMicrotask(() => choose(ctx.param, { silent: true }));

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
    if (compact.matches) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); }
    else { panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); }
  };
  compact.addEventListener('change', onViewportChange);
  onViewportChange();

  /** Nearest badge in an arrow direction, by on-screen position. */
  function neighbour(current, key) {
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[key];
    const c = current.getBoundingClientRect();
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    let best = null;
    let bestScore = Infinity;
    for (const el of allButtons()) {
      if (el === current) continue;
      const r = el.getBoundingClientRect();
      const dx = r.x + r.width / 2 - cx;
      const dy = r.y + r.height / 2 - cy;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 4) continue;
      const across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
      const score = along + across * 3;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    return best;
  }

  return {
    el: root,
    focus() { heading.querySelector('h1').focus({ preventScroll: true }); },
    unmount() {
      compact.removeEventListener('change', onViewportChange);
      document.body.classList.remove('sheet-open');
    },
    onParam(param) {
      if (param && byId.has(param)) choose(param, { silent: true });
      else if (selectedId) {
        selectedId = null;
        panel.classList.remove('is-open');
        root.classList.remove('has-selection');
        document.body.classList.remove('sheet-open');
        renderEmpty(); syncButtons();
      }
    },
    onKey(event) {
      if (event.key === 'Escape' && selectedId) { close({ restoreFocus: true }); return true; }
      const target = event.target;
      if (!(target instanceof Element) || !target.matches('.badge-btn')) return false;
      if (event.key.startsWith('Arrow')) {
        const next = neighbour(target, event.key);
        if (next) { next.focus(); ctx.sound.move(); }
        return true;
      }
      if (event.key === 'Home' || event.key === 'End') {
        const list = allButtons();
        (event.key === 'Home' ? list[0] : list[list.length - 1])?.focus();
        return true;
      }
      return false;
    },
  };
}

/** Icon shown beside each shelf title (the same one every badge on that shelf shares in spirit). */
const GROUP_ICON = { academic: 'book', leadership: 'crown', competition: 'trophy', certification: 'medal', project: 'scroll' };
