// Utility to generate a random integer in [min, max]
function generateRandomInteger(min, max) {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

function initNumberGuessingGame() {
  const input = document.getElementById('guess-input');
  const guessBtn = document.getElementById('guess-btn');
  const feedback = document.getElementById('feedback');
  const attemptsText = document.getElementById('attempts');
  const attemptCount = document.getElementById('attempt-count');
  const restartBtn = document.getElementById('restart-btn');

  const MIN = 1;
  const MAX = 100;

  let targetNumber = generateRandomInteger(MIN, MAX);
  let attempts = 0;
  let gameOver = false;

  function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.dataset.type = type || '';
  }

  function setGameOver(over) {
    gameOver = over;
    input.disabled = over;
    guessBtn.disabled = over;
    if (over) {
      input.blur();
    }
  }

  function validateGuess(value) {
    if (value === '') return { ok: false, msg: 'Please enter a number.' };
    const num = Number(value);
    if (!Number.isFinite(num)) return { ok: false, msg: 'That is not a valid number.' };
    if (!Number.isInteger(num)) return { ok: false, msg: 'Please enter a whole number.' };
    if (num < MIN || num > MAX) return { ok: false, msg: `Enter a number between ${MIN} and ${MAX}.` };
    return { ok: true, value: num };
  }

  function handleGuess() {
    if (gameOver) return;
    const { ok, msg, value } = validateGuess(input.value.trim());
    if (!ok) {
      setFeedback(msg, 'error');
      return;
    }
    attempts += 1;
    attemptCount.textContent = String(attempts);

    if (value === targetNumber) {
      setFeedback(`Correct! The number was ${targetNumber}.`, 'success');
      setGameOver(true);
      return;
    }
    if (value < targetNumber) {
      setFeedback('Too low. Try a higher number.', 'low');
    } else {
      setFeedback('Too high. Try a lower number.', 'high');
    }
    input.select();
  }

  function restartGame() {
    targetNumber = generateRandomInteger(MIN, MAX);
    attempts = 0;
    attemptCount.textContent = '0';
    setFeedback('', '');
    input.value = '';
    setGameOver(false);
    input.focus();
  }

  guessBtn.addEventListener('click', handleGuess);
  input.addEventListener('keydown', function onKeyDown(event) {
    if (event.key === 'Enter') {
      handleGuess();
    }
  });
  restartBtn.addEventListener('click', restartGame);

  // Init state
  attemptsText.hidden = false;
  setFeedback('', '');
}

window.addEventListener('DOMContentLoaded', initNumberGuessingGame);


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
