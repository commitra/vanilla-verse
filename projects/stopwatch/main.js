// State
let isRunning = false;
let isPaused = false;
let startTime = 0;
let elapsedTime = 0;
let animationId = null;
let laps = [];

// DOM elements
const display = document.getElementById('display');
const startPauseBtn = document.getElementById('startPauseBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsContainer = document.getElementById('lapsContainer');
const lapsSection = document.getElementById('lapsSection');

// Format time to mm:ss.mmm
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Update display using performance.now() and requestAnimationFrame
function updateDisplay() {
    if (isRunning) {
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime);
        display.textContent = formatTime(elapsedTime);
        animationId = requestAnimationFrame(updateDisplay);
    }
}

// Start/Pause functionality
function startPause() {
    if (!isRunning) {
        // Start
        isRunning = true;
        isPaused = false;
        startTime = performance.now() - elapsedTime;
        startPauseBtn.textContent = 'Pause';
        startPauseBtn.classList.add('paused');
        startPauseBtn.setAttribute('aria-label', 'Pause stopwatch');
        lapBtn.disabled = false;
        resetBtn.disabled = false;
        updateDisplay();
    } else {
        // Pause
        isRunning = false;
        isPaused = true;
        cancelAnimationFrame(animationId);
        startPauseBtn.textContent = 'Resume';
        startPauseBtn.classList.remove('paused');
        startPauseBtn.setAttribute('aria-label', 'Resume stopwatch');
    }
}

// Lap functionality
function recordLap() {
    if (!isRunning && !isPaused) return;

    const currentTime = elapsedTime;
    const previousTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
    const delta = currentTime - previousTime;

    laps.push({
        number: laps.length + 1,
        time: currentTime,
        delta: delta
    });

    renderLaps();
}

// Render laps
function renderLaps() {
    if (laps.length === 0) {
        lapsSection.style.display = 'none';
        return;
    }

    lapsSection.style.display = 'block';
    lapsContainer.innerHTML = '';

    // Render in reverse order (newest first)
    for (let i = laps.length - 1; i >= 0; i--) {
        const lap = laps[i];
        const lapItem = document.createElement('div');
        lapItem.className = 'lap-item';
        lapItem.setAttribute('role', 'listitem');
        
        lapItem.innerHTML = `
            <div class="lap-number">Lap ${lap.number}</div>
            <div class="lap-times">
                <div class="lap-time">${formatTime(lap.time)}</div>
                <div class="lap-delta">+${formatTime(lap.delta)}</div>
            </div>
        `;
        
        lapsContainer.appendChild(lapItem);
    }
}

// Reset functionality
function reset() {
    isRunning = false;
    isPaused = false;
    elapsedTime = 0;
    startTime = 0;
    laps = [];
    
    cancelAnimationFrame(animationId);
    
    display.textContent = '00:00.000';
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('paused');
    startPauseBtn.setAttribute('aria-label', 'Start stopwatch');
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    
    renderLaps();
}

// Event listeners
startPauseBtn.addEventListener('click', startPause);
lapBtn.addEventListener('click', recordLap);
resetBtn.addEventListener('click', reset);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            startPause();
            break;
        case 'l':
            e.preventDefault();
            if (!lapBtn.disabled) {
                recordLap();
            }
            break;
        case 'r':
            e.preventDefault();
            if (!resetBtn.disabled) {
                reset();
            }
            break;
    }
});

// Handle visibility change to maintain accuracy when tab is inactive
let hiddenTime = 0;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (isRunning) {
            hiddenTime = performance.now();
        }
    } else {
        if (isRunning && hiddenTime > 0) {
            const timeHidden = performance.now() - hiddenTime;
            startTime += timeHidden;
            hiddenTime = 0;
        }
    }
});