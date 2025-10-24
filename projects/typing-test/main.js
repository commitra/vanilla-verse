const textEl = document.getElementById("text");
const caret = document.getElementById("caret");
const wpmEl = document.getElementById("wpm");
const accEl = document.getElementById("acc");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restartBtn");
const timeSelect = document.getElementById("timeSelect");

// === LIVE TITLE DISPLAY ===
const titleEl = document.querySelector("h1");
let typedText = "";

// Leaderboard elements
const leaderboardList = document.getElementById("leaderboard-list");
const leaderboardLoading = document.getElementById("leaderboard-loading");
const leaderboardEmpty = document.getElementById("leaderboard-empty");
const timeframeBtns = document.querySelectorAll(".timeframe-btn");
const currentScoreEl = document.getElementById("current-score");
const userWpmEl = document.getElementById("user-wpm");
const userAccEl = document.getElementById("user-acc");

// Array of words
const words = [
  "The","quick","brown","fox","jumps","over","the","lazy","dog",
  "Typing","fast","is","fun","and","improves","your","accuracy",
  "Practice","daily","to","increase","your","typing","speed",
  "JavaScript","is","a","versatile","language","for","web","development",
  "Coding","challenges","help","sharpen","your","programming","skills"
];

let textArray = [];
let index = 0;
let correct = 0;
let start = null;
let timeLeft = parseInt(timeSelect.value);
let timerInterval = null;
let typingStarted = false;
let currentTimeframe = "daily";
let userScores = JSON.parse(localStorage.getItem('typingTestScores')) || [];

// === UPDATE TITLE WITH TYPED TEXT ===
function updateTitle() {
  const baseTitle = "Typing Test ";
  const fullText = baseTitle + typedText;
  titleEl.textContent = fullText;

  // Trigger scroll only if text is too long
  const isOverflowing = titleEl.scrollWidth > titleEl.parentElement.offsetWidth;
  titleEl.classList.toggle("scrolling", isOverflowing);
}

// Leaderboard functions
function saveScore(wpm, accuracy) {
  const score = {
    id: Date.now().toString(),
    wpm: wpm,
    accuracy: accuracy,
    timestamp: Date.now(),
    username: generateAnonymousUsername()
  };
  userScores.push(score);
  if (userScores.length > 100) userScores = userScores.slice(-100);
  localStorage.setItem('typingTestScores', JSON.stringify(userScores));
  return score;
}

function generateAnonymousUsername() {
  const animals = ['Penguin', 'Fox', 'Dolphin', 'Tiger', 'Eagle', 'Wolf', 'Owl', 'Lion', 'Bear', 'Hawk'];
  const adjectives = ['Quick', 'Clever', 'Swift', 'Smart', 'Brave', 'Wise', 'Sharp', 'Nimble', 'Alert', 'Keen'];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective}${animal}${Math.floor(Math.random() * 1000)}`;
}

function getScoresByTimeframe(timeframe) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const weekInMs = 7 * dayInMs;
  return userScores.filter(score => {
    const timeDiff = now - score.timestamp;
    switch(timeframe) {
      case 'daily': return timeDiff <= dayInMs;
      case 'weekly': return timeDiff <= weekInMs;
      case 'alltime': return true;
      default: return true;
    }
  });
}

function displayLeaderboard(timeframe = 'daily') {
  leaderboardLoading.style.display = 'block';
  leaderboardEmpty.style.display = 'none';
  leaderboardList.innerHTML = '';
  setTimeout(() => {
    const scores = getScoresByTimeframe(timeframe)
      .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
      .slice(0, 10);
    leaderboardLoading.style.display = 'none';
    if (scores.length === 0) {
      leaderboardEmpty.style.display = 'block';
      return;
    }
    scores.forEach((score, i) => {
      leaderboardList.appendChild(createLeaderboardItem(score, i + 1));
    });
  }, 500);
}

function createLeaderboardItem(score, rank) {
  const item = document.createElement('div');
  item.className = `leaderboard-item rank-${rank}`;
  item.setAttribute('role', 'listitem');
  const timestamp = new Date(score.timestamp).toLocaleDateString();
  item.innerHTML = `
    <div class="rank">${rank}</div>
    <div class="user-info">
      <div class="avatar">${score.username.charAt(0)}</div>
      <span class="username">${score.username}</span>
    </div>
    <div class="score-info">
      <span class="wpm-score">${score.wpm} WPM</span>
      <span class="accuracy-score">${score.accuracy}%</span>
    </div>
    <div class="timestamp">${timestamp}</div>
  `;
  return item;
}

function showCurrentScore(wpm, accuracy, isHighScore = false) {
  userWpmEl.textContent = wpm;
  userAccEl.textContent = accuracy;
  currentScoreEl.style.display = 'block';
  if (isHighScore) {
    currentScoreEl.classList.add('highlight');
    setTimeout(() => currentScoreEl.classList.remove('highlight'), 3000);
  }
}

function isHighScore(wpm, timeframe) {
  const scores = getScoresByTimeframe(timeframe);
  if (scores.length === 0) return true;
  return wpm > Math.max(...scores.map(s => s.wpm));
}

function appendWords(count = 10) {
  for (let i = 0; i < count; i++) {
    const word = words[Math.floor(Math.random() * words.length)];
    textArray.push(word);
    word.split("").forEach(ch => {
      const span = document.createElement("span");
      span.textContent = ch;
      span.dataset.word = textArray.length - 1;
      textEl.appendChild(span);
    });
    const space = document.createElement("span");
    space.textContent = " ";
    space.dataset.word = textArray.length - 1;
    textEl.appendChild(space);
  }
  
  // Ensure caret is visible after words are added
  setTimeout(() => {
    caret.style.display = "block";
    caret.style.opacity = "1";
    updateCaret();
  }, 10);
}

function updateCaret() {
  const spans = textEl.querySelectorAll("span");
  
  // remove previous current marker
  document.querySelectorAll(".current").forEach(el => el.classList.remove("current"));

  if (index >= spans.length) {
    caret.style.display = "none";
    return;
  }

  const span = spans[index];

  // Use requestAnimationFrame for better performance and timing
  requestAnimationFrame(() => {
    // Get the position relative to the text container
    const textRect = textEl.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    
    // Position the caret at the beginning of the current character
    caret.style.left = `${spanRect.left - textRect.left}px`;
    caret.style.top = `${spanRect.top - textRect.top}px`;
    caret.style.height = `${spanRect.height}px`;
    caret.style.display = "block";
    caret.style.opacity = "1";

    // mark current span for styling
    span.classList.add("current");
  });
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endTest();
    }
  }, 1000);
}

function endTest() {
  document.removeEventListener("keydown", handleTyping);
  caret.style.display = "none";
  const minutes = (Date.now() - start) / 60000;
  const wpm = Math.round((index / 5) / Math.max(minutes, 0.001));
  const acc = Math.round((correct / Math.max(index, 1)) * 100);
  const savedScore = saveScore(wpm, acc);
  const highScore = isHighScore(wpm, currentTimeframe);
  showCurrentScore(wpm, acc, highScore);
  displayLeaderboard(currentTimeframe);
}

function resetTest() {
  clearInterval(timerInterval);
  timerInterval = null;
  index = 0;
  correct = 0;
  start = null;
  typingStarted = false;
  wpmEl.textContent = 0;
  accEl.textContent = 100;
  timeLeft = parseInt(timeSelect.value);
  timeEl.textContent = timeLeft;
  currentScoreEl.style.display = "none";
  textArray = [];
  textEl.innerHTML = "";
  appendWords(30);

  // Force caret to be visible and positioned
  forceCaretVisible();
  setTimeout(forceCaretVisible, 10);
  setTimeout(forceCaretVisible, 50);
  setTimeout(forceCaretVisible, 100);

  typedText = "";
  updateTitle(); // Reset title

  document.addEventListener("keydown", handleTyping);
  
  // Make sure caret is visible when user clicks on text area
  textEl.addEventListener("click", forceCaretVisible);
}

function handleTyping(e) {
  e.preventDefault();

  if (!typingStarted) {
    startTimer();
    typingStarted = true;
    start = Date.now();
    // Caret should already be visible, but ensure it's shown
    caret.style.display = "block";
    caret.style.opacity = "1";
  }

  const spans = textEl.querySelectorAll("span");

  if (e.key.length === 1 && index < spans.length) {
    if (e.key === spans[index].textContent) {
      spans[index].classList.add("correct");
      correct++;
    } else {
      spans[index].classList.add("wrong");
    }
    index++;
    updateCaret();

    typedText += e.key;
    updateTitle();

    const currentWord = parseInt(spans[index]?.dataset.word) || 0;
    if (currentWord >= textArray.length - 2) {
      appendWords(10);
      updateCaret();
    }
  } else if (e.key === "Backspace" && index > 0) {
    index--;
    spans[index].classList.remove("correct", "wrong");
    updateCaret();
    typedText = typedText.slice(0, -1);
    updateTitle();
  }

  const minutes = (Date.now() - start) / 60000;
  const wpm = Math.round((index / 5) / Math.max(minutes, 0.001));
  const acc = Math.round((correct / Math.max(index, 1)) * 100);
  wpmEl.textContent = wpm;
  accEl.textContent = Math.min(acc, 100);
}

function initLeaderboard() {
  displayLeaderboard(currentTimeframe);
  timeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = btn.dataset.timeframe;
      displayLeaderboard(currentTimeframe);
    });
  });
}

function checkScrollable() {
  const body = document.body;
  const isScrollable = body.scrollHeight > window.innerHeight;
  body.classList.toggle('scrollable', isScrollable);
}

window.addEventListener('load', checkScrollable);
window.addEventListener('resize', checkScrollable);
setTimeout(checkScrollable, 1000);

// Force caret to be visible
function forceCaretVisible() {
  if (caret) {
    caret.style.display = "block";
    caret.style.opacity = "1";
    caret.style.visibility = "visible";
    updateCaret();
  }
}

// Initialize
resetTest();
initLeaderboard();
restartBtn.addEventListener("click", resetTest);
timeSelect.addEventListener("change", resetTest);
window.addEventListener("resize", updateCaret);

// Ensure caret is visible when page loads
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(forceCaretVisible, 100);
  setTimeout(forceCaretVisible, 300);
  setTimeout(forceCaretVisible, 500);
});

// Also ensure caret is visible after a short delay
setTimeout(forceCaretVisible, 200);
setTimeout(forceCaretVisible, 400);
setTimeout(forceCaretVisible, 800);

// Ensure caret is visible when window gets focus
window.addEventListener("focus", forceCaretVisible);
window.addEventListener("load", forceCaretVisible);
