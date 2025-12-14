// ═══════════════════════════════════════════════════════════════════════════════
// MAP.JS - World Map System v4.0 (Complete Rewrite)
// Pattern-Based Node Progression with Lock Animations & Hub Returns
// ═══════════════════════════════════════════════════════════════════════════════

const MapSystem = {
    // === STATE FLAGS ===
    active: false,
    introPlayed: false,
    initialized: false,
    isAnimating: false, // Prevents double-clicks during animations

    // === NODE DEFINITIONS ===
    // Each node has a type that determines its behavior:
    // - "linear": Standard node with slides, unlocks one child
    // - "hub": Decision point, no slides, unlocks multiple branch children
    // - "branch": Child of a hub, returns to hub after completion
    // - "gate": Requires ALL parents complete, then unlocks child
    mapNodes: {
        // Phase 1: The Awakening (slides 1-5)
        "N1": { 
            id: "N1", 
            left: 4, top: 52, 
            label: "The Village", 
            type: "linear",
            slides: [1, 2, 3, 4, 5], // Ends on Exit Ticket
            exitSlide: 5, // The slide where Map button triggers completion
            parents: [],
            children: ["N2"]
        },
        
        // Phase 2: The Hunt (slides 6-8, then branches)
        "N2": { 
            id: "N2", 
            left: 12, top: 52, 
            label: "Three Noun Families", 
            type: "linear",
            slides: [6, 7, 8], 
            exitSlide: 8,
            parents: ["N1"],
            children: ["HubA"]
        },
        
        // Hub A: Central Hub Camp (3-way branch)
        "HubA": { 
            id: "HubA", 
            left: 21, top: 52, 
            type: "hub", 
            label: "Central Hub Camp",
            parents: ["N2"],
            children: ["N3A", "N3B", "N3C"],
            gate: "N4" // After all branches complete, this gate opens
        },
        
        // Branch A nodes
        "N3A": { 
            id: "N3A", 
            left: 21, top: 22, 
            label: "People Hunt", 
            type: "branch",
            slides: [9], 
            exitSlide: 9,
            parents: ["HubA"],
            returnTo: "HubA", // Branch nodes return to their hub
            branch: "A"
        },
        "N3B": { 
            id: "N3B", 
            left: 16, top: 82, 
            label: "Places Hunt", 
            type: "branch",
            slides: [10], 
            exitSlide: 10,
            parents: ["HubA"],
            returnTo: "HubA",
            branch: "A"
        },
        "N3C": { 
            id: "N3C", 
            left: 26, top: 82, 
            label: "Things Hunt", 
            type: "branch",
            slides: [11], 
            exitSlide: 11,
            parents: ["HubA"],
            returnTo: "HubA",
            branch: "A"
        },
        
        // Gate after Branch A
        "N4": { 
            id: "N4", 
            left: 30, top: 52, 
            label: "Mega-Mix Boss", 
            type: "gate",
            slides: [12], 
            exitSlide: 12,
            parents: ["N3A", "N3B", "N3C"], // ALL must be complete
            children: ["N5"]
        },
        
        // Phase 3: The Kingdom (Common Nouns)
        "N5": { 
            id: "N5", 
            left: 38, top: 52, 
            label: "Common Nouns", 
            type: "linear",
            slides: [13, 14, 15, 16, 17], 
            exitSlide: 17,
            parents: ["N4"],
            children: ["N6"]
        },
        "N6": { 
            id: "N6", 
            left: 45, top: 52, 
            label: "Crown Rule", 
            type: "linear",
            slides: [18, 19, 20, 21], 
            exitSlide: 21,
            parents: ["N5"],
            children: ["N7"]
        },
        "N7": { 
            id: "N7", 
            left: 52, top: 52, 
            label: "Proper Categories", 
            type: "linear",
            slides: [22, 23, 24, 25, 26, 27], 
            exitSlide: 27,
            parents: ["N6"],
            children: ["N8"]
        },
        
        // Phase 4: The Investigation
        "N8": { 
            id: "N8", 
            left: 59, top: 52, 
            label: "Case Briefing", 
            type: "linear",
            slides: [28], 
            exitSlide: 28,
            parents: ["N7"],
            children: ["HubB"]
        },
        
        // Hub B: Detective's Hub (2-way branch)
        "HubB": { 
            id: "HubB", 
            left: 66, top: 52, 
            type: "hub", 
            label: "Detective's Hub",
            parents: ["N8"],
            children: ["N9A", "N9B"],
            gate: "GateB"
        },
        "N9A": { 
            id: "N9A", 
            left: 66, top: 23, 
            label: "Evidence A", 
            type: "branch",
            slides: [29], 
            exitSlide: 29,
            parents: ["HubB"],
            returnTo: "HubB",
            branch: "B"
        },
        "N9B": { 
            id: "N9B", 
            left: 66, top: 81, 
            label: "Evidence B", 
            type: "branch",
            slides: [30], 
            exitSlide: 30,
            parents: ["HubB"],
            returnTo: "HubB",
            branch: "B"
        },
        "GateB": { 
            id: "GateB", 
            left: 72, top: 52, 
            type: "gate", 
            label: "Case Closed",
            parents: ["N9A", "N9B"],
            children: ["HubC"]
        },
        
        // Phase 5: The Trials (3-way branch)
        "HubC": { 
            id: "HubC", 
            left: 79, top: 52, 
            type: "hub", 
            label: "Trial Hub",
            parents: ["GateB"],
            children: ["N10A", "N10B", "N10C"],
            gate: "N11"
        },
        "N10A": { 
            id: "N10A", 
            left: 79, top: 22, 
            label: "Quiz 1", 
            type: "branch",
            slides: [31], 
            exitSlide: 31,
            parents: ["HubC"],
            returnTo: "HubC",
            branch: "C"
        },
        "N10B": { 
            id: "N10B", 
            left: 74, top: 82, 
            label: "Quiz 2", 
            type: "branch",
            slides: [32], 
            exitSlide: 32,
            parents: ["HubC"],
            returnTo: "HubC",
            branch: "C"
        },
        "N10C": { 
            id: "N10C", 
            left: 84, top: 82, 
            label: "Quiz 3", 
            type: "branch",
            slides: [33], 
            exitSlide: 33,
            parents: ["HubC"],
            returnTo: "HubC",
            branch: "C"
        },
        
        // Phase 6: The Finale
        "N11": { 
            id: "N11", 
            left: 93, top: 52, 
            label: "Exit Ticket Boss", 
            type: "gate",
            slides: [34], 
            exitSlide: 34,
            parents: ["N10A", "N10B", "N10C"],
            children: ["N12"]
        },
        "N12": { 
            id: "N12", 
            left: 98, top: 45, 
            label: "Mission Complete", 
            type: "linear",
            slides: [35, 36], 
            exitSlide: 36,
            parents: ["N11"],
            children: []
        }
    },

    // === RUNTIME STATE ===
    state: {
        completedNodes: [],
        unlockedNodes: ['N1'],
        currentNode: 'N1',
        pendingUnlock: null // Node waiting to be unlocked after animation
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    init() {
        if (this.initialized && document.getElementById('world-map-overlay')) return;
        console.log("🗺️ MapSystem v4.0 Initializing...");
        this.injectMapUI();
        this.injectMapButton();
        this.loadProgress();
        this.initialized = true;
    },

    injectMapUI() {
        if (document.getElementById('world-map-overlay')) return;
        
        const mapHTML = `
        <div id="world-map-overlay" class="fixed inset-0 z-[8000] bg-[#0B0C15] transition-transform duration-700 translate-y-full flex flex-col">
            <!-- Header -->
            <div class="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <h1 class="font-display text-4xl text-brand-400 drop-shadow-lg">🗺️ World Map</h1>
                <button onclick="MapSystem.hideMapOnly()" class="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-all cursor-pointer pointer-events-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
            </div>
            
            <!-- Map Container -->
            <div class="flex-1 overflow-hidden relative flex items-center justify-center">
                <div id="map-nodes" class="relative w-full max-w-[177.78vh] aspect-video">
                    <!-- Background Image -->
                    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('https://github.com/unclestevenandfriends-pixel/The-naming-game-noun-presentation-assets/blob/main/assets/characters/Final%20Map.jpg?raw=true');"></div>
                    
                    <!-- Connection Lines (SVG) -->
                    <svg id="map-lines" class="absolute inset-0 w-full h-full pointer-events-none opacity-60"></svg>
                    
                    <!-- Player Token -->
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
            
            <!-- Instruction Banner (shown when player needs to click a node) -->
            <div id="map-instruction" class="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-500 pointer-events-none">
                <div class="bg-black/90 backdrop-blur-xl px-8 py-4 rounded-2xl border border-brand-500/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    <p id="map-instruction-text" class="text-lg font-bold text-brand-400 text-center">Click on the glowing node to continue!</p>
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAP BUTTON LOGIC (Context-Aware)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    handleMapButtonClick() {
        if (this.isAnimating) return;
        
        const currentSlide = this.getCurrentSlideIndex();
        
        // CASE 1: Hero slide, intro not played → Start Journey
        if (currentSlide === 0 && !this.introPlayed) {
            this.playIntro();
            return;
        }
        
        // CASE 2: On an exit slide → Trigger completion sequence
        const currentNode = this.findNodeBySlide(currentSlide);
        if (currentNode && currentNode.exitSlide === currentSlide) {
            this.triggerNodeCompletion(currentNode.id);
            return;
        }
        
        // CASE 3: On any other slide → Just view the map (no progression)
        this.showMapForViewing();
    },

    // Update button appearance based on context
    updateButtonState(slideIndex) {
        const btn = document.getElementById('map-nav-btn');
        const btnText = document.getElementById('map-btn-text');
        const btnIcon = document.getElementById('map-btn-icon');
        if (!btn || !btnText || !btnIcon) return;

        // Remove flash animation
        btn.classList.remove('map-btn-flash');

        if (slideIndex === 0 && !this.introPlayed) {
            // Hero slide - Start Journey
            btnIcon.innerText = '🚀';
            btnText.innerText = 'Start Journey';
            btn.className = "ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
        } else {
            // Check if we're on an exit slide
            const node = this.findNodeBySlide(slideIndex);
            const isExitSlide = node && node.exitSlide === slideIndex;
            
            if (isExitSlide && !this.state.completedNodes.includes(node.id)) {
                // On exit slide, not yet completed → Flash and show "Continue"
                btnIcon.innerText = '🗺️';
                btnText.innerText = 'Continue →';
                btn.classList.add('map-btn-flash');
                btn.className = "ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50 map-btn-flash";
            } else {
                // Normal map view button
                btnIcon.innerText = '🗺️';
                btnText.innerText = 'Map';
                btn.className = "ml-4 px-4 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-400 font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer pointer-events-auto z-50";
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // NODE COMPLETION SEQUENCE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    triggerNodeCompletion(nodeId) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const node = this.mapNodes[nodeId];
        if (!node) {
            this.isAnimating = false;
            return;
        }
        
        console.log(`🎯 Completing node: ${nodeId} (${node.label})`);
        
        // 1. Mark node as completed
        if (!this.state.completedNodes.includes(nodeId)) {
            this.state.completedNodes.push(nodeId);
        }
        
        // 2. Show the map
        this.show();
        
        // 3. After map is visible, run the completion sequence
        setTimeout(() => {
            // Position token on the completed node
            this.positionTokenOnNode(nodeId, false);
            
            // 4. Determine what to unlock based on node type
            if (node.type === 'branch' && node.returnTo) {
                // Branch node → return to hub
                this.handleBranchReturn(node);
            } else if (node.type === 'linear' || node.type === 'gate') {
                // Linear/Gate → unlock children
                this.handleLinearCompletion(node);
            }
            
            this.saveProgress();
        }, 800);
    },

    handleBranchReturn(node) {
        const hubId = node.returnTo;
        const hub = this.mapNodes[hubId];
        
        // Check if all branches of this hub are complete
        const allBranchesComplete = hub.children.every(childId => 
            this.state.completedNodes.includes(childId)
        );
        
        // Animate token back to hub
        setTimeout(() => {
            this.animateTokenToNode(hubId);
            this.state.currentNode = hubId;
            
            setTimeout(() => {
                if (allBranchesComplete) {
                    // All branches done → unlock the gate
                    const gateId = hub.gate;
                    this.showInstruction(`All challenges complete! ${this.mapNodes[gateId].label} unlocked!`);
                    this.unlockNodeWithAnimation(gateId);
                } else {
                    // Still have branches to do
                    const remaining = hub.children.filter(id => !this.state.completedNodes.includes(id));
                    this.showInstruction(`${remaining.length} challenge${remaining.length > 1 ? 's' : ''} remaining. Pick your next path!`);
                    this.renderMap();
                    this.isAnimating = false;
                }
            }, 2200);
        }, 500);
    },

    handleLinearCompletion(node) {
        // For linear/gate nodes, unlock children
        if (node.children && node.children.length > 0) {
            const nextNodeId = node.children[0];
            const nextNode = this.mapNodes[nextNodeId];
            
            // Check if next is a hub (unlocks multiple) or single node
            if (nextNode.type === 'hub') {
                // Animate to hub, then unlock its branches
                setTimeout(() => {
                    this.showInstruction(`Entering ${nextNode.label}...`);
                    this.unlockNodeWithAnimation(nextNodeId);
                    
                    setTimeout(() => {
                        this.animateTokenToNode(nextNodeId);
                        this.state.currentNode = nextNodeId;
                        
                        // After arriving at hub, unlock all its children
                        setTimeout(() => {
                            nextNode.children.forEach((childId, index) => {
                                setTimeout(() => {
                                    this.unlockNodeWithAnimation(childId);
                                }, index * 400);
                            });
                            
                            setTimeout(() => {
                                this.showInstruction('Choose your path!');
                                this.isAnimating = false;
                            }, nextNode.children.length * 400 + 500);
                        }, 2200);
                    }, 1000);
                }, 500);
            } else {
                // Simple linear unlock
                setTimeout(() => {
                    this.showInstruction(`${nextNode.label} unlocked!`);
                    this.unlockNodeWithAnimation(nextNodeId);
                    this.isAnimating = false;
                }, 500);
            }
        } else {
            // No children (end of game)
            this.showInstruction('🎉 Mission Complete! 🎉');
            this.isAnimating = false;
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // UNLOCK ANIMATION
    // ═══════════════════════════════════════════════════════════════════════════════
    
    unlockNodeWithAnimation(nodeId) {
        if (!this.state.unlockedNodes.includes(nodeId)) {
            this.state.unlockedNodes.push(nodeId);
        }
        
        // Find the node element
        const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
            // Add unlock animation class
            nodeEl.classList.add('node-unlocking');
            
            // Find the lock icon and animate it
            const lockIcon = nodeEl.querySelector('.node-icon');
            if (lockIcon) {
                // Change from lock to sword
                lockIcon.classList.add('lock-opening');
                setTimeout(() => {
                    lockIcon.innerHTML = '⚔️';
                    lockIcon.classList.remove('lock-opening');
                    lockIcon.classList.add('lock-opened');
                }, 500);
            }
            
            // Play unlock sound
            if (typeof SoundFX !== 'undefined') {
                SoundFX.playCorrect();
            }
            
            setTimeout(() => {
                nodeEl.classList.remove('node-unlocking', 'node-locked');
                nodeEl.classList.add('node-active');
                this.renderMap(); // Re-render to update click handlers
            }, 1000);
        } else {
            // Fallback: just re-render
            this.renderMap();
        }
        
        this.saveProgress();
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOKEN ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    positionTokenOnNode(nodeId, animate = false) {
        const token = document.getElementById('player-token');
        const node = this.mapNodes[nodeId];
        if (!token || !node) return;
        
        if (!animate) {
            token.style.transition = 'opacity 0.5s ease';
        }
        
        token.style.left = `${node.left}%`;
        token.style.top = `${node.top}%`;
        token.style.transform = 'translate(-50%, -50%)';
        token.style.opacity = '1';
        
        // Update avatar
        this.updateTokenAvatar();
    },

    animateTokenToNode(nodeId) {
        const token = document.getElementById('player-token');
        const node = this.mapNodes[nodeId];
        if (!token || !node) return;
        
        token.style.transition = 'left 2s ease-in-out, top 2s ease-in-out';
        token.style.left = `${node.left}%`;
        token.style.top = `${node.top}%`;
        
        // Play movement sound
        if (typeof SoundFX !== 'undefined') {
            SoundFX.playSlide();
        }
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAP RENDERING
    // ═══════════════════════════════════════════════════════════════════════════════
    
    renderMap() {
        const container = document.getElementById('map-nodes');
        if (!container) return;
        
        // Clear existing nodes (but keep background and token)
        container.querySelectorAll('.map-node').forEach(n => n.remove());
        
        // Render each node
        Object.values(this.mapNodes).forEach(node => {
            const isUnlocked = this.isNodeUnlocked(node.id);
            const isCompleted = this.state.completedNodes.includes(node.id);
            const isCurrent = this.state.currentNode === node.id;
            const isHub = node.type === 'hub';
            const isGate = node.type === 'gate';
            
            // Determine icon
            let icon = '🔒';
            if (isHub) icon = '◆';
            else if (isGate && !isUnlocked) icon = '🔒';
            else if (isCompleted) icon = '✅';
            else if (isUnlocked) icon = '⚔️';
            
            // Determine state class
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
            
            // Click handler - only for unlocked, non-hub nodes that aren't completed
            // OR for unlocked branch nodes that are ready to play
            if (isUnlocked && !isHub && (!isCompleted || node.type === 'branch')) {
                el.onclick = (e) => {
                    e.stopPropagation();
                    this.onNodeClick(node.id);
                };
                el.style.cursor = 'pointer';
            } else if (!isUnlocked) {
                el.onclick = (e) => {
                    e.stopPropagation();
                    this.showLockedMessage();
                };
            }
            
            container.appendChild(el);
        });
        
        // Update token position
        this.positionTokenOnNode(this.state.currentNode, false);
    },

    onNodeClick(nodeId) {
        if (this.isAnimating) return;
        
        const node = this.mapNodes[nodeId];
        if (!node || !node.slides || node.slides.length === 0) return;
        
        // Don't allow re-entry to completed linear nodes (but allow branch re-entry for review)
        if (this.state.completedNodes.includes(nodeId) && node.type !== 'branch') {
            // Could allow review here if desired
            return;
        }
        
        this.isAnimating = true;
        
        // If clicking from a different node, animate token first
        if (this.state.currentNode !== nodeId) {
            this.animateTokenToNode(nodeId);
            this.state.currentNode = nodeId;
            this.saveProgress();
            
            setTimeout(() => {
                this.enterNodeSlides(nodeId);
            }, 2200);
        } else {
            this.enterNodeSlides(nodeId);
        }
    },

    enterNodeSlides(nodeId) {
        const node = this.mapNodes[nodeId];
        if (!node || !node.slides) return;
        
        this.hide();
        
        // Navigate to first slide of this node
        const slider = document.getElementById('slider');
        if (slider) {
            const firstSlide = node.slides[0];
            slider.scrollTo({ 
                left: firstSlide * slider.clientWidth, 
                behavior: 'smooth' 
            });
        }
        
        // Restore viewport opacity
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') {
            gsap.to(viewport, { opacity: 1, duration: 0.3 });
        }
        
        setTimeout(() => {
            this.isAnimating = false;
            this.updateButtonState(node.slides[0]);
        }, 500);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // MAP VISIBILITY
    // ═══════════════════════════════════════════════════════════════════════════════
    
    show() {
        if (!document.getElementById('world-map-overlay')) this.init();
        this.renderMap();
        
        const map = document.getElementById('world-map-overlay');
        if (map) {
            map.classList.remove('translate-y-full');
            this.active = true;
        }
        
        // Dim the viewport
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') {
            gsap.to(viewport, { opacity: 0.3, duration: 0.5 });
        }
        
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

    // For viewing only (not progressing)
    showMapForViewing() {
        this.show();
        this.showInstruction('Viewing map. Click the ▲ to return to your lesson.');
    },

    // Hide map without affecting viewport opacity
    hideMapOnly() {
        this.hide();
        
        const viewport = document.getElementById('viewport-frame');
        if (viewport && typeof gsap !== 'undefined') {
            gsap.to(viewport, { opacity: 1, duration: 0.3 });
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // INTRO SEQUENCE
    // ═══════════════════════════════════════════════════════════════════════════════
    
    playIntro() {
        if (this.introPlayed) return;
        this.introPlayed = true;
        this.isAnimating = true;
        
        this.show();
        
        const token = document.getElementById('player-token');
        if (token) {
            // Start above the first node
            token.style.transition = 'none';
            token.style.opacity = '0';
            token.style.left = '4%';
            token.style.top = '30%';
            
            // Animate down to N1
            setTimeout(() => {
                token.style.transition = 'opacity 1s ease-out, top 2s ease-in-out';
                token.style.opacity = '1';
                token.style.top = '52%';
                
                if (typeof SoundFX !== 'undefined' && SoundFX.playSuccess) {
                    SoundFX.playSuccess();
                }
            }, 500);
        }
        
        // Show instruction
        setTimeout(() => {
            this.showInstruction('Your adventure begins! Click "The Village" to start.');
        }, 2000);
        
        // Don't auto-enter - wait for player to click the node
        setTimeout(() => {
            this.isAnimating = false;
        }, 3000);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // INSTRUCTION BANNER
    // ═══════════════════════════════════════════════════════════════════════════════
    
    showInstruction(text) {
        const banner = document.getElementById('map-instruction');
        const textEl = document.getElementById('map-instruction-text');
        if (banner && textEl) {
            textEl.innerText = text;
            banner.style.opacity = '1';
        }
    },

    hideInstruction() {
        const banner = document.getElementById('map-instruction');
        if (banner) {
            banner.style.opacity = '0';
        }
    },

    showLockedMessage() {
        this.showInstruction('🔒 This area is locked. Complete the current challenge first!');
        if (typeof SoundFX !== 'undefined' && SoundFX.playIncorrect) {
            SoundFX.playIncorrect();
        }
        setTimeout(() => this.hideInstruction(), 2000);
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // NAVIGATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    getCurrentSlideIndex() {
        const slider = document.getElementById('slider');
        if (!slider) return 0;
        return Math.round(slider.scrollLeft / slider.clientWidth);
    },

    findNodeBySlide(slideIndex) {
        return Object.values(this.mapNodes).find(n => 
            n.slides && n.slides.includes(slideIndex)
        );
    },

    isNodeUnlocked(nodeId) {
        if (nodeId === 'N1') return true;
        if (this.state.unlockedNodes.includes(nodeId)) return true;
        
        // Check parent requirements
        const node = this.mapNodes[nodeId];
        if (!node || !node.parents || node.parents.length === 0) return false;
        
        // For gates, ALL parents must be complete
        if (node.type === 'gate') {
            return node.parents.every(p => this.state.completedNodes.includes(p));
        }
        
        // For others, at least one parent must be complete
        return node.parents.some(p => this.state.completedNodes.includes(p));
    },

    // Check if swiping forward from this slide is allowed
    canSwipeForward(currentSlide) {
        const node = this.findNodeBySlide(currentSlide);
        
        // If on exit slide, block forward swipe
        if (node && node.exitSlide === currentSlide) {
            return false;
        }
        
        // If slide isn't part of any unlocked node, block
        if (!node || !this.isNodeUnlocked(node.id)) {
            return false;
        }
        
        // Check if trying to go beyond the node's slides
        const nextSlide = currentSlide + 1;
        if (!node.slides.includes(nextSlide)) {
            // Check if next slide belongs to an unlocked node
            const nextNode = this.findNodeBySlide(nextSlide);
            if (!nextNode || !this.isNodeUnlocked(nextNode.id)) {
                return false;
            }
        }
        
        return true;
    },

    // Get the maximum slide the player can access
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════════
    
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
                this.state.completedNodes = data.completedNodes || [];
                this.state.unlockedNodes = data.unlockedNodes || ['N1'];
                this.state.currentNode = data.currentNode || 'N1';
                this.introPlayed = data.introPlayed || false;
                console.log("🗺️ Progress loaded:", this.state);
            } catch (e) {
                console.warn("⚠️ Could not load map progress:", e);
            }
        }
    },

    resetProgress() {
        this.state = {
            completedNodes: [],
            unlockedNodes: ['N1'],
            currentNode: 'N1',
            pendingUnlock: null
        };
        this.introPlayed = false;
        localStorage.removeItem('naming_game_map_v4');
        console.log("🗺️ Progress reset");
    }
};

// Expose globally
window.MapSystem = MapSystem;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => MapSystem.init(), 100);
});
