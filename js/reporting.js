// ═══════════════════════════════════════════════════════════════════════════════
// REPORTING.JS - Report Mode & Magic Link Systems
// Contains: Magic Link generation, Report Mode, Celebrations, PDF Capture
// Depends on: core.js (MarkupCoordinator, classData)
// ═══════════════════════════════════════════════════════════════════════════════

// --- EARLY REPORT MODE CHECK (Runs BEFORE window.onload) ---
// This fixes the flash of lobby when opening a Magic Link
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'report') {
    // Immediately hide lobby to prevent flash
    const lobby = document.getElementById('lobby-screen');
    if (lobby) lobby.style.display = 'none';
    console.log("🚀 Report Mode detected early, hiding lobby.");
  }
});

// === SESSION NOTES SUMMARY GENERATOR ===
window.generateNotesSummary = function () {
  console.log('📊 Generating Summary...');

  if (typeof MarkupCoordinator !== 'undefined' && typeof MarkupCoordinator.forceSave === 'function') {
    MarkupCoordinator.forceSave();
  }

  // Detect Mode
  const params = new URLSearchParams(window.location.search);
  const isReportMode = params.get('mode') === 'report';

  // SOURCE OF TRUTH SELECTION
  let allNotes = {};

  if (isReportMode) {
    // REPORT MODE: Memory is the ONLY truth (restored from URL & Shifted)
    // Reading localStorage is dangerous (contains unshifted/teacher data or empty)
    console.log('📊 Report Mode: Reading notes from Memory (Shifted)');
    allNotes = MarkupCoordinator.state.notes || {};
  } else {
    // CLASS/TEACHER MODE: localStorage is king (persistence)
    try {
      const savedMarkup = localStorage.getItem('nameGame_markup');
      if (savedMarkup) {
        const parsedState = JSON.parse(savedMarkup);
        allNotes = parsedState.notes || {};
        console.log('📂 Class Mode: Read notes from localStorage');
      }
    } catch (e) {
      console.error('Failed to read storage', e);
    }
  }

  const container = document.getElementById('summary-container');
  if (!container) return;

  container.innerHTML = ''; // Clear previous content

  const slidesWithNotes = Object.keys(allNotes).sort((a, b) => parseInt(a) - parseInt(b));
  let notesFound = false;

  slidesWithNotes.forEach(slideIndex => {
    const notesOnSlide = allNotes[slideIndex];
    if (notesOnSlide && notesOnSlide.length > 0) {
      notesFound = true;
      const card = document.createElement('div');
      card.className = 'summary-card';
      let slideTitle = `Slide ${parseInt(slideIndex) + 1}`;
      const numericIndex = parseInt(slideIndex, 10);

      // 🎯 DYNAMIC TITLE LOOKUP (Batch 1 Refactor)
      // Use SlideRegistry as the Source of Truth instead of raw DOM index
      if (window.SlideRegistry) {
        const key = window.SlideRegistry.keyAtIndex(numericIndex);
        if (key) {
          const info = window.SlideRegistry.lookup(key);
          if (info && info.title) slideTitle = info.title;
        }
      }

      let listHTML = '<ul class="summary-note-list" style="list-style: none; padding: 0; margin: 0;">';
      notesOnSlide.forEach(note => {
        const text = note.text && note.text.trim().length > 0 ? note.text : '<span style="font-style: italic; opacity: 0.5;">(Empty Note)</span>';
        const colorMap = { yellow: '#FFF59D', blue: '#90CAF9', pink: '#F48FB1', green: '#A5D6A7' };
        const borderColor = colorMap[note.color] || '#FFF59D';

        // INLINE STYLES FOR ROBUSTNESS (Bypasses CSS Cache issues)
        const itemStyle = `
          display: block;
          background: rgba(255, 255, 255, 0.1); 
          border-left: 4px solid ${borderColor}; 
          border-radius: 8px;
          padding: 12px; 
          margin-bottom: 8px;
          color: #FDFDFD;
          font-family: 'Nunito Sans', sans-serif;
          font-size: 0.95rem;
          line-height: 1.5;
          min-height: 48px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        listHTML += `<li class="summary-note-item" style="${itemStyle}">${text}</li>`;
      });
      listHTML += '</ul>';

      const cardStyle = "background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; margin-bottom: 16px;";
      const headerStyle = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 8px;";

      card.innerHTML = `
        <div class="summary-card" style="${cardStyle}">
          <div class="summary-card-header" style="${headerStyle}">
             <span class="summary-slide-title" style="font-family: 'Fredoka', sans-serif; color: #FFC69A; font-size: 1.1rem; font-weight: 500;">${slideTitle}</span>
             <span style="font-size: 0.75rem; color: #D9D9D9; font-weight: bold;">#${parseInt(slideIndex) + 1}</span>
          </div>
          ${listHTML}
        </div>`;
      container.appendChild(card);
    }
  });

  if (!notesFound) {
    container.innerHTML = `<div class="summary-empty"><div style="font-size: 3rem; margin-bottom: 1rem;">📝</div><p class="text-xl text-secondary">No notes added yet.</p><p class="text-sm text-brand-400 mt-2">Use the "Note" tool during the class to add thoughts.</p></div>`;
    console.log("⚠️ Summary: No notes found in state.");
  } else {
    console.log(`✅ Summary Generated with ${slidesWithNotes.length} slides. Check UI.`);
  }
};

// === REPORT MODE INITIALIZATION ===
function initReportMode(params) {
  console.log("🎯 INIT REPORT MODE - SHOWING CERTIFICATE");

  // 1. Activate Read-Only CSS
  document.body.classList.add('read-only');
  document.documentElement.classList.add('report-mode');

  // 2. FORCE HIDE LOBBY
  const lobby = document.getElementById('lobby-screen');
  if (lobby) {
    lobby.style.setProperty('display', 'none', 'important');
    lobby.style.setProperty('visibility', 'hidden', 'important');
    lobby.style.setProperty('opacity', '0', 'important');
    lobby.style.setProperty('pointer-events', 'none', 'important');
  }

  // 3. FORCE SHOW Report Slide
  const reportSlide = document.getElementById('slide-zero');
  if (reportSlide) {
    reportSlide.classList.remove('hidden');
    reportSlide.style.setProperty('display', 'flex', 'important');
    reportSlide.style.setProperty('opacity', '1', 'important');
    reportSlide.style.setProperty('visibility', 'visible', 'important');
  }

  // 4. Reveal Viewport and Nav
  const viewport = document.getElementById('viewport-frame');
  const nav = document.querySelector('nav');
  if (viewport) viewport.classList.remove('opacity-0');
  if (nav) nav.classList.remove('opacity-0');

  // 5. Restore Data from URL
  document.getElementById('report-name').innerText = params.get('student') || 'Unknown Agent';
  document.getElementById('report-date').innerText = params.get('date') || 'Unknown Date';

  // Score Logic
  let score = parseInt(params.get('score') || 0);
  const total = parseInt(params.get('total') || 67);
  const TOTAL_POSSIBLE_SCORE = total;
  if (score > TOTAL_POSSIBLE_SCORE) score = TOTAL_POSSIBLE_SCORE;
  document.getElementById('report-score').innerText = `${score}/${TOTAL_POSSIBLE_SCORE}`;

  // Badge Logic
  const percentage = (score / TOTAL_POSSIBLE_SCORE) * 100;
  const badge = document.getElementById('report-badge-icon');
  if (badge) {
    if (percentage >= 100) {
      badge.innerText = "Rank: Captain 🏆";
      badge.className = "absolute bottom-0 left-0 w-full bg-yellow-500 text-black font-bold uppercase text-[10px] py-0.5";
    } else if (percentage >= 80) {
      badge.innerText = "Rank: Lieutenant 🥈";
      badge.className = "absolute bottom-0 left-0 w-full bg-slate-300 text-black font-bold uppercase text-[10px] py-0.5";
    } else if (percentage >= 60) {
      badge.innerText = "Rank: Sergeant 🎖️";
      badge.className = "absolute bottom-0 left-0 w-full bg-brand-500 text-black font-bold uppercase text-[10px] py-0.5";
    } else {
      badge.innerText = "Rank: Cadet 🥉";
      badge.className = "absolute bottom-0 left-0 w-full bg-brand-500/20 text-brand-300 font-bold uppercase text-[10px] py-0.5";
    }
  }

  // 6. Teacher Note (if exists)
  let teacherNote = params.get('note');
  if (teacherNote) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(teacherNote);
      if (decompressed) {
        teacherNote = decompressed;
      }
    } catch (e) {
      console.warn("Note decompression failed, using raw value", e);
    }
  }

  const noteDisplay = document.getElementById('teacher-note-display-container');
  const noteText = document.getElementById('teacher-note-text');
  if (teacherNote && noteDisplay && noteText) {
    noteText.innerText = `"${teacherNote}"`;
    noteDisplay.classList.remove('hidden');
  }

  // 7. --- RESTORE STICKY NOTES & ANNOTATIONS FROM URL ---
  const markupParam = params.get('markup');
  if (markupParam) {
    try {
      let jsonStr = null;
      const decompressed = LZString.decompressFromEncodedURIComponent(markupParam);
      if (decompressed) {
        jsonStr = decompressed;
      } else {
        jsonStr = atob(markupParam);
      }

      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);

        let rawNotes = {};
        let rawAnnotations = {};

        // Handle Legacy Format (just notes) vs New Format (notes + annotations)
        if (parsed.notes || parsed.annotations) {
          rawNotes = parsed.notes || {};
          rawAnnotations = parsed.annotations || {};
        } else {
          // Fallback for old links
          rawNotes = parsed;
        }

        // --- INTELLIGENT OFFSET SHIFTING ---
        // Report Mode injects 2 slides at the start: [0: Report], [1: Summary].
        // Original Content (Indices 0, 1, 2...) is pushed to (2, 3, 4...).
        // We must shift keys by +2.
        const SHIFT_OFFSET = 2;

        const shiftedNotes = {};
        Object.keys(rawNotes).forEach(k => {
          const newKey = parseInt(k) + SHIFT_OFFSET;
          shiftedNotes[newKey] = rawNotes[k];
        });

        const shiftedAnnotations = {};
        Object.keys(rawAnnotations).forEach(k => {
          const newKey = parseInt(k) + SHIFT_OFFSET;
          shiftedAnnotations[newKey] = rawAnnotations[k];
        });

        MarkupCoordinator.state.notes = shiftedNotes;
        MarkupCoordinator.state.annotations = shiftedAnnotations;

        console.log("✅ Restored & Shifted Notes/Annotations (Offset +2)");
        console.log("📊 DEBUG: Notes in Memory:", JSON.stringify(MarkupCoordinator.state.notes));

        setTimeout(() => {
          // FORCE DOM PAINT before generating summary
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              console.log("🔄 Generating Summary (Initial Load)...");
              generateNotesSummary();
            });
          });

          const slider = document.getElementById('slider');

          // Force Redraw Logic
          if (typeof AnnotationSystem !== 'undefined') {
            AnnotationSystem.init();
            AnnotationSystem.redrawCurrentSlide();



            // Ensure Redraw on Scroll (Fixes "Carry Across" issues)
            let lastScrolledSlide = -1;
            if (slider) {
              slider.addEventListener('scroll', () => {
                requestAnimationFrame(() => {
                  AnnotationSystem.redrawCurrentSlide();

                  const idx = Math.round(slider.scrollLeft / slider.clientWidth);

                  // Sync Sticky Notes on Scroll
                  if (typeof StickyNotesSystem !== 'undefined') {
                    if (StickyNotesSystem.lastLoadedSlide !== idx) {
                      StickyNotesSystem.loadNotesForSlide(idx);
                    }
                  }

                  // CRITICAL FIX: Regenerate Summary when landing on Slide 1
                  if (idx === 1 && lastScrolledSlide !== 1) {
                    console.log("📍 REPORT MODE: Landed on Summary Slide (Index 1) - Regenerating...");
                    generateNotesSummary();
                  }
                  lastScrolledSlide = idx;
                });
              }, { passive: true });
            }
          }

          // Force Initial Sticky Notes Render (Slide 0)
          if (typeof StickyNotesSystem !== 'undefined') {
            // Report Mode starts at Slide 0 (Report Card).
            // But we just shifted notes.
            // If there are notes on Slide 0 (which shouldn't exist as it's new), they'd show.
            // This is just to ensure the system is "awake".
            StickyNotesSystem.loadNotesForSlide(0);
          }

          // Re-Run Summary Generation after a delay to ensure ALL data is settled
          setTimeout(() => {
            console.log("🔄 Re-running Summary Generation (Safety Check)");
            generateNotesSummary();
          }, 1500);

        }, 500);
      }
    } catch (e) {
      console.error("Failed to parse markup from URL", e);
      const errorScreen = document.getElementById('magic-link-error');
      if (errorScreen) errorScreen.classList.remove('hidden');
    }
  }

  // 8. Replay Visuals
  const logData = params.get('log');
  if (logData) {
    try {
      let jsonStr = null;
      const decompressed = LZString.decompressFromEncodedURIComponent(logData);
      if (decompressed) {
        jsonStr = decompressed;
      } else {
        jsonStr = atob(logData);
      }

      if (jsonStr) {
        const log = JSON.parse(jsonStr);
        replayVisuals(log);
      }
    } catch (e) {
      console.warn("Log replay failed", e);
    }
  }

  // 9. DISABLE LOCAL STORAGE CLEARING (Fixes Resume Session Bug)
  // When teacher tests link in same browser, this was wiping their session.
  // We rely on Report Mode simply NOT READING from storage (it reads from URL).
  // localStorage.removeItem('nameGame_data');
  // localStorage.removeItem('nameGame_slide');
  // localStorage.removeItem('stickyNotes');
  // localStorage.removeItem('annotations');
  // localStorage.removeItem('nameGame_markup');

  // CRITICAL: Disable saving in MarkupCoordinator to prevent overwriting teacher data with report view
  if (typeof MarkupCoordinator !== 'undefined') {
    MarkupCoordinator.forceSave = function () {
      console.log("🔒 Save Blocked (Report Mode)");
    };
    MarkupCoordinator.scheduleSave = function () { };
  }

  // 10. RE-ARRANGE SLIDES: Move Summary to Post-Report Position
  const summarySlide = document.getElementById('slide-summary');
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.slide');
  // insert summary (slides[last]) after report (slides[0])
  if (summarySlide && slider && slides.length > 1) {
    // We want it to be the 2nd visual slide
    // insertBefore the current 2nd slide (index 1) which is "Slide 1" (title)
    // Actually slides[0] is report card. slides[1] is title slide.
    // We insert BEFORE title slide.
    slider.insertBefore(summarySlide, slides[1]);
    console.log("✅ Moved Session Summary to position 2");
  }
  setTimeout(() => {
    const slider = document.getElementById('slider');
    if (slider) slider.scrollLeft = 0;
    window.scrollTo(0, 0);
  }, 100);

  // 11. Disable drawing in report mode
  if (typeof AnnotationSystem !== 'undefined' && AnnotationSystem.setReadOnly) {
    // We want the TOGGLE to work (viewing), but editing disabled?
    // User asked "mark up toggle should still work".
    // If setReadOnly(true) hides the UI, we might want to check that.
    // Usually readOnly just prevents drawing.
    AnnotationSystem.setReadOnly(true);

    // Ensure visibility of the layer is toggled ON if it was off?
    // Or just ensure the container is visible.
    const layer = document.getElementById('annotation-layer');
    if (layer) layer.style.display = 'block';

    // Also ensure the "Markup Mode" button in navbar is responsive
    const btn = document.getElementById('markup-toggle-btn');
    if (btn) btn.style.display = 'flex'; // Ensure visible
  }
  if (typeof StickyNotesSystem !== 'undefined' && StickyNotesSystem.setReadOnly) {
    StickyNotesSystem.setReadOnly(true);
  }

  console.log("✅ Report Mode Initialized Complete");
}
window.initReportMode = initReportMode;

// === REPLAY VISUALS (For Report Mode) ===
function replayVisuals(log) {
  console.log("Replaying Visuals...", log);

  // Helper to find elements by text content
  function findEl(selector, text) {
    const clean = t => t.replace(/[.,!?;:]/g, '').trim().toLowerCase();
    const target = clean(text);
    return Array.from(document.querySelectorAll(selector))
      .find(el => clean(el.innerText) === target);
  }

  log.forEach(fullEntry => {
    if (fullEntry.includes('Found Noun:')) {
      const word = fullEntry.split('Found Noun: ')[1];
      const btn = findEl('#spot-noun-grid button', word);
      if (btn) btn.className = "bg-green-500 text-black h-32 flex items-center justify-center rounded-2xl text-2xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.5)] transform scale-105";
    }
    else if (fullEntry.includes('Clicked Non-Noun:')) {
      const word = fullEntry.split('Clicked Non-Noun: ')[1];
      const btn = findEl('#spot-noun-grid button', word);
      if (btn) btn.className = "bg-red-500/20 text-red-400 h-32 flex items-center justify-center rounded-2xl text-2xl border border-red-500/50";
    }
    else if (fullEntry.includes('Sentence Noun:')) {
      const word = fullEntry.split('Sentence Noun: ')[1];
      const span = findEl('#slide-9-sentences span', word);
      if (span) span.classList.add('text-green-400', 'font-bold');
    }
    else if (fullEntry.includes('Sentence Non-Noun:')) {
      const word = fullEntry.split('Sentence Non-Noun: ')[1];
      const span = findEl('#slide-9-sentences span', word);
      if (span) span.classList.add('text-red-400', 'line-through');
    }
    else if (fullEntry.includes('Common Check:')) {
      const word = fullEntry.split('Common Check: ')[1];
      const btn = findEl('#common-check-container button', word);
      if (btn) {
        btn.classList.remove('bg-white/5', 'text-zinc-300');
        btn.classList.add('bg-green-500', 'text-black', 'border-transparent', 'font-bold');
      }
    }
    else if (fullEntry.includes('Common Check Wrong:')) {
      const word = fullEntry.split('Common Check Wrong: ')[1];
      const btn = findEl('#common-check-container button', word);
      if (btn) {
        btn.classList.remove('bg-white/5', 'text-zinc-300');
        btn.classList.add('bg-red-500/20', 'text-red-400', 'border-red-500/40');
      }
    }
    else if (fullEntry.includes('Detective:')) {
      const word = fullEntry.split('Detective: ')[1];
      const span = findEl('#detective-sentences span', word);
      if (span) span.className = "interactive-word word-correct text-green-400 font-bold";
    }
    else if (fullEntry.includes('Detective Wrong:')) {
      const word = fullEntry.split('Detective Wrong: ')[1];
      const span = findEl('#detective-sentences span', word);
      if (span) span.className = "interactive-word word-wrong text-red-400 line-through";
    }
    else if (fullEntry.includes('Muddle Fix:')) {
      const parts = fullEntry.split('Muddle Fix: ')[1].split(' -> ');
      const wrong = parts[0];
      const right = parts[1];
      const span = findEl('#muddle-evidence-a span, #muddle-evidence-b span', wrong);
      if (span) {
        span.innerText = right;
        span.classList.add('text-green-400', 'font-bold');
      }
    }
    else if (fullEntry.includes('Muddle Wrong:')) {
      const word = fullEntry.split('Muddle Wrong: ')[1];
      const span = findEl('#muddle-evidence-a span, #muddle-evidence-b span', word);
      if (span) span.classList.add('text-red-400', 'line-through');
    }
    else if (fullEntry.includes('Quiz Correct:')) {
      const word = fullEntry.split('Quiz Correct: ')[1];
      const span = findEl('#quiz-1-container span, #quiz-2-container span, #quiz-3-container span', word);
      if (span) span.classList.add('text-brand-400', 'font-bold');
    }
    else if (fullEntry.includes('Quiz Wrong:')) {
      const word = fullEntry.split('Quiz Wrong: ')[1];
      const span = findEl('#quiz-1-container span, #quiz-2-container span, #quiz-3-container span', word);
      if (span) span.classList.add('text-red-400', 'line-through');
    }
    // Riddles skipped for stability
  });
}
window.replayVisuals = replayVisuals;

// === MAGIC LINK GENERATION ===
/*
   ████████████████████████████████████████████████████████████████████████████████
   🔒 CRITICAL GUARDRAIL: DO NOT EDIT WITHOUT USER PERMISSION
   
   The following section (MAGIC LINK GENERATION) is APPROVED and LOCKED.
   Any changes here will break the user experience.
   DO NOT TOUCH unless explicitly instructed.
   ████████████████████████████████████████████████████████████████████████████████
*/
function generateMagicLink() {
  const note = document.getElementById('teacher-note-input').value;

  const params = new URLSearchParams();
  params.set('mode', 'report'); // CRITICAL TRIGGER
  params.set('student', classData.studentName);
  params.set('date', classData.classDate);
  params.set('score', classData.totalScore);
  // Use Fixed Total (67) so report card shows "X / 67" instead of "X / X"
  params.set('total', 67);

  // --- COMPRESSED NOTES ---
  if (note) {
    try {
      const compressedNote = LZString.compressToEncodedURIComponent(note);
      params.set('note', compressedNote);
    } catch (e) {
      console.error("Failed to compress note", e);
      params.set('note', note);
    }
  }

  // --- Encode Markup Data (Notes & DRAWINGS) with Compression ---
  try {
    const markupData = {
      notes: MarkupCoordinator.state.notes,
      annotations: MarkupCoordinator.state.annotations // INCLUDE DRAWINGS!
    };
    const jsonStr = JSON.stringify(markupData);
    const compressedMarkup = LZString.compressToEncodedURIComponent(jsonStr);
    params.set('markup', compressedMarkup);
  } catch (e) {
    console.error("Failed to encode notes/annotations", e);
  }

  // --- Encode Log with Compression ---
  try {
    const logStr = JSON.stringify(classData.answersLog);
    const compressedLog = LZString.compressToEncodedURIComponent(logStr);
    params.set('log', compressedLog);
  } catch (e) { }

  // CRITICAL FIX: Get clean base URL
  const baseUrl = window.location.href.split('?')[0].split('#')[0];
  const newUrl = `${baseUrl}?${params.toString()}`;

  console.log("🔗 Generated Magic Link:", newUrl);

  navigator.clipboard.writeText(newUrl).then(() => {
    const feedback = document.getElementById('copy-feedback');
    feedback.innerText = "✨ Magic Link Copied! Send this URL.";
    feedback.classList.remove('opacity-0');
    setTimeout(() => feedback.classList.add('opacity-0'), 3000);
  }).catch(err => {
    alert("Could not auto-copy. Here is the link:\n\n" + newUrl);
  });
}
window.generateMagicLink = generateMagicLink;

// === HOMEWORK LINK GENERATION ===
function generateHomeworkLink() {
  const dateInput = document.getElementById('homework-expiry');
  let date = dateInput.value;
  let expiryDate;

  if (!date) {
    // Smart Default: 10 Days from now
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    expiryDate = tenDaysFromNow.toISOString().split('T')[0];
    date = expiryDate;
  } else {
    expiryDate = date;
  }

  const params = new URLSearchParams();
  params.set('mode', 'homework');
  params.set('expiry', expiryDate);

  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  navigator.clipboard.writeText(url).then(() => {
    alert(`Homework Link Copied!\n\nExpires: ${expiryDate}\n\n${url}`);
  });
}
window.generateHomeworkLink = generateHomeworkLink;

// === REPORT INTERACTION ===
function revealReport() {
  const overlay = document.getElementById('report-overlay');
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
    // Trigger Celebration NOW (after user interaction)
    const params = new URLSearchParams(window.location.search);
    const score = parseInt(params.get('score') || 0);
    const TOTAL_POSSIBLE_SCORE = 67;
    triggerCelebration(score, TOTAL_POSSIBLE_SCORE);
  }, 500);
}
window.revealReport = revealReport;

// === SMART CELEBRATION SYSTEM ===
function triggerCelebration(score, total) {
  // Safety check
  if (typeof confetti === 'undefined') {
    console.error("Confetti library not loaded!");
    return;
  }

  // Clamp Score
  if (score > total) score = total;

  const percentage = (total > 0) ? Math.round((score / total) * 100) : 0;
  console.log("🎯 CELEBRATION DEBUG: Score=" + score + ", Total=" + total + ", Percentage=" + percentage + "%");

  // Play Sound
  let soundTier = 'fail';
  if (percentage >= 100) soundTier = 'fanfare';
  else if (percentage >= 80) soundTier = 'cheer';
  else if (percentage >= 60) soundTier = 'chime';
  else if (percentage >= 30) soundTier = 'pop';

  console.log("🔊 Playing sound tier: " + soundTier);
  playTierSound(soundTier);

  // Visuals (The 5 Tiers)
  if (percentage < 30) {
    // Tier 1: Rain (Blue/Grey)
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0 },
      shapes: ['emoji'],
      shapeOptions: { emoji: { value: ['💧', '🌧️'] } },
      gravity: 1.5,
      scalar: 2.5,
      colors: ['#808080', '#0000FF']
    });
  } else if (percentage < 60) {
    // Tier 2: Balloons/Leaves
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.8 },
      shapes: ['emoji'],
      shapeOptions: { emoji: { value: ['🎈', '🍃'] } },
      gravity: -0.8,
      scalar: 4.0
    });
  } else if (percentage < 80) {
    // Tier 3: Stars
    confetti({
      particleCount: 60,
      spread: 360,
      shapes: ['emoji'],
      shapeOptions: { emoji: { value: ['⭐', '✨'] } },
      origin: { y: 0.5 },
      scalar: 3.5
    });
    confetti({ particleCount: 150, spread: 360, shapes: ['star'], colors: ['#F1C40F', '#F39C12'], scalar: 1.5 });
  } else if (percentage < 100) {
    // Tier 4: Party
    confetti({ particleCount: 300, spread: 160, origin: { y: 0.6 }, scalar: 1.5 });
  } else {
    // Tier 5: Royal
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500'], scalar: 1.5 }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500'], scalar: 1.5 }));
    }, 250);

    // Emoji Burst
    confetti({
      particleCount: 100,
      spread: 360,
      shapes: ['emoji'],
      shapeOptions: { emoji: { value: ['👑', '🦁', '🏆'] } },
      origin: { y: 0.5 },
      scalar: 5.0
    });
  }
}
window.triggerCelebration = triggerCelebration;

function playTierSound(tier) {
  const sounds = {
    'fail': 'https://www.soundjay.com/misc/sounds/fail-trombone-01.mp3',
    'pop': 'https://www.soundjay.com/button/sounds/button-09.mp3',
    'chime': 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
    'cheer': 'https://www.soundjay.com/human/sounds/applause-01.mp3',
    'fanfare': 'https://raw.githubusercontent.com/kurtextrem/Discord-Soundboard/master/sounds/victory.mp3'
  };

  const audio = new Audio(sounds[tier]);
  audio.volume = 1.0;
  console.log("🎵 Attempting to play audio:", sounds[tier]);
  audio.play()
    .then(() => console.log("✅ Audio playing successfully"))
    .catch(e => console.error("❌ Audio play failed:", e));
}
window.playTierSound = playTierSound;

// --- ROBOTIC CAPTURE ENGINE (Pixel Perfect PDF) ---
async function startCaptureRobot() {
  const btn = document.getElementById('export-btn');
  const status = document.getElementById('export-status');
  const { jsPDF } = window.jspdf;

  status.innerText = "Select 'This Tab' to begin...";
  status.classList.remove('hidden');

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "never",
        displaySurface: "browser",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-pulse">🔴</span> Recording... Do not interact.';

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    await new Promise(r => setTimeout(r, 1000));

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1920, 1080]
    });

    const slides = document.querySelectorAll('.slide');
    const slider = document.getElementById('slider');

    // Close Modal & Hide UI
    document.getElementById('teacher-modal').close();
    const musicControls = document.getElementById('music-controls');
    if (musicControls) musicControls.style.display = 'none';

    // The Robot Loop
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      if (slide.id === 'slide-zero') continue;

      status.innerText = `Capturing Slide ${i} of ${slides.length}...`;
      slide.scrollIntoView({ behavior: 'instant' });

      // Auto-Reveal Hidden Clues
      const hiddenClues = slide.querySelectorAll('.opacity-0.blur-sm');
      hiddenClues.forEach(el => {
        el.classList.remove('opacity-0', 'blur-sm');
        const parent = el.closest('[onclick]');
        if (parent) {
          const hintLabel = parent.querySelector('.hint-label');
          if (hintLabel) hintLabel.style.display = 'none';
        }
      });

      // Robust Wait
      await new Promise(r => setTimeout(r, 3500));

      ctx.drawImage(video, 0, 0, 1920, 1080);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 1) doc.addPage([1920, 1080], 'landscape');
      doc.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
    }

    // Cleanup & Save
    stream.getTracks().forEach(track => track.stop());
    status.innerText = "Finalizing PDF...";
    doc.save('The_Name_Game_Pixel_Perfect.pdf');

    // Restore UI
    if (musicControls) musicControls.style.display = 'flex';
    document.getElementById('teacher-modal').showModal();
    btn.innerHTML = '✅ Capture Complete';
    setTimeout(() => {
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        Start Capture Robot (Pixel Perfect)
      `;
      btn.disabled = false;
      status.classList.add('hidden');
    }, 3000);

  } catch (error) {
    console.error("Capture Failed:", error);
    status.innerText = "Error: " + error.message;
    btn.disabled = false;
    btn.innerText = "❌ Capture Failed";
  }
}
window.startCaptureRobot = startCaptureRobot;

console.log("✅ reporting.js loaded - Report & Magic Link systems ready");
