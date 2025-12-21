// --- DEBOUNCED SAVE HELPER ---
let saveTimeout;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (typeof saveProgress === 'function') saveProgress();
  }, 2000);
}

function showStandardCompletionOverlay(options = {}) {
  const {
    title = 'Challenge Complete',
    message = '',
    icon = 'check-circle-2',
    duration = 2600
  } = options;

  const existing = document.querySelector('.completion-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'completion-overlay';
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="completion-card">
      <i data-lucide="${icon}" class="completion-icon"></i>
      <div class="completion-title text-xl font-bold text-brand-400 cursor-default select-none">${title}</div>
      ${message ? `<div class="completion-sub cursor-default select-none text-white/70">${message}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  const card = overlay.querySelector('.completion-card');
  requestAnimationFrame(() => {
    overlay.classList.add('is-visible');
    card.classList.add('is-visible');
  });

  if (card) {
    card.onclick = null;
    card.setAttribute('tabindex', '-1');
    card.classList.add('cursor-default', 'select-none');
  }

  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    overlay.classList.remove('is-visible');
    card.classList.remove('is-visible');
    setTimeout(() => overlay.remove(), 350);
  }, duration);
}

if (typeof window !== 'undefined') {
  window.showStandardCompletionOverlay = showStandardCompletionOverlay;
}

// --- GAMEPLAY LOGIC (SCORING) ---
function recordAnswer(isCorrect, context) {
  // Global Duplicate Check (Prevents Score Overflow on Refresh)
  const logEntry = isCorrect ? `Correct: ${context}` : `Wrong: ${context}`;
  if (classData.answersLog.includes(logEntry)) {
    console.log("⚠️ Duplicate answer prevented:", logEntry);
    return;
  }

  classData.totalQuestions++;
  if (isCorrect) {
    classData.totalScore++;
    classData.answersLog.push(logEntry);

    // 🎮 GAMIFICATION HOOK: Notify GameEngine of correct answer
    document.dispatchEvent(new CustomEvent('game:correct', {
      detail: { context, slideKey: localStorage.getItem('nameGame_slide_key') || 'hero' }
    }));

  } else {
    classData.answersLog.push(logEntry);

    // 🎮 GAMIFICATION HOOK: Notify GameEngine of incorrect answer  
    document.dispatchEvent(new CustomEvent('game:incorrect', {
      detail: { context, slideKey: localStorage.getItem('nameGame_slide_key') || 'hero' }
    }));
  }

  if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
    console.log("Current State:", classData);
  }

  debouncedSave(); // Use debounced version instead of immediate saveProgress()
}

// ═════════════════════════════════════════════════════════════════════
// 1. SPOT THE NOUN (Slide 8)
// ═════════════════════════════════════════════════════════════════════
function initSpotNounGrid() {
  const gameGrid = document.getElementById('spot-noun-grid');
  if (!gameGrid || gameGrid.dataset.initialized === "true") return; // Prevent double init
  gameGrid.dataset.initialized = "true";

  const nouns = [
    { word: 'fox', isNoun: true }, { word: 'small', isNoun: false },
    { word: 'bus', isNoun: true }, { word: 'lovely', isNoun: false },
    { word: 'jumping', isNoun: false }, { word: 'flower', isNoun: true },
    { word: 'eagle', isNoun: true }, { word: 'bright', isNoun: false },
    { word: 'parrot', isNoun: true }, { word: 'although', isNoun: false }
  ];
  const totalNouns = nouns.filter(item => item.isNoun).length;
  let foundNouns = 0;
  let completionShown = false;

  nouns.forEach(item => {
    const btn = document.createElement('button');
    btn.className = "glass-panel h-32 flex items-center justify-center text-zinc-400 hover:bg-white/5 transition-all rounded-2xl text-2xl font-medium";
    btn.innerText = item.word;
    btn.onclick = () => {
      if (btn.dataset.clicked) return;
      btn.dataset.clicked = "true";

      if (item.isNoun) {
        btn.className = "bg-green-500 text-black h-32 flex items-center justify-center rounded-2xl text-2xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform scale-105";
        if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
        recordAnswer(true, `Found Noun: ${item.word}`);
        foundNouns++;
        if (foundNouns === totalNouns && !completionShown) {
          completionShown = true;
          if (typeof showStandardCompletionOverlay === 'function') {
            showStandardCompletionOverlay({
              title: 'Challenge Complete',
              message: 'Continue to the next slide',
              icon: 'check-circle-2',
              duration: 2600
            });
          }
        }
      } else {
        btn.className = "bg-red-500/20 text-red-400 h-32 flex items-center justify-center rounded-2xl text-2xl border border-red-500/50 transition-all";
        if (typeof gsap !== 'undefined') gsap.to(btn, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
        if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
        recordAnswer(false, `Clicked Non-Noun: ${item.word}`);
      }
    };
    gameGrid.appendChild(btn);
  });
}

// ═════════════════════════════════════════════════════════════════════
// 2. INTERACTIVE SENTENCES (Slide 9)
// ═════════════════════════════════════════════════════════════════════
function initInteractiveSentences() {
  const slide9Container = document.getElementById('slide-9-sentences');
  if (!slide9Container || slide9Container.dataset.initialized === "true") return;
  slide9Container.dataset.initialized = "true";

  const sentences = [
    { text: "The fox is tired.", nouns: ["fox"] },
    { text: "My shoes are red.", nouns: ["shoes"] },
    { text: "Norah sat on the carpet.", nouns: ["Norah", "carpet"] },
    { text: "The youngster looked at the beautiful eagle.", nouns: ["youngster", "eagle"] }
  ];
  const totalNouns = sentences.reduce((sum, item) => sum + item.nouns.length, 0);
  let foundNouns = 0;
  let completionShown = false;

  sentences.forEach((item, index) => {
    const box = document.createElement('div');
    box.className = "question-box bg-white/5 border-white/10 transition-colors cursor-default";

    const num = document.createElement('span');
    num.className = "text-brand-400 font-bold mr-4";
    num.innerText = (index + 1) + ".";
    box.appendChild(num);

    const p = document.createElement('p');
    p.className = "text-[#FDFDFD] text-2xl inline-block";

    item.text.split(' ').forEach(word => {
      const cleanWord = word.replace(/[.,]/g, '');
      const span = document.createElement('span');
      span.innerText = word + " ";
      span.className = "cursor-pointer hover:text-brand-200 transition-colors rounded px-1";
      span.onclick = () => {
        if (span.dataset.clicked) return;
        span.dataset.clicked = "true";

        if (item.nouns.includes(cleanWord)) {
          span.classList.add('text-green-400', 'font-bold');
          if (typeof gsap !== 'undefined') gsap.from(span, { scale: 1.2, duration: 0.3 });
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
          recordAnswer(true, `Sentence Noun: ${cleanWord}`);
          foundNouns++;
          if (foundNouns === totalNouns && !completionShown) {
            completionShown = true;
            if (typeof showStandardCompletionOverlay === 'function') {
              showStandardCompletionOverlay({
                title: 'Challenge Complete',
                message: 'Continue to the next slide',
                icon: 'check-circle-2',
                duration: 2600
              });
            }
          }
        } else {
          span.classList.add('text-red-400', 'line-through');
          if (typeof gsap !== 'undefined') gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
          recordAnswer(false, `Sentence Non-Noun: ${cleanWord}`);
        }
      };
      p.appendChild(span);
    });
    box.appendChild(p);
    slide9Container.appendChild(box);
  });
}

// ═════════════════════════════════════════════════════════════════════
// 3. COMMON CHECK (Slide 14)
// ═════════════════════════════════════════════════════════════════════
function initCommonCheck() {
  const checkContainer = document.getElementById('common-check-container');
  if (!checkContainer || checkContainer.dataset.initialized === "true") return;
  checkContainer.dataset.initialized = "true";

  const checkHint = document.getElementById('common-check-hint');
  let checkCount = 0; // Local Scope
  let completionShown = false;

  const checkWords = [
    { word: 'mouse', isCommon: true }, { word: 'Paris', isCommon: false },
    { word: 'sandwich', isCommon: true }, { word: 'laptop', isCommon: true },
    { word: 'nurse', isCommon: true }, { word: 'Mrs. Johnson', isCommon: false }
  ];

  checkWords.forEach(item => {
    const btn = document.createElement('button');
    btn.className = "px-6 py-6 rounded-2xl border border-white/10 bg-white/5 text-2xl font-body text-zinc-300 hover:bg-white/10 hover:scale-105 transition-all duration-300 w-full";
    btn.innerText = item.word;
    btn.onclick = () => {
      if (btn.classList.contains('clicked')) return;
      btn.classList.add('clicked');
      checkCount++;

      if (item.isCommon) {
        btn.classList.remove('bg-white/5', 'text-zinc-300');
        btn.classList.add('bg-green-500', 'text-black', 'border-transparent', 'font-bold');
        if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
        recordAnswer(true, `Common Check: ${item.word}`);
      } else {
        btn.classList.remove('bg-white/5', 'text-zinc-300');
        btn.classList.add('bg-red-500/20', 'text-red-400', 'border-red-500/40');
        if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
        recordAnswer(false, `Common Check Wrong: ${item.word}`);
      }

      if (checkCount === checkWords.length && checkHint) {
        checkHint.classList.remove('hidden');
        setTimeout(() => checkHint.classList.remove('opacity-0'), 100);
        if (!completionShown && typeof showStandardCompletionOverlay === 'function') {
          completionShown = true;
          showStandardCompletionOverlay({
            title: 'Challenge Complete',
            message: 'Continue to the next slide',
            icon: 'check-circle-2',
            duration: 2600
          });
        }
      }
    }
    checkContainer.appendChild(btn);
  });
}

// ═════════════════════════════════════════════════════════════════════
// 4. DETECTIVE SENTENCES
// ═════════════════════════════════════════════════════════════════════
function initDetective() {
  const container = document.getElementById('detective-sentences');
  const btn = document.getElementById('next-sentence-btn');
  if (!container || !btn) return;

  // Reset button listeners (avoids duplicate handlers if scripts re-run)
  const btnClone = btn.cloneNode(true);
  btn.parentNode.replaceChild(btnClone, btn);
  const btnEl = btnClone;

  // Reset State (Scoped Here)
  let sentenceIdx = 0;
  let currentFound = 0;

  const detectiveSentences = [
    { text: "The cat sat on the mat.", nouns: ["cat", "mat"] },
    { text: "A dog barked at the postman.", nouns: ["dog", "postman"] },
    { text: "My sister plays the piano.", nouns: ["sister", "piano"] },
    { text: "Birds fly in the sky.", nouns: ["Birds", "sky"] },
    { text: "The teacher wrote on the whiteboard.", nouns: ["teacher", "whiteboard"] }
  ];

  const normalizeAnswer = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value
      .trim()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  };

  const normalizeToken = (value) => {
    const normalized = normalizeAnswer(value);
    return normalized.replace(/[.,]/g, '').replace(/^['"]|['"]$/g, '');
  };

  const storedIdx = parseInt(localStorage.getItem('muddle_idx') || '0', 10);
  if (!Number.isNaN(storedIdx)) {
    sentenceIdx = Math.max(0, Math.min(storedIdx, detectiveSentences.length));
  }

  function setSentenceIdx(idx) {
    sentenceIdx = idx;
    localStorage.setItem('muddle_idx', String(sentenceIdx));
  }

  // Initial Render
  renderSentence();

  btnEl.onclick = () => {
    const nextIdx = sentenceIdx + 1;
    setSentenceIdx(nextIdx);
    currentFound = 0; // Reset for next sentence
    if (sentenceIdx < detectiveSentences.length) {
      renderSentence();
      return;
    }
    finishDetective();
  };

  function finishDetective() {
    localStorage.removeItem('muddle_idx');
    btnEl.innerHTML = 'Good Job! <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
    btnEl.disabled = true;
    btnEl.classList.add('bg-green-500', 'text-black', 'border-transparent');
    btnEl.classList.remove('bg-brand-500/10', 'text-brand-400');

    if (typeof MapSystem !== 'undefined' && MapSystem.triggerNodeCompletion) {
      MapSystem.triggerNodeCompletion('N7', { showMap: false });
    }
  }

  function renderSentence() {
    const data = detectiveSentences[sentenceIdx];
    if (!data) {
      finishDetective();
      return;
    }
    container.innerHTML = "";

    // Reset Button State
    currentFound = 0;
    btnEl.disabled = true;
    btnEl.innerHTML = 'Find all nouns first...';
    btnEl.classList.add('opacity-50', 'cursor-not-allowed');
    btnEl.classList.remove('hover:bg-brand-500/20');

    const p = document.createElement('p');
    p.className = "text-center";
    const normalizedNouns = data.nouns.map((noun) => normalizeToken(noun));
    data.text.split(' ').forEach(word => {
      const clean = normalizeToken(word);
      const span = document.createElement('span');
      span.innerText = word + " ";
      span.className = "interactive-word cursor-pointer hover:text-brand-400 transition-colors";
      span.onclick = () => {
        if (span.dataset.clicked) return;
        span.dataset.clicked = "true";

        if (normalizedNouns.includes(clean)) {
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
          span.className = "interactive-word word-correct text-green-400 font-bold";
          if (typeof gsap !== 'undefined') gsap.from(span, { scale: 1.2, duration: 0.3, ease: "back.out(1.7)" });
          recordAnswer(true, `Detective: ${clean}`);

          currentFound++;
          if (currentFound === data.nouns.length) {
            btnEl.disabled = false;
            btnEl.innerHTML = 'Next Sentence <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            btnEl.classList.remove('opacity-50', 'cursor-not-allowed');
            btnEl.classList.add('hover:bg-brand-500/20');
          }
        } else {
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playIncorrect);
          if (typeof gsap !== 'undefined') gsap.to(span, { x: 5, duration: 0.1, yoyo: true, repeat: 3 });
          span.className = "interactive-word word-wrong text-red-400 line-through";
          setTimeout(() => span.className = "interactive-word cursor-pointer hover:text-brand-400 transition-colors", 1000);
          recordAnswer(false, `Detective Wrong: ${clean}`);
        }
      };
      p.appendChild(span);
    });
    container.appendChild(p);
    if (typeof gsap !== 'undefined') gsap.from(p, { opacity: 0, y: 20, duration: 0.6 });
  }
}

// ═════════════════════════════════════════════════════════════════════
// 5. MR MUDDLE (Slides 25-26)
// ═════════════════════════════════════════════════════════════════════
function initMuddle() {
  const containerA = document.getElementById('muddle-evidence-a');
  const containerB = document.getElementById('muddle-evidence-b');

  // Data internal to simplify scope
  const muddleWords = {
    "blue avenue": "Blue Avenue", "muddleton": "Muddleton", "asia": "Asia",
    "france": "France", "greece": "Greece", "turkey": "Turkey",
    "aegean sea": "Aegean Sea", "big ben": "Big Ben", "mr. davies": "Mr. Davies",
    "oliver": "Oliver", "sophie": "Sophie", "miss muddle": "Miss Muddle",
    "london": "London", "friday": "Friday", "february": "February"
  };
  const normalizeMuddleToken = (value) => value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const singleWordMap = {};
  Object.keys(muddleWords).forEach(k => {
    const parts = k.split(' ');
    const correctParts = muddleWords[k].split(' ');
    parts.forEach((p, i) => {
      const key = normalizeMuddleToken(p);
      const element = correctParts[i] || correctParts[0];
      if (key) singleWordMap[key] = element;
    });
  });

  const muddleSourceA = "I went to blue avenue in muddleton. Later I flew to asia, then france, greece, and turkey. I visited london and saw big ben. I swam in the aegean sea.";
  const muddleSourceB = "I met mr. davies, oliver, and sophie at school on friday, february 14th.\n\nSigned,\nmiss muddle";

  if (containerA) renderMuddle(containerA, muddleSourceA);
  if (containerB) renderMuddle(containerB, muddleSourceB);

  function renderMuddle(container, text) {
    if (!container || container.dataset.initialized === "true") return; // Prevent double render
    container.dataset.initialized = "true";
    container.innerHTML = "";
    const p = document.createElement('p');
    p.className = "leading-relaxed";

    // 🏆 Completion Tracking: Count how many mistakes need fixing
    let totalTargetWords = 0;
    let foundTargetWords = 0;
    const nodeId = container.id === 'muddle-evidence-a' ? 'N9A' : 'N9B';

    // First pass: Count total targets
    text.split(/(\n|\s+)/).forEach(token => {
      const clean = normalizeMuddleToken(token);
      if (clean && singleWordMap[clean]) totalTargetWords++;
    });

    console.log(`🔍 Muddle ${nodeId}: Target count is ${totalTargetWords}`);

    text.split(/(\n|\s+)/).forEach(token => {
      if (!token.trim()) {
        p.appendChild(document.createTextNode(token));
        return;
      }

      const clean = normalizeMuddleToken(token);
      const span = document.createElement('span');
      span.innerText = token;
      span.className = "cursor-pointer hover:text-[#FDFDFD] transition-colors px-2 py-1 mx-0.5 rounded-md hover:bg-white/10 inline-block";

      span.onclick = () => {
        if (span.dataset.clicked) return;

        if (singleWordMap[clean]) {
          span.dataset.clicked = "true"; // Only lock on correct
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
          recordAnswer(true, `Muddle Fix: ${clean} -> ${singleWordMap[clean]}`);
          const correctWord = singleWordMap[clean];
          const replacement = token.includes('.') && correctWord.endsWith('.')
            ? correctWord.slice(0, -1)
            : correctWord;
          const newContent = token.replace(/[a-zA-Z0-9]+/g, replacement);
          span.innerText = newContent;

          span.classList.add('text-green-400', 'font-bold');
          if (typeof gsap !== 'undefined') gsap.from(span, { scale: 1.2, color: '#fff', duration: 0.5, ease: "elastic.out(1, 0.3)" });

          // 🏁 Track Progress
          foundTargetWords++;
          if (foundTargetWords === totalTargetWords) {
            console.log(`✅ Muddle ${nodeId} COMPLETE!`);
            if (typeof MapSystem !== 'undefined') {
              MapSystem.triggerNodeCompletion(nodeId, { showMap: false });
            }
          }
        } else {
          if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
          span.classList.add('text-red-400', 'line-through');
          if (typeof gsap !== 'undefined') gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
          recordAnswer(false, `Muddle Wrong: ${clean}`);

          // Reset wrong click after animation to allow fixing? 
          // (Actually Muddle logic usually allows one try per word, but let's keep it simple for now)
          span.dataset.clicked = "true";
        }
      };
      p.appendChild(span);
    });
    container.appendChild(p);
  }
}

// ═════════════════════════════════════════════════════════════════════
// 6. QUIZZES (Slides 27-29)
// ═════════════════════════════════════════════════════════════════════
function initAllQuizzes() {
  const quizData = {
    q1: [
      { text: "We were waiting for ryan to finish library.", nouns: ["ryan"] },
      { text: "My brother and i have a pet rabbit.", nouns: ["i"] },
      { text: "I think lucy is very good at painting.", nouns: ["lucy"] }
    ],
    q2: [
      { text: "My best friend lives on hillside road.", nouns: ["hillside", "road"] },
      { text: "I am going to greece this summer.", nouns: ["greece"] },
      { text: "Last year, I took a holiday to scotland.", nouns: ["scotland"] }
    ],
    q3: [
      { text: "Mum and I sometimes play badminton on mondays.", nouns: ["mondays"] },
      { text: "I am going to holiday this sunday.", nouns: ["sunday"] },
      { text: "On july 4th, we watched fireworks.", nouns: ["july"] }
    ]
  };

  initQuiz('quiz-1-container', quizData.q1);
  initQuiz('quiz-2-container', quizData.q2);
  initQuiz('quiz-3-container', quizData.q3);

  function initQuiz(containerId, questions) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";

    function capitalizeTargets(token, nouns) {
      let updated = token;
      nouns.forEach((noun) => {
        const escaped = noun.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'i');
        if (re.test(updated)) {
          updated = updated.replace(re, (match) => match.charAt(0).toUpperCase() + match.slice(1));
        }
      });
      return updated;
    }

    // 🏆 Completion Tracking
    let questionsCompleted = 0;
    const totalQuestions = questions.length;
    const nodeIdMap = {
      'quiz-1-container': 'N10A',
      'quiz-2-container': 'N10B',
      'quiz-3-container': 'N10C'
    };
    const nodeId = nodeIdMap[containerId];

    questions.forEach((q, idx) => {
      const box = document.createElement('div');
      box.className = "glass-panel p-8 rounded-2xl border border-white/10 flex items-center gap-6 mb-6"; // Added mb-6

      const letter = document.createElement('div');
      letter.className = "w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#FDFDFD] font-bold border border-white/10 shrink-0";
      letter.innerText = String.fromCharCode(65 + idx);
      box.appendChild(letter);

      const p = document.createElement('p');
      p.className = "text-2xl text-secondary";

      let foundCount = 0;
      const totalNouns = q.nouns.length;

      q.text.split(' ').forEach(word => {
        const span = document.createElement('span');
        span.innerText = word + " ";
        const clean = word.replace(/[^a-zA-Z]/g, '');

        if (clean === 'I' && !q.nouns.includes('I')) {
          span.className = "px-1 rounded cursor-default";
        } else {
          span.className = "cursor-pointer hover:text-[#FDFDFD] transition-colors px-1 rounded";
          span.onclick = () => {
            if (span.classList.contains('text-brand-400') || span.classList.contains('text-red-400')) return;
            if (span.dataset.clicked) return;

            const isTarget = q.nouns.some(n => word.includes(n));

            if (isTarget) {
              span.dataset.clicked = "true";
              if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
              span.innerText = `${capitalizeTargets(word, q.nouns)} `;
              span.classList.add('text-brand-400', 'font-bold');
              recordAnswer(true, `Quiz Correct: ${clean}`);
              foundCount++;

              if (foundCount === totalNouns) {
                if (!box.querySelector('.quiz-check')) {
                  const check = document.createElement('div');
                  check.className = 'quiz-check ml-auto text-green-400';
                  check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
                  box.appendChild(check);
                  if (typeof gsap !== 'undefined') gsap.from(check, { scale: 0, rotation: -180, duration: 0.5 });
                  box.classList.add('border-green-500/50', 'bg-green-500/10');

                  // 🏁 Question Complete
                  questionsCompleted++;
                  if (questionsCompleted === totalQuestions && nodeId) {
                    console.log(`✅ Quiz ${nodeId} COMPLETE!`);
                    if (typeof MapSystem !== 'undefined') {
                      MapSystem.triggerNodeCompletion(nodeId, { showMap: false });
                    }
                  }
                }
              }
            } else {
              if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
              span.classList.add('text-red-400', 'line-through');
              if (typeof gsap !== 'undefined') gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
              recordAnswer(false, `Quiz Wrong: ${clean}`);
            }
          };
        }
        p.appendChild(span);
      });
      box.appendChild(p);
      container.appendChild(box);
    });
  }
}

// ═════════════════════════════════════════════════════════════════════
// 7. EXIT TICKET RIDDLES (Slide 30)
// ═════════════════════════════════════════════════════════════════════
function initRiddles() {
  const qContainer = document.getElementById('riddle-questions');
  const aContainer = document.getElementById('riddle-answers');
  if (!qContainer || !aContainer || qContainer.dataset.initialized === "true") return;
  qContainer.dataset.initialized = "true";
  aContainer.dataset.initialized = "true";

  const riddles = [
    { q: "You can use me to write a story.", a: "Crayon", id: "r1" },
    { q: "I have four paws, and I can meow.", a: "A cat", id: "r2" },
    { q: "Which animation company made Shrek?", a: "DreamWorks", id: "r3" }
  ];

  // 1. Render Zones
  riddles.forEach((item, idx) => {
    const zone = document.createElement('div');
    zone.className = "glass-panel p-6 rounded-2xl text-left border border-white/10 w-full relative min-h-[140px] flex flex-col justify-center transition-colors";
    zone.dataset.id = item.id;
    zone.innerHTML = `<span class="text-brand-400 font-bold mr-2 mb-2 block">Riddle ${idx + 1}:</span> <span class="text-[#FDFDFD] text-xl block">${item.q}</span>`;

    zone.ondragover = (e) => {
      e.preventDefault();
      if (!zone.querySelector('.draggable-answer')) {
        zone.classList.add('bg-white/10', 'border-brand-500');
      }
    };
    zone.ondragleave = () => {
      zone.classList.remove('bg-white/10', 'border-brand-500');
    };
    // 🏆 Completion Tracking for Riddles
    let solvedRiddlesCount = 0;
    const totalRiddlesCount = riddles.length;

    zone.ondrop = (e) => {
      e.preventDefault();
      zone.classList.remove('bg-white/10', 'border-brand-500');
      if (zone.querySelector('.draggable-answer')) return;

      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.id === item.id) {
        if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
        recordAnswer(true, `Riddle Solved: ${item.a}`);
        const draggedBtn = document.getElementById(data.elementId);
        if (draggedBtn) {
          draggedBtn.remove();
          zone.innerHTML = `
                <span class="text-brand-400 font-bold mr-2 mb-2 block">Riddle ${idx + 1}:</span>
                <span class="text-[#FDFDFD] text-xl block">${item.q}</span>
                <div class="mt-2 pt-2 border-t border-white/10 text-green-400 font-bold">
                    Answer: ${item.a} ✅
                </div>
                `;
          zone.classList.add('border-green-500/50', 'bg-green-500/10');
          if (typeof gsap !== 'undefined') gsap.from(zone, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });

          // 🏁 Track solved count
          solvedRiddlesCount++;
          if (solvedRiddlesCount === totalRiddlesCount) {
            console.log(`✅ Riddles COMPLETE! Triggering N11.`);
            if (typeof MapSystem !== 'undefined') {
              MapSystem.triggerNodeCompletion('N11', { showMap: false });
            }
          }
        }
      } else {
        if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
        recordAnswer(false, `Riddle Wrong Drop`);
        zone.classList.add('bg-red-500/20', 'border-red-500');
        setTimeout(() => zone.classList.remove('bg-red-500/20', 'border-red-500'), 500);
      }
    };
    qContainer.appendChild(zone);
  });

  // 2. Render Draggables
  const fixedOrderIndices = [2, 0, 1];
  const shuffledAnswers = fixedOrderIndices.map(i => ({ ...riddles[i], elementId: `ans-${i}` }));

  shuffledAnswers.forEach(item => {
    const slot = document.createElement('div');
    slot.className = "w-full min-h-[100px] flex items-center justify-center";
    const btn = document.createElement('div');
    btn.id = item.elementId;
    btn.draggable = true;
    btn.className = "glass-panel p-6 rounded-2xl text-center hover:bg-white/5 transition-all border border-white/10 w-full text-2xl font-bold text-secondary cursor-grab active:cursor-grabbing";
    btn.innerText = item.a;

    btn.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, elementId: item.elementId }));
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => btn.classList.add('opacity-50'), 0);
    };
    btn.ondragend = () => {
      btn.classList.remove('opacity-50');
    };
    slot.appendChild(btn);
    aContainer.appendChild(slot);
  });
}

// ═════════════════════════════════════════════════════════════════════
// 8. QUICK CHECK (Slide 20 - Improved Logic)
// ═════════════════════════════════════════════════════════════════════
function initQuickCheck() {
  // Fix: Use filter to find ALL matching slides, not just first
  const qcSlides = Array.from(document.querySelectorAll('.slide')).filter(s => s.innerHTML.includes('Quick Check'));

  qcSlides.forEach((slide, sIdx) => {
    // Avoid double init if already setup? 
    // Hard to check on slide itself, but we can check if content is modified.
    // Rely on idempotency of classList checks or attributes if needed.
    // For now, assume single run.

    const rows = slide.querySelectorAll('.glass-panel > .grid');

    rows.forEach((row, index) => {
      if (index === 0) return; // Skip header elements

      const cols = row.children;
      if (cols.length < 2) return;

      const commonDiv = cols[0];
      const properDiv = cols[1];

      [commonDiv, properDiv].forEach(div => {
        // Safety check to avoid double listeners
        if (div.dataset.interactive === "true") return;
        div.dataset.interactive = "true";

        div.style.cursor = 'pointer';
        div.onclick = () => {
          if (div.dataset.clicked) return;
          div.dataset.clicked = "true";

          div.classList.add('bg-green-500/20', 'text-green-400', 'font-bold');
          if (typeof gsap !== 'undefined') gsap.from(div, { scale: 1.1, duration: 0.2 });
          if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
          recordAnswer(true, `Quick Check (${sIdx}): ${div.innerText.trim()}`);
        };
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. HUNT GAMES - 10-Card Noun Identification Challenges
// Each game has: 5 correct nouns + 3 wrong parts of speech + 2 wrong noun types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * THINGS & ANIMALS HUNT (Node N3C)
 */
function initThingsHuntGrid() {
  const grid = document.getElementById('things-hunt-grid');
  if (!grid || grid.dataset.init) return;
  grid.dataset.init = 'true';

  const cards = [
    // CORRECT: Things & Animals (5)
    { word: 'fox', correct: true },
    { word: 'eagle', correct: true },
    { word: 'bus', correct: true },
    { word: 'sandwich', correct: true },
    { word: 'parrot', correct: true },
    // WRONG: Parts of speech (3)
    { word: 'quickly', correct: false, hint: 'adverb' },
    { word: 'beautiful', correct: false, hint: 'adjective' },
    { word: 'jumping', correct: false, hint: 'verb' },
    // WRONG: Other noun types (2)
    { word: 'doctor', correct: false, hint: 'person noun' },
    { word: 'library', correct: false, hint: 'place noun' }
  ].sort(() => Math.random() - 0.5);

  let found = 0;
  const target = 5;

  cards.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
    btn.textContent = card.word;

    btn.onclick = () => {
      if (btn.dataset.clicked) return;
      btn.dataset.clicked = 'true';

      if (card.correct) {
        btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
        found++;
        const scoreEl = document.getElementById('things-hunt-score');
        if (scoreEl) scoreEl.textContent = found;
        if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
        recordAnswer(true, `Things Hunt: ${card.word}`);

        if (found >= target) {
          setTimeout(() => huntGameComplete('things'), 600);
        }
      } else {
        btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
        if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
        if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
        recordAnswer(false, `Things Hunt: ${card.word} (${card.hint})`);
      }
    };

    grid.appendChild(btn);
  });
}

/**
 * PEOPLE HUNT (Node N3A)
 */
function initPeopleHuntGrid() {
  const grid = document.getElementById('people-hunt-grid');
  if (!grid || grid.dataset.init) return;
  grid.dataset.init = 'true';

  const cards = [
    // CORRECT: People nouns (5)
    { word: 'teacher', correct: true },
    { word: 'nurse', correct: true },
    { word: 'girl', correct: true },
    { word: 'chef', correct: true },
    { word: 'firefighter', correct: true },
    // WRONG: Parts of speech (3)
    { word: 'helpful', correct: false, hint: 'adjective' },
    { word: 'quickly', correct: false, hint: 'adverb' },
    { word: 'singing', correct: false, hint: 'verb' },
    // WRONG: Other noun types (2)
    { word: 'zoo', correct: false, hint: 'place noun' },
    { word: 'elephant', correct: false, hint: 'animal noun' }
  ].sort(() => Math.random() - 0.5);

  let found = 0;
  const target = 5;

  cards.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
    btn.textContent = card.word;

    btn.onclick = () => {
      if (btn.dataset.clicked) return;
      btn.dataset.clicked = 'true';

      if (card.correct) {
        btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
        found++;
        const scoreEl = document.getElementById('people-hunt-score');
        if (scoreEl) scoreEl.textContent = found;
        if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
        recordAnswer(true, `People Hunt: ${card.word}`);

        if (found >= target) {
          setTimeout(() => huntGameComplete('people'), 600);
        }
      } else {
        btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
        if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
        if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
        recordAnswer(false, `People Hunt: ${card.word} (${card.hint})`);
      }
    };

    grid.appendChild(btn);
  });
}

/**
 * PLACES HUNT (Node N3B)
 */
function initPlacesHuntGrid() {
  const grid = document.getElementById('places-hunt-grid');
  if (!grid || grid.dataset.init) return;
  grid.dataset.init = 'true';

  const cards = [
    // CORRECT: Place nouns (5)
    { word: 'school', correct: true },
    { word: 'library', correct: true },
    { word: 'park', correct: true },
    { word: 'museum', correct: true },
    { word: 'beach', correct: true },
    // WRONG: Parts of speech (3)
    { word: 'above', correct: false, hint: 'preposition' },
    { word: 'spacious', correct: false, hint: 'adjective' },
    { word: 'running', correct: false, hint: 'verb' },
    // WRONG: Other noun types (2)
    { word: 'penguin', correct: false, hint: 'animal noun' },
    { word: 'builder', correct: false, hint: 'person noun' }
  ].sort(() => Math.random() - 0.5);

  let found = 0;
  const target = 5;

  cards.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'hunt-card glass-panel h-20 md:h-24 flex items-center justify-center text-white/90 hover:bg-white/10 transition-all rounded-xl text-lg md:text-xl font-medium border border-white/10';
    btn.textContent = card.word;

    btn.onclick = () => {
      if (btn.dataset.clicked) return;
      btn.dataset.clicked = 'true';

      if (card.correct) {
        btn.className = 'hunt-card bg-green-500 text-black h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl font-bold shadow-[0_0_25px_rgba(34,197,94,0.6)] transform scale-105';
        found++;
        const scoreEl = document.getElementById('places-hunt-score');
        if (scoreEl) scoreEl.textContent = found;
        if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
        recordAnswer(true, `Places Hunt: ${card.word}`);

        if (found >= target) {
          setTimeout(() => huntGameComplete('places'), 600);
        }
      } else {
        btn.className = 'hunt-card bg-red-500/30 text-red-300 h-20 md:h-24 flex items-center justify-center rounded-xl text-lg md:text-xl border-2 border-red-500/50';
        if (typeof gsap !== 'undefined') gsap.to(btn, { x: 4, duration: 0.04, yoyo: true, repeat: 4 });
        if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
        recordAnswer(false, `Places Hunt: ${card.word} (${card.hint})`);
      }
    };

    grid.appendChild(btn);
  });
}

/**
 * Called when a hunt game is completed - flash map button
 */
function huntGameComplete(huntType) {
  console.log(`🎉 ${huntType} Hunt Complete!`);

  // 🗺️ Map hunt types to node IDs
  const huntToNodeId = {
    'people': 'N3A',
    'places': 'N3B',
    'things': 'N3C'
  };
  const nodeId = huntToNodeId[huntType];

  // Play celebration sound
  if (typeof SoundFX !== 'undefined' && SoundFX.playChime) {
    SoundFX.playChime();
  } else if (typeof SoundFX !== 'undefined' && SoundFX.playCorrect) {
    SoundFX.playCorrect();
  }

  // 🧭 SIGNAL MAP SYSTEM: Directly trigger node completion
  if (nodeId && typeof MapSystem !== 'undefined' && MapSystem.triggerNodeCompletion) {
    console.log(`🗺️ Signaling MapSystem to complete node: ${nodeId}`);
    MapSystem.triggerNodeCompletion(nodeId, { showMap: false });
  } else if (typeof MapSystem !== 'undefined' && MapSystem.flashMapButton) {
    MapSystem.flashMapButton();
  }
}

// ═════════════════════════════════════════════════════════════════════
// INITIALIZATION (On Load)
// ═════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Initializing Games...');
  initSpotNounGrid();
  initInteractiveSentences();
  initCommonCheck();
  initDetective();
  initMuddle();
  initAllQuizzes();
  initRiddles();
  initQuickCheck();
  // Hunt games (slide-based initialization)
  initThingsHuntGrid();
  initPeopleHuntGrid();
  initPlacesHuntGrid();
  console.log('✅ Games Initialized');
});

// ═════════════════════════════════════════════════════════════════════
// POWER-UP HANDLER (Phase 2)
// ═════════════════════════════════════════════════════════════════════
document.addEventListener('game:powerup', (e) => {
  handlePowerUp(e.detail.type);
});

function handlePowerUp(type) {
  if (type === 'clue') {
    // Logic: Find all interactive elements on the CURRENT visible slide
    // 1. Identify "Wrong" buttons that haven't been clicked yet.
    // 2. Visually disable/fade 1 or 2 of them (50/50 style).
    // 3. If no wrong options, highlight the Correct one with a 'ring-4 ring-cyan-400' class.

    const activeSlide = document.querySelector('.slide:not(.hidden)');
    if (!activeSlide) return;

    // Attempt to find wrong answers (this requires specific knowledge of the game structure)
    // For Phase 2, let's implement a visual "Scanner" effect that highlights the Correct answer.

    const correctElements = Array.from(activeSlide.querySelectorAll('[onclick]')).filter(el => {
      // Heuristic: If we click it, does it trigger a win? 
      // For now, let's apply a "Hint Glow" to interactive elements.
      return el.classList.contains('interactive-word') || el.tagName === 'BUTTON' || el.style.cursor === 'pointer';
    });

    if (correctElements.length > 0) {
      // Pick one random element to highlight
      const target = correctElements[Math.floor(Math.random() * correctElements.length)];
      target.classList.add('ring-4', 'ring-cyan-400', 'shadow-[0_0_30px_rgba(34,211,238,0.6)]');
      setTimeout(() => target.classList.remove('ring-4', 'ring-cyan-400', 'shadow-[0_0_30px_rgba(34,211,238,0.6)]'), 3000);
    }
  }

  if (type === 'shield') {
    // Logic: Auto-solve the current interaction
    // For Phase 1, just trigger a "Free Win" visual
    const activeSlide = document.querySelector('.slide:not(.hidden)');
    if (activeSlide) {
      const shieldOverlay = document.createElement('div');
      shieldOverlay.className = "absolute inset-0 z-50 flex items-center justify-center pointer-events-none";
      shieldOverlay.innerHTML = `<div class="text-9xl animate-ping">🛡️</div>`;
      activeSlide.appendChild(shieldOverlay);
      setTimeout(() => shieldOverlay.remove(), 1000);

      // Grant points immediately
      recordAnswer(true, "Auto-Shield Used");
    }
  }
}
