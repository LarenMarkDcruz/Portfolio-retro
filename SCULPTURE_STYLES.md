# ASCII sculpture style catalogue

When Laren asks about available ASCII styles, show this catalogue, including **Classic fusion**. Keep existing styles available when adding new ones. Codex and Claude sessions working in this repository should read this file before discussing or replacing sculpture styles.

Use the style picker beside **random reset** on `beyond.cpp`. **Random mix** chooses among the sixteen reference-inspired families. Selecting a named family keeps it selected during resets; reset varies its proportions and starting pose. **Classic fusion** restores the previous two-body distance-field renderer, without orbital bands.

| Style | Type | Appearance |
|---|---|---|
| Classic fusion | Original | Two warped bodies grow, merge into a shared surface, and separate |
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

The sixteen families interpret the supplied 4×4 reference; they are procedural designs rather than exact image reproductions. The geometry catalogue lives in `dist/sculpture_patterns.js`.

## Rendering choices

- Resolution: 160 columns on desktop; 128 on narrow sculpture windows. Fixed camera; oversized forms crop at the rectangle edges.
- Curves: broad ribbons and shaded orbital tubes replace sparse, single-character orbital paths.
- Animation: target up to 120 FPS through `requestAnimationFrame`. Display refresh rate, browser scheduling, and rendering cost determine actual FPS. Motion speed remains independent of FPS.
- Accessibility: pause, random reset, keyboard-operable style picker, and reduced-motion support remain available.
