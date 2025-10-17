document.addEventListener("DOMContentLoaded", () => {
    const boardEl = document.getElementById('board');
    const restartBtn = document.getElementById('restartBtn');
    const modeSelect = document.getElementById('modeSelect');
    const themeSelect = document.getElementById('themeSelect');
    const xScoreEl = document.getElementById('xScore');
    const oScoreEl = document.getElementById('oScore');
    const drawScoreEl = document.getElementById('drawScore');

    let b = Array(9).fill(null);
    let turn = 'X';
    let gameOver = false;
    let mode = '2P';
    let scores = { X: 0, O: 0, Draw: 0 };

    const winningCombos = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    function checkWin() {
        for (const combo of winningCombos) {
            const [a,bIndex,c] = combo;
            if (b[a] && b[a] === b[bIndex] && b[a] === b[c]) return b[a];
        }
        return null;
    }

    function checkDraw() {
        return b.every(cell => cell !== null);
    }

    function render() {
        boardEl.innerHTML = '';
        b.forEach((v,i) => {
            const btn = document.createElement('button');
            btn.className = 'cell';
            btn.textContent = v || '';
            btn.addEventListener('click', () => move(i));
            boardEl.appendChild(btn);
        });
    }

    function move(i) {
        if (b[i] || gameOver) return;

        b[i] = turn;
        const winner = checkWin();

        if (winner) {
            alert(`${winner} wins!`);
            scores[winner]++;
            gameOver = true;
        } else if (checkDraw()) {
            alert("It's a draw!");
            scores.Draw++;
            gameOver = true;
        } else {
            turn = turn === 'X' ? 'O' : 'X';
            if (mode === 'AI' && turn === 'O' && !gameOver) aiMove();
        }

        updateScoreboard();
        render();
    }

    // Smart AI
    function aiMove() {
        let moveIndex = findBestMove('O'); // Win if possible
        if (moveIndex === null) moveIndex = findBestMove('X'); // Block X
        if (moveIndex === null && b[4] === null) moveIndex = 4; // Take center
        if (moveIndex === null) {
            const corners = [0,2,6,8].filter(i => b[i] === null);
            if (corners.length) moveIndex = corners[Math.floor(Math.random()*corners.length)];
        }
        if (moveIndex === null) {
            const empty = b.map((v,i) => v===null? i:null).filter(v=>v!==null);
            moveIndex = empty[Math.floor(Math.random()*empty.length)];
        }
        move(moveIndex);
    }

    function findBestMove(player) {
        for (const combo of winningCombos) {
            const [a,bIndex,c] = combo;
            const line = [b[a], b[bIndex], b[c]];
            if (line.filter(v => v===player).length === 2 && line.includes(null)) {
                return combo[line.indexOf(null)];
            }
        }
        return null;
    }

    function updateScoreboard() {
        xScoreEl.textContent = scores.X;
        oScoreEl.textContent = scores.O;
        drawScoreEl.textContent = scores.Draw;
    }

    function restart() {
        b = Array(9).fill(null);
        turn = 'X';
        gameOver = false;
        render();
    }

    // Event listeners
    restartBtn.addEventListener('click', restart);
    modeSelect.addEventListener('change', e => { mode = e.target.value; restart(); });
    themeSelect.addEventListener('change', e => { document.body.className = e.target.value; });

    // Initial render
    render();
    updateScoreboard();
});
