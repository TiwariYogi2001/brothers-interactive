# Brothers Interactive website — how to run, edit and deploy

## Files

| File | What it is |
|---|---|
| `index.html` | Home page: hero, portfolio, sculpt-to-final, games, testimonials, services, process, studio, FAQ, careers teaser, blog, estimator, contact |
| `team.html` | Leadership and studio structure |
| `careers.html` | Jobs page with application form |
| `styles.html` | Art style guide |
| `credits.html` | Game credits and press |
| `asset.html` | Detail page for any portfolio piece (`asset.html?id=mOZqAe`) |
| `privacy.html`, `404.html` | Legal and not-found pages |
| `style.css` | All styling, including the six colour themes |
| `script.js` | Behaviour: filters, lightbox, forms, estimator, sliders, theme switcher |
| `data.js` | **All content.** Portfolio, games, case studies, roles, testimonials, settings. Edit this, not script.js |
| `assets/img/` | Optimised WebP images used by the site |
| `assets/portfolio`, `assets/games`, `assets/brand` | Original downloads. Safe to delete once you are happy with the WebP versions |
| `assets/brothers-interactive-capabilities.pdf` | Downloadable capabilities deck |
| `sitemap.xml`, `robots.txt`, `netlify.toml` | Search engine and hosting config |

## Edit content

Open `data.js`. Every list has a comment above it showing the shape of an entry.

- **Settings** (`CONFIG`): availability text, Formspree form id, booking link, analytics domain, showreel video id.
- **Open roles**: add to `ROLES` and they appear on the home page and careers page.
- **Testimonials**: add to `TESTIMONIALS` and the block appears on the home page.
- **Press**: add to `PRESS` and it appears on credits.html.
- **Portfolio**: each entry in `PROJECTS` has a title, category, main image, extra images, description and tags. Add `sketchfab: "MODEL_ID"` to any entry to show an interactive 3D viewer on its detail page and in the lightbox.
- **Client logos**: add `logo: "assets/img/logos/name.webp"` to a `CLIENTS` entry once you have permission to use the logo.

## Forms without a backend

By default the forms open the visitor's email client. To receive submissions in your inbox:

1. Create a free form at https://formspree.io and copy its id (the part after `/f/`).
2. Put it in `CONFIG.formspreeId` in `data.js`.

Both the project brief form and the job application form then post directly to Formspree.

## Analytics

Sign up at https://plausible.io (privacy-friendly, no cookie banner needed), add your domain, and put it in `CONFIG.plausibleDomain`. The site already sends events for `brief_sent`, `application_sent`, `estimate_run`, `trailer_played`, `deck_downloaded` and `theme_changed`.

## Deploy

**Netlify (easiest):** go to https://app.netlify.com/drop and drag this whole folder onto the page. You get a live URL in seconds. Add your custom domain in Site settings.

**GitHub Pages:** push the folder to a repository, then Settings → Pages → deploy from the main branch root.

**Any web host:** upload every file and folder except `.claude/` via FTP. No server-side code is needed.

**Custom domain:** point `brothersinteractive.com` (or a subdomain such as `new.brothersinteractive.com` while reviewing) at the host. Then update the domain in `sitemap.xml`, `robots.txt` and the `og:url` tags if you change it.

## Run locally

Double-click `index.html`, or run a local server from this folder:

```
python -m http.server 8787
```

and open http://localhost:8787
