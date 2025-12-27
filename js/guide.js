// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE.JS - Friendly Guide System v1.0
// Pedagogical onboarding & context-aware hints for The Naming Game
// Compliant with Aura Dark Mode v1.0 Laws
// ═══════════════════════════════════════════════════════════════════════════════

const GuideSystem = (function() {
  'use strict';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const CONFIG = {
    STORAGE_KEY: 'guide_hintsSeen',
    EASING: 'cubic-bezier(0.16, 1, 0.3, 1)',
    Z_INDEX: 11000,
    SPOTLIGHT_SIZE: 60, // px padding around target
    COLORS: {
      cyan: '#22d3ee',
      pink: '#f472b6',
      emerald: '#34d399',
      amber: '#fbbf24'
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THE 15-STEP HERO TOUR SCRIPT (Updated for Glass Command Deck v1.0)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const HERO_TOUR_STEPS = [
    {
      target: '#gcd-identity',
      content: "This is your Mission Badge: UNIT 1 - The Naming Game.",
      purpose: "Contextual Awareness"
    },
    {
      target: '#app-title',
      content: "You're playing The Naming Game! Ready to find some nouns?",
      purpose: "Engagement"
    },
    {
      target: '#player-hud-compact',
      content: "This is your Mission HUD! It shows your energy bar, crystal count, and your Agent's face. Watch your energy - wrong answers cost health!",
      purpose: "Gamification Intro"
    },
    {
      target: '#teacher-trigger',
      content: "Shh! This hidden button unlocks special abilities and powers.",
      purpose: "Secret Feature"
    },
    {
      target: '#gcd-audio',
      content: "Toggle the music here. Perfect for focus or fun!",
      purpose: "Utility"
    },
    {
      target: '#gcd-fullscreen',
      content: "Go full screen for a cinematic experience.",
      purpose: "Utility"
    },
    {
      target: '#aura-character',
      content: "This is your Agent. They'll help you on missions.",
      purpose: "Character Connection"
    },
    {
      target: '#gcd-projector',
      content: "The TextBoard Projector! Use this for special tasks.",
      purpose: "Tool Discovery"
    },
    {
      target: '#gcd-markup',
      content: "Annotation Mode! Enable this to draw on any slide.",
      purpose: "Tool Discovery"
    },
    {
      target: '#gcd-slide-counter',
      content: "Your breadcrumbs. See how far you've traveled.",
      purpose: "Navigation"
    },
    {
      target: '#gcd-next',
      content: "Click here to move forward through the story.",
      purpose: "Navigation"
    },
    {
      target: '#gcd-prev',
      content: "Need to go back? Use the previous arrow.",
      purpose: "Navigation"
    },
    {
      target: '#gcd-dynamic-cta',
      content: "The Mission Map! This is where your journey begins.",
      purpose: "Call to Action"
    },
    {
      target: null, // No target - centered overlay
      content: "You're ready, Agent! Good luck!",
      purpose: "Completion"
    }
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let overlayElement = null;
  let bubbleElement = null;
  let currentStep = 0;
  let tourActive = false;
  let isInitialized = false;
  let currentSpotlightTarget = null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STORAGE UTILITIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function getSeenHints() {
    try {
      const stored = SafeStorage.getItem(CONFIG.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[GuideSystem] Failed to parse seen hints:', e);
      return [];
    }
  }

  function markHintAsSeen(type) {
    try {
      const seen = getSeenHints();
      if (!seen.includes(type)) {
        seen.push(type);
        SafeStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(seen));
      }
    } catch (e) {
      console.warn('[GuideSystem] Failed to save hint status:', e);
    }
  }

  function hasSeenHint(type) {
    return getSeenHints().includes(type);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DOM CREATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'guide-overlay';
    overlay.className = 'guide-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  function createBubble() {
    const bubble = document.createElement('div');
    bubble.id = 'guide-bubble';
    bubble.className = 'guide-bubble';
    bubble.innerHTML = `
      <div class="guide-bubble-content">
        <p class="guide-bubble-text"></p>
        <div class="guide-bubble-actions">
          <button class="guide-btn guide-btn-skip">Skip Tour</button>
          <div class="guide-bubble-progress"></div>
          <button class="guide-btn guide-btn-next">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(bubble);
    return bubble;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPOTLIGHT LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function positionSpotlight(targetSelector) {
    // Remove magnifying effect from previous target
    if (currentSpotlightTarget) {
      currentSpotlightTarget.classList.remove('guide-spotlight-magnify');
      currentSpotlightTarget = null;
    }

    if (!targetSelector) {
      // Centered overlay for final step or general hints
      overlayElement.style.background = 'rgba(0, 0, 0, 0.85)';
      overlayElement.style.backdropFilter = 'none';
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn(`[GuideSystem] Target not found: ${targetSelector}`);
      // Fallback to centered overlay
      overlayElement.style.background = 'rgba(0, 0, 0, 0.85)';
      overlayElement.style.backdropFilter = 'none';
      return;
    }

    // Apply magnifying effect to current target
    target.classList.add('guide-spotlight-magnify');
    currentSpotlightTarget = target;

    const rect = target.getBoundingClientRect();
    const padding = CONFIG.SPOTLIGHT_SIZE;

    // Calculate spotlight circle center and radius
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 2 + padding;

    // Create radial gradient spotlight with SMOOTH, PREMIUM cyan ring
    // Inner circle is FULLY transparent (no blur on highlighted element)
    // Outer area has DARK overlay (0.85 opacity) with smooth feathering
    overlayElement.style.background = `
      radial-gradient(
        circle at ${centerX}px ${centerY}px,
        transparent 0%,
        transparent ${radius - 8}px,
        rgba(34, 211, 238, 0.1) ${radius - 6}px,
        rgba(34, 211, 238, 0.4) ${radius - 3}px,
        rgba(34, 211, 238, 0.8) ${radius - 1}px,
        rgba(34, 211, 238, 1) ${radius}px,
        rgba(34, 211, 238, 0.8) ${radius + 1}px,
        rgba(34, 211, 238, 0.4) ${radius + 3}px,
        rgba(34, 211, 238, 0.1) ${radius + 6}px,
        rgba(0, 0, 0, 0.5) ${radius + 12}px,
        rgba(0, 0, 0, 0.7) ${radius + 20}px,
        rgba(0, 0, 0, 0.85) ${radius + 30}px
      )
    `;
    overlayElement.style.backdropFilter = 'none';

    return { target, rect, centerX, centerY, radius };
  }

  function positionBubble(spotlightData) {
    if (!spotlightData) {
      // Centered positioning for general hints
      bubbleElement.style.left = '50%';
      bubbleElement.style.top = '50%';
      bubbleElement.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const { rect, centerX, centerY, radius } = spotlightData;

    // CRITICAL: Wait for next frame to get accurate dimensions
    requestAnimationFrame(() => {
      const bubbleRect = bubbleElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // BULLETPROOF EDGE MARGINS - UNIVERSAL 20PX SAFETY
      const EDGE_MARGIN = 20;
      const VERTICAL_MARGIN = 20;
      const SPOTLIGHT_GAP = 50; // Gap between spotlight edge and bubble

      // Get ACTUAL bubble dimensions (not estimates)
      const bubbleWidth = bubbleRect.width || 500;
      const bubbleHeight = bubbleRect.height || 250;

      // Calculate positions for each direction (relative to spotlight circle)
      const positions = {
        right: {
          left: centerX + radius + SPOTLIGHT_GAP,
          top: centerY - bubbleHeight / 2,
          transform: 'translate(0, 0)'
        },
        left: {
          left: centerX - radius - SPOTLIGHT_GAP - bubbleWidth,
          top: centerY - bubbleHeight / 2,
          transform: 'translate(0, 0)'
        },
        below: {
          left: centerX - bubbleWidth / 2,
          top: centerY + radius + SPOTLIGHT_GAP,
          transform: 'translate(0, 0)'
        },
        above: {
          left: centerX - bubbleWidth / 2,
          top: centerY - radius - SPOTLIGHT_GAP - bubbleHeight,
          transform: 'translate(0, 0)'
        }
      };

      // Check which position fits best (priority: right, left, below, above)
      const tryOrder = ['right', 'left', 'below', 'above'];
      let finalPosition = null;

      for (const direction of tryOrder) {
        const pos = positions[direction];
        const fitsHorizontally = pos.left >= EDGE_MARGIN &&
                                 (pos.left + bubbleWidth) <= (viewportWidth - EDGE_MARGIN);
        const fitsVertically = pos.top >= VERTICAL_MARGIN &&
                               (pos.top + bubbleHeight) <= (viewportHeight - VERTICAL_MARGIN);

        if (fitsHorizontally && fitsVertically) {
          finalPosition = pos;
          break;
        }
      }

      // Fallback: position to the right with clamping
      if (!finalPosition) {
        finalPosition = {
          left: Math.max(EDGE_MARGIN, Math.min(
            viewportWidth - bubbleWidth - EDGE_MARGIN,
            centerX + radius + SPOTLIGHT_GAP
          )),
          top: Math.max(VERTICAL_MARGIN, Math.min(
            viewportHeight - bubbleHeight - VERTICAL_MARGIN,
            centerY - bubbleHeight / 2
          )),
          transform: 'translate(0, 0)'
        };
      }

      // FINAL SAFETY CHECK: Enforce 20px edge barrier on all sides
      const safeLeft = Math.max(EDGE_MARGIN, Math.min(
        viewportWidth - bubbleWidth - EDGE_MARGIN,
        finalPosition.left
      ));
      const safeTop = Math.max(VERTICAL_MARGIN, Math.min(
        viewportHeight - bubbleHeight - VERTICAL_MARGIN,
        finalPosition.top
      ));

      // APPLY FINAL POSITION WITH SAFETY ENFORCEMENT
      bubbleElement.style.left = `${safeLeft}px`;
      bubbleElement.style.top = `${safeTop}px`;
      bubbleElement.style.transform = finalPosition.transform;

      // LOCK: Prevent any overflow
      bubbleElement.style.maxWidth = `${viewportWidth - 2 * EDGE_MARGIN}px`;
      bubbleElement.style.maxHeight = `${viewportHeight - 2 * VERTICAL_MARGIN}px`;
      bubbleElement.style.overflow = 'visible';
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TOUR ENGINE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function showTourStep(stepIndex) {
    if (stepIndex >= HERO_TOUR_STEPS.length) {
      endTour();
      return;
    }

    currentStep = stepIndex;
    const step = HERO_TOUR_STEPS[stepIndex];

    // Show overlay and bubble
    overlayElement.classList.add('active');
    bubbleElement.classList.add('active');

    // Update content
    const textElement = bubbleElement.querySelector('.guide-bubble-text');
    const progressElement = bubbleElement.querySelector('.guide-bubble-progress');
    const nextBtn = bubbleElement.querySelector('.guide-btn-next');

    textElement.textContent = step.content;
    progressElement.textContent = `${stepIndex + 1} / ${HERO_TOUR_STEPS.length}`;

    // Update button text for final step
    if (stepIndex === HERO_TOUR_STEPS.length - 1) {
      nextBtn.textContent = 'Got it!';
    } else {
      nextBtn.textContent = 'Next';
    }

    // Position spotlight and bubble
    const spotlightData = positionSpotlight(step.target);
    setTimeout(() => positionBubble(spotlightData), 50);
  }

  function nextStep() {
    showTourStep(currentStep + 1);
  }

  function endTour() {
    tourActive = false;
    overlayElement.classList.remove('active');
    bubbleElement.classList.remove('active');

    // Remove magnifying effect from current target
    if (currentSpotlightTarget) {
      currentSpotlightTarget.classList.remove('guide-spotlight-magnify');
      currentSpotlightTarget = null;
    }

    markHintAsSeen('hero_tour');
    console.log('[GuideSystem] Hero Tour completed');
  }

  function skipTour() {
    if (confirm('Skip the rest of the tour? You can restart it later from the help menu.')) {
      endTour();
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function init() {
    // Guard against double-initialization
    if (isInitialized) {
      console.warn('[GuideSystem] Already initialized. Ignoring duplicate init() call.');
      return;
    }

    console.log('[GuideSystem] Initializing Friendly Guide System v1.0');

    // Create DOM elements
    overlayElement = createOverlay();
    bubbleElement = createBubble();
    isInitialized = true;

    // Attach event listeners
    const nextBtn = bubbleElement.querySelector('.guide-btn-next');
    const skipBtn = bubbleElement.querySelector('.guide-btn-skip');

    nextBtn.addEventListener('click', nextStep);
    skipBtn.addEventListener('click', skipTour);

    // Click overlay to advance (UX enhancement)
    overlayElement.addEventListener('click', (e) => {
      if (e.target === overlayElement && tourActive) {
        nextStep();
      }
    });

    console.log('[GuideSystem] Initialization complete');
  }

  function startHeroTour() {
    // Safety check: ensure system is initialized
    if (!isInitialized) {
      console.warn('[GuideSystem] Cannot start Hero Tour - system not initialized yet');
      return false;
    }

    if (hasSeenHint('hero_tour')) {
      console.log('[GuideSystem] Hero Tour already completed');
      return false;
    }

    console.log('[GuideSystem] Starting Hero Tour');
    tourActive = true;
    currentStep = 0;
    showTourStep(0);
    return true;
  }

  function restartHeroTour() {
    // Safety check: ensure system is initialized
    if (!isInitialized) {
      console.warn('[GuideSystem] Cannot restart Hero Tour - system not initialized yet');
      return false;
    }

    console.log('[GuideSystem] Restarting Hero Tour (forced)');
    tourActive = true;
    currentStep = 0;
    showTourStep(0);
    return true;
  }

  function showIfNeeded(type, config = {}) {
    // Safety check: ensure system is initialized
    if (!isInitialized) {
      console.warn('[GuideSystem] Cannot show hint - system not initialized yet');
      return false;
    }

    // Deduplication check
    if (hasSeenHint(type)) {
      console.log(`[GuideSystem] Hint already seen: ${type}`);
      return false;
    }

    console.log(`[GuideSystem] Showing hint: ${type}`);

    const {
      target = null,
      content = '',
      buttonText = 'Got it!',
      onDismiss = null
    } = config;

    // Show overlay and bubble
    overlayElement.classList.add('active');
    bubbleElement.classList.add('active');

    // Update content
    const textElement = bubbleElement.querySelector('.guide-bubble-text');
    const progressElement = bubbleElement.querySelector('.guide-bubble-progress');
    const nextBtn = bubbleElement.querySelector('.guide-btn-next');
    const skipBtn = bubbleElement.querySelector('.guide-btn-skip');

    textElement.textContent = content;
    progressElement.textContent = ''; // No progress for single hints
    nextBtn.textContent = buttonText;
    skipBtn.style.display = 'none'; // Hide skip button for single hints

    // Position spotlight and bubble
    const spotlightData = positionSpotlight(target);
    setTimeout(() => positionBubble(spotlightData), 50);

    // Override next button to dismiss
    const dismissHandler = () => {
      overlayElement.classList.remove('active');
      bubbleElement.classList.remove('active');
      markHintAsSeen(type);
      nextBtn.removeEventListener('click', dismissHandler);
      skipBtn.style.display = ''; // Restore skip button visibility
      if (onDismiss) onDismiss();
    };

    nextBtn.addEventListener('click', dismissHandler);

    return true;
  }

  function resetAllHints() {
    SafeStorage.removeItem(CONFIG.STORAGE_KEY);
    console.log('[GuideSystem] All hints reset');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXPORT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return {
    init,
    startHeroTour,
    restartHeroTour,
    showIfNeeded,
    resetAllHints,
    hasSeenHint
  };

})();

// Expose to window for global access
window.GuideSystem = GuideSystem;

// NOTE: GuideSystem.init() must be called manually from the game flow
// Do NOT auto-initialize - this must happen at the correct moment in the game sequence
