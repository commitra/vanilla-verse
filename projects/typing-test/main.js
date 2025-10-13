const textEl = document.getElementById("text");
const caret = document.getElementById("caret");
const wpmEl = document.getElementById("wpm");
const accEl = document.getElementById("acc");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restartBtn");
const timeSelect = document.getElementById("timeSelect");

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

// Initialize
resetTest();
restartBtn.addEventListener("click", resetTest);
timeSelect.addEventListener("change", resetTest);
window.addEventListener("resize", updateCaret);
