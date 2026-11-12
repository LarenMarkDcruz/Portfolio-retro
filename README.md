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
- `dist/app.js`: tab navigation, saved theme preferences, filters, and terminal commands.
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

The site uses a black background, brighter readable text, and Display P3 accents on compatible screens. P3 improves the available colors; it is not HDR.

An experimental CSS HDR enhancement brightens the name, role, and brand only when the browser supports Rec. 2100 linear colors and reports a high dynamic range display. Other browsers use normal colors. Actual HDR output depends on the browser, operating system, display, and its settings; local browser checks cannot verify physical luminance.

## Résumé link

The Google Docs résumé appears quietly in the footer. To make it accessible to visitors, set that document's General access to **Anyone with the link → Viewer**. A subtle link is still public, not access control. The existing résumé tab and text download remain available.
