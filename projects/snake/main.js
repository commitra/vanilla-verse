import { ScoreManager } from "./score.js";

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 20;
let gameMode = "normal";

// ------------------ INITIALIZE SNAKES ------------------ //
let snakeA = [{ x: 3, y: 3 }];
let dirA = { x: 1, y: 0 };

let snakeB = [{ x: 12, y: 12 }];
let dirB = { x: -1, y: 0 };

let food = spawnFood();
let timer;
let gameRunning = false;
let gamePaused = false;

// ------------------ GAME LOGIC ------------------ //

function reset() {
    snakeA = [{ x: 3, y: 3 }];
    snakeB = [{ x: 12, y: 12 }];
    dirA = { x: 1, y: 0 };
    dirB = { x: -1, y: 0 };
    food = spawnFood();
    ScoreManager.reset();
    gameRunning = true;
    gamePaused = false;
    updateButtonText();
      gameMode = document.getElementById("mode").value;
    draw();
}

function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / size)),
        y: Math.floor(Math.random() * (canvas.height / size))
    };
}

function tick() {
    if (!gameRunning || gamePaused) return;

    if(!moveSnake(snakeA, dirA, "A")) return;
    if(!moveSnake(snakeB, dirB, "B")) return;

    if (checkCollision(snakeA) || checkCollision(snakeB) || checkSnakeCollision(snakeA, snakeB)) {
        let { scoreA, scoreB } = ScoreManager.getScores();
        let winner = scoreA > scoreB ? "Player A" : scoreB > scoreA ? "Player B" : "Draw";
        gameOver(winner);
        return;
    }

    draw();
}

function moveSnake(snake, dir, player) {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // head.x = (head.x + canvas.width / size) % (canvas.width / size);
    // head.y = (head.y + canvas.height / size) % (canvas.height / size);
    if (gameMode === "normal") {

  head.x = (head.x + canvas.width / size) % (canvas.width / size);
  head.y = (head.y + canvas.height / size) % (canvas.height / size);
} else {

  if (
    head.x < 0 ||
    head.x >= canvas.width / size ||
    head.y < 0 ||
    head.y >= canvas.height / size
  ) {
    const winner = player === "A" ? "Player B" : "Player A";
     stop();                 
    gameRunning = false;    
    gamePaused = false;     
    updateButtonText();  
    gameOver(winner);
    return false;
  }
}


    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        food = spawnFood();
        ScoreManager.addScore(player);
    } else {
        snake.pop();
    }

    return true;
}

function checkCollision(snake) {
    const [head, ...body] = snake;
    return body.some(seg => seg.x === head.x && seg.y === head.y);
}

function checkSnakeCollision(snakeA, snakeB) {
    const headA = snakeA[0], headB = snakeB[0];
    const aHitsB = snakeB.some(seg => seg.x === headA.x && seg.y === headA.y);
    const bHitsA = snakeA.some(seg => seg.x === headB.x && seg.y === headB.y);
    const headOn = headA.x === headB.x && headA.y === headB.y;
    return aHitsB || bHitsA || headOn;
}

// ------------------ DRAWING ------------------ //

function draw() {
    if (!snakeA || !snakeB) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player A snake
    ctx.fillStyle = '#ffff00';
    snakeA.forEach(seg => ctx.fillRect(seg.x * size, seg.y * size, size - 2, size - 2));

    // Player B snake
    ctx.fillStyle = '#00ff00';
    snakeB.forEach(seg => ctx.fillRect(seg.x * size, seg.y * size, size - 2, size - 2));

    // Food
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2);

    // Grid
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    if (gameMode === "boundary") {
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}


    // Pause overlay
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// ------------------ GAME CONTROLS ------------------ //

function startGame() {
    reset();
    const speed = Number(document.getElementById('speed').value);
    timer = setInterval(tick, 300 - speed * 20);
}

function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    updateButtonText();
    if (!gamePaused) {
        const speed = Number(document.getElementById('speed').value);
        clearInterval(timer);
        timer = setInterval(tick, 300 - speed * 20);
    }
}

function stop() { clearInterval(timer); }

function handleButtonClick() {
    if (!gameRunning) startGame();
    else togglePause();
}

function updateButtonText() {
    const startBtn = document.getElementById('startBtn');
    startBtn.textContent = !gameRunning ? 'Start' : gamePaused ? 'Resume' : 'Pause';
}

// ------------------ INPUT ------------------ //

document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (key === ' ' || key === 'p') {
        if (gameRunning) togglePause();
        e.preventDefault();
        return;
    }

    if (gameRunning && !gamePaused) {
        // Player A - arrows
        if (key === 'ArrowUp' && dirA.y !== 1) dirA = { x: 0, y: -1 };
        else if (key === 'ArrowDown' && dirA.y !== -1) dirA = { x: 0, y: 1 };
        else if (key === 'ArrowLeft' && dirA.x !== 1) dirA = { x: -1, y: 0 };
        else if (key === 'ArrowRight' && dirA.x !== -1) dirA = { x: 1, y: 0 };

        // Player B - WASD
        else if (key === 'w' && dirB.y !== 1) dirB = { x: 0, y: -1 };
        else if (key === 's' && dirB.y !== -1) dirB = { x: 0, y: 1 };
        else if (key === 'a' && dirB.x !== 1) dirB = { x: -1, y: 0 };
        else if (key === 'd' && dirB.x !== -1) dirB = { x: 1, y: 0 };
    }
});

// ------------------ EVENT LISTENERS ------------------ //
document.getElementById("mode").addEventListener("change", function () {
  gameMode = this.value;
});
document.getElementById('startBtn').addEventListener('click', handleButtonClick);
document.getElementById('speed').addEventListener('input', function () {
    if (gameRunning && !gamePaused) {
        stop();
        timer = setInterval(tick, 300 - Number(this.value) * 20);
    }
});

// ------------------ GAME OVER ------------------ //

function gameOver(winner) {
    stop();
    gameRunning = false;
    gamePaused = false;
    updateButtonText();

    const { scoreA, scoreB } = ScoreManager.getScores();
    const finalScore = Math.max(scoreA, scoreB);

    if (winner !== "Draw") {
        ScoreManager.gameOver(winner, finalScore);
    }

    draw(); // redraw final state on canvas

    // Optional: show message on canvas
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#ffff00';
    ctx.font = '16px Arial';
    ctx.fillText(`Winner: ${winner}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`A: ${scoreA} • B: ${scoreB}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`Highest Score: ${ScoreManager.getScores().bestPlayer} (${ScoreManager.getScores().bestScore})`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 80);
}

// ------------------ INIT ------------------ //

window.addEventListener('load', () => {
    draw(); // safe because snakes are now initialized
});
