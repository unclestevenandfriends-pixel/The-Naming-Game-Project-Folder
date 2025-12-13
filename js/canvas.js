// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS.JS - Markup & Annotation Systems
// Contains: UIManager, AnnotationSystem, StickyNotesSystem, VoiceSystem
// Depends on: core.js (MarkupCoordinator, SPAGSystem)
// ═══════════════════════════════════════════════════════════════════════════════

// --- MARKING TOOLBAR TOGGLE ---
function toggleToolbar() {
  const toolbar = document.getElementById('marking-toolbar');
  const isExpanded = toolbar.getAttribute('data-expanded') === 'true';
  toolbar.setAttribute('data-expanded', !isExpanded);
}
window.toggleToolbar = toggleToolbar;

// === UI MANAGER (Handling Tools, Cursor Safety & Stamps) ===
const UIManager = {
  currentTool: 'cursor',
  activeStamp: { char: '✓', color: '#22c55e' }, // Default Green Tick

  // 1. Core Tool Switcher
  setTool(tool) {
    this.currentTool = tool;

    // Update Button Visuals
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

    // Close Stamp Palette if moving away from stamps
    if (tool !== 'stamp') {
      document.getElementById('stamp-palette').classList.remove('active');
    }

    // Pass info to AnnotationSystem (if it needs it)
    if (typeof AnnotationSystem !== 'undefined') {
      AnnotationSystem.currentTool = tool;

      // FAILSAFE: Ensure init called if canvas is missing context
      if (!AnnotationSystem.ctx && tool !== 'cursor') {
        console.warn("AnnotationSystem not initialized. Forcing init.");
        AnnotationSystem.init();
      }
    }

    // CRITICAL: Manage "Trapped Cursor" via CSS classes
    if (tool === 'cursor') {
      document.body.classList.remove('markup-active'); // Let clicks pass through to slides
    } else {
      document.body.classList.add('markup-active'); // Block slides, enable canvas
    }
  },

  // 2. Stamp Logic
  toggleStampPalette() {
    const palette = document.getElementById('stamp-palette');
    const isActive = palette.classList.contains('active');

    if (isActive) {
      palette.classList.remove('active');
    } else {
      palette.classList.add('active');
      this.setTool('stamp'); // Ensure tool is active
    }
  },

  // Called by the stamp buttons in HTML
  selectStamp(char, color) {
    this.activeStamp = { char, color };

    // Hide palette after selection for cleaner UX
    document.getElementById('stamp-palette').classList.remove('active');

    // Ensure tool is active
    this.setTool('stamp');
  }
};
window.UIManager = UIManager;

// Global helper for HTML onclicks
window.setStamp = (char, color) => UIManager.selectStamp(char, color);

// 3. Escape Key "Panic Button"
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    UIManager.setTool('cursor');
    // Also close any open modals/palettes
    document.getElementById('stamp-palette').classList.remove('active');
    document.getElementById('marking-toolbar').setAttribute('data-expanded', 'false');
  }
});

// 4. Background Click to Reset Focus & Cursor
document.addEventListener('click', (e) => {
  // If clicking on the slide background (and not an interactive element)
  const isBackground = e.target.classList.contains('slide') ||
    e.target.classList.contains('slide-content') ||
    e.target.id === 'viewport-frame';

  // Also check if we are NOT clicking on a button, input, textarea, or tool UI
  const isInteractive = e.target.closest('button, input, textarea, [contenteditable="true"], .glass-panel, .interactive-word, #marking-toolbar, #stamp-palette, .sticky-note');

  if (!isInteractive) {
    // Blur any active input
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      document.activeElement.blur();
    }

    // Reset cursor if it's a crosshair (Sticky Note / Stamp mode)
    // But only if we are not currently drawing
    // STAMP FIX: Do not auto-reset stamp tool (Sticky Stamp)
    if (UIManager.currentTool !== 'cursor' && UIManager.currentTool !== 'stamp' && !AnnotationSystem.isDrawing) {
      UIManager.setTool('cursor');
    }
  }
});

// === ANNOTATION SYSTEM ===
// REFACTORED: Now uses MarkupCoordinator.state.annotations as SINGLE SOURCE OF TRUTH
const AnnotationSystem = {
  canvas: null,
  ctx: null,
  currentTool: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,

  // Tool settings
  penColor: '#FF0000',
  penThickness: 3,
  highlighterColor: 'rgba(255, 255, 0, 0.3)',

  // Storage (Transient Undo/Redo only)
  undoStacks: {}, // slideIndex: []
  redoStacks: {}, // slideIndex: []

  init() {
    this.canvas = document.getElementById('annotation-canvas');
    if (!this.canvas) {
      console.warn("Annotation canvas not found");
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    this.setupEventListeners();

    // Initial Redraw (loads from Coordinator)
    this.redrawCurrentSlide();

    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    const viewport = document.getElementById('viewport-frame');
    if (!viewport || !this.canvas) return;
    this.canvas.width = viewport.clientWidth;
    this.canvas.height = viewport.clientHeight;
    this.redrawCurrentSlide();
  },

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleEnd());
    this.canvas.addEventListener('mouseleave', () => this.handleEnd());

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleMove(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', () => this.handleEnd());
  },

  handleStart(e) {
    // If tool is Cursor, do nothing (let click pass through to slide)
    if (this.currentTool === 'cursor' || !this.currentTool) return;

    // STAMP LOGIC
    if (this.currentTool === 'stamp') {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Use the SELECTED stamp, not random
      const stampData = UIManager.activeStamp;
      this.addStamp(x, y, stampData.char, stampData.color);
      return;
    }

    if (this.currentTool !== 'pen' && this.currentTool !== 'highlighter') return;

    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;

    this.saveState();
  },

  handleMove(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.drawStroke(this.lastX, this.lastY, x, y);
    this.saveStroke(this.lastX, this.lastY, x, y);

    this.lastX = x;
    this.lastY = y;
  },

  handleEnd() {
    if (this.isDrawing) {
      this.isDrawing = false;
      MarkupCoordinator.forceSave(); // Persist changes
    }
  },

  drawStroke(x1, y1, x2, y2) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);

    if (this.currentTool === 'pen') {
      this.ctx.strokeStyle = this.penColor;
      this.ctx.lineWidth = this.penThickness;
      this.ctx.globalAlpha = 1;
    } else if (this.currentTool === 'highlighter') {
      this.ctx.strokeStyle = this.highlighterColor;
      this.ctx.lineWidth = 20;
      this.ctx.globalAlpha = 0.3;
    }

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  },

  saveStroke(x1, y1, x2, y2) {
    const slideIndex = this.getCurrentSlideIndex();

    // Ensure structure exists in MarkupCoordinator
    if (!MarkupCoordinator.state.annotations[slideIndex]) {
      MarkupCoordinator.state.annotations[slideIndex] = { strokes: [], comments: [], stamps: [] };
    }

    MarkupCoordinator.state.annotations[slideIndex].strokes.push({
      tool: this.currentTool,
      x1, y1, x2, y2,
      color: this.currentTool === 'pen' ? this.penColor : this.highlighterColor,
      thickness: this.currentTool === 'pen' ? this.penThickness : 20
    });
  },

  setTool(tool) {
    this.currentTool = tool;

    // Update canvas state
    if (tool === 'pen' || tool === 'highlighter') {
      this.canvas.classList.add('active');
    } else {
      this.canvas.classList.remove('active');
    }

    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
  },

  setPenColor(color) {
    this.penColor = color;
  },

  setPenThickness(thickness) {
    this.penThickness = thickness;
  },

  setHighlighterColor(color) {
    this.highlighterColor = color;
  },

  addTextComment(x, y) {
    const slideIndex = this.getCurrentSlideIndex();
    if (!MarkupCoordinator.state.annotations[slideIndex]) {
      MarkupCoordinator.state.annotations[slideIndex] = { strokes: [], comments: [], stamps: [] };
    }

    const comment = {
      id: Date.now(),
      x, y,
      text: ''
    };

    MarkupCoordinator.state.annotations[slideIndex].comments.push(comment);
    this.renderTextComment(comment);
    this.saveState();
    MarkupCoordinator.forceSave();
  },

  renderTextComment(comment) {
    const layer = document.getElementById('text-comments-layer');
    const div = document.createElement('div');
    div.className = 'text-comment';
    div.style.left = comment.x + 'px';
    div.style.top = comment.y + 'px';
    div.dataset.id = comment.id;

    const textarea = document.createElement('textarea');
    textarea.value = comment.text;
    textarea.placeholder = 'Type your comment...';
    textarea.addEventListener('input', (e) => {
      comment.text = e.target.value;
      MarkupCoordinator.scheduleSave(); // Use central saver
    });

    div.appendChild(textarea);
    layer.appendChild(div);

    textarea.focus();
  },

  addStamp(x, y, char, color) {
    const slideIndex = this.getCurrentSlideIndex();

    // Ensure storage exists (Coordinator pattern)
    if (!MarkupCoordinator.state.annotations[slideIndex]) {
      MarkupCoordinator.state.annotations[slideIndex] = { strokes: [], stamps: [] };
    }

    // Create Data Object
    const stampObj = {
      id: Date.now(),
      x: x / this.canvas.width,  // Relative X
      y: y / this.canvas.height, // Relative Y
      char: char,
      color: color
    };

    MarkupCoordinator.state.annotations[slideIndex].stamps.push(stampObj);
    this.renderStamp(stampObj);
    MarkupCoordinator.forceSave();

    // Play Sound
    if (typeof SoundFX !== 'undefined') SoundFX.playStamp(char);
  },

  renderStamp(stampObj) {
    const layer = document.getElementById('stamps-layer');
    const div = document.createElement('div');
    div.className = 'stamp';
    div.innerText = stampObj.char;
    div.style.color = stampObj.color || '#FFF';

    // Convert Relative to Absolute for display
    const absX = stampObj.x * this.canvas.width;
    const absY = stampObj.y * this.canvas.height;

    div.style.left = absX + 'px';
    div.style.top = absY + 'px';
    div.dataset.id = stampObj.id;

    // Animation
    div.style.transform = 'translate(-50%, -50%) scale(0)';
    setTimeout(() => {
      div.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    // Click to remove
    div.addEventListener('click', (e) => {
      e.stopPropagation();

      if (this.currentTool === 'cursor' || this.currentTool === 'clear' || confirm('Remove this stamp?')) {
        const slideIndex = this.getCurrentSlideIndex();
        if (MarkupCoordinator.state.annotations[slideIndex]) {
          MarkupCoordinator.state.annotations[slideIndex].stamps =
            MarkupCoordinator.state.annotations[slideIndex].stamps.filter(s => s.id !== stampObj.id);
          MarkupCoordinator.forceSave();
        }
        div.remove();
      }
    });

    layer.appendChild(div);
  },

  undo() {
    const slideIndex = this.getCurrentSlideIndex();
    if (!this.undoStacks[slideIndex] || this.undoStacks[slideIndex].length === 0) return;

    if (!this.redoStacks[slideIndex]) this.redoStacks[slideIndex] = [];
    // Deep copy current state from Coordinator
    this.redoStacks[slideIndex].push(JSON.parse(JSON.stringify(MarkupCoordinator.state.annotations[slideIndex] || { strokes: [], comments: [], stamps: [] })));

    const previousState = this.undoStacks[slideIndex].pop();
    MarkupCoordinator.state.annotations[slideIndex] = previousState;

    this.redrawCurrentSlide();
    MarkupCoordinator.forceSave();
  },

  redo() {
    const slideIndex = this.getCurrentSlideIndex();
    if (!this.redoStacks[slideIndex] || this.redoStacks[slideIndex].length === 0) return;

    if (!this.undoStacks[slideIndex]) this.undoStacks[slideIndex] = [];
    this.undoStacks[slideIndex].push(JSON.parse(JSON.stringify(MarkupCoordinator.state.annotations[slideIndex] || { strokes: [], comments: [], stamps: [] })));

    const nextState = this.redoStacks[slideIndex].pop();
    MarkupCoordinator.state.annotations[slideIndex] = nextState;

    this.redrawCurrentSlide();
    MarkupCoordinator.forceSave();
  },

  saveState() {
    const slideIndex = this.getCurrentSlideIndex();
    if (!this.undoStacks[slideIndex]) this.undoStacks[slideIndex] = [];

    const currentState = JSON.parse(JSON.stringify(MarkupCoordinator.state.annotations[slideIndex] || { strokes: [], comments: [], stamps: [] }));
    this.undoStacks[slideIndex].push(currentState);

    this.redoStacks[slideIndex] = [];

    if (this.undoStacks[slideIndex].length > 50) {
      this.undoStacks[slideIndex].shift();
    }
  },

  clearCurrentSlide() {
    const slideIndex = this.getCurrentSlideIndex();
    this.saveState();
    MarkupCoordinator.state.annotations[slideIndex] = { strokes: [], comments: [], stamps: [] };
    this.redrawCurrentSlide();
    MarkupCoordinator.forceSave();
  },

  redrawCurrentSlide() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear DOM layers
    const commentsLayer = document.getElementById('text-comments-layer');
    const stampsLayer = document.getElementById('stamps-layer');
    if (commentsLayer) commentsLayer.innerHTML = '';
    if (stampsLayer) stampsLayer.innerHTML = '';

    const slideIndex = this.getCurrentSlideIndex();

    // READ FROM COORDINATOR (Unified Mode)
    // Fallback to empty object if no data
    const data = MarkupCoordinator.state.annotations[slideIndex];
    if (!data) return;

    // Redraw strokes
    if (data.strokes) {
      data.strokes.forEach(stroke => {
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.x1, stroke.y1);
        this.ctx.lineTo(stroke.x2, stroke.y2);

        if (stroke.tool === 'pen') {
          this.ctx.strokeStyle = stroke.color;
          this.ctx.lineWidth = stroke.thickness;
          this.ctx.globalAlpha = 1;
        } else if (stroke.tool === 'highlighter') {
          this.ctx.strokeStyle = stroke.color;
          this.ctx.lineWidth = 20;
          this.ctx.globalAlpha = 0.3;
        }

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
      });
    }

    // Redraw comments
    if (data.comments) {
      data.comments.forEach(comment => this.renderTextComment(comment));
    }

    // Redraw stamps
    if (data.stamps) {
      data.stamps.forEach(stamp => this.renderStamp(stamp));
    }
  },

  getCurrentSlideIndex() {
    const slider = document.getElementById('slider');
    if (!slider) return 0;
    return Math.round(slider.scrollLeft / slider.clientWidth);
  }
};
window.AnnotationSystem = AnnotationSystem;

// === STICKY NOTES SYSTEM 2.0 (Relative Coords + Auto-Save) ===
const StickyNotesSystem = {
  lastLoadedSlide: -1,

  createNote(slideIndex) {
    // Ensure array exists in State
    if (!MarkupCoordinator.state.notes[slideIndex]) {
      MarkupCoordinator.state.notes[slideIndex] = [];
    }

    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      slide: slideIndex,
      x: 0.4, // Relative X (0.0 to 1.0)
      y: 0.3, // Relative Y (0.0 to 1.0)
      w: 0.2, // Relative Width
      h: 0.25, // Relative Height
      color: 'yellow',
      text: ''
    };

    MarkupCoordinator.state.notes[slideIndex].push(note);
    this.renderNote(note);
    MarkupCoordinator.forceSave();

    // Play Sound
    if (typeof SoundFX !== 'undefined') SoundFX.playPop();
  },

  renderNote(note) {
    const container = document.getElementById('sticky-notes-layer');
    const viewport = document.getElementById('viewport-frame');

    if (!viewport || !container) return;

    const noteEl = document.createElement('div');
    noteEl.className = 'sticky-note';
    noteEl.dataset.id = note.id;
    noteEl.dataset.color = note.color;

    // --- COORDINATE MATH (Relative % -> Absolute Pixels) ---
    const absX = note.x * viewport.clientWidth;
    const absY = note.y * viewport.clientHeight;
    const absW = note.w * viewport.clientWidth;
    const absH = note.h * viewport.clientHeight;

    Object.assign(noteEl.style, {
      left: `${absX}px`,
      top: `${absY}px`,
      width: `${absW || 220}px`,
      height: `${absH || 160}px`,
      display: 'block'
    });

    noteEl.innerHTML = `
      <div class="sticky-note-header">
        <div class="sticky-note-toolbar">
          <button class="note-color-btn" data-color="yellow" style="background:#FFF59D"></button>
          <button class="note-color-btn" data-color="blue" style="background:#90CAF9"></button>
          <button class="note-color-btn" data-color="pink" style="background:#F48FB1"></button>
          <button class="note-color-btn" data-color="green" style="background:#A5D6A7"></button>
          <div class="w-px h-4 bg-black/10 mx-1"></div>
          <button class="note-mic-btn" title="Voice Type">🎤</button>
          <div class="w-px h-4 bg-black/10 mx-1"></div>
          <!-- SPAG Buttons -->
          <button class="note-spag-btn text-[10px] font-bold px-1 hover:bg-black/5 rounded" title="Fix Punctuation" data-spag="punct">P</button>
          <button class="note-spag-btn text-[10px] font-bold px-1 hover:bg-black/5 rounded" title="Fix Spelling" data-spag="spell">S</button>
          <button class="note-spag-btn text-[10px] font-bold px-1 hover:bg-black/5 rounded" title="Fix Grammar" data-spag="gram">G</button>
          <button class="note-spag-btn text-xs px-1 hover:bg-brand-500/20 rounded text-brand-600" title="Fix All (SPAG)" data-spag="all">✨</button>
          <div class="w-px h-4 bg-black/10 mx-1"></div>
          <button class="note-toolbar-btn" data-action="delete">×</button>
        </div>
      </div>
      <textarea class="sticky-note-content" placeholder="Type note..."></textarea>
      <!-- 4 RESIZE HANDLES -->
      <div class="sticky-note-resize-handle nw" data-dir="nw"></div>
      <div class="sticky-note-resize-handle ne" data-dir="ne"></div>
      <div class="sticky-note-resize-handle sw" data-dir="sw"></div>
      <div class="sticky-note-resize-handle se" data-dir="se"></div>
    `;

    container.appendChild(noteEl);

    // --- DATA BINDING ---
    const textarea = noteEl.querySelector('textarea');
    textarea.value = note.text || "";

    // 1. Auto-save on typing (Debounced)
    textarea.addEventListener('input', (e) => {
      note.text = e.target.value;
      MarkupCoordinator.scheduleSave();
    });

    // 2. Force save on blur
    textarea.addEventListener('blur', () => {
      note.text = textarea.value;
      MarkupCoordinator.forceSave();
    });

    // 3. HOVER EXIT -> RELEASE FOCUS (Seamless Slide Transition)
    // When mouse leaves the note, we blur the textarea so keys/swipes control slides again.
    noteEl.addEventListener('mouseleave', () => {
      if (document.activeElement === textarea) {
        textarea.blur();
      }
    });

    // --- EVENT LISTENERS ---
    // Delete/Color/Mic/SPAG
    noteEl.querySelector('.sticky-note-toolbar').addEventListener('click', (e) => {
      if (e.target.dataset.action === 'delete') {
        this.deleteNote(note.id, note.slide);
        noteEl.remove();
      }
      if (e.target.dataset.color) {
        note.color = e.target.dataset.color;
        noteEl.dataset.color = note.color;
        MarkupCoordinator.forceSave();
      }
      if (e.target.classList.contains('note-mic-btn')) {
        const textarea = noteEl.querySelector('textarea');
        VoiceSystem.toggle(textarea);
        textarea.focus();
      }
      // SPAG Buttons
      if (e.target.dataset.spag) {
        const textarea = noteEl.querySelector('textarea');
        SPAGSystem.applyToActive(e.target.dataset.spag, textarea);
      }
    });

    // Drag Logic
    this.makeDraggable(noteEl, note);
    this.makeResizable(noteEl, note);
  },

  makeDraggable(el, note) {
    const header = el.querySelector('.sticky-note-header');

    header.onmousedown = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();

      const viewport = document.getElementById('viewport-frame');
      const startX = e.clientX - el.offsetLeft;
      const startY = e.clientY - el.offsetTop;

      document.onmousemove = (ev) => {
        const newLeft = ev.clientX - startX;
        const newTop = ev.clientY - startY;

        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';

        // Update State (Convert back to %)
        note.x = newLeft / viewport.clientWidth;
        note.y = newTop / viewport.clientHeight;
      };

      document.onmouseup = () => {
        document.onmousemove = null;
        document.onmouseup = null;
        MarkupCoordinator.forceSave();
      };
    };
  },

  makeResizable(el, note) {
    const handles = el.querySelectorAll('.sticky-note-resize-handle');

    handles.forEach(handle => {
      handle.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const dir = handle.dataset.dir || 'se'; // Default to se if missing
        const viewport = document.getElementById('viewport-frame');

        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = el.offsetLeft;
        const startTop = el.offsetTop;
        const startW = el.offsetWidth;
        const startH = el.offsetHeight;

        document.onmousemove = (ev) => {
          const deltaX = ev.clientX - startX;
          const deltaY = ev.clientY - startY;

          let newW = startW;
          let newH = startH;
          let newLeft = startLeft;
          let newTop = startTop;

          // Logic for directions
          if (dir.includes('e')) newW = startW + deltaX;
          if (dir.includes('w')) {
            // For west, we change width AND left position
            // DeltaX is positive when moving right (shrinking), negative left (growing)
            newW = startW - deltaX;
            newLeft = startLeft + deltaX;
          }
          if (dir.includes('s')) newH = startH + deltaY;
          if (dir.includes('n')) {
            newH = startH - deltaY;
            newTop = startTop + deltaY;
          }

          // Constraints (Min Size)
          if (newW > 150) {
            el.style.width = newW + 'px';
            if (dir.includes('w')) el.style.left = newLeft + 'px';
            note.w = newW / viewport.clientWidth;
            note.x = (dir.includes('w') ? newLeft : el.offsetLeft) / viewport.clientWidth;
          }
          if (newH > 80) {
            el.style.height = newH + 'px';
            if (dir.includes('n')) el.style.top = newTop + 'px';
            note.h = newH / viewport.clientHeight;
            note.y = (dir.includes('n') ? newTop : el.offsetTop) / viewport.clientHeight;
          }
        };

        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;
          MarkupCoordinator.forceSave();
        };
      };
    });
  },

  deleteNote(id, slideIndex) {
    if (MarkupCoordinator.state.notes[slideIndex]) {
      MarkupCoordinator.state.notes[slideIndex] =
        MarkupCoordinator.state.notes[slideIndex].filter(n => n.id !== id);
      MarkupCoordinator.forceSave();
    }
  },

  loadNotesForSlide(slideIndex) {
    // CRITICAL FIX: Sync any visible notes BEFORE clearing DOM
    this.syncVisibleNotesToState();

    this.lastLoadedSlide = slideIndex;

    console.log(`🔄 Loading Notes for Slide ${slideIndex}`);

    // Clear DOM
    const container = document.getElementById('sticky-notes-layer');
    if (container) container.innerHTML = '';

    // Load from Coordinator State
    const notes = MarkupCoordinator.state.notes[slideIndex] || [];
    notes.forEach(note => this.renderNote(note));
  },

  clearAll() {
    const container = document.getElementById('sticky-notes-layer');
    if (container) container.innerHTML = '';
    this.lastLoadedSlide = -1;
  },

  // NEW: Sync all visible note textareas back to state before navigation
  syncVisibleNotesToState() {
    const container = document.getElementById('sticky-notes-layer');
    if (!container) return;

    const noteElements = container.querySelectorAll('.sticky-note');
    noteElements.forEach(noteEl => {
      const textarea = noteEl.querySelector('textarea');
      const noteId = noteEl.dataset.id;

      if (textarea && noteId) {
        for (const slideIdx in MarkupCoordinator.state.notes) {
          const notes = MarkupCoordinator.state.notes[slideIdx];
          const note = notes.find(n => n.id === noteId);
          if (note) {
            note.text = textarea.value;
            break;
          }
        }
      }
    });

    MarkupCoordinator.forceSave();
    console.log('💾 Synced visible notes to state');
  },

  loadFromLocalStorage() {
    // Notes are now managed via MarkupCoordinator
    // This method is kept for backwards compatibility
  }
};
window.StickyNotesSystem = StickyNotesSystem;

// === VOICE DICTATION SYSTEM ===
const VoiceSystem = {
  recognition: null,
  isRecording: false,
  targetInput: null, // Tracks which input is receiving text

  init() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-GB'; // British English

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateUI(true);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateUI(false);
        this.targetInput = null;
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.insertText(finalTranscript);
        }
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  },

  toggle(inputElement) {
    if (!this.recognition) return;

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.targetInput = inputElement;
      this.recognition.start();
    }
  },

  insertText(text) {
    if (this.targetInput) {
      const start = this.targetInput.selectionStart;
      const end = this.targetInput.selectionEnd;
      const original = this.targetInput.value;
      const newText = original.substring(0, start) + text + original.substring(end);

      this.targetInput.value = newText;
      this.targetInput.dispatchEvent(new Event('input')); // Trigger autosave
    }
  },

  updateUI(isRecording) {
    const micButtons = document.querySelectorAll('.note-mic-btn');
    micButtons.forEach(btn => {
      if (isRecording) {
        btn.classList.add('animate-pulse', 'text-red-500');
      } else {
        btn.classList.remove('animate-pulse', 'text-red-500');
      }
    });
  }
};
// Initialize Voice
VoiceSystem.init();
window.VoiceSystem = VoiceSystem;
