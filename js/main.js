// ═══════════════════════════════════════════════════════════════════════════════
// MAIN.JS - Application Router & UI Systems (MUST LOAD LAST)
// Contains: Router, Lobby Logic, Slider Navigation, Animations, Parallax
// Depends on: All other JS files (core, audio, canvas, games, reporting)
// ═══════════════════════════════════════════════════════════════════════════════

// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

// === MARKUP MODE TOGGLE ===
window.toggleMarkupMode = function () {
  document.body.classList.toggle('markup-hidden');
  const isHidden = document.body.classList.contains('markup-hidden');
  const indicator = document.getElementById('markup-indicator');

  if (indicator) {
    if (isHidden) {
      // OFF STATE (Gray/Dim)
      indicator.className = "w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/30 transition-all";
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      // ON STATE (Brand/Glow)
      indicator.className = "w-7 h-7 flex items-center justify-center rounded-full bg-brand-500 text-black transition-all shadow-[0_0_15px_rgba(45,212,191,0.5)]";
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
    }
  }
};

// === FULL SCREEN TOGGLE ===
// === FULL SCREEN TOGGLE ===
function toggleFullScreen() {
  const doc = window.document;
  const docEl = doc.documentElement;

  const requestFullScreen = docEl.requestFullscreen || docEl.webkitRequestFullScreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
  const cancelFullScreen = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    if (requestFullScreen) {
      requestFullScreen.call(docEl).catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  } else {
    if (cancelFullScreen) {
      cancelFullScreen.call(doc);
    }
  }
}
window.toggleFullScreen = toggleFullScreen;

// --- ROUTER / LAUNCH LOGIC ---
function launchApp(mode, params) {
  if (mode === 'report') {
    console.log("Entering Report Mode...");
    if (typeof initReportMode === 'function') {
      initReportMode(params);
    } else {
      console.warn("initReportMode not ready, retrying in 50ms...");
      setTimeout(() => launchApp(mode, params), 50);
    }
  } else {
    console.log("Entering Class Mode...");
    initClassMode();
  }
}
window.launchApp = launchApp;

// ... existing code ...

// === AUTO-LAUNCH ===
document.addEventListener('DOMContentLoaded', () => {
  // Check if we are in report mode or class mode
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  launchApp(mode, params);
});

// === CLASS MODE INITIALIZATION ===
function initClassMode() {
  console.log("🎮 initClassMode() starting...");

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLEANUP: Remove ?reset= param if present (added by startNewClass)
  // ═══════════════════════════════════════════════════════════════════════════════
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reset')) {
    console.log("🧹 Cleaning up reset parameter from URL");
    urlParams.delete('reset');
    const newUrl = urlParams.toString()
      ? window.location.pathname + '?' + urlParams.toString()
      : window.location.pathname;
    history.replaceState(null, '', newUrl);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRITICAL: SET GLOBAL LOBBY LOCK - Prevents ANY navigation until user chooses
  // ═══════════════════════════════════════════════════════════════════════════════
  window.LOBBY_ACTIVE = true;
  console.log("🔐 LOBBY_ACTIVE = true (navigation blocked)");

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRITICAL FIX: AGGRESSIVE LOBBY ENFORCEMENT
  // Force the correct visual state BEFORE any other initialization
  // ═══════════════════════════════════════════════════════════════════════════════
  const _lobby = document.getElementById('lobby-screen');
  const _viewport = document.getElementById('viewport-frame');
  const _slider = document.getElementById('slider');
  const _nav = document.querySelector('nav');

  // 1. FORCE VIEWPORT HIDDEN (add opacity-0 back if removed)
  if (_viewport) {
    _viewport.classList.add('opacity-0');
    _viewport.style.pointerEvents = 'none';
  }
  if (_nav) {
    _nav.classList.add('opacity-0');
  }

  // 2. FORCE LOBBY VISIBLE
  if (_lobby) {
    _lobby.style.display = 'flex';
    _lobby.style.visibility = 'visible';
    _lobby.style.opacity = '1';
    _lobby.style.pointerEvents = 'auto';
  }

  // 3. RESET SLIDER TO START (prevents mid-game position on refresh)
  if (_slider) {
    _slider.scrollLeft = 0;
    // Also prevent scroll during lobby - remove after lobby dismissal
    _slider.style.overflow = 'hidden';
  }

  // 4. CLEAR URL HASH to prevent restoreSlideFromHash from interfering
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  console.log("🔒 Lobby enforcement applied - viewport hidden, lobby visible, slider reset, hash cleared");
  // ═══════════════════════════════════════════════════════════════════════════════

  // SAFETY CHECK: If URL has mode=report, abort and switch to report mode
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || "");

  if (params.get('mode') === 'report' || hashParams.get('mode') === 'report') {
    const finalParams = new URLSearchParams();
    for (const [key, value] of params) finalParams.set(key, value);
    for (const [key, value] of hashParams) finalParams.set(key, value);
    if (typeof initReportMode === 'function') {
      initReportMode(finalParams);
    }
    return;
  }

  // Initialize Unified State
  if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.init();
  if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
  if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // SESSION DETECTION: Check for ANY saved state
  // Show Resume/New if EITHER savedData OR savedCharacter exists
  // ═══════════════════════════════════════════════════════════════════════════════
  const savedData = localStorage.getItem('nameGame_data');
  const savedCharacter = localStorage.getItem('nameGame_character');
  const savedSlide = localStorage.getItem('nameGame_slide');
  const savedMapData = localStorage.getItem('naming_game_map_v4') || localStorage.getItem('map_data');
  const lobbyContent = document.getElementById('lobby-content');

  // Determine if we have ANY saved progress
  const hasAnySavedState = savedData || savedCharacter || savedSlide || savedMapData;

  console.log("📊 Session Check:", {
    savedData: !!savedData,
    savedCharacter: !!savedCharacter,
    savedSlide: savedSlide,
    savedMapData: !!savedMapData,
    hasAnySavedState
  });

  if (hasAnySavedState && lobbyContent) {
    // User has SOME session data - ALWAYS show Resume / New Class options
    let playerName = "Agent";
    try {
      if (savedData) {
        const data = JSON.parse(savedData);
        playerName = data.studentName || "Agent";
      } else if (savedCharacter) {
        const charData = JSON.parse(savedCharacter);
        playerName = charData.playerName || "Agent";
      }
    } catch (e) {
      console.warn("Could not parse saved name", e);
    }

    lobbyContent.innerHTML = `
      <div class="glass-panel p-12 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.2)] max-w-2xl w-full text-center">
        <p class="text-brand-400 font-body text-sm uppercase tracking-widest mb-4">Session Found</p>
        <h3 class="text-3xl text-brand-400 font-bold mb-8 font-display">Welcome back, ${playerName}!</h3>
        <div class="space-y-4">
          <button onclick="window.resumeSessionWithSound()" 
            class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-xl py-5 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all duration-300 uppercase tracking-widest">
            Resume Session
          </button>
          <button onclick="window.startNewClass()" 
            class="w-full bg-white/5 border border-white/10 text-[#FDFDFD] font-bold text-lg py-4 rounded-xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest">
            Start New Class
          </button>
        </div>
      </div>
    `;
    console.log("🎮 Resume/New Class screen shown for:", playerName);
  } else if (typeof GameEngine !== 'undefined') {
    // Truly fresh start - no saved state at all - show Character Select
    console.log("🎮 Fresh start - showing Character Select");
    setTimeout(() => GameEngine.showCharacterSelect(), 100);
  }

  // Show Lobby, Hide Report
  const lobby = document.getElementById('lobby-screen');
  const slideZero = document.getElementById('slide-zero');
  if (lobby) lobby.style.display = 'flex';
  if (slideZero) slideZero.classList.add('hidden');



  // Auto-Save on Scroll & GHOST BUSTING TRANSITIONS
  let scrollTimeout;
  let isScrolling = false;
  let settleTimeout;

  const slider = document.getElementById('slider');

  // Layers to manage
  const getLayers = () => [
    document.getElementById('annotation-canvas'),
    document.getElementById('stamps-layer'),
    document.getElementById('sticky-notes-layer'),
    document.getElementById('text-comments-layer')
  ].filter(el => el);

  if (slider) {
    slider.addEventListener('scroll', () => {
      // 1. INSTANT HIDE (Ghost Busting)
      if (!isScrolling) {
        isScrolling = true;
        document.body.classList.add('is-scrolling'); // Optional CSS hook
        getLayers().forEach(l => l.classList.add('markup-ghost-hidden'));
        getLayers().forEach(l => l.classList.remove('markup-reveal')); // Reset anim

        // Stop any pending settle
        clearTimeout(settleTimeout);
      }

      // Existing Debounce Logic for Save
      clearTimeout(scrollTimeout);

      // 2. WAIT FOR SETTLE (The "Pause" before reveal)
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        document.body.classList.remove('is-scrolling');

        const slideWidth = slider.clientWidth;
        const index = Math.round(slider.scrollLeft / slideWidth);

        // --- MAP SYSTEM HOOK ---
        if (typeof MapSystem !== 'undefined') {
          MapSystem.updateButtonState(index); // Update button text based on slide

          // Also update current node if not already set or if slide moved to different node
          const nodeForSlide = MapSystem.findNodeBySlide(index);
          if (nodeForSlide && MapSystem.state.currentNode !== nodeForSlide.id) {
            // Only auto-update if the slide belongs to an unlocked node
            if (MapSystem.isNodeUnlocked(nodeForSlide.id)) {
              MapSystem.state.currentNode = nodeForSlide.id;
              MapSystem.saveProgress();
            }
          }
        }
        // --------------------

        // Update State
        const currentSaved = localStorage.getItem('nameGame_slide');
        if (currentSaved !== String(index)) {
          localStorage.setItem('nameGame_slide', index);
          if (typeof SoundFX !== 'undefined') SoundFX.playSlide();

          if (index === 32 && typeof generateNotesSummary === 'function') {
            generateNotesSummary();
          }
          // ALSO Trigger on Slide 1 (New Location of Summary in Report Mode)
          if (index === 1 && typeof generateNotesSummary === 'function') {
            console.log("📍 Landed on Summary Slide (Index 1) - Regenerating...");
            generateNotesSummary();
          }
        }

        // 3. UPDATE CONTENT (Hidden)
        if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(index);
        if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.redrawCurrentSlide();

        // 4. MAGICAL REVEAL (Delayed)
        // User said: "wait for the user to settle... like the slide animations"
        settleTimeout = setTimeout(() => {
          // Reveal!
          getLayers().forEach(l => l.classList.remove('markup-ghost-hidden'));
          getLayers().forEach(l => l.classList.add('markup-reveal'));

          // Play Magical Sound
          if (typeof SoundFX !== 'undefined') {
            // Longer Chime (1-2s)
            SoundFX._play(SoundFX.playChime);
          }
        }, 600); // 600ms Settle Delay

      }, 150); // 150ms Scroll Debounce
    }, { passive: true });
  }
}

window.initClassMode = initClassMode;

// === RESUME SESSION LOGIC ===
window.resumeSessionWithSound = function () {
  if (typeof SoundFX !== 'undefined') {
    SoundFX.init();
    SoundFX.unlock();
  }
  if (typeof initJukebox === 'function') initJukebox();
  resumeSession();
}

function resumeSession() {
  console.log("🎮 resumeSession() called - unlocking lobby");

  // 🎮 GAMIFICATION: Restore HUD when resuming
  if (typeof GameEngine !== 'undefined') {
    GameEngine.restoreSession();
  }

  const savedData = localStorage.getItem('nameGame_data');
  const savedSlide = localStorage.getItem('nameGame_slide');

  if (savedData) {
    classData = JSON.parse(savedData);
    if (typeof replayVisuals === 'function') replayVisuals(classData.answersLog);

    const lobby = document.getElementById('lobby-screen');
    const viewport = document.getElementById('viewport-frame');
    const nav = document.querySelector('nav');
    const slider = document.getElementById('slider');

    gsap.to(lobby, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        // ═══════════════════════════════════════════════════════════════════════════════
        // CRITICAL: Clear lobby lock and re-enable slider
        // ═══════════════════════════════════════════════════════════════════════════════
        window.LOBBY_ACTIVE = false;
        console.log("🔓 LOBBY_ACTIVE = false (navigation unlocked)");

        if (lobby) lobby.style.display = 'none';
        if (viewport) {
          viewport.classList.remove('opacity-0');
          viewport.style.pointerEvents = 'auto';
        }
        if (nav) nav.classList.remove('opacity-0');

        // Re-enable slider scrolling
        if (slider) {
          slider.style.overflow = '';
        }

        if (savedSlide) {
          if (slider) {
            const slideWidth = slider.clientWidth;
            const idx = parseInt(savedSlide);
            slider.scrollLeft = idx * slideWidth;
            console.log(`📍 Restored to slide ${idx}`);
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
            if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(idx);
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.redrawCurrentSlide();
          }
        }
      }
    });
  } else {
    // No saved data but user clicked resume - just start fresh
    console.warn("⚠️ No savedData found during resume - starting fresh");
    window.LOBBY_ACTIVE = false;
    if (typeof GameEngine !== 'undefined') {
      GameEngine.showCharacterSelect();
    }
  }
}
window.resumeSession = resumeSession;

// === START NEW CLASS ===
// === START NEW CLASS ===
function startNewClass() {
  if (confirm("Are you sure? This will delete ALL progress and start completely fresh.")) {
    console.log("🧹 NUCLEAR RESET: Clearing ALL game state...");

    // ═══════════════════════════════════════════════════════════════════════════════
    // NUCLEAR RESET - Clear absolutely everything
    // ═══════════════════════════════════════════════════════════════════════════════

    // 1. Clear all game data keys
    const keysToRemove = [
      'nameGame_data',
      'nameGame_slide',
      'nameGame_character',
      'map_data',
      'naming_game_map_v4',
      'naming_game_map_v2',
      'naming_game_map',
      'stickyNotes',
      'annotations',
      'nameGame_markup',
      'gameEngine_state',
      'classData'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✓ Removed: ${key}`);
    });

    // 2. Clear any keys that might have been created with dynamic names
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('nameGame_') ||
        key.startsWith('naming_game_') ||
        key.startsWith('map_') ||
        key.startsWith('game_')) {
        localStorage.removeItem(key);
        console.log(`  ✓ Removed dynamic key: ${key}`);
      }
    });

    // 3. Clear markup data
    if (typeof MarkupCoordinator !== 'undefined') {
      try { MarkupCoordinator.clearAll(); } catch (e) { }
    }

    // 4. Reset MapSystem if it exists
    if (typeof MapSystem !== 'undefined') {
      try { MapSystem.resetProgress(); } catch (e) { }
    }

    // 5. Reset GameEngine if it exists
    if (typeof GameEngine !== 'undefined') {
      try {
        GameEngine.active = false;
        GameEngine.config = {
          characterId: null,
          currentHealth: 100,
          maxHealth: 100,
          crystals: 0,
          comboCount: 0,
          powerups: {}
        };
      } catch (e) { }
    }

    // 6. Clear URL hash
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }

    // 7. Clear session storage too
    try { sessionStorage.clear(); } catch (e) { }

    console.log("🧹 NUCLEAR RESET COMPLETE - Reloading...");

    // 8. Force hard reload (bypass cache)
    location.href = location.pathname + '?reset=' + Date.now();
  }
}
window.startNewClass = startNewClass;

// === START CLASS (From Lobby) ===
function startClass() {
  const nameInput = document.getElementById('student-name');
  const dateInput = document.getElementById('class-date');
  const viewport = document.getElementById('viewport-frame');
  const nav = document.querySelector('nav');
  const lobby = document.getElementById('lobby-screen');

  // 🎮 GAMIFICATION: Check if character is selected first
  if (typeof GameEngine !== 'undefined' && !GameEngine.config.characterId) {
    const hasCharacter = localStorage.getItem('nameGame_character');
    if (!hasCharacter) {
      console.log("🎮 No character - redirecting to Character Select");
      GameEngine.showCharacterSelect();
      return; // Don't proceed with startClass until character is chosen
    }
  }

  if (!nameInput.value || !dateInput.value) {
    alert("Please enter both your Name and the Date to start!");
    return;
  }

  classData.studentName = nameInput.value;
  classData.classDate = dateInput.value;

  // Clear legacy data
  localStorage.removeItem('stickyNotes');
  localStorage.removeItem('annotations');
  localStorage.removeItem('nameGame_markup');
  localStorage.removeItem('nameGame_slide');

  if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.clearAll();
  if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.clearAll();

  if (typeof saveProgress === 'function') saveProgress();

  // --- SOUND FIX: Initialize Audio Context on User Interaction ---
  try {
    console.log("🔊 Initializing Sound System...");
    if (typeof SoundFX !== 'undefined') {
      SoundFX.init();
      SoundFX.unlock();
    }
    if (typeof initJukebox === 'function') {
      initJukebox();
    }
  } catch (e) {
    console.error("Audio init warning:", e);
  }

  // Force Scroll to Start
  const slider = document.getElementById('slider');
  if (slider) slider.scrollLeft = 0;

  // Animate Lobby Out
  gsap.to(lobby, {
    opacity: 0,
    duration: 0.8,
    onComplete: () => {
      // ═══════════════════════════════════════════════════════════════════════════════
      // CRITICAL: Clear lobby lock to allow navigation
      // ═══════════════════════════════════════════════════════════════════════════════
      window.LOBBY_ACTIVE = false;
      console.log("🔓 LOBBY_ACTIVE = false (navigation unlocked via startClass)");

      lobby.style.display = 'none';
      viewport.classList.remove('opacity-0');
      viewport.style.pointerEvents = 'auto';
      nav.classList.remove('opacity-0');

      // Re-enable slider scrolling
      const slider = document.getElementById('slider');
      if (slider) slider.style.overflow = '';

      // Init Canvas Systems
      if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
      if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(0);

      // --- BLANK SCREEN FIX: Manual Wake Up Call ---
      // We manually force the first slide to be 'active' and animate it
      // in case the IntersectionObserver is too slow or missed it.
      const firstSlide = document.getElementById('slide-0');
      if (firstSlide) {
        firstSlide.classList.add('active');
        const elements = firstSlide.querySelectorAll('h1, h2, p, .glass-panel, img, button, .anim-entry');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(elements,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)", overwrite: true }
          );
        } else {
          elements.forEach((el, index) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        }
      }

      // --- MAP SYSTEM INTRO DISABLED ---
      // The map should NOT auto-trigger. User must click "START JOURNEY" button.
    }
  });
}
window.startClass = startClass;

// === SLIDER LOGIC ===
const slider = document.getElementById('slider');
const counter = document.getElementById('slide-counter');
const totalSlides = 37; // Updated for Canonical Master Plan v1.0

function updateCounter() {
  if (!slider || !counter) return;
  const scrollPos = slider.scrollLeft;
  const width = slider.offsetWidth;
  const current = Math.round(scrollPos / width) + 1;
  counter.innerText = `${current.toString().padStart(2, '0')} / ${totalSlides}`;

  // Update URL hash without jumping
  const slideId = `slide-${current - 1}`;
  if (window.location.hash !== `#${slideId}`) {
    history.replaceState(null, null, `#${slideId}`);
  }
}

if (slider) {
  slider.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateCounter);
  });
}

// Disable browser's default scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function restoreSlideFromHash() {
  // 🛑 BLOCK if global lobby lock is active
  if (window.LOBBY_ACTIVE) {
    console.log("🛑 restoreSlideFromHash BLOCKED - LOBBY_ACTIVE is true");
    return;
  }

  if (window.location.hash && slider) {
    // 🛑 BLOCK SCROLL if Lobby is Visible (backup check)
    const lobby = document.getElementById('lobby-screen');
    if (lobby && getComputedStyle(lobby).display !== 'none' && getComputedStyle(lobby).opacity !== '0') {
      console.log("🛑 restoreSlideFromHash BLOCKED - Lobby is visible");
      return;
    }

    const targetId = window.location.hash.substring(1);
    const match = targetId.match(/slide-(\d+)/);
    if (match) {
      const slideNumber = parseInt(match[1], 10);
      const scrollLeft = slideNumber * window.innerWidth;
      slider.scrollTo({
        left: scrollLeft,
        behavior: 'auto'
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreSlideFromHash);
} else {
  restoreSlideFromHash();
}
window.addEventListener('load', restoreSlideFromHash);

// === NAVIGATION GUARD SYSTEM (Map Integration - Batch 3) ===

/**
 * Get the current slide index
 */
function getCurrentSlideIndex() {
  const slider = document.getElementById('slider');
  if (!slider) return 0;
  return Math.round(slider.scrollLeft / slider.clientWidth);
}

/**
 * Get the maximum unlocked slide index based on MapSystem state
 */
function getMaxUnlockedSlide() {
  if (typeof MapSystem === 'undefined') return Infinity;

  let maxSlide = 0;

  // Find the highest slide index among all unlocked nodes
  Object.values(MapSystem.mapNodes).forEach(node => {
    const isUnlocked = MapSystem.isNodeUnlocked(node.id);
    const isCompleted = MapSystem.state.completedNodes.includes(node.id);

    if ((isUnlocked || isCompleted) && node.slides && node.slides.length > 0) {
      const nodeMaxSlide = Math.max(...node.slides);
      if (nodeMaxSlide > maxSlide) {
        maxSlide = nodeMaxSlide;
      }
    }
  });

  return maxSlide;
}

/**
 * Check if navigation to a target slide is allowed
 * @param {number} targetIndex - The slide index we want to navigate to
 * @returns {object} - { allowed: boolean, reason: string }
 */
function canNavigateTo(targetIndex) {
  const currentIndex = getCurrentSlideIndex();

  // BACKWARD FREE ROAM: Always allow going backward
  if (targetIndex < currentIndex) {
    // Stop flash when going backward
    if (typeof MapSystem !== 'undefined') MapSystem.stopFlashMapButton();
    return { allowed: true, reason: 'backward' };
  }

  // If MapSystem not available, allow all navigation
  if (typeof MapSystem === 'undefined') {
    return { allowed: true, reason: 'no-map-system' };
  }

  // GATED SLIDE CHECK: Is the user on a gate slide (Exit Ticket, Boss, etc)?
  if (MapSystem.isGatedSlide(currentIndex)) {
    // Flash the map button to indicate that's the only way forward
    MapSystem.flashMapButton();
    return { allowed: false, reason: 'gated', slideIndex: currentIndex };
  }

  // Check if target is beyond max unlocked slide
  const maxUnlocked = getMaxUnlockedSlide();
  if (targetIndex > maxUnlocked) {
    return { allowed: false, reason: 'locked', maxUnlocked };
  }

  // Check if we're at the last slide of current node
  const currentNodeId = MapSystem.state.currentNode;
  if (currentNodeId) {
    const currentNode = MapSystem.mapNodes[currentNodeId];
    if (currentNode && currentNode.slides && currentNode.slides.length > 0) {
      const lastSlideOfNode = currentNode.slides[currentNode.slides.length - 1];

      // If trying to go past the last slide of current node
      if (currentIndex === lastSlideOfNode && targetIndex > lastSlideOfNode) {
        MapSystem.flashMapButton();
        return { allowed: false, reason: 'node-exit', nodeId: currentNodeId, node: currentNode };
      }
    }
  }

  return { allowed: true, reason: 'ok' };
}

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
    if (SoundFX.playLocked) SoundFX.playLocked();
    else if (SoundFX.playPop) SoundFX.playPop(); // fallback
  }

  // 4. SMALL TEXT INDICATOR (non-intrusive)
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

/**
 * Return to the map view - called when completing a node
 */
function returnToMap(completedNodeId) {
  console.log(`🗺️ Returning to map after completing: ${completedNodeId}`);

  // Mark node as complete in MapSystem
  if (typeof MapSystem !== 'undefined' && completedNodeId) {
    MapSystem.completeNode(completedNodeId);
  }

  // Fade viewport and show map via MapSystem API
  const viewport = document.getElementById('viewport-frame');

  if (viewport && typeof gsap !== 'undefined') {
    gsap.to(viewport, {
      opacity: 0.3,
      duration: 0.5
    });
  }

  // Use MapSystem API to show map (handles #world-map-overlay)
  if (typeof MapSystem !== 'undefined') {
    MapSystem.show();

    // Animate token to completed node after map is visible
    setTimeout(() => {
      MapSystem.movePlayerToNode(completedNodeId, true);
      MapSystem.updateMapToken();

      // If next is a hub, animate to hub after short delay
      const node = MapSystem.mapNodes[completedNodeId];
      if (node) {
        Object.values(MapSystem.mapNodes).forEach(childNode => {
          if (childNode.parents && childNode.parents.includes(completedNodeId)) {
            if (childNode.type === 'hub') {
              setTimeout(() => {
                MapSystem.movePlayerToNode(childNode.id, true);
              }, 1200);
            }
          }
        });
      }
    }, 500);
  }

  // Play map sound
  if (typeof SoundFX !== 'undefined' && SoundFX.playPop) {
    SoundFX.playPop();
  }
}
window.returnToMap = returnToMap;

/**
 * Hide map and return to slides
 */
function returnToSlides() {
  const viewport = document.getElementById('viewport-frame');

  // Use MapSystem API to hide map (handles #world-map-overlay)
  if (typeof MapSystem !== 'undefined') {
    MapSystem.hide();
  }

  // Restore viewport opacity
  if (viewport && typeof gsap !== 'undefined') {
    gsap.to(viewport, {
      opacity: 1,
      duration: 0.3
    });
  }
}
window.returnToSlides = returnToSlides;

/**
 * Navigate to next slide with MAP PROGRESSION LOGIC
 */
function nextSlide() {
  const slider = document.getElementById('slider');
  if (!slider) return;

  const currentIndex = getCurrentSlideIndex();
  const targetIndex = currentIndex + 1;

  // 1. CHECK GUARD: Is the user allowed to go here?
  const navCheck = canNavigateTo(targetIndex);

  if (!navCheck.allowed) {
    if (navCheck.reason === 'locked') {
      showLockedAlert();
      return;
    }

    // 2. END OF NODE DETECTION: The user hit the "invisible wall" at the end of a level
    if (navCheck.reason === 'node-exit') {
      console.log("🛑 End of Node Reached. Triggering Map Progression...");

      // A. Open Map
      returnToMap(navCheck.nodeId);

      // B. Wait for Map to Open, then Animate Token to Next Node
      setTimeout(() => {
        // Identify the NEXT node based on the current one
        const currentNode = MapSystem.mapNodes[navCheck.nodeId];
        // Find a node that lists the current one as a parent
        const nextNodeEntry = Object.values(MapSystem.mapNodes).find(n => n.parents.includes(navCheck.nodeId));

        if (nextNodeEntry) {
          console.log(`🚀 Animating Token: ${navCheck.nodeId} -> ${nextNodeEntry.id}`);
          MapSystem.movePlayerToNode(nextNodeEntry.id, true);

          // C. After Animation, Enter the Next Node's Slides
          setTimeout(() => {
            MapSystem.enterNode(nextNodeEntry.id);
          }, 2500); // Wait for token animation
        }
      }, 1000); // Wait for map to open
      return;
    }
  }

  // 3. NORMAL NAVIGATION (Within the same level)
  const slideWidth = slider.clientWidth;
  slider.scrollTo({ left: targetIndex * slideWidth, behavior: 'smooth' });

  if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
}
window.nextSlide = nextSlide;

/**
 * Navigate to previous slide (always allowed - free roam backward)
 */
function prevSlide() {
  const slider = document.getElementById('slider');
  if (!slider) return;

  slider.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
  if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
}
window.prevSlide = prevSlide;

// Updated Keydown Listener
document.addEventListener('keydown', (e) => {
  // Ignore inputs
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (document.activeElement.getAttribute('contenteditable') === 'true') return;

  // Check if map is open
  const isMapOpen = document.getElementById('world-map-overlay') &&
    !document.getElementById('world-map-overlay').classList.contains('translate-y-full');

  if (isMapOpen) return; // Block keys while map is doing its thing

  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    nextSlide(); // Uses the new Guard Logic
  } else if (e.key === 'ArrowLeft') {
    prevSlide(); // Backward is always free
  }
});

// === MOUSE GLOW ===
const frame = document.getElementById('viewport-frame');
const glow = document.getElementById('mouse-glow');

if (frame && glow) {
  frame.addEventListener('mousemove', (e) => {
    const rect = frame.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
  });
}

// === INTERSECTION OBSERVER FOR SLIDE ANIMATIONS ===
const observerOptions = {
  root: null,
  threshold: 0.3
};

const slideObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');

      // 1. Headings
      const headings = entry.target.querySelectorAll('h1, h2, .font-display');
      if (headings.length > 0 && typeof gsap !== 'undefined') {
        headings.forEach((h, i) => {
          gsap.to(h, {
            opacity: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1.2,
            delay: 0.3 + (i * 0.15),
            ease: "power2.out",
            overwrite: 'auto',
            force3D: true
          });
        });
      }

      // 2. Body Text
      const bodyText = entry.target.querySelectorAll('p, li, .font-body');
      if (bodyText.length > 0 && typeof gsap !== 'undefined') {
        gsap.fromTo(bodyText,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
            overwrite: 'auto',
            delay: 0.5
          }
        );
      }

      // 3. Others
      const others = Array.from(entry.target.querySelectorAll('.glass-panel, img, button, .anim-entry'))
        .filter(el => !el.matches('h1, h2, .font-display, p, li, .font-body'));

      if (others.length > 0 && typeof gsap !== 'undefined') {
        gsap.fromTo(others,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.05,
            ease: "power2.out",
            overwrite: 'auto',
            delay: 0.4
          }
        );
      }

    } else {
      entry.target.classList.remove('active');
    }
  });
}, observerOptions);

document.querySelectorAll('.slide').forEach(slide => {
  slideObserver.observe(slide);
});

// === PARALLAX SYSTEM ===
(function initParallax() {
  const parallaxLayers = document.querySelectorAll('.parallax-layer');
  const particleContainer = document.getElementById('parallax-particles');
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  function createParticles() {
    const particleCount = 50;
    if (!particleContainer) return;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.animationDuration = `${15 + Math.random() * 20}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particleContainer.appendChild(particle);
    }
  }

  function handleMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function updateParallax() {
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed || 1);
      const moveX = targetX * 30 * speed;
      const moveY = targetY * 30 * speed;
      layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    requestAnimationFrame(updateParallax);
  }

  createParticles();
  document.addEventListener('mousemove', handleMouseMove);
  updateParallax();
})();

console.log("✅ main.js loaded - Application ready");

// === AUTO-LAUNCH ===

