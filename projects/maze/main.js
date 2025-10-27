const canvas = document.getElementById('maze');
const ctx = canvas.getContext('2d');

// Maze configuration
const cols = 16;
const rows = 16;
const cellSize = Math.floor(canvas.width / cols);

// grid: each cell has walls: top, right, bottom, left
class Cell {
	constructor(x, y) {
		this.x = x; this.y = y;
		this.walls = { top: true, right: true, bottom: true, left: true };
		this.visited = false;
	}
}

let grid = [];
for (let y = 0; y < rows; y++) {
	const row = [];
	for (let x = 0; x < cols; x++) row.push(new Cell(x, y));
	grid.push(row);
}

function index(x, y) {
	if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
	return grid[y][x];
}

// Recursive backtracker maze generator
function generateMaze() {
	const stack = [];
	const start = grid[0][0];
	start.visited = true;
	stack.push(start);

	while (stack.length) {
		const current = stack[stack.length - 1];
		const { x, y } = current;
		const neighbors = [];
		const dirs = [ [0,-1,'top','bottom'], [1,0,'right','left'], [0,1,'bottom','top'], [-1,0,'left','right'] ];
		for (const [dx,dy,wall,opp] of dirs) {
			const n = index(x+dx, y+dy);
			if (n && !n.visited) neighbors.push({cell:n,wall,opp});
		}
		if (neighbors.length) {
			const pick = neighbors[Math.floor(Math.random()*neighbors.length)];
			// remove wall between
			current.walls[pick.wall] = false;
			pick.cell.walls[pick.opp] = false;
			pick.cell.visited = true;
			stack.push(pick.cell);
		} else {
			stack.pop();
		}
	}
	// open entrance and exit
	grid[0][0].walls.left = false;
	grid[rows-1][cols-1].walls.right = false;
}

function drawMaze() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.fillStyle = '#17171c';
	ctx.fillRect(0,0,canvas.width,canvas.height);

	ctx.strokeStyle = '#9aa3b3';
	ctx.lineWidth = 2;
	for (let y=0;y<rows;y++){
		for (let x=0;x<cols;x++){
			const cell = grid[y][x];
			const sx = x * cellSize;
			const sy = y * cellSize;
			// draw walls
			if (cell.walls.top) {
				ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx+cellSize, sy); ctx.stroke();
			}
			if (cell.walls.right) {
				ctx.beginPath(); ctx.moveTo(sx+cellSize, sy); ctx.lineTo(sx+cellSize, sy+cellSize); ctx.stroke();
			}
			if (cell.walls.bottom) {
				ctx.beginPath(); ctx.moveTo(sx, sy+cellSize); ctx.lineTo(sx+cellSize, sy+cellSize); ctx.stroke();
			}
			if (cell.walls.left) {
				ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy+cellSize); ctx.stroke();
			}
		}
	}

	// mark entrance and exit
	ctx.fillStyle = '#6ee7b7';
	ctx.fillRect(1,1,cellSize-2,cellSize-2);
	ctx.fillStyle = '#f87171';
	ctx.fillRect((cols-1)*cellSize+1,(rows-1)*cellSize+1,cellSize-2,cellSize-2);
}

// Drawing state
let drawMode = false;
let isDrawing = false;
let pathCells = [];

const drawToggle = document.getElementById('drawToggle');
const clearBtn = document.getElementById('clearPath');
const status = document.getElementById('status');

function setStatus(text) { status.textContent = text; }

function toggleDrawMode(on) {
	drawMode = typeof on === 'boolean' ? on : !drawMode;
	drawToggle.setAttribute('aria-pressed', String(drawMode));
	drawToggle.classList.toggle('active', drawMode);
	setStatus(drawMode ? 'Draw mode: ON — draw a path' : 'Draw mode: OFF');
}

function clearPath() {
	pathCells = [];
	setStatus(drawMode ? 'Draw mode: ON — draw cleared' : 'Path cleared');
	render();
}

function cellFromEvent(e) {
	const rect = canvas.getBoundingClientRect();
	const px = (e.clientX - rect.left) * (canvas.width / rect.width);
	const py = (e.clientY - rect.top) * (canvas.height / rect.height);
	const cx = Math.floor(px / cellSize);
	const cy = Math.floor(py / cellSize);
	if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return null;
	return grid[cy][cx];
}

function cellsAreNeighbors(a,b) {
	const dx = b.x - a.x, dy = b.y - a.y;
	if (dx === 1 && dy === 0) return ['right','left'];
	if (dx === -1 && dy === 0) return ['left','right'];
	if (dx === 0 && dy === 1) return ['bottom','top'];
	if (dx === 0 && dy === -1) return ['top','bottom'];
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
    const last = pathCells[pathCells.length-1];
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
}function pointerUp(e) {
	if (isDrawing) {
		isDrawing = false;
		tryValidatePath();
	}
	try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
}

function tryValidatePath() {
	if (!pathCells.length) { setStatus('No path drawn'); return; }
	const start = grid[0][0];
	const exit = grid[rows-1][cols-1];
	const first = pathCells[0];
	const last = pathCells[pathCells.length-1];
	if (first.x !== start.x || first.y !== start.y) { setStatus('Path must start at the entrance'); return; }
	if (last.x !== exit.x || last.y !== exit.y) { setStatus('Path must end at the exit'); return; }

	// ensure each step moves to neighbor and there's no wall between
	for (let i=0;i<pathCells.length-1;i++){
		const a = pathCells[i], b = pathCells[i+1];
		const neigh = cellsAreNeighbors(a,b);
		if (!neigh) { setStatus('Invalid path: must travel between adjacent cells'); return; }
		const [fromSide, toSide] = neigh;
		if (a.walls[fromSide] || b.walls[toSide]) { setStatus('Invalid path: crosses a wall'); return; }
	}
	setStatus('Success! Path reaches the exit without crossing walls.');
}

function render() {
	drawMaze();
	// overlay path
	if (pathCells.length) {
		ctx.save();
		ctx.lineJoin = 'round'; ctx.lineCap = 'round';
		ctx.strokeStyle = 'rgba(52,144,220,0.95)';
		ctx.shadowColor = 'rgba(52,144,220,0.7)';
		ctx.shadowBlur = 8;
		ctx.lineWidth = Math.max(4, cellSize * 0.45);
		ctx.beginPath();
		for (let i=0;i<pathCells.length;i++){
			const p = pathCells[i];
			const cx = p.x * cellSize + cellSize/2;
			const cy = p.y * cellSize + cellSize/2;
			if (i===0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
		}
		ctx.stroke();
		ctx.restore();
	}
}

// wire up controls and pointer events
drawToggle.addEventListener('click', ()=> toggleDrawMode());
drawToggle.addEventListener('keydown', (e)=>{ if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleDrawMode(); }});
clearBtn.addEventListener('click', clearPath);

canvas.addEventListener('pointerdown', pointerDown);
canvas.addEventListener('pointermove', pointerMove);
window.addEventListener('pointerup', pointerUp);

// initialize
generateMaze();
drawMaze();

// expose for debugging
window._maze = { grid, render, clearPath, toggleDrawMode };
