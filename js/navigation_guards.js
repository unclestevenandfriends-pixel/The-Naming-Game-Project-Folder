// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION_GUARDS.JS - Slide Navigation Control System
// Integrates with MapSystem v4 for proper forward-lock, backward-free navigation
// This file should be loaded AFTER map.js and BEFORE main.js
// ═══════════════════════════════════════════════════════════════════════════════

const NavigationGuard = {
    initialized: false,
    touchStartX: 0,
    touchStartY: 0,
    isBlocking: false,
    blockedCooldownMs: 1000,
    lastBlockedAt: 0,

    init() {
        if (this.initialized) return;

        const slider = document.getElementById('slider');
        if (!slider) {
            console.warn("⚠️ NavigationGuard: Slider not found, retrying...");
            setTimeout(() => this.init(), 100);
            return;
        }

        this.setupTouchBlocker(slider);
        this.setupScrollBlocker(slider);
        this.setupKeyboardBlocker();

        this.initialized = true;
        console.log("🛡️ NavigationGuard v2.0 Initialized");
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOUCH/SWIPE BLOCKING
    // ═══════════════════════════════════════════════════════════════════════════════

    setupTouchBlocker(slider) {
        // Capture touch start position
        slider.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isBlocking = false;
        }, { passive: true });

        // Intercept touch move - block if trying to swipe left (forward) on exit slide
        slider.addEventListener('touchmove', (e) => {
            if (this.isBlocking) {
                e.preventDefault();
                return;
            }

            const currentX = e.touches[0].clientX;
            const deltaX = this.touchStartX - currentX;

            // If swiping left (forward navigation)
            if (deltaX > 30) {
                if (!this.canNavigateForward()) {
                    this.isBlocking = true;
                    e.preventDefault();
                    this.showBlockedFeedback();
                }
            }
        }, { passive: false });

        // Reset on touch end
        slider.addEventListener('touchend', () => {
            this.isBlocking = false;
        }, { passive: true });
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // SCROLL/WHEEL BLOCKING
    // ═══════════════════════════════════════════════════════════════════════════════

    setupScrollBlocker(slider) {
        // For mouse wheel scrolling
        slider.addEventListener('wheel', (e) => {
            // Scrolling right (forward)
            if (e.deltaX > 0 || e.deltaY > 0) {
                if (!this.canNavigateForward()) {
                    e.preventDefault();
                    this.showBlockedFeedback();
                }
            }
        }, { passive: false });

        // Monitor scroll position and snap back if needed
        let lastScrollLeft = 0;
        let scrollCheckTimeout;

        slider.addEventListener('scroll', () => {
            clearTimeout(scrollCheckTimeout);

            scrollCheckTimeout = setTimeout(() => {
                const currentSlide = Math.round(slider.scrollLeft / slider.clientWidth);
                const maxAllowed = this.getMaxAllowedSlide();

                // If scrolled past allowed slide, snap back
                if (currentSlide > maxAllowed) {
                    console.log(`🛡️ Snapping back from slide ${currentSlide} to ${maxAllowed}`);
                    slider.scrollTo({
                        left: maxAllowed * slider.clientWidth,
                        behavior: 'smooth'
                    });
                    this.showBlockedFeedback();
                }

                // Update button state
                if (typeof MapSystem !== 'undefined') {
                    MapSystem.updateButtonState(currentSlide);
                }

                lastScrollLeft = slider.scrollLeft;
            }, 100);
        }, { passive: true });
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // KEYBOARD BLOCKING
    // ═══════════════════════════════════════════════════════════════════════════════

    setupKeyboardBlocker() {
        document.addEventListener('keydown', (e) => {
            // Ignore if in input field
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            if (document.activeElement.getAttribute('contenteditable') === 'true') return;

            // Ignore if map is open
            if (typeof MapSystem !== 'undefined' && MapSystem.active) return;

            // Forward navigation keys
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
                if (!this.canNavigateForward()) {
                    e.preventDefault();
                    this.showBlockedFeedback();
                    return;
                }
                // If allowed, let the default handler in main.js handle it
            }

            // Backward is always allowed (ArrowLeft handled by main.js)
        });
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // NAVIGATION CHECKS
    // ═══════════════════════════════════════════════════════════════════════════════

    getCurrentSlide() {
        const slider = document.getElementById('slider');
        if (!slider) return 0;
        return Math.round(slider.scrollLeft / slider.clientWidth);
    },

    canNavigateForward() {
        if (typeof MapSystem === 'undefined') return true;

        const currentSlide = this.getCurrentSlide();

        // Special case: Hero slide before intro
        if (currentSlide === 0 && !MapSystem.introPlayed) {
            return false; // Must click "Start Journey"
        }

        // Check with MapSystem
        return MapSystem.canSwipeForward(currentSlide);
    },

    getMaxAllowedSlide() {
        if (typeof MapSystem === 'undefined') return Infinity;

        const currentSlide = this.getCurrentSlide();
        const currentNode = MapSystem.findNodeBySlide(currentSlide);

        if (!currentNode) return currentSlide;

        // If on an exit slide, that's the max for this node
        if (currentNode.exitSlide === currentSlide) {
            return currentSlide;
        }

        // Otherwise, can go to the exit slide of current node
        return currentNode.exitSlide || Math.max(...currentNode.slides);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // FEEDBACK
    // ═══════════════════════════════════════════════════════════════════════════════

    showBlockedFeedback() {
        const now = Date.now();

        // HARD COOLDOWN: prevent stacked audio on aggressive swipes / scroll spam
        if (now - this.lastBlockedAt < this.blockedCooldownMs) return;
        this.lastBlockedAt = now;

        // Prefer the already-built "damage-style" feedback
        if (typeof window.showLockedAlert === 'function') {
            window.showLockedAlert();
            return;
        }

        // Fallback (if showLockedAlert ever isn't available)
        if (typeof MapSystem !== 'undefined') {
            const currentSlide = this.getCurrentSlide();
            MapSystem.updateButtonState(currentSlide);
        }

        if (typeof SoundFX !== 'undefined') {
            if (SoundFX.playLocked) SoundFX.playLocked();
            else if (SoundFX.playPop) SoundFX.playPop();
        }
    },

    showBlockedNotification() {
        /* disabled: replaced by showLockedAlert flash */
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATED nextSlide FUNCTION
// Replace the nextSlide function in main.js with this version
// ═══════════════════════════════════════════════════════════════════════════════

function nextSlide() {
    const slider = document.getElementById('slider');
    if (!slider) return;

    // Check if navigation is allowed
    if (!NavigationGuard.canNavigateForward()) {
        NavigationGuard.showBlockedFeedback();
        return;
    }

    // Perform the navigation
    const currentIndex = NavigationGuard.getCurrentSlide();
    const targetIndex = currentIndex + 1;

    slider.scrollTo({
        left: targetIndex * slider.clientWidth,
        behavior: 'smooth'
    });

    if (typeof SoundFX !== 'undefined') {
        SoundFX.playSlide();
    }
}

function prevSlide() {
    const slider = document.getElementById('slider');
    if (!slider) return;

    // Backward is always allowed
    slider.scrollBy({
        left: -slider.clientWidth,
        behavior: 'smooth'
    });

    if (typeof SoundFX !== 'undefined') {
        SoundFX.playSlide();
    }

    // Stop any map button flash when going backward
    if (typeof MapSystem !== 'undefined') {
        const currentIndex = NavigationGuard.getCurrentSlide() - 1;
        MapSystem.updateButtonState(Math.max(0, currentIndex));
    }
}

// Expose globally
window.NavigationGuard = NavigationGuard;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => NavigationGuard.init(), 200);
});
