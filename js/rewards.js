// ═══════════════════════════════════════════════════════════════════════════════
// REWARDS.JS - v3.2: Fully Calibrated & Dual-Layer FX
// ═══════════════════════════════════════════════════════════════════════════════

const RewardsEngine = {
    // === CALIBRATED TARGETS (Based on DOM Index) ===
    // These numbers represent the EXACT number of correct clicks required.
    // REALIGNED to match map.js node configuration and actual HTML slide positions
    targets: {
        // Hunt Games (Hub A)
        'people_hunt': 5,
        'places_hunt': 5,
        'things_hunt': 5,
        // Other interactive slides
        'sentence_spotting': 6,
        'check_common_nouns': 4,
        'proper_quick_check_placeholder': 4,
        // Detective Hub & Trial Hub
        'mr_muddle_intro': 10,
        'evidence_a_locations': 9,
        'evidence_b_people_dates': 6,
        'case_closed': 54,
        'quiz_people_i': 4,
        'quiz_places_streets': 4,
        'quiz_specific_dates': 3,
        'exit_ticket_riddle': 3
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
            // Calculate Key dynamically
            const slideKey = window.SlideRegistry ? window.SlideRegistry.getCurrentKey() : null;
            if (!slideKey) return;

            const context = detail?.context || "unknown_" + Date.now();

            // Debug Log
            console.log(`🖱️ Interaction on Slide [${slideKey}]. Correct: ${isCorrect}`);

            if (!this.state[slideKey]) {
                this.state[slideKey] = { found: new Set(), wrong: 0, completed: false };
            }
            const tracker = this.state[slideKey];

            if (isCorrect) {
                if (!tracker.found.has(context)) {
                    tracker.found.add(context);

                    // VISUAL: Pop at mouse location
                    this.fireDualConfetti(this.lastX, this.lastY);

                    // COMPLETION CHECK
                    const target = this.targets[slideKey];
                    if (target) {
                        console.log(`🎯 Progress: ${tracker.found.size}/${target}`);
                        if (tracker.found.size >= target && !tracker.completed) {
                            this.triggerCompletion(slideKey, tracker);
                        }
                    }
                }
            } else {
                tracker.wrong++;
            }
        } catch (err) {
            console.error("⚠️ RewardsEngine Error:", err);
        }
    },

    triggerCompletion(slideKey, tracker) {
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
        if (typeof confetti === 'undefined') {
            console.log("🎊 Rewards: Loading confetti library...");
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
            script.onload = () => {
                console.log("🎊 Rewards: Confetti loaded. Firing burst.");
                this.fireDualConfetti(x, y); // Retry once loaded
            };
            document.head.appendChild(script);
            return;
        }

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
