let board = [];
let score = 0;
let best = 0;
const size = 4;

function init() {
    board = Array(size).fill().map(() => Array(size).fill(0));
    score = 0;
    updateScore();
    addRandomTile();
    addRandomTile();
    render();
}

function newGame() {
    document.getElementById('gameOver').classList.remove('show');
    init();
}

function addRandomTile() {
    let empty = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) empty.push({r, c});
        }
    }
    if (empty.length > 0) {
        let {r, c} = empty[Math.floor(Math.random() * empty.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function render() {
    const grid = document.getElementById('grid');
    const tiles = grid.querySelectorAll('.tile');
    tiles.forEach(tile => tile.remove());

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${board[r][c]}`;
                if (board[r][c] > 2048) tile.className = 'tile tile-super';
                tile.textContent = board[r][c];
                tile.style.left = `${c * 100 + 10}px`;
                tile.style.top = `${r * 100 + 10}px`;
                grid.appendChild(tile);
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > best) {
        best = score;
        document.getElementById('best').textContent = best;
    }
}

function move(direction) {
    let moved = false;
    let newBoard = board.map(row => [...row]);

    if (direction === 'left' || direction === 'right') {
        for (let r = 0; r < size; r++) {
            let row = newBoard[r].filter(val => val !== 0);
            if (direction === 'right') row.reverse();
            
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i + 1, 1);
                }
            }
            
            while (row.length < size) row.push(0);
            if (direction === 'right') row.reverse();
            
            if (JSON.stringify(newBoard[r]) !== JSON.stringify(row)) moved = true;
            newBoard[r] = row;
        }
    } else {
        for (let c = 0; c < size; c++) {
            let col = [];
            for (let r = 0; r < size; r++) {
                if (newBoard[r][c] !== 0) col.push(newBoard[r][c]);
            }
            if (direction === 'down') col.reverse();
            
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    col.splice(i + 1, 1);
                }
            }
            
            while (col.length < size) col.push(0);
            if (direction === 'down') col.reverse();
            
            for (let r = 0; r < size; r++) {
                if (newBoard[r][c] !== col[r]) moved = true;
                newBoard[r][c] = col[r];
            }
        }
    }

    if (moved) {
        board = newBoard;
        addRandomTile();
        updateScore();
        render();
        
        if (checkGameOver()) {
            setTimeout(() => {
                document.getElementById('gameOver').classList.add('show');
            }, 300);
        }
    }
}

function checkGameOver() {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) return false;
            if (c < size - 1 && board[r][c] === board[r][c + 1]) return false;
            if (r < size - 1 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    return true;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move('left');
    else if (e.key === 'ArrowRight') move('right');
    else if (e.key === 'ArrowUp') move('up');
    else if (e.key === 'ArrowDown') move('down');
});

init();