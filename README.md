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

## Hosting

The `dist` folder can be deployed to a static host such as GitHub Pages, Cloudflare Pages, or Netlify. This repository does not configure automatic deployment. GitHub pushes do not automatically update the existing private Sites publication.

For GitHub Pages, use a Pages deployment workflow that uploads `dist` as its artifact. A project site is normally served under `/Portfolio-retro/`; the site uses relative asset URLs suitable for that path.

The current Sites publication is https://terminal-portfolio-lab.larenmark.chatgpt.site and remains private. Its hosting identity and credentials are not included in this repository.
