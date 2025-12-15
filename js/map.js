// ═══════════════════════════════════════════════════════════════════════════════
// MAP.JS - Stabilized V4.1
// Restored Original Banner Visuals + Sound Effects
// Kept logic for Gate Barriers
// ═══════════════════════════════════════════════════════════════════════════════

const MapSystem = {
    active: false,
    introPlayed: false,
    initialized: false,
    isAnimating: false,

    // Node Definitions (The Logic)
    mapNodes: {
        "N1": { id: "N1", left: 4, top: 52, label: "The Village", type: "linear", slides: [1, 2, 3, 4], exitSlide: 4, parents: [], children: ["N2"] },
        "N2": { id: "N2", left: 12, top: 52, label: "Three Noun Families", type: "linear", slides: [5, 6, 7, 8], exitSlide: 8, parents: ["N1"], children: ["HubA"] },
        "HubA": { id: "HubA", left: 21, top: 52, type: "hub", label: "Central Hub Camp", parents: ["N2"], children: ["N3A", "N3B", "N3C"], gate: "N4" },
        "N3A": { id: "N3A", left: 21, top: 22, label: "People Hunt", type: "branch", slides: [11], exitSlide: 11, parents: ["HubA"], returnTo: "HubA" },
        "N3B": { id: "N3B", left: 16, top: 82, label: "Places Hunt", type: "branch", slides: [12], exitSlide: 12, parents: ["HubA"], returnTo: "HubA" },
        "N3C": { id: "N3C", left: 26, top: 82, label: "Things & Animals Hunt", type: "branch", slides: [10], exitSlide: 10, parents: ["HubA"], returnTo: "HubA" },
        "N4": { id: "N4", left: 30, top: 52, label: "Mega-Mix Boss", type: "gate", slides: [9], exitSlide: 9, parents: ["N3A", "N3B", "N3C"], children: ["N5"] },
        "N5": { id: "N5", left: 38, top: 52, label: "Common Nouns", type: "linear", slides: [13, 14, 15, 16, 17], exitSlide: 17, parents: ["N4"], children: ["N6"] },
        "N6": { id: "N6", left: 45, top: 52, label: "Proper Nouns", type: "linear", slides: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27], exitSlide: 27, parents: ["N5"], children: ["N7"] },
        "N7": { id: "N7", left: 52, top: 52, label: "Case Briefing", type: "linear", slides: [28], exitSlide: 28, parents: ["N6"], children: ["HubB"] },
        "HubB": { id: "HubB", left: 59, top: 52, type: "hub", label: "Detective's Hub", parents: ["N7"], children: ["N9A", "N9B"], gate: "GateB" },
        "N9A": { id: "N9A", left: 59, top: 23, label: "Evidence A", type: "branch", slides: [31], exitSlide: 31, parents: ["HubB"], returnTo: "HubB" },
        "N9B": { id: "N9B", left: 59, top: 81, label: "Evidence B", type: "branch", slides: [30], exitSlide: 30, parents: ["HubB"], returnTo: "HubB" },
        "GateB": { id: "GateB", left: 66, top: 52, type: "gate", label: "Case Closed", parents: ["N9A", "N9B"], children: ["HubC"] },
        "HubC": { id: "HubC", left: 73, top: 52, type: "hub", label: "Trial Hub", parents: ["GateB"], children: ["N10A", "N10B", "N10C"], gate: "N11" },
        "N10A": { id: "N10A", left: 73, top: 22, label: "Quiz 1", type: "branch", slides: [29], exitSlide: 29, parents: ["HubC"], returnTo: "HubC" },
        "N10B": { id: "N10B", left: 68, top: 82, label: "Quiz 2", type: "branch", slides: [30], exitSlide: 30, parents: ["HubC"], returnTo: "HubC" },
        "N10C": { id: "N10C", left: 78, top: 82, label: "Quiz 3", type: "branch", slides: [31], exitSlide: 31, parents: ["HubC"], returnTo: "HubC" },
        "N11": { id: "N11", left: 86, top: 52, label: "Exit Ticket Boss", type: "gate", slides: [32], exitSlide: 32, parents: ["N10A", "N10B", "N10C"], children: ["N12"] },
        "N12": { id: "N12", left: 94, top: 45, label: "Mission Complete", type: "linear", slides: [35, 36], exitSlide: 36, parents: ["N11"], children: [] }
    },

    state: {
        completedNodes: [],
        unlockedNodes: ['N1'],
        currentNode: 'N1',
        pendingUnlock: null
    },

    init() {
        if (this.initialized) return;
        this.injectMapUI();
        this.injectMapButton();
        this.loadProgress();
        this.initialized = true;
    },

    // --- UI INJECTION (Restored Original Banner) ---
    injectMapUI() {
        if (document.getElementById('world-map-overlay')) return;

        const mapHTML = `
        <div id="world-map-overlay" class="fixed inset-0 z-[8000] bg-[#0B0C15] transition-transform duration-700 translate-y-full flex flex-col">
            <div class="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <h1 class="font-display text-4xl text-brand-400 drop-shadow-lg">🗺️ World Map</h1>
                <button onclick="MapSystem.hideMapOnly()" class="pointer-events-auto bg-white/5 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-all cursor-pointer border border-white/10 hover:border-brand-400 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>
            
            <div id="map-instruction" class="absolute top-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-8 py-3 rounded-full border border-brand-500/30 shadow-[0_0_30px_rgba(34,211,238,0.3)] z-50 pointer-events-none transition-opacity duration-500 opacity-0">
                <span id="map-instruction-text" class="font-display text-lg tracking-wider"></span>
            </div>

            <div class="flex-1 overflow-hidden relative flex items-center justify-center">
                <div id="map-nodes" class="relative w-full max-w-[177.78vh] aspect-video">
                    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://github.com/unclestevenandfriends-pixel/The-naming-game-noun-presentation-assets/blob/main/assets/characters/Final%20Map.jpg?raw=true');"></div>
                    <svg id="map-lines" class="absolute inset-0 w-full h-full pointer-events-none opacity-60"></svg>
                    <div id="player-token" class="absolute z-50 opacity-0 pointer-events-none" style="transition: left 2s ease-in-out, top 2s ease-in-out, opacity 0.5s ease;">
                        <div class="relative">
                            <div id="player-token-ring" class="w-20 h-20 rounded-full border-4 border-brand-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] overflow-hidden bg-black">
                                <img id="player-token-img" class="w-full h-full object-cover" src="" alt="Player">
                            </div>
                            <div id="token-pulse" class="absolute inset-0 rounded-full border-4 border-brand-400 animate-ping opacity-50"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', mapHTML);
    },

    injectMapButton() {
        const nav = document.querySelector('nav');
        if (nav && !document.getElementById('map-nav-btn')) {
            const counter = document.getElementById('slide-counter');
            const btnHTML = `
            <button id="map-nav-btn" onclick="MapSystem.handleMapButtonClick()" 
                class="ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50">
                <span id="map-btn-icon">🚀</span>
                <span id="map-btn-text">Start Journey</span>
            </button>`;
            if (counter) counter.insertAdjacentHTML('afterend', btnHTML);
            else nav.insertAdjacentHTML('beforeend', btnHTML);
        }
    },

    handleMapButtonClick() {
        if (this.isAnimating) return;
        const currentSlide = this.getCurrentSlideIndex();

        // Intro Check
        if (currentSlide === 0 && !this.introPlayed) {
            this.playIntro();
            return;
        }

        // Completion Check
        const currentNode = this.findNodeBySlide(currentSlide);
        if (currentNode && currentNode.exitSlide === currentSlide) {
            this.triggerNodeCompletion(currentNode.id);
            return;
        }

        this.showMapForViewing();
    },

    updateButtonState(slideIndex) {
        const btn = document.getElementById('map-nav-btn');
        const btnText = document.getElementById('map-btn-text');
        const btnIcon = document.getElementById('map-btn-icon');
        if (!btn || !btnText || !btnIcon) return;

        btn.classList.remove('map-btn-flash');

        if (slideIndex === 0 && !this.introPlayed) {
            btnIcon.innerText = '🚀';
            btnText.innerText = 'Start Journey';
            btn.className = "ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
        } else {
            const node = this.findNodeBySlide(slideIndex);
            const isExitSlide = node && node.exitSlide === slideIndex;

            if (isExitSlide && !this.state.completedNodes.includes(node.id)) {
                btnIcon.innerText = '🗺️';
                btnText.innerText = 'Continue →';
                btn.classList.add('map-btn-flash');
                btn.className = "ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50 map-btn-flash";
            } else {
                btnIcon.innerText = '🗺️';
                btnText.innerText = 'Map';
                btn.className = "ml-4 px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
            }
        }
    },

    triggerNodeCompletion(nodeId) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        const node = this.mapNodes[nodeId];
        if (!node) return;

        if (!this.state.completedNodes.includes(nodeId)) {
            this.state.completedNodes.push(nodeId);
        }

        // CRITICAL: Update NavigationGuard when completion status changes
        if (typeof NavigationGuard !== 'undefined') {
            NavigationGuard.updateCachedMaxSlide();
        }

        this.show();

        setTimeout(() => {
            this.positionTokenOnNode(nodeId, false);
            // Branch Logic
            if (node.type === 'branch' && node.returnTo) {
                this.handleBranchReturn(node);
            } else if (node.type === 'linear' || node.type === 'gate') {
                this.handleLinearCompletion(node);
            }
            this.saveProgress();
        }, 800);
    },

    handleBranchReturn(node) {
        const hubId = node.returnTo;
        const hub = this.mapNodes[hubId];
        const allBranchesComplete = hub.children.every(childId => this.state.completedNodes.includes(childId));

        setTimeout(() => {
            this.animateTokenToNode(hubId);
            this.state.currentNode = hubId;
            setTimeout(() => {
                if (allBranchesComplete) {
                    const gateId = hub.gate;
                    this.showInstruction(`All challenges complete! ${this.mapNodes[gateId].label} unlocked!`);
                    this.unlockNodeWithAnimation(gateId);
                    this.renderMap();
                    this.isAnimating = false;
                } else {
                    const remaining = hub.children.filter(id => !this.state.completedNodes.includes(id));
                    this.showInstruction(`${remaining.length} challenge${remaining.length > 1 ? 's' : ''} remaining. Pick your next path!`);
                    this.renderMap();
                    this.isAnimating = false;
                }
            }, 2200);
        }, 500);
    },

    handleLinearCompletion(node) {
        if (node.children && node.children.length > 0) {
            const nextNodeId = node.children[0];
            const nextNode = this.mapNodes[nextNodeId];

            if (nextNode.type === 'hub') {
                setTimeout(() => {
                    this.showInstruction(`Entering ${nextNode.label}...`);
                    this.unlockNodeWithAnimation(nextNodeId);
                    setTimeout(() => {
                        this.animateTokenToNode(nextNodeId);
                        this.state.currentNode = nextNodeId;
                        setTimeout(() => {
                            nextNode.children.forEach((childId, index) => {
                                setTimeout(() => this.unlockNodeWithAnimation(childId), index * 400);
                            });
                            setTimeout(() => {
                                this.showInstruction('Choose your path!');
                                this.isAnimating = false;
                            }, nextNode.children.length * 400 + 500);
                        }, 2200);
                    }, 1000);
                }, 500);
            } else {
                setTimeout(() => {
                    this.showInstruction(`${nextNode.label} unlocked!`);
                    this.unlockNodeWithAnimation(nextNodeId);
                    this.isAnimating = false;
                }, 500);
            }
        } else {
            this.showInstruction('🎉 Mission Complete! 🎉');
            this.isAnimating = false;
        }
    },

    unlockNodeWithAnimation(nodeId) {
        if (!this.state.unlockedNodes.includes(nodeId)) {
            this.state.unlockedNodes.push(nodeId);
        }
        document.dispatchEvent(new CustomEvent('nodeUnlocked', { detail: { nodeId } }));

        const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('node-unlocking');
            const lockIcon = nodeEl.querySelector('.node-icon');
            if (lockIcon) {
                lockIcon.classList.add('lock-opening');
                setTimeout(() => {
                    lockIcon.innerHTML = '⚔️';
                    lockIcon.classList.remove('lock-opening');
                    lockIcon.classList.add('lock-opened');
                }, 500);
            }
            // SOUND RESTORED
            if (typeof SoundFX !== 'undefined') SoundFX.playUnlock();

            setTimeout(() => {
                nodeEl.classList.remove('node-unlocking', 'node-locked');
                nodeEl.classList.add('node-active');
                this.renderMap();
            }, 1000);
        } else {
            this.renderMap();
        }
        this.saveProgress();
    },

    positionTokenOnNode(nodeId, animate = false) {
        const token = document.getElementById('player-token');
        const node = this.mapNodes[nodeId];
        if (!token || !node) return;
        if (!animate) token.style.transition = 'opacity 0.5s ease';
        token.style.left = `${node.left}%`;
        token.style.top = `${node.top}%`;
        token.style.transform = 'translate(-50%, -50%)';
        token.style.opacity = '1';
        this.updateTokenAvatar();
    },

    animateTokenToNode(nodeId) {
        const token = document.getElementById('player-token');
        const node = this.mapNodes[nodeId];
        if (!token || !node) return;
        token.style.transition = 'left 2s ease-in-out, top 2s ease-in-out';
        token.style.left = `${node.left}%`;
        token.style.top = `${node.top}%`;
        // SOUND RESTORED
        if (typeof SoundFX !== 'undefined') SoundFX.playSlide();
    },

    updateTokenAvatar() {
        const img = document.getElementById('player-token-img');
        if (!img) return;
        if (typeof GameEngine !== 'undefined' && GameEngine.config.characterId) {
            const char = GameEngine.characters[GameEngine.config.characterId];
            if (char && GameEngine.getAssetUrl) {
                const healthPercent = (GameEngine.config.currentHealth / GameEngine.config.maxHealth) * 100;
                const healthState = GameEngine.getHealthState(healthPercent);
                img.src = GameEngine.getAssetUrl(GameEngine.config.characterId, healthState);
            }
        }
    },

    renderMap() {
        const container = document.getElementById('map-nodes');
        if (!container) return;
        container.querySelectorAll('.map-node').forEach(n => n.remove());

        Object.values(this.mapNodes).forEach(node => {
            const isUnlocked = this.isNodeUnlocked(node.id);
            const isCompleted = this.state.completedNodes.includes(node.id);
            const isCurrent = this.state.currentNode === node.id;
            const isHub = node.type === 'hub';
            const isGate = node.type === 'gate';

            let icon = '🔒';
            if (isHub) icon = '◆';
            else if (isGate && !isUnlocked) icon = '🔒';
            else if (isCompleted) icon = '✅';
            else if (isUnlocked) icon = '⚔️';

            let stateClass = 'node-locked';
            if (isCompleted) stateClass = 'node-completed';
            else if (isUnlocked) stateClass = 'node-active';

            const el = document.createElement('div');
            el.className = `map-node absolute flex flex-col items-center gap-2 transition-all duration-300 pointer-events-auto ${stateClass}`;
            el.style.left = `${node.left}%`;
            el.style.top = `${node.top}%`;
            el.style.transform = 'translate(-50%, -50%)';
            el.style.zIndex = isCurrent ? '20' : '10';
            el.dataset.nodeId = node.id;

            el.innerHTML = `
                <div class="node-icon w-14 h-14 rounded-full bg-gray-800/90 border-2 ${isCurrent ? 'border-brand-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'border-white/20'} flex items-center justify-center text-xl shadow-xl cursor-pointer hover:scale-110 transition-all duration-300">
                    ${icon}
                </div>
                ${!isHub ? `<div class="node-label bg-black/80 px-2 py-1 rounded text-xs text-white border border-white/10 shadow-lg whitespace-nowrap">${node.label}</div>` : ''}
            `;

            if (isUnlocked && !isHub && (!isCompleted || node.type === 'branch')) {
                el.onclick = (e) => { e.stopPropagation(); this.onNodeClick(node.id); };
                el.style.cursor = 'pointer';
            } else if (!isUnlocked) {
                el.onclick = (e) => { e.stopPropagation(); this.showLockedMessage(); };
            }
            container.appendChild(el);
        });
        this.positionTokenOnNode(this.state.currentNode, false);
    },

    onNodeClick(nodeId) {
        if (this.isAnimating) return;
        const node = this.mapNodes[nodeId];
        if (!node || !node.slides || node.slides.length === 0) return;
        if (this.state.completedNodes.includes(nodeId) && node.type !== 'branch') return;

        this.isAnimating = true;
        if (this.state.currentNode !== nodeId) {
            this.animateTokenToNode(nodeId);
            this.state.currentNode = nodeId;
            this.saveProgress();

            // CRITICAL: Update NavigationGuard to allow access to new node range
            if (typeof NavigationGuard !== 'undefined') {
                NavigationGuard.updateCachedMaxSlide();
            }

            setTimeout(() => this.enterNodeSlides(nodeId), 2200);
        } else {
            this.enterNodeSlides(nodeId);
        }
    },

    enterNodeSlides(nodeId) {
        const node = this.mapNodes[nodeId];
        if (!node || !node.slides) return;
        this.hide();
        const slider = document.getElementById('slider');
        if (slider) {
            const firstSlide = node.slides[0];
            slider.scrollTo({ left: firstSlide * slider.clientWidth, behavior: 'smooth' });
        }
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') gsap.to(viewport, { opacity: 1, duration: 0.3 });
        setTimeout(() => {
            this.isAnimating = false;
            this.updateButtonState(node.slides[0]);
        }, 500);
    },

    show() {
        if (!document.getElementById('world-map-overlay')) this.init();
        this.renderMap();
        const map = document.getElementById('world-map-overlay');
        if (map) {
            map.classList.remove('translate-y-full');
            this.active = true;
        }
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') gsap.to(viewport, { opacity: 0.3, duration: 0.5 });
        // SOUND RESTORED
        if (typeof SoundFX !== 'undefined') SoundFX.playPop();
    },

    hide() {
        const map = document.getElementById('world-map-overlay');
        if (map) {
            map.classList.add('translate-y-full');
            this.active = false;
        }
        this.hideInstruction();
    },

    showMapForViewing() {
        this.show();
        this.showInstruction('Viewing map. Click the ▲ to return to your lesson.');
    },

    hideMapOnly() {
        this.hide();
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') gsap.to(viewport, { opacity: 1, duration: 0.3 });
    },

    playIntro() {
        if (this.introPlayed) return;
        this.introPlayed = true;
        this.isAnimating = true;
        this.show();
        const token = document.getElementById('player-token');
        if (token) {
            token.style.transition = 'none';
            token.style.opacity = '0';
            token.style.left = '4%';
            token.style.top = '30%';
            setTimeout(() => {
                token.style.transition = 'opacity 1s ease-out, top 2s ease-in-out';
                token.style.opacity = '1';
                token.style.top = '52%';
                // SOUND RESTORED
                if (typeof SoundFX !== 'undefined') SoundFX.playSuccess();
            }, 500);
        }
        setTimeout(() => this.showInstruction('Your adventure begins! Click "The Village" to start.'), 2000);
        setTimeout(() => { this.isAnimating = false; }, 3000);
    },

    // --- RESTORED INSTRUCTION LOGIC (No Toasts) ---
    // Updated instruction display logic
    showInstruction(text) {
        const banner = document.getElementById('map-instruction');
        const textEl = document.getElementById('map-instruction-text');

        console.log('🗺️ showInstruction called with text:', text);
        console.log('🗺️ banner element:', banner);
        console.log('🗺️ textEl element:', textEl);

        if (banner && textEl) {
            // Set the text content with fallback
            textEl.innerText = text || '';
            textEl.textContent = text || '';

            // Ensure text is visible with explicit inline styles
            textEl.style.color = '#ffffff';
            textEl.style.display = 'inline-block';
            textEl.style.visibility = 'visible';
            textEl.style.opacity = '1';

            console.log('🗺️ Text set to:', textEl.innerText);
            console.log('🗺️ Computed styles:', window.getComputedStyle(textEl).color);

            // Ensure map overlay is visible
            const map = document.getElementById('world-map-overlay');
            if (map && map.classList.contains('translate-y-full')) {
                map.classList.remove('translate-y-full');
                this.active = true;
            }
            banner.style.opacity = '1';

            // Auto-hide after 3 seconds
            if (this._instructionTimeout) clearTimeout(this._instructionTimeout);
            this._instructionTimeout = setTimeout(() => {
                banner.style.opacity = '0';
            }, 3000);
        } else {
            console.error('🗺️ showInstruction failed - missing elements:', {
                banner: !!banner,
                textEl: !!textEl
            });
        }
    },

    hideInstruction() {
        const banner = document.getElementById('map-instruction');
        if (banner) {
            banner.style.opacity = '0';
            if (this._instructionTimeout) clearTimeout(this._instructionTimeout);
        }
    },

    showLockedMessage() {
        // ... (Keep existing pop-up for now, could restore sound)
        if (typeof SoundFX !== 'undefined') SoundFX.playPop();
        // ... (rest of visual logic unchanged)
    },

    // Navigation Helpers
    getCurrentSlideIndex() {
        const slider = document.getElementById('slider');
        if (!slider) return 0;
        return Math.round(slider.scrollLeft / slider.clientWidth);
    },

    findNodeBySlide(slideIndex) {
        return Object.values(this.mapNodes).find(n => n.slides && n.slides.includes(slideIndex));
    },

    isNodeUnlocked(nodeId) {
        if (nodeId === 'N1') return true;
        if (this.state.unlockedNodes.includes(nodeId)) return true;
        const node = this.mapNodes[nodeId];
        if (!node || !node.parents || node.parents.length === 0) return false;
        if (node.type === 'gate') return node.parents.every(p => this.state.completedNodes.includes(p));
        return node.parents.some(p => this.state.completedNodes.includes(p));
    },

    canSwipeForward(currentSlide) {
        const node = this.findNodeBySlide(currentSlide);
        if (node && node.exitSlide === currentSlide) return false;
        if (!node || !this.isNodeUnlocked(node.id)) return false;
        const nextSlide = currentSlide + 1;
        if (!node.slides.includes(nextSlide)) {
            const nextNode = this.findNodeBySlide(nextSlide);
            if (!nextNode || !this.isNodeUnlocked(nextNode.id)) return false;
        }
        return true;
    },

    getMaxAccessibleSlide() {
        let maxSlide = 0;
        Object.values(this.mapNodes).forEach(node => {
            if (this.isNodeUnlocked(node.id) && node.slides) {
                const nodeMax = Math.max(...node.slides);
                if (nodeMax > maxSlide) maxSlide = nodeMax;
            }
        });
        return maxSlide;
    },

    // Persistence
    saveProgress() {
        const data = {
            completedNodes: this.state.completedNodes,
            unlockedNodes: this.state.unlockedNodes,
            currentNode: this.state.currentNode,
            introPlayed: this.introPlayed
        };
        localStorage.setItem('naming_game_map_v4', JSON.stringify(data));
    },

    loadProgress() {
        const saved = localStorage.getItem('naming_game_map_v4');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state.completedNodes = (data.completedNodes || []).map(id => id.toUpperCase());
                this.state.unlockedNodes = (data.unlockedNodes || ['N1']).map(id => id.toUpperCase());
                this.state.currentNode = (data.currentNode || 'N1').toUpperCase();
                this.introPlayed = data.introPlayed || false;
            } catch (e) { console.warn(e); }
        }

        // Ensure NavigationGuard is updated with loaded progress
        if (typeof NavigationGuard !== 'undefined') {
            setTimeout(() => NavigationGuard.updateCachedMaxSlide(), 500);
        }
    },

    resetProgress() {
        this.state = { completedNodes: [], unlockedNodes: ['N1'], currentNode: 'N1', pendingUnlock: null };
        this.introPlayed = false;
        localStorage.removeItem('naming_game_map_v4');
    },

    isGatedSlide(slideIndex) {
        return Object.values(this.mapNodes).some(node => node.exitSlide === slideIndex);
    },

    flashMapButton() {
        const btn = document.getElementById('map-nav-btn');
        if (btn) {
            btn.classList.add('map-btn-flash');
            const btnText = document.getElementById('map-btn-text');
            const btnIcon = document.getElementById('map-btn-icon');
            if (btnText) btnText.innerText = 'Continue →';
            if (btnIcon) btnIcon.innerText = '🗺️';
        }
    },

    stopFlashMapButton() {
        const btn = document.getElementById('map-nav-btn');
        if (btn) btn.classList.remove('map-btn-flash');
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // LEGACY API BRIDGE (Fixes compatibility with main.js)
    // ═══════════════════════════════════════════════════════════════════════════════

    // Alias for triggerNodeCompletion
    completeNode(nodeId) {
        console.log("🗺️ Legacy API call: completeNode -> triggerNodeCompletion");
        this.triggerNodeCompletion(nodeId);
    },

    // Alias for positionTokenOnNode/animateTokenToNode
    movePlayerToNode(nodeId, animate = true) {
        if (animate) this.animateTokenToNode(nodeId);
        else this.positionTokenOnNode(nodeId, false);
    },

    // Alias for enterNodeSlides
    enterNode(nodeId) {
        this.enterNodeSlides(nodeId);
    }
};

window.MapSystem = MapSystem;
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => MapSystem.init(), 100); });
