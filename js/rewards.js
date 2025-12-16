// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS.JS - v3.2: Fully Calibrated & Dual-Layer FX
// ═══════════════════════════════════════════════════════════════════════════════

const RewardsEngine = {
    // === CALIBRATED TARGETS (Based on DOM Index) ===
    // These numbers represent the EXACT number of correct clicks required.
    // REALIGNED to match map.js node configuration and actual HTML slide positions
    targets: {
        // Hunt Games from Central Hub Camp (N3A, N3B, N3C)
        10: 5,  // Things & Animals Hunt (N3C) - 5 correct items
        11: 5,  // People Hunt (N3A) - 5 correct items
        12: 5,  // Places Hunt (N3B) - 5 correct items
        // Other game slides
        7: 6,   // Norah Spot Nouns (slide 7)
        14: 4,  // Common Check
        20: 4,  // Quick Check (Proper Nouns)
        // CORRECTED INDICES for Detective Hub and Trial Hub sections:
        28: 10, // Detective Intro / Mr Muddle sentences (slide 28)
        29: 9,  // Evidence A: Locations (slide 29) - 9 location words
        30: 6,  // Evidence B: People & Dates (slide 30) - 6 words
        31: 4,  // Quiz 1: People & I (slide 31)
        32: 4,  // Quiz 2: Places & Streets (slide 32)
        33: 3,  // Quiz 3: Days & Dates (slide 33)
        34: 3   // Exit Ticket Riddles (slide 34)
    },

    state: {},
    lastX: 0.5,
    lastY: 0.5,

    init() {
        console.log("✨ RewardsEngine v3.2 (Calibrated) Active");
        this.trackMouse();
        this.setupListeners();
    },

    trackMouse() {
        ['mousemove', 'mousedown', 'touchstart'].forEach(evt =>
            document.addEventListener(evt, (e) => {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                if (clientX) {
                    this.lastX = clientX / window.innerWidth;
                    this.lastY = clientY / window.innerHeight;
                }
            }, { passive: true })
        );
    },

    setupListeners() {
        document.addEventListener('game:correct', (e) => this.handleAnswer(e.detail, true));
        document.addEventListener('game:incorrect', (e) => this.handleAnswer(e.detail, false));
    },
    // 2. Process Answer
    handleAnswer(detail, isCorrect) {
        try {
            // Calculate Index dynamically
            const slideIndex = this.getCurrentSlideIndex();
            const context = detail?.context || "unknown_" + Date.now();

            // Debug Log to help you verify
            console.log(`🖱️ Interaction on Slide ${slideIndex}. Correct: ${isCorrect}`);

            if (!this.state[slideIndex]) {
                this.state[slideIndex] = { found: new Set(), wrong: 0, completed: false };
            }
            const tracker = this.state[slideIndex];

            if (isCorrect) {
                if (!tracker.found.has(context)) {
                    tracker.found.add(context);

                    // VISUAL: Pop at mouse location
                    this.fireDualConfetti(this.lastX, this.lastY);

                    // COMPLETION CHECK
                    const target = this.targets[slideIndex];
                    if (target) {
                        console.log(`🎯 Progress: ${tracker.found.size}/${target}`);
                        if (tracker.found.size >= target && !tracker.completed) {
                            this.triggerCompletion(slideIndex, tracker);
                        }
                    }
                }
            } else {
                tracker.wrong++;
            }
        } catch (err) {
            console.error("⚠️ RewardsEngine Error:", err);
            // Swallowing error to prevent breaking games.js logic
        }
    },

    triggerCompletion(slideIndex, tracker) {
        tracker.completed = true;

        // Quality Score
        const accuracy = tracker.found.size / (tracker.found.size + tracker.wrong);
        console.log(`🏆 COMPLETE! Accuracy: ${(accuracy * 100).toFixed(0)}%`);

        if (accuracy === 1.0) {
            this.fireCrystalRain('gold');
            this.showBigText("PERFECT! 💎", "#22d3ee"); // Cyan
            if (window.SoundFX) SoundFX.playSuccess();
        } else if (accuracy >= 0.7) {
            this.fireCrystalRain('silver');
            this.showBigText("Great Job! ⭐", "#fbbf24"); // Gold
        } else {
            this.showBigText("Completed!", "#a3e635"); // Green
        }
    },

    // === DUAL CONFETTI SYSTEM ===
    fireDualConfetti(x, y) {
        if (typeof confetti === 'undefined') return;

        // 1. Precision Pop (At Mouse)
        confetti({
            particleCount: 12,
            spread: 30,
            startVelocity: 15,
            origin: { x: x, y: y },
            colors: ['#ffffff', '#22d3ee'],
            ticks: 30,
            zIndex: 10001
        });

        // 2. Power Burst (From Bottom) - Adds "Dynamism"
        confetti({
            particleCount: 8,
            angle: 90,
            spread: 45,
            startVelocity: 35,
            origin: { x: 0.5, y: 1 },
            colors: ['#22d3ee'],
            ticks: 50,
            zIndex: 10000
        });
    },

    fireCrystalRain(tier) {
        if (typeof confetti === 'undefined') return;
        const defaults = { origin: { y: 0.6 }, zIndex: 10002 };

        if (tier === 'gold') {
            confetti({ ...defaults, particleCount: 100, spread: 70, startVelocity: 60, colors: ['#22d3ee', '#fbbf24', '#ffffff'] });
        } else {
            confetti({ ...defaults, particleCount: 60, spread: 60, colors: ['#fbbf24', '#f59e0b'] });
        }
    },

    showBigText(text, color) {
        const id = 'reward-text-overlay';
        const existing = document.getElementById(id);
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = id;
        el.innerText = text;
        el.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0);
            font-family: 'Fredoka', sans-serif; font-size: 6rem; font-weight: 800;
            color: ${color}; text-shadow: 0 10px 30px rgba(0,0,0,0.5); 
            z-index: 10003; pointer-events: none; 
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.style.transform = 'translate(-50%, -50%) scale(1)');
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, -120%) scale(1.2)'; setTimeout(() => el.remove(), 600); }, 2200);
    },

    getCurrentSlideIndex() {
        const slider = document.getElementById('slider');
        if (!slider) return 0;
        return Math.round(slider.scrollLeft / slider.clientWidth);
    }
};

document.addEventListener('DOMContentLoaded', () => setTimeout(() => RewardsEngine.init(), 1000));
