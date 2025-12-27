// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION.JS - Phase 2.1: Performance Monitor & Crystal Rain
// Version: 2.1.1 - RESTORED with Full Features + Tiered Mastery
// Depends on: core.js (classData), audio.js (SoundFX), canvas-confetti library
// Integrates with: main.js (lobby/startClass), games.js (answer events)
// ═══════════════════════════════════════════════════════════════════════════════

const GameEngine = {
    // === STATE ===
    active: false,
    initialized: false,

    // === ASSET BASE URL ===
    assetBase: 'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/characters/',

    config: {
        characterId: null,
        disableRewards: false,
        maxHealth: 100,
        currentHealth: 100,
        crystals: 0,
        comboCount: 0,
        damagePerWrong: 8,
        damagePerWrongTimed: 16,
        crystalsPerCorrect: 10,
        crystalMultiplier: 1,
        comboThresholds: { good: 3, excellent: 5, unstoppable: 10 },
        powerups: { clues: 0, shields: 0, freezes: 0 },
        timersEnabled: false,
        timerDuration: 30,
        timerInterval: null,
        isFrozen: false
    },

    // === SLIDE MASTERY CONFIGURATION ===
    slideTargets: {
        8: 5,   // Spot Noun (5 nouns to find)
        9: 6,   // Interactive Sentences (6 nouns total)
        14: 4,  // Common Check (4 common nouns)
        20: 4,  // Quick Check (Proper Nouns section)
        // CORRECTED INDICES for Detective Hub and Trial Hub sections:
        28: 10, // Detective Intro / Mr Muddle sentences (slide 28)
        29: 9,  // Evidence A: Locations (slide 29)
        30: 6,  // Evidence B: People & Dates (slide 30)
        31: 54, // Case Closed (slide 31) - 54 nouns
        32: 4,  // Quiz 1: People & I (slide 32)
        33: 4,  // Quiz 2: Places & Streets (slide 33)
        34: 3,  // Quiz 3: Days & Dates (slide 34)
        35: 3   // Exit Ticket Riddles (slide 35)
    },

    slideProgress: {},

    // === CHARACTER ROSTER WITH FULL ASSETS ===
    characters: {
        'rusty': {
            name: "Rusty",
            role: "The Tank",
            bio: "A sturdy robot built for endurance. Rusty regenerates health over time, perfect for students who learn through persistence.",
            health: 150,
            perk: "Reboot Protocol",
            perkDesc: "+10 HP every 5 correct answers",
            color: "#22d3ee",
            icon: "🤖",
            stats: { endurance: 95, wisdom: 60, speed: 40, luck: 55 },
            assets: {
                select: 'rusty_select.jpg',
                healthy: 'rusty_healthy.jpeg',
                hurt: 'rusty_hurt.jpeg',
                critical: 'rusty_critical.jpeg',
                ko: 'rusty_ko.jpeg'
            },
            startingPowerups: { clues: 0, shields: 2, freezes: 0 }
        },
        'luna': {
            name: "Luna",
            role: "The Scholar",
            bio: "A wise owl who sees through confusion. Luna's wisdom feathers reveal answers when you need a helping hand.",
            health: 100,
            perk: "Night Vision",
            perkDesc: "3 clue tokens to reveal answers",
            color: "#c084fc",
            icon: "🦉",
            stats: { endurance: 50, wisdom: 100, speed: 55, luck: 70 },
            assets: {
                select: 'luna_select.jpg',
                healthy: 'luna_healthy.jpeg',
                hurt: 'luna_hurt.jpeg',
                critical: 'luna_critical.jpeg',
                ko: 'luna_ko.jpeg'
            },
            startingPowerups: { clues: 3, shields: 1, freezes: 0 }
        },
        'dash': {
            name: "Dash",
            role: "The Speedster",
            bio: "A lightning-fast fox who thrives on momentum. Dash earns double crystals but has lower health - high risk, high reward!",
            health: 80,
            perk: "Speed Streak",
            perkDesc: "2x crystal multiplier on all answers",
            color: "#fbbf24",
            icon: "🦊",
            crystalMultiplier: 2,
            stats: { endurance: 35, wisdom: 55, speed: 100, luck: 80 },
            assets: {
                select: 'dash_select.jpg',
                healthy: 'dash_healthy.jpeg',
                hurt: 'dash_hurt.jpeg',
                critical: 'dash_critical.jpeg',
                ko: 'dash_ko.jpeg'
            },
            startingPowerups: { clues: 0, shields: 1, freezes: 2 }
        },
        'ace': {
            name: "Agent Ace",
            role: "The Hero",
            bio: "A versatile secret agent ready for any mission. Ace has balanced stats and a bit of everything - ideal for first-timers.",
            health: 110,
            perk: "Versatile",
            perkDesc: "Balanced loadout for any challenge",
            color: "#34d399",
            icon: "🕵️",
            stats: { endurance: 70, wisdom: 70, speed: 70, luck: 65 },
            assets: {
                select: 'ace_select.jpg',
                healthy: 'ace_healthy.jpeg',
                hurt: 'ace_hurt.jpeg',
                critical: 'ace_critical.jpeg',
                ko: 'ace_ko.jpeg'
            },
            startingPowerups: { clues: 1, shields: 1, freezes: 1 }
        }
    },

    getAssetUrl(characterId, assetType) {
        const char = this.characters[characterId];
        if (!char || !char.assets || !char.assets[assetType]) return null;
        return this.assetBase + char.assets[assetType];
    },

    getHealthState(percent) {
        if (percent > 75) return 'healthy';
        if (percent > 50) return 'hurt';
        if (percent > 25) return 'critical';
        return 'ko';
    },

    preloadCharacterAssets() {
        const urls = [];
        Object.values(this.characters).forEach((char) => {
            if (char?.assets?.select) urls.push(this.assetBase + char.assets.select);
        });
        urls.push('https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/norah-hero-page.jpeg');

        urls.forEach((src) => {
            const img = new Image();
            img.decoding = 'async';
            img.src = src;
        });
    },

    // === INITIALIZATION ===
    init() {
        if (this.initialized) return;
        this.setupEventListeners();
        this.preloadCharacterAssets();
        this.initialized = true;
        console.log("💎 Gamification Engine v2.1.1 (Restored) Loaded");
    },

    restoreSession() {
        const savedGame = localStorage.getItem('nameGame_character');
        if (savedGame) {
            try {
                const parsed = JSON.parse(savedGame);
                this.config = { ...this.config, ...parsed };
                if (this.config.characterId && this.characters[this.config.characterId]) {
                    this.active = true;
                    this.injectHUD();
                    const maxHealth = this.config.maxHealth || 100;
                    const currentHealth = this.config.currentHealth ?? maxHealth;
                    const healthPercent = maxHealth ? (currentHealth / maxHealth) * 100 : 100;
                    if (window.EnergyBarController) {
                        EnergyBarController.updateHealth(healthPercent);
                    }
                    console.log("🎮 Game Session Restored:", this.config.characterId);
                }
            } catch (e) {
                console.warn("⚠️ Could not restore game state", e);
            }
        }
    },

    setupEventListeners() {
        document.addEventListener('game:correct', (e) => this.handleCorrect(e.detail));
        document.addEventListener('game:incorrect', (e) => this.handleIncorrect(e.detail));

        document.addEventListener('slide:change', () => {
            this.stopTimer();
            setTimeout(() => this.startTimer(), 1000);
        });
    },

    // 🛡️ PHASE 2: BRITISH ENGLISH STANDARDIZATION
    // Enforces capitalization for Titles (Mr, Mrs, Miss, Dr)
    validateBritishEnglish(text) {
        if (!text || typeof text !== 'string') return true;

        const titles = ['mr', 'mrs', 'miss', 'ms', 'dr', 'prof'];
        let source = text;

        if (source.includes('->')) {
            source = source.split('->').pop().trim();
        }

        const words = source.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const cleaned = words[i].replace(/[^a-zA-Z.]/g, '');
            if (!cleaned) continue;

            const normalized = cleaned.toLowerCase().replace(/\./g, '');
            if (titles.includes(normalized)) {
                const originalWord = cleaned.replace(/[^a-zA-Z]/g, '');
                if (originalWord && originalWord.charAt(0) !== originalWord.charAt(0).toUpperCase()) {
                    this.showFloatingText("Hint: Titles must be Capitalized!", "#fbbf24");
                    return false;
                }
            }
        }

        return true;
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // PERFORMANCE TRACKING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════════

    handleCorrect(detail) {
        if (!this.active) return;

        // 🛡️ PROTOCOL 5: XP FARMING CHECK
        if (this.config.disableRewards) {
            console.log("🚫 Rewards blocked (Review Mode)");
            return;
        }

        const answerText = detail?.answerText || detail?.text || detail?.context || '';
        if (!this.validateBritishEnglish(answerText)) return;

        const slideIndex = parseInt(detail?.slideIndex || this.getCurrentSlideIndex(), 10);
        this.trackProgress(slideIndex, true);

        const crystalsEarned = this.config.crystalsPerCorrect * this.config.crystalMultiplier;
        this.config.crystals += crystalsEarned;
        this.config.comboCount++;

        // Rusty's regeneration perk
        if (this.config.characterId === 'rusty' && this.config.comboCount > 0 && this.config.comboCount % 5 === 0) {
            const healAmount = Math.min(10, this.config.maxHealth - this.config.currentHealth);
            if (healAmount > 0) {
                this.config.currentHealth += healAmount;
                this.showFloatingText('+' + healAmount + ' HP', '#22d3ee');
            }
        }

        this.updateHUD();
        this.triggerGranularEffect();
        this.checkSlideCompletion(slideIndex);
        this.saveGameState();
    },

    handleIncorrect(detail) {
        if (!this.active) return;

        const slideIndex = parseInt(detail?.slideIndex || this.getCurrentSlideIndex(), 10);
        this.trackProgress(slideIndex, false);

        this.config.comboCount = 0;
        this.takeDamage(this.config.damagePerWrong);

        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 400);

        this.saveGameState();
    },

    getCurrentSlideIndex() {
        const slider = document.getElementById('slider');
        if (slider) {
            const slideWidth = slider.firstElementChild?.offsetWidth || 1;
            return Math.round(slider.scrollLeft / slideWidth);
        }
        return 0;
    },

    trackProgress(slideIdx, isCorrect) {
        if (!this.slideProgress[slideIdx]) {
            this.slideProgress[slideIdx] = { correct: 0, wrong: 0, completed: false };
        }

        const state = this.slideProgress[slideIdx];
        if (isCorrect) state.correct++;
        else state.wrong++;

        const target = this.slideTargets[slideIdx] || "?";
        console.log(`🧠 Slide ${slideIdx} Progress: ${state.correct}/${target} Correct (Wrongs: ${state.wrong})`);
    },

    checkSlideCompletion(slideIdx) {
        const state = this.slideProgress[slideIdx];
        const target = this.slideTargets[slideIdx];

        if (!target) return;

        if (state.correct >= target && !state.completed) {
            state.completed = true;
            this.calculateAndCelebrate(slideIdx, state.correct, state.wrong);
        }
    },

    calculateAndCelebrate(slideIdx, correct, wrong) {
        const totalAttempts = correct + wrong;
        const accuracy = correct / totalAttempts;

        console.log(`🎉 Slide ${slideIdx} COMPLETE! Accuracy: ${(accuracy * 100).toFixed(0)}%`);

        if (accuracy === 1) {
            this.triggerCrystalRain('perfect');
            this.showFloatingText("PERFECT! 💎", "#22d3ee", 2500);
            this.config.crystals += 50;
            if (typeof SoundFX !== 'undefined' && SoundFX.playSuccess) SoundFX.playSuccess();
        }
        else if (accuracy >= 0.7) {
            this.triggerCrystalRain('great');
            this.showFloatingText("Great Job! ⭐", "#fbbf24", 2000);
            this.config.crystals += 25;
        }
        else if (accuracy >= 0.4) {
            this.triggerCrystalRain('good');
            this.showFloatingText("Good Effort!", "#a3e635", 1500);
            this.config.crystals += 10;
        }
        else {
            this.showFloatingText("Keep Practicing!", "#9ca3af", 1500);
        }

        this.updateHUD();
        this.saveGameState();
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // VISUAL EFFECTS ENGINE
    // ═══════════════════════════════════════════════════════════════════════════════

    triggerGranularEffect() {
        // SILENCED for RewardsEngine v3.0
        // if (typeof confetti === 'undefined') return;
        // ...
    },


    triggerCrystalRain(tier) {
        // SILENCED for RewardsEngine v3.0
        // RewardsEngine now handles all confetti celebrations
    },


    showFloatingText(text, color, duration = 1000) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `position: fixed; left: 50%; top: 40%; transform: translate(-50%, -50%) scale(0.5); color: ${color}; font-family: "Fredoka", sans-serif; font-size: 4rem; font-weight: bold; text-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index: 10000; pointer-events: none; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0;`;
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translate(-50%, -50%) scale(1)'; });
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, -80%) scale(1.1)'; setTimeout(() => el.remove(), 500); }, duration);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // CHARACTER SELECTION SCREEN
    // ═══════════════════════════════════════════════════════════════════════════════
    showCharacterSelect(skipAnimation = false) {
        const lobby = document.getElementById('lobby-screen');
        if (!lobby) { console.error("❌ Could not find lobby-screen"); return; }

        lobby.style.background = '#0B0C15';
        lobby.style.backdropFilter = 'none';

        const characterSelectHTML = `
        <div id="character-select-container" class="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="parallax-layer" data-speed="0.2">
                    <div class="nebula-gradient"></div>
                </div>
                <div class="parallax-layer" data-speed="0.5">
                    <div class="glow-swirl glow-1"></div>
                    <div class="glow-swirl glow-2"></div>
                </div>
                <div class="parallax-layer" data-speed="0.7">
                    <div class="shape shape-1"></div>
                    <div class="shape shape-2"></div>
                    <div class="shape shape-3"></div>
                </div>
            </div>
            <div class="absolute inset-0 bg-transparent">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 1s;"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" style="animation-delay: 2s;"></div>
                <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]"></div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none"></div>

            
            <div class="relative z-10 text-center mb-4 md:mb-6">
                <p class="text-brand-400/70 text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-1 md:mb-2">Mission Briefing</p>
                <h1 class="font-display text-3xl md:text-5xl font-bold text-white mb-1 md:mb-2">Choose Your <span class="text-brand-400">Agent</span></h1>
                <p class="text-gray-400 text-xs md:text-sm max-w-lg mx-auto">Select your companion for this learning adventure.</p>
            </div>

            <div class="relative z-10 flex-1 w-full max-w-6xl flex gap-2 md:gap-4 mb-4 md:mb-6" id="character-strips">${this._buildCharacterStrips()}</div>

            <div class="relative z-10 w-full max-w-xl">
                <div class="glass-panel p-4 md:p-5 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md">
                    <div class="flex flex-col md:flex-row gap-3 items-center">
                        <div class="flex-1 w-full md:w-auto">
                            <label class="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Agent Name</label>
                            <input type="text" id="student-name" placeholder="Enter your name..." value="${(typeof classData !== 'undefined' && classData.studentName) || ''}" class="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all duration-300">
                        </div>
                        <div class="w-full md:w-40">
                            <label class="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</label>
                            <input type="date" id="class-date" value="${(typeof classData !== 'undefined' && classData.classDate) || new Date().toISOString().split('T')[0]}" class="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/50 focus:bg-white/10 transition-all duration-300 [color-scheme:dark]">
                        </div>
                    </div>
                    <button onclick="GameEngine.beginMission()" id="start-mission-btn" class="w-full mt-4 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg uppercase tracking-widest transition-all duration-300 ${this.config.characterId ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-black hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,154,92,0.4)] cursor-pointer' : 'bg-gray-800/80 text-gray-500 cursor-not-allowed'}" ${this.config.characterId ? '' : 'disabled'}>${this.config.characterId ? '🚀 Start Mission as ' + this.characters[this.config.characterId].name : '← Select an Agent to Begin'}</button>
                </div>
            </div>
        </div>`;

        lobby.innerHTML = characterSelectHTML;
        const container = document.getElementById('character-select-container');
        if (container) {
            if (skipAnimation) {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            } else {
                const useSlowFade = !!window.__gcdIntroExit;
                const duration = useSlowFade ? 1.2 : 0.6;
                const delay = useSlowFade ? 80 : 50;
                container.style.opacity = '0';
                container.style.transform = 'translateY(14px)';
                setTimeout(() => {
                    container.style.transition = `opacity ${duration}s ease, transform ${duration}s ease`;
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, delay);
                if (useSlowFade) window.__gcdIntroExit = false;
            }
        }
    },

    _buildCharacterStrips() {
        let html = '';
        ['rusty', 'luna', 'dash', 'ace'].forEach((id) => {
            const char = this.characters[id];
            const isSelected = this.config.characterId === id;
            const selectUrl = this.getAssetUrl(id, 'select');
            html += `<div class="character-strip flex-1 relative cursor-pointer group transition-all duration-300 rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-offset-2 ring-offset-black scale-[1.02] z-10' : 'hover:scale-[1.01] opacity-80 hover:opacity-100'}" style="${isSelected ? 'ring-color: ' + char.color + ';' : ''}" onclick="GameEngine.selectCharacter('${id}')" data-character="${id}">
                <div class="absolute inset-0 overflow-hidden"><img src="${selectUrl}" alt="${char.name}" loading="eager" decoding="async" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-6xl\\'>${char.icon}</div>';"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none"></div>
                ${isSelected ? `<div class="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-20" style="background: ${char.color};"><svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>` : ''}
                <div class="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
                    <h3 class="font-display text-lg md:text-xl font-bold text-white mb-0.5 drop-shadow-lg">${char.name}</h3>
                    <span class="inline-block text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2" style="background: ${char.color}30; color: ${char.color}; border: 1px solid ${char.color}50;">${char.role}</span>
                    <p class="text-[10px] md:text-xs text-gray-300 leading-tight mb-2 line-clamp-2 ${isSelected ? '' : 'hidden md:block'}">${char.bio}</p>
                    <div class="space-y-1.5 ${isSelected ? '' : 'hidden md:block'}">${this._buildStatBar('HP', char.health, 150, char.color)}${this._buildStatBar('END', char.stats.endurance, 100, char.color)}${this._buildStatBar('WIS', char.stats.wisdom, 100, char.color)}${this._buildStatBar('SPD', char.stats.speed, 100, char.color)}</div>
                    <div class="mt-2 flex items-center gap-1.5 ${isSelected ? '' : 'hidden md:block'}"><span class="text-xs" style="color: ${char.color};">★</span><span class="text-[10px] text-gray-400 uppercase tracking-wider">${char.perk}</span></div>
                </div>
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="box-shadow: inset 0 0 60px ${char.color}20;"></div>
            </div>`;
        });
        return html;
    },

    _buildStatBar(label, value, max, color) {
        const percent = Math.min((value / max) * 100, 100);
        return `<div class="flex items-center gap-2"><span class="text-[8px] md:text-[9px] text-gray-500 font-bold w-6 md:w-7">${label}</span><div class="flex-1 h-1.5 md:h-2 bg-black/60 rounded-full overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="width: ${percent}%; background: linear-gradient(90deg, ${color}, ${color}88);"></div></div><span class="text-[8px] md:text-[9px] text-gray-400 w-6 md:w-8 text-right">${value}</span></div>`;
    },

    selectCharacter(id) {
        if (!this.characters[id]) return;
        if (typeof SoundFX !== 'undefined') { SoundFX.init(); if (SoundFX.ctx && SoundFX.ctx.state === 'suspended') SoundFX.unlock({ startMusic: false }); if (SoundFX.playPop) SoundFX.playPop(); }
        const nameInput = document.getElementById('student-name');
        const dateInput = document.getElementById('class-date');
        const savedName = nameInput?.value || '';
        const savedDate = dateInput?.value || new Date().toISOString().split('T')[0];
        if (typeof classData !== 'undefined') { classData.studentName = savedName; classData.classDate = savedDate; }
        this.config.characterId = id;
        this.saveGameState();
        this.showCharacterSelect(true);
        if (window.EnergyBarController) {
            EnergyBarController.updateHealth(100);
        }
        setTimeout(() => { const newNameInput = document.getElementById('student-name'); const newDateInput = document.getElementById('class-date'); if (newNameInput) newNameInput.value = savedName; if (newDateInput) newDateInput.value = savedDate; }, 50);
        console.log(`🎮 Selected: ${this.characters[id].name}`);
    },

    beginMission() {
        if (typeof SoundFX !== 'undefined') SoundFX.unlock({ startMusic: false });
        if (!this.config.characterId) return;

        const nameInput = document.getElementById('student-name');
        const dateInput = document.getElementById('class-date');
        const playerName = nameInput?.value?.trim();

        if (!playerName) {
            nameInput?.focus();
            nameInput?.classList.add('border-red-500/50', 'shake-screen');
            setTimeout(() => nameInput?.classList.remove('border-red-500/50', 'shake-screen'), 1000);
            return;
        }

        if (typeof classData !== 'undefined') {
            classData.studentName = playerName;
            classData.classDate = dateInput?.value || new Date().toISOString().split('T')[0];
        }

        const char = this.characters[this.config.characterId];

        // Stats Setup
        this.config.maxHealth = char.health;
        this.config.currentHealth = char.health;
        this.config.crystals = 0;
        this.config.comboCount = 0;
        this.config.crystalMultiplier = char.crystalMultiplier || 1;
        this.config.powerups = { ...char.startingPowerups };
        this.slideProgress = {};

        if (window.EnergyBarController) {
            EnergyBarController.baseMaxHealth = this.config.maxHealth;
            EnergyBarController.refreshMetrics();
        }

        this.active = true;
        this.saveGameState();
        this.injectHUD();
        if (window.EnergyBarController) {
            EnergyBarController.updateHealth(100);
        }

        // --- HIDE LOBBY (Character Select) ---
        const lobby = document.getElementById('lobby-screen');
        document.body.classList.remove('intro-active');

        const viewport = document.getElementById('viewport-frame');
        const nav = document.querySelector('nav');

        const WIPE_DURATION_MS = 10000;
        const HEADER_DELAY_MS = 0; // Header fades in immediately after wipe completes
        const startHeroWipe = (onComplete) => {
            const runWipe = () => {
                const supportsMask = typeof CSS !== 'undefined'
                    && (CSS.supports('mask-image', 'radial-gradient(circle 10px at 50% 50%, #fff 0, transparent 100%)')
                        || CSS.supports('-webkit-mask-image', 'radial-gradient(circle 10px at 50% 50%, #fff 0, transparent 100%)'));

                if (lobby) {
                    lobby.style.pointerEvents = 'none';
                    if (supportsMask) {
                        lobby.style.opacity = '1';
                    } else {
                        lobby.style.opacity = '0';
                        setTimeout(() => { lobby.style.display = 'none'; }, 650);
                    }
                }
                document.body.classList.add('hero-wipe-active');
                document.body.classList.add('hero-header-delay');
                // ═══════════════════════════════════════════════════════════════════════
                // Clear lobby lock only when we are ready to reveal the hero slide
                // ═══════════════════════════════════════════════════════════════════════
                window.LOBBY_ACTIVE = false;
                document.body.removeAttribute('data-lobby-active');
                document.body.classList.remove('lobby-open'); // GLASS COMMAND DECK V2.0
                if (nav) {
                    nav.classList.remove('opacity-0');
                }

                if (viewport) {
                    viewport.classList.remove('opacity-0');
                    viewport.style.pointerEvents = 'auto';
                }
                // Nav visibility is controlled by CSS classes (hero-wipe-active, hero-header-delay)
                // Don't set inline styles here as they override the CSS
                console.log("🔓 LOBBY_ACTIVE = false (navigation unlocked via beginMission)");

                if (typeof SoundFX !== 'undefined') {
                    SoundFX.init();
                    SoundFX.unlock();
                }
                if (typeof initJukebox === 'function') {
                    initJukebox();
                }

                if (viewport) {
                    viewport.classList.remove('gcd-wipe-ready', 'gcd-wipe-animate', 'gcd-wipe-layer');
                    // Force a reflow to ensure the reset is applied before starting.
                    void viewport.offsetHeight;
                    viewport.classList.add('gcd-wipe-layer');

                    let wipeFinished = false;
                    const finishWipe = () => {
                        if (wipeFinished) return;
                        wipeFinished = true;
                        if (typeof onComplete === 'function') {
                            onComplete();
                        }
                    };

                    if (supportsMask) {
                        const root = document.documentElement;
                        const rect = viewport.getBoundingClientRect();
                        const radius = Math.ceil(Math.sqrt(Math.pow(rect.width / 2, 2) + Math.pow(rect.height / 2, 2)));
                        root.style.setProperty('--wipe-radius', '0px');

                        if (window.gsap) {
                            gsap.to(root, {
                                '--wipe-radius': `${radius}px`,
                                duration: WIPE_DURATION_MS / 1000,
                                ease: 'none',
                                onComplete: finishWipe,
                            });
                        } else {
                            const start = performance.now();
                            const animate = (now) => {
                                const elapsed = now - start;
                                const progress = Math.min(elapsed / WIPE_DURATION_MS, 1);
                                root.style.setProperty('--wipe-radius', `${radius * progress}px`);
                                if (progress < 1) {
                                    requestAnimationFrame(animate);
                                } else {
                                    finishWipe();
                                }
                            };
                            requestAnimationFrame(animate);
                        }
                    } else if (window.gsap) {
                        gsap.set(viewport, { clipPath: 'circle(0% at 50% 50%)' });
                        gsap.to(viewport, {
                            clipPath: 'circle(150% at 50% 50%)',
                            duration: WIPE_DURATION_MS / 1000,
                            ease: 'none',
                            onComplete: finishWipe,
                        });
                    } else {
                        viewport.classList.add('gcd-wipe-ready');
                        requestAnimationFrame(() => {
                            viewport.classList.add('gcd-wipe-animate');
                        });
                        setTimeout(finishWipe, WIPE_DURATION_MS + 50);
                    }
                } else if (typeof onComplete === 'function') {
                    onComplete();
                }
            };

            const heroReady = window.__heroAssetsReady;
            if (heroReady && typeof heroReady.then === 'function') {
                heroReady.then(runWipe);
            } else {
                runWipe();
            }
        };

        if (lobby) {
            console.log('🎬 Starting hero wipe at', new Date().toISOString());
            startHeroWipe(() => {
                console.log('✅ Wipe complete at', new Date().toISOString(), '- starting 4.5s header delay');
                lobby.style.display = 'none';
                lobby.style.opacity = '';
                lobby.style.pointerEvents = '';
                if (viewport) {
                    viewport.classList.remove('gcd-wipe-ready', 'gcd-wipe-animate', 'gcd-wipe-layer');
                    if (window.gsap) {
                        gsap.set(viewport, { clearProps: 'clipPath' });
                    }
                }
                document.body.classList.remove('hero-wipe-active');

                // Header fade-in after delay
                setTimeout(() => {
                    console.log('🎯 Header appearing at', new Date().toISOString());
                    document.body.classList.remove('hero-header-delay');
                    // CSS classes control nav visibility - no inline styles needed
                }, HEADER_DELAY_MS);
            });
        } else {
            startHeroWipe(() => {
                if (viewport) {
                    viewport.classList.remove('gcd-wipe-ready', 'gcd-wipe-animate', 'gcd-wipe-layer');
                    if (window.gsap) {
                        gsap.set(viewport, { clearProps: 'clipPath' });
                    }
                }
                document.body.classList.remove('hero-wipe-active');

                // AI: Move header delay into the onComplete callback
                setTimeout(() => {
                    document.body.classList.remove('hero-header-delay');
                }, HEADER_DELAY_MS);
            });
        }

        // --- FORCE START AT SLIDE 0 (HERO SLIDE) ---
        const slider = document.getElementById('slider');
        if (slider) {
            const slideZero = document.getElementById('slide-0');
            if (slideZero) slideZero.classList.remove('hidden');

            // Rebuild registry to ensure slide-0 is index 0
            if (window.SlideRegistry) window.SlideRegistry.rebuild();

            slider.scrollLeft = 0; // Force to start
            slider.style.overflow = ''; // Re-enable scrolling
        }

        // ═══════════════════════════════════════════════════════════════════════════════
        // CRITICAL: Clear saved slide position so new mission always starts at hero slide
        // ═══════════════════════════════════════════════════════════════════════════════
        if (typeof SafeStorage !== 'undefined') {
            SafeStorage.setItem('nameGame_slide_key', 'hero');
            SafeStorage.setItem('nameGame_slide', '0');
        }

        // --- MAP INTRO SEQUENCE DISABLED ---
        // The map should NOT auto-trigger. User must click "START JOURNEY" button.
        // MapSystem.init() is called on DOMContentLoaded in map.js
        if (typeof MapSystem !== 'undefined' && !MapSystem.initialized) {
            MapSystem.init(); // Just ensure it's ready, don't play intro
        }

        console.log(`🚀 Mission started! Player: ${playerName}, Character: ${char.name}`);

        // --- INITIALIZE FRIENDLY GUIDE SYSTEM ---
        // Initialize guide system but DO NOT auto-start the tour
        // Tour will be manually triggered when player reaches hero slide
        setTimeout(() => {
            if (window.GuideSystem && typeof window.GuideSystem.init === 'function') {
                console.log('[GameEngine] Initializing Friendly Guide System (init only, no auto-start)...');
                window.GuideSystem.init();

                // Set flag to indicate guide is ready to start when player reaches hero slide
                window.GUIDE_READY = true;

                const currentKey = window.SlideRegistry && typeof window.SlideRegistry.getCurrentKey === 'function'
                    ? window.SlideRegistry.getCurrentKey()
                    : '';
                if (currentKey === 'hero' && !window.LOBBY_ACTIVE && typeof window.GuideSystem.startHeroTour === 'function') {
                    const started = window.GuideSystem.startHeroTour();
                    console.log('[GameEngine] Hero Tour started from beginMission:', started);
                    if (started) window.GUIDE_READY = false;
                }
            }
        }, 2000);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // HUD INJECTION
    // ═══════════════════════════════════════════════════════════════════════════════
    // GLASS COMMAND DECK: Show and populate the compact HUD (already in HTML)
    injectHUD() {
        const char = this.characters[this.config.characterId];
        if (!char) return;

        const healthPercent = (this.config.currentHealth / this.config.maxHealth) * 100;
        const healthState = this.getHealthState(healthPercent);
        const avatarUrl = this.getAssetUrl(this.config.characterId, healthState);

        // Get the compact HUD elements
        const hudContainer = document.getElementById('player-hud-compact');
        const avatarImg = document.getElementById('avatar-img');
        const healthFill = document.getElementById('health-fill');
        const crystalCount = document.getElementById('crystal-count');
        const gcdCharName = document.getElementById('gcd-char-name');

        if (gcdCharName) {
            gcdCharName.textContent = (char.name || '').toUpperCase();
        }

        if (hudContainer) {
            // Show the HUD
            hudContainer.style.display = 'flex';

            // Set avatar image
            if (avatarImg) {
                avatarImg.src = avatarUrl;
                avatarImg.alt = char.name;
            }

            // Set health bar width
            if (healthFill) {
                healthFill.style.width = `${healthPercent}%`;
            }

            // Set crystal count
            if (crystalCount) {
                crystalCount.textContent = this.config.crystals;
            }

            console.log('[GameEngine] Glass Command Deck HUD initialized');
        }

        this.injectDock();
    },

    injectDock() {
        const existingDock = document.getElementById('powerup-dock');
        if (existingDock) existingDock.remove();
        const p = this.config.powerups || { clues: 0, shields: 0, freezes: 0 };
        const dockHTML = `<div id="powerup-dock" class="fixed bottom-6 right-6 z-40 flex flex-col gap-3 pointer-events-auto">
            <button id="btn-clue" onclick="GameEngine.activatePowerUp('clue')" class="glass-panel w-14 h-14 rounded-full flex items-center justify-center relative group transition-all duration-300 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-30 disabled:cursor-not-allowed" ${p.clues > 0 ? '' : 'disabled'}><div class="text-2xl">🔍</div><div class="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold text-[10px]" id="count-clue">${p.clues}</div></button>
            <button id="btn-shield" onclick="GameEngine.activatePowerUp('shield')" class="glass-panel w-14 h-14 rounded-full flex items-center justify-center relative group transition-all duration-300 border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-30 disabled:cursor-not-allowed" ${p.shields > 0 ? '' : 'disabled'}><div class="text-2xl">🛡️</div><div class="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-[10px]" id="count-shield">${p.shields}</div></button>
            <button id="btn-freeze" onclick="GameEngine.activatePowerUp('freeze')" class="glass-panel w-14 h-14 rounded-full flex items-center justify-center relative group transition-all duration-300 border border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:cursor-not-allowed" ${p.freezes > 0 ? '' : 'disabled'}><div class="text-2xl">❄️</div><div class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-black font-bold text-[10px]" id="count-freeze">${p.freezes}</div></button>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', dockHTML);
    },

    activatePowerUp(type) {
        const key = type + 's';
        if (type === 'freeze') { this.config.isFrozen = true; const container = document.getElementById('timer-container'); if (container) container.classList.add('frozen'); this.showFloatingText("TIME FROZEN!", "#22d3ee"); if (typeof SoundFX !== 'undefined' && SoundFX.playPop) SoundFX.playPop(); setTimeout(() => { this.config.isFrozen = false; document.getElementById('timer-container')?.classList.remove('frozen'); }, 10000); return; }
        if (this.config.powerups[key] > 0) { this.config.powerups[key]--; this.updateDock(); document.dispatchEvent(new CustomEvent('game:powerup', { detail: { type: type } })); if (typeof SoundFX !== 'undefined' && SoundFX.playPop) SoundFX.playPop(); if (type === 'shield') { this.stopTimer(); } }
    },

    updateDock() {
        if (!this.config.powerups) return;
        ['clue', 'shield', 'freeze'].forEach(type => { const btn = document.getElementById(`btn-${type}`); const count = document.getElementById(`count-${type}`); const val = this.config.powerups[type + 's'] || 0; if (count) count.textContent = val; if (btn) { if (val > 0) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', 'true'); } });
    },

    takeDamage(amount) { this.config.currentHealth = Math.max(0, this.config.currentHealth - amount); this.updateHUD(); if (this.config.currentHealth <= 0) this.onGameOver(); },

    updateHUD() {
        const maxHealth = this.config.maxHealth || 100;
        const healthPercentRaw = maxHealth ? (this.config.currentHealth / maxHealth) * 100 : 100;
        const healthPercent = Math.max(0, Math.min(100, healthPercentRaw));
        const healthState = this.getHealthState(healthPercent);

        // GLASS COMMAND DECK V2.0: Update energy bar controller
        if (window.EnergyBarController) {
            EnergyBarController.updateHealth(healthPercent);
        }

        // GLASS COMMAND DECK V2.0: Update crystal display
        const gcdCrystalCount = document.getElementById('gcd-gem-count');
        if (gcdCrystalCount) {
            gcdCrystalCount.textContent = this.config.crystals;
        }
        if (window.EnergyBarController && typeof EnergyBarController.refreshMetrics === 'function') {
            EnergyBarController.refreshMetrics();
        }

        const char = this.characters[this.config.characterId];
        if (!char) return;

        const gcdCharName = document.getElementById('gcd-char-name');
        if (gcdCharName) {
            gcdCharName.textContent = (char.name || '').toUpperCase();
        }

        // GLASS COMMAND DECK: Update compact HUD elements
        const hudContainer = document.getElementById('player-hud-compact');
        if (!hudContainer) return;

        // Update health fill
        const healthFill = document.getElementById('health-fill');
        if (healthFill) {
            healthFill.style.width = `${healthPercent}%`;

            // Change color based on health level
            if (healthPercent <= 25) {
                healthFill.style.background = 'repeating-linear-gradient(45deg, #ef4444, #ef4444 8px, #ffffff 8px, #ffffff 16px)';
                healthFill.classList.add('animate-pulse');
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #facc15, #fbbf24)';
                healthFill.classList.remove('animate-pulse');
            }
        }

        // Update avatar image if health state changed
        const avatarImg = document.getElementById('avatar-img');
        if (avatarImg) {
            const newAvatarUrl = this.getAssetUrl(this.config.characterId, healthState);
            if (avatarImg.src !== newAvatarUrl) {
                avatarImg.style.opacity = '0';
                setTimeout(() => {
                    avatarImg.src = newAvatarUrl;
                    avatarImg.style.opacity = '1';
                }, 150);
            }
        }

        // Update crystal count
        const crystalCount = document.getElementById('crystal-count');
        if (crystalCount) {
            crystalCount.textContent = this.config.crystals;
        }


    },

    // === TIMER SYSTEM ===
    toggleTimers(enabled) { this.config.timersEnabled = enabled; if (enabled) this.startTimer(); else this.stopTimer(); },

    startTimer() {
        this.stopTimer(); if (!this.config.timersEnabled) return;
        if (!document.getElementById('timer-container')) { document.body.insertAdjacentHTML('beforeend', `<div id="shadow-overlay"></div><div id="timer-container"><div id="timer-fill"></div></div>`); }
        const container = document.getElementById('timer-container'); const fill = document.getElementById('timer-fill'); const shadow = document.getElementById('shadow-overlay');
        if (container) container.style.opacity = '1'; if (shadow) shadow.style.opacity = '0'; this.config.timeLeft = this.config.timerDuration; this.config.isFrozen = false; if (container) container.classList.remove('frozen');
        this.config.timerInterval = setInterval(() => { if (this.config.isFrozen) return; this.config.timeLeft--; const pct = (this.config.timeLeft / this.config.timerDuration) * 100; if (fill) fill.style.width = `${pct}%`; if (shadow) shadow.style.opacity = (1 - (pct / 100)) * 0.9; if (this.config.timeLeft <= 0) { this.onTimeout(); } }, 1000);
    },

    stopTimer() { if (this.config.timerInterval) clearInterval(this.config.timerInterval); const container = document.getElementById('timer-container'); const shadow = document.getElementById('shadow-overlay'); if (container) container.style.opacity = '0'; if (shadow) shadow.style.opacity = '0'; },

    onTimeout() { this.stopTimer(); this.takeDamage(10); this.showFloatingText("THE SHADOW STRIKES!", "#ef4444"); if (typeof SoundFX !== 'undefined' && SoundFX.playIncorrect) SoundFX.playIncorrect(); },

    onGameOver() { console.log('💀 Game Over - Health depleted'); this.showFloatingText("GAME OVER", "#ef4444", 2000); },

    // === STATE PERSISTENCE ===
    saveGameState() { SafeStorage.setItem('nameGame_character', JSON.stringify({ characterId: this.config.characterId, maxHealth: this.config.maxHealth, currentHealth: this.config.currentHealth, crystals: this.config.crystals, comboCount: this.config.comboCount, crystalMultiplier: this.config.crystalMultiplier, powerups: this.config.powerups })); },

    clearGameState() { localStorage.removeItem('nameGame_character'); this.config = { characterId: null, maxHealth: 100, currentHealth: 100, crystals: 0, comboCount: 0, damagePerWrong: 8, damagePerWrongTimed: 16, crystalsPerCorrect: 10, crystalMultiplier: 1, comboThresholds: { good: 3, excellent: 5, unstoppable: 10 }, powerups: { clues: 0, shields: 0, freezes: 0 } }; this.slideProgress = {}; this.active = false; }
};

window.GameEngine = GameEngine;
document.addEventListener('DOMContentLoaded', () => { GameEngine.init(); });

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS COMMAND DECK V2.0 - ENERGY BAR CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const EnergyBarController = {
    W_MIN: null,
    W_MAX: null,
    TOTAL_NODES: 17,
    pendingGrowth: null,
    baseMaxHealth: null,
    _measured: false,
    _layout: null,

    getTotalNodes() {
        if (window.MapSystem && MapSystem.mapNodes) {
            const nodes = Object.values(MapSystem.mapNodes)
                .filter(node => Array.isArray(node.slideKeys) && node.slideKeys.length > 0);
            if (nodes.length) return nodes.length;
        }
        return this.TOTAL_NODES;
    },

    getBarWidthForNodes(completedNodes) {
        const totalNodes = this.getTotalNodes();
        const nodes = Number.isFinite(completedNodes) ? completedNodes : 0;
        const clamped = Math.max(0, Math.min(totalNodes, nodes));
        const minWidth = Number.isFinite(this.W_MIN) ? this.W_MIN : 120;
        const maxWidth = Number.isFinite(this.W_MAX) ? this.W_MAX : 360;
        if (totalNodes <= 0 || maxWidth <= minWidth) return minWidth;
        const progress = clamped / totalNodes;
        const eased = Math.pow(progress, 0.7);
        return minWidth + ((maxWidth - minWidth) * eased);
    },

    refreshMetrics() {
        if (!this._layout) {
            this._layout = {
                nav: document.querySelector('nav.glass-command-deck'),
                left: document.querySelector('.glass-command-deck .gcd-left'),
                right: document.querySelector('.glass-command-deck .gcd-right'),
                powerCore: document.querySelector('.glass-command-deck .gcd-power-core'),
                wrapper: document.querySelector('.glass-command-deck .gcd-energy-wrapper'),
                barShell: document.querySelector('.glass-command-deck .gcd-bar-shell'),
                barContainer: document.querySelector('.glass-command-deck .gcd-bar-container'),
                gem: document.querySelector('.glass-command-deck .gcd-power-core .gcd-crystals')
            };
        }

        const { nav, left, right, powerCore, wrapper, barShell, gem } = this._layout;
        if (!nav || !left || !right || !powerCore || !wrapper || !barShell) return;

        if (!this._measured) {
            const styles = getComputedStyle(barShell);
            const minWidth = parseFloat(styles.minWidth || styles.width);
            if (Number.isFinite(minWidth) && minWidth > 0) {
                this.W_MIN = minWidth;
                this._measured = true;
            }
        }

        const navStyles = getComputedStyle(nav);
        const gap = parseFloat(navStyles.columnGap || navStyles.gap || 0) || 0;
        const paddingLeft = parseFloat(navStyles.paddingLeft || 0) || 0;
        const paddingRight = parseFloat(navStyles.paddingRight || 0) || 0;

        const leftStyles = getComputedStyle(left);
        const rightStyles = getComputedStyle(right);
        const leftGap = parseFloat(leftStyles.columnGap || leftStyles.gap || 0) || 0;
        const rightGap = parseFloat(rightStyles.columnGap || rightStyles.gap || 0) || 0;

        const sumChildWidths = (container, gap) => {
            const children = Array.from(container.children || []);
            if (!children.length) return container.getBoundingClientRect().width;
            const widths = children.map(child => child.getBoundingClientRect().width);
            const sum = widths.reduce((acc, width) => acc + width, 0);
            return sum + (gap * Math.max(0, children.length - 1));
        };

        const leftWidth = sumChildWidths(left, leftGap);
        const rightWidth = sumChildWidths(right, rightGap);
        nav.style.removeProperty('--gcd-side-width');

        const reservedLeft = leftWidth;
        const reservedRight = rightWidth;
        const safeBuffer = 0;
        const availableWidth = nav.clientWidth - paddingLeft - paddingRight - reservedLeft - reservedRight - (gap * 2) - safeBuffer;
        if (!Number.isFinite(availableWidth) || availableWidth <= 0) return;

        const wrapperStyles = getComputedStyle(wrapper);
        const wrapperPadding = (parseFloat(wrapperStyles.paddingLeft || 0) || 0) + (parseFloat(wrapperStyles.paddingRight || 0) || 0);
        const gemGap = parseFloat(wrapperStyles.getPropertyValue('--gcd-gem-gap') || 0) || 0;
        const gemWidth = gem ? gem.getBoundingClientRect().width : 0;
        const gemReserve = gemWidth > 0 ? gemWidth + gemGap : 0;
        const breathing = 0;
        const maxWidth = Math.max(this.W_MIN || 0, Math.floor(availableWidth - wrapperPadding - (breathing * 2) - gemReserve));

        if (Number.isFinite(maxWidth) && maxWidth > 0) {
            this.W_MAX = maxWidth;
            powerCore.style.width = `${availableWidth}px`;
            powerCore.style.minWidth = `${availableWidth}px`;
            powerCore.style.maxWidth = `${availableWidth}px`;
        }
    },

    queueGrowth(nodeId, beforeCount, afterCount) {
        if (!Number.isFinite(beforeCount) || !Number.isFinite(afterCount) || afterCount === beforeCount) return;
        this.refreshMetrics();
        const newBarWidth = this.getBarWidthForNodes(afterCount);
        const baseMax = this.baseMaxHealth || window.GameEngine?.config?.maxHealth || newBarWidth;
        const minWidth = this.W_MIN || newBarWidth;
        const newMaxHealth = Math.round(baseMax * (newBarWidth / minWidth));
        const perf = getNodePerformance(nodeId);
        const healPercent = getHealPercentFromPerformance(perf);
        const healAmount = Math.round(newMaxHealth * healPercent);
        this.pendingGrowth = {
            from: beforeCount,
            to: afterCount,
            newMaxHealth,
            healAmount
        };
    },

    updateBarWidth(completedNodes) {
        this.refreshMetrics();
        const width = this.getBarWidthForNodes(completedNodes);
        document.documentElement.style.setProperty('--energy-bar-width', `${width}px`);
        const barShell = this._layout?.barShell || document.querySelector('.glass-command-deck .gcd-bar-shell');
        if (barShell) {
            barShell.style.width = `${width}px`;
        }
        const wrapper = this._layout?.wrapper || document.querySelector('.glass-command-deck .gcd-energy-wrapper');
        if (wrapper) {
            const styles = getComputedStyle(wrapper);
            const padLeft = parseFloat(styles.paddingLeft || 0) || 0;
            const padRight = parseFloat(styles.paddingRight || 0) || 0;
            wrapper.style.width = `${width + padLeft + padRight}px`;
        }
        return width;
    },

    updateHealth(healthPercent) {
        const pct = Number.isFinite(healthPercent) ? Math.max(0, Math.min(100, healthPercent)) : 100;
        document.documentElement.style.setProperty('--health-percent', `${pct}`);
        const barFill = document.getElementById('gcd-bar-fill');
        if (barFill) barFill.style.width = `${pct}%`;
        const avatar = document.getElementById('gcd-avatar-img');
        if (avatar && window.GameEngine) {
            const state = window.GameEngine.getHealthState(pct);
            const url = window.GameEngine.getAssetUrl(window.GameEngine.config.characterId, state);
            if (url) {
                avatar.style.backgroundImage = `url("${url}")`;
            } else {
                const fallbackUrl = window.GameEngine.getAssetUrl(window.GameEngine.config.characterId, 'select');
                if (fallbackUrl) avatar.style.backgroundImage = `url("${fallbackUrl}")`;
            }
        }

        const readout = document.getElementById('gcd-health-readout');
        if (readout && window.GameEngine) {
            const maxHealth = window.GameEngine.config.maxHealth || 0;
            const current = Math.round((maxHealth * pct) / 100);
            readout.textContent = `${current}/${Math.round(maxHealth)}`;
        }
    },

    animateGrowth(fromNodes, toNodes, options = {}) {
        this.refreshMetrics();
        const start = performance.now();
        const duration = Number.isFinite(options.duration) ? options.duration : 600;
        const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
        const from = Number.isFinite(fromNodes) ? fromNodes : 0;
        const to = Number.isFinite(toNodes) ? toNodes : from;

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            const currentNodes = from + (to - from) * eased;
            this.updateBarWidth(currentNodes);

            if (progress < 1) {
                requestAnimationFrame(animate);
                return;
            }
            if (onComplete) onComplete();
        };

        requestAnimationFrame(animate);
    },

    consumePendingGrowth(options = {}) {
        if (!this.pendingGrowth) return;
        const { from, to, newMaxHealth, healAmount } = this.pendingGrowth;
        this.pendingGrowth = null;
        if (window.GameEngine && Number.isFinite(newMaxHealth)) {
            const current = window.GameEngine.config.currentHealth ?? newMaxHealth;
            const healed = Math.max(0, Number.isFinite(healAmount) ? healAmount : 0);
            window.GameEngine.config.maxHealth = Math.round(newMaxHealth);
            window.GameEngine.config.currentHealth = Math.min(window.GameEngine.config.maxHealth, current + healed);
            window.GameEngine.updateHUD();
        }
        const duration = Number.isFinite(options.duration) ? options.duration : 600;
        const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
        const barContainer = this._layout?.barContainer || document.querySelector('.glass-command-deck .gcd-bar-container');
        if (barContainer) barContainer.classList.add('gcd-growth-active');
        this.animateGrowth(from, to, {
            duration,
            onComplete: () => {
                if (barContainer) barContainer.classList.remove('gcd-growth-active');
                if (onComplete) onComplete();
            }
        });
    }
};

window.EnergyBarController = EnergyBarController;

function getCompletedNodeCount() {
    if (!window.MapSystem || !MapSystem.state || !Array.isArray(MapSystem.state.completedNodes)) return 0;
    return MapSystem.state.completedNodes.length;
}

function getNodePerformance(nodeId) {
    if (!window.MapSystem || !MapSystem.mapNodes || !window.GameEngine || !window.SlideRegistry) {
        return { correct: 0, wrong: 0, attempts: 0 };
    }
    const node = MapSystem.mapNodes[nodeId];
    if (!node || !Array.isArray(node.slideKeys)) return { correct: 0, wrong: 0, attempts: 0 };

    let correct = 0;
    let wrong = 0;
    node.slideKeys.forEach((key) => {
        const idx = window.SlideRegistry.indexByKey?.get(key);
        if (typeof idx !== 'number') return;
        const state = window.GameEngine.slideProgress?.[idx];
        if (!state) return;
        correct += state.correct || 0;
        wrong += state.wrong || 0;
    });

    return { correct, wrong, attempts: correct + wrong };
}

function getHealPercentFromPerformance(perf) {
    if (!perf || !perf.attempts) return 0;
    const base = 0.08;
    const penaltyPerWrong = 0.03;
    const pct = base - (perf.wrong * penaltyPerWrong);
    return Math.max(0, pct);
}

function hookEnergyBarToMapSystem() {
    if (!window.MapSystem || typeof MapSystem.triggerNodeCompletion !== 'function') return false;
    if (MapSystem._gcdEnergyManaged) {
        if (window.EnergyBarController) {
            EnergyBarController.updateBarWidth(getCompletedNodeCount());
        }
        return true;
    }
    if (MapSystem._gcdEnergyHooked) return true;
    MapSystem._gcdEnergyHooked = true;

    const originalTrigger = MapSystem.triggerNodeCompletion.bind(MapSystem);
    MapSystem.triggerNodeCompletion = function (nodeId, options = {}) {
        const before = getCompletedNodeCount();
        const result = originalTrigger(nodeId, options);
        const after = getCompletedNodeCount();
        if (window.EnergyBarController && after !== before) {
            EnergyBarController.refreshMetrics();
            const newBarWidth = EnergyBarController.getBarWidthForNodes(after);
            const baseMax = EnergyBarController.baseMaxHealth || window.GameEngine?.config?.maxHealth || newBarWidth;
            const minWidth = EnergyBarController.W_MIN || newBarWidth;
            const newMaxHealth = Math.round(baseMax * (newBarWidth / minWidth));
            const perf = getNodePerformance(nodeId);
            const healPercent = getHealPercentFromPerformance(perf);
            const healAmount = Math.round(newMaxHealth * healPercent);
            EnergyBarController.pendingGrowth = {
                from: before,
                to: after,
                newMaxHealth,
                healAmount
            };
            if (MapSystem.active) {
                EnergyBarController.consumePendingGrowth();
            }
        }
        return result;
    };

    if (typeof MapSystem.show === 'function') {
        const originalShow = MapSystem.show.bind(MapSystem);
        MapSystem.show = function (...args) {
            const result = originalShow(...args);
            if (window.EnergyBarController) {
                setTimeout(() => EnergyBarController.consumePendingGrowth(), 200);
            }
            return result;
        };
    }

    if (window.EnergyBarController) {
        EnergyBarController.updateBarWidth(getCompletedNodeCount());
    }

    return true;
}

function initEnergyBarController() {
    if (!window.EnergyBarController) return;
    EnergyBarController.refreshMetrics();
    if (window.GameEngine && EnergyBarController.baseMaxHealth == null) {
        EnergyBarController.baseMaxHealth = window.GameEngine.config.maxHealth || 100;
    }
    const maxHealth = window.GameEngine?.config?.maxHealth || 100;
    const currentHealth = window.GameEngine?.config?.currentHealth ?? maxHealth;
    const healthPercent = maxHealth ? (currentHealth / maxHealth) * 100 : 100;
    EnergyBarController.updateHealth(healthPercent);
    EnergyBarController.updateBarWidth(getCompletedNodeCount());
}

function scheduleEnergyBarInit() {
    const init = () => { initEnergyBarController(); };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.EnergyBarController) {
                EnergyBarController.refreshMetrics();
                EnergyBarController.updateBarWidth(getCompletedNodeCount());
            }
        }, 150);
    });

    let attempts = 0;
    const tryHook = () => {
        if (hookEnergyBarToMapSystem()) return;
        if (attempts >= 10) return;
        attempts += 1;
        setTimeout(tryHook, 200);
    };
    tryHook();
}

scheduleEnergyBarInit();
