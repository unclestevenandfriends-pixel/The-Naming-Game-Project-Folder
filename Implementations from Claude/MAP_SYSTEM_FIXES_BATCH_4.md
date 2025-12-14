# MAP SYSTEM FIXES — BATCH 4
## Addressing 6 Reported Issues

**Date:** December 2024  
**Status:** Ready for Implementation  
**Priority:** HIGH — Blocking Issues

---

## ISSUE SUMMARY

| # | Issue | Severity | Fix Complexity |
|---|-------|----------|----------------|
| 1 | Locked swipe feedback is harsh/stacking | Medium | Medium |
| 2 | "Start New Game" doesn't reset map progress | Critical | Simple |
| 3 | Places Hunt node → wrong slide | Critical | Medium |
| 4 | Things/Animals slide has game that should move | Medium | Medium |
| 5 | Blank text box at bottom of map | Low | Simple |
| 6 | Mega-Mix Boss node never unlocks | Critical | Medium |

---

## ISSUE 1: Locked Swipe Feedback Is Harsh

### Problem Description
When the player tries to swipe beyond the allowed slide range:
- Multiple sound effects stack (one per scroll event)
- A dialog box with a map appears (unwelcome)
- Overall experience is "stressful and abrasive"

### Root Cause
The `showLockedAlert()` function (main.js line 541) is triggered by `nextSlide()` which is called on keyboard navigation. However, native browser scroll snap behavior fires multiple scroll events during a single swipe gesture, and there's likely a scroll interceptor calling `showLockedAlert()` multiple times.

### Solution

**Replace the current `showLockedAlert()` function with a debounced, softer version:**

```javascript
// === NAVIGATION GUARD: LOCKED ALERT (V2 - Softer Feedback) ===

// Debounce flag to prevent multiple triggers
let lockedAlertCooldown = false;

/**
 * Show a subtle "locked" feedback - red flash + shake
 * Debounced to prevent stacking from rapid swipes
 */
function showLockedAlert() {
  // DEBOUNCE: Ignore if we triggered recently
  if (lockedAlertCooldown) return;
  lockedAlertCooldown = true;
  
  // Reset cooldown after 800ms
  setTimeout(() => {
    lockedAlertCooldown = false;
  }, 800);
  
  // 1. RED FLASH (like damage feedback)
  const flashOverlay = document.createElement('div');
  flashOverlay.className = 'locked-flash-overlay';
  flashOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, rgba(239, 68, 68, 0.3), transparent 70%);
    pointer-events: none;
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.15s ease-out;
  `;
  document.body.appendChild(flashOverlay);
  
  // Trigger flash
  requestAnimationFrame(() => {
    flashOverlay.style.opacity = '1';
  });
  
  // Fade out and remove
  setTimeout(() => {
    flashOverlay.style.opacity = '0';
    setTimeout(() => flashOverlay.remove(), 150);
  }, 200);
  
  // 2. HAPTIC SHAKE (CSS animation on viewport)
  const viewport = document.getElementById('viewport-frame');
  if (viewport) {
    viewport.classList.add('shake-locked');
    setTimeout(() => {
      viewport.classList.remove('shake-locked');
    }, 400);
  }
  
  // 3. SOFT SOUND (quieter, single play)
  if (typeof SoundFX !== 'undefined') {
    // Use a softer sound at lower volume
    // If playError is too harsh, consider playPop or a custom soft "thud"
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleREPTqLp1IFSFQkzldzLYzQTGViX0K9PKyYhX5G5jT4yLy1gjqd3RDsxM1uDkVxIQjg5WXl/UUxCOz5Vc2lKTEQ+QVRoX0hNRUFCU2JZRk5GQkRSXlRFT0dDRVFeUkRQSERGUFxQRFFJRUdQWk5DUklGSE9YTENTSkdJT1dLQlRLSEpPVklCVUxJS09VSEJWTUpLTlNHQldOS0xOUkZBV05MTU5RRUBYTk1NTlBEP1lOTk5OUEQ+Wk5OTk5PQ');
      audio.volume = 0.3; // 30% volume
      audio.play().catch(() => {}); // Ignore autoplay errors
    } catch (e) {
      // Fallback: no sound rather than error
    }
  }
  
  // 4. SMALL TEXT INDICATOR (optional, non-intrusive)
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: #f87171;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.2s ease-out;
    pointer-events: none;
  `;
  indicator.textContent = '🔒 Complete current zone first';
  document.body.appendChild(indicator);
  
  requestAnimationFrame(() => {
    indicator.style.opacity = '1';
  });
  
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 200);
  }, 1200);
}
```

**Add this CSS for the shake animation (in styles.css):**

```css
/* Locked navigation shake effect */
@keyframes shake-locked {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake-locked {
  animation: shake-locked 0.4s ease-in-out;
}

/* Red flash overlay (added via JS) */
.locked-flash-overlay {
  animation: flash-fade 0.35s ease-out forwards;
}

@keyframes flash-fade {
  0% { opacity: 0; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}
```

### Files to Modify
- `main.js`: Replace `showLockedAlert()` function (around line 541)
- `styles.css`: Add shake animation CSS

---

## ISSUE 2: "Start New Game" Doesn't Reset Map Progress

### Problem Description
Refreshing the browser and selecting "Start New Game" allows character/name selection, but the map progress (completed nodes, unlocked nodes) persists from the previous session.

### Root Cause
The `startNewClass()` function (main.js line 307-317) clears several localStorage keys but **MISSES `map_data`** which is where MapSystem stores progress.

**Current code (main.js lines 307-317):**
```javascript
function startNewClass() {
  if (confirm("Are you sure? This will delete all progress.")) {
    localStorage.removeItem('nameGame_data');
    localStorage.removeItem('nameGame_slide');
    localStorage.removeItem('nameGame_character');
    // ... other items
    // ❌ MISSING: localStorage.removeItem('map_data');
    location.reload();
  }
}
```

### Solution

**Update `startNewClass()` to include map data reset:**

```javascript
// === START NEW CLASS ===
function startNewClass() {
  if (confirm("Are you sure? This will delete all progress.")) {
    // Clear all game data
    localStorage.removeItem('nameGame_data');
    localStorage.removeItem('nameGame_slide');
    localStorage.removeItem('nameGame_character');
    
    // ✅ ADD THIS LINE: Clear map progress
    localStorage.removeItem('map_data');
    
    // Clear markup data
    if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.clearAll();
    localStorage.removeItem('stickyNotes');
    localStorage.removeItem('annotations');
    
    // Also reset MapSystem if it exists (in case page doesn't reload fully)
    if (typeof MapSystem !== 'undefined') {
      MapSystem.resetProgress();
    }
    
    location.reload();
  }
}
```

### Files to Modify
- `main.js`: Add `localStorage.removeItem('map_data');` inside `startNewClass()` (around line 311)

---

## ISSUE 3: Places Hunt Node → Wrong Slide

### Problem Description
The "Places Hunt" node (N3B) currently navigates to the "Find the Nouns in Sentence" slide (the sentence challenge), but this is incorrect.

**Current (Wrong):**
- N3B (Places Hunt) → Sentence challenge slide
- This slide should be on Mega-Mix Boss (N4)

**Required:**
- N3B (Places Hunt) → NEW placeholder challenge slide (like People Hunt and Things Hunt have)
- N4 (Mega-Mix Boss) → Sentence challenge slide

### Root Cause
The `mapNodes` object in map.js has incorrect slide index for N3B, and N4's slides array is missing the sentence challenge.

### Solution

**Step 1: Identify current slide assignments in map.js:**

Look at mapNodes (around line 14-46):
```javascript
"N3A": { id: "N3A", left: 21, top: 22, label: "People", slides: [9], ... },
"N3B": { id: "N3B", left: 16, top: 82, label: "Places", slides: [10], ... },  // ❌ This is wrong
"N3C": { id: "N3C", left: 26, top: 82, label: "Things", slides: [11], ... },
"N4":  { id: "N4",  left: 30, top: 52, label: "Mega-Mix", slides: [12], ... }, // ❌ Should have sentence challenge
```

**Step 2: Create a new placeholder slide for Places Hunt**

In the HTML, after the People Hunt placeholder and Things Hunt placeholder, insert a new Places Hunt placeholder:

```html
<!-- Slide [NEW]: Places Hunt Placeholder (Node N3B) -->
<section class="slide" id="slide-places-hunt">
  <div class="slide-content flex flex-col items-center justify-center h-full max-w-4xl mx-auto p-8">
    <div class="glass-panel p-12 rounded-[2rem] text-center w-full">
      <div class="text-6xl mb-6">🏠</div>
      <h1 class="text-4xl font-display text-brand-400 mb-4">Places Hunt</h1>
      <p class="text-xl text-white/80 mb-8">
        Can you spot all the <span class="text-brand-400 font-bold">place nouns</span>?
      </p>
      <div class="bg-white/5 rounded-xl p-6 border border-white/10">
        <p class="text-white/60 text-lg">
          🎮 Challenge coming soon!<br>
          <span class="text-sm">Click the Map button to continue</span>
        </p>
      </div>
    </div>
  </div>
</section>
```

**Step 3: Update slide indices in mapNodes**

After inserting the new slide, update the indices:

```javascript
mapNodes: {
    // ... earlier nodes ...
    
    "N3A": { id: "N3A", left: 21, top: 22, label: "People", slides: [9], parents: ["HubA"], branch: "A" },
    "N3B": { id: "N3B", left: 16, top: 82, label: "Places", slides: [10], parents: ["HubA"], branch: "A" },  // ✅ Now points to placeholder
    "N3C": { id: "N3C", left: 26, top: 82, label: "Things", slides: [11], parents: ["HubA"], branch: "A" },
    "N4":  { id: "N4",  left: 30, top: 52, label: "Mega-Mix", slides: [12], parents: ["N3A", "N3B", "N3C"] }, // ✅ Points to sentence challenge
    
    // ... rest of nodes - INCREMENT ALL SUBSEQUENT SLIDE INDICES BY 1 IF NEEDED ...
}
```

**⚠️ IMPORTANT:** The exact slide numbers depend on the current HTML structure. You need to:
1. Find the current position of the "Find Nouns in Sentence" slide
2. Create the new Places Hunt placeholder BEFORE it
3. Assign the new placeholder to N3B
4. Assign the sentence challenge to N4
5. Update all subsequent slide indices

### Files to Modify
- `Draft_1_The_Naming_Game_Index.HTML`: Insert new Places Hunt placeholder slide
- `map.js`: Update `mapNodes` slide assignments for N3B and N4

---

## ISSUE 4: Things/Animals Slide Has Game That Should Move

### Problem Description
The last slide in the "Three Noun Families" node (slide 8, Things & Animals) currently contains an interactive game where players click on Things/Animals noun cards.

**Required changes:**
1. Remove the interactive game from slide 8 (Three Noun Families - Things & Animals)
2. Make slide 8 an infographic (matching slides 6 and 7 for People and Places)
3. The game content should be on the Things & Animals Hunt node (N3C) placeholder

### Solution

**Step 1: Convert Slide 8 to Infographic-Only**

In the HTML, find slide 8 (Things & Animals in Three Noun Families) and:
- Remove any interactive game elements (click handlers, score tracking)
- Keep only the infographic content (examples of Things & Animals nouns)
- Match the layout/style of slides 6 (People) and 7 (Places)

**Step 2: Move Game to Things Hunt Placeholder (N3C)**

The Things Hunt placeholder slide should contain the actual game where players identify Things & Animals nouns.

**Note:** This may already be partially done if the Things Hunt placeholder exists. The key is ensuring:
- Slide 8 = Infographic only (no interactivity)
- N3C's slide = Contains the clickable game

### Files to Modify
- `Draft_1_The_Naming_Game_Index.HTML`: Modify slide 8 to remove interactivity
- `games.js`: Ensure game initialization only targets the correct slide (N3C's slide, not slide 8)

---

## ISSUE 5: Blank Text Box at Bottom of Map

### Problem Description
A blank text/dialog box appears at the bottom of the map view. It:
- Is always empty (no content)
- Covers up important text the player should see
- Is too large and poorly positioned

### Root Cause
This is likely the Zone Legend element in the injected map UI (map.js lines 99-107):

```javascript
<!-- Zone Legend -->
<div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
    <div class="flex justify-center gap-4 flex-wrap">
        <span class="flex items-center gap-2 text-xs text-white/70"><span class="w-3 h-3 rounded-full bg-green-600"></span> Village</span>
        <!-- ... more zone labels ... -->
    </div>
</div>
```

If the zone spans are not rendering text, or if there's another element, it would appear as a blank box.

### Solution

**Option A: Fix the Legend (if content should show)**

Check that the legend HTML is correctly formed and the zone names are displaying.

**Option B: Remove/Hide the Legend (if not needed)**

If the legend isn't useful, remove it from `injectMapUI()`:

```javascript
// In map.js, injectMapUI() function, REMOVE or COMMENT OUT:
/*
<!-- Zone Legend -->
<div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
    ...
</div>
*/
```

**Option C: Reposition and Resize (if keeping it)**

```javascript
// Change from:
<div class="absolute bottom-0 left-0 w-full p-4 ...">

// To (moved up 1cm ≈ 40px, made smaller):
<div class="absolute bottom-10 left-1/2 -translate-x-1/2 w-auto px-6 py-2 rounded-full ...">
```

### Files to Modify
- `map.js`: Modify or remove the Zone Legend in `injectMapUI()` (around line 99-107)

---

## ISSUE 6: Mega-Mix Boss Node Never Unlocks (CRITICAL)

### Problem Description
After completing all three branch nodes (N3A People Hunt, N3B Places Hunt, N3C Things Hunt), the Mega-Mix Boss (N4) lock animation should disappear and the node should become clickable. Currently, N4 never unlocks.

### Root Cause Analysis

The unlock logic is in `isNodeUnlocked()` (map.js lines 286-337). For N4 to unlock:

```javascript
// N4's definition:
"N4": { id: "N4", ..., parents: ["N3A", "N3B", "N3C"] }

// Unlock check (line 327-331):
if (node.parents.length > 1) {
    return node.parents.every(parentId =>
        this.state.completedNodes.includes(parentId)
    );
}
```

**Possible causes:**
1. **ID casing mismatch** — If `completedNodes` stores lowercase ('n3a') but mapNodes uses uppercase ('N3A')
2. **Branch not marking complete** — The branch nodes may not be properly added to `completedNodes`
3. **completeNode() not triggering unlock check** — The cascade might not be running

### Solution

**Step 1: Add Debug Logging**

Temporarily add logging to identify the issue:

```javascript
// In isNodeUnlocked(), add logging:
isNodeUnlocked(nodeId) {
    console.log(`🔍 Checking unlock for ${nodeId}`);
    console.log(`   completedNodes:`, this.state.completedNodes);
    console.log(`   unlockedNodes:`, this.state.unlockedNodes);
    
    // ... rest of function
    
    // Before returning for multi-parent nodes:
    if (node.parents.length > 1) {
        const allDone = node.parents.every(parentId => {
            const done = this.state.completedNodes.includes(parentId);
            console.log(`   Parent ${parentId} complete: ${done}`);
            return done;
        });
        console.log(`   All parents done: ${allDone}`);
        return allDone;
    }
}
```

**Step 2: Ensure completeNode() Properly Cascades**

In `completeNode()` (around line 691), verify the unlock cascade:

```javascript
completeNode(nodeId) {
    console.log(`✅ Completing node: ${nodeId}`);
    
    if (!this.state.completedNodes.includes(nodeId)) {
        this.state.completedNodes.push(nodeId);
        console.log(`   Added to completedNodes:`, this.state.completedNodes);
    }
    
    // Check unlocks for ALL nodes
    Object.values(this.mapNodes).forEach(node => {
        if (!this.state.unlockedNodes.includes(node.id)) {
            const shouldUnlock = this.isNodeUnlocked(node.id);
            console.log(`   Checking ${node.id}: shouldUnlock=${shouldUnlock}`);
            
            if (shouldUnlock) {
                this.state.unlockedNodes.push(node.id);
                console.log(`   🔓 Unlocked: ${node.id}`);
            }
        }
    });
    
    this.saveProgress();
    this.renderMap();
}
```

**Step 3: Ensure ID Consistency**

Verify that when completing N3A/N3B/N3C, the exact string 'N3A', 'N3B', 'N3C' is pushed to `completedNodes` (uppercase, matching mapNodes keys).

Check the `enterNode()` function to see what value is used for currentNode:
```javascript
// When entering a node:
this.state.currentNode = nodeId; // Must be 'N3A', not 'n3a'
```

**Step 4: Special Case for Hub Auto-Complete**

The hub nodes (HubA) might need to auto-complete when reached:

```javascript
// In completeNode(), after a branch node is completed:
completeNode(nodeId) {
    // ... existing code ...
    
    // AUTO-COMPLETE HUBS: If all children of a hub are complete, mark hub complete
    const completedNode = this.mapNodes[nodeId];
    if (completedNode && completedNode.branch) {
        // This is a branch node - check if all siblings are complete
        const siblingNodes = Object.values(this.mapNodes).filter(n => 
            n.branch === completedNode.branch && 
            n.parents.some(p => completedNode.parents.includes(p))
        );
        
        const allSiblingsComplete = siblingNodes.every(s => 
            this.state.completedNodes.includes(s.id)
        );
        
        if (allSiblingsComplete) {
            // Find the parent hub and mark it complete
            completedNode.parents.forEach(parentId => {
                const parent = this.mapNodes[parentId];
                if (parent && parent.type === 'hub' && !this.state.completedNodes.includes(parentId)) {
                    console.log(`   🏛️ Auto-completing hub: ${parentId}`);
                    this.state.completedNodes.push(parentId);
                }
            });
        }
    }
    
    // Now check unlocks...
}
```

### Files to Modify
- `map.js`: Debug and fix `isNodeUnlocked()` and `completeNode()` functions

---

## IMPLEMENTATION ORDER

Execute fixes in this order to avoid cascading issues:

| Order | Issue | Reason |
|-------|-------|--------|
| 1 | Issue 2 (Start New Game reset) | Simple fix, prevents confusion during testing |
| 2 | Issue 6 (Mega-Mix unlock) | Critical blocker, needs debugging first |
| 3 | Issue 3 (Places Hunt slide) | Depends on understanding slide structure |
| 4 | Issue 4 (Things slide infographic) | Related to Issue 3 |
| 5 | Issue 1 (Soft locked feedback) | Polish, can wait |
| 6 | Issue 5 (Blank text box) | Minor UI issue |

---

## TESTING CHECKLIST

After implementing all fixes:

- [ ] Start New Game completely resets progress
- [ ] N3A (People Hunt) → Correct placeholder slide
- [ ] N3B (Places Hunt) → NEW placeholder slide
- [ ] N3C (Things Hunt) → Correct placeholder slide (with game)
- [ ] Slide 8 (Three Noun Families - Things) → Infographic only
- [ ] Complete N3A → N3A marked complete, N4 still locked
- [ ] Complete N3B → N3B marked complete, N4 still locked
- [ ] Complete N3C → N3C marked complete, N4 UNLOCKS
- [ ] N4 (Mega-Mix) → Sentence challenge slide
- [ ] Swipe beyond limit → Soft red flash, single sound, no dialog
- [ ] Map view → No blank box at bottom (or properly positioned legend)
- [ ] Continue testing through HubB and HubC branches

---

## APPENDIX: Quick Reference — Current Node Structure

```
NODE    SLIDE(S)    CONTENT EXPECTED
────────────────────────────────────────────
N1      1-4         Introduction slides
N2      5-8         Three Noun Families (People, Places, Things infographics)
HubA    —           Branch point (no slides)
N3A     9           People Hunt (placeholder → game)
N3B     10          Places Hunt (NEW placeholder → game)
N3C     11          Things Hunt (placeholder → game with cards)
N4      12          Mega-Mix Boss (sentence challenge)
N5      13-17       Common Nouns
N6      18-21       Crown Rule
N7      22-27       Proper Categories
N8      28          Case Briefing
HubB    —           Branch point (no slides)
N9A     29          Evidence A: Locations
N9B     30          Evidence B: People & Dates
GateB   —           Lock gate (no slides)
HubC    —           Branch point (no slides)
N10A    31          Quiz 1: People
N10B    32          Quiz 2: Places
N10C    33          Quiz 3: Days & Dates
N11     34          Exit Ticket Boss
N12     35-36       Mission Complete + Session Notes
```

---

*Document prepared for Antigravity implementation. Apply fixes incrementally and test after each.*
