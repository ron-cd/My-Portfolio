/**
 * quests.js — QUEST LOG: projects presented as quests, laid out as an open book.
 * All content comes from js/data/projects.js.
 *
 * Desktop: quest list on the left page, the selected quest on the right page,
 *          status filters as coloured bookmark tabs on the right edge.
 * Mobile:  one page at a time (list, then detail with a back button).
 */

import { h, prefersReducedMotion } from '../core/dom.js';
import { sprite } from '../core/sprites.js';
import { projects, CATEGORY_LABEL } from '../data/projects.js';
import { screenHeader, tagList, button, statusBadge, returnRow } from '../ui/components.js';
import { questArt } from '../ui/bookart.js';

export const label = 'QUEST LOG';

const compactQuery = '(max-width: 859px)';
const FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'completed', label: CATEGORY_LABEL.completed },
  { id: 'in-progress', label: CATEGORY_LABEL['in-progress'] },
  { id: 'experimental', label: CATEGORY_LABEL.experimental },
];

/** Row status marker. The label is always available as text too. */
const STATE_SPRITE = { completed: 'check', 'in-progress': 'hourglass', experimental: 'flask' };

const isExternal = href => /^https?:\/\//i.test(href);

export function mount(ctx) {
  const byId = new Map(projects.map(p => [p.id, p]));
  const compact = window.matchMedia(compactQuery);
  let filter = 'all';
  let selectedId = ctx.param && byId.has(ctx.param) ? ctx.param : null;
  if (!selectedId && !compact.matches) selectedId = projects.find(p => p.featured)?.id || projects[0].id;

  /* ── Bookmark tabs (status filters) ──────────────────────── */
  const countFor = id => (id === 'all' ? projects.length : projects.filter(p => p.category === id).length);
  const filterButtons = FILTERS
    .filter(f => f.id === 'all' || countFor(f.id) > 0)
    .map(f => h('button', {
      class: 'book-tab',
      type: 'button',
      dataset: { filter: f.id },
      'aria-pressed': String(f.id === filter),
      onClick: () => { filter = f.id; ctx.sound.move(); renderList(); syncFilters(); },
    }, h('span', { class: 'book-tab-label' }, f.label), h('span', { class: 'book-tab-count' }, String(countFor(f.id)))));

  const syncFilters = () => filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  const filterBar = h('div', { class: 'book-tabs', role: 'group', 'aria-label': 'Filter quests by status' }, ...filterButtons);

  /* ── List ────────────────────────────────────────────────── */
  const listEl = h('ul', { class: 'quest-list' });

  function renderList() {
    const visible = projects.filter(p => filter === 'all' || p.category === filter);
    listEl.replaceChildren(...visible.map(p => h('li', {},
      h('button', {
        class: `quest-item${p.id === selectedId ? ' is-selected' : ''}`,
        type: 'button',
        dataset: { id: p.id },
        'aria-current': p.id === selectedId ? 'true' : undefined,
        onClick: event => choose(p.id, { viaKeyboard: event.detail === 0 }),
      },
      h('span', { class: 'quest-icon', 'aria-hidden': 'true' }, sprite(p.icon)),
      h('span', { class: 'quest-text' },
        h('strong', {}, p.name),
        h('small', {}, p.subtitle)),
      h('span', { class: `quest-state quest-state-${p.category}`, title: CATEGORY_LABEL[p.category] },
        sprite(STATE_SPRITE[p.category] || 'scroll'),
        h('span', { class: 'sr-only' }, CATEGORY_LABEL[p.category]))))));
    if (!visible.length) listEl.replaceChildren(h('li', { class: 'quest-empty' }, 'No quests here yet.'));
  }

  /* ── Detail ──────────────────────────────────────────────── */
  const detailBody = h('div', { class: 'quest-body' });
  const detail = h('article', { class: 'page page-right quest-detail', id: 'quest-detail', tabindex: '-1', 'aria-labelledby': 'quest-detail-heading' },
    h('h2', { class: 'sr-only', id: 'quest-detail-heading' }, 'QUEST DETAILS'),
    detailBody);

  function previewFor(p) {
    const art = () => h('div', { class: 'book-art' }, questArt(p));
    if (!p.screenshots?.length) return art();
    return h('div', { class: 'book-art book-shots' }, ...p.screenshots.map(shot => {
      const img = h('img', { src: shot.src, alt: shot.alt || `${p.name} screenshot`, loading: 'lazy', decoding: 'async', class: 'shot' });
      // A missing image falls back to the generated illustration.
      img.addEventListener('error', () => img.closest('.book-art')?.replaceWith(art()), { once: true });
      return img;
    }));
  }

  function linksFor(p) {
    const out = [];
    if (p.links?.repo) out.push(button({ label: 'GITHUB', href: p.links.repo, external: true, icon: 'chip', ariaLabel: `${p.name} on GitHub (opens in a new tab)` }));
    if (p.links?.demo) out.push(button({ label: 'LIVE DEMO', href: p.links.demo, external: true, icon: 'globe', ariaLabel: `${p.name} live demo (opens in a new tab)` }));
    if (p.links?.internal === 'contact' && !p.links?.demo) out.push(button({ label: 'REQUEST A DEMO', href: '#/contact', variant: 'ghost', icon: 'envelope' }));
    if (!out.length) return h('p', { class: 'muted' }, 'No public repository or live demo yet.');
    return h('div', { class: 'quest-links' }, ...out);
  }

  const section = (title, ...content) => h('section', { class: 'quest-section' }, h('h3', { class: 'sub-label' }, title), ...content);

  function renderDetail() {
    const p = selectedId ? byId.get(selectedId) : null;
    if (!p) {
      detailBody.replaceChildren(
        h('p', { class: 'item-empty-title' }, 'SELECT A QUEST'),
        h('p', { class: 'muted' }, 'Pick a quest from the log to read its overview, my role, tech, and links.'));
      detail.scrollTop = 0;
      return;
    }
    detailBody.replaceChildren(...[
      h('button', { class: 'btn btn-ghost quest-back', type: 'button', onClick: () => backToList({ restoreFocus: true }) }, sprite('cursor', { className: 'flip' }), h('span', {}, 'BACK TO LOG')),
      previewFor(p),
      h('div', { class: 'quest-head' },
        h('span', { class: 'quest-icon quest-icon-lg', 'aria-hidden': 'true' }, sprite(p.icon)),
        h('div', {},
          h('h3', { class: 'quest-name' }, p.name),
          h('p', { class: 'muted' }, p.subtitle),
          statusBadge(p.category, CATEGORY_LABEL[p.category]))),
      p.statusNote ? h('p', { class: 'quest-note' }, p.statusNote) : null,
      section('OVERVIEW', h('p', {}, p.summary)),
      p.problem ? section('PROBLEM ADDRESSED', h('p', {}, p.problem)) : null,
      p.role ? section('MY ROLE', h('p', {}, p.role)) : null,
      p.implementation ? section('TECHNICAL IMPLEMENTATION', h('p', {}, p.implementation)) : null,
      p.features?.length ? section('KEY FEATURES', h('ul', { class: 'bullet-list' }, p.features.map(f => h('li', {}, f)))) : null,
      p.tech?.length ? section('TECHNOLOGIES', tagList(p.tech, 'Technologies')) : null,
      p.items?.length ? section('INCLUDED ACTIVITIES', h('ul', { class: 'link-list' }, p.items.map(item => h('li', {},
        h('a', { href: item.href, ...(isExternal(item.href) || item.href.endsWith('.html') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, item.label))))) : null,
      section('LINKS', linksFor(p))].filter(Boolean));
  }

  /* ── Selection ───────────────────────────────────────────── */
  function choose(id, { viaKeyboard = false, silent = false } = {}) {
    if (!byId.has(id)) return;
    selectedId = id;
    layout.dataset.view = 'detail';
    renderList();
    renderDetail();
    detail.scrollTop = 0;
    if (!silent) ctx.sound.select();
    ctx.setParam(id);
    detail.classList.remove('just-opened');
    if (!prefersReducedMotion()) { void detail.offsetWidth; detail.classList.add('just-opened'); }
    if (compact.matches) {
      window.scrollTo(0, 0);
      detail.focus({ preventScroll: true });
    } else if (viaKeyboard) {
      detail.focus({ preventScroll: true });
    }
  }

  function backToList({ restoreFocus = false } = {}) {
    const previous = selectedId;
    if (compact.matches) selectedId = null;
    layout.dataset.view = 'list';
    renderList();
    renderDetail();
    ctx.sound.back();
    ctx.setParam(null);
    if (restoreFocus) {
      const target = listEl.querySelector(`[data-id="${previous}"]`) || listEl.querySelector('button');
      target?.focus({ preventScroll: true });
    }
  }

  const heading = screenHeader('QUEST LOG', 'Projects, missions, and experiments');
  const listPage = h('section', { class: 'page page-left quest-list-window', 'aria-labelledby': 'quest-list-heading' },
    h('h2', { class: 'book-ribbon', id: 'quest-list-heading' }, h('span', {}, 'QUESTS')),
    listEl);
  const layout = h('div', { class: 'quest-layout book-spread', dataset: { view: selectedId && compact.matches ? 'detail' : 'list' } },
    listPage,
    detail);

  const book = h('div', { class: 'book' },
    ...['tl', 'tr', 'bl', 'br'].map(pos => h('span', { class: `book-corner book-corner-${pos}`, 'aria-hidden': 'true' })),
    filterBar,
    layout);

  const root = h('div', { class: 'screen-inner quests-screen' }, heading, book, returnRow());
  renderList();
  renderDetail();

  return {
    el: root,
    focus() { heading.querySelector('h1').focus({ preventScroll: true }); },
    unmount() {},
    onParam(param) {
      if (param && byId.has(param)) choose(param, { silent: true });
      else if (compact.matches && layout.dataset.view === 'detail') {
        selectedId = null; layout.dataset.view = 'list'; renderList(); renderDetail();
      }
    },
    onKey(event) {
      if (event.key === 'Escape' && compact.matches && layout.dataset.view === 'detail') {
        backToList({ restoreFocus: true });
        return true;
      }
      const target = event.target;
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && target instanceof Element && target.matches('.quest-item')) {
        const items = [...listEl.querySelectorAll('.quest-item')];
        const index = items.indexOf(target);
        const next = items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
        next?.focus();
        ctx.sound.move();
        return true;
      }
      return false;
    },
  };
}
