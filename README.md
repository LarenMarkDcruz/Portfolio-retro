# Portfolio retro

Laren Mark D’Cruz’s minimalist portfolio: C++-inspired navigation, near-black terminal styling, Source Code Pro typography, and five accent palettes. Matrix green is the default.

## Run locally

No build step or package installation is needed. From this folder, run:

```sh
python3 -m http.server 8000 --directory dist --bind 127.0.0.1
```

Open http://localhost:8000. Stop the server with Ctrl+C.

## Edit in Codex on your computer

1. Clone this repository:

   ```sh
   git clone https://github.com/LarenMarkDcruz/Portfolio-retro.git
   cd Portfolio-retro
   ```

2. In the ChatGPT/Codex desktop app, add a local project and select the cloned `Portfolio-retro` folder. Choose the Local environment for work on these files.
3. Start a chat in that project. For example: “Read AGENTS.md and the portfolio files. Start the local preview and help me add a project.”

## Files

- `dist/index.html`: portfolio content, tabs, and contact information.
- `dist/style.css`: layout, responsive styles, glow, and color palettes.
- `dist/app.js`: tab navigation, display preferences, and filters.
- `dist/terminal.js`: website terminal commands, history, completion, and custom colors.
- `dist/resume.txt`: downloadable résumé.
- `dist/SourceCodePro-*`: locally hosted fonts. Their license is in `FONT-LICENSE.txt`.

## Free hosting with GitHub Pages

The workflow in `.github/workflows/deploy_pages.yml` publishes only `dist/`. GitHub Pages is free for public repositories.

1. Open https://github.com/LarenMarkDcruz/Portfolio-retro/settings/pages.
2. Under **Build and deployment**, choose **GitHub Actions** as the source. Enable repository Actions if GitHub asks.
3. Open **Actions → Publish portfolio → Run workflow**, choose `main`, and run it.
4. After the workflow succeeds, open https://larenmarkdcruz.github.io/Portfolio-retro/. Settings → Pages shows the confirmed address.

Future updates: edit files in `dist/`, preview locally, commit, and push to `main`. The workflow automatically publishes changes to `dist/`. A failed deployment appears under Actions; the workflow must succeed before changes go live.

```text
Edit → Preview → Commit + push → GitHub Actions → Public website
```

This publishes the GitHub copy separately from the existing Sites publication. No deployment credentials belong in this repository.

## Display brightness

The site offers black, midnight navy (#0f0f23), and warm-paper terminal modes, with a separate five-color accent picker. Matrix green returns on every page load. Other palettes apply during the current visit; the display mode is remembered locally. A full-width solid canvas, medium-weight headings, and larger body text keep the retro layout readable. Dark mode uses a black background and Display P3 accents on compatible screens. P3 improves the available colors; it is not HDR.

An experimental CSS HDR enhancement brightens the name, role, and brand only when the browser supports Rec. 2100 linear colors and reports a high dynamic range display. Other browsers use normal colors. Actual HDR output depends on the browser, operating system, display, and its settings; local browser checks cannot verify physical luminance.

## Résumé link

The résumé tab links to Google Docs; `open resume` opens the same document. The footer has been removed. To make it accessible to visitors, set that document's General access to **Anyone with the link → Viewer**. A subtle link is still public, not access control. The résumé tab links directly to the Google Doc.

## Website terminal

The command line is always visible in a compact, borderless region at the bottom. Enter `/help` or `help` for the full website guide. This is a browser terminal for the portfolio, not an operating-system shell.

| Purpose | Commands |
| --- | --- |
| Navigation | `ls`, `pwd`, `cd skills`, `cd ..`, `open work`, `open github`, `open linkedin`, `open resume` |
| Appearance | `theme cyan`, `mode light`, `mode navy`, `bg #101018`, `fg #eeeeee`, `accent hotpink`, `font courier`, `reset` |
| Terminal | `/help`, `history`, `whoami`, `clear` |

`cd resume` opens the résumé section; `open resume` opens the Google Doc in a new tab. Popup blockers may require using the page link instead. Arrow keys recall session history. Tab completes commands and arguments; Shift+Tab leaves the field. Ctrl+L clears output; Ctrl+C cancels input.

The compact terminal stays at the bottom in document flow without a box. Output scrolls in a bounded area. The `visit:~/main.cpp $` prompt follows the active tab filename, including history navigation. Click unused terminal space to type; an underscore marks the empty prompt. Keyboard focus uses an underline instead of a dotted rectangle. Use `/help` or `help` for commands. Custom background, foreground, and accent colors accept browser-supported CSS colors: names, hex, RGB, HSL, and other supported color functions. Visitors can choose any colors, including combinations with low contrast; `reset` restores the palette. The `font` command selects bundled Source Code Pro, browser families, or a locally installed font. Choosing a palette or display mode resets custom colors. Custom colors and command history stay within the current visit. Fonts persist locally; reload restores the Matrix palette.

A brief section entrance and hover glows respect reduced-motion preferences. No photo is required for this text-first portfolio.

## Random C++ motto

`dist/focus_lines.js` contains 25 short C++ declarations. Every page load selects one at random and renders syntax-colored text. The motto stays still while reading. It works on the local server and static hosting without an API or backend. A refresh may select the same motto again.

## Abstract ASCII sculpture

Beyond code always opens Classic fusion with a random seed and starting pose. Two warped bodies rotate, exchange sizes, and merge through a smooth distance field. Each motion cycle chooses varying joined and separated hold durations, with smooth transitions between them. Random reset generates another Classic fusion composition; pause freezes the current state. The style dropdown is removed.

The sixteen alternative families are archived in `archive/ascii_style_library/` and are not loaded by the live website. See `SCULPTURE_STYLES.md` for the catalogue and restoration notes, also referenced by Codex and Claude project instructions.

The character grid now uses 160 columns on desktop and 128 on narrow mobile windows, up from 104. Seven lighting layers separate bright green highlights from deep shadows. Ray marching computes the fused surface and its lighting. Pause freezes the current state; the contrast exponent remains 225%, with no intensity slider.

The renderer targets up to 120 frames per second through requestAnimationFrame; actual FPS depends on the display refresh rate, browser scheduling, and rendering cost. Motion runs at half the previous speed, gradually varying between 1.125× and 1.5× using a seed-specific rhythm. The artwork uses a fixed camera and character scale inside a full-width landscape rectangle above the caption and controls. Growing shapes crop at the edges instead of triggering automatic zoom or recentering. Only resizing the rectangle changes the character grid; its height adapts to desktop space and mobile width without distorting the shapes. Desktop contact links sit directly below it; mobile shows contact links before the hobbies. The animation pauses offscreen and respects reduced-motion preferences. No external services or dependencies are required. Run the geometry and rendering checks with:

```sh
node --test tests/*.test.mjs
```

## Random three-sentence introduction

`dist/intro_sentences.js` contains 30 wordings in three pools: software engineering, the current Cisco/Splunk role, and Victoria, BC. Every load independently picks one sentence from each pool, producing 1,000 possible combinations. The factual details stay consistent. The existing sequential typing animation reveals the selected text, with the underscore at its end.
