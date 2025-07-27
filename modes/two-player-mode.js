// Two player competitive mode
class TwoPlayerMode extends BaseGameMode {
    constructor() {
        super();
        this.name = 'two';
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

    // Two-player strategic eating mechanic
    checkPlayerCollision(head, player, playerId) {
        const otherPlayerId = playerId === '1' ? '2' : '1';
        const otherPlayer = this.players[otherPlayerId];
        
        if (!otherPlayer.alive) return false;

        // Check if hitting other player's head (both die)
        if (head.x === otherPlayer.worm[0].x && head.y === otherPlayer.worm[0].y) {
            player.alive = false;
            otherPlayer.alive = false;
            return true;
        }

        // Check if eating other player's body
        for (let i = 1; i < otherPlayer.worm.length; i++) {
            if (head.x === otherPlayer.worm[i].x && head.y === otherPlayer.worm[i].y) {
                const eatenSegments = otherPlayer.worm.length - i;
                const currentPlayerLength = player.worm.length;

                // Strategic rule: Can only eat if you can handle it
                if (eatenSegments >= currentPlayerLength) {
                    player.alive = false;
                    return true;
                }

                // Safe to eat
                otherPlayer.worm = otherPlayer.worm.slice(0, i);
                player.score += eatenSegments * 5;

                for (let j = 0; j < eatenSegments; j++) {
                    player.worm.push(player.worm[player.worm.length - 1]);
                }

                playSound('bite');
                return false; // Don't remove tail since we grew
            }
        }

        return false;
    }

    render() {
        // Clear canvas
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw center line
        ctx.strokeStyle = '#7f8c8d';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        this.renderWorms();
        this.renderFood();
    }

    updateUI() {
        score1Element.textContent = this.players[1].score;
        length1Element.textContent = this.players[1].worm.length;
        score2Element.textContent = this.players[2].score;
        length2Element.textContent = this.players[2].worm.length;
    }

    checkGameOver() {
        const player1Alive = this.players[1].alive;
        const player2Alive = this.players[2].alive;

        if (!player1Alive && !player2Alive) {
            // Both dead - longest worm wins
            if (this.players[1].worm.length > this.players[2].worm.length) {
                this.gameOver('player1');
            } else if (this.players[2].worm.length > this.players[1].worm.length) {
                this.gameOver('player2');
            } else {
                this.gameOver('tie');
            }
        } else if (!player1Alive) {
            this.gameOver('player2');
        } else if (!player2Alive) {
            this.gameOver('player1');
        } else {
            // Check length difference win condition
            const lengthDifference = Math.abs(this.players[1].worm.length - this.players[2].worm.length);
            if (lengthDifference >= 20) {
                if (this.players[1].worm.length > this.players[2].worm.length) {
                    this.gameOver('player1', 'length');
                } else {
                    this.gameOver('player2', 'length');
                }
            }
        }
    }

    gameOver(winner = null, reason = null) {
        this.gameRunning = false;
        stopFoodTimer();
        
        let message = 'Game Over! Tap to restart';

        if (winner === 'player1') {
            message = reason === 'length' ?
                `Player 1 Wins by Length (${this.players[1].worm.length})! Tap to restart` :
                'Player 1 Wins! Tap to restart';
            playSound('victory');
        } else if (winner === 'player2') {
            message = reason === 'length' ?
                `Player 2 Wins by Length (${this.players[2].worm.length})! Tap to restart` :
                'Player 2 Wins! Tap to restart';
            playSound('victory');
        } else if (winner === 'tie') {
            message = 'Tie Game! Tap to restart';
            playSound('gameOver');
        } else {
            playSound('gameOver');
        }

        gameOverElement.textContent = message;
        gameOverElement.style.display = 'block';
    }
}