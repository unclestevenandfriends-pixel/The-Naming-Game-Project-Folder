# Gapless Jukebox Protocol (v7.1)

**Objective:** Implement a seamless, gapless music player with a refined, non-intrusive UI.
**Context:** Designed for "The Name Game" but applicable to any web presentation requiring background music.

---

## 1. The Architecture

### A. The Music Source
We use **Absolute GitHub URLs** to ensure music plays immediately without requiring local file management.
*   **Source:** `unclestevenandfriends-pixel.github.io`
*   **Format:** MP3
*   **Encoding:** Spaces in filenames must be encoded as `%20`.

### B. The Engine
*   **Gapless Play:** Uses the `ended` event to immediately trigger the next track.
*   **Preloading:** Sets `preload="auto"` on the next track to ensure instant playback.
*   **State Management:** Tracks `musicIndex` and `isMusicPlaying` to prevent double-starts.

### C. The UI (Refined)
*   **Location:** Top-Right (Fixed).
*   **Style:** Glassmorphic, pill-shaped, semi-transparent.
*   **Behavior:** Volume slider is semi-hidden (opacity 0.5) until hovered.

---

## 2. Implementation Guide

### Step 1: Inject the UI
Place this HTML snippet inside the `<body>`, preferably near the top (e.g., after the grid background).

```html
<!-- MUSIC CONTROLS (Jukebox v7.1 - Refined) -->
<div id="music-controls" class="fixed top-6 right-6 z-[90] flex items-center gap-2 bg-black/30 backdrop-blur-sm p-1.5 rounded-full border border-white/5 transition-all hover:bg-black/50 group">
  <button id="music-toggle" onclick="toggleMusic()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
    <span id="music-icon" class="text-sm">🎵</span>
  </button>
  <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="0.5" 
    class="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500/80 opacity-50 group-hover:opacity-100 transition-opacity"
    oninput="setMusicVolume(this.value)">
</div>
```

### Step 2: The JavaScript Logic
Add this block to your main `<script>` tag.

```javascript
// --- JUKEBOX ENGINE (v7.1) ---
const BACKGROUND_MUSIC = [
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%201.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%202.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%203.mp3',
  'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%204.mp3'
];

let musicIndex = 0;
let musicPlayer = new Audio();
musicPlayer.crossOrigin = "anonymous"; // Prevent CORS issues
let isMusicPlaying = false;

function initJukebox() {
  if (isMusicPlaying) return;
  isMusicPlaying = true;
  
  // Initial Volume
  const vol = document.getElementById('volume-slider').value;
  musicPlayer.volume = vol;
  
  playNextTrack();
}

function playNextTrack() {
  if (musicIndex >= BACKGROUND_MUSIC.length) musicIndex = 0;
  
  musicPlayer.src = BACKGROUND_MUSIC[musicIndex];
  musicPlayer.preload = "auto"; // Slick Preloading
  
  musicPlayer.play().catch(e => console.log("Autoplay blocked until interaction"));
  
  // Gapless Loop Logic
  musicPlayer.onended = () => {
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
```

### Step 3: Triggering Playback
Call `initJukebox()` when the user interacts with the page (e.g., clicks "Start").

```javascript
function startClass() {
  // ... validation logic ...
  
  // Start Music
  console.log("Starting Jukebox...");
  initJukebox();
  
  // ... transition logic ...
}
```

---

## 3. The "One-Shot" Prompt
*Copy and paste this prompt to any AI developer to replicate this exact feature instantly.*

```text
IMPLEMENT GAPLESS JUKEBOX (PROTOCOL v7.1)

I need you to implement the "Gapless Jukebox" feature exactly as defined in the Master Protocol v7.1.

CONTEXT:
This is a web presentation. We need background music that loops infinitely without gaps.
The UI must be "Refined" (small, top-right, glassmorphic).

INSTRUCTIONS:

1. INJECT HTML UI (Top-Right):
   Insert this exact HTML for the controls:
   <div id="music-controls" class="fixed top-6 right-6 z-[90] flex items-center gap-2 bg-black/30 backdrop-blur-sm p-1.5 rounded-full border border-white/5 transition-all hover:bg-black/50 group">
     <button id="music-toggle" onclick="toggleMusic()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
       <span id="music-icon" class="text-sm">🎵</span>
     </button>
     <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="0.5" 
       class="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-500/80 opacity-50 group-hover:opacity-100 transition-opacity"
       oninput="setMusicVolume(this.value)">
   </div>

2. IMPLEMENT JS LOGIC:
   - Use this exact array for music (Absolute GitHub URLs):
     const BACKGROUND_MUSIC = [
       'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%201.mp3',
       'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%202.mp3',
       'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%203.mp3',
       'https://unclestevenandfriends-pixel.github.io/The-naming-game-noun-presentation-assets/assets/music/Song%204.mp3'
     ];
   - Implement `initJukebox()`, `playNextTrack()`, `toggleMusic()`, and `setMusicVolume()`.
   - Ensure `musicPlayer.crossOrigin = "anonymous"`.
   - Ensure `preload="auto"` is set in `playNextTrack()` for gapless playback.
   - The `ended` event must trigger `playNextTrack()` (infinite loop).

3. INTEGRATION:
   - Call `initJukebox()` inside the `startClass()` function (or equivalent start button handler).
   - Ensure there are no duplicate `startClass` functions.

EXECUTE this implementation now.
```
