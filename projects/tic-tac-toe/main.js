const boardEl = document.getElementById('board');
let b = Array(9).fill(null), turn = 'X';
function render() {
    boardEl.innerHTML = '';
    b.forEach((v, i) => {
        const btn = document.createElement('button');
        btn.className = 'cell';
        btn.textContent = v || '';
        btn.addEventListener('click', () => move(i));
        boardEl.appendChild(btn);
    });
}
function move(i) { if (b[i]) return; b[i] = turn; turn = turn === 'X' ? 'O' : 'X'; render(); }
render();
// TODOs: detect wins/draws; score; restart; 2P; simple AI; themes
