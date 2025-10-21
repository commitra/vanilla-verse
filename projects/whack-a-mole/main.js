const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('start');
const difficultyEl = document.getElementById('difficulty');

let score = 0, hole = -1, timer, roundTime, moleTimer, timeLeft;
let lives = 3, powerUpActive = null, powerUpEndTime = 0, frozenTime = 0;
let powerUpHole = -1, obstacleHole = -1, currentPowerUp = null, currentObstacle = null;
let powerUpSpawnTimer, obstacleSpawnTimer;

// sound effects
const popSound = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
const hitSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const powerUpSound = new Audio('https://actions.google.com/sounds/v1/cartoon/magic_chime_2.ogg');
const bombSound = new Audio('https://actions.google.com/sounds/v1/cartoon/explosion_8.ogg');

// power-up and obstacle types
const POWER_UPS = {
  DOUBLE_POINTS: { icon: '⚡', name: 'Double Points', color: '#fbbf24', duration: 5000 },
  FREEZE_TIME: { icon: '🕒', name: 'Freeze Time', color: '#3b82f6', duration: 3000 },
  EXTRA_LIFE: { icon: '💖', name: 'Extra Life', color: '#ef4444', duration: 0 }
};

const OBSTACLES = {
  BOMB: { icon: '💣', name: 'Bomb', color: '#dc2626', penalty: { points: 50, time: 5 } }
};

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
    let className = 'hole';
    let ariaLabel = 'Empty hole';
    
    if (i === hole) {
      className += ' up';
      ariaLabel = 'Mole! Hit it!';
    } else if (i === powerUpHole) {
      className += ' power-up';
      ariaLabel = `${currentPowerUp.name}! Click to collect!`;
    } else if (i === obstacleHole) {
      className += ' obstacle';
      ariaLabel = `${currentObstacle.name}! Avoid it!`;
    }
    
    b.className = className;
    b.setAttribute('aria-label', ariaLabel);
    b.addEventListener('click', () => hit(i));
    
    // Add content for power-ups and obstacles
    if (i === powerUpHole) {
      b.textContent = currentPowerUp.icon;
      b.style.backgroundColor = currentPowerUp.color;
    } else if (i === obstacleHole) {
      b.textContent = currentObstacle.icon;
      b.style.backgroundColor = currentObstacle.color;
    }
    
    grid.appendChild(b);
  }
}

function randomHole() {
  hole = Math.floor(Math.random() * 9);
  render();
  popSound.currentTime = 0;
  popSound.play();
}

function spawnPowerUp() {
  if (Math.random() < 0.15) { // 15% chance to spawn power-up
    const powerUpTypes = Object.keys(POWER_UPS);
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    currentPowerUp = POWER_UPS[randomType];
    
    // Find empty hole
    do {
      powerUpHole = Math.floor(Math.random() * 9);
    } while (powerUpHole === hole || powerUpHole === obstacleHole);
    
    render();
    powerUpSound.currentTime = 0;
    powerUpSound.play();
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (powerUpHole !== -1) {
        powerUpHole = -1;
        currentPowerUp = null;
        render();
      }
    }, 3000);
  }
}

function spawnObstacle() {
  if (Math.random() < 0.1) { // 10% chance to spawn obstacle
    currentObstacle = OBSTACLES.BOMB;
    
    // Find empty hole
    do {
      obstacleHole = Math.floor(Math.random() * 9);
    } while (obstacleHole === hole || obstacleHole === powerUpHole);
    
    render();
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      if (obstacleHole !== -1) {
        obstacleHole = -1;
        currentObstacle = null;
        render();
      }
    }, 2000);
  }
}

function hit(i) {
  if (i === hole) {
    // Calculate score with power-up multiplier
    let points = 1;
    if (powerUpActive === 'DOUBLE_POINTS' && Date.now() < powerUpEndTime) {
      points = 2;
    }
    
    score += points;
    scoreEl.textContent = `Score: ${score}`;
    hitSound.currentTime = 0;
    hitSound.play();
    hole = -1;
    render();
  } else if (i === powerUpHole) {
    // Collect power-up
    activatePowerUp(currentPowerUp);
    powerUpHole = -1;
    currentPowerUp = null;
    render();
  } else if (i === obstacleHole) {
    // Hit obstacle - apply penalty
    applyObstaclePenalty(currentObstacle);
    obstacleHole = -1;
    currentObstacle = null;
    render();
  }
}

function activatePowerUp(powerUp) {
  powerUpSound.currentTime = 0;
  powerUpSound.play();
  
  if (powerUp.name === 'Double Points') {
    powerUpActive = 'DOUBLE_POINTS';
    powerUpEndTime = Date.now() + powerUp.duration;
    showNotification('⚡ Double Points Active!');
    
    setTimeout(() => {
      powerUpActive = null;
      showNotification('⚡ Double Points Ended');
    }, powerUp.duration);
  } else if (powerUp.name === 'Freeze Time') {
    frozenTime = powerUp.duration;
    showNotification('🕒 Time Frozen!');
    
    setTimeout(() => {
      frozenTime = 0;
      showNotification('🕒 Time Unfrozen');
    }, powerUp.duration);
  } else if (powerUp.name === 'Extra Life') {
    lives++;
    livesEl.textContent = `Lives: ${lives}`;
    showNotification('💖 Extra Life Gained!');
  }
}

function applyObstaclePenalty(obstacle) {
  bombSound.currentTime = 0;
  bombSound.play();
  
  if (obstacle.name === 'Bomb') {
    score = Math.max(0, score - obstacle.penalty.points);
    timeLeft = Math.max(0, timeLeft - obstacle.penalty.time);
    scoreEl.textContent = `Score: ${score}`;
    timerEl.textContent = `${timeLeft}s`;
    showNotification('💣 Bomb Hit! -50 points, -5 seconds');
  }
}

function showNotification(message) {
  // Create temporary notification
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #f9fafb;
    padding: 10px 20px;
    border-radius: 8px;
    border: 2px solid #374151;
    z-index: 1000;
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function startGame() {
  clearInterval(timer);
  clearInterval(moleTimer);
  clearInterval(powerUpSpawnTimer);
  clearInterval(obstacleSpawnTimer);
  
  score = 0;
  hole = -1;
  timeLeft = 30;
  lives = 3;
  powerUpActive = null;
  powerUpEndTime = 0;
  frozenTime = 0;
  powerUpHole = -1;
  obstacleHole = -1;
  currentPowerUp = null;
  currentObstacle = null;
  
  scoreEl.textContent = 'Score: 0';
  timerEl.textContent = `${timeLeft}s`;
  livesEl.textContent = `Lives: ${lives}`;
  render();

  const difficulty = difficultyEl.value;
  const moleSpeed = speeds[difficulty];

  moleTimer = setInterval(randomHole, moleSpeed);
  
  // Spawn power-ups and obstacles at random intervals
  powerUpSpawnTimer = setInterval(spawnPowerUp, 2000 + Math.random() * 3000); // Every 2-5 seconds
  obstacleSpawnTimer = setInterval(spawnObstacle, 3000 + Math.random() * 4000); // Every 3-7 seconds
  
  timer = setInterval(() => {
    if (frozenTime <= 0) {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) endGame();
    } else {
      frozenTime -= 1000; // Reduce frozen time
    }
  }, 1000);
}

function endGame() {
  clearInterval(timer);
  clearInterval(moleTimer);
  clearInterval(powerUpSpawnTimer);
  clearInterval(obstacleSpawnTimer);
  
  hole = -1;
  powerUpHole = -1;
  obstacleHole = -1;
  currentPowerUp = null;
  currentObstacle = null;
  powerUpActive = null;
  frozenTime = 0;
  render();
  alert(`⏱ Time's up!\nYour score: ${score}`);
}

startBtn.addEventListener('click', startGame);

// keyboard accessibility
document.addEventListener('keydown', (e) => {
  if (e.key >= 1 && e.key <= 9) hit(Number(e.key) - 1);
});

render();

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

