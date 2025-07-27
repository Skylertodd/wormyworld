// Game elements - will be initialized after DOM is ready
let canvas, ctx, gameSpeedSelect, boardSizeSelect, difficultySelect, gameOverElement;
let singlePlayerBtn, twoPlayerBtn, coopPlayerBtn, player2Info, coopInfo;
let singlePlayerControls, twoPlayerControls, coopControls;
let score1Element, score2Element, length1Element, length2Element;
let coopPairsElement, coopTimeElement;

const gridSize = 20;
let tileCountX, tileCountY;

// Board size configurations (mobile-friendly)
const boardSizes = {
    small: { width: 300, height: 200 },
    medium: { width: 400, height: 300 },
    large: { width: 500, height: 350 },
    fullscreen: { width: 'auto', height: 'auto' }
};

// Game state
let currentMode = null;
let gameInterval;
let foodTimer = null;

// Make currentMode accessible globally for mobile controls
window.currentMode = null;

// Leaderboard elements
let highScoreModal, playerNameInput, saveScoreBtn, skipScoreBtn;
let newHighScoreElement, leaderboardList, clearScoresBtn, leaderboardClose, showLeaderboardBtn;

// Mode instances - will be initialized after DOM is ready
let modes = {};

// Start food timer
function startFoodTimer() {
    if (foodTimer) {
        clearInterval(foodTimer);
    }
    foodTimer = setInterval(() => {
        if (currentMode) {
            currentMode.addFood();
        }
    }, 15000);
}

// Stop food timer
function stopFoodTimer() {
    if (foodTimer) {
        clearInterval(foodTimer);
        foodTimer = null;
    }
}

// Stop coop timer (for compatibility)
function stopCoopTimer() {
    if (currentMode && currentMode.stopCoopTimer) {
        currentMode.stopCoopTimer();
    }
}

// Change board size
function changeBoardSize() {
    const selectedSize = boardSizeSelect.value;
    const gameContainer = document.querySelector('.game-container');

    if (selectedSize === 'fullscreen') {
        gameContainer.classList.add('fullscreen');

        // Force a layout update before calculating dimensions
        gameContainer.offsetHeight;

        // Calculate available space for the canvas
        // Account for other elements (controls, scores, etc.)
        const otherElementsHeight = 220; // Approximate height of controls and info
        const availableWidth = Math.min(window.innerWidth - 40, 1200); // Max width with padding
        const availableHeight = window.innerHeight - otherElementsHeight;

        // Make sure dimensions are multiples of gridSize for clean gameplay
        const width = Math.floor(availableWidth / gridSize) * gridSize;
        const height = Math.floor(availableHeight / gridSize) * gridSize;

        canvas.width = Math.max(width, 400); // Minimum width
        canvas.height = Math.max(height, 300); // Minimum height
    } else {
        gameContainer.classList.remove('fullscreen');
        const size = boardSizes[selectedSize];
        canvas.width = size.width;
        canvas.height = size.height;
    }

    // Update tile counts after canvas dimensions are set
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;

    // Force canvas to update its display size
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';

    restart();
}

// Restart game
function restart() {
    if (currentMode) {
        currentMode.cleanup();
        currentMode.init();
        gameOverElement.style.display = 'none';
        hideLeaderboard(); // Hide leaderboard when game starts
        updateGameSpeed();
        // Don't start food timer here - it will be started when game begins
    }
}

// Update game speed
function updateGameSpeed() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    const speed = parseInt(gameSpeedSelect.value);
    gameInterval = setInterval(gameLoop, speed);
}

// Game loop
function gameLoop() {
    if (currentMode) {
        currentMode.update();
        currentMode.render();
    }
}

// Handle input
function handleInput(direction, playerId = '1') {
    initAudioOnInteraction();

    if (currentMode) {
        currentMode.handleInput(direction, playerId);
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    initAudioOnInteraction();

    // Handle space/enter for starting game or restarting
    if (e.code === 'Space' || e.code === 'Enter') {
        if (!currentMode) return;
        
        if (currentMode.waitingToStart) {
            // Start the game if waiting
            currentMode.startGame();
        } else if (!currentMode.gameRunning) {
            // Restart if game is over
            restart();
        }
        return;
    }

    // Only process movement keys if game is running
    if (!currentMode || !currentMode.gameRunning) {
        return;
    }

    // Player 1 controls (Arrow keys)
    switch (e.code) {
        case 'ArrowUp':
            handleInput('up', '1');
            break;
        case 'ArrowDown':
            handleInput('down', '1');
            break;
        case 'ArrowLeft':
            handleInput('left', '1');
            break;
        case 'ArrowRight':
            handleInput('right', '1');
            break;
    }

    // Player 2 controls (WASD) - only in two-player or coop mode
    if (currentMode.name === 'two' || currentMode.name === 'coop') {
        switch (e.code) {
            case 'KeyW':
                handleInput('up', '2');
                break;
            case 'KeyS':
                handleInput('down', '2');
                break;
            case 'KeyA':
                handleInput('left', '2');
                break;
            case 'KeyD':
                handleInput('right', '2');
                break;
        }
    }
});

// Game mode switching
function switchToSinglePlayer() {
    if (currentMode) {
        currentMode.cleanup();
    }
    currentMode = modes.single;
    window.currentMode = currentMode; // Update global reference

    singlePlayerBtn.classList.add('active');
    twoPlayerBtn.classList.remove('active');
    coopPlayerBtn.classList.remove('active');
    player2Info.style.display = 'none';
    coopInfo.style.display = 'none';
    singlePlayerControls.style.display = 'block';
    twoPlayerControls.style.display = 'none';
    coopControls.style.display = 'none';
    document.getElementById('player2Controls').style.display = 'none';

    restart();
}

function switchToTwoPlayer() {
    if (currentMode) {
        currentMode.cleanup();
    }
    currentMode = modes.two;
    window.currentMode = currentMode; // Update global reference

    twoPlayerBtn.classList.add('active');
    singlePlayerBtn.classList.remove('active');
    coopPlayerBtn.classList.remove('active');
    player2Info.style.display = 'block';
    coopInfo.style.display = 'none';
    singlePlayerControls.style.display = 'none';
    twoPlayerControls.style.display = 'block';
    coopControls.style.display = 'none';
    document.getElementById('player2Controls').style.display = 'block';

    restart();
}

function switchToCoopPlayer() {
    if (currentMode) {
        currentMode.cleanup();
    }
    currentMode = modes.coop;
    window.currentMode = currentMode; // Update global reference

    coopPlayerBtn.classList.add('active');
    singlePlayerBtn.classList.remove('active');
    twoPlayerBtn.classList.remove('active');
    player2Info.style.display = 'none';
    coopInfo.style.display = 'block';
    singlePlayerControls.style.display = 'none';
    twoPlayerControls.style.display = 'none';
    coopControls.style.display = 'block';
    document.getElementById('player2Controls').style.display = 'block';

    restart();
}

// Leaderboard functionality
function getHighScores() {
    const scores = localStorage.getItem('wormGameScores');
    return scores ? JSON.parse(scores) : [];
}

function saveHighScore(name, score, mode) {
    const scores = getHighScores();
    scores.push({
        name: name.toUpperCase().substring(0, 6),
        score: score,
        mode: mode,
        date: new Date().toISOString()
    });

    // Sort by score (highest first) and keep only top 10
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 10);

    localStorage.setItem('wormGameScores', JSON.stringify(topScores));
    updateLeaderboardDisplay();
}

function isHighScore(score) {
    const scores = getHighScores();
    return scores.length < 5 || score > (scores[4]?.score || 0);
}

function showHighScoreModal(score, mode) {
    newHighScoreElement.textContent = score;
    playerNameInput.value = '';
    highScoreModal.style.display = 'flex';
    playerNameInput.focus();

    // Store the score and mode for saving
    highScoreModal.dataset.score = score;
    highScoreModal.dataset.mode = mode;
}

function hideHighScoreModal() {
    highScoreModal.style.display = 'none';
}

function updateLeaderboardDisplay() {
    const scores = getHighScores();
    leaderboardList.innerHTML = '';

    if (scores.length === 0) {
        leaderboardList.innerHTML = '<div class="no-scores">No scores yet - play to set a record!</div>';
        return;
    }

    // Show top 5 scores
    const topScores = scores.slice(0, 5);
    topScores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = `leaderboard-entry rank-${index + 1}`;

        const rank = index + 1;
        let rankIcon = '';
        if (rank === 1) rankIcon = '🥇';
        else if (rank === 2) rankIcon = '🥈';
        else if (rank === 3) rankIcon = '🥉';
        else rankIcon = `#${rank}`;

        entry.innerHTML = `
            <span class="leaderboard-rank">${rankIcon}</span>
            <span class="leaderboard-name">${score.name}</span>
            <span class="leaderboard-score">${score.score}</span>
        `;

        leaderboardList.appendChild(entry);
    });
}

function showLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.classList.add('show');
}

function hideLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.classList.remove('show');
}

function clearHighScores() {
    if (confirm('Are you sure you want to clear all high scores?')) {
        localStorage.removeItem('wormGameScores');
        updateLeaderboardDisplay();
    }
}

// Check for high score when game ends
function checkHighScore(score, mode) {
    if (isHighScore(score)) {
        showHighScoreModal(score, mode);
    }
}

// Event listeners will be set up in initializeGame()

// Initialize modes and start game
function initializeGame() {
    // Initialize DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    gameSpeedSelect = document.getElementById('gameSpeed');
    boardSizeSelect = document.getElementById('boardSize');
    difficultySelect = document.getElementById('difficulty');
    gameOverElement = document.getElementById('gameOver');
    singlePlayerBtn = document.getElementById('singlePlayer');
    twoPlayerBtn = document.getElementById('twoPlayer');
    coopPlayerBtn = document.getElementById('coopPlayer');
    player2Info = document.getElementById('player2Info');
    coopInfo = document.getElementById('coopInfo');
    singlePlayerControls = document.getElementById('singlePlayerControls');
    twoPlayerControls = document.getElementById('twoPlayerControls');
    coopControls = document.getElementById('coopControls');
    score1Element = document.getElementById('score1');
    score2Element = document.getElementById('score2');
    length1Element = document.getElementById('length1');
    length2Element = document.getElementById('length2');
    coopPairsElement = document.getElementById('coopPairs');
    coopTimeElement = document.getElementById('coopTime');

    // Initialize leaderboard elements
    highScoreModal = document.getElementById('highScoreModal');
    playerNameInput = document.getElementById('playerNameInput');
    saveScoreBtn = document.getElementById('saveScoreBtn');
    skipScoreBtn = document.getElementById('skipScoreBtn');
    newHighScoreElement = document.getElementById('newHighScore');
    leaderboardList = document.getElementById('leaderboardList');
    clearScoresBtn = document.getElementById('clearScoresBtn');
    leaderboardClose = document.getElementById('leaderboardClose');
    showLeaderboardBtn = document.getElementById('showLeaderboard');

    // Initialize tile counts
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;

    // Initialize mode instances
    modes = {
        single: new SinglePlayerMode(),
        two: new TwoPlayerMode(),
        coop: new CoopMode()
    };

    // Set up event listeners
    singlePlayerBtn.addEventListener('click', switchToSinglePlayer);
    twoPlayerBtn.addEventListener('click', switchToTwoPlayer);
    coopPlayerBtn.addEventListener('click', switchToCoopPlayer);
    gameSpeedSelect.addEventListener('change', updateGameSpeed);
    boardSizeSelect.addEventListener('change', changeBoardSize);

    // Window resize handler for fullscreen mode
    window.addEventListener('resize', () => {
        if (boardSizeSelect.value === 'fullscreen') {
            changeBoardSize();
        }
    });

    // Game over click/tap to restart
    gameOverElement.addEventListener('click', () => {
        if (!currentMode) return;
        
        if (currentMode.waitingToStart) {
            // Start the game if waiting
            currentMode.startGame();
        } else if (!currentMode.gameRunning) {
            // Restart if game is over
            restart();
        }
    });

    // Leaderboard event listeners
    saveScoreBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim() || 'ANON';
        const score = parseInt(highScoreModal.dataset.score);
        const mode = highScoreModal.dataset.mode;

        saveHighScore(name, score, mode);
        hideHighScoreModal();
    });

    skipScoreBtn.addEventListener('click', () => {
        hideHighScoreModal();
    });

    clearScoresBtn.addEventListener('click', clearHighScores);

    // Leaderboard close button
    leaderboardClose.addEventListener('click', hideLeaderboard);

    // Show leaderboard button
    showLeaderboardBtn.addEventListener('click', showLeaderboard);

    // Close leaderboard when clicking outside the modal content
    document.getElementById('leaderboard').addEventListener('click', (e) => {
        if (e.target.id === 'leaderboard') {
            hideLeaderboard();
        }
    });

    // Handle escape key to close leaderboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const leaderboard = document.getElementById('leaderboard');
            if (leaderboard.classList.contains('show')) {
                hideLeaderboard();
            }
        }
    });

    // Handle Enter key in name input
    playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveScoreBtn.click();
        } else if (e.key === 'Escape') {
            skipScoreBtn.click();
        }
    });

    // Initialize leaderboard display
    updateLeaderboardDisplay();
    // Don't show leaderboard initially - it's now a modal

    switchToSinglePlayer(); // Start with single player mode
    
    // Initialize board size after mode is set
    changeBoardSize();
    
    updateGameSpeed(); // Ensure game loop starts immediately
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGame);

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    initializeGame();
}