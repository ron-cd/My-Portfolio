/**
 * contact.js — CONTACT: the post office.
 *
 * Write a letter (pick the kind of quest, then fill in name, email and message),
 * collect stamps (email, GitHub, LinkedIn) and pick up a package (the CV).
 *
 * There is no backend, so the letter never pretends to send anything. It
 * validates the fields, then opens the visitor's own email app with a
 * pre-filled draft (mailto:). The status text says exactly that. Because many
 * computers have no email app set up, there is also a COPY EMAIL button.
 */

import { h } from '../core/dom.js';
import { sprite } from '../core/sprites.js';
import { contact } from '../data/site.js';
import { profile } from '../data/profile.js';
import { win, screenHeader, button, typewriter, returnRow } from '../ui/components.js';

export const label = 'CONTACT';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mount(ctx) {
  const heading = screenHeader('CONTACT', 'Post office');
  let typing = null;

  const message = h('p', { class: 'dialog-text dialog-text-lg' });

  const dialog = win(null, [
    h('p', { class: 'dialog-speaker' }, `${profile.nickname.toUpperCase()}:`),
    message,
  ], { className: 'dialog-window', tag: 'div' });

  /* ── The letter ──────────────────────────────────────────── */
  const topicGroup = h('fieldset', { class: 'topic-group' },
    h('legend', { class: 'field-label' }, 'WHAT KIND OF QUEST?'),
    h('div', { class: 'topic-list' }, contact.topics.map((topic, i) => h('label', { class: 'topic' },
      h('input', { type: 'radio', name: 'topic', value: topic.id, checked: i === 0 }),
      h('span', {}, topic.label)))));

  const field = (id, labelText, control) => h('div', { class: 'field' },
    h('label', { for: id, class: 'field-label' }, labelText),
    control,
    h('p', { class: 'field-error', id: `${id}-error`, role: 'alert' }));

  const nameInput = h('input', { id: 'cf-name', name: 'name', type: 'text', class: 'input', autocomplete: 'name', required: true, 'aria-describedby': 'cf-name-error' });
  const emailInput = h('input', { id: 'cf-email', name: 'email', type: 'email', class: 'input', autocomplete: 'email', required: true, 'aria-describedby': 'cf-email-error' });
  const bodyInput = h('textarea', { id: 'cf-message', name: 'message', class: 'input textarea', rows: '6', required: true, 'aria-describedby': 'cf-message-error' });
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const postmark = h('span', { class: 'postmark', 'aria-hidden': 'true' }, 'POSTED');

  const form = h('form', { class: 'compose letter', novalidate: true, 'aria-label': 'Write a letter' },
    h('div', { class: 'letter-head' },
      h('p', { class: 'letter-to' }, h('span', {}, 'TO: '), `${profile.shortName}, ${profile.characterClass}`),
      h('span', { class: 'letter-stamp', 'aria-hidden': 'true' }, sprite('envelope'))),
    topicGroup,
    field('cf-name', 'YOUR NAME', nameInput),
    field('cf-email', 'YOUR EMAIL', emailInput),
    field('cf-message', 'YOUR LETTER', bodyInput),
    button({ label: 'SEAL & OPEN EMAIL DRAFT', icon: 'envelope', className: 'btn-block' }),
    status,
    postmark);
  form.querySelector('button').type = 'submit';

  const setError = (input, text) => {
    const el = form.querySelector(`#${input.id}-error`);
    if (el) el.textContent = text;
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
  };

  form.addEventListener('input', () => form.classList.remove('is-posted'));

  form.addEventListener('submit', event => {
    event.preventDefault();
    status.textContent = '';
    form.classList.remove('is-posted');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const body = bodyInput.value.trim();

    setError(nameInput, name ? '' : 'Please enter your name.');
    setError(emailInput, EMAIL_PATTERN.test(email) ? '' : 'Please enter a valid email address.');
    setError(bodyInput, body ? '' : 'Please write a message.');

    const firstInvalid = [nameInput, emailInput, bodyInput].find(i => i.getAttribute('aria-invalid') === 'true');
    if (firstInvalid) { firstInvalid.focus(); return; }

    const chosen = form.querySelector('input[name="topic"]:checked');
    const topic = contact.topics.find(t => t.id === chosen?.value) || contact.topics[0];
    const subject = `${topic.subject}: message from ${name}`;
    const text = `${body}\n\n— ${name} (${email})`;
    ctx.sound.select();
    form.classList.add('is-posted');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    status.textContent = 'Opening your email app with a draft. Nothing has been sent yet. Press send in your email app to deliver it. No email app? Use COPY EMAIL instead.';
  });

  /* ── Stamps (links) ──────────────────────────────────────── */
  const slots = [
    { label: 'EMAIL', value: contact.email, href: `mailto:${contact.email}`, icon: 'envelope', external: false },
    ...contact.links.map(l => ({ label: l.label.toUpperCase(), value: l.value, href: l.href, icon: l.icon, external: true })),
  ];

  const stamps = h('ul', { class: 'party-list stamp-list' }, slots.map(slot => h('li', {},
    h('a', {
      class: 'party-slot stamp-slot',
      href: slot.href,
      ...(slot.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    },
    h('span', { class: 'party-icon', 'aria-hidden': 'true' }, sprite(slot.icon)),
    h('span', { class: 'party-text' }, h('strong', {}, slot.label), h('small', {}, slot.value)),
    slot.external ? h('span', { class: 'sr-only' }, ' (opens in a new tab)') : null))));

  const copyStatus = h('p', { class: 'copy-status', role: 'status', 'aria-live': 'polite' });
  const copyBtn = button({ label: 'COPY EMAIL', icon: 'scroll', variant: 'ghost', className: 'btn-block', onClick: async () => {
    ctx.sound.select();
    try {
      await navigator.clipboard.writeText(contact.email);
      copyStatus.textContent = `Copied ${contact.email} to your clipboard.`;
    } catch {
      copyStatus.textContent = `Could not copy automatically. My email is ${contact.email}.`;
    }
  } });

  const resume = button({ label: contact.resume.label, href: contact.resume.href, download: true, icon: 'scroll', className: 'btn-block' });

  const el = h('div', { class: 'screen-inner contact-screen' },
    heading,
    dialog,
    h('div', { class: 'contact-grid post-grid' },
      win('WRITE A LETTER', form, { className: 'contact-form' }),
      h('div', { class: 'post-side' },
        win('STAMPS', [stamps, copyBtn, copyStatus], { className: 'contact-links' }),
        win('PICK UP A PACKAGE', [h('p', { class: 'muted' }, 'My CV, ready to download.'), resume], { className: 'contact-package' }))),
    returnRow());

  typing = typewriter(message, "QUEST COMPLETE? LET'S BUILD SOMETHING TOGETHER. I'm looking for internship opportunities, so reach out if you have a project, a role, or just a question.", { speed: 14 });

  return {
    el,
    focus() { heading.querySelector('h1').focus({ preventScroll: true }); },
    unmount() { typing?.cancel(); },
    onKey() { return false; },
  };
}
