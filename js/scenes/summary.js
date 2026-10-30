/**
 * summary.js — "Skip the game": a plain, one-page summary for recruiters.
 *
 * No animation, no game chrome, nothing to learn. Everything is generated from
 * the same data files as the game, so the two can never disagree. Printing the
 * page (or "Save as PDF") produces a clean black-on-white résumé-style sheet;
 * the print rules live at the bottom of css/summary.css.
 */

import { h } from '../core/dom.js';
import { profile } from '../data/profile.js';
import { contact } from '../data/site.js';
import { nodes, STATUS_LABEL } from '../data/certifications.js';
import { projects, CATEGORY_LABEL } from '../data/projects.js';
import { manual } from '../data/achievements.js';
import { button } from '../ui/components.js';

export const label = 'SUMMARY';

const external = { target: '_blank', rel: 'noopener noreferrer' };

function section(id, title, ...children) {
  return h('section', { class: 'sum-section', 'aria-labelledby': `sum-${id}` },
    h('h2', { class: 'sum-h2', id: `sum-${id}` }, title),
    ...children);
}

export function mount(ctx) {
  const certs = nodes.filter(n => n.kind === 'cert');
  const earned = certs.filter(c => c.status === 'earned');
  const others = certs.filter(c => c.status !== 'earned');

  const heading = h('h1', { class: 'sum-name', tabindex: '-1' }, profile.fullName);

  const header = h('header', { class: 'sum-header' },
    heading,
    h('p', { class: 'sum-role' }, profile.title),
    h('p', { class: 'sum-meta' }, `${profile.location} · ${profile.status}`),
    h('ul', { class: 'sum-contact', 'aria-label': 'Contact' },
      h('li', {}, h('a', { href: `mailto:${contact.email}` }, contact.email)),
      ...contact.links.map(l => h('li', {}, h('a', { href: l.href, ...external }, l.value))),
      h('li', {}, h('a', { href: contact.resume.href, download: '' }, 'CV (PDF)'))));

  const actions = h('div', { class: 'sum-actions' },
    button({ label: 'DOWNLOAD CV', href: contact.resume.href, download: true, icon: 'scroll' }),
    button({ label: 'EMAIL ME', href: `mailto:${contact.email}`, variant: 'ghost', icon: 'envelope' }),
    button({ label: 'PRINT / SAVE PDF', variant: 'ghost', onClick: () => window.print() }),
    button({ label: 'PLAY THE GAME', href: '#/world', variant: 'ghost', icon: 'cursor' }));

  const about = section('about', 'About', ...profile.intro.map(t => h('p', {}, t)));

  const education = section('education', 'Education',
    h('ul', { class: 'sum-list' }, profile.education.map(e => h('li', {},
      h('p', { class: 'sum-line' }, h('strong', {}, e.program), h('span', { class: 'sum-date' }, e.years)),
      h('p', {}, `${e.school} · ${e.detail}`)))));

  const skills = section('skills', 'Skills',
    h('dl', { class: 'sum-skills' }, profile.abilities.map(g => h('div', {},
      h('dt', {}, g.group),
      h('dd', {}, g.tags.join(' · '))))));

  const projectItems = projects.map(p => {
    const links = [];
    if (p.links?.repo) links.push(h('a', { href: p.links.repo, ...external }, 'Source'));
    if (p.links?.demo) links.push(h('a', { href: p.links.demo, ...external }, 'Live demo'));
    return h('li', {},
      h('p', { class: 'sum-line' },
        h('strong', {}, `${p.name} — ${p.subtitle}`),
        h('span', { class: 'sum-date' }, CATEGORY_LABEL[p.category])),
      h('p', {}, p.summary),
      h('p', { class: 'sum-tech' }, p.tech.join(' · ')),
      links.length ? h('p', { class: 'sum-links' }, ...links.flatMap((l, i) => (i ? [' · ', l] : [l]))) : null);
  });
  const projectSection = section('projects', 'Projects', h('ul', { class: 'sum-list' }, projectItems));

  const certItem = c => h('li', {},
    h('p', { class: 'sum-line' },
      c.url ? h('a', { href: c.url, ...external }, h('strong', {}, c.title)) : h('strong', {}, c.title),
      h('span', { class: 'sum-date' }, c.status === 'earned' ? (c.date || '') : STATUS_LABEL[c.status])),
    h('p', {}, c.issuer));
  const certSection = section('certs', 'Certifications',
    h('ul', { class: 'sum-list sum-list-tight' }, [...earned, ...others].map(certItem)));

  const achievementSection = section('achievements', 'Leadership & recognition',
    h('ul', { class: 'sum-list sum-list-tight' }, manual.map(a => h('li', {},
      h('p', { class: 'sum-line' }, h('strong', {}, a.name), a.date ? h('span', { class: 'sum-date' }, a.date) : null),
      h('p', {}, a.description)))));

  const goals = section('goals', 'Looking for',
    h('ul', { class: 'sum-bullets' }, profile.goals.map(g => h('li', {}, g))));

  const el = h('article', { class: 'screen-inner summary-screen', 'aria-label': `Summary of ${profile.fullName}` },
    h('div', { class: 'sum-sheet' },
      header, actions,
      h('div', { class: 'sum-body' }, about, goals, education, skills, projectSection, certSection, achievementSection),
      h('p', { class: 'sum-foot' }, 'Built from the same data as the game version of this site.')));

  return {
    el,
    focus() { heading.focus({ preventScroll: true }); },
    unmount() {},
    onKey() { return false; },
  };
}
