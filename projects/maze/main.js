const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

// UI Elements
const algorithmSelect = document.getElementById('algorithm');
const mazeSizeSlider = document.getElementById('mazeSize');
const mazeSizeValue = document.getElementById('mazeSizeValue');
const speedSlider = document.getElementById('speed');
const generateBtn = document.getElementById('generateBtn');
const solveBtn = document.getElementById('solveBtn');
const clearBtn = document.getElementById('clearPath');
const drawToggle = document.getElementById('drawToggle');
const status = document.getElementById('status');

// Metrics
const nodesVisitedEl = document.getElementById('nodes-visited');
const pathLengthEl = document.getElementById('path-length');
const timeTakenEl = document.getElementById('time-taken');

// State
let size = 20;
let cellSize = canvas.width / size;
let grid = [];
let animationFrameId;

// Drawing state
let drawMode = false;
let isDrawing = false;
let pathCells = [];

function setStatus(text) { status.textContent = text; }

// --- Maze Generation (Recursive Backtracker) ---
function createGrid() {
    grid = [];
    for (let y = 0; y < size; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            row.push({ x, y, walls: { top: true, right: true, bottom: true, left: true }, visited: false });
        }
        grid.push(row);
    }
}

function generateMaze() {
    createGrid();
    let stack = [];
    let current = grid[0][0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
        current = stack.pop();
        let neighbors = getUnvisitedNeighbors(current.x, current.y);

        if (neighbors.length > 0) {
            stack.push(current);
            let neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWall(current, neighbor);
            neighbor.visited = true;
            stack.push(neighbor);
        }
    }
    // Reset visited for solver
    grid.forEach(row => row.forEach(cell => cell.visited = false));
    drawMaze();
}

function getUnvisitedNeighbors(x, y) {
    const neighbors = [];
    if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]); // Top
    if (x < size - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]); // Right
    if (y < size - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]); // Bottom
    if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]); // Left
    return neighbors;
}

function removeWall(a, b) {
    let x = a.x - b.x;
    if (x === 1) { a.walls.left = false; b.walls.right = false; }
    else if (x === -1) { a.walls.right = false; b.walls.left = false; }
    let y = a.y - b.y;
    if (y === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (y === -1) { a.walls.bottom = false; b.walls.top = false; }
}

// --- Pathfinding Algorithms ---
function solve() {
    if (drawMode) {
        setStatus('Disable draw mode to use automatic solver');
        return;
    }
    cancelAnimationFrame(animationFrameId);
    clearPath();
    const startTime = performance.now();
    const algorithm = algorithmSelect.value === 'bfs' ? bfs : astar;
    const { visitedOrder, path } = algorithm();
    const endTime = performance.now();

    timeTakenEl.textContent = `${Math.round(endTime - startTime)}ms`;
    animateSolution(visitedOrder, path);
}

function bfs() {
    const start = grid[0][0];
    const end = grid[size - 1][size - 1];
    let queue = [start];
    start.visited = true;
    let visitedOrder = [start];
    let parentMap = new Map();

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === end) break;
        
        getValidNeighbors(current).forEach(neighbor => {
            if (!neighbor.visited) {
                neighbor.visited = true;
                parentMap.set(neighbor, current);
                queue.push(neighbor);
                visitedOrder.push(neighbor);
            }
        });
    }
    return { visitedOrder, path: reconstructPath(parentMap, end) };
}

function astar() {
    const start = grid[0][0];
    const end = grid[size - 1][size - 1];
    let openSet = [start];
    start.g = 0;
    start.h = heuristic(start, end);
    start.f = start.h;
    
    let visitedOrder = [];
    let parentMap = new Map();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        
        visitedOrder.push(current);
        current.visited = true;

        if (current === end) break;

        getValidNeighbors(current).forEach(neighbor => {
            if (neighbor.visited) return;
            
            const tentativeG = current.g + 1;
            if (tentativeG < (neighbor.g || Infinity)) {
                parentMap.set(neighbor, current);
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        });
    }
    return { visitedOrder, path: reconstructPath(parentMap, end) };
}

function getValidNeighbors(cell) {
    const neighbors = [];
    const { x, y } = cell;
    if (!cell.walls.top && y > 0) neighbors.push(grid[y - 1][x]);
    if (!cell.walls.right && x < size - 1) neighbors.push(grid[y][x + 1]);
    if (!cell.walls.bottom && y < size - 1) neighbors.push(grid[y + 1][x]);
    if (!cell.walls.left && x > 0) neighbors.push(grid[y][x - 1]);
    return neighbors;
}

function heuristic(a, b) { // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(parentMap, end) {
    let path = [end];
    let current = end;
    while (parentMap.has(current)) {
        current = parentMap.get(current);
        path.unshift(current);
    }
    return path;
}

// --- Manual Drawing Functions ---
function toggleDrawMode(on) {
    drawMode = typeof on === 'boolean' ? on : !drawMode;
    drawToggle.setAttribute('aria-pressed', String(drawMode));
    drawToggle.classList.toggle('active', drawMode);
    setStatus(drawMode ? 'Draw mode: ON — draw a path' : 'Draw mode: OFF');
    if (drawMode) {
        clearPath();
    }
}

function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cx = Math.floor(px / cellSize);
    const cy = Math.floor(py / cellSize);
    if (cx < 0 || cy < 0 || cx >= size || cy >= size) return null;
    return grid[cy][cx];
}

function cellsAreNeighbors(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 1 && dy === 0) return ['right', 'left'];
    if (dx === -1 && dy === 0) return ['left', 'right'];
    if (dx === 0 && dy === 1) return ['bottom', 'top'];
    if (dx === 0 && dy === -1) return ['top', 'bottom'];
    return null;
}

function pointerDown(e) {
    if (!drawMode) return;
    isDrawing = true;
    canvas.setPointerCapture(e.pointerId);
    const cell = cellFromEvent(e);
    if (cell) {
        pathCells = [cell];
        render();
    }
}

function pointerMove(e) {
    if (!isDrawing) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    const last = pathCells[pathCells.length - 1];
    if (!last || (last.x === cell.x && last.y === cell.y)) return;
    
    // Check if move is valid (adjacent and no wall between)
    const neigh = cellsAreNeighbors(last, cell);
    if (!neigh) return; // not adjacent, skip
    const [fromSide, toSide] = neigh;
    if (last.walls[fromSide] || cell.walls[toSide]) {
        // Wall blocking, don't add this cell
        return;
    }
    
    pathCells.push(cell);
    render();
}

function pointerUp(e) {
    if (isDrawing) {
        isDrawing = false;
        tryValidatePath();
    }
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
}

function tryValidatePath() {
    if (!pathCells.length) { setStatus('No path drawn'); return; }
    const start = grid[0][0];
    const exit = grid[size - 1][size - 1];
    const first = pathCells[0];
    const last = pathCells[pathCells.length - 1];
    if (first.x !== start.x || first.y !== start.y) { setStatus('Path must start at the entrance'); return; }
    if (last.x !== exit.x || last.y !== exit.y) { setStatus('Path must end at the exit'); return; }

    // ensure each step moves to neighbor and there's no wall between
    for (let i = 0; i < pathCells.length - 1; i++) {
        const a = pathCells[i], b = pathCells[i + 1];
        const neigh = cellsAreNeighbors(a, b);
        if (!neigh) { setStatus('Invalid path: must travel between adjacent cells'); return; }
        const [fromSide, toSide] = neigh;
        if (a.walls[fromSide] || b.walls[toSide]) { setStatus('Invalid path: crosses a wall'); return; }
    }
    setStatus('Success! Path reaches the exit without crossing walls.');
}

function render() {
    drawMaze();
    // overlay path
    if (pathCells.length && drawMode) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(52,144,220,0.95)';
        ctx.shadowColor = 'rgba(52,144,220,0.7)';
        ctx.shadowBlur = 8;
        ctx.lineWidth = Math.max(4, cellSize * 0.45);
        ctx.beginPath();
        for (let i = 0; i < pathCells.length; i++) {
            const p = pathCells[i];
            const cx = p.x * cellSize + cellSize / 2;
            const cy = p.y * cellSize + cellSize / 2;
            if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
    }
}

// --- Drawing & Animation ---
function drawCell(cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x * cellSize + 1, cell.y * cellSize + 1, cellSize - 2, cellSize - 2);
}

function drawMaze() {
    ctx.fillStyle = '#17171c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let cell = grid[y][x];
            if (cell.walls.top) { ctx.beginPath(); ctx.moveTo(x * cellSize, y * cellSize); ctx.lineTo((x + 1) * cellSize, y * cellSize); ctx.stroke(); }
            if (cell.walls.right) { ctx.beginPath(); ctx.moveTo((x + 1) * cellSize, y * cellSize); ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize); ctx.stroke(); }
            if (cell.walls.bottom) { ctx.beginPath(); ctx.moveTo((x + 1) * cellSize, (y + 1) * cellSize); ctx.lineTo(x * cellSize, (y + 1) * cellSize); ctx.stroke(); }
            if (cell.walls.left) { ctx.beginPath(); ctx.moveTo(x * cellSize, (y + 1) * cellSize); ctx.lineTo(x * cellSize, y * cellSize); ctx.stroke(); }
        }
    }
    // Draw start and end points
    drawCell(grid[0][0], '#6ee7b7'); // Start
    drawCell(grid[size - 1][size - 1], '#f472b6'); // End
}

function animateSolution(visitedOrder, path) {
    let i = 0;
    const speed = 101 - speedSlider.value;

    function animate() {
        if (i < visitedOrder.length) {
            drawCell(visitedOrder[i], '#3b82f6'); // Visited color
            nodesVisitedEl.textContent = i + 1;
            i++;
            animationFrameId = setTimeout(animate, speed / 5);
        } else {
            drawPath(path);
        }
    }
    animate();
}

function drawPath(path) {
    let i = 0;
    function animate() {
        if (i < path.length) {
            drawCell(path[i], '#eab308'); // Path color
            pathLengthEl.textContent = i + 1;
            i++;
            animationFrameId = setTimeout(animate, 20);
        } else {
            // Redraw start and end over the path
            drawCell(grid[0][0], '#6ee7b7');
            drawCell(grid[size - 1][size - 1], '#f472b6');
        }
    }
    animate();
}

function clearPath() {
    cancelAnimationFrame(animationFrameId);
    pathCells = [];
    grid.forEach(row => row.forEach(cell => {
        cell.visited = false;
        delete cell.g;
        delete cell.h;
        delete cell.f;
    }));
    nodesVisitedEl.textContent = 0;
    pathLengthEl.textContent = 0;
    timeTakenEl.textContent = '0ms';
    setStatus(drawMode ? 'Draw mode: ON — path cleared' : 'Path cleared');
    drawMaze();
}

// --- Event Listeners ---
generateBtn.addEventListener('click', () => {
    cancelAnimationFrame(animationFrameId);
    generateMaze();
    clearPath();
});
solveBtn.addEventListener('click', solve);
clearBtn.addEventListener('click', clearPath);

drawToggle.addEventListener('click', () => toggleDrawMode());
drawToggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleDrawMode();
    }
});

canvas.addEventListener('pointerdown', pointerDown);
canvas.addEventListener('pointermove', pointerMove);
window.addEventListener('pointerup', pointerUp);

mazeSizeSlider.addEventListener('input', (e) => {
    size = parseInt(e.target.value);
    mazeSizeValue.textContent = `${size}x${size}`;
    cellSize = canvas.width / size;
    cancelAnimationFrame(animationFrameId);
    pathCells = [];
    generateMaze();
    clearPath();
});

// --- Initial Load ---
generateMaze();
setStatus('Ready');

// Expose for debugging
window._maze = { grid, render, clearPath, toggleDrawMode };