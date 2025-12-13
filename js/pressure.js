// ═══════════════════════════════════════════════════════════════════════════════
// PRESSURE.JS - The Shadow & Timer System (Phase 3.1 - Improved UX)
// ═══════════════════════════════════════════════════════════════════════════════
// Independent module: Timer starts via header clock icon, stops on slide change.
// ═══════════════════════════════════════════════════════════════════════════════

const PressureSystem = {
    active: false,
    timerInterval: null,
    timeLeft: 0,
    maxTime: 30, // Default 30 seconds

    init() {
        console.log("⏱️ Pressure System v3.1 Initialized");
        this.injectUI();
        this.injectClockButton();
        this.setupSlideChangeListener();
    },

    // --- 1. INJECT SHADOW & TIMER UI ---
    injectUI() {
        if (document.getElementById('pressure-shadow')) return;

        // The Shadow Vignette - direct dark overlay, no mix-blend-mode
        // Uses VERY high z-index (9000) to force visibility above all slide content
        // but below HUD (9999) and confetti (10000+)
        const shadowHTML = `
        <div id="pressure-shadow" style="
            position: fixed; 
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none; 
            z-index: 9000; 
            background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
        "></div>`;

        // The Timer Bar (Centered floating)
        const timerHTML = `
        <div id="pressure-timer" style="
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: 320px;
            height: 20px;
            background: rgba(0,0,0,0.7);
            border-radius: 20px;
            border: 2px solid rgba(255,255,255,0.2);
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s ease;
            overflow: visible;
        ">
            <!-- Fill bar: Shrinks from RIGHT to LEFT (threat approaches from right) -->
            <div id="pressure-fill" style="
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, #22d3ee, #facc15, #ef4444);
                border-radius: 16px;
                transition: width 1s linear;
            "></div>
            
            <!-- Hero icon: Stays at LEFT (safe side) -->
            <div id="pressure-hero" style="
                position: absolute;
                left: -30px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 24px;
                z-index: 10;
            ">🛡️</div>
            
            <!-- Villain icon: Moves from RIGHT towards LEFT (chasing hero) -->
            <div id="pressure-villain" style="
                position: absolute;
                right: 0;
                top: 50%;
                transform: translate(50%, -50%);
                font-size: 24px;
                z-index: 10;
                transition: right 1s linear;
            ">👻</div>
        </div>
        
        <!-- Warning Text -->
        <div id="pressure-warning" style="
            position: fixed;
            top: 110px;
            left: 50%;
            transform: translateX(-50%);
            color: #ef4444;
            font-family: 'Fredoka', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
            z-index: 101;
            opacity: 0;
            transition: opacity 0.3s ease;
        ">⚠️ THE SHADOW APPROACHES!</div>`;

        document.body.insertAdjacentHTML('beforeend', shadowHTML);
        document.body.insertAdjacentHTML('beforeend', timerHTML);
    },

    // --- 2. INJECT CLOCK BUTTON IN HEADER ---
    injectClockButton() {
        // Find the header nav area (where music controls are)
        const slideCounter = document.getElementById('slide-counter');
        if (!slideCounter || document.getElementById('pressure-clock-btn')) return;

        const clockHTML = `
        <button id="pressure-clock-btn" 
            title="Start/Stop Pressure Timer"
            class="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5 transition-all hover:bg-black/50 hover:border-brand-500/50 group cursor-pointer"
            style="margin-right: 8px;">
            <span id="pressure-clock-icon" class="text-lg transition-all group-hover:scale-110">⏱️</span>
            <span class="hidden md:inline text-xs font-bold uppercase tracking-widest text-secondary group-hover:text-brand-400 transition-colors">Timer</span>
        </button>`;

        // Insert before slide counter
        slideCounter.insertAdjacentHTML('beforebegin', clockHTML);

        // Add click handler
        document.getElementById('pressure-clock-btn').addEventListener('click', () => {
            if (this.active) {
                this.stopTimer();
            } else {
                this.startTimer(this.maxTime);
            }
        });
    },

    // --- 3. STOP TIMER ON SLIDE CHANGE ---
    setupSlideChangeListener() {
        const slider = document.getElementById('slider');
        if (!slider) return;

        slider.addEventListener('scroll', () => {
            // Immediately stop timer when user scrolls
            if (this.active) {
                this.stopTimer();
                console.log("⏱️ Timer stopped (slide changed)");
            }
        }, { passive: true });
    },

    // --- 4. START TIMER ---
    startTimer(seconds) {
        this.stopTimer(); // Clear any existing
        this.active = true;
        this.maxTime = seconds;
        this.timeLeft = seconds;

        const timer = document.getElementById('pressure-timer');
        const fill = document.getElementById('pressure-fill');
        const shadow = document.getElementById('pressure-shadow');
        const villain = document.getElementById('pressure-villain');
        const warning = document.getElementById('pressure-warning');
        const clockIcon = document.getElementById('pressure-clock-icon');

        // Show UI
        if (timer) timer.style.opacity = '1';
        if (fill) fill.style.width = '100%';
        if (villain) villain.style.right = '0%';
        if (shadow) shadow.style.opacity = '0';
        if (warning) warning.style.opacity = '0';
        if (clockIcon) clockIcon.textContent = '⏳'; // Active state

        console.log(`⏱️ Timer started: ${seconds}s`);

        // Countdown Loop
        this.timerInterval = setInterval(() => {
            if (!this.active) return;

            this.timeLeft--;
            const pct = (this.timeLeft / this.maxTime) * 100;

            // Bar shrinks from right to left
            if (fill) fill.style.width = `${pct}%`;

            // Villain moves from right (100%) towards left (follows the bar edge)
            // As pct goes 100 -> 0, villain right goes 0% -> 100% (moving towards hero)
            const villainPos = 100 - pct;
            if (villain) villain.style.right = `${pct}%`;

            // Shadow INTENSIFIES as time runs out (pct goes down, opacity goes up)
            // Start with small opacity and ramp up to 0.85 at the end
            const shadowIntensity = ((100 - pct) / 100) * 0.85;
            if (shadow) {
                shadow.style.opacity = Math.max(0.1, shadowIntensity).toString(); // Minimum 0.1 so it's visible
            }
            console.log(`🌑 Shadow intensity: ${shadowIntensity.toFixed(2)}`);

            // Warning appears at 10 seconds
            if (this.timeLeft <= 10 && this.timeLeft > 0) {
                if (warning) warning.style.opacity = '1';
                if (timer) timer.style.borderColor = '#ef4444';
            }

            // Pulsing effect in last 5 seconds
            if (this.timeLeft <= 5 && this.timeLeft > 0) {
                if (shadow) {
                    shadow.style.opacity = (shadowIntensity + Math.sin(Date.now() / 200) * 0.1).toString();
                }
            }

            // TIMEOUT!
            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }

        }, 1000);
    },

    // --- 5. STOP TIMER ---
    stopTimer() {
        this.active = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timer = document.getElementById('pressure-timer');
        const shadow = document.getElementById('pressure-shadow');
        const warning = document.getElementById('pressure-warning');
        const clockIcon = document.getElementById('pressure-clock-icon');

        if (timer) {
            timer.style.opacity = '0';
            timer.style.borderColor = 'rgba(255,255,255,0.2)';
        }
        if (shadow) shadow.style.opacity = '0';
        if (warning) warning.style.opacity = '0';
        if (clockIcon) clockIcon.textContent = '⏱️'; // Inactive state
    },

    // --- 6. TIMEOUT (SHADOW STRIKE!) ---
    handleTimeout() {
        this.stopTimer();
        console.log("💀 SHADOW STRIKE!");

        // Flash red
        const shadow = document.getElementById('pressure-shadow');
        if (shadow) {
            shadow.style.background = 'radial-gradient(ellipse at center, transparent 0%, rgba(239,68,68,0.8) 100%)';
            shadow.style.opacity = '0.9';
            setTimeout(() => {
                shadow.style.opacity = '0';
                setTimeout(() => {
                    shadow.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.9) 100%)';
                }, 300);
            }, 500);
        }

        // Screen shake
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 500);

        // Sound effect
        if (typeof SoundFX !== 'undefined' && SoundFX.playIncorrect) {
            SoundFX.playIncorrect();
        }

        // Apply damage to GameEngine (safe bridge)
        if (typeof GameEngine !== 'undefined' && GameEngine.takeDamage) {
            GameEngine.takeDamage(20);
        }
    }
};

// Expose global toggle for backwards compatibility
window.togglePressureSystem = (enabled) => {
    if (enabled) PressureSystem.startTimer(PressureSystem.maxTime);
    else PressureSystem.stopTimer();
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => PressureSystem.init(), 800);
});
