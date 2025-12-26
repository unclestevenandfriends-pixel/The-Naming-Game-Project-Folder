/* ═══════════════════════════════════════════════════════════════════════
   TEXTBOARD SYSTEM LOGIC - COMPLETE RESTORED VERSION
   High-fidelity AI Teacher Edition with Multi-Slide Persistence
   All tools and functionality restored from textboard_v14_fixed.html
   ═══════════════════════════════════════════════════════════════════════ */

// === CONFIGURATION ===
const AI_CONFIG = {
    url: "https://script.google.com/macros/s/AKfycbxxFHzkup6MGANijakkHOJ_a6YEZf5oQ1dXhvgjE3lOpkZ9QA2_r9qDojTjFZQnoAVa/exec",
    password: "TeacherTool2025",
    modeToggle: "REPLACE",  // "REPLACE" or "INSERT_BELOW"
    paraphraseStyle: "Formal",
    customStyleInstruction: ""
};

const AI_STATE = {
    inFlight: false,
    queued: null,
    pending: null
};

// === PERSISTENCE SYSTEM ===
const TextBoardStorage = {
    KEY: "NAMING_GAME_TEXTBOARD_V1",
    states: {},

    load() {
        try {
            const saved = localStorage.getItem(this.KEY);
            if (saved) {
                this.states = JSON.parse(saved);
                Debug.log("💾 TextBoard states loaded from storage");
            }
        } catch (e) {
            console.error("Storage load error:", e);
        }
    },

    save() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(this.states));
        } catch (e) {
            console.error("Storage save error:", e);
        }
    },

    get(slideId) {
        return this.states[slideId] || "";
    },

    set(slideId, html) {
        this.states[slideId] = html;
        this.save();
    },

    clearAll() {
        this.states = {};
        this.save();
    }
};

// === DEBUG SYSTEM ===
const Debug = {
    panel: null,
    logEl: null,
    init() {
        this.panel = document.getElementById('debug-panel');
        this.logEl = document.getElementById('debug-log');
    },
    log(msg, type = '') {
        console.log(msg);
        if (!this.logEl) return;
        const line = document.createElement('div');
        line.className = 'debug-log ' + type;
        line.textContent = msg;
        this.logEl.appendChild(line);
        this.logEl.scrollTop = this.logEl.scrollHeight;
    }
};

// === UNDO SYSTEM ===
const HistorySystem = {
    undoStack: [],
    redoStack: [],
    maxHistory: 50,
    isRestoring: false,
    saveTimer: null,

    saveState(force = false) {
        if (this.isRestoring) return;
        const editor = document.getElementById('textboard-editor');
        if (!editor) return;

        const html = editor.innerHTML;
        if (!force && this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === html) return;

        this.undoStack.push(html);
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = [];

        // Auto-save to Persistence
        const currentSlide = typeof window.getCurrentSlideIndex === 'function' ? window.getCurrentSlideIndex() : 0;
        TextBoardStorage.set(currentSlide, html);
    },

    scheduleSave(delay = 300) {
        if (this.isRestoring) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            if (this.isRestoring) return;
            this.saveState();
            this.saveTimer = null;
        }, delay);
    },

    undo() {
        if (this.undoStack.length <= 1) return;
        this.isRestoring = true;
        this.redoStack.push(this.undoStack.pop());
        const html = this.undoStack[this.undoStack.length - 1];
        document.getElementById('textboard-editor').innerHTML = html;
        this.isRestoring = false;
        HistorySystem.saveState(true);
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.isRestoring = true;
        const html = this.redoStack.pop();
        this.undoStack.push(html);
        document.getElementById('textboard-editor').innerHTML = html;
        this.isRestoring = false;
    }
};

// === FOCUS MANAGEMENT HELPER (FIX v2) ===
// Focuses the editor before executing any formatting command
function focusAndExecSync(command, showUI = false, value = null) {
    const editor = document.getElementById('textboard-editor');
    if (editor) {
        editor.focus();
        document.execCommand(command, showUI, value);
    }
}

// === EXPORT SYSTEM ===
const ExportSystem = {
    async _captureFullBoard() {
        const editor = document.getElementById('textboard-editor');
        const originalBg = editor.style.backgroundColor;
        editor.style.backgroundColor = '#0B0C15';

        const canvas = await html2canvas(editor, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0B0C15',
            logging: false
        });

        editor.style.backgroundColor = originalBg;
        return canvas;
    },

    async exportAsImage() {
        try {
            TextBoardSystem.showToast('Generating HQ Image...');
            const canvas = await this._captureFullBoard();
            const link = document.createElement('a');
            link.download = `textboard_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            TextBoardSystem.showToast('Image saved!');
        } catch (err) {
            console.error(err);
            alert('Export image failed: ' + err.message);
        }
    },

    async exportAsPDF() {
        try {
            TextBoardSystem.showToast('Generating PDF...');
            const editor = document.getElementById('textboard-editor');
            const opt = {
                margin: 15,
                filename: `textboard_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const originalColor = editor.style.color;
            editor.querySelectorAll('*').forEach(el => el.style.color = 'black');

            await html2pdf().set(opt).from(editor).save();

            editor.querySelectorAll('*').forEach(el => el.style.color = '');
            TextBoardSystem.showToast('PDF saved!');
        } catch (err) {
            console.error(err);
            alert('Export PDF failed');
        }
    },

    async exportAsDOCX() {
        try {
            TextBoardSystem.showToast('Generating Word doc...');
            const editor = document.getElementById('textboard-editor');
            const { Document, Packer, Paragraph, TextRun } = window.docx;

            const children = Array.from(editor.childNodes).map(node => {
                const text = node.innerText || node.textContent || "";
                return new Paragraph({
                    children: [new TextRun({ text: text, color: "000000" })]
                });
            });

            const doc = new Document({
                sections: [{ children }]
            });

            const blob = await Packer.toBlob(doc);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `textboard_${Date.now()}.docx`;
            link.click();
            TextBoardSystem.showToast('Word doc saved!');
        } catch (err) {
            console.error(err);
            alert('DOCX export failed');
        }
    }
};

// === AI STATUS UI ===
const AI_STATUS = {
    el: null,
    textEl: null,
    spinner: null,
    applyBtn: null,
    discardBtn: null,

    init() {
        this.el = document.getElementById('ai-status');
        this.textEl = document.getElementById('ai-status-text');
        this.spinner = this.el?.querySelector('.tb-ai-spinner');
        this.applyBtn = document.getElementById('ai-apply-btn');
        this.discardBtn = document.getElementById('ai-discard-btn');
    },

    setWorking(mode) {
        this.init();
        if (!this.el) return;
        this.el.classList.remove('hidden');
        if (this.spinner) this.spinner.style.display = '';
        if (this.applyBtn) this.applyBtn.style.display = 'none';
        if (this.discardBtn) this.discardBtn.style.display = 'none';
        if (this.textEl) this.textEl.textContent = `Processing (${mode})...`;
    },

    setReady(mode) {
        this.init();
        if (!this.el) return;
        this.el.classList.remove('hidden');
        if (this.spinner) this.spinner.style.display = 'none';
        if (this.applyBtn) this.applyBtn.style.display = '';
        if (this.discardBtn) this.discardBtn.style.display = '';
        if (this.textEl) this.textEl.textContent = `AI ready (${mode})`;
    },

    clear() {
        if (this.el) this.el.classList.add('hidden');
    }
};

// === AI PROCESSING ===
function applyPendingAi() {
    const pending = AI_STATE.pending;
    if (!pending) return;
    const editor = document.getElementById('textboard-editor');
    if (!editor) return;

    HistorySystem.saveState(true);
    if (pending.selectionIsFull) {
        editor.innerHTML = pending.fullHtml;
    } else {
        editor.focus();
        document.execCommand('insertHTML', false, pending.cleanHtml);
    }
    HistorySystem.saveState(true);
    AI_STATE.pending = null;
    AI_STATUS.clear();
    TextBoardSystem.showToast('AI result applied');

    if (AI_STATE.queued) {
        const next = AI_STATE.queued;
        AI_STATE.queued = null;
        setTimeout(() => runAiTool(next.mode, next.options), 0);
    }
}

function discardPendingAi() {
    AI_STATE.pending = null;
    AI_STATUS.clear();
    TextBoardSystem.showToast('AI result dismissed');

    if (AI_STATE.queued) {
        const next = AI_STATE.queued;
        AI_STATE.queued = null;
        setTimeout(() => runAiTool(next.mode, next.options), 0);
    }
}

async function runAiTool(mode, options = {}) {
    const editor = document.getElementById('textboard-editor');
    const fullText = editor.innerText;
    if (!fullText.trim()) {
        TextBoardSystem.showToast("The board is empty!");
        return;
    }

    if (AI_STATE.inFlight || AI_STATE.pending) {
        AI_STATE.queued = { mode, options };
        TextBoardSystem.showToast('AI busy - queued');
        return;
    }

    AI_STATE.inFlight = true;
    AI_STATUS.setWorking(mode);

    let controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
        const selection = window.getSelection();
        let selectionText = fullText;
        let selStart = 0;
        let selEnd = fullText.length;

        // Precise selection offset calculation
        const getSelectionOffset = (root) => {
            if (selection.rangeCount === 0) return 0;
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(root);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            return preCaretRange.toString().length;
        };

        const snapshotText = fullText;
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed && editor.contains(selection.anchorNode)) {
            selectionText = selection.toString();
            selStart = getSelectionOffset(editor);
            selEnd = selStart + selectionText.length;
        }

        const selectionIsFull = (selectionText === fullText);
        const isCheckMode = mode.includes('check');

        const payload = {
            password: AI_CONFIG.password,
            mode: mode,
            fullText: fullText,
            selectionText: selectionText,
            selectionStartIndex: selStart,
            selectionEndIndex: selEnd,
            redChangedCharactersEnabled: isCheckMode,
            modeToggle: AI_CONFIG.modeToggle,
            paraphraseStyle: options.paraphraseStyle || AI_CONFIG.paraphraseStyle,
            customStyleInstruction: options.customStyleInstruction || AI_CONFIG.customStyleInstruction
        };

        const response = await fetch(AI_CONFIG.url, {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (data.replacementHtml) {
            let cleanHtml = data.replacementHtml.replace(/^(\s*<span[^>]*>)?\.(\s*<\/span>)?\s*/, "");
            const fullHtml = `<p>${cleanHtml.replace(/\n/g, '<br>')}</p>`;

            if (editor.innerText === snapshotText) {
                HistorySystem.saveState(true);

                // Handle Insert Below vs Replace mode
                if (AI_CONFIG.modeToggle === 'INSERT_BELOW') {
                    if (selectionIsFull) {
                        editor.innerHTML += '<hr style="border:none;border-top:1px dashed #22d3ee;margin:20px 0;">' + fullHtml;
                    } else {
                        const sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.collapse(false);
                            const marker = document.createElement('span');
                            marker.innerHTML = '<br><span style="color:#22d3ee;font-size:0.8em;">↳ AI:</span> ' + cleanHtml;
                            range.insertNode(marker);
                        }
                    }
                } else {
                    // Replace mode
                    if (selectionIsFull) {
                        editor.innerHTML = fullHtml;
                    } else {
                        document.execCommand('insertHTML', false, cleanHtml);
                    }
                }

                HistorySystem.saveState(true);
                TextBoardSystem.showToast(AI_CONFIG.modeToggle === 'INSERT_BELOW' ? "Inserted Below! ✓" : "Marking Complete! ✓");
                AI_STATUS.clear();
            } else {
                // Content changed while processing - queue result
                AI_STATE.pending = {
                    mode,
                    cleanHtml,
                    fullHtml,
                    selectionIsFull
                };
                AI_STATUS.setReady(mode);
                TextBoardSystem.showToast('AI result ready - apply when you choose');
            }
        }
    } catch (err) {
        console.error(err);
        TextBoardSystem.showToast(err.name === 'AbortError' ? 'AI timed out' : 'AI Error: ' + err.message);
        AI_STATUS.clear();
    } finally {
        clearTimeout(timeoutId);
        AI_STATE.inFlight = false;
        if (!AI_STATE.pending && AI_STATE.queued) {
            const next = AI_STATE.queued;
            AI_STATE.queued = null;
            setTimeout(() => runAiTool(next.mode, next.options), 0);
        }
    }
}

// === TOOLTIP SYSTEM ===
const TooltipSystem = {
    el: null,
    timeout: null,

    init() {
        this.el = document.getElementById('tb-tooltip');
        if (!this.el) return;

        document.querySelectorAll('.tb-btn[title], .stamp-btn[title], .drawing-size-btn[title], .drawing-color-btn[title]').forEach(btn => {
            btn.addEventListener('mouseenter', (e) => this.show(e.target));
            btn.addEventListener('mouseleave', () => this.hide());
        });
    },

    show(target) {
        if (!this.el) return;
        const title = target.getAttribute('title');
        if (!title) return;

        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.el.textContent = title;
            const rect = target.getBoundingClientRect();
            this.el.style.left = `${rect.left + rect.width / 2}px`;
            this.el.style.top = `${rect.bottom + 8}px`;
            this.el.style.transform = 'translateX(-50%)';
            this.el.classList.add('show');
        }, 400); // Delay before showing
    },

    hide() {
        clearTimeout(this.timeout);
        if (this.el) this.el.classList.remove('show');
    }
};

// === COLOR GRIDS ===
const ColorGrids = {
    colors: [
        '#ffffff', '#f8fafc', '#cbd5e1', '#64748b', '#1e293b',
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
    ],

    init() {
        this.buildGrid('text-color-grid', (color) => {
            // FIX: Use focusAndExecSync to ensure editor is focused
            focusAndExecSync('foreColor', false, color);
            document.getElementById('color-indicator').style.backgroundColor = color;
            this.closeAllMenus();
        });

        this.buildGrid('hilite-color-grid', (color) => {
            // FIX: Use focusAndExecSync to ensure editor is focused
            focusAndExecSync('hiliteColor', false, color);
            document.getElementById('hilite-indicator').style.backgroundColor = color;
            this.closeAllMenus();
        });

        // Hilite "None" option
        const hiliteNone = document.querySelector('[data-hilite="transparent"]');
        hiliteNone?.addEventListener('mousedown', (e) => e.preventDefault());
        hiliteNone?.addEventListener('click', () => {
            focusAndExecSync('hiliteColor', false, 'transparent');
            document.getElementById('hilite-indicator').style.backgroundColor = 'transparent';
            this.closeAllMenus();
        });
    },

    buildGrid(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'tb-color-swatch';
            swatch.style.backgroundColor = color;
            // FIX: Prevent focus loss when clicking swatches
            swatch.addEventListener('mousedown', (e) => e.preventDefault());
            swatch.addEventListener('click', () => onClick(color));
            container.appendChild(swatch);
        });
    },

    closeAllMenus() {
        document.querySelectorAll('.tb-dropdown-menu').forEach(m => m.classList.remove('show'));
    }
};

// === DROPDOWN SYSTEM ===
const DropdownSystem = {
    init() {
        // Font dropdown
        this.setupDropdown('font-btn', 'font-menu', (item) => {
            const font = item.dataset.font;
            // FIX: Use focusAndExecSync to ensure editor is focused
            focusAndExecSync('fontName', false, font);
            document.getElementById('current-font-label').textContent = font;
        });

        // Size dropdown
        this.setupDropdown('size-btn', 'size-menu', (item) => {
            const size = item.dataset.size;
            // FIX: Use focusAndExecSync to ensure editor is focused
            focusAndExecSync('fontSize', false, size);
            document.getElementById('current-size-label').textContent = `Size ${size}`;
        });

        // Color dropdown
        this.setupDropdown('color-btn', 'color-menu');
        this.setupDropdown('hilite-btn', 'hilite-menu');

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tb-dropdown-container')) {
                document.querySelectorAll('.tb-dropdown-menu').forEach(m => m.classList.remove('show'));
            }
        });
    },

    setupDropdown(btnId, menuId, onItemClick) {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        if (!btn || !menu) return;

        // FIX: Prevent focus loss when clicking dropdown button
        btn.addEventListener('mousedown', (e) => e.preventDefault());

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close others first
            document.querySelectorAll('.tb-dropdown-menu').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
            // Position and toggle
            const rect = btn.getBoundingClientRect();
            menu.style.left = `${rect.left}px`;
            menu.style.top = `${rect.bottom + 4}px`;
            menu.classList.toggle('show');
        });

        if (onItemClick) {
            menu.querySelectorAll('.tb-dropdown-item[data-font], .tb-dropdown-item[data-size]').forEach(item => {
                // FIX: Prevent focus loss when clicking dropdown items
                item.addEventListener('mousedown', (e) => e.preventDefault());
                item.addEventListener('click', () => {
                    onItemClick(item);
                    menu.classList.remove('show');
                });
            });
        }
    }
};

// === MAIN TEXTBOARD SYSTEM ===
const TextBoardSystem = {
    overlay: null,
    editor: null,
    currentSlide: 0,

    init() {
        this.overlay = document.getElementById('textboard-overlay');
        this.editor = document.getElementById('textboard-editor');

        console.log('📽️ TextBoardSystem.init() called', { overlay: this.overlay, editor: this.editor });

        if (!this.overlay) {
            console.error('❌ TextBoard: #textboard-overlay not found in DOM');
            return;
        }
        if (!this.editor) {
            console.error('❌ TextBoard: #textboard-editor not found in DOM');
            return;
        }

        Debug.init();
        TextBoardStorage.load();
        this.bindEvents();

        // Initialize subsystems
        TooltipSystem.init();
        ColorGrids.init();
        DropdownSystem.init();

        // Initial load for slide 0
        this.syncWithSlide(0);
        HistorySystem.saveState(true);
        console.log('✅ TextBoardSystem initialized successfully');
    },

    toggle() {
        console.log('📽️ TextBoardSystem.toggle() called', { overlay: this.overlay });
        if (!this.overlay) {
            console.error('❌ TextBoard toggle failed: overlay is null');
            return;
        }
        const isCurrentlyHidden = this.overlay.classList.contains('hidden');
        console.log('📽️ Current state:', { isCurrentlyHidden, classes: this.overlay.className });

        if (isCurrentlyHidden) {
            // Show overlay
            this.overlay.classList.remove('hidden');
            void this.overlay.offsetWidth; // Force reflow
            this.overlay.classList.add('active');
            console.log('📽️ TextBoard OPENED');
            const slideIdx = typeof window.getCurrentSlideIndex === 'function' ? window.getCurrentSlideIndex() : 0;
            this.syncWithSlide(slideIdx);
            this.editor.focus();
        } else {
            // Hide overlay
            this.overlay.classList.remove('active');
            HistorySystem.saveState();
            console.log('📽️ TextBoard CLOSED');
            setTimeout(() => {
                if (!this.overlay.classList.contains('active')) {
                    this.overlay.classList.add('hidden');
                }
            }, 600);
        }
    },

    syncWithSlide(index) {
        this.currentSlide = index;
        const savedHtml = TextBoardStorage.get(index);
        this.editor.innerHTML = savedHtml || "";
        HistorySystem.undoStack = [this.editor.innerHTML];
        HistorySystem.redoStack = [];
    },

    showToast(msg) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg);
        } else {
            console.log("TOAST:", msg);
        }
    },

    bindEvents() {
        // Close button
        document.getElementById('btn-close')?.addEventListener('click', () => this.toggle());

        // Projector button (alternative close/toggle)
        document.getElementById('btn-projector')?.addEventListener('click', () => this.toggle());

        // Undo/Redo
        document.getElementById('btn-undo')?.addEventListener('click', () => HistorySystem.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => HistorySystem.redo());

        // Clear
        document.getElementById('btn-clear')?.addEventListener('click', () => {
            if (confirm("Clear this entire board?")) {
                this.editor.innerHTML = "";
                HistorySystem.saveState(true);
            }
        });

        // === AI BUTTONS ===
        // Punctuation
        document.getElementById('btn-punct-check')?.addEventListener('click', () => runAiTool('punctuate_check'));
        document.getElementById('btn-punct-correct')?.addEventListener('click', () => runAiTool('punctuate_correct'));

        // Spelling
        document.getElementById('btn-spell-check')?.addEventListener('click', () => runAiTool('spelling_check'));
        document.getElementById('btn-spell-correct')?.addEventListener('click', () => runAiTool('spelling_correct'));

        // Grammar
        document.getElementById('btn-grammar-check')?.addEventListener('click', () => runAiTool('grammar_check'));
        document.getElementById('btn-grammar-correct')?.addEventListener('click', () => runAiTool('grammar_correct'));

        // SPAG Combined
        document.getElementById('btn-spag-check')?.addEventListener('click', () => runAiTool('spag_check'));
        document.getElementById('btn-spag-correct')?.addEventListener('click', () => runAiTool('spag_correct'));

        // Spoken Grammar
        document.getElementById('btn-spoken-grammar-check')?.addEventListener('click', () => runAiTool('spoken_grammar_check'));
        document.getElementById('btn-spoken-grammar-correct')?.addEventListener('click', () => runAiTool('spoken_grammar_correct'));

        // Comment
        document.getElementById('btn-comment')?.addEventListener('click', () => runAiTool('comment'));

        // Paraphrase
        document.getElementById('btn-paraphrase')?.addEventListener('click', () => {
            if (AI_CONFIG.paraphraseStyle === 'Custom' && !AI_CONFIG.customStyleInstruction) {
                document.getElementById('custom-style-overlay').classList.remove('hidden');
                document.getElementById('custom-style-modal').classList.remove('hidden');
            } else {
                runAiTool('paraphrase');
            }
        });

        // AI Apply/Discard
        document.getElementById('ai-apply-btn')?.addEventListener('click', () => applyPendingAi());
        document.getElementById('ai-discard-btn')?.addEventListener('click', () => discardPendingAi());

        // Mode Toggle
        const modeToggleBtn = document.getElementById('btn-mode-toggle');
        modeToggleBtn?.addEventListener('click', () => {
            AI_CONFIG.modeToggle = (AI_CONFIG.modeToggle === 'REPLACE' ? 'INSERT_BELOW' : 'REPLACE');
            modeToggleBtn.classList.toggle('active', AI_CONFIG.modeToggle === 'INSERT_BELOW');
            this.showToast(`Mode: ${AI_CONFIG.modeToggle}`);
        });

        // Paraphrase Style Dropdown
        document.getElementById('paraphrase-style')?.addEventListener('change', (e) => {
            AI_CONFIG.paraphraseStyle = e.target.value;
            if (e.target.value === 'Custom') {
                document.getElementById('custom-style-overlay').classList.remove('hidden');
                document.getElementById('custom-style-modal').classList.remove('hidden');
            }
        });

        // Custom Style Modal
        document.getElementById('custom-style-apply')?.addEventListener('click', () => {
            AI_CONFIG.customStyleInstruction = document.getElementById('custom-style-input').value;
            document.getElementById('custom-style-overlay').classList.add('hidden');
            document.getElementById('custom-style-modal').classList.add('hidden');
            runAiTool('paraphrase');
        });
        document.getElementById('custom-style-cancel')?.addEventListener('click', () => {
            document.getElementById('custom-style-overlay').classList.add('hidden');
            document.getElementById('custom-style-modal').classList.add('hidden');
        });

        // === FORMATTING BUTTONS (FIX: use focusAndExecSync) ===
        document.getElementById('btn-bold')?.addEventListener('click', () => focusAndExecSync('bold'));
        document.getElementById('btn-italic')?.addEventListener('click', () => focusAndExecSync('italic'));
        document.getElementById('btn-underline')?.addEventListener('click', () => focusAndExecSync('underline'));
        document.getElementById('btn-strike')?.addEventListener('click', () => focusAndExecSync('strikeThrough'));

        // Alignment (FIX: use focusAndExecSync)
        document.getElementById('btn-left')?.addEventListener('click', () => focusAndExecSync('justifyLeft'));
        document.getElementById('btn-center')?.addEventListener('click', () => focusAndExecSync('justifyCenter'));
        document.getElementById('btn-right')?.addEventListener('click', () => focusAndExecSync('justifyRight'));

        // Lists (FIX: use focusAndExecSync)
        document.getElementById('btn-ul')?.addEventListener('click', () => focusAndExecSync('insertUnorderedList'));
        document.getElementById('btn-ol')?.addEventListener('click', () => focusAndExecSync('insertOrderedList'));

        // Indent/Outdent (FIX: use focusAndExecSync)
        document.getElementById('btn-indent')?.addEventListener('click', () => focusAndExecSync('indent'));
        document.getElementById('btn-outdent')?.addEventListener('click', () => focusAndExecSync('outdent'));

        // === EXPORT ===
        document.getElementById('btn-export-img')?.addEventListener('click', () => ExportSystem.exportAsImage());
        document.getElementById('btn-export-pdf')?.addEventListener('click', () => ExportSystem.exportAsPDF());
        document.getElementById('btn-export-docx')?.addEventListener('click', () => ExportSystem.exportAsDOCX());

        // === STAMPS (FIX: scoped to textboard only, with focus management) ===
        const textboardOverlay = document.getElementById('textboard-overlay');
        if (textboardOverlay) {
            textboardOverlay.querySelectorAll('.stamp-btn').forEach(btn => {
                btn.addEventListener('mousedown', (e) => e.preventDefault());
                btn.addEventListener('click', () => {
                    const stamp = btn.dataset.stamp || btn.innerText;
                    focusAndExecSync('insertText', false, stamp);
                });
            });
        }

        // === MODE BUTTONS ===
        document.getElementById('btn-mode-blank')?.addEventListener('click', () => this.setMode('blank'));
        document.getElementById('btn-mode-convo')?.addEventListener('click', () => this.setMode('convo'));
        document.getElementById('btn-mode-dynamic')?.addEventListener('click', () => this.setMode('dynamic'));

        // Auto-save on input
        this.editor?.addEventListener('input', () => {
            HistorySystem.scheduleSave();
        });
    },

    setMode(mode) {
        // Placeholder for conversation mode implementation
        this.showToast(`Mode: ${mode}`);
        console.log('📝 TextBoard mode set to:', mode);
    }
};

// Global Exposure
window.TextBoardSystem = TextBoardSystem;
window.toggleTextBoard = () => TextBoardSystem.toggle();

// === DRAWING TOOL ===
const DrawingTool = {
    isEnabled: false,
    isDrawing: false,
    canvas: null,
    ctx: null,
    color: '#000000',
    size: 4,
    isEraser: false,

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) {
            // Create canvas if missing
            const overlay = document.getElementById('textboard-overlay');
            if (overlay) {
                this.canvas = document.createElement('canvas');
                this.canvas.id = 'drawing-canvas';
                overlay.appendChild(this.canvas);
            }
        }
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDraw());
        this.canvas.addEventListener('mouseleave', () => this.stopDraw());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.startDrawTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.drawTouch(e));
        this.canvas.addEventListener('touchend', () => this.stopDraw());

        window.addEventListener('resize', () => this.resizeCanvas());

        // Bind drawing tool buttons
        document.getElementById('btn-pen')?.addEventListener('click', () => this.toggle());
        document.getElementById('btn-eraser')?.addEventListener('click', () => this.toggleEraser());
        document.getElementById('btn-clear-drawing')?.addEventListener('click', () => this.clearCanvas());

        // Size buttons
        document.querySelectorAll('.drawing-size-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setSize(btn.dataset.size));
        });

        // Color buttons
        document.querySelectorAll('.drawing-color-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setColor(btn.dataset.color));
        });
    },

    resizeCanvas() {
        if (this.canvas && this.canvas.parentElement) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height - 96; // Toolbar offset
        }
    },

    toggle() {
        this.isEnabled = !this.isEnabled;
        this.isEraser = false;
        document.getElementById('textboard-overlay')?.classList.toggle('drawing-mode', this.isEnabled);
        document.getElementById('btn-pen')?.classList.toggle('active', this.isEnabled);
        document.getElementById('btn-eraser')?.classList.remove('active');
        if (this.isEnabled) this.resizeCanvas();
    },

    toggleEraser() {
        if (!this.isEnabled) this.toggle();
        this.isEraser = !this.isEraser;
        document.getElementById('btn-eraser')?.classList.toggle('active', this.isEraser);
    },

    startDraw(e) {
        if (!this.isEnabled) return;
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    },

    startDrawTouch(e) {
        if (!this.isEnabled) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    },

    draw(e) {
        if (!this.isDrawing) return;
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.strokeStyle = this.isEraser ? '#0B0C15' : this.color;
        this.ctx.lineWidth = this.isEraser ? this.size * 3 : this.size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    },

    drawTouch(e) {
        if (!this.isDrawing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        this.ctx.strokeStyle = this.isEraser ? '#0B0C15' : this.color;
        this.ctx.lineWidth = this.isEraser ? this.size * 3 : this.size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    },

    stopDraw() {
        this.isDrawing = false;
    },

    setSize(px) {
        this.size = parseInt(px);
        document.querySelectorAll('.drawing-size-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.size) === this.size);
        });
    },

    setColor(color) {
        this.color = color;
        this.isEraser = false;
        document.getElementById('btn-eraser')?.classList.remove('active');
        document.querySelectorAll('.drawing-color-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.color === this.color);
        });
    },

    clearCanvas() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// === VOICE SYSTEM (TextBoard) ===
const TB_VoiceSystem = {
    recognition: null,
    isRecording: false,
    autoSpag: false,

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition API not available');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-GB';

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateIcons(true);
            TextBoardSystem.showToast('🎤 Listening...');
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateIcons(false);
        };

        this.recognition.onerror = (e) => {
            console.error('Speech recognition error:', e.error);
            this.isRecording = false;
            this.updateIcons(false);
            if (e.error !== 'aborted') {
                TextBoardSystem.showToast('Voice error: ' + e.error);
            }
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                const editor = document.getElementById('textboard-editor');
                const prefix = editor.innerText.trim() ? ' ' : '';
                document.execCommand('insertText', false, prefix + finalTranscript);

                if (this.autoSpag) {
                    setTimeout(() => runAiTool('spag_correct'), 500);
                }
            }
        };

        // Bind buttons
        document.getElementById('tb-mic-btn')?.addEventListener('click', () => this.toggle(false));
        document.getElementById('tb-mic-spag-btn')?.addEventListener('click', () => this.toggle(true));
    },

    toggle(autoSpag = false) {
        if (!this.recognition) {
            this.init();
            if (!this.recognition) {
                TextBoardSystem.showToast('Voice input not supported in this browser');
                return;
            }
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.autoSpag = autoSpag;
            try {
                this.recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    },

    updateIcons(active) {
        const btn = document.getElementById('tb-mic-btn');
        const spagBtn = document.getElementById('tb-mic-spag-btn');

        if (btn) {
            btn.style.color = (active && !this.autoSpag) ? '#ef4444' : '';
            btn.style.backgroundColor = (active && !this.autoSpag) ? 'rgba(239, 68, 68, 0.2)' : '';
        }
        if (spagBtn) {
            spagBtn.style.color = (active && this.autoSpag) ? '#22c55e' : '';
            spagBtn.style.backgroundColor = (active && this.autoSpag) ? 'rgba(34, 197, 94, 0.2)' : '';
        }
    }
};

// === IMAGE PASTE SYSTEM ===
const ImagePasteSystem = {
    init() {
        const editor = document.getElementById('textboard-editor');
        if (!editor) return;

        editor.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = document.createElement('img');
                        img.src = evt.target.result;
                        img.style.maxWidth = '400px';
                        img.style.cursor = 'pointer';
                        document.execCommand('insertHTML', false, img.outerHTML);
                        HistorySystem.saveState(true);
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        });
    }
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    TextBoardSystem.init();
    DrawingTool.init();
    TB_VoiceSystem.init();
    ImagePasteSystem.init();
});
