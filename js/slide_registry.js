// js/slide_registry.js
(() => {
    const DISPLAY_TOTAL = 32;

    // key -> logical label shown in header (01..32, plus 10A/10B/10C, 28A/28B, 30A/30B/30C)
    const LABEL_BY_KEY = {
        "hero": "01",
        "intro_village": "02",
        "adventure_start": "03",
        "three_noun_families": "04",
        "node_n1_exit": "05",
        "norah_detective": "06",
        "sentence_spotting": "07",
        "village_checkpoint": "08",
        "node_n2_exit": "09",
        "things_hunt": "10C",
        "people_hunt": "10A",
        "places_hunt": "10B",
        "mega_mix_boss": "11",
        "common_nouns_title": "12",
        "what_is_common_noun": "13",
        "common_noun_examples": "14",
        "common_noun_rule": "15",
        "check_common_nouns": "16",
        "proper_nouns_intro": "17",
        "what_is_proper_noun": "18",
        "capital_letter_rule": "19",
        "proper_quick_check_placeholder": "20",
        "power_specific_people": "21",
        "power_specific_places": "22",
        "power_specific_dates": "23",
        "brands_and_events": "24",
        "the_vip_list": "25",
        "the_golden_rule": "26",
        "mr_muddle_intro": "27",
        "evidence_a_locations": "28A",
        "evidence_b_people_dates": "28B",
        "case_closed": "29",
        "quiz_people_i": "30A",
        "quiz_places_streets": "30B",
        "quiz_specific_dates": "30C",
        "exit_ticket_riddle": "31",
        "mission_complete": "32",
        "session_summary": "—"
    };

    // static map to allow title lookup even if the slide iframe/HTML is lazy-loaded
    const TITLE_MAP = {
        "hero": "The Naming Game",
        "intro_village": "A World Without Names?",
        "adventure_start": "Meet Norah Noun!",
        "three_noun_families": "What is a Noun?",
        "node_n1_exit": "Exit Protocol 1",
        "norah_detective": "Nouns Name People",
        "sentence_spotting": "Nouns Name Places",
        "village_checkpoint": "Things & Animals",
        "node_n2_exit": "Exit Protocol 2",
        "people_hunt": "People Hunt",
        "places_hunt": "Places Hunt",
        "things_hunt": "Things Hunt",
        "mega_mix_boss": "The Mega Mix Boss",
        "common_nouns_title": "Common Nouns",
        "what_is_common_noun": "What is a Common Noun?",
        "common_noun_examples": "Common Nouns are General Labels",
        "common_noun_rule": "The Common Noun Rule",
        "check_common_nouns": "Which are Common Nouns?",
        "proper_nouns_intro": "Proper Nouns",
        "what_is_proper_noun": "What is a Proper Noun?",
        "capital_letter_rule": "The Shiny Crown!",
        "proper_quick_check_placeholder": "Quick Check",
        "power_specific_people": "Proper Nouns specify who.",
        "power_specific_places": "Proper Nouns specify where.",
        "power_specific_dates": "Specific Dates",
        "brands_and_events": "Brands and Events",
        "the_vip_list": "The VIP List",
        "the_golden_rule": "The Golden Rule Challenge",
        "mr_muddle_intro": "The Case of Miss Muddle",
        "evidence_a_locations": "Evidence A: Locations",
        "evidence_b_people_dates": "Evidence B: People & Dates",
        "case_closed": "Case Closed",
        "quiz_people_i": "People and 'I'",
        "quiz_places_streets": "Places and Streets",
        "quiz_specific_dates": "Specific Days and Dates",
        "exit_ticket_riddle": "Exit Ticket Riddle Match",
        "mission_complete": "Mission Complete!",
        "session_summary": "Session Notes Summary"
    };

    const SlideRegistry = {
        DISPLAY_TOTAL,
        LABEL_BY_KEY,
        TITLE_MAP,
        indexByKey: new Map(),
        keyByIndex: [],
        slides: [],

        rebuild() {
            const slider = document.getElementById("slider");
            if (!slider) return;

            // 🎯 UNIFIED FILTERING: Exclude hidden, utility, and marked-to-skip slides
            this.slides = Array.from(slider.querySelectorAll("section.slide[data-slide-key]"))
                .filter(s =>
                    !s.classList.contains('hidden') &&
                    !s.classList.contains('utility') &&
                    s.getAttribute('data-skip-registry') !== '1'
                );

            this.indexByKey.clear();
            this.keyByIndex = [];

            this.slides.forEach((el, idx) => {
                const key = (el.dataset.slideKey || "").trim();
                if (!key) return;
                this.indexByKey.set(key, idx);
                this.keyByIndex[idx] = key;
            });
            console.log("📍 SlideRegistry rebuilt. Count:", this.slides.length);
        },

        idx(key) {
            if (!this.indexByKey.has(key)) return null;
            return this.indexByKey.get(key);
        },

        keyAtIndex(i) {
            return this.keyByIndex[i] ?? null;
        },

        indexOfKey(key) {
            return this.idx(key) ?? -1;
        },

        getCurrentIndex() {
            const slider = document.getElementById('slider');
            if (!slider || this.slides.length === 0) return 0;
            const w = slider.clientWidth || 1;
            const i = Math.round(slider.scrollLeft / w);
            return Math.max(0, Math.min(i, this.slides.length - 1));
        },

        getCurrentKey() {
            return this.keyAtIndex(this.getCurrentIndex());
        },

        getSlides() {
            return this.slides;
        },

        getVisibleSlides() {
            return this.slides;
        },

        labelForIndex(idx) {
            const key = this.keyByIndex[idx];
            if (!key) return null;
            const label = this.LABEL_BY_KEY[key];
            if (!label) return `${idx + 1}`;
            return `${label} / ${this.DISPLAY_TOTAL}`;
        },

        /**
         * 🔍 LOOKUP (Decoupled from DOM)
         * Returns an object for the given key: { element: HTMLElement, title: String, index: Number }
         */
        lookup(key) {
            // 1. Try static map first (Safe for Lazy Loading)
            let title = this.TITLE_MAP[key];

            // 2. Fallback to DOM if missing (Legacy)
            const idx = this.idx(key);
            const element = (idx !== null) ? (this.slides[idx] || null) : null;

            if (!title && element) {
                const h1 = element.querySelector('h1, h2, .font-display');
                if (h1) title = h1.innerText.trim().replace(/\n/g, ' ').substring(0, 60);
            }

            return { element, title: title || key, index: idx ?? -1 };
        }
    };

    // 🚀 INITIALIZE IMMEDIATELY
    SlideRegistry.rebuild();

    window.SlideRegistry = SlideRegistry;
    window.SLIDE_REGISTRY = SlideRegistry; // Alias for legacy compatibility

    document.addEventListener("DOMContentLoaded", () => {
        SlideRegistry.rebuild();
        console.log("📍 SlideRegistry re-synced on DOMContentLoaded");
    });
})();
