// ═══════════════════════════════════════════════════════════════════════════════
// PRESSURE.JS - Shadow & Timer System (Phase 3.2 - Fixed Vignette Logic)
// ═══════════════════════════════════════════════════════════════════════════════

const PressureSystem = {
    active: false,
    timerInterval: null,
    timeLeft: 0,
    maxTime: 30, // Default duration

    init() {
        console.log("⏱️ Pressure System v3.2 (Vignette Fix) Initialized");
        this.injectUI();
        this.injectClockButton();
        this.setupSlideChangeListener();
    },

    // --- 1. INJECT SHADOW & TIMER UI ---
    injectUI() {
        // Remove existing elements if they exist (Clean slate for the fix)
        const existingShadow = document.getElementById('pressure-shadow');
        if (existingShadow) existingShadow.remove();
        const existingTimer = document.getElementById('pressure-timer');
        if (existingTimer) existingTimer.remove();
        const existingWarning = document.getElementById('pressure-warning');
        if (existingWarning) existingWarning.remove();

        // THE VIGNETTE (Fixed Gradient)
        // Uses 'ellipse' to match 16:9 screens.
        // transparent 45%: Keeps the center perfectly clear for text.
        // black 100%: The edges go fully dark.
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
            z-index: 8000; 
            background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 75%, black 100%);
            opacity: 0;
            transition: opacity 0.5s linear;
            mix-blend-mode: normal;
        "></div>`;

        // THE TIMER BAR
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
            z-index: 8001; 
            opacity: 0;
            transition: opacity 0.3s ease;
            overflow: visible;
        ">
            <div id="pressure-fill" style="
                position: absolute; left: 0; top: 0; height: 100%; width: 100%;
                background: linear-gradient(90deg, #22d3ee, #facc15, #ef4444);
                border-radius: 16px;
                transition: width 1s linear;
            "></div>
            
            <div id="pressure-hero" style="position: absolute; left: -30px; top: 50%; transform: translateY(-50%); font-size: 24px;">🛡️</div>
            <div id="pressure-villain" style="position: absolute; right: 0; top: 50%; transform: translate(50%, -50%); font-size: 24px; transition: right 1s linear;">👻</div>
        </div>
        
        <div id="pressure-warning" style="
            position: fixed;
            top: 110px;
            left: 50%;
            transform: translateX(-50%);
            color: #ef4444;
            font-family: 'Fredoka', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
            text-shadow: 0 0 20px rgba(0,0,0,0.9);
            z-index: 8002;
            opacity: 0;
            transition: opacity 0.3s ease;
            white-space: nowrap;
        ">⚠️ THE SHADOW APPROACHES!</div>`;

        document.body.insertAdjacentHTML('beforeend', shadowHTML);
        document.body.insertAdjacentHTML('beforeend', timerHTML);
    },

    // --- 2. HEADER CLOCK BUTTON ---
    injectClockButton() {
        const slideCounter = document.getElementById('slide-counter');
        if (!slideCounter || document.getElementById('pressure-clock-btn')) return;

        const clockHTML = `
        <button id="pressure-clock-btn" 
            title="Start Timer"
            class="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5 transition-all hover:bg-black/50 hover:border-brand-500/50 group cursor-pointer mr-2">
            <span id="pressure-clock-icon" class="text-lg group-hover:scale-110">⏱️</span>
            <span class="hidden md:inline text-xs font-bold uppercase tracking-widest text-secondary group-hover:text-brand-400">Timer</span>
        </button>`;

        slideCounter.insertAdjacentHTML('beforebegin', clockHTML);

        document.getElementById('pressure-clock-btn').addEventListener('click', () => {
            if (this.active) this.stopTimer();
            else this.startTimer(this.maxTime);
        });
    },

    // --- 3. STOP ON NAVIGATION ---
    setupSlideChangeListener() {
        const slider = document.getElementById('slider');
        if (!slider) return;
        slider.addEventListener('scroll', () => {
            if (this.active) this.stopTimer();
        }, { passive: true });
    },

    // --- 4. START TIMER LOGIC ---
    startTimer(seconds) {
        this.stopTimer();
        this.active = true;
        this.maxTime = seconds;
        this.timeLeft = seconds;

        const timer = document.getElementById('pressure-timer');
        const fill = document.getElementById('pressure-fill');
        const shadow = document.getElementById('pressure-shadow');
        const villain = document.getElementById('pressure-villain');
        const warning = document.getElementById('pressure-warning');
        const clockIcon = document.getElementById('pressure-clock-icon');

        // Initial UI State
        if (timer) {
            timer.style.opacity = '1';
            timer.style.borderColor = 'rgba(255,255,255,0.2)';
        }
        if (fill) fill.style.width = '100%';
        if (villain) villain.style.right = '0%';
        if (shadow) shadow.style.opacity = '0'; // Start invisible
        if (warning) warning.style.opacity = '0'; // Start invisible
        if (clockIcon) clockIcon.textContent = '⏳';

        // THE LOOP
        this.timerInterval = setInterval(() => {
            if (!this.active) return;

            this.timeLeft--;
            const pct = (this.timeLeft / this.maxTime) * 100;

            // 1. Update Bar
            if (fill) fill.style.width = `${pct}%`;

            // 2. Move Villain (follows bar edge)
            if (villain) villain.style.right = `${100 - pct}%`;

            // 3. SHADOW LOGIC (The Fix)
            // Only start fading in when we hit the danger zone (Last 10 seconds)
            if (this.timeLeft <= 10) {
                // Calculate opacity: 10s = 0.0, 0s = 1.0
                const urgency = (10 - this.timeLeft) / 10;

                // Show Warning Text
                if (warning) warning.style.opacity = '1';

                // Red Border on Timer
                if (timer) timer.style.borderColor = '#ef4444';

                // Ramp up Shadow Opacity
                if (shadow) {
                    // Base opacity calculation
                    let shadowOp = urgency * 0.95; // Cap at 0.95

                    // Pulse effect in last 5 seconds (heartbeat)
                    if (this.timeLeft <= 5) {
                        shadowOp += Math.sin(Date.now() / 200) * 0.05;
                    }

                    shadow.style.opacity = Math.max(0, shadowOp).toFixed(2);
                }
            } else {
                // Safe Zone (>10s)
                if (shadow) shadow.style.opacity = '0';
                if (warning) warning.style.opacity = '0';
            }

            // 4. TIMEOUT
            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }

        }, 1000);
    },

    stopTimer() {
        this.active = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Hide Everything
        ['pressure-timer', 'pressure-shadow', 'pressure-warning'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });

        const clockIcon = document.getElementById('pressure-clock-icon');
        if (clockIcon) clockIcon.textContent = '⏱️';
    },

    handleTimeout() {
        this.stopTimer();

        // Flash Shadow Red
        const shadow = document.getElementById('pressure-shadow');
        if (shadow) {
            // Override gradient for a split second red flash
            shadow.style.transition = 'none';
            shadow.style.background = 'rgba(239, 68, 68, 0.4)';
            shadow.style.opacity = '1';

            setTimeout(() => {
                // Fade out
                shadow.style.transition = 'opacity 0.5s ease';
                shadow.style.opacity = '0';
                // Restore gradient after fade
                setTimeout(() => {
                    shadow.style.background = 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 75%, black 100%)';
                }, 500);
            }, 100);
        }

        // Screen Shake & Sound
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 500);

        if (typeof SoundFX !== 'undefined' && SoundFX.playIncorrect) {
            SoundFX.playIncorrect();
        }

        // Apply Damage
        if (typeof GameEngine !== 'undefined' && GameEngine.takeDamage) {
            GameEngine.takeDamage(20);
        }
    }
};

// Auto-Init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => PressureSystem.init(), 500);
});
