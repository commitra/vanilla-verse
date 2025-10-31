     
        // Game variables
        let score = 0;
        let highScore = 0;
        let gameActive = false;
        let gamePaused = false;
        let gameMode = 'classic';
        let tileSpeed = 0.4; // Very slow initial speed
        let speedIncrement = 0.005; // Much smaller speed increase
        let tileRows = [];
        let lastTileTime = 0;
        let tileInterval = 3000; // Very long interval between tiles (3 seconds)
        let animationId;
        let audioContext;
        let currentTheme = 'light';
        let combo = 0;
        let lastComboTime = 0;

        // Statistics tracking
        let gameStats = {
            totalGames: 0,
            allTimeHigh: 0,
            totalScore: 0,
            totalTiles: 0,
            classicHigh: 0,
            arcadeHigh: 0,
            scoreHistory: []
        };

        // DOM elements
        const gameArea = document.getElementById('game-area');
        const scoreDisplay = document.getElementById('score-display');
        const highScoreDisplay = document.getElementById('high-score');
        const speedFill = document.getElementById('speed-fill');
        const comboDisplay = document.getElementById('combo-display');
        const pauseButton = document.getElementById('pause-button');
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const pauseScreen = document.getElementById('pause-screen');
        const modeSelection = document.getElementById('mode-selection');
        const statsScreen = document.getElementById('stats-screen');
        const finalScoreDisplay = document.getElementById('final-score');
        const highestScoreDisplay = document.getElementById('highest-score-display');
        const newHighScoreDisplay = document.getElementById('new-high-score');
        const modeSelectButton = document.getElementById('mode-select-button');
        const backButton = document.getElementById('back-button');
        const restartButton = document.getElementById('restart-button');
        const menuButton = document.getElementById('menu-button');
        const menuButtonPause = document.getElementById('menu-button-pause');
        const resumeButton = document.getElementById('resume-button');
        const themeToggle = document.getElementById('theme-toggle');
        const statsButton = document.getElementById('stats-button');
        const backFromStats = document.getElementById('back-from-stats');
        const clearDataButton = document.getElementById('clear-data-button');

        // Load saved data from localStorage
        function loadGameData() {
            // Load game statistics
            const savedStats = localStorage.getItem('pianoTilesStats');
            if (savedStats) {
                gameStats = JSON.parse(savedStats);
                updateStatsDisplay();
            }
            
            // Load theme preference
            const savedTheme = localStorage.getItem('pianoTilesTheme');
            if (savedTheme) {
                currentTheme = savedTheme;
                document.documentElement.setAttribute('data-theme', currentTheme);
                updateThemeToggle();
            }
            
            // Update high score display
            highScore = gameStats.allTimeHigh;
            highScoreDisplay.textContent = highScore;
        }

        // Save game data to localStorage
        function saveGameData() {
            localStorage.setItem('pianoTilesStats', JSON.stringify(gameStats));
            localStorage.setItem('pianoTilesTheme', currentTheme);
        }

        // Save current game score
        function saveScore() {
            // Update statistics
            gameStats.totalGames++;
            gameStats.totalScore += score;
            gameStats.totalTiles += score;
            
            // Update mode-specific high scores
            if (gameMode === 'classic' && score > gameStats.classicHigh) {
                gameStats.classicHigh = score;
            } else if (gameMode === 'arcade' && score > gameStats.arcadeHigh) {
                gameStats.arcadeHigh = score;
            }
            
            // Update all-time high score
            if (score > gameStats.allTimeHigh) {
                gameStats.allTimeHigh = score;
                highScore = score;
                highScoreDisplay.textContent = highScore;
            }
            
            // Add to score history (keep last 10 scores)
            const scoreEntry = {
                score: score,
                mode: gameMode,
                date: new Date().toISOString()
            };
            gameStats.scoreHistory.unshift(scoreEntry);
            if (gameStats.scoreHistory.length > 10) {
                gameStats.scoreHistory = gameStats.scoreHistory.slice(0, 10);
            }
            
            // Save to localStorage
            saveGameData();
            updateStatsDisplay();
        }

        // Update statistics display
        function updateStatsDisplay() {
            document.getElementById('total-games').textContent = gameStats.totalGames;
            document.getElementById('all-time-high').textContent = gameStats.allTimeHigh;
            
            // Calculate average score
            const averageScore = gameStats.totalGames > 0 
                ? Math.round(gameStats.totalScore / gameStats.totalGames) 
                : 0;
            document.getElementById('average-score').textContent = averageScore;
            
            document.getElementById('total-tiles').textContent = gameStats.totalTiles;
            
            // Determine best mode
            let bestMode = '-';
            if (gameStats.classicHigh > 0 || gameStats.arcadeHigh > 0) {
                if (gameStats.classicHigh >= gameStats.arcadeHigh) {
                    bestMode = `Classic (${gameStats.classicHigh})`;
                } else {
                    bestMode = `Arcade (${gameStats.arcadeHigh})`;
                }
            }
            document.getElementById('best-mode').textContent = bestMode;
            
            // Update score history
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
            
            if (gameStats.scoreHistory.length === 0) {
                historyList.innerHTML = '<div class="history-item">No scores yet</div>';
            } else {
                gameStats.scoreHistory.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    
                    const date = new Date(entry.date);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    item.innerHTML = `
                        <span>${entry.score} pts - ${entry.mode.charAt(0).toUpperCase() + entry.mode.slice(1)}</span>
                        <span>${timeString}</span>
                    `;
                    historyList.appendChild(item);
                });
            }
        }

        // Initialize audio context
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        // Play a piano tone
        function playTone(frequency = 440, duration = 200) {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        }

        // Create enhanced particle effect
        function createParticle(x, y) {
            // Create multiple particles for better effect
            for (let i = 0; i < 6; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                
                const angle = (Math.PI * 2 * i) / 6;
                const velocity = 50 + Math.random() * 50;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;
                
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                particle.style.animation = 'particle-animation 0.6s ease-out forwards';
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    document.body.removeChild(particle);
                }, 600);
            }
        }

        // Create score popup animation
        function createScorePopup(x, y) {
            const popup = document.createElement('div');
            popup.className = 'score-popup';
            popup.textContent = '+1';
            popup.style.left = `${x}px`;
            popup.style.top = `${y}px`;
            
            document.body.appendChild(popup);
            
            setTimeout(() => {
                document.body.removeChild(popup);
            }, 1000);
        }

        // Show combo display
        function showCombo() {
            const now = Date.now();
            if (now - lastComboTime < 2000) {
                combo++;
                if (combo > 1) {
                    comboDisplay.textContent = `${combo}x COMBO!`;
                    comboDisplay.classList.remove('show');
                    void comboDisplay.offsetWidth; // Trigger reflow
                    comboDisplay.classList.add('show');
                }
            } else {
                combo = 1;
            }
            lastComboTime = now;
        }

        // Update speed indicator
        function updateSpeedIndicator() {
            const maxSpeed = 2.0;
            const percentage = Math.min((tileSpeed / maxSpeed) * 100, 100);
            speedFill.style.width = `${percentage}%`;
        }

        // Create a new tile row
        function createTileRow() {
            const row = document.createElement('div');
            row.className = 'tile-row';
            row.style.top = '-25vh';
            
            // Random position for the active tile (0-3)
            const activeTileIndex = Math.floor(Math.random() * 4);
            
            for (let i = 0; i < 4; i++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                if (i === activeTileIndex) {
                    tile.classList.add('active');
                    
                    // Add both click and touch event listeners for better responsiveness
                    const handleTileClick = (e) => {
                        e.preventDefault();
                        if (!gameActive || gamePaused || tile.classList.contains('clicked')) return;
                        
                        tile.classList.add('clicked');
                        score++;
                        scoreDisplay.textContent = score;
                        
                        // Show combo
                        showCombo();
                        
                        // Create particle effect at touch position
                        const rect = tile.getBoundingClientRect();
                        const x = e.clientX || (e.touches && e.touches[0].clientX) || rect.left + rect.width / 2;
                        const y = e.clientY || (e.touches && e.touches[0].clientY) || rect.top + rect.height / 2;
                        createParticle(x, y);
                        createScorePopup(x, y);
                        
                        // Play a tone based on the tile position
                        const baseFrequency = 261.63; // C4
                        const frequency = baseFrequency * Math.pow(2, (3 - i) / 12);
                        playTone(frequency, 150);
                        
                        // Update speed indicator
                        updateSpeedIndicator();
                        
                        // Increase speed based on game mode (very gradual now)
                        if (gameMode === 'classic' && score % 50 === 0) { // Every 50 points
                            tileSpeed += speedIncrement;
                        } else if (gameMode === 'arcade' && score % 40 === 0) { // Every 40 points
                            tileSpeed += speedIncrement * 1.5;
                        }
                    };
                    
                    // Multiple event listeners for better touch responsiveness
                    tile.addEventListener('click', handleTileClick);
                    tile.addEventListener('touchstart', handleTileClick, { passive: false });
                    tile.addEventListener('mousedown', handleTileClick);
                }
                
                row.appendChild(tile);
            }
            
            gameArea.appendChild(row);
            tileRows.push({
                element: row,
                position: -25,
                clicked: false
            });
        }

        // Update tile positions
        function updateTiles(timestamp) {
            if (!gameActive || gamePaused) return;
            
            // Create new tiles at intervals based on game mode
            let currentTileInterval = tileInterval;
            
            if (gameMode === 'arcade') {
                currentTileInterval = 2500;
            }
            
            if (timestamp - lastTileTime > currentTileInterval) {
                createTileRow();
                lastTileTime = timestamp;
                
                // Very gradual decrease in interval for arcade mode
                if (gameMode === 'arcade' && currentTileInterval > 2000) {
                    tileInterval -= 30;
                }
            }
            
            // Update existing tiles
            for (let i = tileRows.length - 1; i >= 0; i--) {
                const row = tileRows[i];
                row.position += tileSpeed;
                row.element.style.top = `${row.position}vh`;
                
                // Check if any active tile was missed
                if (row.position > 0 && !row.clicked) {
                    const activeTile = row.element.querySelector('.tile.active:not(.clicked)');
                    if (activeTile) {
                        activeTile.classList.add('missed');
                        combo = 0; // Reset combo on miss
                        endGame();
                        return;
                    }
                }
                
                // Remove tiles that are off screen
                if (row.position > 100) {
                    gameArea.removeChild(row.element);
                    tileRows.splice(i, 1);
                }
            }
            
            animationId = requestAnimationFrame(updateTiles);
        }

        // Start the game
        function startGame(mode = 'classic') {
            initAudio();
            gameMode = mode;
            score = 0;
            combo = 0;
            tileSpeed = gameMode === 'arcade' ? 0.5 : 0.4; // Very slow initial speeds
            tileInterval = gameMode === 'arcade' ? 2500 : 3000; // Very long initial intervals
            lastTileTime = 0;
            scoreDisplay.textContent = score;
            gameActive = true;
            gamePaused = false;
            
            // Reset speed indicator
            updateSpeedIndicator();
            
            // Clear any existing tiles
            tileRows.forEach(row => {
                gameArea.removeChild(row.element);
            });
            tileRows = [];
            
            // Hide screens
            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            modeSelection.classList.add('hidden');
            statsScreen.classList.add('hidden');
            pauseScreen.classList.add('hidden');
            newHighScoreDisplay.classList.add('hidden');
            
            // Hide stats button during gameplay
            statsButton.classList.add('hidden');
            
            // Show pause button
            pauseButton.classList.remove('hidden');
            
            // Start the game loop
            animationId = requestAnimationFrame(updateTiles);
        }

        // End the game
        function endGame() {
            gameActive = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
            
            // Hide pause button
            pauseButton.classList.add('hidden');
            
            // Save the score
            saveScore();
            
            // Check for new high score
            if (score > highScore) {
                newHighScoreDisplay.classList.remove('hidden');
            } else {
                newHighScoreDisplay.classList.add('hidden');
            }
            
            // Show game over screen with highest score
            finalScoreDisplay.textContent = `Final Score: ${score}`;
            highestScoreDisplay.textContent = `Highest Score: ${gameStats.allTimeHigh}`;
            gameOverScreen.classList.remove('hidden');
            
            // Play game over sound
            playTone(200, 500);
        }

        // Pause the game
        function pauseGame() {
            if (!gameActive || gamePaused) return;
            
            gamePaused = true;
            pauseScreen.classList.remove('hidden');
        }

        // Resume the game
        function resumeGame() {
            if (!gameActive || !gamePaused) return;
            
            gamePaused = false;
            pauseScreen.classList.add('hidden');
            animationId = requestAnimationFrame(updateTiles);
        }

        // Toggle theme
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            updateThemeToggle();
            saveGameData();
        }

        // Update theme toggle button
        function updateThemeToggle() {
            const icon = currentTheme === 'light' ? '🌙' : '☀️';
            if (themeToggle) themeToggle.textContent = icon;
        }

        // Clear all data
        function clearAllData() {
            if (confirm('Are you sure you want to clear all game data? This cannot be undone.')) {
                gameStats = {
                    totalGames: 0,
                    allTimeHigh: 0,
                    totalScore: 0,
                    totalTiles: 0,
                    classicHigh: 0,
                    arcadeHigh: 0,
                    scoreHistory: []
                };
                highScore = 0;
                highScoreDisplay.textContent = highScore;
                saveGameData();
                updateStatsDisplay();
                alert('All data has been cleared.');
            }
        }

        // Show main menu
        function showMainMenu() {
            // Show stats button only on main menu
            statsButton.classList.remove('hidden');
            
            // Hide other screens
            startScreen.classList.remove('hidden');
            modeSelection.classList.add('hidden');
            statsScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            pauseScreen.classList.add('hidden');
        }

        // Event listeners with better touch handling
        modeSelectButton.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            modeSelection.classList.remove('hidden');
        });
        
        backButton.addEventListener('click', () => {
            modeSelection.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
        
        restartButton.addEventListener('click', () => startGame(gameMode));
        menuButton.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            showMainMenu();
        });
        
        menuButtonPause.addEventListener('click', () => {
            gameActive = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
            pauseButton.classList.add('hidden');
            pauseScreen.classList.add('hidden');
            showMainMenu();
        });
        
        pauseButton.addEventListener('click', pauseGame);
        resumeButton.addEventListener('click', resumeGame);
        
        themeToggle.addEventListener('click', toggleTheme);
        
        statsButton.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            statsScreen.classList.remove('hidden');
            updateStatsDisplay();
        });
        
        backFromStats.addEventListener('click', () => {
            statsScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
        
        clearDataButton.addEventListener('click', clearAllData);

        // Game mode buttons
        document.querySelectorAll('.mode-button[data-mode]').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                startGame(mode);
            });
        });

        // Prevent scrolling on mobile
        document.addEventListener('touchmove', function(e) {
            if (gameActive) {
                e.preventDefault();
            }
        }, { passive: false });

        // Prevent zooming on mobile
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        // Prevent context menu on long press
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        // Load game data on start
        loadGameData();
