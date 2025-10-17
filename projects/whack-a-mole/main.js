const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('start');
const difficultyEl = document.getElementById('difficulty');

let score = 0, hole = -1, timer, roundTime, moleTimer, timeLeft;

// sound effects
const popSound = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
const hitSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');

// difficulty speeds
const speeds = {
  easy: 1000,
  medium: 700,
  hard: 400
};

function render() {
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.className = 'hole' + (i === hole ? ' up' : '');
    b.setAttribute('aria-label', i === hole ? 'Mole! Hit it!' : 'Empty hole');
    b.addEventListener('click', () => hit(i));
    grid.appendChild(b);
  }
}

function randomHole() {
  hole = Math.floor(Math.random() * 9);
  render();
  popSound.currentTime = 0;
  popSound.play();
}

function hit(i) {
  if (i === hole) {
    score++;
    scoreEl.textContent = `Score: ${score}`;
    hitSound.currentTime = 0;
    hitSound.play();
    hole = -1;
    render();
  }
}

function startGame() {
  clearInterval(timer);
  clearInterval(moleTimer);
  score = 0;
  hole = -1;
  timeLeft = 30;
  scoreEl.textContent = 'Score: 0';
  timerEl.textContent = `${timeLeft}s`;
  render();

  const difficulty = difficultyEl.value;
  const moleSpeed = speeds[difficulty];

  moleTimer = setInterval(randomHole, moleSpeed);
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(timer);
  clearInterval(moleTimer);
  hole = -1;
  render();
  alert(`⏱ Time’s up!\nYour score: ${score}`);
}

startBtn.addEventListener('click', startGame);

// keyboard accessibility
document.addEventListener('keydown', (e) => {
  if (e.key >= 1 && e.key <= 9) hit(Number(e.key) - 1);
});

render();
