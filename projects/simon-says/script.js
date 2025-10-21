// script.js - Simon Says (Vanilla JS)
// Core game implemented. Many TODOs included for contributors.

// Colors used in order (indexable)
const COLORS = ['green', 'red', 'yellow', 'blue'];

const state = {
  sequence: [],
  playerIndex: 0,
  level: 0,
  running: false,
  playingBack: false,
  soundEnabled: true,
  showSequenceVisual: true,
};

// DOM refs
const pads = {
  green: document.getElementById('pad-green'),
  red: document.getElementById('pad-red'),
  yellow: document.getElementById('pad-yellow'),
  blue: document.getElementById('pad-blue'),
};
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const levelEl = document.getElementById('level');
const messageEl = document.getElementById('message');
const soundToggle = document.getElementById('soundToggle');
const showSequenceToggle = document.getElementById('showSequence');

// simple beep generator using WebAudio (used if no audio files provided)
let audioCtx;
function ensureAudioCtx(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Map colors to frequencies (for simple tones)
const TONE_FREQ = {
  green: 523.25, // C5
  red: 392.00,   // G4
  yellow: 329.63,// E4
  blue: 261.63,  // C4
};

// ---- TODO: Replace / add real audio files here ----
// Contributors: add preloaded audio file URLs and use `playAudioFile(color)` instead of generated tones.
const audioFiles = {
  // green: 'sounds/green.mp3',
  // red: 'sounds/red.mp3',
  // yellow: 'sounds/yellow.mp3',
  // blue: 'sounds/blue.mp3',
};

// Play audio for color. Falls back to generated tone if file isn't present.
async function playSound(color, duration = 350) {
  if (!state.soundEnabled) return;
  // If contributor added audioFiles, use that (TODO: implement file playback)
  if (audioFiles[color]) {
    // TODO: implement file playback preloading and play here
    // Example:
    // const aud = new Audio(audioFiles[color]);
    // await aud.play();
    // For now, fall back to generated tone below.
  }

  // Fallback: WebAudio tone
  ensureAudioCtx();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = TONE_FREQ[color] || 440;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  g.gain.linearRampToValueAtTime(0.18, now + 0.02);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
  o.stop(now + duration / 1000 + 0.02);
}

// Visual highlight for a pad
function highlightPad(color, ms = 350) {
  const el = pads[color];
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), ms);
}

// Play back the current sequence to the player
async function playbackSequence() {
  state.playingBack = true;
  messageEl.textContent = 'Watch the sequence...';
  // Small gap between items
  const gap = 300;

  for (let i = 0; i < state.sequence.length; i++) {
    const color = state.sequence[i];
    if (state.showSequenceVisual) highlightPad(color, 300);
    await playSound(color, 300);
    await wait(gap);
  }

  state.playingBack = false;
  messageEl.textContent = 'Your turn!';
  state.playerIndex = 0;
}

// helper wait
function wait(ms) {
  return new
