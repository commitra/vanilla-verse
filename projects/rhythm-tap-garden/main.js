// Game State
let score = 0;
let combo = 0;
let bestStreak = 0;
let isPlaying = false;
let currentBeat = 0;
let beatInterval = null;
let bpm = 120; // Beats per minute
let beatDuration = (60 / bpm) * 1000; // Convert to milliseconds
let lastBeatTime = 0;
let plantGrowth = 0;

// DOM Elements
const tapButton = document.getElementById('tapButton');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const scoreDisplay = document.getElementById('score');
const comboDisplay = document.getElementById('combo');
const streakDisplay = document.getElementById('streak');
const feedbackDisplay = document.getElementById('feedback');
const beatIndicator = document.getElementById('beatIndicator');
const plant = document.getElementById('plant');
const backgroundMusic = document.getElementById('backgroundMusic');

// Timing windows (in milliseconds)
const PERFECT_WINDOW = 100;
const GOOD_WINDOW = 200;

// Initialize
function init() {
    tapButton.addEventListener('click', handleTap);
    startButton.addEventListener('click', startGame);
    stopButton.addEventListener('click', stopGame);
    
    // Also allow spacebar for tapping
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && isPlaying) {
            e.preventDefault();
            handleTap();
        }
    });
}

// Start the game
function startGame() {
    if (isPlaying) return;
    
    isPlaying = true;
    score = 0;
    combo = 0;
    plantGrowth = 0;
    currentBeat = 0;
    
    updateDisplay();
    updatePlantAppearance();
    
    startButton.disabled = true;
    stopButton.disabled = false;
    
    // Start background music
    backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
    
    // Start beat loop
    lastBeatTime = Date.now();
    beatLoop();
}

// Stop the game
function stopGame() {
    if (!isPlaying) return;
    
    isPlaying = false;
    
    if (beatInterval) {
        clearTimeout(beatInterval);
        beatInterval = null;
    }
    
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    startButton.disabled = false;
    stopButton.disabled = true;
    
    beatIndicator.classList.remove('pulse');
}

// Beat loop - creates the rhythm
function beatLoop() {
    if (!isPlaying) return;
    
    // Visual beat indicator
    beatIndicator.classList.add('pulse');
    setTimeout(() => {
        beatIndicator.classList.remove('pulse');
    }, 100);
    
    lastBeatTime = Date.now();
    currentBeat++;
    
    // Schedule next beat
    beatInterval = setTimeout(beatLoop, beatDuration);
}

// Handle tap input
function handleTap() {
    if (!isPlaying) return;
    
    const currentTime = Date.now();
    const timeSinceLastBeat = currentTime - lastBeatTime;
    
    // Calculate timing - handle wrapping around beat
    let timing;
    if (timeSinceLastBeat <= beatDuration / 2) {
        timing = timeSinceLastBeat;
    } else {
        timing = beatDuration - timeSinceLastBeat;
    }
    
    // Determine accuracy
    let feedback;
    let points;
    
    if (timing <= PERFECT_WINDOW) {
        feedback = 'PERFECT! ⭐';
        points = 100;
        combo++;
        growPlant(3);
        showFeedback(feedback, 'perfect');
    } else if (timing <= GOOD_WINDOW) {
        feedback = 'Good! ✓';
        points = 50;
        combo++;
        growPlant(2);
        showFeedback(feedback, 'good');
    } else {
        feedback = 'Miss ✗';
        points = 0;
        resetCombo();
        showFeedback(feedback, 'miss');
        return;
    }
    
    // Update score with combo multiplier
    const comboMultiplier = Math.min(Math.floor(combo / 5) + 1, 3);
    score += points * comboMultiplier;
    
    // Update best streak
    if (combo > bestStreak) {
        bestStreak = combo;
    }
    
    updateDisplay();
}

// Show feedback to user
function showFeedback(text, type) {
    feedbackDisplay.textContent = text;
    feedbackDisplay.className = `feedback ${type}`;
    
    setTimeout(() => {
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback';
    }, 500);
}

// Grow the plant
function growPlant(amount) {
    plantGrowth += amount;
    updatePlantAppearance();
}

// Update plant visual based on growth
function updatePlantAppearance() {
    plant.className = 'plant';
    
    if (plantGrowth >= 30) {
        plant.classList.add('full-bloom');
    } else if (plantGrowth >= 15) {
        plant.classList.add('blooming');
    } else if (plantGrowth >= 5) {
        plant.classList.add('growing');
    }
}

// Reset combo
function resetCombo() {
    combo = 0;
}

// Update display
function updateDisplay() {
    scoreDisplay.textContent = score;
    comboDisplay.textContent = combo;
    streakDisplay.textContent = bestStreak;
}

// Initialize the game when page loads
init();