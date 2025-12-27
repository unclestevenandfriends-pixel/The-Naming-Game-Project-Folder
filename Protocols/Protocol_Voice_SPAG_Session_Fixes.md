# Protocol: Voice, SPAG, and Session Stability Implementations
**Reference File:** `Draft 22 fixed.HTML`
**Date:** December 6, 2025

This protocol documents the complete, final implementations of the Voice Typing, SPAG (Spelling, Punctuation, Grammar) System, Session Summary Fixes, and Magic Link Security features. Use this guide to re-implement these features in future projects without repeating past mistakes.

---

## 1. SPAG System (Spelling, Punctuation, Grammar)
**Purpose:** Provides intelligent text correction for sticky notes and whiteboards, fixing spelling, grammar (a/an agreement), and punctuation (fragment merging).

### Implementation Details
*   **Object:** `SPAGSystem`
*   **Key Methods:** `fixAll(text)`, `applyToActive(mode, explicitTarget)`
*   **Dependencies:** None (Pure JavaScript)

### Final Code (`SPAGSystem`)
```javascript
// === SPAG SYSTEM (Spelling, Punctuation, Grammar) ===
const SPAGSystem = {
  // Simple dictionary of common typos (expandable)
  typos: {
    "teh": "the", "adn": "and", "waht": "what", "thier": "their", "wierd": "weird",
    "recieve": "receive", "goverment": "government", "occured": "occurred",
    "dont": "don't", "cant": "can't", "wont": "won't", "im": "I'm", "ive": "I've",
    "didnt": "didn't", "isnt": "isn't", "arent": "aren't", "wasnt": "wasn't",
    "werent": "weren't", "hasnt": "hasn't", "havent": "haven't", "hadnt": "hadn't",
    "shouldnt": "shouldn't", "wouldnt": "wouldn't", "couldnt": "couldn't",
    "its": "it's", // Context dependent
    "alot": "a lot", "becuase": "because", "definately": "definitely",
    "seperate": "separate", "truely": "truly", "publically": "publicly",
    "wich": "which", "whitch": "which"
  },

  fixSpelling(text) {
    for (const [typo, fix] of Object.entries(this.typos)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      text = text.replace(regex, (match) => {
        return match[0] === match[0].toUpperCase() ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;
      });
    }
    return text;
  },

  fixPunctuation(text) {
    if (!text) return "";
    
    // 1. Fragment Merging (The "Smart" Fix)
    // A. Merge if next word is lowercase (e.g. "Hello. world")
    text = text.replace(/\.\s+([a-z])/g, ' $1');
    
    // B. Merge if next word is a connector
    const connectors = ["and", "but", "or", "so", "because", "which", "who", "that", "the", "a", "an", "to", "of", "in", "on", "at", "with"];
    const connectorRegex = new RegExp(`\\.\\s+(${connectors.join('|')})\\b`, 'gi');
    text = text.replace(connectorRegex, (match, word) => ` ${word.toLowerCase()}`);

    // C. Merge if PREVIOUS word is a connector (e.g. "I went to the. Shop")
    const prevConnectorRegex = new RegExp(`\\b(${connectors.join('|')})\\.\\s+([A-Z])`, 'gi');
    text = text.replace(prevConnectorRegex, (match, conn, nextWord) => `${conn} ${nextWord.toLowerCase()}`);

    // 2. Fix Spacing
    text = text.replace(/\s+([.,!?;:])/g, '$1');
    text = text.replace(/([.,!?;:])([^\s"'])/g, '$1 $2');
    text = text.replace(/\s+/g, ' ');

    // 3. Capitalization
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, (match) => match.toUpperCase());
    text = text.replace(/\b(i)\b/g, 'I');
    text = text.replace(/\b(i')/g, "I'");

    // 4. British Commas
    const introWords = ["However", "Therefore", "Furthermore", "Consequently", "Meanwhile", "Moreover", "Unfortunately", "Finally", "Additionally", "In conclusion", "For example"];
    for (const word of introWords) {
       const regex = new RegExp(`(^|[.!?]\\s+)(${word})(?!,)`, 'gi');
       text = text.replace(regex, '$1$2,');
    }
    
    // 5. Ensure Final Punctuation
    text = text.trim();
    if (text.length > 0 && !/[.!?]$/.test(text)) {
      text += '.';
    }

    return text;
  },

  fixGrammar(text) {
    // 1. Article Agreement (a/an)
    text = text.replace(/\b(a)\s+([aeiou])/gi, 'an $2');
    text = text.replace(/\b(an)\s+([bcdfghjklmnpqrstvwxyz])/gi, 'a $2');

    // 2. Repeated Words
    text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');
    return text;
  },

  fixAll(text) {
    console.log("🪄 Running SPAG Fix on:", text);
    text = this.fixSpelling(text);
    text = this.fixPunctuation(text);
    text = this.fixGrammar(text);
    text = this.fixPunctuation(text); // Cleanup
    console.log("✨ Result:", text);
    return text;
  },

  // UI Helper: Apply to active element or specified target
  applyToActive(mode = 'all', explicitTarget = null) {
    let target = explicitTarget;
    let isWhiteboard = false;
    
    if (!target) {
      if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') {
        target = document.activeElement;
      } else if (typeof VoiceSystem !== 'undefined' && VoiceSystem.targetInput) {
        target = VoiceSystem.targetInput;
      } else {
        const whiteboardLayer = document.getElementById('whiteboard-layer');
        if (whiteboardLayer && whiteboardLayer.classList.contains('active')) {
          target = document.getElementById('whiteboard-editor');
          isWhiteboard = true;
        }
      }
    }
    
    if (target && target.tagName === 'TEXTAREA') isWhiteboard = false;
    else if (target && target.id === 'whiteboard-editor') isWhiteboard = true;

    if (!target) {
      console.warn('❌ SPAG: No target found.');
      return;
    }

    let text = isWhiteboard ? target.innerText : target.value;
    if (!text || text.trim().length === 0) return;

    if (mode === 'spell') text = this.fixSpelling(text);
    else if (mode === 'punct') text = this.fixPunctuation(text);
    else if (mode === 'gram') text = this.fixGrammar(text);
    else text = this.fixAll(text);

    if (isWhiteboard) {
      target.innerText = text;
      MarkupCoordinator.scheduleSave();
    } else {
      target.value = text;
      target.dispatchEvent(new Event('input')); // Trigger auto-save
    }
    if (typeof SoundFX !== 'undefined') SoundFX.playPop();
  }
};
```

---

## 2. Voice Dictation System (Enhanced)
**Purpose:** Enables voice typing for both Sticky Notes and Whiteboard, with British English heuristics and smart auto-punctuation.

### Implementation Details
*   **Object:** `VoiceSystem`
*   **Key Features:** `targetInput` tracking, `processText` with "No-Stop" heuristic (prevents periods after connector words).

### Final Code (`VoiceSystem`)
```javascript
// === VOICE DICTATION SYSTEM (Upgraded) ===
const VoiceSystem = {
  recognition: null,
  isRecording: false,
  targetInput: null,

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
          finalTranscript = this.processText(finalTranscript);
          this.insertText(finalTranscript);
        }
      };
    } else {
      console.warn("Web Speech API not supported.");
    }
  },

  processText(text) {
    text = text.trim();
    if (text.length === 0) return "";

    // 1. Capitalize First Letter
    text = text.charAt(0).toUpperCase() + text.slice(1);

    // 2. British Comma Heuristics
    const introWords = ["However", "Therefore", "Furthermore", "Consequently", "Meanwhile", "Moreover", "Unfortunately", "Finally", "Additionally"];
    const firstWord = text.split(' ')[0].replace(/[^\w]/g, '');
    if (introWords.includes(firstWord)) {
      const regex = new RegExp(`^${firstWord}(?!,)`, 'i');
      if (regex.test(text)) {
         text = text.replace(new RegExp(`^${firstWord}`, 'i'), `${firstWord},`);
      }
    }

    // 3. Smart Auto-Punctuation (Grammatical Heuristic)
    const NO_STOP_WORDS = [
      "the", "a", "an", "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those",
      "of", "to", "in", "on", "at", "for", "with", "by", "from", "up", "about", "into", "over", "after", "under", "between", "through", "during", "before", "without",
      "and", "but", "or", "nor", "so", "yet", "if", "because", "since", "while", "although", "unless", "until", "where", "when",
      "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "shall", "should", "may", "might", "must"
    ];

    const lastWord = text.split(' ').pop().replace(/[^\w]/g, '').toLowerCase();
    const hasPunctuation = /[.!?]$/.test(text);

    if (!hasPunctuation && !NO_STOP_WORDS.includes(lastWord)) {
       text += '.';
    }

    return text + ' ';
  },

  insertText(text) {
    if (this.targetInput) {
      const el = this.targetInput;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      el.value = value.substring(0, start) + text + value.substring(end);
      el.selectionStart = el.selectionEnd = start + text.length;
      el.dispatchEvent(new Event('input'));
      el.scrollTop = el.scrollHeight;
    } else {
      WhiteboardSystem.format('insertText', text);
    }
  },

  toggle(target = null) {
    if (!this.recognition) return;
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.targetInput = target;
      this.recognition.start();
    }
  },

  updateUI(isRecording) {
    // Global Whiteboard Mic
    const globalBtn = document.getElementById('mic-btn');
    const globalStatus = document.getElementById('mic-status');
    
    if (!this.targetInput) {
      if (isRecording) {
        if (globalBtn) globalBtn.classList.add('active-format');
        if (globalStatus) globalStatus.classList.remove('hidden');
      } else {
        if (globalBtn) globalBtn.classList.remove('active-format');
        if (globalStatus) globalStatus.classList.add('hidden');
      }
    }

    // Sticky Note Mics
    const allNoteMics = document.querySelectorAll('.note-mic-btn');
    allNoteMics.forEach(btn => {
      btn.classList.remove('text-red-500', 'animate-pulse');
      btn.innerHTML = '🎤';
    });

    if (isRecording && this.targetInput) {
      const noteEl = this.targetInput.closest('.sticky-note');
      if (noteEl) {
        const btn = noteEl.querySelector('.note-mic-btn');
        if (btn) {
          btn.classList.add('text-red-500', 'animate-pulse');
          btn.innerHTML = '🛑';
        }
      }
    }
  }
};
```

---

## 3. Sticky Notes System (Enhanced)
**Purpose:** Adds Mic and SPAG buttons to sticky notes, and ensures robust data persistence (fixing the "missing text" bug).

### Key Changes
1.  **`renderNote` HTML:** Added Mic and SPAG buttons with `data-spag` attributes.
2.  **`renderNote` Listeners:** Added handlers for Mic and SPAG, passing `textarea` explicitly.
3.  **`syncVisibleNotesToState`:** **CRITICAL FIX.** Captures text from all visible textareas and saves to state *before* slide navigation.
4.  **`loadNotesForSlide`:** Calls `syncVisibleNotesToState()` at the start.

### Final Code Snippets
**Toolbar HTML:**
```html
<div class="sticky-note-toolbar">
  <!-- Colors... -->
  <div class="w-px h-4 bg-black/10 mx-1"></div>
  <button class="note-mic-btn" title="Voice Type">🎤</button>
  <div class="w-px h-4 bg-black/10 mx-1"></div>
  <!-- SPAG Buttons -->
  <button class="note-spag-btn..." title="Fix Punctuation" data-spag="punct">P</button>
  <button class="note-spag-btn..." title="Fix Spelling" data-spag="spell">S</button>
  <button class="note-spag-btn..." title="Fix Grammar" data-spag="gram">G</button>
  <button class="note-spag-btn..." title="Fix All (SPAG)" data-spag="all">✨</button>
  <div class="w-px h-4 bg-black/10 mx-1"></div>
  <button class="note-toolbar-btn" data-action="delete">×</button>
</div>
```

**Event Listener:**
```javascript
noteEl.querySelector('.sticky-note-toolbar').addEventListener('click', (e) => {
  // ... delete/color ...
  if (e.target.classList.contains('note-mic-btn')) {
    const textarea = noteEl.querySelector('textarea');
    VoiceSystem.toggle(textarea);
    textarea.focus();
  }
  if (e.target.dataset.spag) {
    const textarea = noteEl.querySelector('textarea');
    SPAGSystem.applyToActive(e.target.dataset.spag, textarea);
  }
});
```

**Sync Logic (The "Missing Text" Fix):**
```javascript
syncVisibleNotesToState() {
  const container = document.getElementById('text-comments-layer');
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
}
```

---

## 4. Session Summary Fix
**Purpose:** Ensures the Session Summary slide (Slide 32) displays all note text immediately.

### Key Changes
1.  **`generateNotesSummary`:** Forces a save, then **reads directly from localStorage** to get the absolute latest data, bypassing potential stale memory.
2.  **`initClassMode`:** Adds a scroll listener to auto-call `generateNotesSummary()` when reaching Slide 32.

### Final Code (`generateNotesSummary`)
```javascript
window.generateNotesSummary = function () {
  MarkupCoordinator.forceSave(); // Save pending changes
  
  let allNotes = {};
  try {
    const savedMarkup = localStorage.getItem('nameGame_markup');
    if (savedMarkup) {
      const parsedState = JSON.parse(savedMarkup);
      allNotes = parsedState.notes || {};
    }
  } catch (e) {
    allNotes = MarkupCoordinator.state.notes;
  }
  // ... generation logic ...
};
```

---

## 5. Magic Link & Report Mode Security
**Purpose:** Prevents "Resume Session" prompts in Report Mode and hides the Lobby to prevent flashing.

### Key Changes
1.  **Early Lobby Hide:** `DOMContentLoaded` listener checks `mode=report` and hides `#lobby-screen` immediately.
2.  **Robust Router:** `window.onload` checks both `search` and `hash` params for `mode=report`.
3.  **`initReportMode`:** Clears `localStorage` items (`nameGame_data`, `nameGame_slide`) to prevent resume prompts.

### Final Code (Router)
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'report') {
    const lobby = document.getElementById('lobby-screen');
    if (lobby) lobby.style.display = 'none';
  }
});

window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || "");
  const isReportMode = params.get('mode') === 'report' || hashParams.get('mode') === 'report';

  if (isReportMode) {
    // Merge params and launch report
    const finalParams = new URLSearchParams();
    for (const [key, value] of params) finalParams.set(key, value);
    for (const [key, value] of hashParams) finalParams.set(key, value);
    launchApp('report', finalParams);
    return;
  }
  // ... other modes ...
});
```
