// Virtual joystick controls - will be initialized after DOM is ready
let gameContainer;
let touchActive = false;
let touchStartX = 0;
let touchStartY = 0;
let currentTouchX = 0;
let currentTouchY = 0;
let lastDirection = null;
let touchId = null;

// Visual indicator elements
let visualIndicator = null;
let startDot = null;
let directionArrow = null;

// Minimum distance to register a direction change
const MIN_DRAG_DISTANCE = 15;

// Detect mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
}

// Initialize virtual joystick controls
function initializeMobileControls() {
    // Get DOM elements
    gameContainer = document.querySelector('.game-container');

    // Hide the old button controls on mobile
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls && isMobileDevice()) {
        mobileControls.style.display = 'none';
    }

    // Create visual indicator
    createVisualIndicator();

    // Set up virtual joystick touch events
    setupVirtualJoystick();
}

// Create visual indicator elements
function createVisualIndicator() {
    // Create container for visual elements
    visualIndicator = document.createElement('div');
    visualIndicator.id = 'virtualJoystickIndicator';
    visualIndicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
        display: none;
    `;

    // Create start dot
    startDot = document.createElement('div');
    startDot.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.6);
        transform: translate(-50%, -50%);
        filter: blur(1px);
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
    `;

    // Create direction arrow
    directionArrow = document.createElement('div');
    directionArrow.style.cssText = `
        position: absolute;
        width: 0;
        height: 3px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
        transform-origin: left center;
        filter: blur(0.5px);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
        border-radius: 2px;
    `;

    // Add arrow head
    const arrowHead = document.createElement('div');
    arrowHead.style.cssText = `
        position: absolute;
        right: -8px;
        top: -4px;
        width: 0;
        height: 0;
        border-left: 8px solid rgba(255, 255, 255, 0.6);
        border-top: 5px solid transparent;
        border-bottom: 5px solid transparent;
        filter: blur(0.5px);
    `;
    directionArrow.appendChild(arrowHead);

    visualIndicator.appendChild(startDot);
    visualIndicator.appendChild(directionArrow);
    document.body.appendChild(visualIndicator);
}

// Show visual indicator
function showVisualIndicator(startX, startY) {
    if (!visualIndicator) return;

    visualIndicator.style.display = 'block';
    startDot.style.left = startX + 'px';
    startDot.style.top = startY + 'px';
    directionArrow.style.left = startX + 'px';
    directionArrow.style.top = startY + 'px';
    directionArrow.style.width = '0px';
}

// Update visual indicator
function updateVisualIndicator(startX, startY, currentX, currentY) {
    if (!visualIndicator || !touchActive) return;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < MIN_DRAG_DISTANCE) {
        directionArrow.style.width = '0px';
        return;
    }

    // Calculate angle and length
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const length = Math.min(distance, 100); // Cap the arrow length

    // Update arrow
    directionArrow.style.width = length + 'px';
    directionArrow.style.transform = `rotate(${angle}deg)`;

    // Update opacity based on distance
    const opacity = Math.min(distance / 50, 0.8);
    directionArrow.style.opacity = opacity;
    startDot.style.opacity = opacity;
}

// Hide visual indicator
function hideVisualIndicator() {
    if (visualIndicator) {
        visualIndicator.style.display = 'none';
    }
}

// Clear any active joystick (called when game ends)
function clearVirtualJoystick() {
    touchActive = false;
    touchId = null;
    lastDirection = null;
    hideVisualIndicator();
}

// Set up virtual joystick touch handling
function setupVirtualJoystick() {
    // Touch start - establish the center point (anywhere on screen)
    document.addEventListener('touchstart', (e) => {
        // Only activate virtual joystick when game is running
        if (!window.currentMode || !window.currentMode.gameRunning) {
            return;
        }

        if (e.touches.length > 0) {
            const touch = e.touches[0];
            touchId = touch.identifier;
            touchActive = true;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            currentTouchX = touch.clientX;
            currentTouchY = touch.clientY;
            lastDirection = null;

            // Show visual indicator
            showVisualIndicator(touchStartX, touchStartY);

            // Don't prevent default on touch start - let tap-to-restart work
            // We'll only prevent default when we detect actual dragging
        }
    }, { passive: false });

    // Mouse support for desktop testing
    document.addEventListener('mousedown', (e) => {
        // Only activate virtual joystick when game is running
        if (!window.currentMode || !window.currentMode.gameRunning) {
            return;
        }

        touchActive = true;
        touchStartX = e.clientX;
        touchStartY = e.clientY;
        currentTouchX = e.clientX;
        currentTouchY = e.clientY;
        lastDirection = null;
        touchId = 'mouse';

        // Show visual indicator
        showVisualIndicator(touchStartX, touchStartY);

        e.preventDefault();
    });

    // Mouse move - detect direction changes
    document.addEventListener('mousemove', (e) => {
        if (!touchActive || touchId !== 'mouse') return;

        currentTouchX = e.clientX;
        currentTouchY = e.clientY;

        // Update visual indicator
        updateVisualIndicator(touchStartX, touchStartY, currentTouchX, currentTouchY);

        // Calculate the drag vector from start position
        const deltaX = currentTouchX - touchStartX;
        const deltaY = currentTouchY - touchStartY;

        // Check if we've moved far enough to register a direction
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < MIN_DRAG_DISTANCE) return;

        // Determine the primary direction
        let newDirection = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal movement is stronger
            newDirection = deltaX > 0 ? 'right' : 'left';
        } else {
            // Vertical movement is stronger
            // Note: In screen coordinates, Y increases downward
            newDirection = deltaY > 0 ? 'down' : 'up';
        }

        // Only send input if direction changed
        if (newDirection !== lastDirection) {
            lastDirection = newDirection;
            handleInput(newDirection, '1');

            // Don't reset the start position - keep the original touch point
            // This keeps the joystick visual in the same place
        }
    });

    // Mouse up - reset the joystick
    document.addEventListener('mouseup', (e) => {
        if (!touchActive || touchId !== 'mouse') return;

        touchActive = false;
        touchId = null;
        lastDirection = null;

        // Hide visual indicator
        hideVisualIndicator();
    });

    // Touch move - detect direction changes
    document.addEventListener('touchmove', (e) => {
        if (!touchActive) return;

        // Always prevent default when virtual joystick is active to stop page scrolling
        e.preventDefault();

        // Find the touch that matches our touchId
        let currentTouch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                currentTouch = e.touches[i];
                break;
            }
        }

        if (!currentTouch) return;

        currentTouchX = currentTouch.clientX;
        currentTouchY = currentTouch.clientY;

        // Calculate the drag vector from start position
        const deltaX = currentTouchX - touchStartX;
        const deltaY = currentTouchY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Update visual indicator
        updateVisualIndicator(touchStartX, touchStartY, currentTouchX, currentTouchY);

        // Check if we've moved far enough to register a direction
        if (distance < MIN_DRAG_DISTANCE) return;

        // Determine the primary direction
        let newDirection = null;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal movement is stronger
            newDirection = deltaX > 0 ? 'right' : 'left';
        } else {
            // Vertical movement is stronger
            // Note: In screen coordinates, Y increases downward
            newDirection = deltaY > 0 ? 'down' : 'up';
        }

        // Only send input if direction changed
        if (newDirection !== lastDirection) {
            lastDirection = newDirection;
            handleInput(newDirection, '1');

            // Don't reset the start position - keep the original touch point
            // This keeps the joystick visual in the same place
        }
    }, { passive: false });

    // Touch end - reset the joystick
    document.addEventListener('touchend', (e) => {
        if (!touchActive) return;

        // Check if our specific touch ended
        let touchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                touchEnded = false;
                break;
            }
        }

        if (touchEnded) {
            // Only prevent default if we actually sent input (detected dragging)
            if (lastDirection !== null) {
                e.preventDefault();
            }

            touchActive = false;
            touchId = null;
            lastDirection = null;

            // Hide visual indicator
            hideVisualIndicator();
        }
    }, { passive: false });

    // Touch cancel - reset the joystick
    document.addEventListener('touchcancel', (e) => {
        if (!touchActive) return;

        e.preventDefault();
        touchActive = false;
        touchId = null;
        lastDirection = null;

        // Hide visual indicator
        hideVisualIndicator();
    }, { passive: false });
}

// Show/hide mobile controls based on device (for compatibility)
function updateMobileControls() {
    // This function is kept for compatibility with existing code
    // The virtual joystick doesn't need visible controls
}

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // Trigger a resize to adjust canvas if needed
        const event = new Event('resize');
        window.dispatchEvent(event);
    }, 100);
});

// Handle window resize
window.addEventListener('resize', () => {
    // No specific mobile control updates needed for virtual joystick
});

// Initialize mobile controls on load
document.addEventListener('DOMContentLoaded', () => {
    initializeMobileControls();
});

// Also check on load in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileControls);
} else {
    initializeMobileControls();
}