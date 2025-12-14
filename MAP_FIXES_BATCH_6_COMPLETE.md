# COMPREHENSIVE FIX DOCUMENT — BATCH 6
## All-in-One Implementation Guide

**Date:** December 2024  
**Priority:** CRITICAL — Multiple Blocking Issues  
**Approach:** Complete code replacements with exact line numbers

---

## CRITICAL ROOT CAUSES IDENTIFIED

| Issue | Root Cause | Location |
|-------|-----------|----------|
| Nodes never unlock | State initialized with lowercase 'n1' but mapNodes uses uppercase 'N1' | map.js line 59 |
| No locked node warning | renderMap() has no click handler for locked nodes | map.js line 229-233 |
| Map button doesn't flash | checkSlidePosition() doesn't call any flash function | map.js line 763 |
| Harsh violation feedback | showLockedAlert() still uses old dialog + harsh sound | main.js line 541-571 |
| Stacking violations | No debounce on showLockedAlert() | main.js line 541 |
| Game on wrong slide | spot-noun-grid is on slide 7/8, not Things Hunt slide | HTML + games.js |

---

## FIX 1: ID CASING MISMATCH (CRITICAL)

### Location: map.js line 57-61

**FIND:**
```javascript
state: {
    completedNodes: [],
    unlockedNodes: ['n1'],
    currentNode: null
},
```

**REPLACE WITH:**
```javascript
state: {
    completedNodes: [],
    unlockedNodes: ['N1'],  // ← UPPERCASE to match mapNodes keys
    currentNode: null
},
```

### Also in loadProgress() around line 733-738

**FIND:**
```javascript
loadProgress() {
    const saved = localStorage.getItem('map_data');
    if (saved) {
        this.state = JSON.parse(saved);
    }
},
```

**REPLACE WITH:**
```javascript
loadProgress() {
    const saved = localStorage.getItem('map_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // MIGRATION: Ensure all node IDs are uppercase
            if (data.unlockedNodes) {
                data.unlockedNodes = data.unlockedNodes.map(id => id.toUpperCase());
            }
            if (data.completedNodes) {
                data.completedNodes = data.completedNodes.map(id => id.toUpperCase());
            }
            if (data.currentNode) {
                data.currentNode = data.currentNode.toUpperCase();
            }
            this.state = data;
            console.log('🗺️ Loaded progress:', this.state);
        } catch (e) {
            console.warn('🗺️ Failed to load progress, using defaults');
        }
    }
},
```

---

## FIX 2: ADD LOCKED NODE CLICK HANDLER

### Location: map.js inside renderMap(), around line 229-235

**FIND:**
```javascript
// Click handler (only for non-hub/gate unlocked nodes)
if (isUnlocked && !isHub && !isGate) {
    el.style.cursor = 'pointer';
    el.onclick = () => this.enterNode(node.id);
}

container.appendChild(el);
```

**REPLACE WITH:**
```javascript
// Click handler (only for non-hub/gate unlocked nodes)
if (isUnlocked && !isHub && !isGate) {
    el.style.cursor = 'pointer';
    el.onclick = () => this.enterNode(node.id);
} else if (!isUnlocked && !isHub) {
    // LOCKED NODE: Show warning when clicked
    el.style.cursor = 'not-allowed';
    el.onclick = () => this.showLockedNodeWarning(node);
}

container.appendChild(el);
```

### Add this NEW function to MapSystem (before the closing `};`)

**ADD this function around line 795 (before the final `};`):**

```javascript
/**
 * Show warning when clicking a locked node
 */
showLockedNodeWarning(node) {
    // Remove any existing warning
    const existing = document.getElementById('locked-node-warning');
    if (existing) existing.remove();
    
    // Determine what needs to be completed
    let message = 'Complete the previous mission first.';
    
    if (node.parents && node.parents.length > 1) {
        // Convergence node - needs multiple prerequisites
        const incompleteParents = node.parents.filter(p => 
            !this.state.completedNodes.includes(p)
        );
        if (incompleteParents.length > 0) {
            const labels = incompleteParents.map(p => {
                const pNode = this.mapNodes[p];
                return pNode ? pNode.label : p;
            }).join(', ');
            message = `Complete all branches: ${labels}`;
        }
    }
    
    // Create warning element
    const warning = document.createElement('div');
    warning.id = 'locked-node-warning';
    warning.style.cssText = `
        position: fixed;
        bottom: 28%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: rgba(0, 0, 0, 0.95);
        color: #fbbf24;
        padding: 14px 28px;
        border-radius: 20px;
        font-size: 15px;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease-out;
        pointer-events: none;
        border: 1px solid rgba(251, 191, 36, 0.4);
        max-width: 320px;
        text-align: center;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.6);
    `;
    warning.innerHTML = `<span style="margin-right: 8px;">🔒</span>${message}`;
    document.body.appendChild(warning);
    
    // Animate in
    requestAnimationFrame(() => {
        warning.style.opacity = '1';
        warning.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Soft pop sound
    if (typeof SoundFX !== 'undefined' && SoundFX.playPop) {
        SoundFX.playPop();
    }
    
    // Remove after 3.5 seconds (readable duration)
    setTimeout(() => {
        warning.style.opacity = '0';
        warning.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => warning.remove(), 300);
    }, 3500);
},
```

---

## FIX 3: ADD MAP BUTTON FLASH LOGIC

### Location: map.js - Replace checkSlidePosition() around line 751-766

**FIND:**
```javascript
// Called by main.js scroll listener
checkSlidePosition(slideIndex) {
    // Find which node encompasses this slide
    const activeNodeId = this.state.currentNode;
    if (!activeNodeId) return; // No active mission

    const node = this.mapNodes[activeNodeId];
    if (!node || !node.slides) return;

    // If we are on the LAST slide of the current node
    const lastSlideOfNode = node.slides[node.slides.length - 1];

    if (slideIndex === lastSlideOfNode) {
        this.injectCompletionButton(slideIndex, node.id);
    }
},
```

**REPLACE WITH:**
```javascript
// Called by main.js scroll listener
checkSlidePosition(slideIndex) {
    // Find which node encompasses this slide
    const activeNodeId = this.state.currentNode;
    if (!activeNodeId) return; // No active mission

    const node = this.mapNodes[activeNodeId];
    if (!node || !node.slides) return;

    // If we are on the LAST slide of the current node
    const lastSlideOfNode = node.slides[node.slides.length - 1];

    if (slideIndex === lastSlideOfNode) {
        console.log(`🗺️ Reached end of node ${node.id} - flashing map button`);
        this.flashMapButton();
        this.injectCompletionButton(slideIndex, node.id);
    } else {
        // Not on last slide - stop flashing
        this.stopMapButtonFlash();
    }
},

/**
 * Flash the map navigation button to indicate it should be clicked
 */
flashMapButton() {
    const mapBtn = document.getElementById('map-nav-btn');
    if (!mapBtn) {
        console.warn('🗺️ Map button not found for flashing');
        return;
    }
    
    // Prevent duplicate animation
    if (mapBtn.dataset.flashing === 'true') return;
    mapBtn.dataset.flashing = 'true';
    
    console.log('🗺️ Starting map button flash');
    
    // Add pulsing glow effect
    mapBtn.style.animation = 'mapBtnPulse 0.7s ease-in-out infinite';
    mapBtn.style.boxShadow = '0 0 30px rgba(34, 211, 238, 0.9), 0 0 60px rgba(34, 211, 238, 0.5)';
    mapBtn.style.border = '3px solid rgba(34, 211, 238, 1)';
    mapBtn.style.transform = 'scale(1.1)';
},

/**
 * Stop the map button flash animation
 */
stopMapButtonFlash() {
    const mapBtn = document.getElementById('map-nav-btn');
    if (!mapBtn) return;
    
    mapBtn.dataset.flashing = 'false';
    mapBtn.style.animation = '';
    mapBtn.style.boxShadow = '';
    mapBtn.style.border = '';
    mapBtn.style.transform = '';
},
```

### Add CSS animation (in styles.css)

```css
/* Map button pulse animation */
@keyframes mapBtnPulse {
    0%, 100% {
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(34, 211, 238, 0.9), 0 0 60px rgba(34, 211, 238, 0.5);
    }
    50% {
        transform: scale(1.2);
        box-shadow: 0 0 50px rgba(34, 211, 238, 1), 0 0 80px rgba(34, 211, 238, 0.7);
    }
}
```

---

## FIX 4: COMPLETE OVERHAUL OF showLockedAlert() (BOUNDARY VIOLATIONS)

### Location: main.js - REPLACE entire function (lines 538-571)

**FIND the entire showLockedAlert function and REPLACE with:**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// BOUNDARY VIOLATION FEEDBACK (V3 - Soft, Debounced, No Dialog)
// ═══════════════════════════════════════════════════════════════════════════════

// DEBOUNCE: Prevent stacking from aggressive swipes
let _lockedAlertCooldown = false;

/**
 * Show soft "locked" feedback when trying to swipe past boundary
 * - Red screen flash (like damage)
 * - Viewport shake
 * - Soft thud sound
 * - Small text indicator
 * - NO dialog box or map icon
 * - Fully debounced
 */
function showLockedAlert() {
    // CRITICAL: Prevent stacking - only one feedback per 800ms
    if (_lockedAlertCooldown) {
        console.log('🔒 Locked alert debounced (cooldown active)');
        return;
    }
    _lockedAlertCooldown = true;
    setTimeout(() => { _lockedAlertCooldown = false; }, 800);
    
    console.log('🔒 Showing soft locked feedback');
    
    // 1. RED SCREEN FLASH (like damage effect)
    // Remove any existing flash first
    const existingFlash = document.getElementById('locked-boundary-flash');
    if (existingFlash) existingFlash.remove();
    
    const flash = document.createElement('div');
    flash.id = 'locked-boundary-flash';
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, 
            rgba(239, 68, 68, 0.5) 0%, 
            rgba(239, 68, 68, 0.2) 40%, 
            transparent 70%);
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
    `;
    document.body.appendChild(flash);
    
    // Flash animation
    requestAnimationFrame(() => {
        flash.style.transition = 'opacity 0.1s ease-out';
        flash.style.opacity = '1';
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 150);
        }, 120);
    });
    
    // 2. VIEWPORT SHAKE
    const slider = document.getElementById('slider');
    if (slider) {
        slider.style.animation = 'none';
        slider.offsetHeight; // Force reflow
        slider.style.animation = 'shakeViewport 0.35s ease-in-out';
        setTimeout(() => { slider.style.animation = ''; }, 350);
    }
    
    // 3. SOFT SOUND (low volume, non-harsh)
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 120; // Low = soft thud
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, ctx.currentTime); // 12% volume
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
        // Audio failed silently - no problem
    }
    
    // 4. SMALL TEXT INDICATOR (bottom, non-intrusive)
    const existingIndicator = document.getElementById('locked-boundary-text');
    if (existingIndicator) existingIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'locked-boundary-text';
    indicator.style.cssText = `
        position: fixed;
        bottom: 12%;
        left: 50%;
        transform: translateX(-50%) translateY(15px);
        background: rgba(0, 0, 0, 0.85);
        color: #f87171;
        padding: 10px 22px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transition: all 0.25s ease-out;
        pointer-events: none;
        border: 1px solid rgba(248, 113, 113, 0.4);
    `;
    indicator.innerHTML = '🔒 Complete this zone first';
    document.body.appendChild(indicator);
    
    requestAnimationFrame(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => indicator.remove(), 250);
    }, 1800);
}
```

### Add shake animation CSS (in styles.css)

```css
/* Viewport shake for boundary violation */
@keyframes shakeViewport {
    0%, 100% { transform: translateX(0); }
    12% { transform: translateX(-6px); }
    25% { transform: translateX(5px); }
    37% { transform: translateX(-4px); }
    50% { transform: translateX(3px); }
    62% { transform: translateX(-2px); }
    75% { transform: translateX(1px); }
}
```

---

## FIX 5: ADD SCROLL BOUNDARY ENFORCEMENT (PREVENT BYPASS)

### Location: main.js - Add to the scroll event listener (around line 190-210)

**FIND the scroll listener that contains:**
```javascript
// --- MAP SYSTEM HOOK ---
if (typeof MapSystem !== 'undefined') {
    MapSystem.checkSlidePosition(index);
```

**ADD BEFORE that block (boundary enforcement):**
```javascript
// --- BOUNDARY ENFORCEMENT ---
// Prevent sliding past locked slides
if (typeof getMaxUnlockedSlide === 'function' && typeof MapSystem !== 'undefined') {
    const maxAllowed = getMaxUnlockedSlide();
    if (index > maxAllowed) {
        console.log(`🔒 Blocking slide ${index} > max ${maxAllowed}`);
        // Snap back immediately
        slider.scrollTo({
            left: maxAllowed * slideWidth,
            behavior: 'auto'
        });
        showLockedAlert();
        return; // Don't process further
    }
}

// --- MAP SYSTEM HOOK ---
```

---

## FIX 6: HUNT GAMES IMPLEMENTATION

### 6A. Modify Slide 7/8 (Things & Animals) - Remove Game, Keep Infographic

**Location:** Draft_1_The_Naming_Game_Index.HTML around lines 904-912

**FIND AND DELETE this entire block:**
```html
<!-- Bottom: Interactive Game -->
<div class="w-full mt-4">
  <p class="text-2xl text-secondary font-light text-center mb-6">
    Look at the words below. Can you find and click on the nouns?
  </p>
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full" id="spot-noun-grid">
    <!-- JS Injected -->
  </div>
</div>
```

The slide should now only contain the infographic (image + text about Things & Animals), matching slides 5 and 6.

### 6B. Create Hunt Game Slides

**Replace the placeholders with these complete slide implementations:**

#### Find "PLACEHOLDER: Slide 12 - Things Hunt" and REPLACE with:

```html
<!-- THINGS & ANIMALS HUNT - Node N3C -->
<section class="slide" data-type="challenge" data-node="N3C" id="slide-things-hunt">
  <div class="slide-content flex flex-col items-center justify-center h-full max-w-5xl px-4">
    
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-4 mb-3">
        <span class="text-5xl">🦊</span>
        <h2 class="font-display text-4xl md:text-5xl font-bold text-pink-400">Things & Animals Hunt</h2>
      </div>
      <p class="text-lg md:text-xl text-secondary">
        Find all the <span class="text-pink-400 font-bold">thing and animal nouns</span>! 
        <span class="text-white/50">Watch out for imposters!</span>
      </p>
    </div>
    
    <div class="glass-panel p-6 md:p-8 rounded-[2rem] w-full border border-pink-500/30 bg-black/40">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4" id="things-hunt-grid">
        <!-- JS Injected -->
      </div>
      <div class="mt-6 flex justify-center gap-8">
        <div class="text-center">
          <span class="text-3xl font-bold text-green-400" id="things-hunt-score">0</span>
          <span class="text-sm text-secondary block">Found</span>
        </div>
        <div class="text-center">
          <span class="text-3xl font-bold text-pink-400">5</span>
          <span class="text-sm text-secondary block">Target</span>
        </div>
      </div>
    </div>
    
  </div>
</section>
```

#### Find a suitable placeholder near N3A or create PEOPLE HUNT slide:

```html
<!-- PEOPLE HUNT - Node N3A -->
<section class="slide" data-type="challenge" data-node="N3A" id="slide-people-hunt">
  <div class="slide-content flex flex-col items-center justify-center h-full max-w-5xl px-4">
    
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-4 mb-3">
        <span class="text-5xl">👤</span>
        <h2 class="font-display text-4xl md:text-5xl font-bold text-blue-400">People Hunt</h2>
      </div>
      <p class="text-lg md:text-xl text-secondary">
        Find all the <span class="text-blue-400 font-bold">people nouns</span>! 
        <span class="text-white/50">Watch out for imposters!</span>
      </p>
    </div>
    
    <div class="glass-panel p-6 md:p-8 rounded-[2rem] w-full border border-blue-500/30 bg-black/40">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4" id="people-hunt-grid">
        <!-- JS Injected -->
      </div>
      <div class="mt-6 flex justify-center gap-8">
        <div class="text-center">
          <span class="text-3xl font-bold text-green-400" id="people-hunt-score">0</span>
          <span class="text-sm text-secondary block">Found</span>
        </div>
        <div class="text-center">
          <span class="text-3xl font-bold text-blue-400">5</span>
          <span class="text-sm text-secondary block">Target</span>
        </div>
      </div>
    </div>
    
  </div>
</section>
```

#### Create PLACES HUNT slide:

```html
<!-- PLACES HUNT - Node N3B -->
<section class="slide" data-type="challenge" data-node="N3B" id="slide-places-hunt">
  <div class="slide-content flex flex-col items-center justify-center h-full max-w-5xl px-4">
    
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-4 mb-3">
        <span class="text-5xl">🏠</span>
        <h2 class="font-display text-4xl md:text-5xl font-bold text-emerald-400">Places Hunt</h2>
      </div>
      <p class="text-lg md:text-xl text-secondary">
        Find all the <span class="text-emerald-400 font-bold">place nouns</span>! 
        <span class="text-white/50">Watch out for imposters!</span>
      </p>
    </div>
    
    <div class="glass-panel p-6 md:p-8 rounded-[2rem] w-full border border-emerald-500/30 bg-black/40">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4" id="places-hunt-grid">
        <!-- JS Injected -->
      </div>
      <div class="mt-6 flex justify-center gap-8">
        <div class="text-center">
          <span class="text-3xl font-bold text-green-400" id="places-hunt-score">0</span>
          <span class="text-sm text-secondary block">Found</span>
        </div>
        <div class="text-center">
          <span class="text-3xl font-bold text-emerald-400">5</span>
          <span class="text-sm text-secondary block">Target</span>
        </div>
      </div>
    </div>
    
  </div>
</section>
```

### 6C. Hunt Games JavaScript (Add to games.js)

**ADD this entire block to games.js (after the existing initSpotNounGrid function):**

```javascript
// ═══════════════════════════════════════════════════════════════════════════════
// HUNT GAMES - 10-Card Noun Identification Challenges
// Each game has: 5 correct nouns + 3 wrong parts of speech + 2 wrong noun types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * THINGS & ANIMALS HUNT (Node N3C)
 */
function initThingsHuntGrid() {
    const grid = document.getElementById('things-hunt-grid');
    if (!grid || grid.dataset.init) return;
    grid.dataset.init = 'true';
    
    const cards = [
        // CORRECT: Things & Animals (5)
        { word: 'fox', correct: true },
        { word: 'eagle', correct: true },
        { word: 'bus', correct: true },
        { word: 'sandwich', correct: true },
        { word: 'parrot', correct: true },
        // WRONG: Parts of speech (3)
        { word: 'quickly', correct: false, hint: 'adverb' },
        { word: 'beautiful', correct: false, hint: 'adjective' },
        { word: 'jumping', correct: false, hint: 'verb' },
        // WRONG: Other noun types (2)
        { word: 'doctor', correct: false, hint: 'person noun' },
        { word: 'library', correct: false, hint: 'place noun' }
    ].sort(() => Math.random() - 0.5);
    
    let found = 0;
    const target = 5;
    
    cards.forEach(card => {
        const btn = document.createElement('button');
        btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
        btn.textContent = card.word;
        
        btn.onclick = () => {
            if (btn.dataset.clicked) return;
            btn.dataset.clicked = 'true';
            
            if (card.correct) {
                btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
                found++;
                document.getElementById('things-hunt-score').textContent = found;
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
                recordAnswer(true, `Things Hunt: ${card.word}`);
                
                if (found >= target) {
                    setTimeout(() => huntGameComplete('things'), 600);
                }
            } else {
                btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
                if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
                recordAnswer(false, `Things Hunt: ${card.word} (${card.hint})`);
            }
        };
        
        grid.appendChild(btn);
    });
}

/**
 * PEOPLE HUNT (Node N3A)
 */
function initPeopleHuntGrid() {
    const grid = document.getElementById('people-hunt-grid');
    if (!grid || grid.dataset.init) return;
    grid.dataset.init = 'true';
    
    const cards = [
        // CORRECT: People nouns (5)
        { word: 'teacher', correct: true },
        { word: 'nurse', correct: true },
        { word: 'girl', correct: true },
        { word: 'chef', correct: true },
        { word: 'firefighter', correct: true },
        // WRONG: Parts of speech (3)
        { word: 'helpful', correct: false, hint: 'adjective' },
        { word: 'quickly', correct: false, hint: 'adverb' },
        { word: 'singing', correct: false, hint: 'verb' },
        // WRONG: Other noun types (2)
        { word: 'zoo', correct: false, hint: 'place noun' },
        { word: 'elephant', correct: false, hint: 'animal noun' }
    ].sort(() => Math.random() - 0.5);
    
    let found = 0;
    const target = 5;
    
    cards.forEach(card => {
        const btn = document.createElement('button');
        btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
        btn.textContent = card.word;
        
        btn.onclick = () => {
            if (btn.dataset.clicked) return;
            btn.dataset.clicked = 'true';
            
            if (card.correct) {
                btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
                found++;
                document.getElementById('people-hunt-score').textContent = found;
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
                recordAnswer(true, `People Hunt: ${card.word}`);
                
                if (found >= target) {
                    setTimeout(() => huntGameComplete('people'), 600);
                }
            } else {
                btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
                if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
                recordAnswer(false, `People Hunt: ${card.word} (${card.hint})`);
            }
        };
        
        grid.appendChild(btn);
    });
}

/**
 * PLACES HUNT (Node N3B)
 */
function initPlacesHuntGrid() {
    const grid = document.getElementById('places-hunt-grid');
    if (!grid || grid.dataset.init) return;
    grid.dataset.init = 'true';
    
    const cards = [
        // CORRECT: Place nouns (5)
        { word: 'school', correct: true },
        { word: 'library', correct: true },
        { word: 'park', correct: true },
        { word: 'museum', correct: true },
        { word: 'beach', correct: true },
        // WRONG: Parts of speech (3)
        { word: 'above', correct: false, hint: 'preposition' },
        { word: 'spacious', correct: false, hint: 'adjective' },
        { word: 'running', correct: false, hint: 'verb' },
        // WRONG: Other noun types (2)
        { word: 'penguin', correct: false, hint: 'animal noun' },
        { word: 'builder', correct: false, hint: 'person noun' }
    ].sort(() => Math.random() - 0.5);
    
    let found = 0;
    const target = 5;
    
    cards.forEach(card => {
        const btn = document.createElement('button');
        btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
        btn.textContent = card.word;
        
        btn.onclick = () => {
            if (btn.dataset.clicked) return;
            btn.dataset.clicked = 'true';
            
            if (card.correct) {
                btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
                found++;
                document.getElementById('places-hunt-score').textContent = found;
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
                recordAnswer(true, `Places Hunt: ${card.word}`);
                
                if (found >= target) {
                    setTimeout(() => huntGameComplete('places'), 600);
                }
            } else {
                btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
                if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
                if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
                recordAnswer(false, `Places Hunt: ${card.word} (${card.hint})`);
            }
        };
        
        grid.appendChild(btn);
    });
}

/**
 * Called when a hunt game is completed - flash map button
 */
function huntGameComplete(huntType) {
    console.log(`🎉 ${huntType} Hunt Complete!`);
    
    // Play celebration
    if (typeof SoundFX !== 'undefined' && SoundFX.playChime) {
        SoundFX.playChime();
    }
    
    // Flash the map button
    if (typeof MapSystem !== 'undefined' && MapSystem.flashMapButton) {
        MapSystem.flashMapButton();
    }
    
    // Show completion overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none';
    overlay.innerHTML = `
        <div class="bg-black/90 backdrop-blur-xl px-12 py-10 rounded-3xl border border-green-500/50 shadow-[0_0_80px_rgba(34,197,94,0.5)] text-center transform scale-90 opacity-0" id="hunt-complete-box">
            <div class="text-7xl mb-4">🎉</div>
            <h3 class="text-3xl font-display text-green-400 mb-3">Hunt Complete!</h3>
            <p class="text-lg text-white/70">Press the <span class="text-brand-400 font-bold animate-pulse">Map</span> button to continue</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Animate in
    const box = document.getElementById('hunt-complete-box');
    requestAnimationFrame(() => {
        box.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        box.style.transform = 'scale(1)';
        box.style.opacity = '1';
    });
    
    // Remove after delay
    setTimeout(() => {
        box.style.transform = 'scale(0.9)';
        box.style.opacity = '0';
        setTimeout(() => overlay.remove(), 400);
    }, 3000);
}

// Initialize hunt games when slides become visible
document.addEventListener('DOMContentLoaded', () => {
    // Run initialization periodically to catch dynamically loaded slides
    setInterval(() => {
        initThingsHuntGrid();
        initPeopleHuntGrid();
        initPlacesHuntGrid();
    }, 1000);
});
```

---

## FIX 7: UPDATE mapNodes SLIDE INDICES

### Location: map.js lines 14-46

**Verify and update slide indices to match actual HTML structure:**

After all slide changes, confirm that:
- N3A (People Hunt) → slides array points to People Hunt slide index
- N3B (Places Hunt) → slides array points to Places Hunt slide index  
- N3C (Things Hunt) → slides array points to Things Hunt slide index
- N4 (Mega-Mix) → slides array points to sentence challenge slide index

**Example (indices will depend on final HTML structure):**
```javascript
// PHASE 2 (Hub A) - Branching  
"HubA": { id: "HubA", left: 21, top: 52, type: "hub", label: "Central Camp", parents: ["N2"] },
"N3A": { id: "N3A", left: 21, top: 22, label: "People Hunt", slides: [9], parents: ["HubA"], branch: "A" },
"N3B": { id: "N3B", left: 16, top: 82, label: "Places Hunt", slides: [10], parents: ["HubA"], branch: "A" },
"N3C": { id: "N3C", left: 26, top: 82, label: "Things Hunt", slides: [11], parents: ["HubA"], branch: "A" },
"N4": { id: "N4", left: 30, top: 52, label: "Mega-Mix", slides: [12], parents: ["N3A", "N3B", "N3C"] },
```

---

## IMPLEMENTATION CHECKLIST

Execute fixes in this exact order:

1. [ ] **FIX 1:** Change 'n1' to 'N1' in map.js line 59
2. [ ] **FIX 1:** Add ID migration to loadProgress()
3. [ ] **FIX 2:** Add locked node click handler in renderMap()
4. [ ] **FIX 2:** Add showLockedNodeWarning() function
5. [ ] **FIX 3:** Replace checkSlidePosition() with version that flashes map button
6. [ ] **FIX 3:** Add flashMapButton() and stopMapButtonFlash() functions
7. [ ] **FIX 3:** Add CSS for mapBtnPulse animation
8. [ ] **FIX 4:** Replace entire showLockedAlert() with soft version
9. [ ] **FIX 4:** Add CSS for shakeViewport animation
10. [ ] **FIX 5:** Add boundary enforcement to scroll listener
11. [ ] **FIX 6:** Remove game from slide 7/8 (Things & Animals)
12. [ ] **FIX 6:** Create 3 Hunt game slides in HTML
13. [ ] **FIX 6:** Add Hunt game JavaScript functions
14. [ ] **FIX 7:** Verify/update slide indices in mapNodes
15. [ ] **CLEAR localStorage** and test fresh playthrough

---

## TESTING SEQUENCE

### Test 1: Fresh Start
```
1. localStorage.clear()
2. Hard refresh (Ctrl+Shift+R)
3. Select character
4. Verify map shows with N1 unlocked
```

### Test 2: Complete N1
```
1. Click N1 → Enter slides
2. Navigate to last slide of N1
3. Map button should FLASH
4. Click map → Map opens
5. N1 shows ✅
6. N2 should now be unlocked (⚔️)
```

### Test 3: Branch Testing
```
1. Complete N2 → HubA auto-completes
2. N3A, N3B, N3C should ALL be clickable
3. Complete N3A (People Hunt) → Return to map, N4 still locked
4. Complete N3B (Places Hunt) → Return to map, N4 still locked
5. Complete N3C (Things Hunt) → Return to map, N4 UNLOCKS
```

### Test 4: Boundary Violation
```
1. On any slide, try to swipe RIGHT past boundary
2. Should see: red flash, shake, soft thud, small text
3. Should NOT see: dialog box, map icon, harsh sound
4. Should NOT be able to bypass boundary
5. Aggressive swipes should NOT stack effects
```

### Test 5: Locked Node Warning
```
1. On map, click a locked node
2. Should see: yellow warning text
3. Text should be readable (3+ seconds visible)
4. Box should be small and not cover map text
```

---

*Document version: BATCH 6 — Complete overhaul addressing all reported issues*
