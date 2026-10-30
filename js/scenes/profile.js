/**
 * profile.js — CHARACTER screen: an equipment screen.
 *
 * Your hero stands in the middle with the real stack "equipped" on both sides
 * (js/data/profile.js → gear). Inspect a slot (hover, focus, click or tap) to see
 * which projects use each item; those lines are worked out from
 * js/data/projects.js. The PLAYER STATS button switches to the full written
 * profile: background, education, abilities, interests, strengths and goals.
 */

import { h } from '../core/dom.js';
import { sprite } from '../core/sprites.js';
import { profile } from '../data/profile.js';
import { projects } from '../data/projects.js';
import { nodes } from '../data/certifications.js';
import { achievementCounts } from './achievements.js';
import { win, screenHeader, tagList, returnRow, animatedPortrait } from '../ui/components.js';

export const label = 'PROFILE';

const DEFAULT_INSPECT = 'Select a slot to see what I carry and where I have used it.';

/** "AARON "RON" DELA CRUZ" from the names in profile.js. */
function ribbonName() {
  const first = profile.fullName.split(' ')[0];
  const last = profile.shortName.split(' ').slice(1).join(' ');
  return `${first} "${profile.nickname}" ${last}`.toUpperCase();
}

const usedIn = item => {
  const names = item.match || [item.name];
  return projects.filter(p => p.tech.some(t => names.includes(t)));
};

function inspectBody(slot) {
  return [
    h('p', { class: 'inspect-slot' }, slot.slot),
    ...slot.items.map(item => {
      const used = usedIn(item);
      const links = used.flatMap((p, i) => [i ? ', ' : '', h('a', { href: `#/quests/${p.id}` }, p.name)]);
      return h('p', { class: 'inspect-item' },
        h('strong', {}, item.name),
        used.length
          ? [` is used in ${used.length === 1 ? '1 project' : `${used.length} projects`}: `, ...links, '.']
          : ' is part of my skill set. It is not in a listed project yet.',
        item.note ? ` ${item.note}` : '');
    }),
  ];
}

export function mount(ctx) {
  const heading = screenHeader('CHARACTER', 'Equipment screen');
  const subtitle = heading.querySelector('.screen-subtitle');

  /* ── Equipment view ───────────────────────────────────────── */
  const inspect = h('div', { class: 'inspect-body', 'aria-live': 'polite' }, h('p', { class: 'muted' }, DEFAULT_INSPECT));
  let selected = null;

  /** Wide screens fill the INSPECT window; narrow ones open the detail right under the slot. */
  function inspectSlot(slot, button, item) {
    if (selected) { selected.button.classList.remove('is-selected'); selected.item.classList.remove('is-open'); }
    selected = { button, item };
    button.classList.add('is-selected');
    item.classList.add('is-open');
    inspect.replaceChildren(...inspectBody(slot));
  }

  const slotButton = slot => {
    const button = h('button', { class: 'gear-slot', type: 'button' },
      h('span', { class: 'gear-box', 'aria-hidden': 'true' }, sprite(slot.icon)),
      h('span', { class: 'gear-text' },
        h('small', {}, slot.slot),
        h('b', {}, slot.items.map(i => i.name).join(' · '))));
    const inline = h('div', { class: 'gear-inline' }, ...inspectBody(slot));
    const item = h('li', {}, button, inline);
    const pick = () => inspectSlot(slot, button, item);
    button.addEventListener('click', () => { ctx.sound.select(); pick(); });
    button.addEventListener('focus', pick);
    button.addEventListener('mouseenter', pick);
    return item;
  };

  const column = group => win(group.title, h('ul', { class: 'gear-list' }, group.slots.map(slotButton)), { className: 'gear-column' });

  const hero = h('section', { class: 'hero-card', 'aria-label': 'Character' },
    h('div', { class: 'hero-stage' }, animatedPortrait({ large: true })),
    h('p', { class: 'hero-name' }, `${profile.nickname.toUpperCase()} · ${profile.characterClass.toUpperCase()}`),
    h('p', { class: 'hero-line' }, profile.title),
    h('p', { class: 'hero-line muted' }, profile.status),
    h('p', { class: 'hero-line muted' }, profile.location));

  const { unlocked, total } = achievementCounts();
  const earnedCerts = nodes.filter(n => n.kind === 'cert' && n.status === 'earned').length;
  const started = profile.education[0].years.split(' ')[0];
  const stats = [
    [String(projects.length), 'PROJECTS'],
    [String(earnedCerts), 'CERTIFICATIONS'],
    [`${unlocked}/${total}`, 'ACHIEVEMENTS'],
    [started, 'STARTED BSIT'],
  ];
  const strip = win(null, h('dl', { class: 'stat-strip' }, stats.map(([value, name]) =>
    h('div', {}, h('dd', {}, value), h('dt', {}, name)))), { className: 'stat-strip-window', tag: 'section' });

  const equipment = h('div', { class: 'equip-view', id: 'view-equipment' },
    h('p', { class: 'ribbon' }, ribbonName()),
    h('div', { class: 'equip' },
      column(profile.gear.left),
      h('div', { class: 'equip-middle' }, hero, win('INSPECT', inspect, { className: 'inspect-window' })),
      column(profile.gear.right)),
    strip);

  /* ── Player stats view (the written profile) ──────────────── */
  const identity = win('CHARACTER', [
    h('div', { class: 'profile-id' },
      h('div', { class: 'profile-id-text' },
        h('p', { class: 'profile-name' }, profile.fullName),
        h('p', { class: 'profile-alias' }, `Goes by ${profile.nickname}`),
        h('p', { class: 'profile-title' }, profile.title))),
    h('dl', { class: 'stat-list stat-list-wide' },
      h('div', {}, h('dt', {}, 'CLASS'), h('dd', {}, profile.characterClass.toUpperCase())),
      h('div', {}, h('dt', {}, 'SPECIALIZATION'), h('dd', {}, profile.specialization)),
      h('div', {}, h('dt', {}, 'STATUS'), h('dd', {}, profile.status)),
      h('div', {}, h('dt', {}, 'LOCATION'), h('dd', {}, profile.location))),
  ], { className: 'profile-identity' });

  const background = win('BACKGROUND', [
    ...profile.intro.map(text => h('p', {}, text)),
    h('h3', { class: 'sub-label' }, 'EDUCATION'),
    h('ul', { class: 'edu-list' }, profile.education.map(item => h('li', {},
      h('p', { class: 'edu-school' }, item.school),
      h('p', {}, item.program),
      h('p', { class: 'muted' }, `${item.detail} · ${item.years}`)))),
  ], { className: 'profile-background' });

  const abilities = win('ABILITIES', profile.abilities.map(group => h('div', { class: 'ability-group' },
    h('h3', { class: 'sub-label' }, group.group.toUpperCase()),
    tagList(group.tags, group.group))), { className: 'profile-abilities' });

  const interests = win('MAIN INTERESTS', h('ul', { class: 'bullet-list' }, profile.interests.map(i => h('li', {}, i))), { className: 'profile-interests' });

  const strengths = win('STRENGTHS', h('ul', { class: 'strength-list' }, profile.strengths.map(s => h('li', {},
    h('p', { class: 'strength-name' }, s.name),
    h('p', { class: 'muted' }, s.text)))), { className: 'profile-strengths' });

  const goals = win('CAREER GOALS', h('ul', { class: 'bullet-list' }, profile.goals.map(g => h('li', {}, g))), { className: 'profile-goals' });

  const statsView = h('div', { class: 'profile-grid', id: 'view-stats', hidden: true }, identity, background, abilities, interests, strengths, goals);

  /* ── View switch (the PLAYER STATS button) ────────────────── */
  const tab = (text, id) => h('button', { class: 'view-tab', type: 'button', 'aria-pressed': 'false', 'aria-controls': id }, text);
  const tabEquip = tab('EQUIPMENT', 'view-equipment');
  const tabStats = tab('PLAYER STATS', 'view-stats');

  function show(view, { announceIt = true } = {}) {
    const stats = view === 'stats';
    equipment.hidden = stats;
    statsView.hidden = !stats;
    tabEquip.setAttribute('aria-pressed', String(!stats));
    tabStats.setAttribute('aria-pressed', String(stats));
    subtitle.textContent = stats ? 'Player stats' : 'Equipment screen';
    if (announceIt) ctx.announce(stats ? 'Player stats' : 'Equipment');
  }
  tabEquip.addEventListener('click', () => { ctx.sound.select(); show('equipment'); });
  tabStats.addEventListener('click', () => { ctx.sound.select(); show('stats'); });
  show('equipment', { announceIt: false });

  const tabs = h('div', { class: 'view-tabs', role: 'group', 'aria-label': 'Profile view' }, tabEquip, tabStats);

  const el = h('div', { class: 'screen-inner profile-screen' },
    heading,
    tabs,
    equipment,
    statsView,
    returnRow());

  return {
    el,
    focus() { heading.querySelector('h1').focus({ preventScroll: true }); },
    unmount() {},
    onKey() { return false; },
  };
}
