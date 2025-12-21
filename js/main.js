// ═══════════════════════════════════════════════════════════════════════════════
// MAIN.JS - Stabilized V4.1
// Removed "Ghost Busting" to fix Slide Corruption
// Kept Lobby Enforcement for Stability
// ═══════════════════════════════════════════════════════════════════════════════

// Initialize Lucide Icons
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

window.toggleMarkupMode = function () {
  document.body.classList.toggle('markup-hidden');
  const isHidden = document.body.classList.contains('markup-hidden');
  const indicator = document.getElementById('markup-indicator');
  if (indicator) {
    if (isHidden) {
      indicator.className = "w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/30 transition-all";
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      indicator.className = "w-7 h-7 flex items-center justify-center rounded-full bg-brand-500 text-black transition-all shadow-[0_0_15px_rgba(45,212,191,0.5)]";
      indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
    }
  }
};

function launchApp(mode, params) {
  if (mode === 'report') {
    if (typeof initReportMode === 'function') initReportMode(params);
    else setTimeout(() => launchApp(mode, params), 50);
  } else {
    initClassMode();
  }
}
window.launchApp = launchApp;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  launchApp(mode, params);
});

function initClassMode() {
  console.log("🎮 initClassMode() starting...");
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('reset')) {
    urlParams.delete('reset');
    const newUrl = urlParams.toString() ? window.location.pathname + '?' + urlParams.toString() : window.location.pathname;
    history.replaceState(null, '', newUrl);
  }

  window.LOBBY_ACTIVE = true;
  const _lobby = document.getElementById('lobby-screen');
  const _viewport = document.getElementById('viewport-frame');
  const _slider = document.getElementById('slider');
  const _nav = document.querySelector('nav');

  if (_viewport) { _viewport.classList.add('opacity-0'); _viewport.style.pointerEvents = 'none'; }
  if (_nav) _nav.classList.add('opacity-0');
  if (_lobby) { _lobby.style.display = 'flex'; _lobby.style.visibility = 'visible'; _lobby.style.opacity = '1'; _lobby.style.pointerEvents = 'auto'; }
  if (_slider) { _slider.scrollLeft = 0; _slider.style.overflow = 'hidden'; }
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);

  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'report') {
    if (typeof initReportMode === 'function') initReportMode(params);
    return;
  }

  if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.init();
  if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
  if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(0);

  const savedData = localStorage.getItem('nameGame_data');
  const savedCharacter = localStorage.getItem('nameGame_character');
  const savedSlide = localStorage.getItem('nameGame_slide');
  const savedMapData = localStorage.getItem('naming_game_map_v4');
  const lobbyContent = document.getElementById('lobby-content');
  const hasAnySavedState = savedData || savedCharacter || savedSlide || savedMapData;

  if (hasAnySavedState && lobbyContent) {
    let playerName = "Agent";
    try {
      if (savedData) playerName = JSON.parse(savedData).studentName || "Agent";
      else if (savedCharacter) playerName = JSON.parse(savedCharacter).playerName || "Agent";
    } catch (e) { }

    lobbyContent.innerHTML = `
      <div class="glass-panel p-12 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.2)] max-w-2xl w-full text-center">
        <p class="text-brand-400 font-body text-sm uppercase tracking-widest mb-4">Session Found</p>
        <h3 class="text-3xl text-brand-400 font-bold mb-8 font-display">Welcome back, ${playerName}!</h3>
        <div class="space-y-4">
          <button onclick="window.resumeSessionWithSound()" class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-xl py-5 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all duration-300 uppercase tracking-widest">Resume Session</button>
          <button onclick="window.startNewClass()" class="w-full bg-white/5 border border-white/10 text-[#FDFDFD] font-bold text-lg py-4 rounded-xl hover:bg-white/10 transition-all duration-300 uppercase tracking-widest">Start New Class</button>
        </div>
      </div>`;
  } else if (typeof GameEngine !== 'undefined') {
    setTimeout(() => GameEngine.showCharacterSelect(), 100);
  }

  const lobby = document.getElementById('lobby-screen');
  const slideZero = document.getElementById('slide-0');
  if (lobby) lobby.style.display = 'flex';
  // Removed slideZero.classList.add('hidden') to ensure SlideRegistry includes it

  // --- SCROLL HANDLING moved to js/navigation_guards.js to fix "Ghosting" ---
}
window.initClassMode = initClassMode;

window.resumeSessionWithSound = function () {
  if (typeof SoundFX !== 'undefined') { SoundFX.init(); SoundFX.unlock(); }
  if (typeof initJukebox === 'function') initJukebox();
  resumeSession();
}

function resumeSession() {
  if (typeof GameEngine !== 'undefined') GameEngine.restoreSession();
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
      opacity: 0, duration: 0.8, onComplete: () => {
        window.LOBBY_ACTIVE = false;
        if (lobby) lobby.style.display = 'none';
        if (viewport) { viewport.classList.remove('opacity-0'); viewport.style.pointerEvents = 'auto'; }
        if (nav) nav.classList.remove('opacity-0');
        if (slider) slider.style.overflow = '';
        if (typeof window.dismissIntro === 'function') window.dismissIntro();

        if (window.SlideRegistry) SlideRegistry.rebuild();
        if (!restoreBySlideKey()) {
          if (savedSlide && slider) {
            const idx = parseInt(savedSlide);
            slider.scrollLeft = idx * slider.clientWidth;
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
            if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(idx);
            if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.redrawCurrentSlide();
          }
        }
      }
    });
  } else {
    window.LOBBY_ACTIVE = false;
    if (typeof GameEngine !== 'undefined') GameEngine.showCharacterSelect();
  }
}
window.resumeSession = resumeSession;

function startNewClass() {
  if (confirm("Are you sure? This will delete ALL progress.")) {
    const keysToRemove = ['nameGame_data', 'nameGame_slide', 'nameGame_character', 'map_data', 'naming_game_map_v4', 'stickyNotes', 'annotations', 'nameGame_markup', 'gameEngine_state', 'classData'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (typeof MarkupCoordinator !== 'undefined') try { MarkupCoordinator.clearAll(); } catch (e) { }
    if (typeof MapSystem !== 'undefined') try { MapSystem.resetProgress(); } catch (e) { }
    if (typeof GameEngine !== 'undefined') try { GameEngine.active = false; GameEngine.config = { characterId: null, currentHealth: 100, maxHealth: 100, crystals: 0, comboCount: 0, powerups: {} }; } catch (e) { }
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
    location.href = location.pathname + '?reset=' + Date.now();
  }
}
window.startNewClass = startNewClass;

function startClass() {
  const nameInput = document.getElementById('student-name');
  const dateInput = document.getElementById('class-date');
  const viewport = document.getElementById('viewport-frame');
  const nav = document.querySelector('nav');
  const lobby = document.getElementById('lobby-screen');

  if (typeof GameEngine !== 'undefined' && !GameEngine.config.characterId) {
    if (!localStorage.getItem('nameGame_character')) { GameEngine.showCharacterSelect(); return; }
  }
  if (!nameInput.value || !dateInput.value) { alert("Please enter Name and Date!"); return; }

  classData.studentName = nameInput.value;
  classData.classDate = dateInput.value;
  localStorage.removeItem('stickyNotes'); localStorage.removeItem('annotations'); localStorage.removeItem('nameGame_markup'); localStorage.removeItem('nameGame_slide');
  if (typeof MarkupCoordinator !== 'undefined') MarkupCoordinator.clearAll();
  if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.clearAll();
  if (typeof saveProgress === 'function') saveProgress();

  if (typeof SoundFX !== 'undefined') { SoundFX.init(); SoundFX.unlock(); }
  if (typeof initJukebox === 'function') initJukebox();

  const slider = document.getElementById('slider');
  if (slider) slider.scrollLeft = 0;

  gsap.to(lobby, {
    opacity: 0, duration: 0.8, onComplete: () => {
      window.LOBBY_ACTIVE = false;
      lobby.style.display = 'none';
      viewport.classList.remove('opacity-0'); viewport.style.pointerEvents = 'auto';
      nav.classList.remove('opacity-0');
      if (slider) slider.style.overflow = '';
      if (typeof AnnotationSystem !== 'undefined') AnnotationSystem.init();
      if (typeof StickyNotesSystem !== 'undefined') StickyNotesSystem.loadNotesForSlide(0);

      const firstSlide = document.getElementById('slide-0');
      if (firstSlide) {
        firstSlide.classList.remove('hidden');
        firstSlide.classList.add('active');
        const elements = firstSlide.querySelectorAll('h1, h2, p, .glass-panel, img, button, .anim-entry');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(elements, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)", overwrite: true });
        } else {
          elements.forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
        }
      }
    }
  });
}
window.startClass = startClass;

const slider = document.getElementById('slider');
const counter = document.getElementById('slide-counter');
const DISPLAY_TOTAL = 32;

function updateCounter() {
  if (!slider || !counter) return;

  const currentIndex = (window.SlideRegistry ? window.SlideRegistry.getCurrentIndex() : 0);
  const slides = (window.SlideRegistry ? window.SlideRegistry.getSlides() : []);

  if (window.SlideRegistry && (!SlideRegistry.slides || !SlideRegistry.slides.length)) {
    SlideRegistry.rebuild();
  }

  const currentSlideEl = slides[currentIndex];
  const key = currentSlideEl?.dataset?.slideKey || "";

  const label = window.SlideRegistry?.LABEL_BY_KEY?.[key] || null;

  let displayLabel;
  if (!label) {
    // If no explicit label, try to show the dynamic index
    displayLabel = String(currentIndex + 1).padStart(2, "0");
  } else {
    displayLabel = (label === "—") ? label : String(label).padStart(2, "0");
  }

  counter.innerText = `${displayLabel} / ${window.SlideRegistry?.DISPLAY_TOTAL ?? 32}`;

  saveCurrentSlideKey();
}

function saveCurrentSlideKey() {
  if (!window.SlideRegistry) return;

  const key = window.SlideRegistry.getCurrentKey();
  if (key) localStorage.setItem("nameGame_slide_key", key);
}

function restoreBySlideKey() {
  const key = localStorage.getItem("nameGame_slide_key");
  if (!key || !window.SlideRegistry?.idx) return false;

  const idx = window.SlideRegistry.idx(key);
  if (!Number.isInteger(idx)) return false;

  // Use your existing go-to-slide/scroll function; do NOT create a new navigation system.
  slider.scrollTo({ left: idx * (slider.clientWidth || window.innerWidth), behavior: "auto" });
  return true;
}
if (slider) slider.addEventListener('scroll', () => window.requestAnimationFrame(updateCounter));
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function restoreSlideFromHash() {
  if (window.LOBBY_ACTIVE) return;
  if (window.location.hash && slider) {
    const lobby = document.getElementById('lobby-screen');
    if (lobby && getComputedStyle(lobby).display !== 'none' && getComputedStyle(lobby).opacity !== '0') return;
    const targetId = window.location.hash.substring(1);
    const match = targetId.match(/slide-(\d+)/);
    if (match) {
      const slideNumber = parseInt(match[1], 10);
      slider.scrollTo({ left: slideNumber * window.innerWidth, behavior: 'auto' });
    }
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreSlideFromHash);
else restoreSlideFromHash();
window.addEventListener('load', restoreSlideFromHash);

// --- NAVIGATION LOGIC ---
function getCurrentSlideIndex() {
  const slider = document.getElementById('slider');
  if (!slider) return 0;
  return (window.SlideRegistry ? window.SlideRegistry.getCurrentIndex() : 0);
}

function getMaxUnlockedSlide() {
  if (typeof MapSystem === 'undefined') return Infinity;
  let maxSlide = 0;
  Object.values(MapSystem.mapNodes).forEach(node => {
    const isUnlocked = MapSystem.isNodeUnlocked(node.id);
    const isCompleted = MapSystem.state.completedNodes.includes(node.id);
    const slides = MapSystem.resolveNodeSlides(node);
    if ((isUnlocked || isCompleted) && slides && slides.length > 0) {
      const nodeMaxSlide = Math.max(...slides);
      if (nodeMaxSlide > maxSlide) maxSlide = nodeMaxSlide;
    }
  });
  return maxSlide;
}

function canNavigateTo(targetIndex) {
  const currentIndex = getCurrentSlideIndex();
  if (targetIndex < currentIndex) {
    if (typeof MapSystem !== 'undefined') MapSystem.stopFlashMapButton();
    return { allowed: true, reason: 'backward' };
  }
  if (typeof MapSystem === 'undefined') return { allowed: true, reason: 'no-map-system' };
  if (MapSystem.isGatedSlide(currentIndex)) {
    MapSystem.flashMapButton();
    return { allowed: false, reason: 'gated', slideIndex: currentIndex };
  }
  const maxUnlocked = getMaxUnlockedSlide();
  if (targetIndex > maxUnlocked) return { allowed: false, reason: 'locked', maxUnlocked };
  const currentNodeId = MapSystem.state.currentNode;
  if (currentNodeId) {
    const currentNode = MapSystem.mapNodes[currentNodeId];
    const slides = MapSystem.resolveNodeSlides(currentNode);
    if (currentNode && slides && slides.length > 0) {
      const lastSlideOfNode = slides[slides.length - 1];
      if (currentIndex === lastSlideOfNode && targetIndex > lastSlideOfNode) {
        MapSystem.flashMapButton();
        return { allowed: false, reason: 'node-exit', nodeId: currentNodeId, node: currentNode };
      }
    }
  }
  return { allowed: true, reason: 'ok' };
}

let lockedAlertCooldown = false;

function showLockedAlert() {
  // UI-level debounce (secondary safety net)
  if (lockedAlertCooldown) return;
  lockedAlertCooldown = true;
  setTimeout(() => { lockedAlertCooldown = false; }, 800);

  // 1. REUSE EXISTING DAMAGE FLASH (no new DOM)
  const overlay = document.getElementById('damage-overlay');
  if (overlay) {
    overlay.classList.add('flash-locked');
    setTimeout(() => overlay.classList.remove('flash-locked'), 300);
  }

  // 2. SCREEN SHAKE (already supported)
  const viewport = document.getElementById('viewport-frame');
  if (viewport) {
    viewport.classList.add('shake-locked');
    setTimeout(() => viewport.classList.remove('shake-locked'), 400);
  }

  // 3. SOFT SOUND ONLY (no stacking)
  if (typeof SoundFX !== 'undefined') {
    if (SoundFX.playLocked) SoundFX.playLocked();
    else if (SoundFX.playPop) SoundFX.playPop();
  }
}

window.showLockedAlert = showLockedAlert;

function returnToMap(completedNodeId) {
  if (typeof MapSystem !== 'undefined' && completedNodeId) MapSystem.triggerNodeCompletion(completedNodeId);
}
window.returnToMap = returnToMap;

function returnToSlides() {
  const viewport = document.getElementById('viewport-frame');
  if (typeof MapSystem !== 'undefined') MapSystem.hide();
  if (viewport && typeof gsap !== 'undefined') gsap.to(viewport, { opacity: 1, duration: 0.3 });
}
window.returnToSlides = returnToSlides;

document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  const isMapOpen = document.getElementById('world-map-overlay') && !document.getElementById('world-map-overlay').classList.contains('translate-y-full');
  if (isMapOpen) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') nextSlide();
  else if (e.key === 'ArrowLeft') prevSlide();
});

const frame = document.getElementById('viewport-frame');
const glow = document.getElementById('mouse-glow');
if (frame && glow) {
  frame.addEventListener('mousemove', (e) => {
    const rect = frame.getBoundingClientRect();
    glow.style.left = (e.clientX - rect.left) + 'px';
    glow.style.top = (e.clientY - rect.top) + 'px';
  });
}

const slideObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      const headings = entry.target.querySelectorAll('h1, h2, .font-display');
      if (headings.length > 0 && typeof gsap !== 'undefined') {
        headings.forEach((h, i) => { gsap.to(h, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1.2, delay: 0.3 + (i * 0.15), ease: "power2.out", overwrite: 'auto', force3D: true }); });
      }
      const bodyText = entry.target.querySelectorAll('p, li, .font-body');
      if (bodyText.length > 0 && typeof gsap !== 'undefined') {
        gsap.fromTo(bodyText, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out", overwrite: 'auto', delay: 0.5 });
      }
      const others = Array.from(entry.target.querySelectorAll('.glass-panel, img, button, .anim-entry')).filter(el => !el.matches('h1, h2, .font-display, p, li, .font-body'));
      if (others.length > 0 && typeof gsap !== 'undefined') {
        gsap.fromTo(others, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: "power2.out", overwrite: 'auto', delay: 0.4 });
      }
    } else {
      entry.target.classList.remove('active');
    }
  });
}, { root: null, threshold: 0.3 });
document.querySelectorAll('.slide').forEach(slide => slideObserver.observe(slide));

(function initParallax() {
  const parallaxLayers = document.querySelectorAll('.parallax-layer');
  const particleContainer = document.getElementById('parallax-particles');
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  function createParticles() {
    if (!particleContainer) return;
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}vh`;
      particle.style.animationDuration = `${15 + Math.random() * 20}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particleContainer.appendChild(particle);
    }
  }
  function handleMouseMove(e) { mouseX = (e.clientX / window.innerWidth - 0.5) * 2; mouseY = (e.clientY / window.innerHeight - 0.5) * 2; }
  function updateParallax() {
    const mapOverlay = document.getElementById('world-map-overlay');
    if (mapOverlay && !mapOverlay.classList.contains('translate-y-full')) {
      requestAnimationFrame(updateParallax);
      return;
    }
    targetX += (mouseX - targetX) * 0.05; targetY += (mouseY - targetY) * 0.05;
    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed || 1);
      layer.style.transform = `translate(${targetX * 30 * speed}px, ${targetY * 30 * speed}px)`;
    });
    requestAnimationFrame(updateParallax);
  }
  createParticles(); document.addEventListener('mousemove', handleMouseMove); updateParallax();
})();

console.log("✅ main.js loaded - Stabilized");
