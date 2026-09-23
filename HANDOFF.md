# Brothers Interactive website — handoff notes

Paste this file (or its contents) into the first message of a new Claude session so it has full context.

## What this is
A static, multi-page website for Brothers Interactive, a 3D game character art studio in Jaipur, India.
No build step, no framework. Plain HTML, CSS and JavaScript. Open `index.html` directly or serve the folder.

## Pages
- `index.html` — home: hero with showreel, client wall, masonry portfolio (59 pieces, shuffled every load), sculpt-to-final sliders, games with trailers, testimonials (3 SAMPLE quotes to replace), services, process, studio, FAQ, careers teaser, blog, quote estimator, project brief form.
- `team.html`, `careers.html`, `styles.html`, `credits.html`, `asset.html?id=<projectId>`, `privacy.html`, `404.html`.

## Where things live
- `data.js` — ALL content and settings (portfolio, games, testimonials, roles, press, clients, estimator ranges, CONFIG for Formspree / booking link / analytics / showreel video id). Edit content here.
- `script.js` — behaviour: filters, lightbox with zoom animation, theme switcher (6 themes), forms, estimator, sliders, custom paintbrush cursor, tilt/ripple/parallax effects.
- `style.css` — all styling; theme tokens at the top.
- `assets/img/` — optimised WebP images used by the site. `assets/portfolio`, `assets/games`, `assets/brand` are the original downloads and can be deleted.
- `assets/brothers-interactive-capabilities.pdf` — generated deck.
- `DEPLOY.md` — how to edit, connect services and deploy (Netlify drop is the quickest).
- `.claude/launch.json` — local preview server config for Claude Code (`python -m http.server 8787`).

## Things still to fill in by the studio
- Real testimonials (replace the three `sample: true` entries in data.js).
- Leadership titles and photos on team.html (only the CEO title is public).
- CONFIG in data.js: Formspree form id, booking URL, Plausible domain, showreel YouTube id.
- Trust numbers on the home page ("returning studios", "NDA-covered") and estimator ranges are assumptions.
- FAQ policy statements (time zone, paid art tests, reply times).

## Conventions
- Six colour themes switch via `data-theme` on `<html>`; every colour is a CSS token.
- Shared header/footer are inserted into each page between `<!--NAV-->` and `<!--FOOTER-->` markers.
- `script.js` guards page-specific code, so one script serves every page.
- Images: 1000px-wide WebP, quality 80. Add new pieces to `PROJECTS` in data.js with `w`/`h` so the masonry grid reserves space.
