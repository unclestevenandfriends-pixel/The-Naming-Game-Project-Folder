# QA Bug Log – Map & Hub Systems (analysis only)

1. **Double translation on every node icon**  
   *File:* `css/map_styles.css` lines 439‑456  
   *Details:* `.map-node` still applies `transform: translate(-50%, -50%)` even though each `.node-icon` and `.node-label` is absolutely positioned and applies its own translate to center itself. Because transforms multiply down the DOM tree, the icon, swords, unlock burst, and the label all receive two translate operations, which is exactly why the buttons/tokens appear southeast of the glowing circles even after recalibrating the coordinates. The parent needs to stop translating and let the zero-sized anchor or the icon handle centering.  
   *Impact:* All active/unlocked states remain visibly off-target; recalibrating coordinates cannot fix it because the math happens after positioning.  
   *Fix direction:* Remove the translate from `.map-node` (or move it to `.map-node-anchor`) so only one translate is applied to the icon/label stack.

2. **Player token loses its centering transform after every re-anchor**  
   *File:* `js/map.js` lines 449‑457 (`positionTokenOnNode`)  
   *Details:* The function writes `token.style.transform = 'translate(-50%, -50%) !important';`. Inline styles cannot include `!important`, so the browser discards the declaration and the token is left with no transform at all. As soon as the avatar is reattached to a node anchor its top-left corner sits on the anchor (rather than its center), recreating the southeast drift the user keeps seeing.  
   *Impact:* The avatar/robot never sits flush on the node sockets even though the anchors are correct.  
   *Fix direction:* Assign a normal value (`token.style.transform = 'translate(-50%, -50%)';`) or, better yet, drop the inline write and rely on the `#player-token` rule that already has the correct transform with `!important`.

3. **Saved progress can reload with zero unlocked nodes**  
   *File:* `js/map.js` lines 938‑954 (`loadProgress`)  
   *Details:* When no `unlockedNodes` array exists in storage (brand-new session, reset, or corrupted save), the loader leaves `this.state.unlockedNodes` empty and never re-inserts `"N1"`. Because `introPlayed` stays `false`, the user can open the map before the cinematic runs and will see a fully locked board with no way to trigger the unlock animation. This is the same corruption symptom that previously broke the Evidence hub: the loader must always guarantee `"N1"` exists.  
   *Impact:* Fresh sessions and any recovered saves that are missing `"N1"` will soft-lock the map—no nodes unlock until the user manually clears storage again.  
   *Fix direction:* After mapping/canonicalising the saved IDs, inject `"N1"` when it is absent before the state is used anywhere else.

4. **Central Hub hunts are ordered after the Mega-Mix boss in the deck**  
   *Files:* `Draft 1 The Naming Game Index.HTML` lines 870‑930 (`people_hunt`, `places_hunt`, `things_hunt`)  
   *Details:* The three hunt slides are defined *after* the Mega-Mix boss slide in the deck even though the map expects them before node `N4`. When the player clicks “People Hunt” first, MapSystem tries to scroll to a slide index that lives beyond the boss. During that smooth scroll the NavigationGuard logic sees the user leap past the highest permitted slide (since `N4` isn’t complete yet) and snaps them back—exactly what the user describes: the wrong slide opens or another hunt is marked. Once the player enters either `N3B` or `N3C`, `lastValidSlide` is rewound to the correct range and `N3A` behaves again.  
   *Impact:* Visiting People Hunt before the other branches is unstable; the guard can yank the slider to the nearest valid slide and the completion logic can register the wrong child under HubA.  
   *Fix direction:* Move the hunt slides so they sit before the Mega-Mix section (to match the map graph) or relax the NavigationGuard limit while `mapNavigating` is true so it doesn’t snap the scroll while the guard still believes Mega-Mix should be next.

