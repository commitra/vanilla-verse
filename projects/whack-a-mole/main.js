const grid = document.getElementById('grid'); const scoreEl = document.getElementById('score'); let score = 0, hole = -1, timer;
function render() { grid.innerHTML = ''; for (let i = 0; i < 9; i++) { const b = document.createElement('button'); b.className = 'hole' + (i === hole ? ' up' : ''); b.addEventListener('click', () => hit(i)); grid.appendChild(b); } }
function hit(i) { if (i === hole) { score++; scoreEl.textContent = String(score); hole = -1; render(); } }
function start() { clearInterval(timer); score = 0; hole = -1; render(); timer = setInterval(() => { hole = Math.floor(Math.random() * 9); render(); }, 800); }
document.getElementById('start').addEventListener('click', start); render();
// TODOs: difficulty levels; timer/rounds; sound fx; accessibility labels
