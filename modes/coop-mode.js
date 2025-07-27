// Cooperative mode
class CoopMode extends BaseGameMode {
    constructor() {
        super();
        this.name = 'coop';
        this.coopTimer = null;
        this.coopTimeLeft = 60;
        this.coopPairsCollected = 0;
        this.coopFoodPairs = [];
    }

    initPlayers() {
        this.players = {
            1: {
                worm: [{ x: 5, y: 10 }],
                dx: 1,
                dy: 0,
                score: 0,
                color: '#2ecc71',
                inputBuffer: null,
                alive: true
            },
            2: {
                worm: [{ x: 15, y: 10 }],
                dx: -1,
                dy: 0,
                score: 0,
                color: '#3498db',
                inputBuffer: null,
                alive: true
            }
        };
    }

    initFood() {
        this.food = [];
        this.coopFoodPairs = [];
        this.addCoopFoodPair();
    }

    addCoopFoodPair() {
        const pair = {
            green: { ...this.randomFood(), color: '#2ecc71', eaten: false },
            blue: { ...this.randomFood(), color: '#3498db', eaten: false }
        };
        this.coopFoodPairs.push(pair);
    }

    init() {
        super.init();
        this.startCoopTimer();
    }

    startCoopTimer() {
        if (this.coopTimer) {
            clearInterval(this.coopTimer);
        }
        this.coopTimeLeft = 60;
        this.coopPairsCollected = 0;
        coopTimeElement.textContent = this.coopTimeLeft;
        coopPairsElement.textContent = this.coopPairsCollected;
        
        this.coopTimer = setInterval(() => {
            this.coopTimeLeft--;
            coopTimeElement.textContent = this.coopTimeLeft;
            
            if (this.coopTimeLeft <= 0) {
                this.gameOver('coop', 'time');
            }
        }, 1000);
    }

    stopCoopTimer() {
        if (this.coopTimer) {
            clearInterval(this.coopTimer);
            this.coopTimer = null;
        }
    }

    // Coop mode collision rules
    checkPlayerCollision(head, player, playerId) {
        const otherPlayerId = playerId === '1' ? '2' : '1';
        const otherPlayer = this.players[otherPlayerId];
        
        if (!otherPlayer.alive) return false;

        for (let segment of otherPlayer.worm) {
            if (head.x === segment.x && head.y === segment.y) {
                if (difficultySelect.value === 'normal') {
                    // Normal mode: collision = death for both
                    player.alive = false;
                    otherPlayer.alive = false;
                    return true;
                }
                // Easy mode: pass through each other
                break;
            }
        }
        return false;
    }

    // Coop food collision logic
    checkFoodCollision(head, player, playerId) {
        for (let pairIndex = 0; pairIndex < this.coopFoodPairs.length; pairIndex++) {
            const pair = this.coopFoodPairs[pairIndex];

            // Check if green worm (player 1) eats green food
            if (playerId === '1' && !pair.green.eaten &&
                head.x === pair.green.x && head.y === pair.green.y) {
                pair.green.eaten = true;
                playSound('eat');
                this.checkPairCompletion();
                return true;
            }

            // Check if blue worm (player 2) eats blue food
            if (playerId === '2' && !pair.blue.eaten &&
                head.x === pair.blue.x && head.y === pair.blue.y) {
                pair.blue.eaten = true;
                playSound('eat');
                this.checkPairCompletion();
                return true;
            }
        }
        return false;
    }

    checkPairCompletion() {
        // Check if any pairs are complete
        for (let i = this.coopFoodPairs.length - 1; i >= 0; i--) {
            const pair = this.coopFoodPairs[i];
            if (pair.green.eaten && pair.blue.eaten) {
                this.coopFoodPairs.splice(i, 1);
                this.coopPairsCollected++;
                coopPairsElement.textContent = this.coopPairsCollected;
                this.addCoopFoodPair();
                playSound('victory');
            }
        }
    }

    renderFood() {
        // Draw colored food pairs for coop mode
        for (let pair of this.coopFoodPairs) {
            if (!pair.green.eaten) {
                ctx.fillStyle = pair.green.color;
                ctx.fillRect(pair.green.x * gridSize, pair.green.y * gridSize, gridSize - 2, gridSize - 2);
            }
            if (!pair.blue.eaten) {
                ctx.fillStyle = pair.blue.color;
                ctx.fillRect(pair.blue.x * gridSize, pair.blue.y * gridSize, gridSize - 2, gridSize - 2);
            }
        }
    }

    updateUI() {
        // Coop mode doesn't show individual scores, just pairs and time
        coopPairsElement.textContent = this.coopPairsCollected;
        coopTimeElement.textContent = this.coopTimeLeft;
    }

    checkGameOver() {
        // Coop mode: check if both players are dead
        if (!this.players[1].alive && !this.players[2].alive) {
            this.gameOver('coop', 'death');
        }
        // Timer-based game over is handled in startCoopTimer
    }

    gameOver(winner = null, reason = null) {
        this.gameRunning = false;
        this.stopCoopTimer();
        
        let message = 'Game Over! Tap to restart';

        if (winner === 'coop') {
            if (reason === 'time') {
                message = `Time's Up! Collected ${this.coopPairsCollected} pairs! Tap to restart`;
            } else if (reason === 'death') {
                message = `Both worms died! Collected ${this.coopPairsCollected} pairs! Tap to restart`;
            }
        }
        
        playSound('gameOver');
        gameOverElement.textContent = message;
        gameOverElement.style.display = 'block';
    }

    addFood() {
        this.addCoopFoodPair();
    }

    cleanup() {
        super.cleanup();
        this.stopCoopTimer();
    }
}