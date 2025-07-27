// Base game mode class that other modes extend
class BaseGameMode {
    constructor() {
        this.name = 'base';
        this.players = {};
        this.food = [];
        this.gameRunning = true;
    }

    // Initialize the mode
    init() {
        this.gameRunning = true; // Make sure game is running
        this.initPlayers();
        this.initFood();
    }

    // Initialize players - override in subclasses
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

    // Initialize food - override in subclasses
    initFood() {
        this.food = [];
        this.food.push(this.randomFood());
        this.food.push(this.randomFood());
    }

    // Generate random food position
    randomFood() {
        let newFood;
        let validPosition = false;

        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };

            validPosition = true;
            // Check if food spawns on any worm
            for (let playerId in this.players) {
                if (!this.players[playerId].alive) continue;
                for (let segment of this.players[playerId].worm) {
                    if (segment.x === newFood.x && segment.y === newFood.y) {
                        validPosition = false;
                        break;
                    }
                }
                if (!validPosition) break;
            }
        }

        return newFood;
    }

    // Update game state - override in subclasses
    update() {
        if (!this.gameRunning) return;

        // Update all active players
        for (let playerId in this.players) {
            this.updatePlayer(playerId);
        }

        this.updateUI();
        this.checkGameOver();
    }

    // Update individual player
    updatePlayer(playerId) {
        const player = this.players[playerId];
        if (!player.alive) return;

        // Process buffered input
        if (player.inputBuffer) {
            const { newDx, newDy } = player.inputBuffer;
            player.dx = newDx;
            player.dy = newDy;
            player.inputBuffer = null;
        }

        const head = {
            x: player.worm[0].x + player.dx,
            y: player.worm[0].y + player.dy
        };

        // Check wall collision
        if (this.checkWallCollision(head, player)) return;

        // Check self collision
        if (this.checkSelfCollision(head, player)) return;

        // Check other player collision
        if (this.checkPlayerCollision(head, player, playerId)) return;

        player.worm.unshift(head);

        // Check food collision
        const ateFood = this.checkFoodCollision(head, player, playerId);

        if (!ateFood) {
            player.worm.pop();
        }
    }

    // Wall collision logic
    checkWallCollision(head, player) {
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            if (difficultySelect.value === 'easy') {
                const chosenDir = this.findBestDirection(player);
                if (chosenDir) {
                    player.dx = chosenDir.dx;
                    player.dy = chosenDir.dy;
                    head.x = player.worm[0].x + player.dx;
                    head.y = player.worm[0].y + player.dy;
                    return false;
                }
            }
            player.alive = false;
            return true;
        }
        return false;
    }

    // Self collision logic
    checkSelfCollision(head, player) {
        if (difficultySelect.value === 'normal') {
            for (let segment of player.worm) {
                if (head.x === segment.x && head.y === segment.y) {
                    player.alive = false;
                    return true;
                }
            }
        }
        return false;
    }

    // Player collision logic - override in subclasses
    checkPlayerCollision(head, player, playerId) {
        return false; // No player collision in base mode
    }

    // Food collision logic - override in subclasses
    checkFoodCollision(head, player, playerId) {
        for (let i = 0; i < this.food.length; i++) {
            if (head.x === this.food[i].x && head.y === this.food[i].y) {
                player.score += 10;
                this.food[i] = this.randomFood();
                playSound('eat');
                return true;
            }
        }
        return false;
    }

    // Find best direction for auto-turn
    findBestDirection(player) {
        const possibleDirections = [];
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 1, dy: 0, name: 'right' }
        ];

        for (let dir of directions) {
            if (dir.dx === -player.dx && dir.dy === -player.dy) continue;

            const testHead = {
                x: player.worm[0].x + dir.dx,
                y: player.worm[0].y + dir.dy
            };

            if (testHead.x >= 0 && testHead.x < tileCountX &&
                testHead.y >= 0 && testHead.y < tileCountY) {

                let hitsSelf = false;
                for (let segment of player.worm) {
                    if (testHead.x === segment.x && testHead.y === segment.y) {
                        hitsSelf = true;
                        break;
                    }
                }

                possibleDirections.push({ ...dir, hitsSelf });
            }
        }

        if (possibleDirections.length > 0) {
            const safeDirs = possibleDirections.filter(dir => !dir.hitsSelf);
            return safeDirs.length > 0 ? safeDirs[0] : possibleDirections[0];
        }

        return null;
    }

    // Render the game - override in subclasses
    render() {
        // Clear canvas
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.renderWorms();
        this.renderFood();
    }

    // Render worms
    renderWorms() {
        for (let playerId in this.players) {
            if (!this.players[playerId].alive) continue;
            const player = this.players[playerId];

            for (let i = 0; i < player.worm.length; i++) {
                const segment = player.worm[i];
                this.drawWormSegment(segment.x, segment.y, player.color, i === 0);
            }
        }
    }

    // Render food
    renderFood() {
        ctx.fillStyle = '#e74c3c';
        for (let f of this.food) {
            ctx.fillRect(f.x * gridSize, f.y * gridSize, gridSize - 2, gridSize - 2);
        }
    }

    // Draw worm segment
    drawWormSegment(x, y, color, isHead = false) {
        const segX = x * gridSize;
        const segY = y * gridSize;
        const size = gridSize - 2;

        ctx.fillStyle = color;
        ctx.fillRect(segX, segY, size, size);

        if (isHead) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(segX + 3, segY + 3, 3, 3);
            ctx.fillRect(segX + size - 6, segY + 3, 3, 3);
        }
    }

    // Update UI - override in subclasses
    updateUI() {
        score1Element.textContent = this.players[1].score;
        length1Element.textContent = this.players[1].worm.length;
    }

    // Check game over conditions - override in subclasses
    checkGameOver() {
        if (!this.players[1].alive) {
            this.gameOver();
        }
    }

    // Handle game over
    gameOver(winner = null, reason = null) {
        this.gameRunning = false;
        stopFoodTimer();
        stopCoopTimer();
        
        // Clear any active virtual joystick
        if (typeof clearVirtualJoystick === 'function') {
            clearVirtualJoystick();
        }
        
        let message = 'Game Over! Tap to restart';
        playSound('gameOver');

        // Show leaderboard when game ends
        setTimeout(() => {
            showLeaderboard();
        }, 100);

        // Check for high score in single player mode
        if (this.name === 'single' && this.players[1]) {
            const finalScore = this.players[1].score;
            if (finalScore > 0) {
                setTimeout(() => {
                    checkHighScore(finalScore, 'single');
                }, 500); // Small delay to let game over message show first
            }
        }

        gameOverElement.textContent = message;
        gameOverElement.style.display = 'block';
    }

    // Handle input
    handleInput(direction, playerId = '1') {
        const player = this.players[playerId];
        if (!player || !player.alive || player.inputBuffer) return;

        switch (direction) {
            case 'up':
                if (player.dy !== 1) {
                    player.inputBuffer = { newDx: 0, newDy: -1 };
                }
                break;
            case 'down':
                if (player.dy !== -1) {
                    player.inputBuffer = { newDx: 0, newDy: 1 };
                }
                break;
            case 'left':
                if (player.dx !== 1) {
                    player.inputBuffer = { newDx: -1, newDy: 0 };
                }
                break;
            case 'right':
                if (player.dx !== -1) {
                    player.inputBuffer = { newDx: 1, newDy: 0 };
                }
                break;
        }
    }

    // Add food periodically
    addFood() {
        this.food.push(this.randomFood());
    }

    // Cleanup when switching modes
    cleanup() {
        this.gameRunning = false;
    }
}