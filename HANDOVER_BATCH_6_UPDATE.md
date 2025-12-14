# HANDOVER DOCUMENT: The Naming Game — Map System
## Updated December 2024 — BATCH 6 STATUS

---

## ⚠️ CRITICAL: READ FIRST

The previous batch of fixes **broke several things** and **failed to implement** others correctly. Before proceeding with any work, review these ROOT CAUSE issues:

### BLOCKING ISSUES TABLE

| # | Issue | Root Cause | Status |
|---|-------|-----------|--------|
| 1 | **Nodes never unlock** | `state.unlockedNodes` initialized with lowercase `'n1'` but mapNodes uses uppercase `'N1'` | 🔴 CRITICAL |
| 2 | **No locked node warning** | `renderMap()` has no click handler for locked nodes | 🔴 CRITICAL |
| 3 | **Map button doesn't flash** | `checkSlidePosition()` doesn't call any flash function | 🔴 CRITICAL |
| 4 | **Harsh violation sound** | `showLockedAlert()` still uses `SoundFX.playError()` and dialog box | 🟡 UX ISSUE |
| 5 | **Effects stack on swipes** | No debounce on `showLockedAlert()` | 🟡 UX ISSUE |
| 6 | **Game on wrong slide** | Interactive game is on slide 7/8, should be on Things Hunt node | 🟡 CONTENT |

### REFERENCE DOCUMENT

**Full fix instructions:** `MAP_FIXES_BATCH_6_COMPLETE.md`

---

## PROJECT CONTEXT

### What This Is
"The Naming Game" teaches KS2 students about common vs. proper nouns through:
- Interactive slide-based presentation
- World map navigation system
- Gamification (characters, health, crystals)
- Mini-games for each noun category

### Current Phase
Testing & Refinement — iterating on map ↔ slide transitions, unlock cascades, and boundary enforcement.

### Development Environment
- **IDE:** Google Antigravity (AI-powered, token-limited)
- **Approach:** "Vibe coding" with AI assistants
- **Version Control:** GitHub

---

## FILE ARCHITECTURE

```
project/
├── Draft_1_The_Naming_Game_Index.HTML   # Main application (37 slides)
├── styles.css                            # Global styles
├── js/
│   ├── core.js          # State management
│   ├── audio.js         # SoundFX system
│   ├── games.js         # Interactive challenges ← HUNT GAMES GO HERE
│   ├── gamification.js  # GameEngine, characters
│   ├── map.js           # MapSystem ← MOST FIXES GO HERE
│   ├── main.js          # Navigation, router ← BOUNDARY FIXES GO HERE
│   ├── rewards.js       # Crystal rewards
│   └── reporting.js     # Magic Link
```

---

## MAP SYSTEM ARCHITECTURE

### Node Topology (22 nodes total)

```
PHASE 1: Welcome
N1 (Village) → N2 (3 Families)

PHASE 2: Hunt Branches
N2 → HubA (Central Camp) → N3A (People Hunt)
                        → N3B (Places Hunt)  
                        → N3C (Things Hunt)
All 3 branches → N4 (Mega-Mix Boss)

PHASE 3: Common/Proper Nouns
N4 → N5 (Common) → N6 (Crown Rule) → N7 (Proper) → N8 (Briefing)

PHASE 4: Detective Branch
N8 → HubB → N9A (Evidence A)
          → N9B (Evidence B)
Both → GateB (Case Closed)

PHASE 5: Quiz Branch
GateB → HubC → N10A (Quiz 1)
            → N10B (Quiz 2)
            → N10C (Quiz 3)
All 3 → N11 (Exit Boss)

PHASE 6: Finale
N11 → N12 (Complete)
```

### Key Functions in map.js

| Function | Purpose | Line |
|----------|---------|------|
| `init()` | Setup, inject UI, load progress | 63 |
| `renderMap()` | Draw all nodes with state classes | 148 |
| `isNodeUnlocked()` | Check unlock eligibility | 286 |
| `enterNode()` | Map → Slides transition | ~640 |
| `completeNode()` | Mark done, cascade unlocks | 691 |
| `checkSlidePosition()` | Detect last slide, trigger UI | 751 |
| `loadProgress()` | Restore from localStorage | 733 |

### State Object
```javascript
state: {
    completedNodes: [],      // ['N1', 'N2', ...]
    unlockedNodes: ['N1'],   // ← MUST BE UPPERCASE
    currentNode: null        // Current active node ID
}
```

---

## CRITICAL FIX DETAILS

### FIX 1: ID Casing (map.js line 59)

**Problem:** State initialized with lowercase, mapNodes uses uppercase
```javascript
// WRONG (current)
unlockedNodes: ['n1'],

// CORRECT
unlockedNodes: ['N1'],
```

### FIX 2: Locked Node Click Handler (map.js ~line 230)

**Problem:** No click handler for locked nodes = no warning shown
```javascript
// ADD after the unlocked handler:
} else if (!isUnlocked && !isHub) {
    el.style.cursor = 'not-allowed';
    el.onclick = () => this.showLockedNodeWarning(node);
}
```

### FIX 3: Map Button Flash (map.js ~line 763)

**Problem:** `checkSlidePosition()` injects button but doesn't flash nav button
```javascript
// ADD to checkSlidePosition when on last slide:
this.flashMapButton();
```

### FIX 4: Soft Boundary Feedback (main.js ~line 541)

**Problem:** `showLockedAlert()` uses harsh dialog + stacking sounds

**Solution:** Complete rewrite with:
- Debounce flag (800ms cooldown)
- Red screen flash (like damage)
- Viewport shake animation
- Soft thud sound (Web Audio API, 12% volume)
- Small text indicator (no dialog box)

---

## HUNT GAMES SPECIFICATION

### Design Pattern
Each hunt has 10 cards:
- 5 correct nouns of that category
- 3 wrong parts of speech (adjectives, verbs, adverbs)
- 2 distractor nouns from wrong categories

### Games to Create

| Hunt | Correct Examples | Wrong PoS | Wrong Nouns |
|------|-----------------|-----------|-------------|
| People | teacher, nurse, girl, chef, firefighter | helpful, quickly, singing | zoo, elephant |
| Places | school, library, park, museum, beach | above, spacious, running | penguin, builder |
| Things | fox, eagle, bus, sandwich, parrot | quickly, beautiful, jumping | doctor, library |

### Completion Flow
1. Player finds all 5 correct cards
2. Celebration overlay appears
3. Map button flashes
4. Player clicks map → returns to Central Camp
5. When all 3 hunts done → N4 (Mega-Mix) unlocks

---

## TESTING PROTOCOL

### Pre-Test Reset
```javascript
localStorage.clear();
// Hard refresh: Ctrl+Shift+R
```

### Critical Test Sequence

1. **Node Unlock Chain**
   - Complete N1 → N2 unlocks?
   - Complete N2 → HubA auto-completes, N3A/B/C all unlock?
   - Complete all 3 hunts → N4 unlocks?

2. **Map Button Flash**
   - Reach last slide of any node → map button flashes?
   - Click map → returns to map with node completed?

3. **Boundary Enforcement**
   - Swipe past boundary → soft red flash + shake?
   - No dialog box? No harsh sound? No stacking?

4. **Locked Node Warning**
   - Click locked node → yellow warning appears?
   - Warning visible for 3+ seconds?
   - Text readable and meaningful?

---

## COMMON PITFALLS

### ⛔ DO NOT
- Use lowercase node IDs anywhere ('n1' vs 'N1')
- Assume showLockedAlert was fixed (it wasn't)
- Skip the ID migration in loadProgress()
- Forget to add click handlers for locked nodes

### ✅ MUST DO
- Clear localStorage between tests
- Verify slide indices match actual HTML after changes
- Test the ENTIRE unlock chain, not just first node
- Check that ALL 3 branch completions trigger N4 unlock

---

## IMPLEMENTATION ORDER

Execute in this sequence:

1. Fix ID casing (map.js line 59)
2. Add ID migration to loadProgress()
3. Add locked node click handler in renderMap()
4. Add showLockedNodeWarning() function
5. Add map button flash functions
6. Replace showLockedAlert() with soft version
7. Add boundary enforcement to scroll listener
8. Remove game from slide 7/8
9. Create 3 hunt game slides
10. Add hunt game JavaScript
11. Verify slide indices in mapNodes
12. Clear localStorage and test

---

## CONTACT FOR CONTEXT

This project has been developed with AI assistance across:
- **Claude (Anthropic)** — Architecture, debugging, this document
- **Gemini (Google)** — Batch implementation via Antigravity
- **ChatGPT (OpenAI)** — Diagnostic analysis

Full conversation history available in project transcripts.

---

## QUICK DIAGNOSTIC COMMANDS

```javascript
// Check current state
console.log(MapSystem.state);

// Force unlock a node
MapSystem.state.unlockedNodes.push('N2');
MapSystem.renderMap();

// Check if specific node unlocked
MapSystem.isNodeUnlocked('N4');

// Reset everything
MapSystem.resetProgress();
localStorage.clear();
location.reload();
```

---

*Document version: BATCH 6 — Updated with critical root cause analysis*
