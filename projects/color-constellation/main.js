// Game State
const gameState = {
    level: 1,
    score: 0,
    stars: [],
    connections: [],
    targetConnections: [],
    selectedStar: null,
    targetRequired: 0,
    gravity: { x: 0, y: 0.02 },
    gravityEnabled: true,
    hintUsed: false
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const targetCanvas = document.getElementById('targetCanvas');
const targetCtx = targetCanvas.getContext('2d');

// UI Elements
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const connectionsDisplay = document.getElementById('connections');
const messageDisplay = document.getElementById('message');
const clearBtn = document.getElementById('clearBtn');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');

// Constants
const STAR_RADIUS = 8;
const STAR_COLORS = ['#fbbf24', '#fcd34d', '#fde68a', '#f59e0b'];
const LINE_COLOR = '#60a5fa';
const LINE_ERROR_COLOR = '#f87171';
const LINE_CORRECT_COLOR = '#10b981';

// Initialize canvas sizes
function resizeCanvas() {
    const canvasContainer = canvas.parentElement;
    canvas.width = canvasContainer.clientWidth - 40;
    canvas.height = 600;
    
    targetCanvas.width = targetCanvas.parentElement.clientWidth - 40;
    targetCanvas.height = 260;
    
    if (gameState.stars.length > 0) {
        draw();
        drawTargetPattern();
    }
}

// Star class
class Star {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.vx = 0;
        this.vy = 0;
        this.radius = STAR_RADIUS;
        this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        this.glowIntensity = Math.random();
        this.glowDirection = 1;
    }

    update() {
        if (gameState.gravityEnabled) {
            // Apply gravity
            this.vy += gameState.gravity.y;
            this.vx += gameState.gravity.x;

            // Apply velocity with damping
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls
            if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
                this.vx *= -0.8;
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            }

            if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
                this.vy *= -0.8;
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
            }

            // Apply friction
            this.vx *= 0.99;
            this.vy *= 0.99;
        }

        // Animate glow
        this.glowIntensity += 0.02 * this.glowDirection;
        if (this.glowIntensity > 1 || this.glowIntensity < 0.5) {
            this.glowDirection *= -1;
        }
    }

    draw(context, isSelected = false) {
        // Draw glow
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
        gradient.addColorStop(0, `${this.color}${Math.floor(this.glowIntensity * 100).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        context.fill();

        // Draw star
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();

        // Draw highlight
        context.fillStyle = '#ffffff88';
        context.beginPath();
        context.arc(this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 3, 0, Math.PI * 2);
        context.fill();

        // Draw selection ring
        if (isSelected) {
            context.strokeStyle = '#fff';
            context.lineWidth = 2;
            context.beginPath();
            context.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            context.stroke();
        }
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= (this.radius + 5) * (this.radius + 5);
    }
}

// Check if two line segments intersect
function doLinesIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    
    // Lines sharing an endpoint don't count as crossing
    if (p1.id === p3.id || p1.id === p4.id || p2.id === p3.id || p2.id === p4.id) {
        return false;
    }

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

// Check if new connection crosses any existing connection
function connectionCrosses(star1, star2, connections) {
    for (const conn of connections) {
        if (doLinesIntersect(star1, star2, conn.star1, conn.star2)) {
            return true;
        }
    }
    return false;
}

// Draw a connection line
function drawConnection(star1, star2, color = LINE_COLOR, animated = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    if (animated) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(star1.x, star1.y);
    ctx.lineTo(star2.x, star2.y);
    ctx.stroke();

    ctx.setLineDash([]);
}

// Generate constellation patterns
function generateConstellationPattern(level) {
    const patterns = [
        // Level 1: Simple triangle
        {
            stars: [
                { x: 0.3, y: 0.7 },
                { x: 0.7, y: 0.7 },
                { x: 0.5, y: 0.3 }
            ],
            connections: [[0, 1], [1, 2], [2, 0]]
        },
        // Level 2: Square
        {
            stars: [
                { x: 0.3, y: 0.3 },
                { x: 0.7, y: 0.3 },
                { x: 0.7, y: 0.7 },
                { x: 0.3, y: 0.7 }
            ],
            connections: [[0, 1], [1, 2], [2, 3], [3, 0]]
        },
        // Level 3: Star shape
        {
            stars: [
                { x: 0.5, y: 0.2 },
                { x: 0.6, y: 0.5 },
                { x: 0.8, y: 0.5 },
                { x: 0.6, y: 0.65 },
                { x: 0.7, y: 0.9 },
                { x: 0.5, y: 0.75 },
                { x: 0.3, y: 0.9 },
                { x: 0.4, y: 0.65 },
                { x: 0.2, y: 0.5 },
                { x: 0.4, y: 0.5 }
            ],
            connections: [[0, 1], [0, 9], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]]
        },
        // Level 4: House
        {
            stars: [
                { x: 0.3, y: 0.5 },
                { x: 0.7, y: 0.5 },
                { x: 0.7, y: 0.8 },
                { x: 0.3, y: 0.8 },
                { x: 0.5, y: 0.25 }
            ],
            connections: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4]]
        },
        // Level 5: Diamond with center
        {
            stars: [
                { x: 0.5, y: 0.2 },
                { x: 0.7, y: 0.5 },
                { x: 0.5, y: 0.8 },
                { x: 0.3, y: 0.5 },
                { x: 0.5, y: 0.5 }
            ],
            connections: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]]
        },
        // Level 6: Complex constellation
        {
            stars: [
                { x: 0.5, y: 0.2 },
                { x: 0.3, y: 0.4 },
                { x: 0.7, y: 0.4 },
                { x: 0.25, y: 0.65 },
                { x: 0.75, y: 0.65 },
                { x: 0.4, y: 0.85 },
                { x: 0.6, y: 0.85 }
            ],
            connections: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [1, 2]]
        }
    ];

    const patternIndex = (level - 1) % patterns.length;
    return patterns[patternIndex];
}

// Initialize level
function initLevel() {
    gameState.connections = [];
    gameState.selectedStar = null;
    gameState.hintUsed = false;
    
    const pattern = generateConstellationPattern(gameState.level);
    gameState.targetRequired = pattern.connections.length;

    // Create stars with slight randomization
    gameState.stars = pattern.stars.map((pos, id) => {
        const randomOffset = 20;
        const x = pos.x * (canvas.width - 100) + 50 + (Math.random() - 0.5) * randomOffset;
        const y = pos.y * (canvas.height - 100) + 50 + (Math.random() - 0.5) * randomOffset;
        return new Star(x, y, id);
    });

    // Store target connections
    gameState.targetConnections = pattern.connections.map(([id1, id2]) => ({
        star1: pattern.stars[id1],
        star2: pattern.stars[id2]
    }));

    updateUI();
    drawTargetPattern();
}

// Draw target pattern
function drawTargetPattern() {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    
    const pattern = generateConstellationPattern(gameState.level);
    const scale = Math.min(targetCanvas.width, targetCanvas.height) - 40;

    // Draw connections
    targetCtx.strokeStyle = LINE_COLOR;
    targetCtx.lineWidth = 2;
    pattern.connections.forEach(([id1, id2]) => {
        const star1 = pattern.stars[id1];
        const star2 = pattern.stars[id2];
        
        targetCtx.beginPath();
        targetCtx.moveTo(star1.x * scale + 20, star1.y * scale + 20);
        targetCtx.lineTo(star2.x * scale + 20, star2.y * scale + 20);
        targetCtx.stroke();
    });

    // Draw stars
    pattern.stars.forEach(star => {
        const x = star.x * scale + 20;
        const y = star.y * scale + 20;
        
        // Glow
        const gradient = targetCtx.createRadialGradient(x, y, 0, x, y, 12);
        gradient.addColorStop(0, '#fbbf2488');
        gradient.addColorStop(1, 'transparent');
        targetCtx.fillStyle = gradient;
        targetCtx.beginPath();
        targetCtx.arc(x, y, 12, 0, Math.PI * 2);
        targetCtx.fill();

        // Star
        targetCtx.fillStyle = '#fbbf24';
        targetCtx.beginPath();
        targetCtx.arc(x, y, 6, 0, Math.PI * 2);
        targetCtx.fill();
    });
}

// Check if pattern matches target
function checkPattern() {
    if (gameState.connections.length !== gameState.targetRequired) {
        showMessage('Not enough connections!', 'error');
        return false;
    }

    // Normalize connections for comparison
    const normalizeConnection = (conn) => {
        const [id1, id2] = [conn.star1.id, conn.star2.id].sort((a, b) => a - b);
        return `${id1}-${id2}`;
    };

    const userConnections = new Set(gameState.connections.map(normalizeConnection));
    
    // Create target connections from pattern
    const pattern = generateConstellationPattern(gameState.level);
    const targetConnections = new Set(
        pattern.connections.map(([id1, id2]) => {
            const [sortedId1, sortedId2] = [id1, id2].sort((a, b) => a - b);
            return `${sortedId1}-${sortedId2}`;
        })
    );

    // Check if sets match
    if (userConnections.size !== targetConnections.size) {
        showMessage('Pattern doesn\'t match!', 'error');
        return false;
    }

    for (const conn of userConnections) {
        if (!targetConnections.has(conn)) {
            showMessage('Pattern doesn\'t match!', 'error');
            return false;
        }
    }

    // Pattern matches!
    const baseScore = 100 * gameState.level;
    const hintPenalty = gameState.hintUsed ? 50 : 0;
    const earnedScore = baseScore - hintPenalty;
    gameState.score += earnedScore;

    showMessage(`Perfect! +${earnedScore} points`, 'success');
    
    // Show next level button
    checkBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    
    updateUI();
    return true;
}

// Show hint
function showHint() {
    if (gameState.hintUsed) {
        showMessage('Hint already used!', 'error');
        return;
    }

    // Highlight one correct connection that hasn't been made
    const pattern = generateConstellationPattern(gameState.level);
    const targetConnections = pattern.connections.map(([id1, id2]) => {
        const [sortedId1, sortedId2] = [id1, id2].sort((a, b) => a - b);
        return `${sortedId1}-${sortedId2}`;
    });

    const userConnections = new Set(
        gameState.connections.map(conn => {
            const [id1, id2] = [conn.star1.id, conn.star2.id].sort((a, b) => a - b);
            return `${id1}-${id2}`;
        })
    );

    // Find a missing connection
    for (const targetConn of targetConnections) {
        if (!userConnections.has(targetConn)) {
            const [id1, id2] = targetConn.split('-').map(Number);
            const star1 = gameState.stars[id1];
            const star2 = gameState.stars[id2];

            // Highlight stars temporarily
            const originalDraw = draw;
            let flashCount = 0;
            const flashInterval = setInterval(() => {
                draw();
                if (flashCount % 2 === 0) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(star1.x, star1.y, STAR_RADIUS + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(star2.x, star2.y, STAR_RADIUS + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                flashCount++;
                if (flashCount >= 6) {
                    clearInterval(flashInterval);
                    draw();
                }
            }, 300);

            gameState.hintUsed = true;
            showMessage('Hint: Connect highlighted stars!', 'hint');
            return;
        }
    }

    showMessage('All connections are correct!', 'hint');
}

// Show message
function showMessage(text, type) {
    messageDisplay.textContent = text;
    messageDisplay.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDisplay.classList.remove('show');
    }, 2000);
}

// Update UI
function updateUI() {
    levelDisplay.textContent = gameState.level;
    scoreDisplay.textContent = gameState.score;
    connectionsDisplay.textContent = `${gameState.connections.length}/${gameState.targetRequired}`;
}

// Clear all connections
function clearConnections() {
    gameState.connections = [];
    gameState.selectedStar = null;
    updateUI();
    draw();
}

// Next level
function nextLevel() {
    gameState.level++;
    checkBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
    initLevel();
    draw();
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    gameState.connections.forEach(conn => {
        drawConnection(conn.star1, conn.star2);
    });

    // Draw potential connection
    if (gameState.selectedStar && gameState.mouseX && gameState.mouseY) {
        ctx.strokeStyle = LINE_COLOR + '88';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(gameState.selectedStar.x, gameState.selectedStar.y);
        ctx.lineTo(gameState.mouseX, gameState.mouseY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw stars
    gameState.stars.forEach(star => {
        star.update();
        star.draw(ctx, star === gameState.selectedStar);
    });
}

// Handle canvas click
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked star
    const clickedStar = gameState.stars.find(star => star.contains(x, y));

    if (clickedStar) {
        if (!gameState.selectedStar) {
            // First star selected
            gameState.selectedStar = clickedStar;
        } else if (clickedStar === gameState.selectedStar) {
            // Deselect
            gameState.selectedStar = null;
        } else {
            // Try to create connection
            const star1 = gameState.selectedStar;
            const star2 = clickedStar;

            // Check if connection already exists
            const connectionExists = gameState.connections.some(conn =>
                (conn.star1 === star1 && conn.star2 === star2) ||
                (conn.star1 === star2 && conn.star2 === star1)
            );

            if (connectionExists) {
                showMessage('Connection already exists!', 'error');
            } else if (connectionCrosses(star1, star2, gameState.connections)) {
                showMessage('Lines cannot cross!', 'error');
            } else {
                // Create connection
                gameState.connections.push({ star1, star2 });
                updateUI();
            }

            gameState.selectedStar = null;
        }
    } else {
        // Clicked empty space
        gameState.selectedStar = null;
    }

    draw();
});

// Track mouse movement for drawing potential connections
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;

    if (gameState.selectedStar) {
        draw();
    }
});

// Button event listeners
clearBtn.addEventListener('click', clearConnections);
hintBtn.addEventListener('click', showHint);
checkBtn.addEventListener('click', checkPattern);
nextBtn.addEventListener('click', nextLevel);

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Animation loop
function animate() {
    draw();
    requestAnimationFrame(animate);
}

// Initialize game
resizeCanvas();
initLevel();
animate();

// Keyboard accessibility
canvas.setAttribute('tabindex', '0');
canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.selectedStar) {
        gameState.selectedStar = null;
        draw();
    }
});
