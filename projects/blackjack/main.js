// Game State
const gameState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    chips: 1000,
    currentBet: 0,
    wins: 0,
    losses: 0,
    gameActive: false,
    dealerRevealed: false
};

// Card suits and ranks
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const values = {
    'A': 11, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10
};

// DOM Elements
const dealerCardsEl = document.getElementById('dealerCards');
const playerCardsEl = document.getElementById('playerCards');
const dealerValueEl = document.getElementById('dealerValue');
const playerValueEl = document.getElementById('playerValue');
const gameMessageEl = document.getElementById('gameMessage');
const chipsEl = document.getElementById('chips');
const winsEl = document.getElementById('wins');
const lossesEl = document.getElementById('losses');
const currentBetEl = document.getElementById('currentBet');
const bettingSectionEl = document.getElementById('bettingSection');
const gameControlsEl = document.getElementById('gameControls');
const themeBtn = document.getElementById('themeBtn');

// Buttons
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const newGameBtn = document.getElementById('newGameBtn');
const placeBetBtn = document.getElementById('placeBetBtn');
const customBetInput = document.getElementById('customBet');
const betButtons = document.querySelectorAll('.bet-btn');

// Sound effects (basic beep sounds using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function cardSound() {
    playSound(400, 0.1);
}

function winSound() {
    playSound(800, 0.2);
    setTimeout(() => playSound(1000, 0.2), 100);
}

function loseSound() {
    playSound(200, 0.3);
}

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('blackjack-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('blackjack-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeBtn.querySelector('.icon');
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Initialize Deck
function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    return shuffleDeck(deck);
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Card Value Calculation
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
        value += values[card.rank];
        if (card.rank === 'A') aces++;
    }
    
    // Adjust for Aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

// Display Functions
function createCardElement(card, isHidden = false) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    if (isHidden) {
        cardEl.classList.add('back');
        return cardEl;
    }
    
    const color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    cardEl.classList.add(color);
    
    cardEl.innerHTML = `
        <div class="card-rank">${card.rank}</div>
        <div class="card-suit">${card.suit}</div>
        <div class="card-rank-bottom">${card.rank}</div>
    `;
    
    return cardEl;
}

function displayHands(hideDealer = true) {
    // Display dealer hand
    dealerCardsEl.innerHTML = '';
    gameState.dealerHand.forEach((card, index) => {
        const isHidden = hideDealer && index === 1 && !gameState.dealerRevealed;
        dealerCardsEl.appendChild(createCardElement(card, isHidden));
    });
    
    // Display player hand
    playerCardsEl.innerHTML = '';
    gameState.playerHand.forEach(card => {
        playerCardsEl.appendChild(createCardElement(card));
    });
    
    // Update values
    const dealerValue = calculateHandValue(gameState.dealerHand);
    const playerValue = calculateHandValue(gameState.playerHand);
    
    if (hideDealer && !gameState.dealerRevealed) {
        const firstCardValue = values[gameState.dealerHand[0].rank];
        dealerValueEl.textContent = firstCardValue;
    } else {
        dealerValueEl.textContent = dealerValue;
    }
    
    playerValueEl.textContent = playerValue;
}

function updateStats() {
    chipsEl.textContent = gameState.chips;
    winsEl.textContent = gameState.wins;
    lossesEl.textContent = gameState.losses;
    currentBetEl.textContent = gameState.currentBet;
}

function showMessage(message, type = '') {
    gameMessageEl.textContent = message;
    gameMessageEl.className = 'game-message';
    if (type) {
        gameMessageEl.classList.add(type);
    }
}

// Betting Functions
function placeBet(amount) {
    if (amount > gameState.chips) {
        showMessage('Not enough chips!', 'lose');
        return false;
    }
    
    if (amount <= 0) {
        showMessage('Invalid bet amount!', 'lose');
        return false;
    }
    
    gameState.currentBet = amount;
    gameState.chips -= amount;
    updateStats();
    startGame();
    return true;
}

// Game Flow
function startGame() {
    gameState.deck = createDeck();
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.gameActive = true;
    gameState.dealerRevealed = false;
    
    showMessage('');
    bettingSectionEl.style.display = 'none';
    gameControlsEl.style.display = 'flex';
    
    // Deal initial cards
    setTimeout(() => {
        dealCard(gameState.playerHand);
        cardSound();
    }, 200);
    
    setTimeout(() => {
        dealCard(gameState.dealerHand);
        cardSound();
    }, 400);
    
    setTimeout(() => {
        dealCard(gameState.playerHand);
        cardSound();
    }, 600);
    
    setTimeout(() => {
        dealCard(gameState.dealerHand);
        cardSound();
        displayHands(true);
        checkForBlackjack();
    }, 800);
}

function dealCard(hand) {
    const card = gameState.deck.pop();
    hand.push(card);
    displayHands(!gameState.dealerRevealed);
}

function checkForBlackjack() {
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    if (playerValue === 21) {
        if (dealerValue === 21) {
            endGame('draw', 'Both Blackjack! Push!');
        } else {
            endGame('win', 'Blackjack! You Win!');
        }
    }
}

function hit() {
    if (!gameState.gameActive) return;
    
    dealCard(gameState.playerHand);
    cardSound();
    
    const playerValue = calculateHandValue(gameState.playerHand);
    
    if (playerValue > 21) {
        endGame('lose', 'Bust! You Lose!');
    } else if (playerValue === 21) {
        stand();
    }
}

function stand() {
    if (!gameState.gameActive) return;
    
    gameState.dealerRevealed = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    
    dealerPlay();
}

function dealerPlay() {
    displayHands(false);
    
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    if (dealerValue < 17) {
        setTimeout(() => {
            dealCard(gameState.dealerHand);
            cardSound();
            dealerPlay();
        }, 1000);
    } else {
        determineWinner();
    }
}

function determineWinner() {
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    if (dealerValue > 21) {
        endGame('win', 'Dealer Busts! You Win!');
    } else if (playerValue > dealerValue) {
        endGame('win', 'You Win!');
    } else if (dealerValue > playerValue) {
        endGame('lose', 'Dealer Wins!');
    } else {
        endGame('draw', 'Push! It\'s a Draw!');
    }
}

function endGame(result, message) {
    gameState.gameActive = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    
    showMessage(message, result);
    
    if (result === 'win') {
        const isBlackjack = calculateHandValue(gameState.playerHand) === 21 && 
                           gameState.playerHand.length === 2;
        const winnings = isBlackjack ? 
                        Math.floor(gameState.currentBet * 2.5) : 
                        gameState.currentBet * 2;
        gameState.chips += winnings;
        gameState.wins++;
        winSound();
    } else if (result === 'lose') {
        gameState.losses++;
        loseSound();
    } else {
        gameState.chips += gameState.currentBet;
        cardSound();
    }
    
    updateStats();
    
    if (gameState.chips <= 0) {
        setTimeout(() => {
            alert('Game Over! You\'re out of chips. Resetting...');
            resetGame();
        }, 2000);
    }
}

function newGame() {
    if (gameState.chips <= 0) {
        resetGame();
        return;
    }
    
    gameState.currentBet = 0;
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.gameActive = false;
    gameState.dealerRevealed = false;
    
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';
    dealerValueEl.textContent = '0';
    playerValueEl.textContent = '0';
    showMessage('');
    
    bettingSectionEl.style.display = 'block';
    gameControlsEl.style.display = 'none';
    customBetInput.value = '';
    
    hitBtn.disabled = false;
    standBtn.disabled = false;
    
    updateStats();
}

function resetGame() {
    gameState.chips = 1000;
    gameState.wins = 0;
    gameState.losses = 0;
    newGame();
}

// Event Listeners
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
newGameBtn.addEventListener('click', newGame);
themeBtn.addEventListener('click', toggleTheme);

betButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const betAmount = parseInt(btn.dataset.bet);
        placeBet(betAmount);
    });
});

placeBetBtn.addEventListener('click', () => {
    const betAmount = parseInt(customBetInput.value);
    if (betAmount) {
        placeBet(betAmount);
    } else {
        showMessage('Enter a valid bet amount!', 'lose');
    }
});

customBetInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const betAmount = parseInt(customBetInput.value);
        if (betAmount) {
            placeBet(betAmount);
        }
    }
});

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (!gameState.gameActive) return;
    
    if (e.key === 'h' || e.key === 'H') {
        hit();
    } else if (e.key === 's' || e.key === 'S') {
        stand();
    }
});

// Initialize
initTheme();
updateStats();