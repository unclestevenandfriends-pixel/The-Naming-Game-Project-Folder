# The Name Game: Color Palette Bible

> [!IMPORTANT]
> **Governing Aesthetic**: "Aura Dark Mode"
> The brand visual identity is defined by **vibrant neon accents** floating in a **deep, dark void**. It relies heavily on **glassmorphism**, **soft glows**, and **high-contrast typography**.
>
> **Core Rule**: All colors must be "Luminous". They must pop against the `#0B0C15` background. We avoid desaturated, muddy, or pastel tones unless used for specific glass effects.

---

## 1. Core Brand Colors (The "Anchor" Palette)

These are the immutable colors used in the current "Masterclass" build. They define the baseline look.

| Role | Color Name | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | **Void Blue** | `#0B0C15` | `bg-[#0B0C15]` | The infinite canvas. **NEVER** pure black (`#000000`). |
| **Primary** | **Cyan Neon** | `#22d3ee` | `text-cyan-400` / `bg-cyan-500` | Main brand color, headings, primary buttons, "Norah Noun". |
| **Secondary** | **Slate Mist** | `#94a3b8` | `text-slate-400` | Subtitles, secondary text, non-active elements. |
| **Accent** | **Pink Neon** | `#f472b6` | `text-pink-400` / `bg-pink-500` | Highlights, "Things" category, special callouts. |
| **Success** | **Emerald Neon** | `#34d399` | `text-emerald-400` | Correct answers, positive feedback. |
| **Error** | **Red Neon** | `#f87171` | `text-red-400` | Incorrect answers, warnings, "Top Secret" stamps. |
| **Text** | **Starlight** | `#E2E8F0` | `text-slate-200` | Main body text. **NEVER** pure white (`#FFFFFF`) for body text (causes eye strain). |

### Special Utility Colors
Specific overrides used for unique elements.

| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Gold** | `#FFD700` | `.text-gold` class. Used for stars, trophies, and high-value rewards. |
| **Gradient Start** | `#2DD4BF` | Teal-400. Start of the "Brand Gradient". |
| **Gradient End** | `#60A5FA` | Blue-400. End of the "Brand Gradient". |
| **Glass Border** | `#FFFFFF` (10-20% Opacity) | Used for glass panel rims. |

---

## 2. The "Aura" Spectrum (The Stylized Rainbow)

To ensure future classes (130+) maintain the same "tonality" and "depth" regardless of their primary color, use this **Strict Spectrum**.
**Rule**: Always use the **400-series** for Text/Icons and **500-series** for Backgrounds/Glows.

| Color Family | Hex (Text/Icon) | Hex (Glow/Bg) | Usage Notes |
| :--- | :--- | :--- | :--- |
| **Red** | `#f87171` (Red-400) | `#ef4444` (Red-500) | High alert, danger, or "hot" topics. |
| **Orange** | `#fb923c` (Orange-400) | `#f97316` (Orange-500) | Warmth, energy, "active" verbs. |
| **Amber** | `#fbbf24` (Amber-400) | `#f59e0b` (Amber-500) | Gold, rewards, trophies. Better contrast than Yellow. |
| **Yellow** | `#facc15` (Yellow-400) | `#eab308` (Yellow-500) | **Caution**: Use sparingly on text. Good for glows. |
| **Lime** | `#a3e635` (Lime-400) | `#84cc16` (Lime-500) | Zesty, acid, "slime" themes. |
| **Green** | `#4ade80` (Green-400) | `#22c55e` (Green-500) | Nature, "go", standard positive. |
| **Emerald** | `#34d399` (Emerald-400) | `#10b981` (Emerald-500) | **Preferred Green**. Magical, gem-like. |
| **Teal** | `#2dd4bf` (Teal-400) | `#14b8a6` (Teal-500) | Deep ocean, sophisticated. |
| **Cyan** | `#22d3ee` (Cyan-400) | `#06b6d4` (Cyan-500) | **CORE BRAND**. Tech, ice, future. |
| **Sky** | `#38bdf8` (Sky-400) | `#0ea5e9` (Sky-500) | Air, flight, "light" themes. |
| **Blue** | `#60a5fa` (Blue-400) | `#3b82f6` (Blue-500) | Standard information, "Places" category. |
| **Indigo** | `#818cf8` (Indigo-400) | `#6366f1` (Indigo-500) | Deep magic, night, "Common Nouns". |
| **Violet** | `#a78bfa` (Violet-400) | `#8b5cf6` (Violet-500) | Royal, mystical. |
| **Purple** | `#c084fc` (Purple-400) | `#a855f7` (Purple-500) | Magic, creative. |
| **Fuchsia** | `#e879f9` (Fuchsia-400) | `#d946ef` (Fuchsia-500) | High energy, electric. |
| **Pink** | `#f472b6` (Pink-400) | `#ec4899` (Pink-500) | **Secondary Accent**. Love, sweet. |
| **Rose** | `#fb7185` (Rose-400) | `#f43f5e` (Rose-500) | Romantic, soft red. |

---

## 3. Lighting & Effects Formulas

To achieve the "One-Shot" look, apply these exact CSS recipes.

### A. The "Glass Panel" (Standard)
Used for cards, containers, and modal windows.
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.02); /* Ultra-low opacity */
  backdrop-filter: blur(32px);           /* Heavy blur for depth */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Subtle rim light */
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
}
```

### B. The "Neon Text Glow"
Used for Headings (`h1`, `h2`) to make them pop.
**Formula**: `text-shadow: 0 0 2rem {Color-400-Alpha-0.4}`
```css
.text-glow-cyan {
  text-shadow: 0 0 2rem rgba(34, 211, 238, 0.4);
}
.text-glow-pink {
  text-shadow: 0 0 2rem rgba(244, 114, 182, 0.4);
}
```

### C. The "Ambient Blob" (Background Glow)
Used behind images or glass panels to create atmosphere.
**Formula**: `bg-{Color-500}`, `blur-[80px]`, `opacity-20`
```html
<div class="absolute inset-0 bg-cyan-500 blur-[80px] opacity-20"></div>
```

### D. The "Brand Gradient" (Text)
Used for special emphasis text.
**Formula**: `linear-gradient(to right, {Color A}, {Color B})`
```css
.text-gradient-brand {
  background: linear-gradient(to right, #2DD4BF, #60A5FA); /* Teal to Blue */
  -webkit-background-clip: text;
  color: transparent;
}
```

### E. The "Grid Pattern" (Background Texture)
Used to add texture to the void.
**Formula**: `linear-gradient` with `rgba({Color-500}, 0.03)`
```css
.bg-grid {
  background-image: 
    linear-gradient(to right, rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
}
```

---

## 4. Implementation Guide for Devs

1.  **Start Dark**: Always begin with `#0B0C15`.
2.  **Pick a Primary**: Choose **ONE** color from the Spectrum (e.g., Purple) for the class theme.
3.  **Apply the Formula**:
    *   **Headings**: `text-purple-400` + `text-glow`
    *   **Buttons**: `bg-purple-500` to `bg-purple-400` gradient.
    *   **Blobs**: `bg-purple-500` / opacity 20%.
    *   **Borders**: `border-purple-500/30`.
4.  **Don't Mix Temperatures**: If the theme is "Cool" (Blue/Cyan/Purple), avoid heavy use of "Warm" (Red/Orange) unless for errors/alerts.
5.  **Contrast Check**: Always check text against the dark background. If `400` is too dark, use `300`. Never use `500` or higher for body text.

---

> [!TIP]
> **One-Shot Success**: To nail the look instantly, copy the **Glass Panel** CSS and the **Ambient Blob** HTML structure, then just swap the Tailwind color class (e.g., change `bg-cyan-500` to `bg-lime-500`). The opacity and blur values are calibrated to work with *any* color in the spectrum.
