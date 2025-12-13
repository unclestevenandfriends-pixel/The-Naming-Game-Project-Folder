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
      detail: { context, slideIndex: localStorage.getItem('nameGame_slide') || 0 }
    }));

  } else {
    classData.answersLog.push(logEntry);

    // 🎮 GAMIFICATION HOOK: Notify GameEngine of incorrect answer  
    document.dispatchEvent(new CustomEvent('game:incorrect', {
      detail: { context, slideIndex: localStorage.getItem('nameGame_slide') || 0 }
    }));
  }
  console.log("Current State:", classData);
  saveProgress(); // Auto-Save
}

// ═════════════════════════════════════════════════════════════════════
// 1. SPOT THE NOUN (Slide 8)
// ═════════════════════════════════════════════════════════════════════
function initSpotNounGrid() {
  const gameGrid = document.getElementById('spot-noun-grid');
  if (!gameGrid || gameGrid.hasChildNodes()) return; // Prevent double init

  const nouns = [
    { word: 'fox', isNoun: true }, { word: 'small', isNoun: false },
    { word: 'bus', isNoun: true }, { word: 'lovely', isNoun: false },
    { word: 'jumping', isNoun: false }, { word: 'flower', isNoun: true },
    { word: 'eagle', isNoun: true }, { word: 'bright', isNoun: false },
    { word: 'parrot', isNoun: true }, { word: 'although', isNoun: false }
  ];

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
  if (!slide9Container || slide9Container.hasChildNodes()) return;

  const sentences = [
    { text: "The fox is tired.", nouns: ["fox"] },
    { text: "My shoes are red.", nouns: ["shoes"] },
    { text: "Norah sat on the carpet.", nouns: ["Norah", "carpet"] },
    { text: "The youngster looked at the beautiful eagle.", nouns: ["youngster", "eagle"] }
  ];

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
  if (!checkContainer || checkContainer.hasChildNodes()) return;

  const checkHint = document.getElementById('common-check-hint');
  let checkCount = 0; // Local Scope

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

  // Initial Render
  renderSentence();

  btn.onclick = () => {
    sentenceIdx++;
    currentFound = 0; // Reset for next sentence
    if (sentenceIdx >= detectiveSentences.length) {
      btn.innerHTML = 'Good Job! <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
      btn.disabled = true;
      btn.classList.add('bg-green-500', 'text-black', 'border-transparent');
      btn.classList.remove('bg-brand-500/10', 'text-brand-400');
      return;
    }
    renderSentence();
  };

  function renderSentence() {
    const data = detectiveSentences[sentenceIdx];
    container.innerHTML = "";

    // Reset Button State
    btn.disabled = true;
    btn.innerHTML = 'Find all nouns first...';
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.classList.remove('hover:bg-brand-500/20');

    const p = document.createElement('p');
    p.className = "text-center";
    data.text.split(' ').forEach(word => {
      const clean = word.replace(/[.,]/g, '');
      const span = document.createElement('span');
      span.innerText = word + " ";
      span.className = "interactive-word cursor-pointer hover:text-brand-400 transition-colors";
      span.onclick = () => {
        if (span.dataset.clicked) return;
        span.dataset.clicked = "true";

        if (data.nouns.includes(clean)) {
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
          span.className = "interactive-word word-correct text-green-400 font-bold";
          if (typeof gsap !== 'undefined') gsap.from(span, { scale: 1.2, duration: 0.3, ease: "back.out(1.7)" });
          recordAnswer(true, `Detective: ${clean}`);

          currentFound++;
          if (currentFound === data.nouns.length) {
            btn.disabled = false;
            btn.innerHTML = 'Next Sentence <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('hover:bg-brand-500/20');
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
  const singleWordMap = {};
  Object.keys(muddleWords).forEach(k => {
    const parts = k.split(' ');
    const correctParts = muddleWords[k].split(' ');
    parts.forEach((p, i) => { element = correctParts[i]; singleWordMap[p] = element; });
  });

  const muddleSourceA = "I went to blue avenue in muddleton. Later I flew to asia, then france, greece, and turkey. I visited london and saw big ben. I swam in the aegean sea.";
  const muddleSourceB = "I met mr. davies, oliver, and sophie at school on friday, february 14th.\n\nSigned,\nmiss muddle";

  if (containerA) renderMuddle(containerA, muddleSourceA);
  if (containerB) renderMuddle(containerB, muddleSourceB);

  function renderMuddle(container, text) {
    if (container.hasChildNodes()) return; // Prevent double render
    container.innerHTML = "";
    const p = document.createElement('p');
    p.className = "leading-relaxed";

    text.split(/(\n|\s+)/).forEach(token => {
      if (!token.trim()) {
        p.appendChild(document.createTextNode(token));
        return;
      }

      const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const span = document.createElement('span');
      span.innerText = token;
      span.className = "cursor-pointer hover:text-[#FDFDFD] transition-colors rounded px-0.5 inline-block";

      span.onclick = () => {
        if (span.dataset.clicked) return;
        span.dataset.clicked = "true";

        if (singleWordMap[clean]) {
          if (typeof SoundFX !== 'undefined') SoundFX._play(SoundFX.playCorrect);
          recordAnswer(true, `Muddle Fix: ${clean} -> ${singleWordMap[clean]}`);
          const correctWord = singleWordMap[clean];
          const newContent = token.replace(/[a-zA-Z0-9]+/g, correctWord);
          span.innerText = newContent;

          span.classList.add('text-green-400', 'font-bold');
          if (typeof gsap !== 'undefined') gsap.from(span, { scale: 1.2, color: '#fff', duration: 0.5, ease: "elastic.out(1, 0.3)" });
        } else {
          if (typeof SoundFX !== 'undefined') SoundFX.playIncorrect();
          span.classList.add('text-red-400', 'line-through');
          if (typeof gsap !== 'undefined') gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
          recordAnswer(false, `Muddle Wrong: ${clean}`);
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
      { text: "we were waiting for ryan to finish library.", nouns: ["ryan"] },
      { text: "my brother and i have a pet rabbit.", nouns: ["i"] },
      { text: "i think lucy is very good at painting.", nouns: ["i", "lucy"] }
    ],
    q2: [
      { text: "my best friend lives on hillside road.", nouns: ["hillside", "road"] },
      { text: "i am going to greece this summer.", nouns: ["greece"] },
      { text: "last year, i took a holiday to scotland.", nouns: ["scotland"] }
    ],
    q3: [
      { text: "mum and i sometimes play badminton on mondays.", nouns: ["mondays"] },
      { text: "i am going to holiday this sunday.", nouns: ["sunday"] },
      { text: "on july 4th, we watched fireworks.", nouns: ["july"] }
    ]
  };

  initQuiz('quiz-1-container', quizData.q1);
  initQuiz('quiz-2-container', quizData.q2);
  initQuiz('quiz-3-container', quizData.q3);

  function initQuiz(containerId, questions) {
    const container = document.getElementById(containerId);
    if (!container || container.hasChildNodes()) return;

    questions.forEach((q, idx) => {
      const box = document.createElement('div');
      box.className = "glass-panel p-8 rounded-2xl border border-white/10 flex items-center gap-6";

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
            span.dataset.clicked = "true";

            const isTarget = q.nouns.some(n => word.includes(n));

            if (isTarget) {
              if (typeof SoundFX !== 'undefined') SoundFX.playCorrect();
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
  if (!qContainer || !aContainer || qContainer.hasChildNodes()) return;

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
  console.log('✅ Games Initialized');
});
// Slide 8 Game Logic
const nouns = [
  { word: 'fox', isNoun: true }, { word: 'small', isNoun: false },
  { word: 'bus', isNoun: true }, { word: 'lovely', isNoun: false },
  { word: 'jumping', isNoun: false }, { word: 'flower', isNoun: true },
  { word: 'eagle', isNoun: true }, { word: 'bright', isNoun: false },
  { word: 'parrot', isNoun: true }, { word: 'although', isNoun: false }
];
const gameGrid = document.getElementById('spot-noun-grid');
nouns.forEach(item => {
  const btn = document.createElement('button');
  btn.className = "glass-panel h-32 flex items-center justify-center text-zinc-400 hover:bg-white/5 transition-all rounded-2xl text-2xl font-medium";
  btn.innerText = item.word;
  btn.onclick = () => {
    if (btn.dataset.clicked) return; // Spam Prevention
    btn.dataset.clicked = "true";

    if (item.isNoun) {
      btn.className = "bg-green-500 text-black h-32 flex items-center justify-center rounded-2xl text-2xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all transform scale-105";
      SoundFX._play(SoundFX.playCorrect);
      recordAnswer(true, `Found Noun: ${item.word}`);
    } else {
      btn.className = "bg-red-500/20 text-red-400 h-32 flex items-center justify-center rounded-2xl text-2xl border border-red-500/50 transition-all";
      gsap.to(btn, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
      SoundFX._play(SoundFX.playIncorrect);
      recordAnswer(false, `Clicked Non-Noun: ${item.word}`);
    }
  };
  gameGrid.appendChild(btn);
});

// Slide 9 Logic (Interactive Sentences)
const slide9Sentences = [
  { text: "The fox is tired.", nouns: ["fox"] },
  { text: "My shoes are red.", nouns: ["shoes"] },
  { text: "Norah sat on the carpet.", nouns: ["Norah", "carpet"] },
  { text: "The youngster looked at the beautiful eagle.", nouns: ["youngster", "eagle"] }
];
const slide9Container = document.getElementById('slide-9-sentences');
slide9Sentences.forEach((item, index) => {
  const box = document.createElement('div');
  box.className = "question-box bg-white/5 border-white/10 transition-colors cursor-default";

  // Prefix number
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
      if (span.dataset.clicked) return; // Spam Prevention
      span.dataset.clicked = "true";

      if (item.nouns.includes(cleanWord)) {
        span.classList.add('text-green-400', 'font-bold');
        gsap.from(span, { scale: 1.2, duration: 0.3 });
        SoundFX._play(SoundFX.playCorrect);
        recordAnswer(true, `Sentence Noun: ${cleanWord}`);
      } else {
        span.classList.add('text-red-400', 'line-through');
        gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
        SoundFX._play(SoundFX.playIncorrect);
        recordAnswer(false, `Sentence Non-Noun: ${cleanWord}`);
      }
    };
    p.appendChild(span);
  });
  box.appendChild(p);
  slide9Container.appendChild(box);
});

// Slide 14 Check Logic
const checkWords = [
  { word: 'mouse', isCommon: true }, { word: 'Paris', isCommon: false },
  { word: 'sandwich', isCommon: true }, { word: 'laptop', isCommon: true },
  { word: 'nurse', isCommon: true }, { word: 'Mrs. Johnson', isCommon: false }
];
const checkContainer = document.getElementById('common-check-container');
const checkHint = document.getElementById('common-check-hint');
let checkCount = 0;

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
      SoundFX._play(SoundFX.playCorrect);
      recordAnswer(true, `Common Check: ${item.word}`);
    } else {
      btn.classList.remove('bg-white/5', 'text-zinc-300');
      btn.classList.add('bg-red-500/20', 'text-red-400', 'border-red-500/40');
      SoundFX._play(SoundFX.playIncorrect);
      recordAnswer(false, `Common Check Wrong: ${item.word}`);
    }

    if (checkCount === checkWords.length) {
      checkHint.classList.remove('hidden');
      setTimeout(() => checkHint.classList.remove('opacity-0'), 100);
    }
  }
  checkContainer.appendChild(btn);
});
const detectiveSentences = [
  { text: "The cat sat on the mat.", nouns: ["cat", "mat"] },
  { text: "A dog barked at the postman.", nouns: ["dog", "postman"] },
  { text: "My sister plays the piano.", nouns: ["sister", "piano"] },
  { text: "Birds fly in the sky.", nouns: ["Birds", "sky"] },
  { text: "The teacher wrote on the whiteboard.", nouns: ["teacher", "whiteboard"] }
];

let sentenceIdx = 0;
function initDetective() {
  const container = document.getElementById('detective-sentences');
  const btn = document.getElementById('next-sentence-btn');

  if (!container || !btn) return;

  // Track found nouns for current sentence
  let currentFound = 0;

  // Initial Render
  renderSentence();

  btn.onclick = () => {
    sentenceIdx++;
    currentFound = 0; // Reset for next sentence
    if (sentenceIdx >= detectiveSentences.length) {
      btn.innerHTML = 'Good Job! <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
      btn.disabled = true;
      btn.classList.add('bg-green-500', 'text-black', 'border-transparent');
      btn.classList.remove('bg-brand-500/10', 'text-brand-400');
      return;
    }
    renderSentence();
  };

  function renderSentence() {
    const data = detectiveSentences[sentenceIdx];
    container.innerHTML = "";

    // Reset Button State
    btn.disabled = true;
    btn.innerHTML = 'Find all nouns first...';
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.classList.remove('hover:bg-brand-500/20');

    const p = document.createElement('p');
    p.className = "text-center";
    data.text.split(' ').forEach(word => {
      const clean = word.replace(/[.,]/g, '');
      const span = document.createElement('span');
      span.innerText = word + " ";
      span.className = "interactive-word cursor-pointer hover:text-brand-400 transition-colors";
      span.onclick = () => {
        if (span.dataset.clicked) return; // Spam Prevention
        span.dataset.clicked = "true";

        if (data.nouns.includes(clean)) {
          SoundFX._play(SoundFX.playCorrect);
          span.className = "interactive-word word-correct text-green-400 font-bold";
          gsap.from(span, { scale: 1.2, duration: 0.3, ease: "back.out(1.7)" });
          recordAnswer(true, `Detective: ${clean}`);

          currentFound++;
          if (currentFound === data.nouns.length) {
            btn.disabled = false;
            btn.innerHTML = 'Next Sentence <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.classList.add('hover:bg-brand-500/20');
          }
        } else {
          SoundFX._play(SoundFX.playIncorrect);
          gsap.to(span, { x: 5, duration: 0.1, yoyo: true, repeat: 3 });
          span.className = "interactive-word word-wrong text-red-400 line-through";
          setTimeout(() => span.className = "interactive-word cursor-pointer hover:text-brand-400 transition-colors", 1000);
          recordAnswer(false, `Detective Wrong: ${clean}`);
        }
      };
      p.appendChild(span);
    });
    container.appendChild(p);
    gsap.from(p, { opacity: 0, y: 20, duration: 0.6 });
  }
}

// Initialize Detective Game
initDetective();

// --- MR MUDDLE GAME LOGIC (Slide 25 & 26) ---
const muddleWords = {
  "blue avenue": "Blue Avenue", "muddleton": "Muddleton", "asia": "Asia",
  "france": "France", "greece": "Greece", "turkey": "Turkey",
  "aegean sea": "Aegean Sea", "big ben": "Big Ben", "mr. davies": "Mr. Davies",
  "oliver": "Oliver", "sophie": "Sophie", "miss muddle": "Miss Muddle",
  "london": "London", "friday": "Friday", "february": "February"
};

const muddleSourceA = "I went to blue avenue in muddleton. Later I flew to asia, then france, greece, and turkey. I visited london and saw big ben. I swam in the aegean sea.";
const muddleSourceB = "I met mr. davies, oliver, and sophie at school on friday, february 14th.\n\nSigned,\nmiss muddle";

function initMuddle() {
  const containerA = document.getElementById('muddle-evidence-a');
  const containerB = document.getElementById('muddle-evidence-b');

  if (containerA) renderMuddle(containerA, muddleSourceA);
  if (containerB) renderMuddle(containerB, muddleSourceB);

  function renderMuddle(container, text) {
    container.innerHTML = "";
    const p = document.createElement('p');
    p.className = "leading-relaxed";

    // Split by spaces/newlines but preserve them
    // We need a robust tokenizer to handle punctuation attached to words
    // Simple approach: split by space, check for punctuation

    const words = text.split(/(\s+)/); // Split by whitespace, keep delimiters

    words.forEach(word => {
      if (word.trim().length === 0) {
        p.appendChild(document.createTextNode(word));
        return;
      }

      // Check if this word (or phrase) is part of a muddle target
      // This is tricky because "blue avenue" is 2 words.
      // For simplicity in this specific text, we can check single words or known phrases.
      // However, the previous implementation used regex replace on the whole string.
      // To support "incorrect click", we need to know if a clicked word is NOT a target.

      // Better approach: Tokenize by word boundary.
    });

    // Re-implementing with full tokenization for interaction
    // We will just wrap every word in a span.
    // If it matches a muddle key (lowercase), it's correctable.
    // If not, it's an error to click.

    // We need to handle multi-word targets like "blue avenue".
    // Let's handle them by checking if the current word + next word matches.
    // Or simpler: Just check individual words against the dictionary?
    // "blue avenue" -> "Blue Avenue". 
    // If I click "blue", it turns to "Blue". If I click "avenue", it turns to "Avenue".
    // This is acceptable.

    // Update dictionary for single words where possible
    const singleWordMap = {};
    Object.keys(muddleWords).forEach(k => {
      const parts = k.split(' ');
      const correctParts = muddleWords[k].split(' ');
      parts.forEach((p, i) => {
        singleWordMap[p] = correctParts[i];
      });
    });

    // Special handling for "14th" attached to February? No, "14th" is separate.
    // "february" is in map.

    text.split(/(\n|\s+)/).forEach(token => {
      if (!token.trim()) {
        p.appendChild(document.createTextNode(token));
        return;
      }

      const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const span = document.createElement('span');
      span.innerText = token;
      span.className = "cursor-pointer hover:text-[#FDFDFD] transition-colors rounded px-0.5 inline-block";

      span.onclick = () => {
        if (span.dataset.clicked) return; // Spam Prevention
        span.dataset.clicked = "true";

        if (singleWordMap[clean]) {
          // Correct!
          SoundFX._play(SoundFX.playCorrect);
          recordAnswer(true, `Muddle Fix: ${clean} -> ${singleWordMap[clean]}`);
          // Preserve punctuation
          const punctuation = token.replace(/[a-zA-Z0-9]/g, '');
          // We need to be careful about where punctuation is (start/end)
          // Simple hack: replace the word part
          const correctWord = singleWordMap[clean];
          // If token was "asia," -> "Asia,"
          // We can try to reconstruct or just replace text content if we are sure

          // Let's just use the map value and append punctuation if it was at the end
          const lastChar = token.slice(-1);
          let newText = correctWord;
          if (/[.,]/.test(lastChar)) newText += lastChar;

          // Actually, let's just replace the inner text with the mapped value + punctuation
          // This might be slightly buggy with complex punctuation, but fine for this text.

          // Better: Replace the alphanumeric part
          const newContent = token.replace(/[a-zA-Z0-9]+/g, correctWord);
          span.innerText = newContent;

          span.classList.add('text-green-400', 'font-bold');
          gsap.from(span, { scale: 1.2, color: '#fff', duration: 0.5, ease: "elastic.out(1, 0.3)" });
        } else {
          // Incorrect
          SoundFX.playIncorrect();
          span.classList.add('text-red-400', 'line-through');
          gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
          recordAnswer(false, `Muddle Wrong: ${clean}`);
        }
      };
      p.appendChild(span);
    });
    container.appendChild(p);
  }
}

window.fixMuddle = null; // Deprecated

// Initialize Mr Muddle
initMuddle();

// --- QUIZ LOGIC (Slides 27-29) ---
const quizData = {
  q1: [
    { text: "we were waiting for ryan to finish library.", nouns: ["ryan"] },
    { text: "my brother and i have a pet rabbit.", nouns: ["i"] },
    { text: "i think lucy is very good at painting.", nouns: ["i", "lucy"] }
  ],
  q2: [
    { text: "my best friend lives on hillside road.", nouns: ["hillside", "road"] },
    { text: "i am going to greece this summer.", nouns: ["greece"] },
    { text: "last year, i took a holiday to scotland.", nouns: ["scotland"] }
  ],
  q3: [
    { text: "mum and i sometimes play badminton on mondays.", nouns: ["mondays"] },
    { text: "i am going to holiday this sunday.", nouns: ["sunday"] },
    { text: "on july 4th, we watched fireworks.", nouns: ["july"] }
  ]
};

function initQuiz(containerId, questions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  questions.forEach((q, idx) => {
    const box = document.createElement('div');
    box.className = "glass-panel p-8 rounded-2xl border border-white/10 flex items-center gap-6";

    const letter = document.createElement('div');
    letter.className = "w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#FDFDFD] font-bold border border-white/10 shrink-0";
    letter.innerText = String.fromCharCode(65 + idx);
    box.appendChild(letter);

    const p = document.createElement('p');
    p.className = "text-2xl text-secondary";

    let foundCount = 0;
    const totalNouns = q.nouns.length;

    // Split by spaces but keep punctuation attached to words for display, but strip for check
    // Simpler: split by space, check if word contains noun
    q.text.split(' ').forEach(word => {
      const span = document.createElement('span');
      span.innerText = word + " ";

      // Clean word for check
      const clean = word.replace(/[^a-zA-Z]/g, ''); // Remove punctuation

      // Only make 'I' non-interactive if it is NOT a target noun (e.g. for Slide 29)
      // If it IS a target (Slide 27), it must be clickable.
      if (clean === 'I' && !q.nouns.includes('I')) {
        span.className = "px-1 rounded cursor-default"; // Not interactive
      } else {
        span.className = "cursor-pointer hover:text-[#FDFDFD] transition-colors px-1 rounded";
        span.onclick = () => {
          if (span.classList.contains('text-brand-400') || span.classList.contains('text-red-400')) return;
          if (span.dataset.clicked) return; // Spam Prevention
          span.dataset.clicked = "true";

          // Check if this word is one of the target nouns
          const isTarget = q.nouns.some(n => word.includes(n));

          if (isTarget) {
            SoundFX.playCorrect();
            span.classList.add('text-brand-400', 'font-bold');
            recordAnswer(true, `Quiz Correct: ${clean}`);
            foundCount++;
            if (foundCount === totalNouns) {
              // All found! Show green tick
              if (!box.querySelector('.quiz-check')) {
                const check = document.createElement('div');
                check.className = 'quiz-check ml-auto text-green-400';
                check.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
                box.appendChild(check);
                gsap.from(check, { scale: 0, rotation: -180, duration: 0.5 });
                box.classList.add('border-green-500/50', 'bg-green-500/10');
              }
            }
          } else {
            SoundFX.playIncorrect();
            span.classList.add('text-red-400', 'line-through');
            gsap.to(span, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
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

initQuiz('quiz-1-container', quizData.q1);
initQuiz('quiz-2-container', quizData.q2);
initQuiz('quiz-3-container', quizData.q3);

// --- EXIT TICKET RIDDLE MATCH (Slide 30) ---
const riddles = [
  { q: "You can use me to write a story.", a: "Crayon", id: "r1" },
  { q: "I have four paws, and I can meow.", a: "A cat", id: "r2" },
  { q: "Which animation company made Shrek?", a: "DreamWorks", id: "r3" }
];

function initRiddles() {
  const qContainer = document.getElementById('riddle-questions');
  const aContainer = document.getElementById('riddle-answers');
  if (!qContainer || !aContainer) return;

  qContainer.innerHTML = '';
  aContainer.innerHTML = '';

  // Render Questions (Drop Zones)
  riddles.forEach((item, idx) => {
    const zone = document.createElement('div');
    zone.className = "glass-panel p-6 rounded-2xl text-left border border-white/10 w-full relative min-h-[140px] flex flex-col justify-center transition-colors";
    zone.dataset.id = item.id;
    zone.innerHTML = `<span class="text-brand-400 font-bold mr-2 mb-2 block">Riddle ${idx + 1}:</span> <span class="text-[#FDFDFD] text-xl block">${item.q}</span>`;

    // Drag Events
    zone.ondragover = (e) => {
      e.preventDefault(); // Allow drop
      if (!zone.querySelector('.draggable-answer')) {
        zone.classList.add('bg-white/10', 'border-brand-500');
      }
    };
    zone.ondragleave = () => {
      zone.classList.remove('bg-white/10', 'border-brand-500');
    };
    zone.ondrop = (e) => {
      e.preventDefault();
      zone.classList.remove('bg-white/10', 'border-brand-500');

      // If already filled, ignore
      if (zone.querySelector('.draggable-answer')) return;

      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;

      const data = JSON.parse(dataStr);

      if (data.id === item.id) {
        // Correct Match
        SoundFX.playCorrect();
        recordAnswer(true, `Riddle Solved: ${item.a}`);
        const draggedBtn = document.getElementById(data.elementId);
        if (draggedBtn) {
          // Remove button from answer list (leaving empty slot)
          draggedBtn.remove();

          // Update Zone Content Compactly
          zone.innerHTML = `
                <span class="text-brand-400 font-bold mr-2 mb-2 block">Riddle ${idx + 1}:</span>
                <span class="text-[#FDFDFD] text-xl block">${item.q}</span>
                <div class="mt-2 pt-2 border-t border-white/10 text-green-400 font-bold">
                  Answer: ${item.a} ✅
                </div>
              `;

          // Style Zone
          zone.classList.add('border-green-500/50', 'bg-green-500/10');

          // Animation
          gsap.from(zone, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
        }
      } else {
        // Incorrect
        SoundFX.playIncorrect();
        recordAnswer(false, `Riddle Wrong Drop`);
        zone.classList.add('bg-red-500/20', 'border-red-500');
        setTimeout(() => zone.classList.remove('bg-red-500/20', 'border-red-500'), 500);
      }
    };

    qContainer.appendChild(zone);
  });

  // Render Answers (Draggable) - Fixed Order: DreamWorks, Crayon, A Cat
  // riddles[0] = Crayon, riddles[1] = A Cat, riddles[2] = DreamWorks
  const fixedOrderIndices = [2, 0, 1];
  const shuffledAnswers = fixedOrderIndices.map(i => ({ ...riddles[i], elementId: `ans-${i}` }));

  shuffledAnswers.forEach(item => {
    // Create a slot to hold the button
    const slot = document.createElement('div');
    slot.className = "w-full min-h-[100px] flex items-center justify-center"; // Fixed height slot

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

initRiddles();

// --- SLIDE 20 INTERACTIVITY (Quick Check) ---
function initQuickCheck() {
  // Find Slide 20 by content
  const slide20 = Array.from(document.querySelectorAll('.slide')).find(s => s.innerHTML.includes('Quick Check'));
  if (!slide20) return;

  // Select the rows (skipping the header row)
  // The structure is: .glass-panel > .grid (header) ... .grid (row 1) ...
  const rows = slide20.querySelectorAll('.glass-panel > .grid');

  rows.forEach((row, index) => {
    if (index === 0) return; // Skip header

    const cols = row.children;
    if (cols.length < 2) return;

    const commonDiv = cols[0];
    const properDiv = cols[1];

    // Make Interactive
    [commonDiv, properDiv].forEach(div => {
      div.style.cursor = 'pointer';
      div.onclick = () => {
        if (div.dataset.clicked) return;
        div.dataset.clicked = "true";

        // Visual Feedback
        div.classList.add('bg-green-500/20', 'text-green-400', 'font-bold');
        gsap.from(div, { scale: 1.1, duration: 0.2 });

        SoundFX.playCorrect();
        recordAnswer(true, `Quick Check: ${div.innerText.trim()}`);
      };
    });
  });
}
initQuickCheck();
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
