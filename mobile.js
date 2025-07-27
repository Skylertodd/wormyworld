// Virtual joystick controls - will be initialized after DOM is ready
let gameContainer;
let touchActive = false;
let touchStartX = 0;
let touchStartY = 0;
let currentTouchX = 0;
let currentTouchY = 0;
let lastDirection = null;
let touchId = null;

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
    canvas = document.getElementById('gameCanvas');
    gameContainer = document.querySelector('.game-container');

    // Hide the old button controls on mobile
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls && isMobileDevice()) {
        mobileControls.style.display = 'none';
    }

    // Set up virtual joystick touch events
    setupVirtualJoystick();
}

// Set up virtual joystick touch handling
function setupVirtualJoystick() {
    // Touch start - establish the center point
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();

        if (e.touches.length > 0) {
            const touch = e.touches[0];
            touchId = touch.identifier;
            touchActive = true;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            currentTouchX = touch.clientX;
            currentTouchY = touch.clientY;
            lastDirection = null;
        }
    }, { passive: false });

    // Touch move - detect direction changes
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();

        if (!touchActive) return;

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

            // Update the start position to current position for continuous dragging
            touchStartX = currentTouchX;
            touchStartY = currentTouchY;
        }
    }, { passive: false });

    // Touch end - reset the joystick
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();

        // Check if our specific touch ended
        let touchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                touchEnded = false;
                break;
            }
        }

        if (touchEnded) {
            touchActive = false;
            touchId = null;
            lastDirection = null;
        }
    }, { passive: false });

    // Touch cancel - reset the joystick
    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        touchActive = false;
        touchId = null;
        lastDirection = null;
    }, { passive: false });

    // Prevent scrolling and other touch behaviors on the game area
    document.body.addEventListener('touchmove', (e) => {
        // Only prevent default if the touch is on the canvas or game container
        if (e.target === canvas || canvas.contains(e.target)) {
            e.preventDefault();
        }
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