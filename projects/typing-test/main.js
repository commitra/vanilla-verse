const textEl = document.getElementById("text");
const caret = document.getElementById("caret");
const wpmEl = document.getElementById("wpm");
const accEl = document.getElementById("acc");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restartBtn");
const timeSelect = document.getElementById("timeSelect");

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

// Leaderboard Storage Management
function saveScore(wpm, accuracy) {
  const score = {
    id: Date.now().toString(),
    wpm: wpm,
    accuracy: accuracy,
    timestamp: Date.now(),
    username: generateAnonymousUsername()
  };
  
  userScores.push(score);
  
  // Keep only last 100 scores to prevent storage bloat
  if (userScores.length > 100) {
    userScores = userScores.slice(-100);
  }
  
  localStorage.setItem('typingTestScores', JSON.stringify(userScores));
  return score;
}

// Generate anonymous username for privacy
function generateAnonymousUsername() {
  const animals = ['Penguin', 'Fox', 'Dolphin', 'Tiger', 'Eagle', 'Wolf', 'Owl', 'Lion', 'Bear', 'Hawk'];
  const adjectives = ['Quick', 'Clever', 'Swift', 'Smart', 'Brave', 'Wise', 'Sharp', 'Nimble', 'Alert', 'Keen'];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective}${animal}${Math.floor(Math.random() * 1000)}`;
}

// Get scores for specific timeframe
function getScoresByTimeframe(timeframe) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const weekInMs = 7 * dayInMs;
  
  return userScores.filter(score => {
    const scoreTime = score.timestamp;
    const timeDiff = now - scoreTime;
    
    switch(timeframe) {
      case 'daily':
        return timeDiff <= dayInMs;
      case 'weekly':
        return timeDiff <= weekInMs;
      case 'alltime':
        return true;
      default:
        return true;
    }
  });
}

// Display leaderboard
function displayLeaderboard(timeframe = 'daily') {
  leaderboardLoading.style.display = 'block';
  leaderboardEmpty.style.display = 'none';
  leaderboardList.innerHTML = '';
  
  // Simulate loading for better UX
  setTimeout(() => {
    const scores = getScoresByTimeframe(timeframe);
    const topScores = scores
      .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
      .slice(0, 10);
    
    leaderboardLoading.style.display = 'none';
    
    if (topScores.length === 0) {
      leaderboardEmpty.style.display = 'block';
      return;
    }
    
    topScores.forEach((score, index) => {
      const item = createLeaderboardItem(score, index + 1);
      leaderboardList.appendChild(item);
    });
  }, 500);
}

// Create leaderboard item element
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

// Show current user score
function showCurrentScore(wpm, accuracy, isHighScore = false) {
  userWpmEl.textContent = wpm;
  userAccEl.textContent = accuracy;
  currentScoreEl.style.display = 'block';
  
  if (isHighScore) {
    currentScoreEl.classList.add('highlight');
    setTimeout(() => {
      currentScoreEl.classList.remove('highlight');
    }, 3000);
  }
}

// Check if score is high score
function isHighScore(wpm, timeframe) {
  const scores = getScoresByTimeframe(timeframe);
  if (scores.length === 0) return true;
  
  const topScore = Math.max(...scores.map(s => s.wpm));
  return wpm > topScore;
}

// Generate words and append as spans
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
}

// Update caret position relative to text container
function updateCaret() {
  const spans = textEl.querySelectorAll("span");
  if (index >= spans.length) {
    caret.style.display = "none";
    return;
  }
  const span = spans[index];
  caret.style.left = `${span.offsetLeft}px`;
  caret.style.top = `${span.offsetTop}px`;
  caret.style.height = `${span.offsetHeight}px`;
  caret.style.display = "block";
}

// Start timer on first keystroke
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

// End test
function endTest() {
  document.removeEventListener("keydown", handleTyping);
  caret.style.display = "none";
  
  // Calculate final scores
  const minutes = (Date.now() - start) / 60000;
  const wpm = Math.round((index / 5) / Math.max(minutes, 0.001));
  const acc = Math.round((correct / Math.max(index, 1)) * 100);
  
  // Save score and update leaderboard
  const savedScore = saveScore(wpm, acc);
  const highScore = isHighScore(wpm, currentTimeframe);
  
  showCurrentScore(wpm, acc, highScore);
  displayLeaderboard(currentTimeframe);
}

// Reset test
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

  caret.style.display = "none";
  currentScoreEl.style.display = "none";

  textArray = [];
  textEl.innerHTML = "";
  appendWords(30);
  updateCaret();

  document.addEventListener("keydown", handleTyping);
}

// Handle typing input
function handleTyping(e) {
  e.preventDefault();

  if (!typingStarted) {
    startTimer();
    typingStarted = true;
    start = Date.now();
    caret.style.display = "block";
  }

  const spans = textEl.querySelectorAll("span");

  if (e.key.length === 1) {
    if (index < spans.length) {
      if (e.key === spans[index].textContent) {
        spans[index].classList.add("correct");
        correct++;
      } else {
        spans[index].classList.add("wrong");
      }
      index++;
      updateCaret();

      const currentWord = parseInt(spans[index]?.dataset.word) || 0;
      if (currentWord >= textArray.length - 2) {
        appendWords(10);
        updateCaret();
      }
    }

  } else if (e.key === "Backspace" && index > 0) {
    index--;
    spans[index].classList.remove("correct", "wrong");
    updateCaret();
  }

  const minutes = (Date.now() - start) / 60000;
  const wpm = Math.round((index / 5) / Math.max(minutes, 0.001));
  const acc = Math.round((correct / Math.max(index, 1)) * 100);
  wpmEl.textContent = wpm;
  accEl.textContent = Math.min(acc, 100);
}

// Initialize leaderboard
function initLeaderboard() {
  displayLeaderboard(currentTimeframe);
  
  // Add event listeners for timeframe buttons
  timeframeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = btn.dataset.timeframe;
      displayLeaderboard(currentTimeframe);
    });
  });
}

// Add scroll detection to show scroll indicator
function checkScrollable() {
  const body = document.body;
  const isScrollable = body.scrollHeight > window.innerHeight;
  
  if (isScrollable) {
    body.classList.add('scrollable');
  } else {
    body.classList.remove('scrollable');
  }
}

// Initialize scroll check
window.addEventListener('load', checkScrollable);
window.addEventListener('resize', checkScrollable);

// Update after leaderboard loads
setTimeout(checkScrollable, 1000);

// Initialize
resetTest();
initLeaderboard();
restartBtn.addEventListener("click", resetTest);
timeSelect.addEventListener("change", resetTest);
window.addEventListener("resize", updateCaret);