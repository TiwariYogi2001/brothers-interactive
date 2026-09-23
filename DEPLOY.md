# Brothers Interactive website — how to run, edit and deploy

## Folder layout

```
html/    all pages (index.html, team.html, careers.html, styles.html, credits.html, asset.html, privacy.html, 404.html)
css/     style.css
js/      data.js, script.js
data/    portfolio.json (the portfolio pieces — editable via /admin, see below)
assets/  images, PDF, everything else
admin/   the /admin content-upload page (Decap CMS) — see admin/README.md
```

## Files

| File | What it is |
|---|---|
| `html/index.html` | Home page: hero, portfolio, sculpt-to-final, games, testimonials, services, process, studio, FAQ, careers teaser, blog, estimator, contact |
| `html/team.html` | Leadership and studio structure |
| `html/careers.html` | Jobs page with application form |
| `html/styles.html` | Art style guide |
| `html/credits.html` | Game credits and press |
| `html/asset.html` | Detail page for any portfolio piece (`asset.html?id=mOZqAe`) |
| `html/privacy.html`, `html/404.html` | Legal and not-found pages |
| `css/style.css` | All styling, including the colour themes |
| `js/script.js` | Behaviour: filters, lightbox, forms, estimator, sliders, theme switcher |
| `js/data.js` | Settings, games, case studies, roles, testimonials. Edit this, not script.js |
| `data/portfolio.json` | The portfolio pieces shown in the grid. Edit by hand, or via `/admin` (see below) |
| `admin/` | A private page at `/admin` for adding new portfolio pieces (title, images, description) without touching code. One-time setup needed — see `admin/README.md` |
| `assets/img/` | Optimised WebP images used by the site |
| `assets/portfolio`, `assets/games`, `assets/brand` | Original downloads. Safe to delete once you are happy with the WebP versions |
| `assets/brothers-interactive-capabilities.pdf` | Downloadable capabilities deck |
| `sitemap.xml`, `robots.txt`, `netlify.toml` | Search engine and hosting config |

All paths inside the HTML/JS files that point at `css/`, `js/` or `assets/` use `../` since every page now lives inside `html/`. Links between pages (e.g. `href="team.html"`) stay plain filenames since all pages are siblings in the same folder.

## Edit content

Open `js/data.js`. Every list has a comment above it showing the shape of an entry.

- **Settings** (`CONFIG`): availability text, Formspree form id, booking link, analytics domain, showreel video id.
- **Open roles**: add to `ROLES` and they appear on the home page and careers page.
- **Testimonials**: add to `TESTIMONIALS` and the block appears on the home page.
- **Press**: add to `PRESS` and it appears on credits.html.
- **Portfolio**: lives in `data/portfolio.json`, not `data.js` — edit it directly, or use `/admin` (see `admin/README.md`) to add pieces without touching JSON. Each entry has a title, category, main image, extra images, description and tags. Add `sketchfab: "MODEL_ID"` to any entry to show an interactive 3D viewer on its detail page and in the lightbox.
- **Client logos**: add `logo: "assets/img/logos/name.webp"` to a `CLIENTS` entry once you have permission to use the logo.

## Forms without a backend

By default the forms open the visitor's email client. To receive submissions in your inbox:

1. Create a free form at https://formspree.io and copy its id (the part after `/f/`).
2. Put it in `CONFIG.formspreeId` in `data.js`.

Both the project brief form and the job application form then post directly to Formspree.

## Analytics

Sign up at https://plausible.io (privacy-friendly, no cookie banner needed), add your domain, and put it in `CONFIG.plausibleDomain`. The site already sends events for `brief_sent`, `application_sent`, `estimate_run`, `trailer_played`, `deck_downloaded` and `theme_changed`.

## Deploy

**Netlify (easiest):** go to https://app.netlify.com/drop and drag this whole folder onto the page. `netlify.toml` redirects `/` to `/html/index.html` and 404s to `/html/404.html`, so the site works at the domain root. Add your custom domain in Site settings.

**GitHub Pages:** push the folder to a repository, then Settings → Pages → deploy from the main branch root. Because `index.html` now lives in `html/`, the homepage will be at `https://<user>.github.io/<repo>/html/index.html` — GitHub Pages doesn't support the `netlify.toml` redirect, so there's no clean root URL here. If you want a plain root URL on GitHub Pages, keep using Netlify instead, or ask to add a small root `index.html` that redirects to `html/index.html`.

**Any web host:** upload every file and folder except `.claude/` via FTP. No server-side code is needed. Point the site root at `html/index.html`, or add a redirect if your host supports one.

**Custom domain:** point `brothersinteractive.com` (or a subdomain such as `new.brothersinteractive.com` while reviewing) at the host. Then update the domain in `sitemap.xml`, `robots.txt` and the `og:url` tags if you change it.

## Run locally

Open `html/index.html` directly, or run a local server from the project root (not from inside `html/`, so the `../css`, `../js`, `../assets` paths resolve):

```
python -m http.server 8787
```

and open http://localhost:8787/html/index.html
