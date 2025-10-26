class EchoRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartBtn = document.getElementById('restartBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        this.init();
        this.setupEventListeners();
    }

    init() {
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('echoRunnerHighScore')) || 0;
        this.highScoreElement.textContent = this.highScore;

        // Game settings
        this.baseSpeed = 3;
        this.currentSpeed = this.baseSpeed;
        this.speedIncreaseRate = 0.001;
        this.gravity = 0.8;
        this.jumpForce = -15;
        this.groundLevel = this.canvas.height - 50;

        // Player
        this.player = {
            x: 100,
            y: this.groundLevel,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            color: '#e74c3c'
        };

        // Ghost echoes from previous runs
        this.ghosts = [];
        this.obstacles = [];
        this.backgroundPos = 0;

        // Recording current run for next game
        this.currentRunData = [];
        this.recordingStartTime = 0;

        // Load previous ghost data
        this.loadGhosts();
    }

    setupEventListeners() {
        // Jump controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameRunning) {
                e.preventDefault();
                this.jump();
            } else if (e.code === 'Space' && !this.gameRunning) {
                this.startGame();
            }
        });

        this.canvas.addEventListener('click', () => {
            if (this.gameRunning) {
                this.jump();
            } else {
                this.startGame();
            }
        });

        // Restart buttons
        this.restartBtn.addEventListener('click', () => this.startGame());
        this.playAgainBtn.addEventListener('click', () => this.startGame());

        // Touch support for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning) {
                this.jump();
            } else {
                this.startGame();
            }
        });
    }

    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.currentSpeed = this.baseSpeed;
        this.obstacles = [];
        this.currentRunData = [];
        this.recordingStartTime = Date.now();
        this.gameOverElement.classList.add('hidden');
        
        this.updateScore();
        this.gameLoop();
    }

    jump() {
        if (!this.player.isJumping) {
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
            
            // Record jump for ghost data
            this.recordAction('jump');
        }
    }

    recordAction(type) {
        this.currentRunData.push({
            type: type,
            time: Date.now() - this.recordingStartTime,
            x: this.player.x,
            y: this.player.y
        });
    }

    loadGhosts() {
        try {
            const savedGhosts = localStorage.getItem('echoRunnerGhosts');
            if (savedGhosts) {
                this.ghosts = JSON.parse(savedGhosts);
            }
        } catch (e) {
            console.warn('Could not load ghost data');
            this.ghosts = [];
        }
    }

    saveGhosts() {
        try {
            if (this.currentRunData.length > 0) {
                this.ghosts.push({
                    timestamp: Date.now(),
                    data: this.currentRunData,
                    score: this.score
                });
                
                // Keep only last 5 runs
                if (this.ghosts.length > 5) {
                    this.ghosts = this.ghosts.slice(-5);
                }
                
                localStorage.setItem('echoRunnerGhosts', JSON.stringify(this.ghosts));
            }
        } catch (e) {
            console.warn('Could not save ghost data');
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('echoRunnerHighScore', this.highScore);
        }
    }

    spawnObstacle() {
        if (Math.random() < 0.02) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundLevel,
                width: 30,
                height: 30,
                color: '#2c3e50'
            });
        }
    }

    updatePlayer() {
        // Apply gravity
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;

        // Ground collision
        if (this.player.y >= this.groundLevel) {
            this.player.y = this.groundLevel;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
    }

    updateObstacles() {
        // Move obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.currentSpeed;
        });

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

        // Spawn new obstacles
        this.spawnObstacle();
    }

    updateGhosts() {
        // Update ghost positions based on recorded data
        this.ghosts.forEach(ghost => {
            const currentTime = Date.now() - this.recordingStartTime;
            
            ghost.data.forEach(action => {
                if (Math.abs(action.time - currentTime) < 50) { // 50ms tolerance
                    // Ghost would be at this position
                    const ghostX = this.canvas.width - (currentSpeed * action.time / 1000 * 60);
                    // We'll draw this in render method
                }
            });
        });
    }

    checkCollisions() {
        // Check obstacle collisions
        for (let obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }

        // Check ghost collisions (simplified - using recorded positions)
        const currentTime = Date.now() - this.recordingStartTime;
        
        this.ghosts.forEach(ghost => {
            ghost.data.forEach(action => {
                if (Math.abs(action.time - currentTime) < 30) { // 30ms collision window
                    const ghostX = this.canvas.width - (this.currentSpeed * action.time / 1000 * 60);
                    const ghostBounds = {
                        x: ghostX,
                        y: action.y,
                        width: this.player.width,
                        height: this.player.height
                    };
                    
                    if (this.isColliding(this.player, ghostBounds)) {
                        this.gameOver();
                        return;
                    }
                }
            });
        });
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.classList.remove('hidden');
        this.saveGhosts();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Draw ghosts
        this.drawGhosts();

        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add some detail
            this.ctx.fillStyle = '#34495e';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        });

        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player details
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, this.player.width - 10, this.player.height - 10);

        // Draw ground
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, this.groundLevel + this.player.height, this.canvas.width, this.canvas.height - this.groundLevel - this.player.height);
    }

    drawBackground() {
        // Sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundLevel);
        
        // Moving clouds
        this.backgroundPos = (this.backgroundPos - this.currentSpeed * 0.5) % this.canvas.width;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = -1; i < 2; i++) {
            const x = this.backgroundPos + i * this.canvas.width;
            this.ctx.beginPath();
            this.ctx.arc(x, 80, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 40, 70, 25, 0, Math.PI * 2);
            this.ctx.arc(x + 80, 80, 35, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawGhosts() {
        const currentTime = Date.now() - this.recordingStartTime;
        
        this.ghosts.forEach((ghost, ghostIndex) => {
            ghost.data.forEach((action, actionIndex) => {
                if (action.type === 'jump' || actionIndex % 10 === 0) { // Sample positions
                    const ghostX = this.canvas.width - (this.currentSpeed * action.time / 1000 * 60);
                    const timeDiff = Math.abs(currentTime - action.time);
                    const alpha = Math.max(0, 1 - (timeDiff / 1000)); // Fade based on time difference
                    
                    if (alpha > 0 && ghostX > -50 && ghostX < this.canvas.width + 50) {
                        this.ctx.save();
                        this.ctx.globalAlpha = alpha * 0.6;
                        this.ctx.fillStyle = `hsl(${ghostIndex * 60}, 70%, 50%)`;
                        this.ctx.fillRect(ghostX, action.y, this.player.width, this.player.height);
                        
                        // Ghost trail effect
                        this.ctx.globalAlpha = alpha * 0.3;
                        for (let i = 1; i <= 3; i++) {
                            this.ctx.fillRect(ghostX + i * 5, action.y, this.player.width, this.player.height);
                        }
                        this.ctx.restore();
                    }
                }
            });
        });
    }

    gameLoop() {
        if (!this.gameRunning) return;

        // Update game state
        this.updatePlayer();
        this.updateObstacles();
        this.updateGhosts();
        this.checkCollisions();

        // Increase difficulty
        this.currentSpeed = this.baseSpeed + (this.score * this.speedIncreaseRate);
        this.score += 0.1;

        // Render
        this.render();
        this.updateScore();

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new EchoRunner();
});

// Pause game when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Could add pause functionality here
    }
});