import { ScoreManager } from "./score.js";

// Minimal snake starter – designed for contributions.
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const size = 16; // grid size
let snake, dir, food, timer;

function reset() {
    snake = [{ x: 8, y: 8 }];
    dir = { x: 1, y: 0 };
    food = spawnFood();
    ScoreManager.reset(); // 🆕 reset score
}
function spawnFood() {
    return { x: Math.floor(Math.random() * (canvas.width / size)), y: Math.floor(Math.random() * (canvas.height / size)) };
}

function tick() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    // wrap
    head.x = (head.x + canvas.width / size) % (canvas.width / size);
    head.y = (head.y + canvas.height / size) % (canvas.height / size);

    // collision with body
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        stop();
        ScoreManager.gameOver(); // 🆕 update best score
        draw();
        return; // game over
    }


    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        food = spawnFood();
        ScoreManager.increment();
    } else {
        snake.pop();
    }
    draw();
}

function draw() {
    ctx.fillStyle = '#0b0b0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6ee7b7';
    for (const s of snake) ctx.fillRect(s.x * size, s.y * size, size - 1, size - 1);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(food.x * size, food.y * size, size - 1, size - 1);
}

function start() {
    stop();
    reset();
    const speed = Number(document.getElementById('speed').value);
    const ms = 300 - speed * 20; // faster when higher
    timer = setInterval(tick, ms);
    draw();
}

function stop() { clearInterval(timer); }

addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowUp' && dir.y !== 1) dir = { x: 0, y: -1 };
    if (k === 'ArrowDown' && dir.y !== -1) dir = { x: 0, y: 1 };
    if (k === 'ArrowLeft' && dir.x !== 1) dir = { x: -1, y: 0 };
    if (k === 'ArrowRight' && dir.x !== -1) dir = { x: 1, y: 0 };
});

document.getElementById('startBtn').addEventListener('click', start);

// TODOs for contributors:
// - Add scoring and display current/best score (localStorage).
// - Add levels and speed scaling.
// - Add obstacles or walls toggle.
// - Add mobile touch controls or on-screen D-pad.
// - Add pause/resume and game over screen with restart.
