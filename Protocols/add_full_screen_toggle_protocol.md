# Full Screen Toggle Implementation Protocol
## (Block N)

This protocol documents the **final, successful implementation** of the Full Screen Toggle functionality. Follow these steps to replicate the feature without error.

---

### 1. The Concept
A simple toggle button in the main navigation bar that triggers the browser's native **Fullscreen API**. This hides the address bar, tabs, and OS interface for an immersive "App-like" experience.

### 2. HTML Structure
Add this button to the `<nav>` element, specifically in the right-side container (e.g., before the Music Controls).

```html
<!-- Full Screen Toggle -->
<button id="fullscreen-btn" onclick="toggleFullScreen()"
  class="flex items-center gap-3 bg-black/30 backdrop-blur-sm p-1.5 pr-4 rounded-full border border-white/5 transition-all hover:bg-black/50 group mr-6"
  title="Toggle Full Screen">
  
  <!-- Icon Container -->
  <div class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-brand-500 group-hover:text-black text-[#FDFDFD] transition-all">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  </div>
  
  <!-- Label (Hidden on Mobile) -->
  <span class="hidden md:inline text-xs font-bold uppercase tracking-widest text-brand-400 group-hover:text-[#FDFDFD] transition-colors">
    Full Screen
  </span>
</button>
```

### 3. JavaScript Logic
Implement the `toggleFullScreen()` function. This handles both entering and exiting full screen.

```javascript
// === FULL SCREEN TOGGLE ===
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    // ENTER Full Screen
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    // EXIT Full Screen
    document.exitFullscreen();
  }
}
```

### 4. Key Success Factors
1.  **`document.documentElement`:** Targets the entire page (root element) for full screen, not just a specific div.
2.  **`requestFullscreen()` vs `exitFullscreen()`:** The logic checks `!document.fullscreenElement` to decide which action to take.
3.  **Error Handling:** The `.catch()` block is essential because some browsers (or iframe contexts) might block the request if not triggered by a direct user gesture.
4.  **Z-Index:** Ensure your `nav` and `whiteboard-layer` have appropriate z-indices so they render correctly in full screen.
