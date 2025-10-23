'use strict';

// DOM Elements
const grid = document.getElementById('grid');
const timeEl = document.querySelector('.time');
const bestEl = document.querySelector('.best');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');
const themeSelect = document.getElementById('themeSelect');
const levelSelect = document.getElementById('levelSelect');
const scoreList = document.getElementById('scoreList');

// Sounds
const flipSound = new Audio('./sounds/flip.mp3');
const matchSound = new Audio('./sounds/match.mp3');
const failSound = new Audio('./sounds/fail.mp3');
const winSound = new Audio('./sounds/win.mp3');

let soundEnabled = true;

// Game Variables
const emojis = [
  '🍎','🍌','🍇','🍓','🍒','🍍','🍊','🍉',
  '🥝','🍑','🍐','🥥','🍋','🍏','🥭','🍈'
];

let deck = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let timerInterval = null;
let seconds = 0;
let isTimerRunning = false;

// Shuffle Array
function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Play sound
function playSound(name) {
  if (!soundEnabled) return;
  if (name === 'flip') { flipSound.currentTime = 0; flipSound.play(); }
  else if (name === 'match') { matchSound.currentTime = 0; matchSound.play(); }
  else if (name === 'fail') { failSound.currentTime = 0; failSound.play(); }
  else if (name === 'win') { winSound.currentTime = 0; winSound.play(); }
}

// Timer
function startTimer() {
  isTimerRunning = true;
  timerInterval = setInterval(function() {
    seconds++;
    timeEl.textContent = 'Time: ' + formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function formatTime(s) {
  let m = Math.floor(s / 60);
  let sec = s % 60;
  return m.toString().padStart(2,'0') + ':' + sec.toString().padStart(2,'0');
}

// Render Grid
function renderGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < deck.length; i++) {
    let card = deck[i];
    let btn = document.createElement('button');
    btn.className = 'card';
    btn.setAttribute('aria-label', card.flipped || card.matched ? `Card ${card.value}` : 'Hidden card');
    if (card.flipped || card.matched) {
      btn.classList.add('flipped');
      btn.textContent = card.value;
    } else {
      btn.textContent = '?';
    }
    btn.disabled = card.matched || lockBoard;
    btn.addEventListener('click', function(){ flipCard(card); });
    grid.appendChild(btn);
  }
}

// Adjust Grid
function adjustGrid() {
  const total = deck.length;
  const cols = Math.ceil(Math.sqrt(total));
  grid.style.gridTemplateColumns = `repeat(${cols}, var(--card-size, 80px))`;
  grid.style.justifyContent = 'center';
  grid.style.justifyItems = 'center';
  let size = 80;
  if (total > 12) size = Math.max(40, 400 / cols);
  document.documentElement.style.setProperty('--card-size', size + 'px');
}

// Game Logic
function flipCard(card) {
  if(lockBoard || card.flipped || card.matched) return;
  playSound('flip');

  if(!isTimerRunning) startTimer();
  card.flipped = true;
  renderGrid();

  if(!firstCard) { firstCard = card; return; }
  secondCard = card;
  lockBoard = true;

  setTimeout(function() {
    if(firstCard.value === secondCard.value) {
      firstCard.matched = true;
      secondCard.matched = true;
      const allMatched = deck.every(c => c.matched);
      if(allMatched) {
        stopTimer();
        playSound('win'); // only win on last match
        updateBestTime();
        addScore(seconds);
      } else { playSound('match'); }
    } else {
      firstCard.flipped = false;
      secondCard.flipped = false;
      playSound('fail');
    }
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    renderGrid();
  }, 600);
}

// Scores
function addScore(time) {
  const level = levelSelect.value;
  const key = 'memoryMatchScores_' + level;
  let scores = JSON.parse(localStorage.getItem(key) || '[]');
  scores.push(time);
  scores.sort((a,b) => a - b);
  scores = scores.slice(0,5);
  localStorage.setItem(key, JSON.stringify(scores));
  renderScores();
}

function renderScores() {
  const level = levelSelect.value;
  const key = 'memoryMatchScores_' + level;
  const scores = JSON.parse(localStorage.getItem(key) || '[]');
  scoreList.innerHTML = '';
  for(let i=0; i<scores.length; i++) {
    let li = document.createElement('li');
    li.textContent = 'Game ' + (i+1) + ': ' + formatTime(scores[i]);
    scoreList.appendChild(li);
  }
}

// Best Time
function updateBestTime() {
  const level = levelSelect.value;
  const key = 'memoryMatchBestTime_' + level;
  const best = localStorage.getItem(key);
  if(!best || seconds < parseInt(best)) {
    localStorage.setItem(key, seconds);
    bestEl.textContent = 'Best: ' + formatTime(seconds);
  }
}

function loadBestTime() {
  const level = levelSelect.value;
  const key = 'memoryMatchBestTime_' + level;
  const best = localStorage.getItem(key);
  if(best) bestEl.textContent = 'Best: ' + formatTime(parseInt(best));
  else bestEl.textContent = 'Best: --:--';
}

// New Game
function newGame() {
  stopTimer();
  isTimerRunning = false;
  seconds = 0;
  timeEl.textContent = 'Time: 00:00';
  loadBestTime();

  const pairs = parseInt(levelSelect.value);
  const selectedEmojis = shuffle(emojis).slice(0, pairs);

  deck = [];
  for(let i=0; i<selectedEmojis.length; i++) {
    deck.push({id:i*2, value:selectedEmojis[i], flipped:false, matched:false});
    deck.push({id:i*2+1, value:selectedEmojis[i], flipped:false, matched:false});
  }
  deck = shuffle(deck);
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  adjustGrid();
  renderGrid();
  renderScores();
}

// Themes
function applyTheme(name) {
  document.body.className = name;
  localStorage.setItem('memoryMatchTheme', name);
}

function loadTheme() {
  const saved = localStorage.getItem('memoryMatchTheme') || 'theme-dark';
  applyTheme(saved);
  themeSelect.value = saved;
}

// Event Listeners
restartBtn.addEventListener('click', newGame);
soundBtn.addEventListener('click', function(){
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔇 Sound' : '🔊 Enable';
});
levelSelect.addEventListener('change', newGame);
themeSelect.addEventListener('change', function(e){ applyTheme(e.target.value); });

// Initialize
loadTheme();
newGame();
