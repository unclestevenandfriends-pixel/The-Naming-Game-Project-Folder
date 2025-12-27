// ═══════════════════════════════════════════════════════════════════════════════
// CORE.JS - Foundation Systems (MUST LOAD FIRST)
// Contains: Security Config, Class Data State, MarkupCoordinator, SPAGSystem
const DEBUG_MODE = false;
// ═══════════════════════════════════════════════════════════════════════════════

// --- SECURITY CONFIGURATION ---
const SECURITY_CONFIG = {
  ALLOWED_HOST: "your-username.github.io", // Replace with actual username
  TEACHER_PIN: "zildjian",
  IS_LOCALHOST: ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:'
};

// === SAFE STORAGE WRAPPER ===
const SafeStorage = {
  _warned: false,

  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        if (!this._warned) {
          this._warned = true;
          console.error('💾 Storage Full! Unable to save:', key);
          // Show user-friendly warning (non-blocking)
          this.showStorageWarning();
        }
      } else {
        console.error('💾 Storage Error:', e);
      }
      return false;
    }
  },

  showStorageWarning() {
    const existing = document.getElementById('storage-warning');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'storage-warning';
    toast.className = 'fixed bottom-4 left-4 bg-red-500/90 text-white px-4 py-3 rounded-xl shadow-lg z-[9999] flex items-center gap-3 animate-pulse';
    toast.innerHTML = `
            <span class="text-2xl">💾</span>
            <div>
                <strong>Storage Full!</strong>
                <p class="text-sm opacity-80">Your work may not be saved. Close some browser tabs.</p>
            </div>
            <button onclick="this.parentElement.remove()" class="ml-4 text-white/70 hover:text-white">✕</button>
        `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 10000);
  }
};
window.SafeStorage = SafeStorage;

// --- GLOBAL STATE MANAGEMENT ---
let classData = {
  studentName: "",
  classDate: "",
  totalScore: 0,
  totalQuestions: 0,
  answersLog: []
};

function loadClassDataFromStorage() {
  try {
    const savedData = localStorage.getItem('nameGame_data');
    if (!savedData) return false;

    const parsed = JSON.parse(savedData);
    if (!parsed || typeof parsed !== 'object') return false;

    classData.studentName = typeof parsed.studentName === 'string' ? parsed.studentName : "";
    classData.classDate = typeof parsed.classDate === 'string' ? parsed.classDate : "";
    classData.totalScore = Number.isFinite(parsed.totalScore) ? parsed.totalScore : 0;
    classData.totalQuestions = Number.isFinite(parsed.totalQuestions) ? parsed.totalQuestions : 0;
    classData.answersLog = Array.isArray(parsed.answersLog) ? parsed.answersLog : [];

    return true;
  } catch (e) {
    console.warn("⚠️ Failed to load saved class data:", e);
    return false;
  }
}
window.loadClassDataFromStorage = loadClassDataFromStorage;
// Hydrate ASAP so premature saves don't overwrite good data.
loadClassDataFromStorage();

// === GLOBAL TEACHER SHORTCUTS ===
document.addEventListener('keydown', (e) => {
  // Alt + T (Option + T on Mac)
  if (e.altKey && (e.key === 't' || e.key === 'T' || e.code === 'KeyT')) {
    e.preventDefault();
    const modal = document.getElementById('teacher-modal');
    if (modal) {
      if (modal.open) modal.close();
      else modal.showModal();
      if (DEBUG_MODE) console.log("Teacher Modal Toggled via Shortcut");
    }
  }
});

// Triple Click Logic for Lobby Title
document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('lobby-welcome');
  if (title) {
    let clicks = 0;
    title.addEventListener('click', () => {
      clicks++;
      if (clicks === 3) {
        const modal = document.getElementById('teacher-modal');
        if (modal) modal.showModal();
        clicks = 0;
      }
      setTimeout(() => clicks = 0, 1000); // Reset after 1s
    });
  }
});

// === FULLSCREEN TOGGLE (Native + Pseudo Fallback) ===
function isNativeFullscreen() {
  return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function setPseudoFullscreen(enabled) {
  document.documentElement.classList.toggle('is-pseudo-fullscreen', enabled);
  document.body.classList.toggle('is-pseudo-fullscreen', enabled);
  window.__pseudoFullscreen = enabled;

  // Update Glass Command Deck button state
  const toolBtn = document.getElementById('gcd-fullscreen');
  if (toolBtn) {
    if (enabled) {
      toolBtn.classList.add('active');
      toolBtn.setAttribute('aria-pressed', 'true');
    } else {
      toolBtn.classList.remove('active');
      toolBtn.setAttribute('aria-pressed', 'false');
    }
  }
}

async function requestNativeFullscreen() {
  const el = document.documentElement;
  const request = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (!request) return false;
  try {
    const result = request.call(el);
    if (result && typeof result.then === 'function') await result;
    return true;
  } catch (err) {
    console.warn('Fullscreen request failed', err);
    return false;
  }
}

async function exitNativeFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  if (!exit) return false;
  try {
    const result = exit.call(document);
    if (result && typeof result.then === 'function') await result;
    return true;
  } catch (err) {
    console.warn('Fullscreen exit failed', err);
    return false;
  }
}

async function toggleFullScreen() {
  if (window.__pseudoFullscreen) {
    setPseudoFullscreen(false);
    return;
  }

  if (isNativeFullscreen()) {
    await exitNativeFullscreen();
    return;
  }

  const entered = await requestNativeFullscreen();
  if (!entered) {
    // iOS Safari fallback: pseudo-fullscreen via CSS
    setPseudoFullscreen(true);
  }
}
window.toggleFullScreen = toggleFullScreen;

if (!window.__fullscreenKeyListenerAttached) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.__pseudoFullscreen) setPseudoFullscreen(false);
  });
  window.__fullscreenKeyListenerAttached = true;
}

if (!window.__fullscreenChangeListenerAttached) {
  const handler = () => {
    if (window.__pseudoFullscreen && isNativeFullscreen()) setPseudoFullscreen(false);

    // Update Glass Command Deck button state for native fullscreen
    const toolBtn = document.getElementById('gcd-fullscreen');
  if (toolBtn) {
    if (isNativeFullscreen()) {
      toolBtn.classList.add('active');
      toolBtn.setAttribute('aria-pressed', 'true');
    } else {
      toolBtn.classList.remove('active');
      toolBtn.setAttribute('aria-pressed', 'false');
    }
  }
  };
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  window.__fullscreenChangeListenerAttached = true;
}

// === MARKUP COORDINATOR (Single Source of Truth) ===
const MarkupCoordinator = {
  _initialized: false,
  state: {
    version: 2.0,
    notes: {},       // { slideIndex: [ {id, x, y, width, height, color, text} ] }
    annotations: {}  // { slideIndex: { strokes: [], stamps: [] } }
    // NOTE: whiteboards removed - feature deleted
  },
  saveTimeout: null,

  // Initialize and Load Data
  init() {
    if (this._initialized) return;
    this._initialized = true;
    this.migrateOldData(); // Clean up Draft 18 mess
    const saved = localStorage.getItem('nameGame_markup');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        if (DEBUG_MODE) console.log("✅ Markup State Loaded:", this.state);
      } catch (e) {
        console.error("⚠️ State corrupt, starting fresh.");
      }
    }
  },

  // The "Debounce" Save - waits 500ms after typing stops
  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.forceSave();
    }, 500);
  },

  // Immediate Save (use on Slide Change or Blur)
  forceSave() {
    try {
      const json = JSON.stringify(this.state);
      SafeStorage.setItem('nameGame_markup', json);
      if (DEBUG_MODE) console.log("💾 State Saved to Storage");
    } catch (e) {
      console.warn("❌ Storage Full or Error:", e);
    }
  },

  // Nuclear Option for "Start New Class"
  clearAll() {
    this.state = { version: 2.0, notes: {}, annotations: {} };
    localStorage.removeItem('nameGame_markup');
    // Also wipe legacy keys just in case
    localStorage.removeItem('stickyNotes');
    localStorage.removeItem('annotations');
  },

  // Bridge for Ghosting Protocol (Wipe visuals only)
  clearCanvas() {
    if (typeof AnnotationSystem !== 'undefined' && AnnotationSystem.ctx) {
      AnnotationSystem.ctx.clearRect(0, 0, AnnotationSystem.canvas.width, AnnotationSystem.canvas.height);
    }
  },

  clearStickers() {
    const stampsLayer = document.getElementById('stamps-layer');
    if (stampsLayer) stampsLayer.innerHTML = '';
    const commentsLayer = document.getElementById('text-comments-layer');
    if (commentsLayer) commentsLayer.innerHTML = '';
    const stickyLayer = document.getElementById('sticky-notes-layer');
    if (stickyLayer) stickyLayer.innerHTML = '';
  },

  // Migration: Wipe old conflicting data to prevent ghost bugs
  migrateOldData() {
    const draft18_notes = localStorage.getItem('draft18_notes');
    const stickyNotes = localStorage.getItem('stickyNotes');
    const annotations = localStorage.getItem('annotations');

    if (draft18_notes || stickyNotes || annotations) {
      if (DEBUG_MODE) console.log("🧹 Migrating/Cleaning legacy Draft 18 data...");
      localStorage.removeItem('draft18_notes');
      localStorage.removeItem('stickyNotes');
      localStorage.removeItem('annotations');
    }
  }
};
window.MarkupCoordinator = MarkupCoordinator;

// === SPAG SYSTEM (Spelling, Punctuation, Grammar) ===
const SPAGSystem = {
  // Rules for "Intelligent" Corrections
  rules: {
    spelling: [
      { regex: /\bonse\b/gi, replacement: "once" },
      { regex: /\buppon\b/gi, replacement: "upon" },
      { regex: /\batime\b/gi, replacement: "a time" },
      { regex: /\bther\b/gi, replacement: "there" },
      { regex: /\bteh\b/gi, replacement: "the" },
      { regex: /\bwiht\b/gi, replacement: "with" },
      { regex: /\bthier\b/gi, replacement: "their" },
      { regex: /\bthree beers\b/gi, replacement: "three bears" },
      { regex: /\bmommy beer\b/gi, replacement: "mommy bear" },
      { regex: /\bdaddy beer\b/gi, replacement: "daddy bear" },
      { regex: /\bbaby bar\b/gi, replacement: "baby bear" },
      { regex: /\bi\b/g, replacement: "I" },
      { regex: /\bdont\b/gi, replacement: "don't" },
      { regex: /\bcant\b/gi, replacement: "can't" },
      { regex: /\bwont\b/gi, replacement: "won't" },
      { regex: /\bim\b/gi, replacement: "I'm" },
      { regex: /\bill\b/gi, replacement: "I'll" },
      { regex: /\bthats\b/gi, replacement: "that's" },
      { regex: /\bwhats\b/gi, replacement: "what's" }
    ],
    punctuation: [
      // Capitalize start of sentence
      { regex: /(^|[.!?]\s+)([a-z])/g, replacement: (m, p1, p2) => p1 + p2.toUpperCase() },
      // Add period at end if missing (and not ending in punctuation)
      { regex: /([a-zA-Z0-9])$/, replacement: "$1." },
      // Fix spaces before punctuation
      { regex: /\s+([,.!?])/g, replacement: "$1" },
      // Ensure space after punctuation
      { regex: /([,.!?])([a-zA-Z])/g, replacement: "$1 $2" },
      // Intro words
      { regex: /^(However|Therefore|Furthermore|Consequently|Meanwhile|Moreover|Unfortunately|Finally|Additionally|In conclusion|For example|In fact|Of course|Nevertheless|Alternatively)(?!\,)/i, replacement: "$1," }
    ],
    grammar: [
      { regex: /\bwas three\b/gi, replacement: "were three" },
      { regex: /\bme and ([a-zA-Z]+) went\b/gi, replacement: "$1 and I went" },
      { regex: /\bshould of\b/gi, replacement: "should have" },
      { regex: /\bcould of\b/gi, replacement: "could have" },
      { regex: /\bwould of\b/gi, replacement: "would have" },
      { regex: /\ba apple\b/gi, replacement: "an apple" },
      { regex: /\ba elephant\b/gi, replacement: "an elephant" },
      { regex: /\ba orange\b/gi, replacement: "an orange" }
    ]
  },

  applyToActive(mode = 'all', targetOverride = null) {
    let target = targetOverride;
    let selection = window.getSelection();
    let range = null;
    let selectedText = "";

    // 1. Identify Target
    if (!target) {
      if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true')) {
        target = document.activeElement;
      }
    }

    if (!target) {
      console.warn("SPAG: No active target found.");
      return;
    }

    const isContentEditable = (target.getAttribute('contenteditable') === 'true');

    // 2. Get Text (Selected or All)
    if (isContentEditable) {
      if (selection.rangeCount > 0 && !selection.isCollapsed && selection.anchorNode && target.contains(selection.anchorNode)) {
        range = selection.getRangeAt(0);
        selectedText = range.toString();
      } else {
        selectedText = target.innerText; // Fallback to full text
      }
    } else {
      // Textarea
      if (target.selectionStart !== target.selectionEnd) {
        selectedText = target.value.substring(target.selectionStart, target.selectionEnd);
      } else {
        selectedText = target.value;
      }
    }

    if (!selectedText || selectedText.trim() === "") return;

    // 3. Process Text
    let processedHTML = selectedText; // For ContentEditable (Rich Text)
    let processedText = selectedText; // For Textarea (Plain Text)

    // Helper to apply rules
    const applyRules = (text, ruleSet, isRich) => {
      let res = text;
      ruleSet.forEach(rule => {
        if (isRich) {
          // For Rich Text: Insert Strikethrough + Correction
          res = res.replace(rule.regex, (match) => {
            let newText = (typeof rule.replacement === 'function') ? rule.replacement(match) : rule.replacement;
            if (match.toLowerCase() === newText.toLowerCase()) return newText;
            return `<span style="text-decoration: line-through; color: #ffffff80; margin-right: 4px;">${match}</span><span style="color: #ef4444; font-weight: bold;">${newText}</span>`;
          });
        } else {
          // Plain Text: Just replace
          res = res.replace(rule.regex, rule.replacement);
        }
      });
      return res;
    };

    // Apply based on mode
    if (mode === 'spell' || mode === 'all') {
      processedHTML = applyRules(processedHTML, this.rules.spelling, isContentEditable);
      processedText = applyRules(processedText, this.rules.spelling, false);
    }
    if (mode === 'punct' || mode === 'all') {
      processedText = this.fixPunctuation(processedText);
      if (isContentEditable) {
        processedHTML = this.fixPunctuation(processedText);
      }
    }
    if (mode === 'gram' || mode === 'all') {
      processedHTML = applyRules(processedHTML, this.rules.grammar, isContentEditable);
      processedText = applyRules(processedText, this.rules.grammar, false);
    }

    // 4. Update Target
    if (isContentEditable) {
      if (range) {
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = processedHTML;
        const frag = document.createDocumentFragment();
        let lastNode;
        while ((lastNode = div.firstChild)) {
          frag.appendChild(lastNode);
        }
        range.insertNode(frag);
      } else {
        target.innerHTML = processedHTML;
      }
      MarkupCoordinator.scheduleSave();
    } else {
      // Textarea
      if (target.selectionStart !== target.selectionEnd) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const original = target.value;
        target.value = original.substring(0, start) + processedText + original.substring(end);
      } else {
        target.value = processedText;
      }
      target.dispatchEvent(new Event('input')); // Trigger autosave
    }

    if (typeof SoundFX !== 'undefined') SoundFX.playPop();
  },

  fixPunctuation(text) {
    if (!text) return "";

    // Helper: Capitalize first letter
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    // Helper: Check if word is an auxiliary verb (to avoid splitting)
    const isAux = (w) => ["is", "are", "was", "were", "do", "does", "did", "can", "could", "will", "would", "should", "has", "have", "had", "am", "may", "might", "must"].includes(w.toLowerCase());

    // Helper: Check if word is a title
    const isTitle = (w) => ["mr", "mrs", "ms", "dr", "prof", "capt", "gen", "sen", "rep", "st"].includes(w.toLowerCase().replace('.', ''));

    // 1. Basic Cleanup (Normalize spaces)
    text = text.replace(/\s+/g, ' ').trim();

    // 2. Sentence Splitting (Heuristic)
    const starters = ["The", "A", "An", "He", "She", "It", "They", "We", "Then", "Next", "After", "Before", "When", "While", "Because", "Although", "However", "Therefore", "Finally", "Suddenly", "Meanwhile", "Later", "Eventually", "Unfortunately", "Fortunately"];

    let words = text.split(' ');
    let resultWords = [];

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      let nextWord = words[i + 1];

      resultWords.push(word);

      if (!nextWord) continue;

      let cleanWord = word.replace(/[.,?!;:]/g, '');

      if (/[.?!]$/.test(word)) {
        continue;
      }

      if (starters.includes(cap(nextWord))) {
        const noSplitAfter = ["and", "but", "or", "so", "yet", "for", "nor", "because", "since", "if", "unless", "until", "while", "where", "that", "which", "who", "whom", "whose", "to", "of", "in", "on", "at", "by", "from"];

        if (!noSplitAfter.includes(cleanWord.toLowerCase()) && !isAux(cleanWord) && !isTitle(cleanWord)) {
          resultWords[resultWords.length - 1] += ".";
        }
      }
    }

    text = resultWords.join(' ');

    // 3. Compound Sentence Commas
    const compoundConjunctions = ["and", "but", "or", "so", "yet", "for", "nor"];
    const subjects = ["I", "he", "she", "it", "we", "they", "you", "the", "a"];
    text = text.replace(new RegExp(`(\\w+)\\s+(${compoundConjunctions.join('|')})\\s+(${subjects.join('|')})\\b`, 'gi'), (match, p1, p2, p3) => {
      return `${p1}, ${p2} ${p3}`;
    });

    // 4. Introductory Phrases
    const introWords = ["However", "Therefore", "Furthermore", "In conclusion", "For example", "Of course", "Finally", "Additionally", "Moreover", "Nevertheless", "Unfortunately", "Fortunately", "Alternatively", "Meanwhile", "Consequently"];
    text = text.replace(new RegExp(`(?:^|([.?!]\\s+))(${introWords.join('|')})(?![.,])`, 'g'), (match, p1, p2) => {
      return `${p1 || ''}${p2},`;
    });

    // 5. Capitalization & Final Polish
    text = text.replace(/([.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    text = text.replace(/\b(i)\b/g, 'I');
    text = text.replace(/\b(i')/g, "I'");

    // 6. Ensure Final Punctuation
    if (!/[.!?]$/.test(text)) text += '.';

    return text;
  }
};
window.SPAGSystem = SPAGSystem;

// === SESSION MANAGEMENT FUNCTIONS ===
function saveProgress() {
  // Only save if NOT in report mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'report') return;

  // Prevent overwriting good saved data with empty defaults (e.g. during refresh races).
  if (!classData?.studentName || !String(classData.studentName).trim()) {
    // Best-effort hydrate; if still empty, skip saving entirely.
    loadClassDataFromStorage();
    if (!classData?.studentName || !String(classData.studentName).trim()) return;
  }

  const json = JSON.stringify(classData);
  SafeStorage.setItem('nameGame_data', json);
  if (DEBUG_MODE) console.log("Progress Saved");
}
window.saveProgress = saveProgress;

if (DEBUG_MODE) console.log("✅ core.js loaded - Foundation systems ready");

function flushSessionToStorage(reason = "unknown") {
  if (window.__skipSessionFlush) return;
  try {
    if (window.StickyNotesSystem && typeof window.StickyNotesSystem.syncVisibleNotesToState === 'function') {
      window.StickyNotesSystem.syncVisibleNotesToState();
    }
  } catch (e) { }

  try {
    if (window.MarkupCoordinator && typeof window.MarkupCoordinator.forceSave === 'function') {
      window.MarkupCoordinator.forceSave();
    }
  } catch (e) { }

  try {
    if (typeof window.saveProgress === 'function') {
      window.saveProgress();
    }
  } catch (e) { }

  try {
    if (window.MapSystem && typeof window.MapSystem.saveProgress === 'function') {
      window.MapSystem.saveProgress();
    }
  } catch (e) { }

  try {
    if (window.GameEngine && typeof window.GameEngine.saveGameState === 'function') {
      window.GameEngine.saveGameState();
    }
  } catch (e) { }

  if (DEBUG_MODE) console.log("💾 Flush complete:", reason);
}
window.flushSessionToStorage = flushSessionToStorage;

if (!window.__sessionFlushListenersAttached) {
  window.addEventListener('beforeunload', () => flushSessionToStorage('beforeunload'), { capture: true });
  window.addEventListener('pagehide', () => flushSessionToStorage('pagehide'), { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSessionToStorage('visibilitychange');
  }, { capture: true });
  window.__sessionFlushListenersAttached = true;
}

function getSessionStorageId() {
  try {
    const raw = localStorage.getItem('nameGame_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      const name = (parsed?.studentName || '').trim();
      const date = (parsed?.classDate || '').trim();
      if (name || date) return [name || 'anon', date || 'nodate'].join('|');
    }
  } catch (e) { }
  const name = (classData?.studentName || '').trim();
  const date = (classData?.classDate || '').trim();
  return [name || 'anon', date || 'nodate'].join('|');
}

function persistTeacherNote() {
  const el = document.getElementById('teacher-note-input');
  if (!el) return;
  try {
    SafeStorage.setItem(`nameGame_teacher_note::${getSessionStorageId()}`, el.value || '');
  } catch (e) { }
}
window.persistTeacherNote = persistTeacherNote;

function restoreTeacherNote() {
  const el = document.getElementById('teacher-note-input');
  if (!el) return;
  if (el.value && el.value.trim()) return;
  try {
    const saved = localStorage.getItem(`nameGame_teacher_note::${getSessionStorageId()}`);
    if (saved) el.value = saved;
  } catch (e) { }
}
window.restoreTeacherNote = restoreTeacherNote;

if (!window.__teacherNotePersistenceAttached) {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('teacher-note-input');
    if (!el) return;
    restoreTeacherNote();
    el.addEventListener('input', () => {
      persistTeacherNote();
    });
    el.addEventListener('blur', () => {
      persistTeacherNote();
    });
  });
  window.__teacherNotePersistenceAttached = true;
}

// Initialize markup persistence early so navigation can't wipe it before main.js runs.
try {
  MarkupCoordinator.init();
} catch (e) {
  console.warn("⚠️ MarkupCoordinator init failed:", e);
}


// SLIDE_REGISTRY moved to js/slide_registry.js for consolidation
