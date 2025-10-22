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
  difficulty: 'normal', // 'easy' | 'normal' | 'hard'
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
const strictToggle = document.getElementById('strictToggle');
const difficultySelect = document.getElementById('difficultySelect');
const difficultyHintEl = document.getElementById('difficultyHint');

let audioCtx;
function ensureAudioCtx(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

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
  const cfg = getDifficultyConfig();

  for (let i = 0; i < state.sequence.length; i++) {
    const color = state.sequence[i];
    const showVisual = state.showSequenceVisual && cfg.visualDuringPlayback;
    if (showVisual) highlightPad(color, cfg.highlightMs);
    await playSound(color, cfg.stepMs);
    await wait(cfg.gapMs);
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
  const cfg = getDifficultyConfig();
  // play feedback
  highlightPad(color, cfg.inputFeedbackMs);
  await playSound(color, cfg.inputFeedbackMs);

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
      messageEl.textContent = 'Wrong! Game over. Press Start to play again.';
      state.running = false;
      // Optionally: vibrate on supported devices
      try { if (navigator.vibrate) navigator.vibrate(300); } catch (e) {}
    } else {
      messageEl.textContent = 'Wrong! Try again.';
      await wait(800);
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
strictToggle?.addEventListener('change', (e) => {
  state.strictMode = e.target.checked;
});
difficultySelect?.addEventListener('change', (e) => {
  state.difficulty = e.target.value;
  applyDifficultySideEffects();
});

// initial setup
initPadListeners();
applyDifficultySideEffects();

// expose some functions for debugging / tests (optional)
window.__simon = {
  state,
  startGame,
  restartGame,
  nextRound,
  addRandomColorToSequence,
  // TODO: add testing helpers, seedable RNG for deterministic tests
};

// Difficulty configuration and helpers
function getDifficultyConfig() {
  switch (state.difficulty) {
    case 'easy':
      return { stepMs: 420, gapMs: 320, highlightMs: 380, inputFeedbackMs: 260, visualDuringPlayback: true };
    case 'hard':
      return { stepMs: 180, gapMs: 200, highlightMs: 160, inputFeedbackMs: 160, visualDuringPlayback: false };
    case 'normal':
    default:
      return { stepMs: 300, gapMs: 300, highlightMs: 300, inputFeedbackMs: 220, visualDuringPlayback: true };
  }
}

function applyDifficultySideEffects() {
  const isHard = state.difficulty === 'hard';
  if (isHard) {
    // Reduce or disable visual cues on hard
    state.showSequenceVisual = false;
    if (showSequenceToggle) {
      showSequenceToggle.checked = false;
      showSequenceToggle.disabled = true;
      showSequenceToggle.parentElement?.classList.add('disabled');
    }
    if (difficultyHintEl) difficultyHintEl.textContent = 'Hard plays faster and hides playback visuals.';
  } else {
    if (showSequenceToggle) {
      showSequenceToggle.disabled = false;
      showSequenceToggle.parentElement?.classList.remove('disabled');
      // Respect current checkbox for visuals
      state.showSequenceVisual = showSequenceToggle.checked;
    }
    if (difficultyHintEl) difficultyHintEl.textContent = 'Hard plays faster and may reduce visual cues.';
  }
}
