// Tiny memory game scaffold
const grid = document.getElementById('grid');
const emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍'];
let deck = shuffle([...emojis, ...emojis]).map((v, i) => ({ id: i, v, flipped: false, matched: false }));
let first = null, second = null, lock = false;

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

function render() {
    grid.innerHTML = '';
    for (const c of deck) {
        const btn = document.createElement('button');
        btn.className = 'card' + (c.flipped || c.matched ? ' flipped' : '');
        btn.textContent = (c.flipped || c.matched) ? c.v : '?';
        btn.disabled = c.matched || lock;
        btn.addEventListener('click', () => flip(c));
        grid.appendChild(btn);
    }
}

function flip(c) {
    if (lock || c.matched || c.flipped) return;
    c.flipped = true; render();
    if (!first) { first = c; return; }
    second = c; lock = true;
    setTimeout(() => {
        if (first.v === second.v) { first.matched = second.matched = true; }
        first.flipped = second.flipped = false; first = second = null; lock = false; render();
    }, 600);
}

render();

// TODOs:
// - Add timer and move counter; show best time (localStorage)
// - Add themes (emoji sets) and grid sizes
// - Add sound effects on match/mismatch
// - Add accessibility labels and focus styles
