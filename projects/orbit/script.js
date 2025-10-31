    
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, initializing game...');
            
            // Game setup
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            
            // Responsive canvas sizing
            function resizeCanvas() {
                const container = document.getElementById('gameContainer');
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                // Calculate aspect ratio (4:3 is ideal for this game)
                const aspectRatio = 4 / 3;
                let canvasWidth, canvasHeight;
                
                if (containerWidth / containerHeight > aspectRatio) {
                    // Container is wider than the aspect ratio
                    canvasHeight = containerHeight;
                    canvasWidth = canvasHeight * aspectRatio;
                } else {
                    // Container is taller than the aspect ratio
                    canvasWidth = containerWidth;
                    canvasHeight = canvasWidth / aspectRatio;
                }
                
                // Set canvas size
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                // Update game positions based on new canvas size
                if (window.gameState && window.gameState.player) {
                    window.gameState.player.x = Math.min(window.gameState.player.x, canvasWidth - window.gameState.player.radius);
                    window.gameState.player.y = Math.min(window.gameState.player.y, canvasHeight - window.gameState.player.radius);
                }
            }
            
            // Initial canvas resize
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Game state object
            window.gameState = {
                running: false,
                paused: false,
                score: 0,
                highScore: localStorage.getItem('shadowCollectorHighScore') || 0,
                lightLevel: 1.0,
                enemies: [],
                orbs: [],
                walls: [],
                particles: [],
                
                player: {
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    radius: 10,
                    baseSpeed: 3,
                    baseStealthSpeed: 1.5,
                    speed: 3,
                    stealthSpeed: 1.5,
                    lightRadius: 100,
                    isStealth: false,
                    color: '#4a9eff'
                },
                
                powerUp: {
                    active: false,
                    cooldown: 0,
                    duration: 0
                },
                
                stats: {
                    gamesPlayed: parseInt(localStorage.getItem('statGamesPlayed')) || 0,
                    totalOrbs: parseInt(localStorage.getItem('statTotalOrbs')) || 0,
                    highScore: parseInt(localStorage.getItem('shadowCollectorHighScore')) || 0,
                    totalScore: parseInt(localStorage.getItem('statTotalScore')) || 0,
                    totalTime: parseInt(localStorage.getItem('statTotalTime')) || 0,
                    longestTime: parseInt(localStorage.getItem('statLongestTime')) || 0,
                    enemiesAvoided: parseInt(localStorage.getItem('statEnemiesAvoided')) || 0,
                    timesCaught: parseInt(localStorage.getItem('statTimesCaught')) || 0,
                    powerUpsUsed: parseInt(localStorage.getItem('statPowerUpsUsed')) || 0,
                    stealthTime: parseInt(localStorage.getItem('statStealthTime')) || 0,
                    
                    currentGameTime: 0,
                    currentStealthTime: 0,
                    currentEnemiesAvoided: 0
                }
            };
            
            // Input handling
            const keys = {};
            const touch = {
                active: false,
                x: 0,
                y: 0,
                joystick: {
                    active: false,
                    x: 0,
                    y: 0
                }
            };
            
            // Enemy class
            class Enemy {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                    this.radius = 8;
                    this.baseSpeed = 1.5;
                    this.speed = this.baseSpeed;
                    this.color = '#ff3366';
                    this.visionRadius = 60;
                    this.alerted = false;
                    this.patrolDirection = Math.random() * Math.PI * 2;
                    this.patrolTimer = 0;
                    this.avoided = false;
                }
                
                update() {
                    // Calculate distance to player
                    const dx = window.gameState.player.x - this.x;
                    const dy = window.gameState.player.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Gradually increase speed based on score
                    this.speed = this.baseSpeed + (window.gameState.score * 0.05);
                    
                    // Check if player is in vision radius
                    const inVision = distance < this.visionRadius;
                    
                    // Check if player is in light
                    const inLight = distance < window.gameState.player.lightRadius * window.gameState.lightLevel;
                    
                    // If player is visible and not in stealth or in light, chase
                    if (inVision && (!window.gameState.player.isStealth || inLight)) {
                        this.alerted = true;
                        
                        // Move towards player
                        const angle = Math.atan2(dy, dx);
                        this.x += Math.cos(angle) * this.speed;
                        this.y += Math.sin(angle) * this.speed;
                    } else {
                        this.alerted = false;
                        
                        // Patrol behavior
                        this.patrolTimer++;
                        if (this.patrolTimer > 60) {
                            this.patrolDirection = Math.random() * Math.PI * 2;
                            this.patrolTimer = 0;
                        }
                        
                        this.x += Math.cos(this.patrolDirection) * this.speed * 0.5;
                        this.y += Math.sin(this.patrolDirection) * this.speed * 0.5;
                    }
                    
                    // Keep enemy within bounds
                    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
                    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
                    
                    // Check collision with player
                    if (distance < this.radius + window.gameState.player.radius) {
                        gameOver();
                    }
                    
                    // Track if enemy was avoided
                    if (distance < this.visionRadius * 2 && !this.avoided) {
                        this.avoided = true;
                        window.gameState.stats.currentEnemiesAvoided++;
                    }
                }
                
                draw() {
                    // Draw enemy
                    ctx.save();
                    
                    // Draw vision radius when alerted
                    if (this.alerted) {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.visionRadius, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 51, 102, 0.1)';
                        ctx.fill();
                    }
                    
                    // Draw enemy body with color that changes based on speed
                    const speedRatio = (this.speed - this.baseSpeed) / 2;
                    const red = Math.min(255, 255 + speedRatio * 100);
                    const green = Math.max(0, 102 - speedRatio * 102);
                    const blue = Math.max(0, 102 - speedRatio * 102);
                    
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.alerted ? '#ff6666' : `rgb(${red}, ${green}, ${blue})`;
                    ctx.fill();
                    
                    // Draw eyes
                    ctx.fillStyle = '#fff';
                    const eyeAngle = Math.atan2(window.gameState.player.y - this.y, window.gameState.player.x - this.x);
                    const eyeDistance = 3;
                    
                    // Left eye
                    ctx.beginPath();
                    ctx.arc(
                        this.x + Math.cos(eyeAngle - 0.5) * eyeDistance,
                        this.y + Math.sin(eyeAngle - 0.5) * eyeDistance,
                        2, 0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Right eye
                    ctx.beginPath();
                    ctx.arc(
                        this.x + Math.cos(eyeAngle + 0.5) * eyeDistance,
                        this.y + Math.sin(eyeAngle + 0.5) * eyeDistance,
                        2, 0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    ctx.restore();
                }
            }
            
            // Orb class
            class Orb {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                    this.radius = 12;
                    this.color = '#ffcc00';
                    this.glowRadius = 20;
                    this.pulsePhase = Math.random() * Math.PI * 2;
                    this.collected = false;
                }
                
                update() {
                    // Pulse animation
                    this.pulsePhase += 0.05;
                    this.glowRadius = 20 + Math.sin(this.pulsePhase) * 5;
                    
                    // Check collision with player
                    const dx = window.gameState.player.x - this.x;
                    const dy = window.gameState.player.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.radius + window.gameState.player.radius) {
                        this.collected = true;
                        window.gameState.score++;
                        window.gameState.stats.totalOrbs++;
                        window.gameState.lightLevel = Math.max(0.2, window.gameState.lightLevel - 0.1);
                        updateUI();
                        
                        // Create collection particles
                        for (let i = 0; i < 10; i++) {
                            window.gameState.particles.push(new Particle(this.x, this.y, this.color));
                        }
                        
                        // Spawn new enemy with some probability based on light level
                        if (Math.random() < (1 - window.gameState.lightLevel) * 0.8) {
                            spawnEnemy();
                        }
                    }
                }
                
                draw() {
                    // Draw glow
                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowRadius);
                    gradient.addColorStop(0, 'rgba(255, 204, 0, 0.8)');
                    gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
                    
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    // Draw orb
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
            }
            
            // Particle class for effects
            class Particle {
                constructor(x, y, color) {
                    this.x = x;
                    this.y = y;
                    this.vx = (Math.random() - 0.5) * 4;
                    this.vy = (Math.random() - 0.5) * 4;
                    this.radius = Math.random() * 3 + 1;
                    this.color = color;
                    this.life = 1;
                }
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.02;
                    this.radius *= 0.98;
                }
                
                draw() {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            // Wall class for level generation
            class Wall {
                constructor(x, y, width, height) {
                    this.x = x;
                    this.y = y;
                    this.width = width;
                    this.height = height;
                }
                
                draw() {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
                
                checkCollision(x, y, radius) {
                    // Check if circle collides with rectangle
                    const closestX = Math.max(this.x, Math.min(x, this.x + this.width));
                    const closestY = Math.max(this.y, Math.min(y, this.y + this.height));
                    
                    const dx = x - closestX;
                    const dy = y - closestY;
                    
                    return (dx * dx + dy * dy) < (radius * radius);
                }
            }
            
            // Initialize game
            function init() {
                console.log('Initializing game...');
                
                // Reset game state
                window.gameState.score = 0;
                window.gameState.lightLevel = 1.0;
                window.gameState.enemies = [];
                window.gameState.orbs = [];
                window.gameState.walls = [];
                window.gameState.particles = [];
                
                // Reset current game stats
                window.gameState.stats.currentGameTime = 0;
                window.gameState.stats.currentStealthTime = 0;
                window.gameState.stats.currentEnemiesAvoided = 0;
                
                // Reset player speed
                window.gameState.player.speed = window.gameState.player.baseSpeed;
                window.gameState.player.stealthSpeed = window.gameState.player.baseStealthSpeed;
                
                // Reset power-up
                window.gameState.powerUp.active = false;
                window.gameState.powerUp.cooldown = 0;
                window.gameState.powerUp.duration = 0;
                
                // Reset player position
                window.gameState.player.x = canvas.width / 2;
                window.gameState.player.y = canvas.height / 2;
                
                // Generate level
                generateLevel();
                
                // Spawn initial orbs
                for (let i = 0; i < 5; i++) {
                    spawnOrb();
                }
                
                // Spawn initial enemies
                for (let i = 0; i < 2; i++) {
                    spawnEnemy();
                }
                
                updateUI();
                console.log('Game initialized successfully');
            }
            
            // Generate random level
            function generateLevel() {
                // Add some random walls
                const wallCount = Math.min(5, Math.floor(canvas.width / 100));
                for (let i = 0; i < wallCount; i++) {
                    const width = Math.random() * 100 + 50;
                    const height = Math.random() * 100 + 50;
                    const x = Math.random() * (canvas.width - width);
                    const y = Math.random() * (canvas.height - height);
                    
                    // Make sure walls don't spawn on player
                    if (Math.abs(x + width/2 - window.gameState.player.x) > 100 || 
                        Math.abs(y + height/2 - window.gameState.player.y) > 100) {
                        window.gameState.walls.push(new Wall(x, y, width, height));
                    }
                }
            }
            
            // Spawn orb at random position
            function spawnOrb() {
                let validPosition = false;
                let x, y;
                
                while (!validPosition) {
                    x = Math.random() * (canvas.width - 40) + 20;
                    y = Math.random() * (canvas.height - 40) + 20;
                    
                    validPosition = true;
                    
                    // Check if position is not too close to player
                    const dx = x - window.gameState.player.x;
                    const dy = y - window.gameState.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 100) {
                        validPosition = false;
                    }
                    
                    // Check if position is not inside walls
                    for (const wall of window.gameState.walls) {
                        if (wall.checkCollision(x, y, 20)) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                window.gameState.orbs.push(new Orb(x, y));
            }
            
            // Spawn enemy at random position
            function spawnEnemy() {
                let validPosition = false;
                let x, y;
                
                while (!validPosition) {
                    x = Math.random() * (canvas.width - 40) + 20;
                    y = Math.random() * (canvas.height - 40) + 20;
                    
                    validPosition = true;
                    
                    // Check if position is not too close to player
                    const dx = x - window.gameState.player.x;
                    const dy = y - window.gameState.player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 200) {
                        validPosition = false;
                    }
                    
                    // Check if position is not inside walls
                    for (const wall of window.gameState.walls) {
                        if (wall.checkCollision(x, y, 20)) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                window.gameState.enemies.push(new Enemy(x, y));
            }
            
            // Update game state
            function update() {
                if (!window.gameState.running || window.gameState.paused) return;
                
                // Update game time
                window.gameState.stats.currentGameTime++;
                
                // Update stealth time
                if (window.gameState.player.isStealth) {
                    window.gameState.stats.currentStealthTime++;
                }
                
                // Update player speed based on score
                window.gameState.player.speed = window.gameState.player.baseSpeed + (window.gameState.score * 0.03);
                window.gameState.player.stealthSpeed = window.gameState.player.baseStealthSpeed + (window.gameState.score * 0.02);
                
                // Handle player movement
                let dx = 0;
                let dy = 0;
                
                // Keyboard input
                if (keys['w'] || keys['ArrowUp']) dy = -1;
                if (keys['s'] || keys['ArrowDown']) dy = 1;
                if (keys['a'] || keys['ArrowLeft']) dx = -1;
                if (keys['d'] || keys['ArrowRight']) dx = 1;
                
                // Touch/joystick input
                if (touch.joystick.active) {
                    dx = touch.joystick.x;
                    dy = touch.joystick.y;
                }
                
                // Normalize diagonal movement
                if (dx !== 0 && dy !== 0) {
                    dx *= 0.707;
                    dy *= 0.707;
                }
                
                // Apply movement with stealth modifier
                const speed = window.gameState.player.isStealth ? window.gameState.player.stealthSpeed : window.gameState.player.speed;
                const newX = window.gameState.player.x + dx * speed;
                const newY = window.gameState.player.y + dy * speed;
                
                // Check wall collisions
                let canMove = true;
                for (const wall of window.gameState.walls) {
                    if (wall.checkCollision(newX, newY, window.gameState.player.radius)) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    window.gameState.player.x = newX;
                    window.gameState.player.y = newY;
                }
                
                // Keep player within bounds
                window.gameState.player.x = Math.max(window.gameState.player.radius, Math.min(canvas.width - window.gameState.player.radius, window.gameState.player.x));
                window.gameState.player.y = Math.max(window.gameState.player.radius, Math.min(canvas.height - window.gameState.player.radius, window.gameState.player.y));
                
                // Update power-up
                if (window.gameState.powerUp.cooldown > 0) {
                    window.gameState.powerUp.cooldown--;
                }
                
                if (window.gameState.powerUp.active) {
                    window.gameState.powerUp.duration--;
                    if (window.gameState.powerUp.duration <= 0) {
                        window.gameState.powerUp.active = false;
                        document.getElementById('powerUp').classList.remove('active');
                    }
                }
                
                // Update enemies
                window.gameState.enemies.forEach(enemy => enemy.update());
                
                // Update orbs
                window.gameState.orbs = window.gameState.orbs.filter(orb => {
                    orb.update();
                    return !orb.collected;
                });
                
                // Update particles
                window.gameState.particles = window.gameState.particles.filter(particle => {
                    particle.update();
                    return particle.life > 0;
                });
                
                // Spawn new orbs if all collected
                if (window.gameState.orbs.length === 0) {
                    for (let i = 0; i < 5; i++) {
                        spawnOrb();
                    }
                }
                
                // Slowly regenerate light over time
                window.gameState.lightLevel = Math.min(1.0, window.gameState.lightLevel + 0.0005);
                
                // Apply light boost power-up
                if (window.gameState.powerUp.active) {
                    window.gameState.lightLevel = Math.min(1.0, window.gameState.lightLevel + 0.01);
                }
                
                updateUI();
            }
            
            // Draw game
            function draw() {
                // Clear canvas
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw walls
                window.gameState.walls.forEach(wall => wall.draw());
                
                // Draw darkness overlay
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                
                // Calculate effective light radius with power-up
                let effectiveLightRadius = window.gameState.player.lightRadius * window.gameState.lightLevel;
                if (window.gameState.powerUp.active) {
                    effectiveLightRadius *= 1.5;
                }
                
                // Create radial gradient for player light
                const gradient = ctx.createRadialGradient(
                    window.gameState.player.x, window.gameState.player.y, 0,
                    window.gameState.player.x, window.gameState.player.y, effectiveLightRadius
                );
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
                
                // Draw darkness
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Apply global darkness based on light level
                ctx.fillStyle = `rgba(0, 0, 0, ${1 - window.gameState.lightLevel})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.restore();
                
                // Draw orbs
                window.gameState.orbs.forEach(orb => orb.draw());
                
                // Draw enemies
                window.gameState.enemies.forEach(enemy => enemy.draw());
                
                // Draw particles
                window.gameState.particles.forEach(particle => particle.draw());
                
                // Draw player
                ctx.save();
                
                // Draw player light
                const playerGradient = ctx.createRadialGradient(
                    window.gameState.player.x, window.gameState.player.y, 0,
                    window.gameState.player.x, window.gameState.player.y, effectiveLightRadius
                );
                playerGradient.addColorStop(0, 'rgba(74, 158, 255, 0.3)');
                playerGradient.addColorStop(1, 'rgba(74, 158, 255, 0)');
                
                ctx.beginPath();
                ctx.arc(window.gameState.player.x, window.gameState.player.y, effectiveLightRadius, 0, Math.PI * 2);
                ctx.fillStyle = playerGradient;
                ctx.fill();
                
                // Draw player body with color that changes based on speed
                const speedRatio = (window.gameState.player.speed - window.gameState.player.baseSpeed) / 3;
                const blue = Math.min(255, 255 + speedRatio * 100);
                const green = Math.max(0, 158 - speedRatio * 50);
                const red = Math.max(0, 74 - speedRatio * 30);
                
                ctx.beginPath();
                ctx.arc(window.gameState.player.x, window.gameState.player.y, window.gameState.player.radius, 0, Math.PI * 2);
                ctx.fillStyle = window.gameState.player.isStealth ? '#2a5a9f' : `rgb(${red}, ${green}, ${blue})`;
                ctx.fill();
                
                // Draw stealth indicator
                if (window.gameState.player.isStealth) {
                    ctx.strokeStyle = 'rgba(42, 90, 159, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                ctx.restore();
            }
            
            // Game loop
            function gameLoop() {
                update();
                draw();
                requestAnimationFrame(gameLoop);
            }
            
            // Update UI elements
            function updateUI() {
                document.getElementById('score').textContent = window.gameState.score;
                document.getElementById('orbCount').textContent = window.gameState.orbs.length;
                document.getElementById('highScoreValue').textContent = window.gameState.highScore;
                document.getElementById('lightBar').style.width = `${window.gameState.lightLevel * 100}%`;
                
                // Update power-up UI
                const powerUpElement = document.getElementById('powerUp');
                if (window.gameState.powerUp.cooldown > 0) {
                    powerUpElement.classList.add('cooldown');
                } else {
                    powerUpElement.classList.remove('cooldown');
                }
            }
            
            // Update statistics display
            function updateStatsDisplay() {
                document.getElementById('statGamesPlayed').textContent = window.gameState.stats.gamesPlayed;
                document.getElementById('statTotalOrbs').textContent = window.gameState.stats.totalOrbs;
                document.getElementById('statHighScore').textContent = window.gameState.stats.highScore;
                
                const avgScore = window.gameState.stats.gamesPlayed > 0 ? Math.round(window.gameState.stats.totalScore / window.gameState.stats.gamesPlayed) : 0;
                document.getElementById('statAvgScore').textContent = avgScore;
                
                document.getElementById('statTotalTime').textContent = formatTime(window.gameState.stats.totalTime);
                document.getElementById('statLongestTime').textContent = formatTime(window.gameState.stats.longestTime);
                document.getElementById('statEnemiesAvoided').textContent = window.gameState.stats.enemiesAvoided;
                document.getElementById('statTimesCaught').textContent = window.gameState.stats.timesCaught;
                document.getElementById('statPowerUpsUsed').textContent = window.gameState.stats.powerUpsUsed;
                document.getElementById('statStealthTime').textContent = formatTime(window.gameState.stats.stealthTime);
            }
            
            // Format time for display
            function formatTime(frames) {
                const seconds = Math.floor(frames / 60);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                
                if (minutes > 0) {
                    return `${minutes}m ${remainingSeconds}s`;
                } else {
                    return `${seconds}s`;
                }
            }
            
            // Save statistics to localStorage
            function saveStats() {
                localStorage.setItem('statGamesPlayed', window.gameState.stats.gamesPlayed);
                localStorage.setItem('statTotalOrbs', window.gameState.stats.totalOrbs);
                localStorage.setItem('shadowCollectorHighScore', window.gameState.stats.highScore);
                localStorage.setItem('statTotalScore', window.gameState.stats.totalScore);
                localStorage.setItem('statTotalTime', window.gameState.stats.totalTime);
                localStorage.setItem('statLongestTime', window.gameState.stats.longestTime);
                localStorage.setItem('statEnemiesAvoided', window.gameState.stats.enemiesAvoided);
                localStorage.setItem('statTimesCaught', window.gameState.stats.timesCaught);
                localStorage.setItem('statPowerUpsUsed', window.gameState.stats.powerUpsUsed);
                localStorage.setItem('statStealthTime', window.gameState.stats.stealthTime);
            }
            
            // Game over
            function gameOver() {
                console.log('Game over!');
                window.gameState.running = false;
                
                // Update statistics
                window.gameState.stats.gamesPlayed++;
                window.gameState.stats.totalScore += window.gameState.score;
                window.gameState.stats.totalTime += window.gameState.stats.currentGameTime;
                window.gameState.stats.enemiesAvoided += window.gameState.stats.currentEnemiesAvoided;
                window.gameState.stats.timesCaught++;
                window.gameState.stats.stealthTime += window.gameState.stats.currentStealthTime;
                
                if (window.gameState.stats.currentGameTime > window.gameState.stats.longestTime) {
                    window.gameState.stats.longestTime = window.gameState.stats.currentGameTime;
                }
                
                // Check if new high score
                const isNewHighScore = window.gameState.score > window.gameState.highScore;
                if (isNewHighScore) {
                    window.gameState.highScore = window.gameState.score;
                    window.gameState.stats.highScore = window.gameState.score;
                    document.getElementById('newHighScore').classList.remove('hidden');
                } else {
                    document.getElementById('newHighScore').classList.add('hidden');
                }
                
                // Save statistics
                saveStats();
                
                document.getElementById('finalScore').textContent = window.gameState.score;
                document.getElementById('gameOverScreen').classList.remove('hidden');
            }
            
            // Start game
            function startGame() {
                console.log('Starting game...');
                init();
                window.gameState.running = true;
                window.gameState.paused = false;
                document.getElementById('startScreen').classList.add('hidden');
                document.getElementById('gameOverScreen').classList.add('hidden');
                document.getElementById('pauseScreen').classList.add('hidden');
                document.getElementById('statsScreen').classList.add('hidden');
            }
            
            // Pause game
            function pauseGame() {
                if (window.gameState.running) {
                    window.gameState.paused = true;
                    document.getElementById('pauseScreen').classList.remove('hidden');
                }
            }
            
            // Resume game
            function resumeGame() {
                if (window.gameState.running) {
                    window.gameState.paused = false;
                    document.getElementById('pauseScreen').classList.add('hidden');
                }
            }
            
            // Show statistics
            function showStats() {
                updateStatsDisplay();
                document.getElementById('statsScreen').classList.remove('hidden');
            }
            
            // Hide statistics
            function hideStats() {
                document.getElementById('statsScreen').classList.add('hidden');
            }
            
            // Reset statistics
            function resetStats() {
                if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                    window.gameState.stats = {
                        gamesPlayed: 0,
                        totalOrbs: 0,
                        highScore: 0,
                        totalScore: 0,
                        totalTime: 0,
                        longestTime: 0,
                        enemiesAvoided: 0,
                        timesCaught: 0,
                        powerUpsUsed: 0,
                        stealthTime: 0,
                        currentGameTime: 0,
                        currentStealthTime: 0,
                        currentEnemiesAvoided: 0
                    };
                    
                    window.gameState.highScore = 0;
                    saveStats();
                    updateStatsDisplay();
                    updateUI();
                    
                    // Update menu high score
                    document.getElementById('menuHighScore').textContent = 0;
                }
            }
            
            // Event listeners
            document.addEventListener('keydown', (e) => {
                keys[e.key] = true;
                
                // Toggle stealth
                if (e.key === 'Shift') {
                    window.gameState.player.isStealth = true;
                }
                
                // Pause game with Escape key
                if (e.key === 'Escape' && window.gameState.running && !window.gameState.paused) {
                    pauseGame();
                } else if (e.key === 'Escape' && window.gameState.running && window.gameState.paused) {
                    resumeGame();
                }
            });
            
            document.addEventListener('keyup', (e) => {
                keys[e.key] = false;
                
                // Toggle stealth
                if (e.key === 'Shift') {
                    window.gameState.player.isStealth = false;
                }
            });
            
            // Touch controls for mobile
            const joystickContainer = document.querySelector('.joystick-container');
            const joystick = document.querySelector('.joystick');
            const stealthButton = document.getElementById('stealthButton');
            
            // Joystick controls
            joystickContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touch.joystick.active = true;
                updateJoystick(e.touches[0]);
            });
            
            joystickContainer.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (touch.joystick.active) {
                    updateJoystick(e.touches[0]);
                }
            });
            
            joystickContainer.addEventListener('touchend', (e) => {
                e.preventDefault();
                touch.joystick.active = false;
                joystick.style.transform = 'translate(0, 0)';
            });
            
            function updateJoystick(touch) {
                const rect = joystickContainer.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                let deltaX = touch.clientX - centerX;
                let deltaY = touch.clientY - centerY;
                
                // Calculate distance from center
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const maxDistance = rect.width / 2 - joystick.width / 2;
                
                // Limit joystick movement
                if (distance > maxDistance) {
                    deltaX = (deltaX / distance) * maxDistance;
                    deltaY = (deltaY / distance) * maxDistance;
                }
                
                // Update joystick position
                joystick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // Update normalized direction
                touch.joystick.x = deltaX / maxDistance;
                touch.joystick.y = deltaY / maxDistance;
            }
            
            // Stealth button
            stealthButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                window.gameState.player.isStealth = true;
                stealthButton.classList.add('active');
            });
            
            stealthButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                window.gameState.player.isStealth = false;
                stealthButton.classList.remove('active');
            });
            
            // Power-up button
            document.getElementById('powerUp').addEventListener('click', () => {
                if (window.gameState.powerUp.cooldown === 0) {
                    window.gameState.powerUp.active = true;
                    window.gameState.powerUp.duration = 300;
                    window.gameState.powerUp.cooldown = 600;
                    document.getElementById('powerUp').classList.add('active');
                    
                    // Track power-up usage
                    window.gameState.stats.powerUpsUsed++;
                    
                    // Create power-up activation effect
                    for (let i = 0; i < 20; i++) {
                        window.gameState.particles.push(new Particle(window.gameState.player.x, window.gameState.player.y, '#ffffff'));
                    }
                }
            });
            
            // Button event listeners
            document.getElementById('startButton').addEventListener('click', startGame);
            document.getElementById('statsMenuButton').addEventListener('click', showStats);
            document.getElementById('resumeButton').addEventListener('click', resumeGame);
            document.getElementById('restartButton').addEventListener('click', startGame);
            document.getElementById('playAgainButton').addEventListener('click', startGame);
            document.getElementById('statsPauseButton').addEventListener('click', showStats);
            document.getElementById('statsGameOverButton').addEventListener('click', showStats);
            document.getElementById('closeStatsButton').addEventListener('click', hideStats);
            document.getElementById('resetStatsButton').addEventListener('click', resetStats);
            document.getElementById('pauseButton').addEventListener('click', pauseGame);
            document.getElementById('statsButton').addEventListener('click', showStats);
            
            // Initialize high score display
            document.getElementById('menuHighScore').textContent = window.gameState.highScore;
            
            // Detect mobile device
            function isMobileDevice() {
                return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
            }
            
            // Show mobile controls if on mobile
            if (isMobileDevice()) {
                document.getElementById('mobileControls').style.display = 'block';
                document.getElementById('stealthButton').style.display = 'flex';
            }
            
            // Start game loop
            gameLoop();
            
            console.log('Game setup complete!');
        }); 