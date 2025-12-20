// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION_GUARDS.JS - Slide Navigation Control System v3.0
// ROBUST BARRIER ENFORCEMENT - Prevents CSS scroll-snap bypass
// This file should be loaded AFTER map.js and BEFORE main.js
// ═══════════════════════════════════════════════════════════════════════════════

const NavigationGuard = {
    initialized: false,
    touchStartX: 0,
    touchStartY: 0,
    isBlocking: false,
    lastValidSlide: 0,
    scrollEnforcing: false,
    mapNavigating: false, // NEW: Set true during direct map navigation

    // Cooldown tracking
    blockedCooldownMs: 1000,
    lastBlockedAt: 0,

    // Track the maximum slide index that should be accessible
    _cachedMaxSlide: 0,
    currentSlideIndex: 0,

    init() {
        if (this.initialized) return;

        const slider = document.getElementById('slider');
        if (!slider) {
            console.warn("⚠️ NavigationGuard: Slider not found, retrying...");
            setTimeout(() => this.init(), 100);
            return;
        }

        this.setupTouchBlocker(slider);
        this.setupScrollEnforcer(slider);
        this.setupKeyboardBlocker();

        // Initial valid slide calculation
        this.lastValidSlide = this.getCurrentSlide();
        this.currentSlideIndex = this.lastValidSlide;
        this.updateCachedMaxSlide();

        // CENTRAL SLIDE CHANGE LISTENER (Ghosting Fix)
        let scrollTimeout;
        slider.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.detectSlideChange();
            }, 100);
        }, { passive: true });

        this.initialized = true;
        console.log("🛡️ NavigationGuard v3.0: Ghosting Protocols Active");
    },

    detectSlideChange() {
        const newIndex = this.getCurrentSlide();
        if (newIndex !== this.currentSlideIndex) {
            this.handleSlideTransition(newIndex);
        }
    },

    handleSlideTransition(newIndex) {
        this.currentSlideIndex = newIndex;

        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'report') return; // Read-Only Mode

        console.log(`➡️ Slide Transition: ${this.currentSlideIndex} -> ${newIndex}`);

        // 1. SAVE DATA (Safety Guardrail 2)
        if (window.MarkupCoordinator) {
            // Force sync visible sticky notes first
            if (window.StickyNotesSystem && typeof window.StickyNotesSystem.syncVisibleNotesToState === 'function') {
                window.StickyNotesSystem.syncVisibleNotesToState();
            }
            window.MarkupCoordinator.forceSave();
        }

        // 2. CLEAR GHOSTS (The Red Line - Protocol 1)
        if (window.MarkupCoordinator) {
            window.MarkupCoordinator.clearCanvas();
            window.MarkupCoordinator.clearStickers();
        }

        // 3. LOAD NEW DATA
        setTimeout(() => {
            if (window.StickyNotesSystem) window.StickyNotesSystem.loadNotesForSlide(newIndex);

            // Allow MapSystem to catch up
            if (window.MapSystem && typeof window.MapSystem.checkSlidePosition === 'function') {
                window.MapSystem.checkSlidePosition(newIndex);
            }

            // Redraw any persistent ink for the new slide
            if (window.AnnotationSystem && typeof window.AnnotationSystem.redrawCurrentSlide === 'function') {
                window.AnnotationSystem.redrawCurrentSlide();
            }

            // 5. PERSISTENCE & SYNC (Bridge Logic)
            localStorage.setItem('nameGame_slide', newIndex);

            // Update URL Hash (Moved from main.js)
            if (typeof window.setURLHash === "function") {
                window.setURLHash(newIndex);
            } else {
                window.location.hash = `slide=${newIndex + 1}`;
            }

            if (window.MapSystem) {
                const currentKey = (window.SlideRegistry ? window.SlideRegistry.getCurrentKey() : null);
                const nodeForSlide = currentKey ? MapSystem.findNodeByKey(currentKey) : null;
                if (nodeForSlide && MapSystem.state.currentNode !== nodeForSlide.id) {
                    if (MapSystem.isNodeUnlocked(nodeForSlide.id)) {
                        MapSystem.state.currentNode = nodeForSlide.id;
                        MapSystem.saveProgress();
                    }
                }

                // Summary triggers (Moved from main.js)
                if ((currentKey === 'session_summary' || newIndex === 33 || newIndex === 1) && typeof window.generateNotesSummary === 'function') {
                    window.generateNotesSummary();
                }
            }

            // Final data sync (Standalone Save)
            if (typeof window.saveProgress === 'function') window.saveProgress();
        }, 50);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // CACHED MAX SLIDE CALCULATION
    // Call this whenever node unlock state changes
    // ═══════════════════════════════════════════════════════════════════════════════

    updateCachedMaxSlide() {
        if (typeof MapSystem === 'undefined') {
            this._cachedMaxSlide = Infinity;
            return;
        }
        this._cachedMaxSlide = this.calculateMaxAllowedSlide();
        console.log(`🛡️ Max accessible slide updated: ${this._cachedMaxSlide}`);
    },

    calculateMaxAllowedSlide() {
        if (typeof MapSystem === 'undefined') return Infinity;

        // 1. Start with the CURRENT active node in MapSystem (prioritize intended destination)
        const activeNodeId = MapSystem.state.currentNode;
        const activeNode = MapSystem.mapNodes[activeNodeId];

        let maxSlide = 0;

        if (activeNode) {
            const slides = MapSystem.resolveNodeSlides(activeNode);
            const exitIdx = MapSystem.resolveExitSlide(activeNode);

            if (slides) {
                slides.forEach(idx => {
                    if (idx > maxSlide) maxSlide = idx;
                });
            }
            if (exitIdx !== undefined && exitIdx !== null) {
                if (exitIdx > maxSlide) maxSlide = exitIdx;
            }
        }

        // 2. Scan ALL unlocked nodes to allow backtracking and full access
        Object.values(MapSystem.mapNodes).forEach(node => {
            if (MapSystem.isNodeUnlocked(node.id)) {
                const slides = MapSystem.resolveNodeSlides(node);
                const exitIdx = MapSystem.resolveExitSlide(node);

                if (slides) {
                    slides.forEach(idx => {
                        if (idx > maxSlide) maxSlide = idx;
                    });
                }
                if (exitIdx !== undefined && exitIdx !== null) {
                    if (exitIdx > maxSlide) maxSlide = exitIdx;
                }
            }
        });

        // 3. Ensure we never lock the user out of their current position
        const currentSlide = this.getCurrentSlide();
        return Math.max(maxSlide, currentSlide);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOUCH/SWIPE BLOCKING - Intercept before CSS can handle
    // ═══════════════════════════════════════════════════════════════════════════════

    setupTouchBlocker(slider) {
        // Capture touch start position
        slider.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isBlocking = false;
            this.lastValidSlide = this.getCurrentSlide();
        }, { passive: true });

        // Intercept touch move - block if trying to swipe left (forward) on exit slide
        slider.addEventListener('touchmove', (e) => {
            if (this.isBlocking) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            const currentX = e.touches[0].clientX;
            const deltaX = this.touchStartX - currentX;

            // If swiping left (forward navigation) with threshold
            if (deltaX > 20) {
                if (!this.canNavigateForward()) {
                    this.isBlocking = true;
                    e.preventDefault();
                    e.stopPropagation();
                    this.showBlockedFeedback();

                    // Immediately snap back
                    this.enforceSlidePosition(this.lastValidSlide);
                    return false;
                }
            }
        }, { passive: false, capture: true });

        // Reset on touch end and enforce position
        slider.addEventListener('touchend', () => {
            if (this.isBlocking) {
                // Ensure we're at valid position
                setTimeout(() => this.enforceSlidePosition(this.lastValidSlide), 50);
            }
            this.isBlocking = false;
        }, { passive: true });
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // SCROLL ENFORCER - Catches any scroll that bypasses touch handlers
    // ═══════════════════════════════════════════════════════════════════════════════

    setupScrollEnforcer(slider) {
        let rafId = null;
        let lastScrollLeft = slider.scrollLeft;

        // Use both scroll event AND requestAnimationFrame for maximum coverage
        const enforceOnScroll = () => {
            if (this.scrollEnforcing) return;
            if (this.mapNavigating) return; // BYPASS: Don't block during direct map navigation

            const currentSlide = this.getCurrentSlide();
            const maxAllowed = this._cachedMaxSlide;

            // Forward movement check
            if (currentSlide > this.lastValidSlide) {
                // Check if this forward movement is allowed
                if (!this.isSlideAccessible(currentSlide)) {
                    console.log(`🛡️ BLOCKED: Attempted slide ${currentSlide}, max allowed ${maxAllowed}`);
                    this.enforceSlidePosition(this.lastValidSlide);
                    this.showBlockedFeedback();
                    return;
                }
            }

            // Update last valid slide if we're now at an allowed position
            if (this.isSlideAccessible(currentSlide)) {
                this.lastValidSlide = currentSlide;
            }

            // Update button state
            if (typeof MapSystem !== 'undefined') {
                MapSystem.updateButtonState(currentSlide);
            }
        };

        // High-frequency scroll check
        slider.addEventListener('scroll', () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(enforceOnScroll);
        }, { passive: true });

        // For mouse wheel scrolling
        slider.addEventListener('wheel', (e) => {
            // Scrolling right (forward)
            if (e.deltaX > 0) {
                if (!this.canNavigateForward()) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showBlockedFeedback();
                    return false;
                }
            }
        }, { passive: false, capture: true });
    },

    enforceSlidePosition(slideIndex) {
        const slider = document.getElementById('slider');
        if (!slider || this.scrollEnforcing) return;

        this.scrollEnforcing = true;

        // Use scrollTo without smooth behavior for immediate enforcement
        slider.scrollTo({
            left: slideIndex * slider.clientWidth,
            behavior: 'auto'  // Instant, not smooth
        });

        setTimeout(() => {
            this.scrollEnforcing = false;
        }, 100);
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
                    e.stopPropagation();
                    this.showBlockedFeedback();
                    return false;
                }
            }

            // Backward is always allowed (ArrowLeft handled by main.js)
        }, { capture: true });
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // NAVIGATION CHECKS
    // ═══════════════════════════════════════════════════════════════════════════════

    getCurrentSlide() {
        return (window.SlideRegistry ? window.SlideRegistry.getCurrentIndex() : 0);
    },

    isSlideAccessible(slideIndex) {
        if (typeof MapSystem === 'undefined') return true;

        // Find which node this slide belongs to
        const key = MapSystem.getSlideKeyAtIndex(slideIndex);
        const node = MapSystem.findNodeByKey(key);

        // If no node owns this slide, check if it's within general bounds
        if (!node) {
            return slideIndex <= this._cachedMaxSlide;
        }

        // Check if the node is unlocked
        if (!MapSystem.isNodeUnlocked(node.id)) {
            return false;
        }

        // If node is unlocked, check if we're not past its exit slide
        // (unless next node is also unlocked)
        const exitSlide = MapSystem.resolveExitSlide(node);
        if (exitSlide !== null && slideIndex === exitSlide) {
            // This is the boundary slide. 
            // Accessibility within this slide is fine, but moving forward from it is gated.
            return true;
        }

        return true;
    },

    canNavigateForward() {
        if (typeof MapSystem === 'undefined') return true;

        const currentSlide = this.getCurrentSlide();

        // Special case: Hero slide before intro
        if (currentSlide === 0 && !MapSystem.introPlayed) {
            return false; // Must click "Start Journey"
        }

        // Check if current slide is an exit slide (gate)
        const currentKey = MapSystem.getSlideKeyAtIndex(currentSlide);
        const currentNode = MapSystem.findNodeByKey(currentKey);
        const exitSlide = currentNode ? MapSystem.resolveExitSlide(currentNode) : null;

        if (currentNode && exitSlide === currentSlide) {
            // On an exit slide - must use map button (unless already completed)
            if (!MapSystem.state.completedNodes.includes(currentNode.id)) {
                return false;
            }
        }

        // Check if next slide is accessible
        return this.isSlideAccessible(currentSlide + 1);
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

        // Fallback (if showLockedAlert ever isn’t available)
        if (typeof MapSystem !== 'undefined') {
            const currentSlide = this.getCurrentSlide();
            MapSystem.updateButtonState(currentSlide);
        }

        if (typeof SoundFX !== 'undefined') {
            if (SoundFX.playLocked) SoundFX.playLocked();
            else if (SoundFX.playPop) SoundFX.playPop();
        }
    },

    showBlockedNotification() { /* disabled: replaced by showLockedAlert flash */ }
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL NAVIGATION FUNCTIONS
// These override any existing nextSlide/prevSlide to ensure barrier enforcement
// ═══════════════════════════════════════════════════════════════════════════════

function nextSlide() {
    const slider = document.getElementById('slider');
    if (!slider) return;

    // Check if navigation is allowed
    if (!NavigationGuard.canNavigateForward()) {
        NavigationGuard.showBlockedFeedback();
        return;
    }

    // Update valid slide before navigation
    NavigationGuard.lastValidSlide = NavigationGuard.getCurrentSlide();

    // Perform the navigation
    const currentIndex = NavigationGuard.getCurrentSlide();
    const targetIndex = currentIndex + 1;

    slider.scrollTo({
        left: targetIndex * slider.clientWidth,
        behavior: 'smooth'
    });

    // Update valid slide after navigation
    NavigationGuard.lastValidSlide = targetIndex;

    if (typeof SoundFX !== 'undefined' && SoundFX.playSlide) {
        // Sound handled in main.js to avoid double audio
    }
}

function prevSlide() {
    const slider = document.getElementById('slider');
    if (!slider) return;

    // Backward is always allowed
    const currentIndex = NavigationGuard.getCurrentSlide();
    const targetIndex = Math.max(0, currentIndex - 1);

    slider.scrollTo({
        left: targetIndex * slider.clientWidth,
        behavior: 'smooth'
    });

    // Update valid slide
    NavigationGuard.lastValidSlide = targetIndex;

    if (typeof SoundFX !== 'undefined' && SoundFX.playSlide) {
        // Sound handled in main.js to avoid double audio
    }

    // Stop any map button flash when going backward
    if (typeof MapSystem !== 'undefined') {
        MapSystem.updateButtonState(targetIndex);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK INTO MAPSYSTEM FOR CACHE UPDATES
// ═══════════════════════════════════════════════════════════════════════════════

// Listen for node unlocks to update cache
document.addEventListener('nodeUnlocked', () => {
    NavigationGuard.updateCachedMaxSlide();
});

// Expose globally
window.NavigationGuard = NavigationGuard;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => NavigationGuard.init(), 200);
});
