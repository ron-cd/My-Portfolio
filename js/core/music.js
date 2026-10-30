/**
 * music.js — Optional, original chiptune background loops (Web Audio, no files).
 *
 * Rules this module keeps:
 *   • OFF by default. It only starts after the visitor turns MUSIC on in Options.
 *   • Separate from the sound-effects switch.
 *   • Browsers block audio until a click or key press, so a saved "on" setting
 *     waits quietly for the first interaction before it begins.
 *   • It pauses when the tab is hidden and resumes when it comes back.
 *   • Quiet, through a low-pass filter. Which tune plays:
 *       – in the village (WALK AROUND): always "village" (Cozy Village)
 *       – on every other screen, by the visitor's clock:
 *           5 am – noon  "morning"    noon – 7 pm  "afternoon" (Adventure)    7 pm – 5 am  "night" (Dreamy)
 *     `?sky=dawn|day` plays the morning tune, `?sky=dusk` the afternoon one, `?sky=night`
 *     (or the ALWAYS NIGHT option) the night one. A new tune starts at the next bar line
 *     when you walk in or out of the village or the time of day changes at the end of a loop.
 *
 * All four tunes are written here as plain data (see THEMES), composed for this site.
 */

import { prefs } from './settings.js';

const KEY = 'player-one-music';
const MASTER = 0.06;

/**
 * Melody tokens are chord degrees: 1 root, 2 passing tone, 3 third, 5 fifth,
 * 6 sixth, 8 octave, 10 octave+third, 12 octave+fifth, null rest.
 * Every bar is eight eighth-notes. `chords` has one [semitones above tonic, 'M' | 'm'] per bar.
 *   lead      oscillator for the melody      bass   'basic' | 'bounce' | 'pad'
 *   arp       faint off-beat arpeggio        level  evens out loudness between tunes
 */
const THEMES = {
  village: { // Cozy Village: warm and gentle
    bpm: 96, tonic: 48, lead: 'triangle', leadGain: 0.7, bass: 'basic', arp: true, arpType: 'sine', level: 0.91,
    chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M'], [0, 'M'], [4, 'm'], [5, 'M'], [7, 'M']],
    melody: [
      [5, null, 8, null, 10, 8, 5, null],
      [8, null, 5, null, 3, null, 5, null],
      [8, null, 6, 5, 3, null, 5, null],
      [5, 3, 5, 8, 10, null, 8, null],
      [10, null, 8, null, 5, null, 8, null],
      [8, null, 10, null, 12, 10, 8, null],
      [8, null, 6, null, 8, 10, null, 8],
      [5, null, 3, 5, 2, null, 1, null],
    ],
  },
  morning: { // the original daytime tune
    bpm: 112, tonic: 48, lead: 'square', leadGain: 0.36, bass: 'basic', arp: true, level: 1,
    chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']],
    melody: [
      [8, null, 5, 8, 10, 8, 5, null],
      [8, null, 3, 5, 8, null, 5, null],
      [5, 3, 5, 8, 10, null, 8, 5],
      [5, null, 8, null, 5, 2, 3, null],
    ],
  },
  afternoon: { // Adventure: brisk, bouncing bass
    bpm: 120, tonic: 50, lead: 'square', leadGain: 0.34, bass: 'bounce', arp: false, level: 1.18,
    chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M'], [0, 'M'], [7, 'M'], [5, 'M'], [7, 'M']],
    melody: [
      [8, null, 8, 10, 12, null, 10, 8],
      [8, null, 5, 8, 10, null, 8, 5],
      [5, 8, 10, 8, 5, null, 3, 5],
      [8, null, 10, 12, 10, 8, null, 5],
      [12, null, 10, 8, 10, null, 12, null],
      [10, null, 8, 5, 8, null, 10, null],
      [8, 10, 12, 10, 8, null, 5, 8],
      [10, null, 8, null, 5, null, null, null],
    ],
  },
  night: { // Dreamy: slow, soft sustained chords
    bpm: 72, tonic: 53, lead: 'sine', leadGain: 0.8, bass: 'pad', arp: true, arpType: 'sine', level: 0.78,
    chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M'], [0, 'M'], [7, 'M'], [5, 'M'], [7, 'M']],
    melody: [
      [8, null, null, null, 10, null, 8, null],
      [5, null, null, 8, null, null, 5, null],
      [8, null, 10, null, null, 12, null, null],
      [10, null, 8, null, 5, null, null, null],
      [12, null, null, 10, null, 8, null, null],
      [8, null, 5, null, null, 8, null, null],
      [10, null, null, 8, null, 5, null, null],
      [5, null, 8, null, null, null, null, null],
    ],
  },
};

const degree = (token, minor) => ({
  1: 0, 2: 2, 3: minor ? 3 : 4, 5: 7, 6: 9, 8: 12, 10: minor ? 15 : 16, 12: 19,
}[token]);
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

/** Which time-of-day tune plays outside the village. */
function period() {
  const forced = new URLSearchParams(window.location.search).get('sky');
  if (forced === 'dawn' || forced === 'day') return 'morning';
  if (forced === 'dusk') return 'afternoon';
  if (forced === 'night' || prefs.nightLock) return 'night';
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'night';
}

let enabled = false;
try { enabled = localStorage.getItem(KEY) === 'on'; } catch { /* stay off */ }

let ctx = null;
let master = null;
let timer = null;
let nextTime = 0;
let theme = null;
let themeId = null;
let loopStep = 0;
let inVillage = false;
let switchPending = false;
let waitingForGesture = false;
const listeners = new Set();

function getContext() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2800;
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(filter).connect(ctx.destination);
  } catch { ctx = null; }
  return ctx;
}

function note(freq, when, length, { type = 'square', gain = 0.5 } = {}) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const peak = gain * (theme?.level ?? 1);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(peak, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(peak * 0.55, when + length * 0.6);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(amp).connect(master);
  osc.start(when);
  osc.stop(when + length + 0.03);
}

/** A slow-swelling sine, for the sustained chords of the dreamy tune. */
function pad(freq, when, length, gain) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const peak = gain * (theme?.level ?? 1);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(peak, when + length * 0.25);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(amp).connect(master);
  osc.start(when);
  osc.stop(when + length + 0.05);
}

/** Choose the tune at a bar line: at the end of a loop, or straight away after a change of place. */
function chooseTheme() {
  const length = theme ? theme.chords.length * 8 : 0;
  if (theme && loopStep % 8 === 0 && (switchPending || loopStep >= length)) {
    const nextId = inVillage ? 'village' : period();
    if (nextId !== themeId || loopStep >= length) loopStep = 0;
    themeId = nextId;
    theme = THEMES[nextId];
    switchPending = false;
  } else if (!theme) {
    themeId = inVillage ? 'village' : period();
    theme = THEMES[themeId];
    loopStep = 0;
    switchPending = false;
  }
}

function scheduleStep(when) {
  chooseTheme();
  const bar = Math.floor(loopStep / 8);
  const beat = loopStep % 8;
  const eighth = 60 / theme.bpm / 2;
  const [root, quality] = theme.chords[bar];
  const minor = quality === 'm';
  const rootMidi = theme.tonic + root;

  // Bass.
  if (theme.bass === 'basic') {
    // Root on beats 1 and 3, a fifth on the "and" of 3.
    if (beat === 0 || beat === 4) note(hz(rootMidi), when, eighth * 3.4, { type: 'triangle', gain: 0.9 });
    if (beat === 6) note(hz(rootMidi + 7), when, eighth * 1.6, { type: 'triangle', gain: 0.6 });
  } else if (theme.bass === 'bounce') {
    // Root and fifth, every eighth note.
    note(hz(beat % 2 === 0 ? rootMidi : rootMidi + 7), when, eighth * 0.9, { type: 'triangle', gain: beat % 2 === 0 ? 0.9 : 0.55 });
  } else if (theme.bass === 'pad' && beat === 0) {
    // One long bass note and a soft chord for the whole bar.
    note(hz(rootMidi), when, eighth * 7.5, { type: 'triangle', gain: 0.7 });
    [0, minor ? 3 : 4, 7].forEach(t => pad(hz(rootMidi + 12 + t), when, eighth * 8, 0.22));
  }

  // Lead.
  const token = theme.melody[bar][beat];
  if (token !== null && token !== undefined) {
    note(hz(rootMidi + 12 + degree(token, minor)), when, eighth * (theme.bass === 'pad' ? 3 : 1.7), { type: theme.lead, gain: theme.leadGain });
  }

  // Faint off-beat arpeggio.
  if (theme.arp && beat % 2 === 1) {
    const tones = [0, degree(3, minor), 7, 12];
    note(hz(rootMidi + 24 + tones[(beat >> 1) % 4]), when, eighth * 0.8, { type: theme.arpType || 'square', gain: 0.1 });
  }

  loopStep += 1;
}

function tick() {
  if (!ctx || ctx.state !== 'running') return;
  while (nextTime < ctx.currentTime + 0.3) {
    scheduleStep(nextTime);
    nextTime += 60 / theme.bpm / 2;
  }
}

function begin() {
  const audio = getContext();
  if (!audio || timer) return;
  audio.resume().catch(() => {});
  theme = null;
  loopStep = 0;
  nextTime = audio.currentTime + 0.12;
  master.gain.cancelScheduledValues(audio.currentTime);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), audio.currentTime);
  master.gain.exponentialRampToValueAtTime(MASTER, audio.currentTime + 0.6);
  timer = setInterval(tick, 90);
}

function halt() {
  if (timer) { clearInterval(timer); timer = null; }
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
  }
}

/** Start now if we are allowed to, otherwise on the visitor's first click or key press. */
function startWhenAllowed() {
  if (!enabled || document.hidden) return;
  if (navigator.userActivation?.hasBeenActive) { begin(); return; }
  if (waitingForGesture) return;
  waitingForGesture = true;
  const go = () => {
    waitingForGesture = false;
    window.removeEventListener('pointerdown', go, true);
    window.removeEventListener('keydown', go, true);
    if (enabled) begin();
  };
  window.addEventListener('pointerdown', go, true);
  window.addEventListener('keydown', go, true);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    halt();
    ctx?.suspend?.().catch(() => {});
  } else if (enabled) {
    startWhenAllowed();
  }
});

export const music = {
  get enabled() { return enabled; },
  get playing() { return Boolean(timer); },
  /** Which tune is playing: 'village', 'morning', 'afternoon' or 'night' (null before it starts). */
  get tune() { return themeId; },
  /** Tell the music where the visitor is. The village has its own tune. */
  setScene(name) {
    const next = name === 'world';
    if (next === inVillage) return;
    inVillage = next;
    switchPending = true;
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  set(value) {
    enabled = Boolean(value);
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* ignore */ }
    if (enabled) startWhenAllowed(); else halt();
    listeners.forEach(fn => fn(enabled));
  },
  toggle() { this.set(!enabled); },
  /** Call once at start-up: resumes a saved "on" setting after the first gesture. */
  init() { if (enabled) startWhenAllowed(); },
};
