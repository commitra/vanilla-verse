/*
================================================================================
MIRROR PAINTER - MAIN JAVASCRIPT FILE
================================================================================
This file contains all the JavaScript logic for the Mirror Painter application.
It demonstrates separation of concerns: HTML for structure, CSS for styling,
and JavaScript for behavior and interactivity.

Educational Purpose: This code is structured to help beginners understand:
- DOM manipulation and element selection
- HTML5 Canvas API and 2D rendering context
- Event-driven programming with mouse/touch events
- Coordinate transformations (mirroring)
- Image data processing and pixel comparison
- State management in web applications
================================================================================
*/

/*
================================================================================
1. DOM ELEMENT SELECTION
================================================================================
We start by selecting all the HTML elements we need to work with.
Using getElementById() is the most common way to access specific elements.
*/

// Canvas elements - These are where we'll draw
const drawCanvas = document.getElementById('drawCanvas');
const mirrorCanvas = document.getElementById('mirrorCanvas');

// Canvas contexts - The 2D rendering context provides drawing methods
// Think of context as the "paintbrush" we use to draw on the canvas
const drawCtx = drawCanvas.getContext('2d');
const mirrorCtx = mirrorCanvas.getContext('2d');

// UI Control elements - Buttons and inputs the user interacts with
const clearBtn = document.getElementById('clearBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');

// Display elements - Elements we update to show information to the user
const levelTitle = document.getElementById('levelTitle');
const levelDescription = document.getElementById('levelDescription');
const matchPercentage = document.getElementById('matchPercentage');
const encouragement = document.getElementById('encouragement');
const successMessage = document.getElementById('successMessage');
const completionMessage = document.getElementById('completionMessage');

/*
================================================================================
2. GAME STATE VARIABLES
================================================================================
These variables track the current state of our application.
In a real app, you might use more sophisticated state management,
but for learning purposes, global variables work fine.
*/

let currentLevel = 0;           // Which level the player is on (0-indexed)
let isDrawing = false;          // Is the user currently drawing?
let lastX = 0;                  // Last X position of the mouse
let lastY = 0;                  // Last Y position of the mouse
let currentColor = '#2563eb';   // Current drawing color (blue)
let currentBrushSize = 4;       // Current brush thickness in pixels
let levelComplete = false;      // Has the current level been completed?

/*
================================================================================
3. LEVEL TEMPLATES DATA
================================================================================
This array defines all the levels in our game.
Each level has a shape that the player needs to match.
*/

const levels = [
    {
        id: 1,
        name: "Vertical Line",
        description: "Draw a straight vertical line",
        template_type: "line",
        points: [[200, 50], [200, 350]]  // Start and end coordinates
    },
    {
        id: 2,
        name: "Horizontal Line",
        description: "Draw a straight horizontal line",
        template_type: "line",
        points: [[50, 200], [350, 200]]
    },
    {
        id: 3,
        name: "Cross",
        description: "Draw a plus sign",
        template_type: "multi_line",
        lines: [
            [[200, 50], [200, 350]],      // Vertical line
            [[50, 200], [350, 200]]        // Horizontal line
        ]
    },
    {
        id: 4,
        name: "Triangle",
        description: "Draw a triangle",
        template_type: "polygon",
        points: [[200, 80], [320, 320], [80, 320], [200, 80]]
    },
    {
        id: 5,
        name: "Heart",
        description: "Draw a simple heart shape",
        template_type: "polygon",
        points: [
            [200, 300], [150, 250], [150, 200], [175, 175],
            [200, 185], [225, 175], [250, 200], [250, 250], [200, 300]
        ]
    }
];

// Encouraging messages to motivate the player
const encouragementMessages = [
    "Keep going!",
    "You're doing great!",
    "Almost there!",
    "Nice work!"
];

/*
================================================================================
4. INITIALIZATION FUNCTION
================================================================================
This function sets up the canvas contexts with the properties we want.
We call this once when the page loads.
*/

function initCanvas() {
    // Configure both canvas contexts with the same drawing properties
    // lineCap: 'round' makes the ends of lines rounded instead of square
    // lineJoin: 'round' makes corners rounded when lines connect
    [drawCtx, mirrorCtx].forEach(ctx => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    });
}

/*
================================================================================
5. UTILITY FUNCTIONS
================================================================================
*/

/**
 * Get the mouse position relative to the canvas
 * This is necessary because mouse events give us coordinates relative to the
 * entire page, but we need coordinates relative to the canvas element.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {MouseEvent|Touch} evt - The mouse or touch event
 * @returns {Object} Object with x and y coordinates
 */
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

/*
================================================================================
6. CANVAS DRAWING FUNCTIONS
================================================================================
*/

/**
 * Clear both canvases and redraw the template
 * This function is called when the user clicks the Clear button
 * or when starting a new level
 */
function clearCanvases() {
    // clearRect removes all drawings from a rectangular area
    // We clear the entire canvas by using its full width and height
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    mirrorCtx.clearRect(0, 0, mirrorCanvas.width, mirrorCanvas.height);
    
    // Redraw the template so the user knows what to draw
    drawTemplate();
}

/**
 * Draw the template shape on the mirror canvas
 * The template shows the user what they need to draw
 * It appears as a light gray shape on the right canvas
 */
function drawTemplate() {
    const level = levels[currentLevel];
    
    // Set template drawing style - semi-transparent gray
    mirrorCtx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    mirrorCtx.lineWidth = 8;
    mirrorCtx.lineCap = 'round';
    mirrorCtx.lineJoin = 'round';

    // Draw different shapes based on the template type
    if (level.template_type === 'line') {
        // Draw a single line from point A to point B
        mirrorCtx.beginPath();  // Start a new path
        mirrorCtx.moveTo(level.points[0][0], level.points[0][1]);  // Move to start point
        mirrorCtx.lineTo(level.points[1][0], level.points[1][1]);  // Draw line to end point
        mirrorCtx.stroke();  // Actually draw the line
    } 
    else if (level.template_type === 'multi_line') {
        // Draw multiple separate lines
        level.lines.forEach(line => {
            mirrorCtx.beginPath();
            mirrorCtx.moveTo(line[0][0], line[0][1]);
            mirrorCtx.lineTo(line[1][0], line[1][1]);
            mirrorCtx.stroke();
        });
    } 
    else if (level.template_type === 'polygon') {
        // Draw a shape by connecting multiple points
        mirrorCtx.beginPath();
        mirrorCtx.moveTo(level.points[0][0], level.points[0][1]);
        // Loop through remaining points and draw lines to each
        for (let i = 1; i < level.points.length; i++) {
            mirrorCtx.lineTo(level.points[i][0], level.points[i][1]);
        }
        mirrorCtx.stroke();
    }
}

/**
 * Main drawing function - draws on both canvases
 * This is called during mousemove when the user is drawing
 * 
 * @param {number} x - Current X coordinate
 * @param {number} y - Current Y coordinate
 */
function draw(x, y) {
    /*
     * PART 1: Draw on the left (drawing) canvas
     * This is straightforward - just draw a line from the last position to the current one
     */
    drawCtx.strokeStyle = currentColor;
    drawCtx.lineWidth = currentBrushSize;
    drawCtx.beginPath();
    drawCtx.moveTo(lastX, lastY);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();

    /*
     * PART 2: Draw the MIRRORED version on the right canvas
     * This is more complex because we need to flip it horizontally
     * 
     * COORDINATE TRANSFORMATION EXPLANATION:
     * - save() saves the current canvas state (transformations, styles, etc.)
     * - translate(width, 0) moves the origin to the right edge
     * - scale(-1, 1) flips horizontally (negative X scale)
     * - Now when we draw, it appears mirrored!
     * - restore() returns to the saved state, undoing our transformations
     */
    mirrorCtx.save();  // Save the current state
    
    // Transform the coordinate system for mirroring
    mirrorCtx.translate(mirrorCanvas.width, 0);  // Move origin to right edge
    mirrorCtx.scale(-1, 1);  // Flip horizontally
    
    // Draw the mirrored stroke (same coordinates, but transformed space)
    mirrorCtx.strokeStyle = currentColor;
    mirrorCtx.lineWidth = currentBrushSize;
    mirrorCtx.beginPath();
    mirrorCtx.moveTo(lastX, lastY);
    mirrorCtx.lineTo(x, y);
    mirrorCtx.stroke();
    
    mirrorCtx.restore();  // Restore the original state

    // Redraw the template on top so it's always visible
    drawTemplate();

    // Calculate how well the drawing matches the template
    calculateMatch();

    // Update last position for next draw call
    lastX = x;
    lastY = y;
}

/*
================================================================================
7. SHAPE MATCHING ALGORITHM
================================================================================
This is one of the most complex parts of the code.
We compare the user's drawing to the template pixel by pixel.
*/

/**
 * Calculate how well the user's drawing matches the template
 * Uses pixel-level comparison with getImageData()
 * 
 * HOW IT WORKS:
 * 1. Create a temporary canvas with just the template
 * 2. Create another temporary canvas with the user's drawing (mirrored)
 * 3. Get the pixel data from both canvases
 * 4. Count how many pixels match
 * 5. Calculate the percentage
 */
function calculateMatch() {
    // Don't recalculate if level is already complete
    if (levelComplete) return;

    /*
     * STEP 1: Create template canvas
     * We need the template by itself (without the user's drawing)
     */
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mirrorCanvas.width;
    tempCanvas.height = mirrorCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the template shape
    const level = levels[currentLevel];
    tempCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
    tempCtx.lineWidth = 8;
    tempCtx.lineCap = 'round';
    tempCtx.lineJoin = 'round';

    // Draw the same shape as in drawTemplate()
    if (level.template_type === 'line') {
        tempCtx.beginPath();
        tempCtx.moveTo(level.points[0][0], level.points[0][1]);
        tempCtx.lineTo(level.points[1][0], level.points[1][1]);
        tempCtx.stroke();
    } else if (level.template_type === 'multi_line') {
        level.lines.forEach(line => {
            tempCtx.beginPath();
            tempCtx.moveTo(line[0][0], line[0][1]);
            tempCtx.lineTo(line[1][0], line[1][1]);
            tempCtx.stroke();
        });
    } else if (level.template_type === 'polygon') {
        tempCtx.beginPath();
        tempCtx.moveTo(level.points[0][0], level.points[0][1]);
        for (let i = 1; i < level.points.length; i++) {
            tempCtx.lineTo(level.points[i][0], level.points[i][1]);
        }
        tempCtx.stroke();
    }

    /*
     * STEP 2: Get template pixel data
     * getImageData returns an object containing pixel data as a Uint8ClampedArray
     * Each pixel has 4 values: Red, Green, Blue, Alpha (transparency)
     */
    const templateData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    /*
     * STEP 3: Create user drawing canvas (mirrored)
     * We need to mirror the user's drawing to match the template orientation
     */
    const userCanvas = document.createElement('canvas');
    userCanvas.width = mirrorCanvas.width;
    userCanvas.height = mirrorCanvas.height;
    const userCtx = userCanvas.getContext('2d');
    
    // Mirror the drawing canvas onto the user canvas
    userCtx.save();
    userCtx.translate(userCanvas.width, 0);
    userCtx.scale(-1, 1);
    userCtx.drawImage(drawCanvas, 0, 0);  // Copy the drawing canvas
    userCtx.restore();
    
    const userData = userCtx.getImageData(0, 0, userCanvas.width, userCanvas.height);

    /*
     * STEP 4: Count matching pixels
     * We loop through all pixels and check if they match
     * 
     * IMAGE DATA FORMAT:
     * The data array contains 4 values per pixel: [R, G, B, A, R, G, B, A, ...]
     * So we increment by 4 to go from one pixel to the next
     * The Alpha channel (index + 3) tells us if a pixel is drawn (>128) or empty (<=128)
     */
    let templatePixels = 0;    // Total number of pixels in the template
    let matchingPixels = 0;    // Number of pixels that match

    for (let i = 0; i < templateData.data.length; i += 4) {
        const templateAlpha = templateData.data[i + 3];  // Template pixel transparency
        const userAlpha = userData.data[i + 3];          // User pixel transparency

        // If the template has a pixel here (alpha > 128 means it's drawn)
        if (templateAlpha > 128) {
            templatePixels++;
            
            // Check if the user also drew something here
            if (userAlpha > 128) {
                matchingPixels++;
            }
        }
    }

    /*
     * STEP 5: Calculate match percentage
     * If there are no template pixels (shouldn't happen), return 0%
     * Otherwise, calculate what percentage of template pixels are matched
     */
    const matchPercent = templatePixels > 0 
        ? Math.round((matchingPixels / templatePixels) * 100) 
        : 0;
    
    updateMatchPercentage(matchPercent);

    // Check if level is complete (75% match threshold)
    if (matchPercent >= 75 && !levelComplete) {
        levelComplete = true;
        onLevelComplete();
    }
}

/*
================================================================================
8. UI UPDATE FUNCTIONS
================================================================================
*/

/**
 * Update the match percentage display and encouragement message
 * Changes color based on how close the user is to completing the level
 * 
 * @param {number} percent - The match percentage (0-100)
 */
function updateMatchPercentage(percent) {
    matchPercentage.textContent = `${percent}%`;
    
    // Update color and message based on percentage
    matchPercentage.classList.remove('low', 'medium', 'high');
    
    if (percent < 50) {
        // Low score - show in red
        matchPercentage.classList.add('low');
        encouragement.textContent = encouragementMessages[0];
    } 
    else if (percent < 75) {
        // Medium score - show in yellow
        matchPercentage.classList.add('medium');
        encouragement.textContent = encouragementMessages[Math.floor(Math.random() * 2) + 1];
    } 
    else {
        // High score - show in green
        matchPercentage.classList.add('high');
        encouragement.textContent = encouragementMessages[3];
    }
}

/**
 * Called when the user completes a level (match >= 75%)
 * Shows success message and next level button
 */
function onLevelComplete() {
    // Add a flash animation to celebrate
    mirrorCanvas.classList.add('success-flash');
    setTimeout(() => {
        mirrorCanvas.classList.remove('success-flash');
    }, 600);

    // Show success message
    successMessage.classList.add('show');
    
    // Show next level button or completion message
    if (currentLevel < levels.length - 1) {
        // More levels remain
        nextLevelBtn.classList.add('show');
    } else {
        // All levels complete!
        completionMessage.classList.add('show');
    }
}

/*
================================================================================
9. LEVEL MANAGEMENT FUNCTIONS
================================================================================
*/

/**
 * Start a new level
 * Resets the canvases and updates the UI
 */
function startLevel() {
    levelComplete = false;
    clearCanvases();
    
    // Update level information display
    const level = levels[currentLevel];
    levelTitle.textContent = `Level ${level.id}: ${level.name}`;
    levelDescription.textContent = level.description;
    
    // Draw the template
    drawTemplate();
    
    // Reset match percentage
    updateMatchPercentage(0);
    
    // Hide success messages
    successMessage.classList.remove('show');
    nextLevelBtn.classList.remove('show');
    completionMessage.classList.remove('show');
}

/*
================================================================================
10. EVENT LISTENERS - MOUSE EVENTS FOR DRAWING
================================================================================
Event listeners are the core of interactive web applications.
They "listen" for user actions and execute code when those actions occur.
*/

/**
 * MOUSEDOWN EVENT
 * Triggered when the user presses the mouse button down on the canvas
 * This starts the drawing process
 */
drawCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;  // Set flag to true
    const pos = getMousePos(drawCanvas, e);
    lastX = pos.x;  // Store starting position
    lastY = pos.y;
});

/**
 * MOUSEMOVE EVENT
 * Triggered when the mouse moves over the canvas
 * If we're drawing (mouse button is down), draw a line
 */
drawCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;  // Only draw if mouse is pressed
    const pos = getMousePos(drawCanvas, e);
    draw(pos.x, pos.y);
});

/**
 * MOUSEUP EVENT
 * Triggered when the user releases the mouse button
 * This stops the drawing process
 */
drawCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

/**
 * MOUSELEAVE EVENT
 * Triggered when the mouse leaves the canvas area
 * We stop drawing to prevent weird behavior
 */
drawCanvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

/*
================================================================================
11. EVENT LISTENERS - TOUCH EVENTS FOR MOBILE
================================================================================
Touch events work similarly to mouse events but are for touchscreens.
e.preventDefault() stops the default touch behavior (like scrolling).
*/

drawCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Prevent scrolling
    isDrawing = true;
    const touch = e.touches[0];  // Get first touch point
    const pos = getMousePos(drawCanvas, touch);
    lastX = pos.x;
    lastY = pos.y;
});

drawCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const pos = getMousePos(drawCanvas, touch);
    draw(pos.x, pos.y);
});

drawCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
});

/*
================================================================================
12. EVENT LISTENERS - UI CONTROLS
================================================================================
These listeners handle button clicks and input changes.
*/

/**
 * COLOR PICKER CHANGE EVENT
 * When the user selects a new color, update the current color
 */
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
});

/**
 * BRUSH SIZE INPUT EVENT
 * When the user moves the slider, update the brush size
 * 'input' event fires continuously as the slider moves
 */
brushSize.addEventListener('input', (e) => {
    currentBrushSize = parseInt(e.target.value);
    brushSizeValue.textContent = `${currentBrushSize}px`;
});

/**
 * CLEAR BUTTON CLICK EVENT
 * Clear the canvases and reset the level
 */
clearBtn.addEventListener('click', () => {
    clearCanvases();
    updateMatchPercentage(0);
    levelComplete = false;
    successMessage.classList.remove('show');
    nextLevelBtn.classList.remove('show');
});

/**
 * NEXT LEVEL BUTTON CLICK EVENT
 * Move to the next level
 */
nextLevelBtn.addEventListener('click', () => {
    currentLevel++;
    if (currentLevel < levels.length) {
        startLevel();
    }
});

/*
================================================================================
13. APPLICATION INITIALIZATION
================================================================================
This code runs when the page loads.
It sets up the canvases and starts the first level.
*/

initCanvas();   // Set up canvas properties
startLevel();   // Start level 1

/*
================================================================================
END OF FILE
================================================================================
Congratulations! You've reached the end of the Mirror Painter code.

KEY CONCEPTS YOU LEARNED:
1. DOM Manipulation - Selecting and modifying HTML elements
2. Canvas API - Drawing shapes and lines on HTML5 canvas
3. Event-Driven Programming - Responding to user actions
4. Coordinate Transformations - Mirroring using translate() and scale()
5. Image Data Processing - Comparing pixels to calculate match percentage
6. State Management - Tracking application state with variables
7. Modular Code - Organizing code into logical functions

NEXT STEPS:
Try modifying the code to:
- Add more levels with custom shapes
- Change the match percentage threshold
- Add different brush styles
- Implement an undo feature
- Add sound effects

Happy coding!
================================================================================
*/