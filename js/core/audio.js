/**
 * audio.js — Optional, subtle retro sound effects.
 *
 * Silent by default. The visitor must switch sound on with the toggle button.
 * The AudioContext is only created after that user gesture, which satisfies
 * browser autoplay rules. The whole site works with audio unavailable.
 */

const STORAGE_KEY = 'player-one-sound';

let enabled = false;
let ctx = null;
const listeners = new Set();

try {
  enabled = localStorage.getItem(STORAGE_KEY) === 'on';
} catch { /* storage unavailable: stay silent */ }

function getContext() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

/** Play one short square-wave blip (or a tiny arpeggio). */
function blip(notes, { type = 'square', step = 0.07, gain = 0.035 } = {}) {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  const start = audio.currentTime + 0.005;
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const t0 = start + i * step;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + step);
    osc.connect(amp).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + step + 0.02);
  });
}

export const sound = {
  get enabled() { return enabled; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  set(value) {
    enabled = Boolean(value);
    try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* ignore */ }
    listeners.forEach(fn => fn(enabled));
    if (enabled) blip([660, 880]);
  },
  toggle() { this.set(!enabled); },
  move() { blip([440], { step: 0.05 }); },
  select() { blip([523, 784], { step: 0.06 }); },
  back() { blip([392, 330], { step: 0.06 }); },
  start() { blip([392, 523, 659, 784], { step: 0.08 }); },
};
