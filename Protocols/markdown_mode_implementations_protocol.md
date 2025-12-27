# Markdown Mode Implementations Protocol
## (Blocks A, B, and C)

This protocol documents the **final, successful implementation** of the Annotation, Sticky Note, and Session Summary systems. Follow these steps to replicate the functionality without error.

---

### Block A: Annotation System (The Canvas)

#### 1. HTML Structure
Place this inside the `#viewport-frame`, above the slides but below the UI layers.
```html
<!-- ANNOTATION CANVAS OVERLAY -->
<canvas id="annotation-canvas" class="annotation-canvas"></canvas>
<div id="text-comments-layer" class="text-comments-layer"></div>
<div id="stamps-layer" class="stamps-layer"></div>
```

#### 2. CSS Styling
Ensure the canvas is clickable ONLY when active.
```css
.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 70;
  pointer-events: none; /* Default: Let clicks pass through */
  cursor: crosshair;
}

body.markup-active .annotation-canvas,
body.markup-active .text-comments-layer,
body.markup-active .stamps-layer {
  pointer-events: auto; /* Active: Capture clicks */
}
```

#### 3. JavaScript Logic (`AnnotationSystem`)
Key features:
- **Canvas Resizing:** Matches `#viewport-frame` dimensions.
- **Drawing:** Uses `ctx.lineTo` for smooth strokes.
- **State Management:** Saves/Loads from `localStorage` via `MarkupCoordinator`.

*(Refer to `Draft 19.HTML` lines 3442-3834 for the full `AnnotationSystem` object)*

---

### Block B: UI & Tools (The Toolbar)

#### 1. HTML Structure
The toolbar contains the toggle button and the tool palette.
```html
<!-- Markup Mode Toggle -->
<button id="markup-toggle-btn" onclick="toggleMarkupMode()" ...>
  <!-- Icon & Label -->
</button>

<!-- Main Toolbar (Injected or Static) -->
<div id="marking-toolbar" class="marking-toolbar" data-expanded="false">
  <!-- Toggle Handle -->
  <div class="toolbar-toggle" onclick="toggleToolbar()">...</div>
  <!-- Tools -->
  <div class="toolbar-content">
    <button class="tool-btn" data-tool="cursor" onclick="UIManager.setTool('cursor')">...</button>
    <button class="tool-btn" data-tool="pen" onclick="UIManager.setTool('pen')">...</button>
    <!-- ... other tools ... -->
  </div>
</div>
```

#### 2. CSS Styling
The toolbar sits on the right edge and slides out.
```css
.marking-toolbar {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 120;
  /* ... flex properties ... */
}

.toolbar-content {
  transform: translateX(100%); /* Hidden by default */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.marking-toolbar[data-expanded="true"] .toolbar-content {
  transform: translateX(0); /* Slide in */
}
```

#### 3. JavaScript Logic (`UIManager`)
Handles tool switching and "Cursor Trapping".
```javascript
const UIManager = {
  setTool(tool) {
    this.currentTool = tool;
    // Toggle 'markup-active' class on body to control pointer-events
    if (tool === 'cursor') {
      document.body.classList.remove('markup-active');
    } else {
      document.body.classList.add('markup-active');
    }
    // Notify AnnotationSystem
    if (typeof AnnotationSystem !== 'undefined') {
      AnnotationSystem.currentTool = tool;
    }
  }
};
```

---

### Block C: Sticky Notes & Session Summary

#### 1. The Coordinator (`MarkupCoordinator`)
**CRITICAL:** This is the Single Source of Truth. Do not save state in scattered objects.
```javascript
const MarkupCoordinator = {
  state: {
    version: 2.0,
    notes: {},       // { slideIndex: [notes] }
    annotations: {}, // { slideIndex: {strokes, stamps} }
    whiteboards: {}  // { slideIndex: html }
  },
  // ... init, save, load logic ...
};
```

#### 2. Sticky Notes System (`StickyNotesSystem`)
- **Relative Coordinates:** Stores `x, y` as percentages (0.0 - 1.0) to survive window resizing.
- **Auto-Save:** Uses `input` event with debounce to save text changes instantly.
- **DOM:** Injected into `#text-comments-layer`.

#### 3. Session Summary Generator
- **Logic:** Iterates through `MarkupCoordinator.state.notes`.
- **Display:** Creates a read-only list of notes grouped by slide.
- **HTML:** Injected into `#summary-container` on the Summary Slide.

```javascript
window.generateNotesSummary = function() {
  MarkupCoordinator.forceSave(); // Sync first
  const allNotes = MarkupCoordinator.state.notes;
  // ... loop and generate HTML ...
};
```

---

### Key Success Factors (Do Not Deviate)
1.  **Z-Index Layering:**
    - Canvas: 70
    - Sticky Notes: 72
    - Toolbar: 120
    - Whiteboard: 10000 (See Block D)
2.  **Pointer Events:**
    - Default state: `pointer-events: none` on canvas layers.
    - Active state (`markup-active` class): `pointer-events: auto`.
3.  **Data Persistence:**
    - Always use `MarkupCoordinator` to save/load.
    - Use `localStorage` key `nameGame_markup`.
