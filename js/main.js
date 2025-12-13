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

  // Check for Saved Data (Resume Logic)
  const savedData = localStorage.getItem('nameGame_data');

  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      const lobbyContent = document.querySelector('#lobby-screen .glass-panel .space-y-6');
      if (lobbyContent) {
        lobbyContent.innerHTML = `
          <div class="text-center">
            <p class="text-brand-400 font-body text-sm uppercase tracking-widest mb-4">Session Found</p>
            <h3 class="text-3xl text-brand-400 font-bold mb-8">Welcome back, ${data.studentName}!</h3>
            <button onclick="window.resumeSessionWithSound()" 
              class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-xl py-5 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all duration-300 mb-4 uppercase tracking-widest">
              Resume Session
            </button>
            <button onclick="startNewClass()" 
              class="w-full bg-white/5 border border-white/10 text-[#FDFDFD] font-bold text-lg py-4 rounded-xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest">
              Start New Class
            </button>
          </div>
        `;
      }
    } catch (e) {
      console.error("Resume data corrupt", e);
    }
  }

  // Show Lobby, Hide Report
  const lobby = document.getElementById('lobby-screen');
  const slideZero = document.getElementById('slide-zero');
  if (lobby) lobby.style.display = 'flex';
  if (slideZero) slideZero.classList.add('hidden');

  // 🎮 GAMIFICATION INIT
  // DO NOT auto-show character select here - let the Resume/New flow handle it
  // Character select is triggered by: startClass() if no character exists
  if (typeof GameEngine !== 'undefined') {
    const hasGameData = localStorage.getItem('nameGame_data');
    const hasCharacter = localStorage.getItem('nameGame_character');

    // Only show character select if this is a BRAND NEW user (no data at all)
    if (!hasGameData && !hasCharacter) {
      console.log("🎮 Brand new user - showing Character Select");
      setTimeout(() => GameEngine.showCharacterSelect(), 100);
    } else if (hasCharacter) {
      // Silently restore character data (HUD will show when startClass runs)
      console.log("🎮 Existing character found - restoring session data silently");
      GameEngine.restoreSession();
    }
    // If hasGameData but !hasCharacter: User will see Resume/New dialog
    // If they click Resume: resumeSession handles it
    // If they click Start New: clears data, reloads, then shows Character Select
  }


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

    gsap.to(lobby, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        if (lobby) lobby.style.display = 'none';
        if (viewport) viewport.classList.remove('opacity-0');
        if (nav) nav.classList.remove('opacity-0');

        if (savedSlide) {
          const slider = document.getElementById('slider');
          if (slider) {
            const slideWidth = slider.clientWidth;
            const idx = parseInt(savedSlide);
            slider.scrollLeft = idx * slideWidth;
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
            if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(idx);
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.redrawCurrentSlide();
          }
        }
      }
    });
  }
}
window.resumeSession = resumeSession;

// === START NEW CLASS ===
function startNewClass() {
  if (confirm("Are you sure? This will delete all progress.")) {
    localStorage.removeItem('nameGame_data');
    localStorage.removeItem('nameGame_slide');
    localStorage.removeItem('nameGame_character'); // Clear gamification data too
    if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.clearAll();
    localStorage.removeItem('stickyNotes');
    localStorage.removeItem('annotations');
    location.reload();
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
      lobby.style.display = 'none';
      viewport.classList.remove('opacity-0');
      nav.classList.remove('opacity-0');

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
          // Fallback if GSAP fails
          elements.forEach(el => el.style.opacity = 1);
        }
      }
    }
  });
}
window.startClass = startClass;

// === SLIDER LOGIC ===
const slider = document.getElementById('slider');
const counter = document.getElementById('slide-counter');
const totalSlides = 30;

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
  if (window.location.hash && slider) {
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

function nextSlide() {
  if (slider) {
    slider.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
    if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
  }
}
window.nextSlide = nextSlide;

// === KEYBOARD NAVIGATION ===
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (document.activeElement.getAttribute('contenteditable') === 'true') return;

  if (e.key === 'ArrowRight') {
    if (slider) {
      slider.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
      if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
    }
  } else if (e.key === 'ArrowLeft') {
    if (slider) {
      slider.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
      if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playSlide);
    }
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

