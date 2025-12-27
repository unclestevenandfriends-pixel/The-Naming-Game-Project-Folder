// ╔═══════════════════════════════════════════════════════════════════════════════════════╗
// ║  TEXTBOARD V14 - AI TEACHER EDITION                                                    ║
// ║                                                                                         ║
// ║  All SPAG processing is handled via Google Apps Script proxy to Gemini 2.0 Flash       ║
// ║  British English · KS2 Educational Context                                              ║
// ╚═══════════════════════════════════════════════════════════════════════════════════════╝

// === DEBUG SYSTEM ===
const TB_Debug = {
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
    },

    clear() {
        if (this.logEl) this.logEl.innerHTML = '';
    },

    toggle() {
        if (this.panel) this.panel.classList.toggle('show');
    }
};

// === UNDO SYSTEM ===
const TB_History = {
    undoStack: [],
    redoStack: [],
    maxHistory: 50,
    isRestoring: false,
    saveTimer: null,

    saveState(force = false) {
        if (this.isRestoring) return;
        const editor = document.getElementById('textboard-editor');
        if (!editor) return;
        const current = editor.innerHTML;
        const last = this.undoStack[this.undoStack.length - 1];
        if (last === current) return;
        this.undoStack.push(current);
        if (this.undoStack.length > this.maxHistory) this.undoStack.shift();
        this.redoStack = [];
    },

    flushPending() {
        if (!this.saveTimer) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        this.saveState(true);
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
        this.flushPending();
        const editor = document.getElementById('textboard-editor');
        if (!editor || this.undoStack.length < 2) {
            TB_Debug.log('⚠️ Nothing to undo', 'warn');
            return;
        }
        this.isRestoring = true;
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        editor.innerHTML = this.undoStack[this.undoStack.length - 1];
        this.isRestoring = false;
        editor.focus();
        TB_Debug.log('↩️ Undo applied', 'success');
    },

    redo() {
        this.flushPending();
        const editor = document.getElementById('textboard-editor');
        if (!editor || this.redoStack.length == 0) {
            TB_Debug.log('⚠️ Nothing to redo', 'warn');
            return;
        }
        this.isRestoring = true;
        const next = this.redoStack.pop();
        this.undoStack.push(next);
        editor.innerHTML = next;
        this.isRestoring = false;
        editor.focus();
        TB_Debug.log('↪️ Redo applied', 'success');
    }
};

// === DRAWING TOOL ===
const TB_DrawingTool = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    isEnabled: false,
    color: '#000000',
    size: 4,
    isEraser: false,

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (!this.canvas) {
            TB_Debug.log('Drawing canvas not found!', 'error');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDraw(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDraw());
        this.canvas.addEventListener('mouseleave', () => this.stopDraw());

        // Touch events for tablet/mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.startDraw({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.draw({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        this.canvas.addEventListener('touchend', () => this.stopDraw());

        TB_Debug.log('Drawing tool initialized');
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const overlay = document.getElementById('textboard-overlay');
        if (!overlay) return;
        const rect = overlay.getBoundingClientRect();
        // Only resize if overlay is visible (has dimensions)
        if (rect.width > 0 && rect.height > 0) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height - 96; // minus toolbar height
            TB_Debug.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
        }
    },

    toggle() {
        this.isEnabled = !this.isEnabled;
        const overlay = document.getElementById('textboard-overlay');
        if (overlay) overlay.classList.toggle('drawing-mode', this.isEnabled);
        const penBtn = document.getElementById('btn-pen');
        if (penBtn) penBtn.classList.toggle('active', this.isEnabled);
        // Resize canvas when enabling (in case it wasn't sized properly before)
        if (this.isEnabled) {
            this.resizeCanvas();
        }
        TB_Debug.log(`Drawing mode: ${this.isEnabled ? 'ON' : 'OFF'}`);
    },

    startDraw(e) {
        if (!this.isEnabled) return;
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    },

    draw(e) {
        if (!this.isDrawing) return;
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.strokeStyle = this.isEraser ? '#0B0C15' : this.color;
        this.ctx.lineWidth = this.isEraser ? this.size * 3 : this.size;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    },

    stopDraw() {
        this.isDrawing = false;
    },

    setColor(hex) {
        this.color = hex;
        this.isEraser = false;
        document.getElementById('btn-eraser')?.classList.remove('active');
        document.querySelectorAll('.drawing-color-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.color === hex);
        });
    },

    setSize(px) {
        this.size = parseInt(px);
        document.querySelectorAll('.drawing-size-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.size) === this.size);
        });
    },

    setEraser() {
        this.isEraser = true;
        document.querySelectorAll('.drawing-color-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('btn-eraser')?.classList.add('active');
    },

    clear() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// === VOICE SYSTEM ===
const TB_VoiceSystem = {
    recognition: null,
    isRecording: false,
    editor: null,
    autoSpag: false,
    pendingRestart: false,
    pendingAutoSpag: false,
    sessionMarkerId: 'tb-voice-session-marker',

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            TB_Debug.log('⚠️ Speech Recognition not supported', 'warn');
            const micBtn = document.getElementById('tb-mic-btn');
            const micSpagBtn = document.getElementById('tb-mic-spag-btn');
            if (micBtn) micBtn.style.display = 'none';
            if (micSpagBtn) micSpagBtn.style.display = 'none';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-GB';

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateButton(true);
            TB_Debug.log('🎙️ Voice recording started', 'success');
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateButton(false);
            if (this.pendingRestart) {
                this.pendingRestart = false;
                this.autoSpag = this.pendingAutoSpag;
                try {
                    this.recognition.start();
                } catch (e) {
                    TB_Debug.log('❌ Voice restart error: ' + e.message, 'error');
                }
                return;
            }
            this.clearSessionMarker();
            TB_Debug.log('🛑 Voice recording stopped');
        };

        this.recognition.onerror = (e) => {
            TB_Debug.log('❌ Voice error: ' + e.error, 'error');
            this.isRecording = false;
            this.updateButton(false);
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript && this.editor) {
                this.handleVoiceInput(finalTranscript);
            }
        };

        TB_Debug.log('✅ Voice system initialized');
    },

    toggle(editor, options = {}) {
        this.editor = editor;
        const desiredAutoSpag = !!options.autoSpag;

        if (!this.recognition) {
            this.init();
            if (!this.recognition) return;
        }

        if (this.isRecording) {
            if (desiredAutoSpag !== this.autoSpag) {
                this.pendingRestart = true;
                this.pendingAutoSpag = desiredAutoSpag;
            }
            this.recognition.stop();
        } else {
            this.autoSpag = desiredAutoSpag;
            this.pendingRestart = false;
            this.pendingAutoSpag = false;
            this.ensureSessionMarker();
            try {
                this.recognition.start();
            } catch (e) {
                TB_Debug.log('❌ Voice start error: ' + e.message, 'error');
            }
        }
    },

    updateButton(isRecording) {
        const btn = document.getElementById('tb-mic-btn');
        const spagBtn = document.getElementById('tb-mic-spag-btn');
        if (btn) {
            const active = isRecording && !this.autoSpag;
            btn.style.color = active ? '#ef4444' : '';
            btn.style.animation = active ? 'pulse 1s infinite' : '';
        }
        if (spagBtn) {
            const active = isRecording && this.autoSpag;
            spagBtn.style.color = active ? '#22c55e' : '';
            spagBtn.style.animation = active ? 'pulse 1s infinite' : '';
        }
    },

    handleVoiceInput(transcript) {
        const { cleanText, mode } = this.autoSpag
            ? this.parseVoiceCommand(transcript)
            : { cleanText: transcript, mode: null };

        if (cleanText && this.editor) {
            TB_History.saveState(true);
            const space = (this.editor.innerText.length > 0 && !this.editor.innerText.endsWith(' ')) ? ' ' : '';
            this.editor.focus();
            document.execCommand('insertText', false, space + cleanText);
            TB_History.saveState(true);
            TB_Debug.log('📝 Voice: "' + cleanText.substring(0, 40) + '..."');
        }

        if (mode) {
            this.applyCorrectionForSession(mode);
        }
    },

    parseVoiceCommand(transcript) {
        const commands = [
            { phrase: 'correct punctuation', mode: 'punctuate_correct' },
            { phrase: 'correct spelling', mode: 'spell_correct' },
            { phrase: 'correct grammar', mode: 'grammar_correct' },
            { phrase: 'correct spag', mode: 'spag_correct' }
        ];

        for (const cmd of commands) {
            const pattern = cmd.phrase.replace(/\s+/g, '\\s+');
            const startRegex = new RegExp(`^\\s*${pattern}\\b\\s*`, 'i');
            const endRegex = new RegExp(`\\b${pattern}\\b\\s*$`, 'i');
            const trimmed = transcript.trim();

            if (startRegex.test(trimmed) || endRegex.test(trimmed)) {
                let cleanText = trimmed.replace(startRegex, '').replace(endRegex, '').trim();
                return { cleanText, mode: cmd.mode };
            }
        }

        return { cleanText: transcript, mode: null };
    },

    ensureSessionMarker() {
        if (!this.editor) return;
        this.clearSessionMarker();

        const marker = document.createElement('span');
        marker.id = this.sessionMarkerId;
        marker.className = 'tb-voice-marker';
        marker.setAttribute('aria-hidden', 'true');

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && this.editor.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            range.collapse(true);
            range.insertNode(marker);
            range.setStartAfter(marker);
            range.setEndAfter(marker);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            this.editor.appendChild(marker);
        }
    },

    clearSessionMarker() {
        const existing = document.getElementById(this.sessionMarkerId);
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    },

    applyCorrectionForSession(mode) {
        if (!this.editor) return;
        const marker = document.getElementById(this.sessionMarkerId);
        if (marker && this.editor.contains(marker)) {
            const endNode = this.editor.lastChild;
            if (endNode && endNode !== marker) {
                const range = document.createRange();
                range.setStartAfter(marker);
                range.setEndAfter(endNode);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        runAiTool(mode);
    }
};







// === IMAGE PASTE & RESIZE SYSTEM ===
const TB_ImagePaste = {
    editor: null,
    resizer: null,
    selectedImg: null,
    isResizing: false,
    currentHandle: null,
    startRect: null,
    startX: 0,
    startY: 0,

    init(editor) {
        this.editor = editor;
        this.resizer = document.getElementById('image-resizer');

        // Paste handler
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        // Image click for selection
        this.editor.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                this.selectImage(e.target);
            } else {
                this.deselectImage();
            }
        });

        // Resize interaction
        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('tb-resizer-handle')) {
                this.startResize(e);
            }
        });

        document.addEventListener('mousemove', (e) => this.doResize(e));
        document.addEventListener('mouseup', () => this.stopResize());

        // Hide resizer on scroll or window resize
        this.editor.addEventListener('scroll', () => this.updateResizerPos());
        window.addEventListener('resize', () => this.updateResizerPos());

        TB_Debug.log('🖼️ Image Paste system initialized');
    },

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new Image();
                    img.src = evt.target.result;
                    img.onload = () => {
                        // Default size to a reasonable width
                        if (img.width > 400) {
                            img.style.width = '400px';
                            img.style.height = 'auto';
                        }
                        this.insertImage(img.src, img.style.width);
                    };
                };
                reader.readAsDataURL(file);
                TB_Debug.log('🖼️ Image pasted from clipboard', 'success');
            }
        }
    },

    insertImage(src, width) {
        TB_History.saveState(true);
        const imgHtml = `<img src="${src}" style="width: ${width || 'auto'}; height: auto;">`;
        document.execCommand('insertHTML', false, imgHtml);
        TB_History.saveState(true);
    },

    selectImage(img) {
        if (this.selectedImg) this.deselectImage();
        this.selectedImg = img;
        this.selectedImg.classList.add('selected');
        this.updateResizerPos();
        this.resizer.classList.add('active');
    },

    deselectImage() {
        if (this.selectedImg) {
            this.selectedImg.classList.remove('selected');
            this.selectedImg = null;
        }
        if (this.resizer) this.resizer.classList.remove('active');
    },

    updateResizerPos() {
        if (!this.selectedImg || !this.resizer) return;
        const rect = this.selectedImg.getBoundingClientRect();
        const editorRect = this.editor.getBoundingClientRect();
        const overlay = document.getElementById('textboard-overlay');
        const overlayRect = overlay.getBoundingClientRect();

        // Position relative to the overlay container (which is postion:fixed)
        this.resizer.style.width = rect.width + 'px';
        this.resizer.style.height = rect.height + 'px';
        this.resizer.style.top = (rect.top - overlayRect.top) + 'px';
        this.resizer.style.left = (rect.left - overlayRect.left) + 'px';
    },

    startResize(e) {
        if (!this.selectedImg) return;
        this.isResizing = true;
        this.currentHandle = e.target.dataset.handle;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startRect = {
            width: this.selectedImg.width,
            height: this.selectedImg.height
        };
        e.preventDefault();
        document.body.style.cursor = window.getComputedStyle(e.target).cursor;
    },

    doResize(e) {
        if (!this.isResizing || !this.selectedImg) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        const ratio = this.startRect.width / this.startRect.height;

        let newWidth = this.startRect.width;
        let newHeight = this.startRect.height;

        if (this.currentHandle === 'br') {
            newWidth = this.startRect.width + dx;
            newHeight = newWidth / ratio;
        } else if (this.currentHandle === 'bl') {
            newWidth = this.startRect.width - dx;
            newHeight = newWidth / ratio;
        } else if (this.currentHandle === 'tr') {
            newWidth = this.startRect.width + dx;
            newHeight = newWidth / ratio;
        } else if (this.currentHandle === 'tl') {
            newWidth = this.startRect.width - dx;
            newHeight = newWidth / ratio;
        }

        if (newWidth > 50) {
            this.selectedImg.style.width = newWidth + 'px';
            this.selectedImg.style.height = 'auto'; // Keep aspect ratio
            this.updateResizerPos();
        }
    },

    stopResize() {
        if (this.isResizing) {
            this.isResizing = false;
            document.body.style.cursor = '';
            TB_History.saveState(true);
        }
    },

    alignImage(align) {
        if (!this.selectedImg) return;
        TB_History.saveState(true);
        if (align === 'center') {
            this.selectedImg.style.display = 'block';
            this.selectedImg.style.marginLeft = 'auto';
            this.selectedImg.style.marginRight = 'auto';
        } else if (align === 'right') {
            this.selectedImg.style.display = 'block';
            this.selectedImg.style.marginLeft = 'auto';
            this.selectedImg.style.marginRight = '0';
        } else {
            this.selectedImg.style.display = 'inline-block';
            this.selectedImg.style.marginLeft = '0';
            this.selectedImg.style.marginRight = '0';
        }
        this.updateResizerPos();
        TB_History.saveState(true);
    }
};

// === EXPORT SYSTEM ===
const TB_Export = {
    async exportAsImage() {
        try {
            TextBoardSystem.showToast('Generating Image...');
            const editor = document.getElementById('textboard-editor');
            if (!editor) {
                alert('Editor not found');
                return;
            }

            // html2canvas captures the visible element
            const canvas = await html2canvas(editor, {
                backgroundColor: '#0B0C15',
                scale: 2,
                useCORS: true,
                logging: false,
                scrollX: 0,
                scrollY: -window.scrollY, // Capture from top
                windowWidth: editor.scrollWidth,
                windowHeight: editor.scrollHeight
            });

            const link = document.createElement('a');
            link.download = `textboard_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            TextBoardSystem.showToast('Image saved!');
            TB_Debug.log('📸 Exported as image', 'success');
        } catch (err) {
            console.error('Export image error:', err);
            alert('Failed to export image: ' + err.message);
        }
    },

    exportAsPDF() {
        const editor = document.getElementById('textboard-editor');
        const opt = {
            margin: 10,
            filename: 'textboard.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(editor).save();
    },

    async exportAsDOCX() {
        try {
            TextBoardSystem.showToast('Generating DOCX...');
            const editor = document.getElementById('textboard-editor');
            if (!editor) {
                alert('Editor not found');
                return;
            }

            // UMD build exposes as global `docx`
            if (typeof docx === 'undefined') {
                throw new Error('DOCX library not loaded. Check your internet connection and refresh the page.');
            }

            const { Document, Packer, Paragraph, TextRun } = docx;

            const paragraphs = [];
            const lines = editor.innerText.split('\n');

            for (const line of lines) {
                if (line.trim() === '') {
                    paragraphs.push(new Paragraph({ children: [] }));
                } else {
                    paragraphs.push(new Paragraph({
                        children: [new TextRun({
                            text: line,
                            color: "000000"
                        })]
                    }));
                }
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs
                }]
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `textboard_${Date.now()}.docx`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
            TextBoardSystem.showToast('DOCX saved!');
            TB_Debug.log('📝 Exported as DOCX', 'success');
        } catch (err) {
            console.error('Export DOCX error:', err);
            alert('Failed to export DOCX: ' + err.message);
        }
    }
};

// === TEXTBOARD MAIN SYSTEM ===
const TextBoardSystem = {
    colors: [
        '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b',
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
    ],
    overlay: null,
    editor: null,
    isOpen: false,

    init() {
        this.overlay = document.getElementById('textboard-overlay');
        this.editor = document.getElementById('textboard-editor');
        if (!this.overlay || !this.editor) {
            TB_Debug.log('TextBoard elements not found!', 'error');
            return;
        }

        TB_History.saveState(true);
        document.execCommand('styleWithCSS', false, true);

        this.populateColorGrids();
        this.bindAllEvents();
        this.initTooltips();

        TB_VoiceSystem.init();
        TB_ImagePaste.init(this.editor);
        TB_Debug.log('✅ TextBoard V14 initialized', 'success');
        this.syncHeaderButton();
    },

    syncHeaderButton() {
        const toolBtn = document.getElementById('gcd-projector');
        if (!toolBtn) return;
        const overlayVisible = this.overlay && !this.overlay.classList.contains('hidden');
        const isActive = this.isOpen && overlayVisible;
        toolBtn.classList.toggle('active', isActive);
        toolBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    },

    populateColorGrids() {
        const textGrid = document.getElementById('text-color-grid');
        const hiliteGrid = document.getElementById('hilite-color-grid');

        this.colors.forEach(color => {
            const s1 = document.createElement('div');
            s1.className = 'tb-color-swatch';
            s1.style.backgroundColor = color;
            s1.dataset.color = color;
            textGrid.appendChild(s1);

            const s2 = document.createElement('div');
            s2.className = 'tb-color-swatch';
            s2.style.backgroundColor = color;
            s2.dataset.hilite = color;
            hiliteGrid.appendChild(s2);
        });
    },

    bindAllEvents() {
        // Toggle projector
        const mockTrigger = document.getElementById('mock-trigger');
        if (mockTrigger) mockTrigger.addEventListener('click', () => this.toggle());
        const debugToggle = document.getElementById('debug-toggle');
        if (debugToggle) debugToggle.addEventListener('click', () => TB_Debug.toggle());

        // Toolbar buttons
        const projectorBtn = document.getElementById('btn-projector');
        if (projectorBtn) projectorBtn.addEventListener('click', () => this.toggle());
        // ═══════════════════════════════════════════════════════════════════
        // MODE BUTTONS - Use mousedown with preventDefault to preserve selection
        // ═══════════════════════════════════════════════════════════════════
        const modeBtn = (id, mode) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.applyMode(mode);
            });
        };
        modeBtn('btn-mode-blank', 'blank');
        modeBtn('btn-mode-convo', 'conversation');
        modeBtn('btn-mode-dynamic', 'dynamic');

        document.getElementById('btn-undo').addEventListener('click', () => TB_History.undo());
        document.getElementById('btn-redo').addEventListener('click', () => TB_History.redo());

        // ═══════════════════════════════════════════════════════════════════
        // FORMATTING BUTTONS - Use mousedown to preserve selection
        // ═══════════════════════════════════════════════════════════════════
        const formatBtn = (id, cmd) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.format(cmd);
            });
        };
        formatBtn('btn-bold', 'bold');
        formatBtn('btn-italic', 'italic');
        formatBtn('btn-underline', 'underline');
        formatBtn('btn-strike', 'strikethrough');

        // Alignment with image support
        const alignBtn = (id, align, justify) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (TB_ImagePaste.selectedImg) TB_ImagePaste.alignImage(align);
                else this.format(justify);
            });
        };
        alignBtn('btn-left', 'left', 'justifyLeft');
        alignBtn('btn-center', 'center', 'justifyCenter');
        alignBtn('btn-right', 'right', 'justifyRight');

        formatBtn('btn-ul', 'insertUnorderedList');
        formatBtn('btn-ol', 'insertOrderedList');
        formatBtn('btn-indent', 'indent');
        formatBtn('btn-outdent', 'outdent');

        document.getElementById('btn-clear').addEventListener('click', () => this.clear());
        document.getElementById('btn-close').addEventListener('click', () => this.close());
        document.getElementById('tb-mic-btn').addEventListener('click', () => TB_VoiceSystem.toggle(this.editor, { autoSpag: false }));
        document.getElementById('tb-mic-spag-btn').addEventListener('click', () => TB_VoiceSystem.toggle(this.editor, { autoSpag: true }));
        // Export buttons
        document.getElementById('btn-export-img').addEventListener('click', () => TB_Export.exportAsImage());
        document.getElementById('btn-export-pdf').addEventListener('click', () => TB_Export.exportAsPDF());
        document.getElementById('btn-export-docx').addEventListener('click', () => TB_Export.exportAsDOCX());

        // SPAG buttons (AI POWERED)
        document.getElementById('btn-punct-check').addEventListener('click', () => runAiTool('punctuate_check'));
        document.getElementById('btn-punct-correct').addEventListener('click', () => runAiTool('punctuate_correct'));
        document.getElementById('btn-spell-check').addEventListener('click', () => runAiTool('spell_check'));
        document.getElementById('btn-spell-correct').addEventListener('click', () => runAiTool('spell_correct'));
        document.getElementById('btn-grammar-check').addEventListener('click', () => runAiTool('grammar_check'));
        document.getElementById('btn-grammar-correct').addEventListener('click', () => runAiTool('grammar_correct'));
        document.getElementById('btn-spag-check').addEventListener('click', () => runAiTool('spag_check'));
        document.getElementById('btn-spag-correct').addEventListener('click', () => runAiTool('spag_correct'));
        document.getElementById('btn-comment').addEventListener('click', () => runAiTool('comment'));
        document.getElementById('btn-spoken-grammar-check').addEventListener('click', () => runAiTool('spoken_grammar_check'));
        document.getElementById('btn-spoken-grammar-correct').addEventListener('click', () => runAiTool('spoken_grammar_correct'));

        // Mode Toggle (Replace/Insert Below)
        const modeToggleBtn = document.getElementById('btn-mode-toggle');
        if (modeToggleBtn) {
            modeToggleBtn.addEventListener('click', () => {
                if (TB_AI_CONFIG.modeToggle === 'REPLACE') {
                    TB_AI_CONFIG.modeToggle = 'INSERT_BELOW';
                    modeToggleBtn.classList.add('active');
                    modeToggleBtn.title = 'Mode: Insert Below (click to toggle)';
                    this.showToast('Mode: Insert Below');
                } else {
                    TB_AI_CONFIG.modeToggle = 'REPLACE';
                    modeToggleBtn.classList.remove('active');
                    modeToggleBtn.title = 'Mode: Replace (click to toggle)';
                    this.showToast('Mode: Replace');
                }
            });
        }

        // Paraphrase Style Dropdown
        const paraphraseStyleDropdown = document.getElementById('paraphrase-style');
        if (paraphraseStyleDropdown) {
            paraphraseStyleDropdown.addEventListener('change', (e) => {
                TB_AI_CONFIG.paraphraseStyle = e.target.value;
                if (e.target.value === 'Custom') {
                    // Show custom style modal
                    document.getElementById('custom-style-overlay').classList.remove('hidden');
                    document.getElementById('custom-style-modal').classList.remove('hidden');
                    document.getElementById('custom-style-input').focus();
                }
            });
        }

        // Paraphrase button - pass style options
        document.getElementById('btn-paraphrase').addEventListener('click', () => {
            if (TB_AI_CONFIG.paraphraseStyle === 'Custom' && !TB_AI_CONFIG.customStyleInstruction) {
                // Show modal if custom but no instruction yet
                document.getElementById('custom-style-overlay').classList.remove('hidden');
                document.getElementById('custom-style-modal').classList.remove('hidden');
                document.getElementById('custom-style-input').focus();
            } else {
                runAiTool('paraphrase', {
                    paraphraseStyle: TB_AI_CONFIG.paraphraseStyle,
                    customStyleInstruction: TB_AI_CONFIG.customStyleInstruction
                });
            }
        });

        // Custom Style Modal handlers
        const hideModal = () => {
            document.getElementById('custom-style-overlay').classList.add('hidden');
            document.getElementById('custom-style-modal').classList.add('hidden');
        };

        document.getElementById('custom-style-cancel')?.addEventListener('click', () => {
            hideModal();
            // Reset dropdown to Formal if cancelled
            if (paraphraseStyleDropdown) paraphraseStyleDropdown.value = 'Formal';
            TB_AI_CONFIG.paraphraseStyle = 'Formal';
        });

        document.getElementById('custom-style-overlay')?.addEventListener('click', () => {
            hideModal();
            if (paraphraseStyleDropdown) paraphraseStyleDropdown.value = 'Formal';
            TB_AI_CONFIG.paraphraseStyle = 'Formal';
        });

        document.getElementById('custom-style-apply')?.addEventListener('click', () => {
            const customInput = document.getElementById('custom-style-input');
            TB_AI_CONFIG.customStyleInstruction = customInput?.value || '';
            hideModal();
            // Run paraphrase with custom style
            runAiTool('paraphrase', {
                paraphraseStyle: 'Custom',
                customStyleInstruction: TB_AI_CONFIG.customStyleInstruction
            });
        });

        // Stamp tool
        let activeStamp = null;
        const setStamp = (emoji, buttonEl) => {
            document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('stamp-active'));
            if (activeStamp === emoji) {
                activeStamp = null;
            } else {
                activeStamp = emoji;
                buttonEl.classList.add('stamp-active');
            }
        };
        document.querySelectorAll('.stamp-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                setStamp(btn.dataset.stamp, btn);
            });
        });
        this.editor.addEventListener('click', (e) => {
            if (activeStamp && !e.target.closest('.tb-row-btn')) {
                document.execCommand('insertText', false, activeStamp);
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeStamp) {
                document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('stamp-active'));
                activeStamp = null;
            }
        });

        // Robust Dropdown Logic
        const setupDropdown = (btnId, menuId) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleDropdown(menuId);
                });
            }
        };
        setupDropdown('font-btn', 'font-menu');
        setupDropdown('size-btn', 'size-menu');
        setupDropdown('color-btn', 'color-menu');
        setupDropdown('hilite-btn', 'hilite-menu');

        // Font items
        document.querySelectorAll('[data-font]').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const font = item.dataset.font;
                this.format('fontName', font);
                document.getElementById('current-font-label').innerText = font;
                this.closeDropdowns();
            });
        });

        // Size items
        document.querySelectorAll('[data-size]').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const size = item.dataset.size;
                this.format('fontSize', size);
                document.getElementById('current-size-label').innerText = 'Size ' + size;
                this.closeDropdowns();
            });
        });

        // Color swatches
        document.querySelectorAll('[data-color]').forEach(swatch => {
            swatch.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const color = swatch.dataset.color;
                this.format('foreColor', color);
                document.getElementById('color-indicator').style.backgroundColor = color;
                this.closeDropdowns();
            });
        });

        // Highlight swatches
        document.querySelectorAll('[data-hilite]').forEach(swatch => {
            swatch.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const color = swatch.dataset.hilite;
                const val = color === 'transparent' ? 'rgba(0,0,0,0)' : color;
                document.execCommand('hiliteColor', false, val) || document.execCommand('backColor', false, val);
                document.getElementById('hilite-indicator').style.backgroundColor = color === 'transparent' ? '' : color;
                this.closeDropdowns();
            });
        });

        // Close dropdowns on outside click
        window.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.tb-dropdown-container')) {
                this.closeDropdowns();
            }
        });

        // Drawing Tool buttons
        const penBtn = document.getElementById('btn-pen');
        if (penBtn) penBtn.addEventListener('click', () => TB_DrawingTool.toggle());

        document.querySelectorAll('.drawing-size-btn').forEach(btn => {
            btn.addEventListener('click', () => TB_DrawingTool.setSize(btn.dataset.size));
        });

        document.querySelectorAll('.drawing-color-btn').forEach(btn => {
            btn.addEventListener('click', () => TB_DrawingTool.setColor(btn.dataset.color));
        });

        const eraserBtn = document.getElementById('btn-eraser');
        if (eraserBtn) eraserBtn.addEventListener('click', () => TB_DrawingTool.setEraser());

        const clearDrawingBtn = document.getElementById('btn-clear-drawing');
        if (clearDrawingBtn) clearDrawingBtn.addEventListener('click', () => TB_DrawingTool.clear());

        // Editor keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            // Stop propagation to prevent game navigation from intercepting
            e.stopPropagation();

            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand(e.shiftKey ? 'outdent' : 'indent', false, null);
            }
            if (e.key === 'Escape') this.close();
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                TB_History.undo();
            }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
                e.preventDefault();
                TB_History.redo();
            }
        });
        this.editor.addEventListener('input', () => TB_History.scheduleSave());
        this.editor.addEventListener('blur', () => TB_History.saveState(true));

        this.editor.addEventListener('click', (e) => {
            const btn = e.target.closest('.tb-row-btn');
            if (!btn) return;
            const row = btn.closest('.tb-convo-row');
            if (!row) return;
            e.preventDefault();
            e.stopPropagation();
            this.updateDynamicRowLayout(row, btn.dataset.layout);
        });

        // Option B: Custom Visual Selection
        this.initColumnSelection();
    },

    initColumnSelection() {
        let isDragging = false;
        let startCell = null;
        let startColIndex = -1;
        let container = null;

        const getCell = (el) => el?.closest('td, .tb-convo-cell');

        const getColIndex = (cell) => {
            if (!cell) return -1;
            if (cell.tagName === 'TD') return cell.cellIndex;
            const row = cell.closest('.tb-convo-row');
            if (!row) return -1;
            return Array.from(row.querySelectorAll('.tb-convo-cell')).indexOf(cell);
        };

        const getRowIndex = (cell) => {
            if (!cell) return -1;
            if (cell.tagName === 'TD') return cell.parentElement.rowIndex;
            const cont = cell.closest('.tb-convo-dynamic');
            if (!cont) return -1;
            return Array.from(cont.querySelectorAll('.tb-convo-row')).indexOf(cell.closest('.tb-convo-row'));
        };

        const getCellsInColumn = (cont, colIdx) => {
            const cells = [];
            if (cont.classList.contains('tb-convo-table')) {
                cont.querySelectorAll('tr').forEach(r => r.cells[colIdx] && cells.push(r.cells[colIdx]));
            } else {
                cont.querySelectorAll('.tb-convo-row').forEach(r => {
                    const c = r.querySelectorAll('.tb-convo-cell')[colIdx];
                    if (c) cells.push(c);
                });
            }
            return cells;
        };

        const clearHighlights = () => {
            document.querySelectorAll('.tb-cell-selected').forEach(el => el.classList.remove('tb-cell-selected'));
        };

        const highlightRange = (cont, colIdx, startRow, endRow) => {
            clearHighlights();
            const cells = getCellsInColumn(cont, colIdx);
            const minR = Math.min(startRow, endRow);
            const maxR = Math.max(startRow, endRow);
            cells.forEach((c, i) => {
                if (i >= minR && i <= maxR) c.classList.add('tb-cell-selected');
            });
        };

        const createSelectionFromHighlighted = () => {
            const highlighted = document.querySelectorAll('.tb-cell-selected');
            if (highlighted.length === 0) return;
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            range.setStartBefore(highlighted[0].firstChild || highlighted[0]);
            range.setEndAfter(highlighted[highlighted.length - 1].lastChild || highlighted[highlighted.length - 1]);
            sel.addRange(range);
        };

        this.editor.addEventListener('mousedown', (e) => {
            const cell = getCell(e.target);
            const cont = e.target.closest('.tb-convo-table, .tb-convo-dynamic');
            if (!cont || !cell) return;

            isDragging = true;
            startCell = cell;
            startColIndex = getColIndex(cell);
            container = cont;
            clearHighlights();
            cell.classList.add('tb-cell-selected');
        });

        this.editor.addEventListener('mousemove', (e) => {
            if (!isDragging || !container || startColIndex < 0) return;

            const cell = getCell(e.target);
            if (!cell || !container.contains(cell)) return;

            const colIdx = getColIndex(cell);
            if (colIdx !== startColIndex) return; // Stay in same column

            const startRow = getRowIndex(startCell);
            const endRow = getRowIndex(cell);
            highlightRange(container, startColIndex, startRow, endRow);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                createSelectionFromHighlighted();
                clearHighlights();
            }
            isDragging = false;
            startCell = null;
            startColIndex = -1;
            container = null;
        });
    },

    initTooltips() {
        let tooltip = document.getElementById('tb-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tb-tooltip';
            document.body.appendChild(tooltip);
        }

        const targets = document.querySelectorAll('.tb-btn[title], #mock-trigger[title]');
        targets.forEach((el) => {
            const text = el.dataset.tooltip || el.getAttribute('title');
            if (!text) return;
            el.dataset.tooltip = text;
            el.removeAttribute('title');

            const show = (e) => {
                tooltip.textContent = text;
                tooltip.classList.add('show');
                positionTooltip(e);
            };

            const hide = () => tooltip.classList.remove('show');

            const positionTooltip = (e) => {
                const padding = 12;
                const maxX = window.innerWidth - tooltip.offsetWidth - 8;
                const maxY = window.innerHeight - tooltip.offsetHeight - 8;
                const x = Math.min(e.clientX + padding, maxX);
                const y = Math.min(e.clientY + padding, maxY);
                tooltip.style.left = `${Math.max(8, x)}px`;
                tooltip.style.top = `${Math.max(8, y)}px`;
            };

            el.addEventListener('mouseenter', show);
            el.addEventListener('mousemove', positionTooltip);
            el.addEventListener('mouseleave', hide);
        });
    },

    applyMode(mode) {
        if (!this.editor) return;
        TB_History.saveState(true);
        if (mode === 'conversation') {
            this.applyConversationMode();
        } else if (mode === 'dynamic') {
            this.applyDynamicMode();
        } else if (mode === 'blank') {
            this.applyBlankMode();
        }
        TB_History.saveState(true);
    },

    applyConversationMode() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!this.editor.contains(range.commonAncestorContainer)) return;

        if (!selection.isCollapsed) {
            const blocks = this.extractBlocksFromRange(range);
            if (!blocks.length) {
                this.insertConversationAtCursor(20);
                return;
            }
            const tableHtml = this.buildConversationTableHtml(blocks);
            this.editor.focus();
            document.execCommand('insertHTML', false, tableHtml);
        } else {
            this.insertConversationAtCursor(20);
        }
    },

    applyDynamicMode() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!this.editor.contains(range.commonAncestorContainer)) return;

        if (!selection.isCollapsed) {
            const blocks = this.extractBlocksFromRange(range);
            if (!blocks.length) {
                this.insertDynamicConversationAtCursor(20);
                return;
            }
            const html = this.buildDynamicConversationHtml(blocks);
            this.editor.focus();
            document.execCommand('insertHTML', false, html);
        } else {
            this.insertDynamicConversationAtCursor(20);
        }
    },

    applyBlankMode() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const container = this.findConversationContainer(range);
        if (!container) return;

        if (container.classList.contains('tb-convo-dynamic')) {
            if (selection.isCollapsed) {
                this.replaceDynamicWithParagraphs(container, Array.from(container.querySelectorAll('.tb-convo-row')));
                return;
            }

            const selectedRows = this.getSelectedDynamicRows(container, range);
            if (!selectedRows.length) return;
            this.replaceDynamicWithParagraphs(container, selectedRows);
        } else {
            if (selection.isCollapsed) {
                this.replaceTableWithParagraphs(container, Array.from(container.querySelectorAll('tr')));
                return;
            }

            const selectedRows = this.getSelectedRows(container, range);
            if (!selectedRows.length) return;
            this.replaceTableWithParagraphs(container, selectedRows);
        }
    },

    insertConversationAtCursor(rowCount = 20) {
        const blocks = Array.from({ length: rowCount }, () => '');
        const tableHtml = this.buildConversationTableHtml(blocks);
        this.editor.focus();
        document.execCommand('insertHTML', false, tableHtml);
    },

    insertDynamicConversationAtCursor(rowCount = 20) {
        const blocks = Array.from({ length: rowCount }, () => '');
        const html = this.buildDynamicConversationHtml(blocks);
        this.editor.focus();
        document.execCommand('insertHTML', false, html);
    },

    buildConversationTableHtml(blocks) {
        let html = '<table class="tb-convo-table" data-mode="conversation"><tbody>';
        blocks.forEach((block, index) => {
            const isTeacher = index % 2 === 0;
            const content = block || '';
            const teacherCell = isTeacher
                ? `<span class="tb-label">Teacher:</span>${content ? ' ' + content : '&nbsp;'}`
                : '&nbsp;';
            const studentCell = isTeacher
                ? '&nbsp;'
                : `<span class="tb-label">Student:</span>${content ? ' ' + content : '&nbsp;'}`;
            html += `<tr><td class="tb-col-teacher">${teacherCell}</td><td class="tb-col-student">${studentCell}</td></tr>`;
        });
        html += '</tbody></table>';
        return html;
    },

    buildDynamicConversationHtml(blocks) {
        let html = '<div class="tb-convo-dynamic" data-mode="conversation-dynamic">';
        blocks.forEach((block, index) => {
            const role = index % 2 === 0 ? 'teacher' : 'student';
            html += this.buildDynamicRowHtml(role, block, '2');
        });
        html += '</div>';
        return html;
    },

    buildDynamicRowHtml(role, content, layout) {
        const safeContent = content || '';
        const teacherContent = role === 'teacher' ? safeContent : '';
        const studentContent = role === 'student' ? safeContent : '';

        let cellsHtml = '';
        if (layout === '1') {
            const feedbackCell = this.wrapCellContent('Feedback:', 'tb-col-feedback', '');
            cellsHtml = feedbackCell;
        } else if (layout === '3') {
            cellsHtml = this.wrapCellContent('Teacher:', 'tb-col-teacher', teacherContent)
                + this.wrapCellContent('Student:', 'tb-col-student', studentContent)
                + this.wrapCellContent('Feedback:', 'tb-col-feedback', '');
        } else {
            const teacherCell = role === 'teacher'
                ? this.wrapCellContent('Teacher:', 'tb-col-teacher', teacherContent)
                : `<div class="tb-convo-cell tb-col-teacher">&nbsp;</div>`;
            const studentCell = role === 'student'
                ? this.wrapCellContent('Student:', 'tb-col-student', studentContent)
                : `<div class="tb-convo-cell tb-col-student">&nbsp;</div>`;
            cellsHtml = teacherCell + studentCell;
        }

        return `<div class="tb-convo-row" data-layout="${layout}" data-role="${role}">
            <div class="tb-row-controls" contenteditable="false">
                <button class="tb-row-btn" data-layout="1" title="Single column" contenteditable="false">1</button>
                <button class="tb-row-btn" data-layout="2" title="Two columns" contenteditable="false">2</button>
                <button class="tb-row-btn" data-layout="3" title="Three columns" contenteditable="false">3</button>
            </div>
            ${cellsHtml}
        </div>`;
    },

    wrapCellContent(label, className, content) {
        const body = content ? ` ${content}` : '&nbsp;';
        return `<div class="tb-convo-cell ${className}"><span class="tb-label">${label}</span>${body}</div>`;
    },

    extractBlocksFromRange(range) {
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());

        const blocks = [];
        const blockTags = new Set(['P', 'DIV', 'LI']);
        let current = document.createElement('div');

        const pushCurrent = () => {
            const html = current.innerHTML.trim();
            if (html) blocks.push(html);
            current = document.createElement('div');
        };

        container.childNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && blockTags.has(node.tagName)) {
                pushCurrent();
                const html = node.innerHTML.trim();
                if (html) blocks.push(html);
                return;
            }
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                pushCurrent();
                return;
            }
            if (node.nodeType === Node.TEXT_NODE) {
                const parts = node.textContent.split(/\n+/);
                parts.forEach((part, idx) => {
                    if (part.trim()) {
                        current.appendChild(document.createTextNode(part));
                    }
                    if (idx < parts.length - 1) pushCurrent();
                });
                return;
            }
            current.appendChild(node.cloneNode(true));
        });
        pushCurrent();

        if (!blocks.length) {
            const text = container.textContent.trim();
            if (text) blocks.push(this.escapeHtml(text));
        }

        return blocks;
    },

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    findConversationContainer(range) {
        const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? range.commonAncestorContainer
            : range.commonAncestorContainer.parentElement;
        return node ? node.closest('.tb-convo-table, .tb-convo-dynamic') : null;
    },

    getSelectedRows(table, range) {
        const rows = Array.from(table.querySelectorAll('tr'));
        return rows.filter((row) => {
            try {
                return range.intersectsNode(row);
            } catch (err) {
                return false;
            }
        });
    },

    replaceTableWithParagraphs(table, selectedRows) {
        if (!table || !selectedRows.length || !table.parentNode) return;

        const allRows = Array.from(table.querySelectorAll('tr'));
        const indexes = selectedRows
            .map((row) => allRows.indexOf(row))
            .filter((idx) => idx >= 0)
            .sort((a, b) => a - b);

        if (!indexes.length) return;

        const first = indexes[0];
        const last = indexes[indexes.length - 1];
        const beforeRows = allRows.slice(0, first);
        const middleRows = allRows.slice(first, last + 1);
        const afterRows = allRows.slice(last + 1);

        const fragment = document.createDocumentFragment();
        if (beforeRows.length) fragment.appendChild(this.buildTableFromRows(table, beforeRows));

        const paragraphsHtml = middleRows
            .map((row) => this.rowToParagraphHtml(row))
            .filter(Boolean)
            .join('');
        if (paragraphsHtml) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = paragraphsHtml;
            while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
        }

        if (afterRows.length) fragment.appendChild(this.buildTableFromRows(table, afterRows));

        table.parentNode.replaceChild(fragment, table);
    },

    getSelectedDynamicRows(container, range) {
        const rows = Array.from(container.querySelectorAll('.tb-convo-row'));
        return rows.filter((row) => {
            try {
                return range.intersectsNode(row);
            } catch (err) {
                return false;
            }
        });
    },

    replaceDynamicWithParagraphs(container, selectedRows) {
        if (!container || !selectedRows.length || !container.parentNode) return;

        const allRows = Array.from(container.querySelectorAll('.tb-convo-row'));
        const indexes = selectedRows
            .map((row) => allRows.indexOf(row))
            .filter((idx) => idx >= 0)
            .sort((a, b) => a - b);

        if (!indexes.length) return;

        const first = indexes[0];
        const last = indexes[indexes.length - 1];
        const beforeRows = allRows.slice(0, first);
        const middleRows = allRows.slice(first, last + 1);
        const afterRows = allRows.slice(last + 1);

        const fragment = document.createDocumentFragment();
        if (beforeRows.length) fragment.appendChild(this.buildDynamicContainerFromRows(container, beforeRows));

        const paragraphsHtml = middleRows
            .map((row) => this.dynamicRowToParagraphHtml(row))
            .flat()
            .filter(Boolean)
            .join('');
        if (paragraphsHtml) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = paragraphsHtml;
            while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
        }

        if (afterRows.length) fragment.appendChild(this.buildDynamicContainerFromRows(container, afterRows));

        container.parentNode.replaceChild(fragment, container);
    },

    buildDynamicContainerFromRows(container, rows) {
        const newContainer = document.createElement('div');
        newContainer.className = container.className;
        newContainer.setAttribute('data-mode', container.getAttribute('data-mode') || 'conversation-dynamic');
        rows.forEach((row) => newContainer.appendChild(row.cloneNode(true)));
        return newContainer;
    },

    dynamicRowToParagraphHtml(row) {
        const layout = row.dataset.layout || '2';
        const teacherCell = row.querySelector('.tb-col-teacher');
        const studentCell = row.querySelector('.tb-col-student');
        const feedbackCell = row.querySelector('.tb-col-feedback');
        const hasText = (cell) => cell && cell.textContent.trim().length > 0;

        if (layout === '1') {
            if (!hasText(feedbackCell)) return [];
            return [`<p class="tb-convo-flat tb-col-feedback">${feedbackCell.innerHTML}</p>`];
        }

        if (layout === '3') {
            const parts = [];
            if (hasText(teacherCell)) parts.push(`<p class="tb-convo-flat tb-col-teacher">${teacherCell.innerHTML}</p>`);
            if (hasText(studentCell)) parts.push(`<p class="tb-convo-flat tb-col-student">${studentCell.innerHTML}</p>`);
            if (hasText(feedbackCell)) parts.push(`<p class="tb-convo-flat tb-col-feedback">${feedbackCell.innerHTML}</p>`);
            return parts;
        }

        const role = row.dataset.role || 'teacher';
        const activeCell = role === 'student' ? studentCell : teacherCell;
        const className = role === 'student' ? 'tb-col-student' : 'tb-col-teacher';
        if (!hasText(activeCell)) return [];
        return [`<p class="tb-convo-flat ${className}">${activeCell.innerHTML}</p>`];
    },

    buildTableFromRows(table, rows) {
        const newTable = table.cloneNode(false);
        const tbody = document.createElement('tbody');
        rows.forEach((row) => tbody.appendChild(row.cloneNode(true)));
        newTable.appendChild(tbody);
        return newTable;
    },

    rowToParagraphHtml(row) {
        const cells = row.querySelectorAll('td');
        const teacherCell = cells[0] || null;
        const studentCell = cells[1] || null;
        const teacherText = teacherCell ? teacherCell.textContent.trim() : '';
        const studentText = studentCell ? studentCell.textContent.trim() : '';

        if (!teacherText && !studentText) return '';

        let sourceCell = teacherCell;
        let className = 'tb-col-teacher';
        if (studentText.length > teacherText.length) {
            sourceCell = studentCell;
            className = 'tb-col-student';
        } else if (!teacherText && studentText) {
            sourceCell = studentCell;
            className = 'tb-col-student';
        }

        const html = sourceCell ? sourceCell.innerHTML : '';
        return `<p class="tb-convo-flat ${className}">${html || '&nbsp;'}</p>`;
    },

    updateDynamicRowLayout(row, layout) {
        if (!row) return;
        const targetLayout = String(layout);
        if (row.dataset.layout === targetLayout) return;

        this.captureDynamicRowData(row);
        row.dataset.layout = targetLayout;
        const role = row.dataset.role || 'teacher';

        const teacherContent = row.dataset.teacherContent || '';
        const studentContent = row.dataset.studentContent || '';
        const feedbackContent = row.dataset.feedbackContent || '';

        let cellsHtml = '';
        if (targetLayout === '1') {
            cellsHtml = this.wrapCellContent('Feedback:', 'tb-col-feedback', feedbackContent);
        } else if (targetLayout === '3') {
            cellsHtml = this.wrapCellContent('Teacher:', 'tb-col-teacher', teacherContent)
                + this.wrapCellContent('Student:', 'tb-col-student', studentContent)
                + this.wrapCellContent('Feedback:', 'tb-col-feedback', feedbackContent);
        } else {
            const teacherCell = role === 'teacher'
                ? this.wrapCellContent('Teacher:', 'tb-col-teacher', teacherContent)
                : `<div class="tb-convo-cell tb-col-teacher">&nbsp;</div>`;
            const studentCell = role === 'student'
                ? this.wrapCellContent('Student:', 'tb-col-student', studentContent)
                : `<div class="tb-convo-cell tb-col-student">&nbsp;</div>`;
            cellsHtml = teacherCell + studentCell;
        }

        const controls = row.querySelector('.tb-row-controls');
        row.innerHTML = '';
        if (controls) row.appendChild(controls);
        row.insertAdjacentHTML('beforeend', cellsHtml);
    },

    captureDynamicRowData(row) {
        const layout = row.dataset.layout || '2';
        const role = row.dataset.role || 'teacher';
        const teacherCell = row.querySelector('.tb-col-teacher');
        const studentCell = row.querySelector('.tb-col-student');
        const feedbackCell = row.querySelector('.tb-col-feedback');

        const teacherInfo = this.getCellContentInfo(teacherCell);
        const studentInfo = this.getCellContentInfo(studentCell);
        const feedbackInfo = this.getCellContentInfo(feedbackCell);

        if (layout === '1') {
            if (feedbackInfo) row.dataset.feedbackContent = feedbackInfo.html;
            return;
        }

        if (layout === '2') {
            if (role === 'teacher') {
                if (teacherInfo) row.dataset.teacherContent = teacherInfo.html;
                if (studentInfo && studentInfo.hasContent) row.dataset.studentContent = studentInfo.html;
            } else {
                if (studentInfo) row.dataset.studentContent = studentInfo.html;
                if (teacherInfo && teacherInfo.hasContent) row.dataset.teacherContent = teacherInfo.html;
            }
            return;
        }

        if (teacherInfo) row.dataset.teacherContent = teacherInfo.html;
        if (studentInfo) row.dataset.studentContent = studentInfo.html;
        if (feedbackInfo) row.dataset.feedbackContent = feedbackInfo.html;
    },

    getCellContentInfo(cell) {
        if (!cell) return null;
        const clone = cell.cloneNode(true);
        clone.querySelectorAll('.tb-label').forEach((label) => label.remove());
        const rawHtml = clone.innerHTML;
        const text = clone.textContent.replace(/\s+/g, '').trim();
        const cleaned = rawHtml.replace(/&nbsp;/g, '').trim();
        return {
            html: cleaned,
            hasContent: text.length > 0
        };
    },

    format(cmd, value = null) {
        TB_History.saveState(true);
        this.editor.focus();
        document.execCommand(cmd, false, value);
        TB_History.saveState(true);
    },

    toggleDropdown(menuId) {
        const menu = document.getElementById(menuId);
        const btn = document.getElementById(menuId.replace('-menu', '-btn'));
        const wasOpen = menu.classList.contains('show');

        this.closeDropdowns();

        if (!wasOpen && btn) {
            const rect = btn.getBoundingClientRect();
            menu.style.top = (rect.bottom + 4) + 'px';
            menu.style.left = rect.left + 'px';
            menu.classList.add('show');
        }
    },

    closeDropdowns() {
        document.querySelectorAll('.tb-dropdown-menu').forEach(el => el.classList.remove('show'));
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#22d3ee;color:black;font-weight:bold;padding:0.75rem 1.5rem;border-radius:999px;z-index:99999;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
            // Resize drawing canvas after overlay is visible
            setTimeout(() => TB_DrawingTool.resizeCanvas(), 100);
        });
        this.isOpen = true;
        this.editor.focus();
        TB_Debug.log('📋 TextBoard opened');
        this.syncHeaderButton();
    },

    close() {
        if (window.TB_SlideState) TB_SlideState.persistToStorage();
        this.overlay.classList.remove('active');
        setTimeout(() => this.overlay.classList.add('hidden'), 600);
        this.isOpen = false;

        if (TB_VoiceSystem.isRecording && TB_VoiceSystem.recognition) {
            TB_VoiceSystem.recognition.stop();
        }

        TB_Debug.log('📋 TextBoard closed');
        this.syncHeaderButton();
    },

    clearBoard() {
        if (confirm('Clear all text?')) {
            TB_History.saveState(true);
            this.editor.innerHTML = '';
            TB_History.saveState(true);
            TB_Debug.log('🗑️ Board cleared');
        }
    }
};

// === SLIDE STATE SYSTEM (Fixes Ghosting & Persistence) ===
const TB_SlideState = {
    currentSlideIndex: 0,
    boards: {},  // { slideIndex: { html: "", drawings: null } }

    saveCurrentBoard() {
        const editor = document.getElementById('textboard-editor');
        const canvas = document.getElementById('drawing-canvas');
        if (!editor) return;

        this.boards[this.currentSlideIndex] = {
            html: editor.innerHTML,
            drawings: canvas ? canvas.toDataURL() : null
        };
    },

    loadBoardForSlide(slideIndex) {
        // Only switch if the index is valid
        if (typeof slideIndex !== 'number' || isNaN(slideIndex)) return;

        this.saveCurrentBoard();  // Save current before switching
        this.currentSlideIndex = slideIndex;

        const editor = document.getElementById('textboard-editor');
        const canvas = document.getElementById('drawing-canvas');
        const saved = this.boards[slideIndex];

        if (editor) {
            editor.innerHTML = saved?.html || '';
        }

        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (saved?.drawings) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0);
                img.src = saved.drawings;
            }
        }

        // Reset history stacks on slide switch to prevent cross-slide undo
        TB_History.undoStack = [];
        TB_History.redoStack = [];
        TB_History.saveState(true); // Initial state for the new slide
    },

    persistToStorage() {
        this.saveCurrentBoard();
        SafeStorage.setItem('NAMING_GAME_TEXTBOARD_STATES', JSON.stringify({
            boards: this.boards,
            currentSlideIndex: this.currentSlideIndex
        }));
    },

    restoreFromStorage() {
        const saved = localStorage.getItem('NAMING_GAME_TEXTBOARD_STATES');
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            this.boards = data.boards || {};
            // Don't override currentSlideIndex here, wait for navigation hook

            // Initial load for current slide if editor is already open (unlikely)
            const activeSlide = (window.NavigationGuard ? NavigationGuard.getCurrentSlide() : 0);
            const editor = document.getElementById('textboard-editor');
            if (editor && editor.innerHTML === '') {
                this.loadBoardForSlide(activeSlide);
            }
        } catch (e) {
            console.error("TB State corrupt:", e);
        }
    }
};

// Expose to window for navigation hooks
window.TB_SlideState = TB_SlideState;

// ╔════════════════════════════════════════════════════════════════════════╗
// ║  AI TEACHER INTEGRATION (GEMINI 2.0 FLASH)                             ║
// ╚════════════════════════════════════════════════════════════════════════╝
const TB_AI_CONFIG = {
    url: "https://script.google.com/macros/s/AKfycbxxFHzkup6MGANijakkHOJ_a6YEZf5oQ1dXhvgjE3lOpkZ9QA2_r9qDojTjFZQnoAVa/exec",
    password: "TeacherTool2025",
    modeToggle: "REPLACE",  // "REPLACE" or "INSERT_BELOW"
    paraphraseStyle: "Formal",
    customStyleInstruction: ""
};

const TB_AI_STATE = {
    inFlight: false,
    queued: null,
    pending: null
};

const TB_AI_STATUS = {
    el: null,
    textEl: null,
    spinner: null,
    applyBtn: null,
    discardBtn: null,

    init() {
        if (this.el) return;
        this.el = document.getElementById('ai-status');
        if (!this.el) return;
        this.textEl = document.getElementById('ai-status-text');
        this.spinner = this.el.querySelector('.tb-ai-spinner');
        this.applyBtn = document.getElementById('ai-apply-btn');
        this.discardBtn = document.getElementById('ai-discard-btn');

        if (this.applyBtn) {
            this.applyBtn.addEventListener('click', () => applyPendingAi());
        }
        if (this.discardBtn) {
            this.discardBtn.addEventListener('click', () => discardPendingAi());
        }
    },

    setWorking(mode) {
        this.init();
        if (!this.el) return;
        this.el.classList.remove('hidden');
        if (this.spinner) this.spinner.style.display = '';
        if (this.applyBtn) this.applyBtn.style.display = 'none';
        if (this.discardBtn) this.discardBtn.style.display = 'none';
        if (this.textEl) this.textEl.textContent = `Marking (${mode})...`;
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
        if (!this.el) return;
        this.el.classList.add('hidden');
    }
};

function applyPendingAi() {
    const pending = TB_AI_STATE.pending;
    if (!pending) return;
    const editor = document.getElementById('textboard-editor');
    if (!editor) return;

    TB_History.saveState(true);
    if (pending.selectionIsFull) {
        editor.innerHTML = pending.fullHtml;
    } else {
        editor.focus();
        document.execCommand('insertHTML', false, pending.cleanHtml);
    }
    TB_History.saveState(true);
    TB_AI_STATE.pending = null;
    TB_AI_STATUS.clear();
    TextBoardSystem.showToast('AI result applied');

    if (TB_AI_STATE.queued) {
        const next = TB_AI_STATE.queued;
        TB_AI_STATE.queued = null;
        setTimeout(() => runAiTool(next.mode, next.options), 0);
    }
}

function discardPendingAi() {
    TB_AI_STATE.pending = null;
    TB_AI_STATUS.clear();
    TextBoardSystem.showToast('AI result dismissed');

    if (TB_AI_STATE.queued) {
        const next = TB_AI_STATE.queued;
        TB_AI_STATE.queued = null;
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

    if (TB_AI_STATE.inFlight || TB_AI_STATE.pending) {
        TB_AI_STATE.queued = { mode, options };
        TextBoardSystem.showToast('AI busy - queued');
        return;
    }

    TB_AI_STATE.inFlight = true;
    TB_AI_STATUS.setWorking(mode);

    let controller = null;
    let timeoutId = null;
    try {
        // 1. Precise Selection Logic (Fixes "First Word" Bug)
        const selection = window.getSelection();
        let selectionText = "";
        let selStart = 0;
        let selEnd = 0;

        // Helper to get exact text offset in contenteditable
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
        } else {
            selectionText = fullText;
            selStart = 0;
            selEnd = fullText.length;
        }

        const selectionIsFull = (selectionText === fullText);

        // 2. Configure V3 Proxy Parameters
        // Detect if this is a "Check" mode (needs Red Pen) or "Correct" mode (Clean)
        const isCheckMode = mode.includes('check');

        const payload = {
            password: TB_AI_CONFIG.password,
            mode: mode,
            fullText: fullText,
            selectionText: selectionText,
            // V3 specifics:
            selectionStartIndex: selStart,
            selectionEndIndex: selEnd,
            redChangedCharactersEnabled: isCheckMode, // Turns on the Red Pen for check modes
            modeToggle: TB_AI_CONFIG.modeToggle, // Read from config
            paraphraseStyle: options.paraphraseStyle || "Formal",
            customStyleInstruction: options.customStyleInstruction || ""
        };

        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(TB_AI_CONFIG.url, {
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
                TB_History.saveState(true);

                // Handle Insert Below vs Replace mode
                if (TB_AI_CONFIG.modeToggle === 'INSERT_BELOW') {
                    // Insert Below: add result after the selection/content
                    if (selectionIsFull) {
                        editor.innerHTML += '<hr style="border:none;border-top:1px dashed #22d3ee;margin:20px 0;">' + fullHtml;
                    } else {
                        // Insert after current selection
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.collapse(false); // Move to end of selection
                            const marker = document.createElement('span');
                            marker.innerHTML = '<br><span style="color:#22d3ee;font-size:0.8em;">↳ AI:</span> ' + cleanHtml;
                            range.insertNode(marker);
                        }
                    }
                } else {
                    // Replace mode (original behavior)
                    if (selectionIsFull) {
                        editor.innerHTML = fullHtml;
                    } else {
                        document.execCommand('insertHTML', false, cleanHtml);
                    }
                }

                TB_History.saveState(true);
                TextBoardSystem.showToast(TB_AI_CONFIG.modeToggle === 'INSERT_BELOW' ? "Inserted Below! ✓" : "Marking Complete! ✓");
                TB_AI_STATUS.clear();
            } else {
                TB_AI_STATE.pending = {
                    mode,
                    cleanHtml,
                    fullHtml,
                    selectionIsFull
                };
                TB_AI_STATUS.setReady(mode);
                TextBoardSystem.showToast('AI result ready - apply when you choose');
            }
        }
    } catch (err) {
        console.error(err);
        if (err.name === 'AbortError') {
            TextBoardSystem.showToast('AI request timed out');
        } else {
            alert("AI Teacher Error:\n" + err.message);
        }
        TB_AI_STATUS.clear();
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
        TB_AI_STATE.inFlight = false;
        if (!TB_AI_STATE.pending && TB_AI_STATE.queued) {
            const next = TB_AI_STATE.queued;
            TB_AI_STATE.queued = null;
            setTimeout(() => runAiTool(next.mode, next.options), 0);
        }
    }
}

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    TB_Debug.init();
    TextBoardSystem.init();
    TB_DrawingTool.init();
});

// === GLOBAL EXPOSURE FOR MAIN GAME INTEGRATION ===
window.TextBoardSystem = TextBoardSystem;
window.toggleTextBoard = function () {
    TextBoardSystem.toggle();
    TextBoardSystem.syncHeaderButton();
};
