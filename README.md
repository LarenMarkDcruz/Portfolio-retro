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
- `dist/app.js`: tab navigation, saved theme preferences, and filters.
- `dist/terminal.js`: website terminal commands, history, completion, custom colors, and resizing.
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

The site offers black, midnight navy (#0f0f23), and warm-paper terminal modes, with a separate five-color accent picker. Both preferences are remembered locally. A full-width solid canvas, medium-weight headings, and larger body text keep the retro layout readable. Dark mode uses a black background and Display P3 accents on compatible screens. P3 improves the available colors; it is not HDR.

An experimental CSS HDR enhancement brightens the name, role, and brand only when the browser supports Rec. 2100 linear colors and reports a high dynamic range display. Other browsers use normal colors. Actual HDR output depends on the browser, operating system, display, and its settings; local browser checks cannot verify physical luminance.

## Résumé link

The Google Docs résumé appears quietly in the footer. To make it accessible to visitors, set that document's General access to **Anyone with the link → Viewer**. A subtle link is still public, not access control. The existing résumé tab and text download remain available.

## Website terminal

Open **[command line]** and enter `help`. This is a browser terminal for the portfolio, not an operating-system shell.

| Purpose | Commands |
| --- | --- |
| Navigation | `ls`, `pwd`, `cd skills`, `cd ..`, `open work`, `open github`, `open linkedin`, `open resume` |
| Appearance | `theme cyan`, `mode light`, `mode navy`, `bg #101018`, `fg #eeeeee`, `reset` |
| Terminal | `size compact`, `size normal`, `size large`, `history`, `whoami`, `clear` |

`cd resume` opens the résumé section; `open resume` opens the Google Doc in a new tab. Popup blockers may require using the page link instead. Arrow keys recall session history. Tab completes commands and arguments; Shift+Tab leaves the field. Ctrl+L clears output; Ctrl+C cancels input.

Use the height slider, `size` command, or native bottom-edge drag handle to resize the terminal. It stays in document flow. Custom background and foreground colors use six-digit hexadecimal values and require a minimum body-text contrast ratio of 4.5:1. Choosing a palette or display mode resets custom colors. Color settings persist locally; command history stays in the current session.

A brief section entrance and hover glows respect reduced-motion preferences. No photo is required for this text-first portfolio.
