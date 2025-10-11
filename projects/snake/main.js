const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 20;
let snake, dir, food, timer, score, bestScore;
let gameRunning = false;
let gamePaused = false;

// Initialize best score
bestScore = Number(localStorage.getItem('snakeBestScore')) || 0;

function reset() {
    snake = [{ x: 5, y: 5 }];
    dir = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;
    gameRunning = true;
    gamePaused = false;
    updateScoreboard();
    updateButtonText();
    draw();
}

function spawnFood() {
    return { 
        x: Math.floor(Math.random() * (canvas.width / size)), 
        y: Math.floor(Math.random() * (canvas.height / size)) 
    };
}

function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
        scoreboard.textContent = `Score: ${score} • Best: ${bestScore}`;
    }
}

function updateButtonText() {
    const startBtn = document.getElementById('startBtn');
    if (!gameRunning) {
        startBtn.textContent = 'Start';
    } else if (gamePaused) {
        startBtn.textContent = 'Resume';
    } else {
        startBtn.textContent = 'Pause';
    }
}

function gameOver() {
    stop();
    gameRunning = false;
    gamePaused = false;
    updateButtonText();
    
    // Show game over message on canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Best Score: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 60);
}

function tick() {
    if (!gameRunning || gamePaused) return;
    
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    
    // Wrap around edges
    head.x = (head.x + canvas.width / size) % (canvas.width / size);
    head.y = (head.y + canvas.height / size) % (canvas.height / size);

    // Collision detection - game ends if snake hits itself
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        food = spawnFood();
        score += 10;
        
        // Update best score
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snakeBestScore', bestScore);
        }
        updateScoreboard();
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    ctx.fillStyle = '#ffff00';
    for (const segment of snake) {
        ctx.fillRect(segment.x * size, segment.y * size, size - 2, size - 2);
    }
    
    // Draw food
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * size, food.y * size, size - 2, size - 2);
    
    // Draw grid
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Show pause message if game is paused
    if (gamePaused && gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('Click Resume to continue', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function startGame() {
    reset();
    const speed = Number(document.getElementById('speed').value);
    const ms = 300 - speed * 20;
    timer = setInterval(tick, ms);
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    updateButtonText();
    draw(); // Redraw to show/hide pause message
    
    if (!gamePaused) {
        // If resuming, make sure timer is running
        const speed = Number(document.getElementById('speed').value);
        const ms = 300 - speed * 20;
        clearInterval(timer);
        timer = setInterval(tick, ms);
    }
}

function stop() { 
    clearInterval(timer); 
}

function handleButtonClick() {
    if (!gameRunning) {
        // Start new game
        startGame();
    } else {
        // Toggle pause/resume
        togglePause();
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    if (key === ' ' || key === 'p') {
        // Space or P to pause/resume (only if game is running)
        if (gameRunning) {
            togglePause();
        }
        e.preventDefault(); // Prevent spacebar from scrolling page
    } else if (gameRunning && !gamePaused) {
        // Arrow keys only work when game is running and not paused
        if (key === 'ArrowUp' && dir.y !== 1) dir = { x: 0, y: -1 };
        else if (key === 'ArrowDown' && dir.y !== -1) dir = { x: 0, y: 1 };
        else if (key === 'ArrowLeft' && dir.x !== 1) dir = { x: -1, y: 0 };
        else if (key === 'ArrowRight' && dir.x !== -1) dir = { x: 1, y: 0 };
    }
});

document.getElementById('startBtn').addEventListener('click', handleButtonClick);

// Speed control
document.getElementById('speed').addEventListener('input', function() {
    if (gameRunning && !gamePaused) {
        // Restart timer with new speed only if game is running and not paused
        stop();
        const speed = Number(this.value);
        const ms = 300 - speed * 20;
        timer = setInterval(tick, ms);
    }
});

// Initialize game on load (but don't start automatically)
window.addEventListener('load', function() {
    updateScoreboard();
    updateButtonText();
    // Draw initial state but don't start game
    snake = [{ x: 5, y: 5 }];
    dir = { x: 1, y: 0 };
    food = spawnFood();
    draw();
});