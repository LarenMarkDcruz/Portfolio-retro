# Portfolio editing notes

This is a buildless HTML/CSS/JavaScript website. Editable source is in `dist/`; it is intentionally tracked. No dependency installation is needed.

Preserve these choices unless the user asks to change them:
- Owner: Laren Mark D’Cruz. Role: Software Engineer / Site Reliability Engineer.
- Email is the only contact method.
- Near-black terminal background, Source Code Pro typography, C++-inspired syntax accents.
- Matrix green is the default; Amber, Cyan, Violet, and Rose are selectable and remembered locally.
- Name and role use medium weight 500, with a glow. Other text uses light weight 300.
- Mobile layout, accessible keyboard tabs, and 44px touch targets.
- Avoid inventing projects or professional claims; use supplied résumé information.

Preview: `python3 -m http.server 8000 --directory dist --bind 127.0.0.1`.
Check JavaScript syntax with `node --check dist/app.js` when Node is available. Verify local asset paths, tab anchors, and responsive layout after changes. No automated browser testing is currently bundled.

This GitHub repository is separate from the Sites deployment repository. Pushing here does not publish changes to Sites. Do not add deployment credentials to files.
