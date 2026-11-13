# ASCII sculpture style catalogue

When Laren asks about available ASCII styles, show this catalogue and distinguish **active** from **archived**. Codex and Claude sessions in this repository should read this file before discussing or replacing styles. Do not reactivate archived styles unless requested.

**Active: Classic fusion.** It is the only live style; the dropdown has been removed. Each load and random reset generates a new seed and starting pose. Two hollow curved bodies align into one rotating rounded or oval loop, stay joined for a random duration, separate, and linger apart. Their central tunnels remain carved through the merged surface. The opening naturally narrows when viewed edge-on. Transitions ease smoothly; motion varies smoothly between 1.96875× and 2.625×.

**Archived: the sixteen reference-inspired families below.** Their renderers live in `archive/ascii_style_library/`, and the selectable website version remains in commit `9b889b7`. They are retained for future restoration, not loaded by the live website.

| Style | Type | Appearance |
|---|---|---|
| Classic fusion | Active | Two hollow loops grow, align into one rotating oval, and separate |
| Orbital duet | Rounded | A ring and sphere inside curved orbital bands |
| Binary planets | Rounded | Two growing spheres and curved orbital bands |
| Crescent satellite | Rounded | A thick crescent and companion sphere |
| Porous worlds | Rounded | Two rippling shells with openings |
| Double helix | Flowing | Two broad strips wind around a shared axis |
| Folded wings | Flowing | Twisted, overlapping ribbon surfaces |
| Infinity flow | Flowing | Paired figure-eight strips |
| Woven knot | Flowing | Two intertwined trefoil-like ribbons |
| Clover orbits | Flowing | Broad three-lobed strips and orbit bands |
| Flowing fabric | Flowing | Two overlapping wave sheets |
| Twin vortices | Spiral | Two curved, multi-arm spirals |
| Spiral galaxy | Spiral | Paired spiral discs with depth and ripple |
| Ribbon and lattice | Geometric | A helix weaves around a wire sphere |
| Interlocked frames | Geometric | Two thick square frames |
| Crystal companions | Geometric | Paired rotating diamond solids |
| Merging loops | Fusion | The distance-field pair with curved orbital bands |

The sixteen families interpret the supplied 4×4 reference; they are procedural designs rather than exact image reproductions. The archived geometry catalogue lives in `archive/ascii_style_library/sculpture_patterns.js`.

## Rendering choices

- Resolution: 160 columns on desktop; 128 on narrow sculpture windows. Fixed camera; oversized forms crop at the rectangle edges.
- Curves: the active renderer uses two smoothly fused, warped surfaces. The archived families include ribbons, orbital tubes, spirals, and geometric forms.
- Animation: target up to 120 FPS through `requestAnimationFrame`. Display refresh rate, browser scheduling, and rendering cost determine actual FPS. Motion speed remains independent of FPS.
- Accessibility: pause, random reset, and reduced-motion support remain available. There is no style dropdown.
