/**
 * options.js — The OPTIONS window (a modal dialog).
 *
 * Switches: sound effects, music, scanlines (CRT look), comfort options (larger text, readable font,
 * high contrast, calm motion), lock the sky to night.
 * Plus a button to reset the local "explored" progress.
 * Focus is trapped while open; Escape closes it and focus returns to the opener.
 */

import { h } from '../core/dom.js';
import { button } from './components.js';

export function createOptions({ mount, sound, music, prefs, progress }) {
  let opener = null;

  const switches = [
    {
      id: 'sound',
      label: 'SOUND EFFECTS',
      hint: 'Tiny retro blips for walking and selections. Off by default.',
      get: () => sound.enabled,
      set: value => sound.set(value),
    },
    {
      id: 'music',
      label: 'MUSIC',
      hint: 'Quiet original chiptune loops: one for the village, and one for each time of day elsewhere. Off by default, and it pauses when you leave the tab.',
      get: () => music.enabled,
      set: value => music.set(value),
    },
    {
      id: 'scanlines',
      label: 'SCANLINES',
      hint: 'A faint CRT screen look over the whole page.',
      get: () => prefs.scanlines,
      set: value => prefs.set('scanlines', value),
    },
    {
      id: 'big',
      label: 'LARGER TEXT',
      hint: 'Makes all text about 20% bigger.',
      get: () => prefs.bigText,
      set: value => prefs.set('bigText', value),
    },
    {
      id: 'readable',
      label: 'READABLE FONT',
      hint: 'Swaps the pixel font for a plain, easy-to-read one.',
      get: () => prefs.readable,
      set: value => prefs.set('readable', value),
    },
    {
      id: 'contrast',
      label: 'HIGH CONTRAST',
      hint: 'Brighter text, stronger borders, and a darker backdrop.',
      get: () => prefs.contrast,
      set: value => prefs.set('contrast', value),
    },
    {
      id: 'calm',
      label: 'CALM MOTION',
      hint: 'Turns off all animation. Also follows your device\'s reduce-motion setting.',
      get: () => prefs.calm,
      set: value => prefs.set('calm', value),
    },
    {
      id: 'night',
      label: 'ALWAYS NIGHT',
      hint: 'By default the sky follows your clock: dawn, day, dusk, or night.',
      get: () => prefs.nightLock,
      set: value => prefs.set('nightLock', value),
    },
  ];

  const rows = switches.map(item => {
    const state = h('span', { class: 'switch-state' });
    const control = h('button', {
      class: 'switch',
      type: 'button',
      role: 'switch',
      'aria-checked': 'false',
      onClick: () => { item.set(!item.get()); sync(); },
    }, h('span', { class: 'switch-label' }, item.label), state);
    const hint = h('p', { class: 'muted switch-hint' }, item.hint);
    control.setAttribute('aria-describedby', `opt-${item.id}-hint`);
    hint.id = `opt-${item.id}-hint`;
    return { item, control, state, el: h('li', {}, control, hint) };
  });

  const resetStatus = h('p', { class: 'muted switch-hint', role: 'status', 'aria-live': 'polite' });
  const resetBtn = button({
    label: 'RESET EXPLORED AREAS',
    variant: 'ghost',
    onClick: () => {
      progress.reset();
      resetStatus.textContent = 'Progress cleared. The flags on the village buildings and the EXPLORED counter are reset.';
    },
    className: 'btn-block',
  });

  const closeBtn = button({ label: 'CLOSE', onClick: () => close(), className: 'btn-block' });

  const dialog = h('section', {
    class: 'win modal-win',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'options-title',
    tabindex: '-1',
  },
  h('h2', { class: 'win-title', id: 'options-title' }, 'OPTIONS'),
  h('div', { class: 'win-body' },
    h('ul', { class: 'option-list' }, rows.map(r => r.el)),
    h('div', { class: 'option-reset' }, resetBtn, resetStatus),
    closeBtn));

  const backdrop = h('div', { class: 'modal-backdrop', onClick: () => close() });
  const root = h('div', { class: 'modal', hidden: true }, backdrop, dialog);
  mount.append(root);

  function sync() {
    rows.forEach(({ item, control, state }) => {
      const on = item.get();
      control.setAttribute('aria-checked', String(on));
      state.textContent = on ? 'ON' : 'OFF';
    });
  }
  sound.onChange(sync);
  music.onChange(sync);
  sync();

  function focusables() {
    return [...dialog.querySelectorAll('button:not([disabled]), a[href]')];
  }

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  function open(trigger) {
    opener = trigger || document.activeElement;
    resetStatus.textContent = '';
    sync();
    root.hidden = false;
    document.body.classList.add('modal-open');
    rows[0].control.focus();
  }

  function close() {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove('modal-open');
    sound.back();
    if (opener && document.contains(opener)) opener.focus();
  }

  return { open, close, get isOpen() { return !root.hidden; } };
}
