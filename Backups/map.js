// ═══════════════════════════════════════════════════════════════════════════════
// MAP.JS - World Map System (v3.0 - No Auto-Nav)
// ═══════════════════════════════════════════════════════════════════════════════

const MapSystem = {
    active: false,
    introPlayed: false,
    initialized: false,

    // Standard Topology
    mapNodes: {
        // N1 MUST include Slide 5 (The Exit Ticket) to lock navigation AFTER it.
        "N1": { id: "N1", left: 4, top: 52, label: "The Awakening", slides: [1, 2, 3, 4, 5], parents: [] },
        // N2 starts at Slide 6
        "N2": { id: "N2", left: 12, top: 52, label: "The Families", slides: [6, 7, 8], parents: ["N1"] },
        "HubA": { id: "HubA", left: 21, top: 52, type: "hub", label: "Branch Point", parents: ["N2"] },
        "N3A": { id: "N3A", left: 21, top: 22, label: "People", slides: [9], parents: ["HubA"], branch: "A" },
        "N3B": { id: "N3B", left: 16, top: 82, label: "Places", slides: [10], parents: ["HubA"], branch: "A" },
        "N3C": { id: "N3C", left: 26, top: 82, label: "Things", slides: [11], parents: ["HubA"], branch: "A" },
        "N4": { id: "N4", left: 30, top: 52, label: "Mega-Mix", slides: [12], parents: ["N3A", "N3B", "N3C"] },
        "N5": { id: "N5", left: 38, top: 52, label: "Common", slides: [13, 14, 15, 16, 17], parents: ["N4"] },
        "N6": { id: "N6", left: 45, top: 52, label: "Crown Rule", slides: [18, 19, 20, 21], parents: ["N5"] },
        "N7": { id: "N7", left: 52, top: 52, label: "Proper Cats", slides: [22, 23, 24, 25, 26, 27], parents: ["N6"] },
        "N8": { id: "N8", left: 59, top: 52, label: "Briefing", slides: [28], parents: ["N7"] },
        "HubB": { id: "HubB", left: 66, top: 52, type: "hub", label: "Evidence Hub", parents: ["N8"] },
        "N9A": { id: "N9A", left: 66, top: 23, label: "Evidence A", slides: [29], parents: ["HubB"], branch: "B" },
        "N9B": { id: "N9B", left: 66, top: 81, label: "Evidence B", slides: [30], parents: ["HubB"], branch: "B" },
        "GateB": { id: "GateB", left: 72, top: 52, type: "gate", label: "Case Closed", parents: ["N9A", "N9B"] },
        "HubC": { id: "HubC", left: 79, top: 52, type: "hub", label: "Quiz Hub", parents: ["GateB"] },
        "N10A": { id: "N10A", left: 79, top: 22, label: "Quiz 1", slides: [31], parents: ["HubC"], branch: "C" },
        "N10B": { id: "N10B", left: 74, top: 82, label: "Quiz 2", slides: [32], parents: ["HubC"], branch: "C" },
        "N10C": { id: "N10C", left: 84, top: 82, label: "Things", slides: [33], parents: ["HubC"], branch: "C" },
        "N11": { id: "N11", left: 93, top: 52, label: "Exit Boss", slides: [34], parents: ["N10A", "N10B", "N10C"] },
        "N12": { id: "N12", left: 98, top: 45, label: "Complete", slides: [35, 36], parents: ["N11"] }
    },

    state: {
        completedNodes: [],
        unlockedNodes: ['N1'],
        currentNode: 'N1'
    },

    // Slides where swiping right is BLOCKED - user must click Map button
    // 0 = Hero (must use Start Journey)
    // Exit Ticket slides, Hunt slides, Boss slides
    gatedSlides: [0, 5, 9, 11, 12, 17],

    init() {
        if (this.initialized && document.getElementById('world-map-overlay')) return;
        console.log("🗺️ Map System Initializing...");
        this.injectMapUI();
        this.injectMapButton();
        this.loadProgress();
        this.initialized = true;
    },

    injectMapUI() {
        if (document.getElementById('world-map-overlay')) return;
        const mapHTML = `
        <div id="world-map-overlay" class="fixed inset-0 z-[8000] bg-[#0B0C15] transition-transform duration-700 translate-y-full flex flex-col">
            <div class="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <h1 class="font-display text-4xl text-brand-400 drop-shadow-lg">🗺️ World Map</h1>
                <button onclick="MapSystem.hide()" class="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-all cursor-pointer pointer-events-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>
            <div class="flex-1 overflow-hidden relative flex items-center justify-center">
                <div id="map-nodes" class="relative w-full max-w-[177.78vh] aspect-video">
                    <div class="absolute inset-0 bg-cover bg-center opacity-50" style="background-image: url('https://github.com/unclestevenandfriends-pixel/The-naming-game-noun-presentation-assets/blob/main/assets/characters/Final%20Map.jpg?raw=true');"></div>
                    <svg id="map-lines" class="absolute inset-0 w-full h-full pointer-events-none opacity-50"></svg>
                    <div id="player-token" class="absolute z-50 opacity-0 transition-all duration-1000 ease-out pointer-events-none">
                        <div class="relative">
                            <div id="player-token-ring" class="w-20 h-20 rounded-full border-4 border-brand-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] overflow-hidden bg-black animate-pulse">
                                <img id="player-token-img" class="w-full h-full object-cover" src="" alt="Player">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', mapHTML);
    },

    injectMapButton() {
        const nav = document.querySelector('nav');
        // Ensure we don't duplicate
        if (nav && !document.getElementById('map-nav-btn')) {
            const counter = document.getElementById('slide-counter');

            // DEFAULT STATE: "START JOURNEY" (Because we start on Slide 0)
            const btnHTML = `
            <button id="map-nav-btn" onclick="MapSystem.handleMapButtonClick()" 
                class="ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50">
                <span>🚀</span>
                <span id="map-btn-text">Start Journey</span>
            </button>`;

            if (counter) counter.insertAdjacentHTML('afterend', btnHTML);
            else nav.insertAdjacentHTML('beforeend', btnHTML);
        }
    },

    // Handle the Start Journey / Map button click
    handleMapButtonClick() {
        // If we haven't started the journey yet (Intro not played), this is the START button
        if (!this.introPlayed) {
            this.playIntro(); // This triggers the map, token animation, and unlocks N1
        } else {
            this.show(); // Otherwise, just show the map normally
        }
    },

    // Update button text based on slide position
    updateButtonState(slideIndex) {
        const btnText = document.getElementById('map-btn-text');
        const btn = document.getElementById('map-nav-btn');
        if (!btnText || !btn) return;

        if (slideIndex === 0 && !this.introPlayed) {
            btnText.innerText = "Start Journey";
            // Make it look important (Gradient)
            btn.className = "ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
        } else {
            btnText.innerText = "Map";
            // Revert to standard ghost style
            btn.className = "ml-4 px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
        }
    },

    // Make the Map button flash to indicate it's the only way forward
    flashMapButton() {
        const btn = document.getElementById('map-nav-btn');
        if (btn && !btn.classList.contains('map-btn-flash')) {
            btn.classList.add('map-btn-flash');
            // Also update text to indicate action needed
            const btnText = document.getElementById('map-btn-text');
            if (btnText && btnText.innerText === 'Map') {
                btnText.innerText = '🗺️ Continue';
            }
        }
    },

    // Stop the flash animation
    stopFlashMapButton() {
        const btn = document.getElementById('map-nav-btn');
        if (btn) btn.classList.remove('map-btn-flash');
        const btnText = document.getElementById('map-btn-text');
        if (btnText && btnText.innerText === '🗺️ Continue') {
            btnText.innerText = 'Map';
        }
    },

    // Check if current slide is a gate point
    isGatedSlide(slideIndex) {
        return this.gatedSlides.includes(slideIndex);
    },

    show() {
        if (!document.getElementById('world-map-overlay')) this.init();
        this.renderMap();
        const map = document.getElementById('world-map-overlay');
        if (map) map.classList.remove('translate-y-full');
        if (typeof SoundFX !== 'undefined') SoundFX.playPop();
    },

    hide() {
        const map = document.getElementById('world-map-overlay');
        if (map) map.classList.add('translate-y-full');
    },

    renderMap() {
        const container = document.getElementById('map-nodes');
        if (!container) return;
        container.querySelectorAll('.map-node').forEach(n => n.remove());
        Object.values(this.mapNodes).forEach(node => {
            const isUnlocked = this.isNodeUnlocked(node.id);
            const isCompleted = this.state.completedNodes.includes(node.id);
            const isCurrent = this.state.currentNode === node.id;
            const el = document.createElement('div');
            el.className = `map-node absolute flex flex-col items-center gap-2 transition-all duration-300 pointer-events-auto ${isCompleted ? 'node-completed' : (isUnlocked ? 'node-active' : 'node-locked')}`;
            el.style.left = `${node.left}%`;
            el.style.top = `${node.top}%`;
            el.style.transform = 'translate(-50%, -50%)';
            el.style.zIndex = "10";
            let icon = '🔒';
            if (node.type === 'hub') icon = '◆';
            else if (isCompleted) icon = '✅';
            else if (isUnlocked) icon = '⚔️';
            el.innerHTML = `<div class="w-14 h-14 rounded-full bg-gray-800/90 border-2 ${isCurrent ? 'border-brand-400' : 'border-white/20'} flex items-center justify-center text-xl shadow-xl cursor-pointer hover:scale-110 transition-transform">${icon}</div>${!node.type ? `<div class="bg-black/80 px-2 py-1 rounded text-xs text-white border border-white/10 shadow-lg">${node.label}</div>` : ''}`;
            if (isUnlocked && node.type !== 'hub' && node.type !== 'gate') {
                el.onclick = (e) => { e.stopPropagation(); this.enterNode(node.id); };
            }
            container.appendChild(el);
        });
        this.updateMapToken();
    },

    playIntro() {
        if (this.introPlayed) return;
        this.introPlayed = true;
        this.show(); // Show Map

        // 1. Initial State: Token off-screen or at start position
        const token = document.getElementById('player-token');
        if (token) {
            token.style.transition = 'none'; // Reset transition for instant placement
            token.style.opacity = '0';
            token.style.left = '4%'; // Start position (N1)
            token.style.top = '40%'; // Slightly above
        }

        // 2. Animate Appearance
        setTimeout(() => {
            if (token) {
                token.style.transition = 'opacity 1s ease-out, top 2s ease-in-out'; // SLOW movement (2s)
                token.style.opacity = '1';
                token.style.top = '52%'; // Land on N1

                // Sound Effect
                if (typeof SoundFX !== 'undefined') SoundFX.playChime();
            }
        }, 500);

        // 3. Transport to Slide 1 (World Without Names) after animation finishes
        setTimeout(() => {
            this.hide(); // Hide Map
            // Force scroll to Slide 1 (Index 1)
            const slider = document.getElementById('slider');
            if (slider) slider.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
        }, 3500); // Give it time (500ms delay + 2000ms animation + 1000ms read time)
    },

    isNodeUnlocked(nodeId) {
        if (nodeId === 'N1') return true;
        if (this.state.unlockedNodes.includes(nodeId)) return true;
        const node = this.mapNodes[nodeId];
        return node && node.parents.every(p => this.state.completedNodes.includes(p));
    },

    enterNode(nodeId) {
        this.state.currentNode = nodeId;
        this.hide();
        const node = this.mapNodes[nodeId];
        if (node && node.slides) {
            const slider = document.getElementById('slider');
            const slideWidth = slider.clientWidth;
            slider.scrollTo({ left: node.slides[0] * slideWidth, behavior: 'smooth' });
        }
        this.saveProgress();
    },

    updateMapToken() {
        const token = document.getElementById('player-token');
        if (!token) return;
        const node = this.mapNodes[this.state.currentNode || 'N1'];
        if (node) {
            token.style.left = `${node.left}%`;
            token.style.top = `${node.top}%`;
            token.style.transform = 'translate(-50%, -50%)';
            token.style.opacity = '1';
        }
        if (typeof GameEngine !== 'undefined' && GameEngine.config.characterId) {
            const img = document.getElementById('player-token-img');
            const char = GameEngine.characters[GameEngine.config.characterId];
            if (img && char && GameEngine.getAssetUrl) {
                img.src = GameEngine.getAssetUrl(GameEngine.config.characterId, 'healthy');
            }
        }
    },

    saveProgress() { localStorage.setItem('naming_game_map_v2', JSON.stringify(this.state)); },
    loadProgress() { const saved = localStorage.getItem('naming_game_map_v2'); if (saved) this.state = JSON.parse(saved); },
    checkSlidePosition(slideIndex) { /* Placeholder for advanced tracking */ },
    findNodeBySlide(slideIndex) { return Object.values(this.mapNodes).find(n => n.slides && n.slides.includes(slideIndex)); },
    completeNode(nodeId) { if (!this.state.completedNodes.includes(nodeId)) this.state.completedNodes.push(nodeId); this.saveProgress(); },
    movePlayerToNode(nodeId, animate) {
        // Unlock the node first
        if (!this.state.unlockedNodes.includes(nodeId)) {
            this.state.unlockedNodes.push(nodeId);
        }

        this.state.currentNode = nodeId;
        this.saveProgress();
        this.renderMap(); // Update icons (locks to swords/checks)

        if (animate) {
            const token = document.getElementById('player-token');
            const targetNode = this.mapNodes[nodeId];

            if (token && targetNode) {
                // CSS transition handles the movement smoothly
                token.style.transition = "all 2s ease-in-out";
                token.style.left = `${targetNode.left}%`;
                token.style.top = `${targetNode.top}%`;

                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
            }
        } else {
            this.updateMapToken(); // Instant update
        }
    }
};

window.MapSystem = MapSystem;
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => MapSystem.init(), 100); });
