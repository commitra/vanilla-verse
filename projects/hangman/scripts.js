const themeToggle = document.querySelector(".theme-toggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
});

const setupScreen = document.querySelector(".setup-screen");
const gameScreen = document.querySelector(".game-screen");
const endScreen = document.querySelector(".end-screen");

const secretWordInput = document.getElementById("secretWord");
const wordError = document.getElementById("wordError");
const startGameBtn = document.getElementById("startGame");
const playAgainBtn = document.getElementById("playAgain");

const triesLeftEl = document.getElementById("triesLeft");
const wrongGuessesEl = document.getElementById("wrongGuesses");
const wordDisplayEl = document.getElementById("wordDisplay");
const keyboardEl = document.getElementById("keyboard");
const endMessageEl = document.getElementById("endMessage");

const hangmanParts = [
  "head",
  "body",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

let secretWord = "";
let guessedLetters = [];
let wrongGuesses = 0;
const maxWrongGuesses = 6;

function initGame() {
  const word = secretWordInput.value.trim().toUpperCase();

  if (!word || !/^[A-Z]{2,20}$/i.test(word)) {
    wordError.classList.add("show");
    return;
  }

  wordError.classList.remove("show");
  secretWord = word;
  guessedLetters = [];
  wrongGuesses = 0;

  setupScreen.classList.remove("active");
  gameScreen.classList.add("active");

  createWordDisplay();
  createKeyboard();
  updateGameInfo();
  resetHangman();
}

function createWordDisplay() {
  wordDisplayEl.innerHTML = "";
  for (let i = 0; i < secretWord.length; i++) {
    const slot = document.createElement("div");
    slot.className = "letter-slot";
    slot.id = `slot-${i}`;
    wordDisplayEl.appendChild(slot);
  }
}

function createKeyboard() {
  keyboardEl.innerHTML = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let letter of alphabet) {
    const key = document.createElement("button");
    key.className = "key";
    key.textContent = letter;
    key.dataset.letter = letter;
    key.addEventListener("click", handleGuess);
    keyboardEl.appendChild(key);
  }
}

function handleGuess(e) {
  const letter = e.target.dataset.letter;
  const key = e.target;

  if (key.classList.contains("disabled")) return;

  key.classList.add("disabled");
  guessedLetters.push(letter);

  if (secretWord.includes(letter)) {
    key.classList.add("correct");
    revealLetters(letter);

    if (checkWin()) {
      endGame(true);
    }
  } else {
    key.classList.add("wrong");
    wrongGuesses++;
    updateGameInfo();
    showHangmanPart(wrongGuesses - 1);

    if (wrongGuesses >= maxWrongGuesses) {
      endGame(false);
    }
  }
}

function revealLetters(letter) {
  for (let i = 0; i < secretWord.length; i++) {
    if (secretWord[i] === letter) {
      const slot = document.getElementById(`slot-${i}`);
      slot.textContent = letter;
      slot.classList.add("revealed");
    }
  }
}

function checkWin() {
  for (let i = 0; i < secretWord.length; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot.textContent) return false;
  }
  return true;
}

function updateGameInfo() {
  triesLeftEl.textContent = maxWrongGuesses - wrongGuesses;
  wrongGuessesEl.textContent = wrongGuesses;
}

function showHangmanPart(index) {
  if (index < hangmanParts.length) {
    const part = document.getElementById(hangmanParts[index]);
    part.style.opacity = "1";
    part.style.transition = "opacity 0.3s ease";
  }
}

function resetHangman() {
  hangmanParts.forEach((partId) => {
    const part = document.getElementById(partId);
    part.style.opacity = "0";
  });
}

function endGame(won) {
  gameScreen.classList.remove("active");
  endScreen.classList.add("active");

  const messageTitle = endMessageEl.querySelector("h2");
  const messageText = endMessageEl.querySelector("p");
  const revealWord = document.getElementById("revealWord");

  if (won) {
    endMessageEl.className = "end-message win";
    messageTitle.textContent = "🎉 You Win!";
    messageText.textContent = "Congratulations! You guessed the word:";
  } else {
    endMessageEl.className = "end-message lose";
    messageTitle.textContent = "💀 Game Over!";
    messageText.textContent = "You ran out of tries. The word was:";
  }

  revealWord.textContent = secretWord;
}

function resetGame() {
  secretWordInput.value = "";
  endScreen.classList.remove("active");
  setupScreen.classList.add("active");
}

startGameBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", resetGame);

secretWordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    initGame();
  }
});

secretWordInput.addEventListener("input", () => {
  wordError.classList.remove("show");
});
