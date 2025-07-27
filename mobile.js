// Mobile touch controls - will be initialized after DOM is ready
let mobileControls, upBtn, downBtn, leftBtn, rightBtn;
let upBtn2, downBtn2, leftBtn2, rightBtn2, canvas;

// Detect mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
}

// Initialize mobile controls
function initializeMobileControls() {
    // Get DOM elements
    mobileControls = document.getElementById('mobileControls');
    upBtn = document.getElementById('upBtn');
    downBtn = document.getElementById('downBtn');
    leftBtn = document.getElementById('leftBtn');
    rightBtn = document.getElementById('rightBtn');
    upBtn2 = document.getElementById('upBtn2');
    downBtn2 = document.getElementById('downBtn2');
    leftBtn2 = document.getElementById('leftBtn2');
    rightBtn2 = document.getElementById('rightBtn2');
    canvas = document.getElementById('gameCanvas');

    // Show/hide mobile controls based on device
    updateMobileControls();

    // Touch control handlers for Player 1
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('up', '1');
    });

    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('down', '1');
    });

    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('left', '1');
    });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('right', '1');
    });

    // Touch control handlers for Player 2
    upBtn2.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('up', '2');
    });

    downBtn2.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('down', '2');
    });

    leftBtn2.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('left', '2');
    });

    rightBtn2.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput('right', '2');
    });

    // Also handle click events for desktop testing
    upBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('up', '1');
    });

    downBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('down', '1');
    });

    leftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('left', '1');
    });

    rightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('right', '1');
    });

    upBtn2.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('up', '2');
    });

    downBtn2.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('down', '2');
    });

    leftBtn2.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('left', '2');
    });

    rightBtn2.addEventListener('click', (e) => {
        e.preventDefault();
        handleInput('right', '2');
    });

    // Swipe gesture support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchEndX = touch.clientX;
        touchEndY = touch.clientY;
        
        handleSwipe();
    }, { passive: false });

    // Prevent default touch behaviors on game elements
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// Show/hide mobile controls based on device
function updateMobileControls() {
    if (mobileControls) {
        if (isMobileDevice()) {
            mobileControls.style.display = 'flex';
        } else {
            mobileControls.style.display = 'none';
        }
    }
}

// Swipe gesture support
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    // Only process significant swipes
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            handleInput('right', '1');
        } else {
            handleInput('left', '1');
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            handleInput('down', '1');
        } else {
            handleInput('up', '1');
        }
    }
}

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        updateMobileControls();
        // Trigger a resize to adjust canvas if needed
        const event = new Event('resize');
        window.dispatchEvent(event);
    }, 100);
});

// Handle window resize
window.addEventListener('resize', () => {
    updateMobileControls();
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