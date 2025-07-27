// Single player mode
class SinglePlayerMode extends BaseGameMode {
    constructor() {
        super();
        this.name = 'single';
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
            }
        };
    }

    // Single player only renders player 1
    renderWorms() {
        const player = this.players[1];
        if (!player.alive) return;

        for (let i = 0; i < player.worm.length; i++) {
            const segment = player.worm[i];
            this.drawWormSegment(segment.x, segment.y, player.color, i === 0);
        }
    }

    updateUI() {
        score1Element.textContent = this.players[1].score;
        length1Element.textContent = this.players[1].worm.length;
    }

    checkGameOver() {
        if (!this.players[1].alive) {
            this.gameOver();
        }
    }
}