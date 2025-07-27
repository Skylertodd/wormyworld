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
let glowZones = null;

// Minimum distance to register a direction change
const MIN_DRAG_DISTANCE = 15;

// Snap-to-direction threshold (degrees from cardinal directions)
const SNAP_THRESHOLD = 45;

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

    // Create glow zones container
    glowZones = document.createElement('div');
    glowZones.style.cssText = `
        position: absolute;
        width: 200px;
        height: 200px;
        transform: translate(-50%, -50%);
    `;

    // Create directional glow arcs (120 degree spans)
    const directions = [
        { name: 'up', color: 'rgba(255, 255, 100, 0.4)', startAngle: -60, endAngle: 60 },
        { name: 'right', color: 'rgba(255, 100, 100, 0.4)', startAngle: 30, endAngle: 150 },
        { name: 'down', color: 'rgba(100, 100, 255, 0.4)', startAngle: 120, endAngle: 240 },
        { name: 'left', color: 'rgba(100, 255, 100, 0.4)', startAngle: 210, endAngle: 330 }
    ];

    directions.forEach(dir => {
        const arcContainer = document.createElement('div');
        arcContainer.className = `glow-zone-${dir.name}`;
        arcContainer.style.cssText = `
            position: absolute;
            width: 120px;
            height: 120px;
            opacity: 0;
            transition: opacity 0.3s ease;
            transform: translate(-50%, -50%);
            pointer-events: none;
            left: 100px;
            top: 100px;
        `;

        // Create multiple layers for a smoother circular arc effect
        for (let i = 0; i < 3; i++) {
            const arc = document.createElement('div');
            const size = 120 - (i * 15); // Decreasing sizes: 120px, 105px, 90px
            const opacity = 0.4 - (i * 0.1); // Decreasing opacity for layering effect

            arc.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                left: 50%;
                top: 50%;
            `;

            // Create the arc using conic-gradient
            const startAngle = dir.startAngle;
            const endAngle = dir.endAngle;
            const arcSpan = endAngle - startAngle;

            // Create a radial gradient that fades from center outward with circular edge
            const radialGradient = `radial-gradient(circle, ${dir.color.replace('0.4', opacity.toString())} 20%, ${dir.color.replace('0.4', (opacity * 0.6).toString())} 50%, ${dir.color.replace('0.4', (opacity * 0.3).toString())} 80%, transparent 100%)`;

            // Create a conic gradient for the arc shape
            const conicGradient = `conic-gradient(from ${startAngle}deg, transparent 0deg, white 10deg, white ${arcSpan - 10}deg, transparent ${arcSpan}deg)`;

            // Apply the radial gradient as background and conic as mask for circular edges
            arc.style.background = radialGradient;
            arc.style.mask = conicGradient;
            arc.style.webkitMask = conicGradient;

            if (i === 0) {
                // Add blur and shadow only to the outermost layer
                arc.style.filter = 'blur(4px)';
                arc.style.boxShadow = `0 0 25px ${dir.color}`;
            } else {
                arc.style.filter = `blur(${2 + i}px)`;
            }

            arcContainer.appendChild(arc);
        }

        glowZones.appendChild(arcContainer);
    });

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
        height: 4px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
        transform-origin: left center;
        filter: blur(0.5px);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        border-radius: 2px;
    `;

    // Add arrow head
    const arrowHead = document.createElement('div');
    arrowHead.style.cssText = `
        position: absolute;
        right: -10px;
        top: -5px;
        width: 0;
        height: 0;
        border-left: 10px solid rgba(255, 255, 255, 0.8);
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        filter: blur(0.5px);
    `;
    directionArrow.appendChild(arrowHead);

    visualIndicator.appendChild(glowZones);
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

    // Position glow zones around the start point
    glowZones.style.left = startX + 'px';
    glowZones.style.top = startY + 'px';

    // Reset all glow zones
    resetGlowZones();
}

// Update visual indicator
function updateVisualIndicator(startX, startY, currentX, currentY) {
    if (!visualIndicator || !touchActive) return;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < MIN_DRAG_DISTANCE) {
        directionArrow.style.width = '0px';
        resetGlowZones();
        return;
    }

    // Get snapped direction and angle
    const snapped = snapToCardinalDirection(deltaX, deltaY);
    const length = Math.min(distance, 80); // Cap the arrow length

    // Update arrow with snapped angle
    directionArrow.style.width = length + 'px';
    directionArrow.style.transform = `rotate(${snapped.snappedAngle}deg)`;

    // Update opacity based on distance
    const opacity = Math.min(distance / 50, 0.9);
    directionArrow.style.opacity = opacity;
    startDot.style.opacity = opacity;

    // Activate the corresponding glow zone
    activateGlowZone(snapped.direction);
}

// Reset all glow zones
function resetGlowZones() {
    if (!glowZones) return;

    const zones = glowZones.querySelectorAll('[class^="glow-zone-"]');
    zones.forEach(zone => {
        zone.style.opacity = '0';
        zone.style.transform = 'translate(-50%, -50%) scale(1)';
    });
}

// Activate specific glow zone
function activateGlowZone(direction) {
    if (!glowZones) return;

    resetGlowZones();
    const zone = glowZones.querySelector(`.glow-zone-${direction}`);
    if (zone) {
        zone.style.opacity = '0.9';
        // Add a subtle pulsing effect
        zone.style.transform = 'translate(-50%, -50%) scale(1.1)';
        zone.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    }
}

// Snap angle to nearest cardinal direction
function snapToCardinalDirection(deltaX, deltaY) {
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Normalize angle to 0-360
    const normalizedAngle = ((angle + 360) % 360);

    // Define cardinal directions with snap zones
    const cardinals = [
        { direction: 'right', angle: 0, min: 315, max: 45 },
        { direction: 'down', angle: 90, min: 45, max: 135 },
        { direction: 'left', angle: 180, min: 135, max: 225 },
        { direction: 'up', angle: 270, min: 225, max: 315 }
    ];

    // Find which cardinal direction we're closest to
    for (const cardinal of cardinals) {
        if (cardinal.min > cardinal.max) {
            // Handle wrap-around case (right direction)
            if (normalizedAngle >= cardinal.min || normalizedAngle <= cardinal.max) {
                return {
                    direction: cardinal.direction,
                    snappedAngle: cardinal.angle
                };
            }
        } else {
            if (normalizedAngle >= cardinal.min && normalizedAngle <= cardinal.max) {
                return {
                    direction: cardinal.direction,
                    snappedAngle: cardinal.angle
                };
            }
        }
    }

    // Fallback (shouldn't happen)
    return {
        direction: 'right',
        snappedAngle: 0
    };
}

// Hide visual indicator
function hideVisualIndicator() {
    if (visualIndicator) {
        visualIndicator.style.display = 'none';
        resetGlowZones();
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

        // Use snap-to-direction logic
        const snapped = snapToCardinalDirection(deltaX, deltaY);
        const newDirection = snapped.direction;

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

        // Use snap-to-direction logic
        const snapped = snapToCardinalDirection(deltaX, deltaY);
        const newDirection = snapped.direction;

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