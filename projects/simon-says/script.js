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
  strictMode: false,
  difficulty: 'medium',
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
const strictModeToggle = document.getElementById('strictModeToggle');
const difficultySelect = document.getElementById('difficultySelect');

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

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  easy: { playbackSpeed: 500, gap: 400, showVisual: true },
  medium: { playbackSpeed: 350, gap: 300, showVisual: true },
  hard: { playbackSpeed: 200, gap: 200, showVisual: false },
};

// Play back the current sequence to the player
async function playbackSequence() {
  state.playingBack = true;
  messageEl.textContent = 'Watch the sequence...';
  const config = DIFFICULTY_CONFIG[state.difficulty];
  const gap = config.gap;

  for (let i = 0; i < state.sequence.length; i++) {
    const color = state.sequence[i];
    const showVisual = config.showVisual && state.showSequenceVisual;
    if (showVisual) highlightPad(color, config.playbackSpeed);
    await playSound(color, config.playbackSpeed);
    await wait(gap);
  }

  state.playingBack = false;
  messageEl.textContent = 'Your turn!';
  state.playerIndex = 0;
}

// helper wait
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function addRandomColorToSequence() {
  const idx = Math.floor(Math.random() * COLORS.length);
  state.sequence.push(COLORS[idx]);
  state.level = state.sequence.length;
  levelEl.textContent = state.level;
}

// Start a new game
function startGame() {
  if (state.running) return;
  state.sequence = [];
  state.playerIndex = 0;
  state.level = 0;
  state.running = true;
  levelEl.textContent = 0;
  messageEl.textContent = 'Game started!';
  nextRound();
}

// Restart (clear state)
function restartGame() {
  state.running = false;
  state.playingBack = false;
  state.sequence = [];
  state.playerIndex = 0;
  state.level = 0;
  levelEl.textContent = 0;
  messageEl.textContent = 'Game reset.';
}

// Move to next round: add color and playback
async function nextRound() {
  if (!state.running) return;
  addRandomColorToSequence();
  // allow a short pause before playback
  await wait(500);
  await playbackSequence();
}

// Player input handler
async function handlePlayerInput(color) {
  if (!state.running || state.playingBack) return;
  // play feedback
  highlightPad(color, 220);
  await playSound(color, 220);

  const expected = state.sequence[state.playerIndex];
  if (color === expected) {
    state.playerIndex++;
    // If player completed sequence
    if (state.playerIndex >= state.sequence.length) {
      messageEl.textContent = 'Correct! Next round...';
      await wait(600);
      nextRound();
    } else {
      messageEl.textContent = `Good (${state.playerIndex}/${state.sequence.length})`;
    }
  } else {
    // wrong
    if (state.strictMode) {
      messageEl.textContent = 'Wrong! Game over.';
      state.running = false;
      // Optionally: vibrate on supported devices
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
    } else {
      messageEl.textContent = 'Wrong! Try again.';
      await wait(800);
      // Optionally: vibrate on supported devices
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      await playbackSequence();
    }
  }
}

// Attach click / keyboard handlers to pads
function initPadListeners() {
  // click
  Object.entries(pads).forEach(([color, el]) => {
    el.addEventListener('click', () => {
      handlePlayerInput(color);
    });
  });

  // keyboard shortcuts: G, R, Y, B (or arrows)
  document.addEventListener('keydown', (e) => {
    if (state.playingBack) return; // ignore keys while sequence plays
    const keyMap = {
      g: 'green',
      r: 'red',
      y: 'yellow',
      b: 'blue',
      ArrowUp: 'green',
      ArrowLeft: 'red',
      ArrowRight: 'blue',
      ArrowDown: 'yellow',
    };
    const key = e.key;
    if (keyMap[key]) {
      handlePlayerInput(keyMap[key]);
    } else if (key === 's') {
      // convenience: press "s" to start
      startGame();
    } else if (key === 'Escape') {
      restartGame();
    }
  });
}

// UI bindings
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
soundToggle.addEventListener('change', (e) => {
  state.soundEnabled = e.target.checked;
});
showSequenceToggle.addEventListener('change', (e) => {
  state.showSequenceVisual = e.target.checked;
});
strictModeToggle.addEventListener('change', (e) => {
  state.strictMode = e.target.checked;
});
difficultySelect.addEventListener('change', (e) => {
  state.difficulty = e.target.value;
});

// initial setup
initPadListeners();

// expose some functions for debugging / tests (optional)
window.__simon = {
  state,
  startGame,
  restartGame,
  nextRound,
  addRandomColorToSequence,
  // TODO: add testing helpers, seedable RNG for deterministic tests
};

/* ------------------------------------------------------------------
  TODOs / Contribution ideas (clearly marked for open-source contributors)
--------------------------------------------------------------------
1) Sounds:
   - Add real audio files to `audioFiles` and implement file preloading.
   - Optionally use WebAudio for richer sounds, ADSR envelopes, effects.

2) Strict mode & difficulty:
   - Add a "Strict Mode" toggle: on wrong move, game over.
   - Difficulty levels: change playback speed or show fewer visual cues.

3) Mobile / Touch improvements:
   - Add touch gestures and bigger tappable areas.
   - Add haptic feedback (vibration) support with graceful fallback.

4) Persistence & Leaderboard:
   - Store high score in localStorage.
   - Add server-backed leaderboard (API) — add hooks in script to POST scores.

5) Accessibility:
   - Add aria-live descriptions for sequence playback and results.
   - Improve keyboard navigation, focus management, and color-blind mode.

6) Tests & CI:
   - Provide unit tests (Jest/Playwright) and GitHub Actions for test run & lint.

7) Visual Themes:
   - Allow contributors to add themes (neon, retro, seasonal).
   - Make theme files importable CSS module or JSON-config driven.

8) Animations:
   - Add smoother animations, CSS transitions or small particles.
   - Allow contributors to add optional confetti on win.

9) Code cleanup & modularization:
   - Break script into modules (state, ui, audio, storage) for clarity.

10) Internationalization:
   - Add locale strings and support for multiple languages.

------------------------------------------------------------------ */
