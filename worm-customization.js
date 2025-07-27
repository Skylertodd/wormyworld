// Worm Customization System
class WormCustomization {
    constructor() {
        this.defaultCustomization = {
            color: '#2ecc71',
            pattern: 'solid',
            hat: 'none',
            glasses: 'none'
        };
        
        this.currentCustomization = this.loadCustomization();
        this.previewCanvas = null;
        this.previewCtx = null;
    }

    // Load customization from localStorage
    loadCustomization() {
        const saved = localStorage.getItem('wormCustomization');
        if (saved) {
            try {
                return { ...this.defaultCustomization, ...JSON.parse(saved) };
            } catch (e) {
                console.warn('Failed to load worm customization:', e);
            }
        }
        return { ...this.defaultCustomization };
    }

    // Save customization to localStorage
    saveCustomization() {
        localStorage.setItem('wormCustomization', JSON.stringify(this.currentCustomization));
    }

    // Initialize the customization UI
    initializeUI() {
        this.previewCanvas = document.getElementById('wormPreview');
        this.previewCtx = this.previewCanvas.getContext('2d');

        // Set up modal event listeners
        document.getElementById('openWormCustomization').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('wormCustomizationClose').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('applyCustomization').addEventListener('click', () => {
            this.applyAndClose();
        });

        // Close modal when clicking outside
        document.getElementById('wormCustomizationModal').addEventListener('click', (e) => {
            if (e.target.id === 'wormCustomizationModal') {
                this.closeModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('wormCustomizationModal');
                if (modal.style.display === 'flex') {
                    this.closeModal();
                }
            }
        });

        // Set up customization event listeners
        document.getElementById('wormColor').addEventListener('change', (e) => {
            this.currentCustomization.color = e.target.value;
            this.updatePreview();
        });

        document.getElementById('wormPattern').addEventListener('change', (e) => {
            this.currentCustomization.pattern = e.target.value;
            this.updatePreview();
        });

        document.getElementById('wormHat').addEventListener('change', (e) => {
            this.currentCustomization.hat = e.target.value;
            this.updatePreview();
        });

        document.getElementById('wormGlasses').addEventListener('change', (e) => {
            this.currentCustomization.glasses = e.target.value;
            this.updatePreview();
        });

        document.getElementById('resetCustomization').addEventListener('click', () => {
            this.resetToDefault();
        });

        // Initialize UI with current values
        this.updateUI();
        this.updatePreview();
    }

    // Update UI elements to match current customization
    updateUI() {
        document.getElementById('wormColor').value = this.currentCustomization.color;
        document.getElementById('wormPattern').value = this.currentCustomization.pattern;
        document.getElementById('wormHat').value = this.currentCustomization.hat;
        document.getElementById('wormGlasses').value = this.currentCustomization.glasses;
    }

    // Reset to default customization
    resetToDefault() {
        this.currentCustomization = { ...this.defaultCustomization };
        this.updateUI();
        this.updatePreview();
        this.saveCustomization();
    }

    // Update the preview canvas
    updatePreview() {
        if (!this.previewCtx) return;

        // Clear canvas
        this.previewCtx.fillStyle = '#34495e';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        // Draw worm segments (3 segments for preview)
        const segmentSize = 22;
        const yPos = (this.previewCanvas.height - segmentSize) / 2; // Center vertically
        const segments = [
            { x: 5, y: yPos, isHead: true },
            { x: 29, y: yPos, isHead: false },
            { x: 53, y: yPos, isHead: false }
        ];

        segments.forEach(segment => {
            this.drawCustomWormSegment(
                this.previewCtx,
                segment.x,
                segment.y,
                segmentSize,
                this.currentCustomization,
                segment.isHead
            );
        });
    }

    // Draw a customized worm segment
    drawCustomWormSegment(ctx, x, y, size, customization, isHead = false) {
        const { color, pattern, hat, glasses } = customization;

        // Draw base segment with pattern
        this.drawSegmentWithPattern(ctx, x, y, size, color, pattern);

        if (isHead) {
            // Draw eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 4, y + 4, 4, 4);
            ctx.fillRect(x + size - 8, y + 4, 4, 4);

            // Draw pupils
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 5, y + 5, 2, 2);
            ctx.fillRect(x + size - 7, y + 5, 2, 2);

            // Draw accessories
            this.drawHat(ctx, x, y, size, hat);
            this.drawGlasses(ctx, x, y, size, glasses);
        }
    }

    // Draw segment with different patterns
    drawSegmentWithPattern(ctx, x, y, size, color, pattern) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        switch (pattern) {
            case 'stripes':
                ctx.fillStyle = this.darkenColor(color, 0.3);
                for (let i = 0; i < size; i += 4) {
                    ctx.fillRect(x + i, y, 2, size);
                }
                break;

            case 'dots':
                ctx.fillStyle = this.darkenColor(color, 0.3);
                const dotSize = 2;
                for (let dx = 3; dx < size - 3; dx += 6) {
                    for (let dy = 3; dy < size - 3; dy += 6) {
                        ctx.fillRect(x + dx, y + dy, dotSize, dotSize);
                    }
                }
                break;

            case 'gradient':
                const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, this.darkenColor(color, 0.4));
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, size, size);
                break;

            case 'solid':
            default:
                // Already drawn above
                break;
        }
    }

    // Draw hat accessory
    drawHat(ctx, x, y, size, hat) {
        ctx.fillStyle = '#000000';
        
        switch (hat) {
            case 'cap':
                // Simple cap
                ctx.fillRect(x + 3, y - 4, size - 6, 4);
                ctx.fillRect(x + size - 8, y - 1, 6, 3);
                break;

            case 'crown':
                // Crown
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(x + 2, y - 5, size - 4, 4);
                // Crown points
                for (let i = 4; i < size - 4; i += 5) {
                    ctx.fillRect(x + i, y - 8, 3, 3);
                }
                break;

            case 'tophat':
                // Top hat
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(x + 6, y - 10, size - 12, 8);
                ctx.fillRect(x + 3, y - 2, size - 6, 3);
                break;

            case 'party':
                // Party hat
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.moveTo(x + size/2, y - 10);
                ctx.lineTo(x + 3, y - 1);
                ctx.lineTo(x + size - 3, y - 1);
                ctx.closePath();
                ctx.fill();
                // Pom pom
                ctx.fillStyle = '#f1c40f';
                ctx.fillRect(x + size/2 - 2, y - 12, 4, 4);
                break;
        }
    }

    // Draw glasses accessory
    drawGlasses(ctx, x, y, size, glasses) {
        switch (glasses) {
            case 'regular':
                // Regular glasses
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 3, y + 3, 6, 6);
                ctx.strokeRect(x + size - 9, y + 3, 6, 6);
                // Bridge
                ctx.beginPath();
                ctx.moveTo(x + 9, y + 6);
                ctx.lineTo(x + size - 9, y + 6);
                ctx.stroke();
                break;

            case 'sunglasses':
                // Sunglasses
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(x + 3, y + 3, 6, 6);
                ctx.fillRect(x + size - 9, y + 3, 6, 6);
                // Bridge
                ctx.fillRect(x + 9, y + 5, size - 18, 2);
                break;

            case 'cool':
                // Cool glasses (larger, darker)
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x + 2, y + 2, 7, 7);
                ctx.fillRect(x + size - 9, y + 2, 7, 7);
                // Bridge
                ctx.fillRect(x + 9, y + 4, size - 18, 3);
                break;
        }
    }

    // Utility function to darken a color
    darkenColor(color, factor) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Darken
        const newR = Math.floor(r * (1 - factor));
        const newG = Math.floor(g * (1 - factor));
        const newB = Math.floor(b * (1 - factor));

        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Get current customization
    getCustomization() {
        return { ...this.currentCustomization };
    }

    // Open customization modal
    openModal() {
        // Don't open if game is running
        if (currentMode && currentMode.gameRunning) {
            return;
        }
        
        document.getElementById('wormCustomizationModal').style.display = 'flex';
        this.updateUI();
        this.updatePreview();
    }

    // Close customization modal
    closeModal() {
        document.getElementById('wormCustomizationModal').style.display = 'none';
    }

    // Apply customization and close modal
    applyAndClose() {
        this.saveCustomization();
        this.closeModal();
        
        // Restart the game to apply changes if in single player mode
        if (currentMode && currentMode.name === 'single') {
            restart();
        }
    }

    // Show/hide customization button
    showCustomizationButton() {
        document.getElementById('wormCustomizeBtnContainer').style.display = 'block';
        this.updateButtonState();
    }

    hideCustomizationButton() {
        document.getElementById('wormCustomizeBtnContainer').style.display = 'none';
    }

    // Update button state based on game state
    updateButtonState() {
        const button = document.getElementById('openWormCustomization');
        if (currentMode && currentMode.gameRunning) {
            button.disabled = true;
            button.textContent = '🐛 Customize Worm (Game in Progress)';
        } else {
            button.disabled = false;
            button.textContent = '🐛 Customize Worm';
        }
    }
}

// Global instance
const wormCustomization = new WormCustomization();