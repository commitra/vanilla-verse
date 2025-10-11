# Vanilla Verse

A community-friendly collection of small, fun, and instructive Vanilla JS projects. It includes a central hub page that links to a set of beginner-friendly project stubs designed for “good first issues” and first-time contributors.

Highlights
- Pure HTML/CSS/JS – no frameworks or build steps.
- Central hub with a searchable/filterable project gallery.
- Each project has a minimal runnable stub and clearly marked TODOs for contributors.
- Ready for GitHub Pages deployment.

## Quick start

- Open this folder in VS Code.
- Use an HTTP server for local testing (recommended: Live Server extension).
- Open `index.html` in your browser.

Optional: with Live Server installed
- Right-click `index.html` → “Open with Live Server”.

More details: see `docs/Organization-Setup.md` and `docs/DEPLOYMENT.md`.

## Project structure

- `index.html` — Central hub page listing all projects
- `assets/` — Shared CSS/JS for the hub
- `data/projects.json` — List of project entries (used by the hub)
- `projects/` — Individual project folders (each with its own `index.html` and `main.js`)
- `docs/` — Organization setup and deployment docs
- `.github/` — Issue/PR templates and Pages deploy workflow

## Contributing

We welcome first-timers. Start by reading:
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`

Then pick a project on the hub and look for TODOs in its `main.js` (and the project README if present). If you get stuck, open a discussion or an issue.

## Good first issues

In addition to issue templates, each project’s starter code marks several concrete TODOs:
- Add a feature (e.g., new level, theme, sound, or accessibility improvement)
- Fix a bug (e.g., keyboard navigation, bounds checks)
- Improve UX (e.g., animations, colors, layout)


## License

This project is licensed under the MIT License — see `LICENSE` for details.

## Credits
- Hrishikesh Dalal (https://www.hrishikeshdalal.tech/)
