// Get references to the HTML elements
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const resetButton = document.getElementById('resetButton');
const message = document.getElementById('message');
const attemptsDisplay = document.getElementById('attempts');

// Game variables
let randomNumber;
let attempts;
const MIN_NUM = 1;
const MAX_NUM = 100;

// Function to start a new game or reset the current one
function newGame() {
    // 1. Generate a new random number
    randomNumber = Math.floor(Math.random() * (MAX_NUM - MIN_NUM + 1)) + MIN_NUM;
    console.log(`The secret number is: ${randomNumber}`); // For testing purposes

    // 2. Reset the number of attempts
    attempts = 0;
    attemptsDisplay.textContent = `Attempts: ${attempts}`;

    // 3. Clear messages and input field
    message.textContent = '';
    guessInput.value = '';

    // 4. Re-enable input and guess button, hide reset button
    guessInput.disabled = false;
    guessButton.disabled = false;
    resetButton.style.display = 'none'; // Hide the reset button
    message.style.color = '#333'; // Default text color
}

// Function to handle the user's guess
function checkGuess() {
    const userGuess = parseInt(guessInput.value);

    // Validate the input
    if (isNaN(userGuess) || userGuess < MIN_NUM || userGuess > MAX_NUM) {
        message.textContent = `Please enter a valid number between ${MIN_NUM} and ${MAX_NUM}.`;
        message.style.color = 'orange'; // Will be mapped to var(--warning-color) by CSS
        return;
    }

    // Increment attempts
    attempts++;
    attemptsDisplay.textContent = `Attempts: ${attempts}`;

    // Compare the guess and provide feedback
    if (userGuess < randomNumber) {
        message.textContent = 'Too Low! Try again.';
        message.style.color = '#3498db'; // Will be mapped by CSS
    } else if (userGuess > randomNumber) {
        message.textContent = 'Too High! Try again.';
        message.style.color = '#e74c3c'; // Will be mapped to var(--error-color) by CSS
    } else {
        message.textContent = `Correct! You guessed the number ${randomNumber} in ${attempts} attempts! 🎉`;
        message.style.color = '#2ecc71'; // Will be mapped to var(--success-color) by CSS
        endGame();
    }

    // Clear the input for the next guess
    guessInput.value = '';
    guessInput.focus();
}

// Function to end the game when the number is guessed correctly
function endGame() {
    guessInput.disabled = true;
    guessButton.disabled = true;
    resetButton.style.display = 'inline-block'; // Show the reset button
}

// Event Listeners
guessButton.addEventListener('click', checkGuess);
resetButton.addEventListener('click', newGame);

// Allow pressing "Enter" to submit a guess
guessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !guessButton.disabled) { // Ensure button is not disabled
        checkGuess();
    }
});


// Initialize the game when the page loads
newGame();