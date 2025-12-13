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
        22: 4,  // Quick Check (4 correct pairs)
        24: 10, // Detective (10 nouns across 5 sentences)
        25: 9,  // Muddle A (9 Locations)
        26: 6,  // Muddle B (6 People/Dates)
        27: 4,  // Quiz 1 (4 answers)
        28: 4,  // Quiz 2 (4 answers)
        29: 3,  // Quiz 3 (3 answers)
        30: 3   // Riddles (3 matches)
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

    // === INITIALIZATION ===
    init() {
        if (this.initialized) return;
        this.setupEventListeners();
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // PERFORMANCE TRACKING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════════

    handleCorrect(detail) {
        if (!this.active) return;

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
    showCharacterSelect() {
        const lobby = document.getElementById('lobby-screen');
        if (!lobby) { console.error("❌ Could not find lobby-screen"); return; }

        lobby.style.background = 'transparent';
        lobby.style.backdropFilter = 'none';

        const characterSelectHTML = `
        <div id="character-select-container" class="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
            <div class="absolute inset-0 bg-[#0B0C15]">
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
        if (container) { container.style.opacity = '0'; container.style.transform = 'translateY(20px)'; setTimeout(() => { container.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'; container.style.opacity = '1'; container.style.transform = 'translateY(0)'; }, 50); }
    },

    _buildCharacterStrips() {
        let html = '';
        ['rusty', 'luna', 'dash', 'ace'].forEach((id) => {
            const char = this.characters[id];
            const isSelected = this.config.characterId === id;
            const selectUrl = this.getAssetUrl(id, 'select');
            html += `<div class="character-strip flex-1 relative cursor-pointer group transition-all duration-300 rounded-xl overflow-hidden ${isSelected ? 'ring-2 ring-offset-2 ring-offset-black scale-[1.02] z-10' : 'hover:scale-[1.01] opacity-80 hover:opacity-100'}" style="${isSelected ? 'ring-color: ' + char.color + ';' : ''}" onclick="GameEngine.selectCharacter('${id}')" data-character="${id}">
                <div class="absolute inset-0 overflow-hidden"><img src="${selectUrl}" alt="${char.name}" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-6xl\\'>${char.icon}</div>';"></div>
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
        if (typeof SoundFX !== 'undefined') { SoundFX.init(); if (SoundFX.ctx && SoundFX.ctx.state === 'suspended') SoundFX.unlock(); if (SoundFX.playPop) SoundFX.playPop(); }
        const nameInput = document.getElementById('student-name');
        const dateInput = document.getElementById('class-date');
        const savedName = nameInput?.value || '';
        const savedDate = dateInput?.value || new Date().toISOString().split('T')[0];
        if (typeof classData !== 'undefined') { classData.studentName = savedName; classData.classDate = savedDate; }
        this.config.characterId = id;
        this.saveGameState();
        this.showCharacterSelect();
        setTimeout(() => { const newNameInput = document.getElementById('student-name'); const newDateInput = document.getElementById('class-date'); if (newNameInput) newNameInput.value = savedName; if (newDateInput) newDateInput.value = savedDate; }, 50);
        console.log(`🎮 Selected: ${this.characters[id].name}`);
    },

    beginMission() {
        if (!this.config.characterId) return;
        const nameInput = document.getElementById('student-name');
        const dateInput = document.getElementById('class-date');
        const playerName = nameInput?.value?.trim();
        if (!playerName) { nameInput?.focus(); nameInput?.classList.add('border-red-500/50', 'shake-screen'); setTimeout(() => nameInput?.classList.remove('border-red-500/50', 'shake-screen'), 1000); return; }
        if (typeof classData !== 'undefined') { classData.studentName = playerName; classData.classDate = dateInput?.value || new Date().toISOString().split('T')[0]; }
        const char = this.characters[this.config.characterId];
        this.config.maxHealth = char.health;
        this.config.currentHealth = char.health;
        this.config.crystals = 0;
        this.config.comboCount = 0;
        this.config.crystalMultiplier = char.crystalMultiplier || 1;
        this.config.powerups = { ...char.startingPowerups };
        this.slideProgress = {};
        this.active = true;
        this.saveGameState();
        this.injectHUD();
        if (typeof startClass === 'function') { startClass(); }
        console.log(`🚀 Mission started! Player: ${playerName}, Character: ${char.name}`);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // HUD INJECTION
    // ═══════════════════════════════════════════════════════════════════════════════
    injectHUD() {
        const existingHUD = document.getElementById('game-hud');
        if (existingHUD) existingHUD.remove();
        const char = this.characters[this.config.characterId];
        if (!char) return;
        const healthPercent = (this.config.currentHealth / this.config.maxHealth) * 100;
        const healthState = this.getHealthState(healthPercent);
        const avatarUrl = this.getAssetUrl(this.config.characterId, healthState);
        const nav = document.querySelector('nav');
        if (!nav) return;
        const barWidth = 200, avatarSize = 44;
        const avatarPosition = Math.max(0, (healthPercent / 100) * (barWidth - avatarSize));

        const hudHTML = `<div id="game-hud" class="absolute top-1/2 left-[260px] -translate-y-1/2 z-40 transition-all duration-300 opacity-0 pointer-events-auto flex items-center gap-4">
            <div class="relative">
                <div class="relative w-[200px] h-8 bg-black/80 rounded-lg border-2 border-[#fbbf24] overflow-visible" style="box-shadow: 0 0 15px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(0,0,0,0.8);">
                    <div id="hud-health-damage" class="absolute top-1 left-1 bottom-1 bg-red-600/80 rounded transition-all duration-500 ease-linear" style="width: calc(${healthPercent}% - 8px);"></div>
                    <div id="hud-health-fill" class="absolute top-1 left-1 bottom-1 rounded transition-all duration-300 ease-out" style="width: calc(${healthPercent}% - 8px); background: linear-gradient(180deg, #facc15 0%, #eab308 50%, #ca8a04 51%, #a16207 100%); box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);"></div>
                    <div id="hud-avatar-container" class="absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-3 bg-black overflow-hidden z-20 transition-all duration-300 ease-out" style="left: ${avatarPosition}px; border-color: ${char.color}; box-shadow: 0 0 12px ${char.color}60;">
                        <img id="hud-avatar-img" src="${avatarUrl}" alt="${char.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-xl bg-black/80\\'>${char.icon}</div>';">
                    </div>
                    <div class="absolute -bottom-5 left-1 text-[9px] font-bold text-white/70"><span id="hud-health-current">${this.config.currentHealth}</span>/<span id="hud-health-max">${this.config.maxHealth}</span></div>
                </div>
                <div class="absolute -top-5 left-0"><span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style="background: ${char.color}30; color: ${char.color}; border: 1px solid ${char.color}40;">${char.name}</span></div>
            </div>
            <div class="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                <span class="text-lg" id="hud-crystal-icon">💎</span>
                <span id="hud-crystal-count" class="text-lg font-display font-bold text-white">${this.config.crystals}</span>
                <div id="hud-combo" class="hidden ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"><span class="text-xs font-bold text-yellow-400">🔥 x<span id="hud-combo-count">0</span></span></div>
            </div>
        </div>`;
        nav.insertAdjacentHTML('beforeend', hudHTML);
        setTimeout(() => { const hud = document.getElementById('game-hud'); if (hud) hud.style.opacity = '1'; }, 100);
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
        if (!document.getElementById('game-hud')) return;
        const char = this.characters[this.config.characterId];
        if (!char) return;
        const healthPercent = (this.config.currentHealth / this.config.maxHealth) * 100;
        const healthState = this.getHealthState(healthPercent);
        const damageLayer = document.getElementById('hud-health-damage');
        const fill = document.getElementById('hud-health-fill');
        if (damageLayer) { setTimeout(() => { damageLayer.style.width = `calc(${healthPercent}% - 8px)`; }, 200); }
        if (fill) { fill.style.width = `calc(${healthPercent}% - 8px)`; if (healthPercent <= 25) { fill.style.background = 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #ffffff 10px, #ffffff 20px)'; fill.classList.add('animate-pulse'); } else { fill.style.background = 'linear-gradient(180deg, #facc15 0%, #eab308 50%, #ca8a04 51%, #a16207 100%)'; fill.classList.remove('animate-pulse'); } }
        const avatarContainer = document.getElementById('hud-avatar-container');
        const avatarImg = document.getElementById('hud-avatar-img');
        if (avatarContainer) { const barWidth = 200, avatarSize = 44; const avatarPosition = Math.max(0, (healthPercent / 100) * (barWidth - avatarSize)); avatarContainer.style.left = `${avatarPosition}px`; if (healthPercent <= 25) { avatarContainer.style.borderColor = '#ef4444'; avatarContainer.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)'; avatarContainer.classList.add('animate-pulse'); } else if (healthPercent <= 50) { avatarContainer.style.borderColor = '#facc15'; avatarContainer.style.boxShadow = '0 0 12px rgba(250, 204, 21, 0.6)'; avatarContainer.classList.remove('animate-pulse'); } else { avatarContainer.style.borderColor = char.color; avatarContainer.style.boxShadow = `0 0 12px ${char.color}60`; avatarContainer.classList.remove('animate-pulse'); } }
        if (avatarImg) { const newAvatarUrl = this.getAssetUrl(this.config.characterId, healthState); if (avatarImg.src !== newAvatarUrl) { avatarImg.style.opacity = '0'; setTimeout(() => { avatarImg.src = newAvatarUrl; avatarImg.style.opacity = '1'; }, 150); } }
        const healthText = document.getElementById('hud-health-current'); if (healthText) healthText.textContent = this.config.currentHealth;
        const crystalCount = document.getElementById('hud-crystal-count'); if (crystalCount) crystalCount.textContent = this.config.crystals;
        const comboEl = document.getElementById('hud-combo'); const comboCount = document.getElementById('hud-combo-count');
        if (comboEl && comboCount) { if (this.config.comboCount >= 3) { comboEl.classList.remove('hidden'); comboCount.textContent = this.config.comboCount; } else { comboEl.classList.add('hidden'); } }
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
    saveGameState() { localStorage.setItem('nameGame_character', JSON.stringify({ characterId: this.config.characterId, maxHealth: this.config.maxHealth, currentHealth: this.config.currentHealth, crystals: this.config.crystals, comboCount: this.config.comboCount, crystalMultiplier: this.config.crystalMultiplier, powerups: this.config.powerups })); },

    clearGameState() { localStorage.removeItem('nameGame_character'); this.config = { characterId: null, maxHealth: 100, currentHealth: 100, crystals: 0, comboCount: 0, damagePerWrong: 8, damagePerWrongTimed: 16, crystalsPerCorrect: 10, crystalMultiplier: 1, comboThresholds: { good: 3, excellent: 5, unstoppable: 10 }, powerups: { clues: 0, shields: 0, freezes: 0 } }; this.slideProgress = {}; this.active = false; }
};

window.GameEngine = GameEngine;
document.addEventListener('DOMContentLoaded', () => { GameEngine.init(); });
console.log("✅ gamification.js v2.1.1 loaded - RESTORED with Full Features");
