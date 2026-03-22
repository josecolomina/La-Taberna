// src/services/audioService.js
// Procedural SFX engine using Web Audio API.
// No .mp3 files — all sounds are synthesized at runtime.
// AudioContext is created lazily on first play() call (browser autoplay policy).

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume in case browser suspended it
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function playTone({ freq = 440, type = 'sine', duration = 0.08, gain = 0.18, startFreq, endFreq, delay = 0 }) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const amp = c.createGain();

    osc.connect(amp);
    amp.connect(c.destination);

    osc.type = type;
    const t = c.currentTime + delay;

    if (startFreq !== undefined && endFreq !== undefined) {
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }

    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch (e) { /* silently ignore — audio may not be available */ }
}

function playNoise({ duration = 0.05, gain = 0.07, delay = 0 }) {
  try {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    const amp = c.createGain();
    src.buffer = buffer;
    src.connect(amp);
    amp.connect(c.destination);

    const t = c.currentTime + delay;
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    src.start(t);
  } catch (e) { /* noop */ }
}

// ── Sound definitions ─────────────────────────────────────────────────────────

const SOUNDS = {
  // Short blip on card click
  click: () => {
    playTone({ startFreq: 520, endFreq: 680, duration: 0.06, gain: 0.14, type: 'sine' });
  },

  // Barely-audible whisper on hover
  hover: () => {
    playTone({ freq: 660, duration: 0.025, gain: 0.06, type: 'sine' });
  },

  // Two-note chime on mulligan confirm
  confirm: () => {
    playTone({ freq: 523.25, duration: 0.14, gain: 0.18, type: 'sine', delay: 0 });
    playTone({ freq: 659.25, duration: 0.14, gain: 0.18, type: 'sine', delay: 0.09 });
  },

  // Ascending C–E–G–C arpeggio on lethal/victory
  victory: () => {
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      playTone({ freq, duration: 0.18, gain: 0.22, type: 'sine', delay: i * 0.11 });
    });
    // Reverb tail: noise burst
    playNoise({ duration: 0.25, gain: 0.04, delay: 0.44 });
  },

  // Descending minor 2nd on wrong move
  wrong: () => {
    playTone({ startFreq: 280, endFreq: 200, duration: 0.22, gain: 0.20, type: 'sawtooth' });
    playNoise({ duration: 0.12, gain: 0.06, delay: 0 });
  },

  // Rewind effect for Undo
  rewind: () => {
    playTone({ startFreq: 800, endFreq: 200, duration: 0.15, gain: 0.15, type: 'triangle' });
    playNoise({ duration: 0.15, gain: 0.05 });
  },

  // Card shuffle — brief noise burst
  'card-draw': () => {
    playNoise({ duration: 0.08, gain: 0.09 });
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Play a named sound if not muted.
 * @param {string} name — key from SOUNDS
 * @param {boolean} muted
 */
export function playSound(name, muted = false) {
  if (muted) return;
  const fn = SOUNDS[name];
  if (fn) fn();
}
