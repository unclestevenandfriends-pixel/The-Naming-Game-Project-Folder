// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO.JS - Sound Systems (Stabilized)
// ═══════════════════════════════════════════════════════════════════════════════

const SoundFX = {
  ctx: null,
  isUnlocked: false,
  muted: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      if (this.muted) this.ctx.suspend();
      else this.ctx.resume();
    }
  },

  unlock(options = {}) {
    const startMusic = options.startMusic !== false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.log("🔊 Audio Context Resumed");
      });
    }
    this.isUnlocked = true;
    if (startMusic && typeof initJukebox === 'function') {
      initJukebox();
    }
  },

  _play(fn) {
    if (!this.isUnlocked || !this.ctx || this.muted) return;
    try {
      fn.call(this);
    } catch (e) {
      console.warn("SoundFX error:", e);
    }
  },

  // --- STANDARD GAME SOUNDS ---

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

  playChime() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    });
  },

  playUnlock() {
    // A distinct magical sound for map unlocks
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';

      // Arpeggio
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(554, this.ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    });
  },

  // --- THE NEW LOCKED SOUND (Softer) ---
  playLocked() {
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Softer, less stressful than sawtooth “error”
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);

      // MUCH quieter
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    });
  },

  playStamp(emoji) {
    // Keep existing stamp logic...
    this._play(function () {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
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

// --- JUKEBOX ENGINE ---
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
let musicMuted = false;

function loadMusicMuteState() {
  const saved = localStorage.getItem('nameGame_musicMuted');
  musicMuted = (saved === 'true');
  return musicMuted;
}

function saveMusicMuteState() {
  SafeStorage.setItem('nameGame_musicMuted', String(musicMuted));
}

function updateMuteUI(muted) {
  const icon = document.getElementById('music-icon');
  if (icon) {
    icon.innerText = muted ? '🔇' : '🎵';
    icon.style.opacity = muted ? '0.5' : '1';
  }
}

function syncAudioButtonState() {
  const toolBtn = document.getElementById('gcd-audio');
  if (!toolBtn) return;
  const isActive = !musicPlayer.paused && !musicMuted;
  toolBtn.classList.toggle('active', isActive);
  toolBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

function initJukebox() {
  // Load saved mute preference
  loadMusicMuteState();

  if (isMusicPlaying && !musicPlayer.paused) return;

  // If user had music muted, respect that and don't auto-start
  if (musicMuted) {
    updateMuteUI(true);
    isMusicPlaying = false;
    syncAudioButtonState();
    return;
  }

  isMusicPlaying = true;
  const volElem = document.getElementById('volume-slider');
  const vol = volElem ? parseFloat(volElem.value) : 0.5;
  musicPlayer.volume = isNaN(vol) ? 0.5 : vol;
  playNextTrack();
  updateMuteUI(false);
  syncAudioButtonState();
}

function playNextTrack() {
  if (musicIndex >= BACKGROUND_MUSIC.length) musicIndex = 0;
  musicPlayer.src = BACKGROUND_MUSIC[musicIndex];
  musicPlayer.preload = "auto";
  const playPromise = musicPlayer.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.log("Autoplay blocked/failed", e);
      isMusicPlaying = false;
    });
  }
  musicPlayer.onended = () => {
    musicIndex++;
    playNextTrack();
  };
}

function toggleMusic() {
  if (musicPlayer.paused) {
    musicMuted = false;
    if (!musicPlayer.src) {
      playNextTrack();
    } else {
      musicPlayer.play();
    }
    updateMuteUI(false);
  } else {
    musicMuted = true;
    musicPlayer.pause();
    updateMuteUI(true);
  }
  saveMusicMuteState();
  syncAudioButtonState();
}

function setMusicVolume(val) {
musicPlayer.volume = val;
}

musicPlayer.addEventListener('play', syncAudioButtonState);
musicPlayer.addEventListener('pause', syncAudioButtonState);

window.initJukebox = initJukebox;
window.toggleMusic = toggleMusic;
window.setMusicVolume = setMusicVolume;
window.openAudioPopover = toggleMusic;
