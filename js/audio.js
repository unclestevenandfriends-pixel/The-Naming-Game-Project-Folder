// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO.JS - Sound Systems
// Contains: SoundFX (procedural sounds), Jukebox (background music)
// Depends on: Nothing (standalone)
// ═══════════════════════════════════════════════════════════════════════════════

// === PROCEDURAL SOUND EFFECTS ENGINE ===
const SoundFX = {
  ctx: null,
  isUnlocked: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  unlock() {
    // 1. Wake up the Sound Effects Engine
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => console.log("🔊 Audio Context Resumed"));
    }
    this.isUnlocked = true;

    // 2. Wake up the Jukebox (The Fix)
    // This piggybacks on the user's click to bypass the browser's autoplay block
    if (typeof initJukebox === 'function') {
      console.log("🎵 User interaction detected: Starting Jukebox...");
      initJukebox();
      if (typeof musicPlayer !== 'undefined' && musicPlayer.paused) musicPlayer.play();
    }
  },

  _play(fn) {
    if (!this.isUnlocked || !this.ctx) return;
    try {
      fn.call(this);
    } catch (e) {
      console.warn("SoundFX error:", e);
    }
  },

  playCorrect() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    });
  },

  playIncorrect() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    });
  },

  playPop() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    });
  },

  playSlide() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    });
  },

  playStamp(emoji) {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Different sounds for different stamps
      if (emoji === '✓' || emoji === '⭐') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      } else if (emoji === '✗' || emoji === '❌') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    });
  },

  playSuccess() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      // Victory fanfare notes
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.15);
      });

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    });
  }
};
window.SoundFX = SoundFX;

// --- JUKEBOX ENGINE (v7.1) ---
/*
   ████████████████████████████████████████████████████████████████████████████████
   🔒 CRITICAL GUARDRAIL: DO NOT EDIT WITHOUT USER PERMISSION
   
   The following section (MUSIC JUKEBOX) is APPROVED and LOCKED.
   Any changes here will break the user experience.
   DO NOT TOUCH unless explicitly instructed.
   ████████████████████████████████████████████████████████████████████████████████
*/
const BACKGROUND_MUSIC = [
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%201.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%202.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%203.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%204.mp3'
];
let musicIndex = 0;
let musicPlayer = new Audio();
musicPlayer.crossOrigin = "anonymous";
let isMusicPlaying = false;

function initJukebox() {
  if (isMusicPlaying && !musicPlayer.paused) return; // Only return if actually playing
  isMusicPlaying = true;

  console.log("🎵 Initializing Jukebox...");

  // Initial Volume with fallback
  const volElem = document.getElementById('volume-slider');
  const vol = volElem ? parseFloat(volElem.value) : 0.5;
  musicPlayer.volume = isNaN(vol) ? 0.5 : vol;

  // Ensure audio is loaded before playing
  playNextTrack();
}

function playNextTrack() {
  if (musicIndex >= BACKGROUND_MUSIC.length) musicIndex = 0;

  console.log(`🎵 Playing track ${musicIndex + 1}: ${BACKGROUND_MUSIC[musicIndex]}`);
  musicPlayer.src = BACKGROUND_MUSIC[musicIndex];
  musicPlayer.preload = "auto";

  const playPromise = musicPlayer.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log("🎵 Music playback started successfully");
    }).catch(e => {
      console.log("⚠️ Autoplay blocked or failed:", e);
      isMusicPlaying = false; // Reset so we can try again
    });
  }

  // Gapless Loop Logic
  musicPlayer.onended = () => {
    console.log("🎵 Track ended, playing next...");
    musicIndex++;
    playNextTrack();
  };
}

function toggleMusic() {
  if (musicPlayer.paused) {
    musicPlayer.play();
    document.getElementById('music-icon').innerText = '🎵';
    document.getElementById('music-icon').style.opacity = '1';
  } else {
    musicPlayer.pause();
    document.getElementById('music-icon').innerText = '🔇';
    document.getElementById('music-icon').style.opacity = '0.5';
  }
}

function setMusicVolume(val) {
  musicPlayer.volume = val;
}

/*
   ████████████████████████████████████████████████████████████████████████████████
   🔒 END CRITICAL GUARDRAIL: MUSIC JUKEBOX
   ████████████████████████████████████████████████████████████████████████████████
*/

// Expose to window for HTML onclick handlers
window.initJukebox = initJukebox;
window.toggleMusic = toggleMusic;
window.setMusicVolume = setMusicVolume;

console.log("✅ audio.js loaded - Sound systems ready");
