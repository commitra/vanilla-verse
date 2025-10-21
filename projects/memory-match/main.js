'use strict';

// DOM Elements and Game State
const grid = document.getElementById('grid');
const timeEl = document.querySelector('.time');
const bestEl = document.querySelector('.best');

const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

      
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
        
            const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
        });


const emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🍊', '🍉'];
let deck = shuffle([...emojis, ...emojis]).map((v, i) => ({ id: i, v, flipped: false, matched: false }));
let first = null, second = null, lock = false;

// Timer and Score State
let timerInterval = null;
let seconds = 0;
let isTimerRunning = false;

// --- CORE GAME FUNCTIONS ---

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function render() {
    grid.innerHTML = '';
    for (const c of deck) {
        const btn = document.createElement('button');
        btn.className = 'card' + (c.flipped || c.matched ? ' flipped' : '');
        btn.textContent = (c.flipped || c.matched) ? c.v : '?';
        btn.disabled = c.matched || lock;
        btn.addEventListener('click', () => flip(c));
        grid.appendChild(btn);
    }
}

function flip(c) {
    if (lock || c.matched || c.flipped) return;

    // Start timer on the very first card flip
    if (!isTimerRunning) {
        startTimer();
    }

    c.flipped = true;
    render();
    if (!first) { first = c; return; }
    second = c;
    lock = true;

    setTimeout(() => {
        if (first.v === second.v) {
            first.matched = second.matched = true;
            
            // Check for win condition after a successful match
            const allMatched = deck.every(card => card.matched);
            if (allMatched) {
                stopTimer();
                updateBestTime();
            }
        }
        first.flipped = second.flipped = false;
        first = second = null;
        lock = false;
        render();
    }, 600);
}

// --- TIMER AND SCORE FUNCTIONS ---

function startTimer() {
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        seconds++;
        timeEl.textContent = `Time: ${formatTime(seconds)}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(s) {
    const minutes = Math.floor(s / 60).toString().padStart(2, '0');
    const seconds = (s % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function updateBestTime() {
    const bestTime = localStorage.getItem('memoryMatchBestTime');
    if (!bestTime || seconds < parseInt(bestTime)) {
        localStorage.setItem('memoryMatchBestTime', seconds);
        bestEl.textContent = `Best: ${formatTime(seconds)}`;
    }
}

function loadBestTime() {
    const bestTime = localStorage.getItem('memoryMatchBestTime');
    if (bestTime) {
        bestEl.textContent = `Best: ${formatTime(parseInt(bestTime))}`;
    }
}

// --- INITIALIZE GAME ---

loadBestTime();
render();


