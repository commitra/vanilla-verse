// Smooth 2048 with stable tile IDs (drop-in replacement)
let board = [];
let score = 0;
let best = 0;
const size = 4;
let nextId = 1; // unique id generator
const tilesMap = new Map(); // id -> DOM element

// ---------- init / new game ----------
function init() {
  board = Array(size).fill().map(() => Array(size).fill(null));
  score = 0;
  nextId = 1;
  tilesMap.clear();
  document.getElementById('grid').querySelectorAll('.tile').forEach(t => t.remove());
  updateScore();
  addRandomTile();
  addRandomTile();
  render(true);
}

function newGame() {
  document.getElementById('gameOver').classList.remove('show');
  init();
}

// ---------- helpers ----------
function makeCell(value) {
  return { v: value, id: nextId++ };
}

function addRandomTile() {
  const empty = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = makeCell(Math.random() < 0.9 ? 2 : 4);
}

// ---------- rendering ----------
function render(animated = true) {
    const grid = document.getElementById('grid');
    const gridRect = grid.getBoundingClientRect();
    const gap = 10; // same as CSS
    const cellSize = (gridRect.width - gap * (size - 1) - 20) / size; 
  
    const existingTiles = {};
    grid.querySelectorAll('.tile').forEach(tile => {
      existingTiles[String(tile.dataset.id)] = tile;
    });
    const newIds = new Set();
  
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = board[r][c];
        if (!cell) continue;
  
        const value = cell.v;
        const idStr = String(cell.id);
        newIds.add(idStr);
  
        let tile = existingTiles[idStr];
        if (!tile) {
          tile = document.createElement('div');
          tile.className = `tile tile-${value}`;
          tile.textContent = value;
          tile.dataset.id = idStr;
          grid.appendChild(tile);
  
          tile.style.transform = "scale(0)";
          requestAnimationFrame(() => {
            tile.style.transform = "scale(1)";
          });
        } else if (parseInt(tile.textContent, 10) !== value) {
          tile.textContent = value;
          tile.className = `tile tile-${value} merged`;
          tile.addEventListener('animationend', () => tile.classList.remove('merged'), { once: true });
        }
  
        // RESPONSIVE POSITIONING
        const left = c * (cellSize + gap) + 10; // +10 for grid padding
        const top = r * (cellSize + gap) + 10;
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.left = `${left}px`;
        tile.style.top = `${top}px`;
  
        if (animated) {
          tile.style.transition = "top 0.15s ease, left 0.15s ease, transform 0.15s, opacity 0.15s";
        } else {
          tile.style.transition = "none";
        }
  
        if (value > 2048) tile.classList.add("tile-super");
      }
    }
  
    for (const idStr in existingTiles) {
      if (!newIds.has(idStr)) {
        const tile = existingTiles[idStr];
        tile.style.transform = "scale(0)";
        tile.style.opacity = "0";
        tile.addEventListener("transitionend", () => tile.remove(), { once: true });
        setTimeout(() => { if (tile.parentNode) tile.remove(); }, 300);
      }
    }
  }
  



function findCellById(id) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (board[r][c] && board[r][c].id === id) return { r, c };
  return null;
}

// ---------- score ----------
function updateScore() {
  document.getElementById('score').textContent = score;
  if (score > best) {
    best = score;
    document.getElementById('best').textContent = best;
  }
}

// ---------- movement utilities ----------
// slide & merge a line of cell objects (keeps ids appropriately)
function slideAndMergeLine(line) {
  // line: array of cell objects or null, length = size
  const comps = line.filter(x => x !== null); // compacted left
  const merged = [];
  for (let i = 0; i < comps.length; i++) {
    if (i + 1 < comps.length && comps[i].v === comps[i + 1].v) {
      // merge into comps[i]; keep comps[i].id (so DOM element of first tile remains)
      comps[i].v *= 2;
      score += comps[i].v;
      // mark the second tile's id for removal by not carrying it forward
      // (we simply skip the next item)
      merged.push(comps[i].id); // for optional UI if needed
      comps.splice(i + 1, 1);
    }
  }
  while (comps.length < size) comps.push(null);
  return comps;
}

// ---------- moves ----------
function move(direction) {
  let moved = false;
  let newBoard = Array(size).fill().map(() => Array(size).fill(null));

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < size; r++) {
      const line = board[r].slice(); // row
      // map to objects or null already
      let working = line.slice();
      if (direction === 'right') working = working.reverse();
      const compact = working.filter(x => x !== null);
      // create shallow copies to avoid mutating original objects except value changes
      const mergedLine = slideAndMergeLine(compact.map(x => x ? { v: x.v, id: x.id } : null));
      // place back
      let final = mergedLine;
      if (direction === 'right') final = final.reverse();
      for (let c = 0; c < size; c++) {
        // if final[c] is an object keep its id and updated value; else null
        newBoard[r][c] = final[c] ? { v: final[c].v, id: final[c].id } : null;
      }
      if (!arraysRowEqual(board[r], newBoard[r])) moved = true;
    }
  } else { // up / down
    for (let c = 0; c < size; c++) {
      const col = [];
      for (let r = 0; r < size; r++) col.push(board[r][c]);
      let working = col.slice();
      if (direction === 'down') working = working.reverse();
      const compact = working.filter(x => x !== null);
      const mergedCol = slideAndMergeLine(compact.map(x => x ? { v: x.v, id: x.id } : null));
      let final = mergedCol;
      if (direction === 'down') final = final.reverse();
      for (let r = 0; r < size; r++) {
        newBoard[r][c] = final[r] ? { v: final[r].v, id: final[r].id } : null;
      }
      // compare original column with new column
      for (let r = 0; r < size; r++) {
        const a = board[r][c];
        const b = newBoard[r][c];
        if ((a === null && b !== null) || (a !== null && b === null) || (a && b && (a.v !== b.v || a.id !== b.id))) {
          moved = true;
          break;
        }
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

// helper to compare row arrays of cell objects/null by value+id
function arraysRowEqual(oldRow, newRow) {
  for (let i = 0; i < size; i++) {
    const a = oldRow[i], b = newRow[i];
    if (a === null && b === null) continue;
    if ((a === null) !== (b === null)) return false;
    if (a.v !== b.v || a.id !== b.id) return false;
  }
  return true;
}

// ---------- game over ----------
function checkGameOver() {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) return false;
      if (c < size - 1 && board[r][c].v === board[r][c + 1].v) return false;
      if (r < size - 1 && board[r][c].v === board[r + 1][c].v) return false;
    }
  }
  return true;
}

// ---------- keyboard ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') move('left');
  else if (e.key === 'ArrowRight') move('right');
  else if (e.key === 'ArrowUp') move('up');
  else if (e.key === 'ArrowDown') move('down');
});

// ---------- start ----------
init();
