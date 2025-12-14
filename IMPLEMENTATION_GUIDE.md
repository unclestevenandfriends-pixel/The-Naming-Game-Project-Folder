# Map System v4.0 - Implementation Guide

## Overview

This is a complete rewrite of the map navigation system that properly implements the **Node Completion Loop** pattern you described. The key improvements are:

1. **Context-aware Map Button** - Knows when it's being clicked from an exit slide (completion) vs just viewing
2. **Proper swipe blocking** - Prevents forward navigation on exit slides
3. **Lock unlock animations** - Visual and audio feedback when nodes unlock
4. **Hub return pattern** - Branch nodes return to their hub after completion
5. **Gate requirements** - All siblings must be complete before gate opens

---

## Files to Replace/Add

### 1. Replace `map.js`
Replace your existing `map.js` with the new version. This contains:
- Complete node definitions with proper types (`linear`, `hub`, `branch`, `gate`)
- `exitSlide` property on each node (the slide where Map button triggers completion)
- `handleMapButtonClick()` that detects context
- `triggerNodeCompletion()` that runs the unlock sequence
- `handleBranchReturn()` for hub-and-spoke patterns
- Lock unlock animations

### 2. Add `navigation_guards.js`
This is a NEW file that must be loaded AFTER `map.js` but BEFORE `main.js`. Add this script tag to your HTML:

```html
<!-- Load order: core.js → audio.js → map.js → navigation_guards.js → main.js -->
<script src="navigation_guards.js"></script>
```

This file:
- Blocks touch/swipe forward on exit slides
- Blocks wheel scrolling forward on exit slides
- Blocks keyboard navigation forward on exit slides
- Snaps the slider back if someone manages to scroll past allowed area
- Shows the "Click the Map Button!" notification

### 3. Add CSS to `styles.css`
Append the contents of `map_styles.css` to your existing `styles.css`. This adds:
- Map button flash animation
- Node pulse/glow animations
- Lock unlock animation
- Token floating animation

---

## How It Works Now

### The Node Completion Loop

```
1. Player is on slides within a node (e.g., slides 1-5 for N1)
2. They can swipe freely between slides 1, 2, 3, 4, 5
3. When they reach slide 5 (the exitSlide), swipe RIGHT is BLOCKED
4. The Map button turns GREEN and starts FLASHING
5. The button text changes to "Continue →"
6. Player clicks the Map button
7. Map appears, token is on current node (N1)
8. Lock on next node (N2) animates open with sound
9. Instruction banner shows "Three Noun Families unlocked!"
10. Player clicks the now-unlocked N2 node
11. Token animates from N1 to N2 (2 second glide)
12. Map fades out
13. Player lands on slide 6 (first slide of N2)
14. REPEAT
```

### Hub-and-Spoke Pattern (Central Hub Camp)

```
1. Player completes N2 → returns to map
2. Token auto-animates to HubA (Central Hub Camp)
3. N3A, N3B, N3C all unlock simultaneously with animations
4. Instruction: "Choose your path!"
5. Player clicks N3A (People Hunt) → token animates → enters slide 9
6. Completes slide 9 → Map button flashes
7. Player clicks Map button
8. Token animates BACK TO HubA (not forward!)
9. Instruction: "2 challenges remaining. Pick your next path!"
10. Player clicks N3B → completes → returns to hub
11. Player clicks N3C → completes → returns to hub
12. NOW N4 (Mega-Mix Boss) unlocks
13. Player can proceed
```

---

## Node-to-Slide Mapping (Current)

| Node | Label | Slides | Exit Slide | Type |
|------|-------|--------|------------|------|
| N1 | The Village | 1-5 | 5 | linear |
| N2 | Three Noun Families | 6-8 | 8 | linear |
| HubA | Central Hub Camp | (none) | - | hub |
| N3A | People Hunt | 9 | 9 | branch |
| N3B | Places Hunt | 10 | 10 | branch |
| N3C | Things Hunt | 11 | 11 | branch |
| N4 | Mega-Mix Boss | 12 | 12 | gate |
| N5 | Common Nouns | 13-17 | 17 | linear |
| N6 | Crown Rule | 18-21 | 21 | linear |
| N7 | Proper Categories | 22-27 | 27 | linear |
| N8 | Case Briefing | 28 | 28 | linear |
| HubB | Detective's Hub | (none) | - | hub |
| N9A | Evidence A | 29 | 29 | branch |
| N9B | Evidence B | 30 | 30 | branch |
| GateB | Case Closed | (none) | - | gate |
| HubC | Trial Hub | (none) | - | hub |
| N10A | Quiz 1 | 31 | 31 | branch |
| N10B | Quiz 2 | 32 | 32 | branch |
| N10C | Quiz 3 | 33 | 33 | branch |
| N11 | Exit Ticket Boss | 34 | 34 | gate |
| N12 | Mission Complete | 35-36 | 36 | linear |

---

## Important Notes

### Slide Numbering
If your slide indices have shifted, you'll need to update the `slides` and `exitSlide` arrays in each node definition in `map.js`. The current mapping assumes:
- Slide 0 = Hero slide (The Naming Game title)
- Slide 1-5 = Phase 1 (The Awakening)
- etc.

### LocalStorage Key
The new system uses `naming_game_map_v4` as the localStorage key. This is different from the old key (`naming_game_map_v2`), so it won't conflict with old saved data. You may want to clear localStorage during testing:

```javascript
localStorage.removeItem('naming_game_map_v4');
localStorage.clear(); // Nuclear option
```

### Testing Checklist
1. [ ] Clear localStorage
2. [ ] Load page → Character select appears
3. [ ] Select character, enter name → Land on slide 0 (hero)
4. [ ] "Start Journey" button visible
5. [ ] Try to swipe right → BLOCKED
6. [ ] Click "Start Journey" → Map appears, token drops to N1
7. [ ] Click N1 (The Village) → Land on slide 1
8. [ ] Swipe through slides 1-5
9. [ ] On slide 5, try to swipe right → BLOCKED
10. [ ] Map button is GREEN and FLASHING, says "Continue →"
11. [ ] Click Map button → Map appears
12. [ ] Lock on N2 animates open
13. [ ] Click N2 → Token animates → Land on slide 6
14. [ ] Continue testing through the hub patterns...

---

## Debugging

### Console Logs
The system logs key events:
- `🗺️ MapSystem v4.0 Initializing...`
- `🎯 Completing node: N1 (The Village)`
- `🛡️ NavigationGuard v2.0 Initialized`
- `🛡️ Snapping back from slide X to Y`

### Manual Testing Commands
```javascript
// Check current state
console.log(MapSystem.state);

// Check if a node is unlocked
MapSystem.isNodeUnlocked('N2');

// Force unlock a node (for testing)
MapSystem.state.unlockedNodes.push('N5');
MapSystem.renderMap();

// Reset everything
MapSystem.resetProgress();
location.reload();
```

---

## What's NOT in This Update

1. **Actual game content for the Hunt slides** - These still need to be created
2. **Slide content adjustments** - The game on slide 8 still needs to be moved
3. **New slides for People Hunt and Places Hunt** - These may need to be added to the HTML

These are content changes that need to be done in the HTML file, separate from the navigation logic.
