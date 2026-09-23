# Content editor — one-time setup

This turns `/admin` into a private page where you can edit almost everything
on the site — no code editing:

- **Portfolio** — add/edit pieces (title, category, images, description)
- **Games** — the Games section key art, studio, trailer
- **Reviews** — client testimonials
- **Team** — the people on the Team page
- **Sculpt to Final** — the before/after comparison pairs
- **Clients** — the client/studio logo wall
- **Blog Posts** — titles and dates
- **Careers** — open job roles
- **Press** — press and recognition mentions
- **Settings** — availability pill, contact email/address, booking link,
  Formspree ID, analytics domain, capabilities deck PDF

Everything on the code side is already done. These steps need your Netlify
account (I can't click through a dashboard on your behalf):

1. **Push this repo to GitHub** and connect it as a new site on
   [Netlify](https://app.netlify.com) (drag-and-drop or "Import from Git").
   Ask me when you're ready and I'll walk through the exact commands.

2. In the Netlify dashboard for the site: **Site settings → Identity → Enable Identity**.

3. Still under Identity → **Registration**, set it to **"Invite only"**
   (so strangers can't sign themselves up as editors).

4. Under Identity → **Services → Git Gateway**, click **Enable Git Gateway**.
   This is what lets the admin page save changes without you ever touching GitHub.

5. Under Identity → **Invite users**, invite your own email address.
   You'll get an email with a link to set a password.

6. Visit `https://<your-site>.netlify.app/admin/` (or your custom domain +
   `/admin/`), log in, and you'll see all the collections above, each
   listing the site's current content, ready to edit.

## Using it day-to-day

- Open a collection, then an existing entry (to edit it) or "Add ..." (to
  create a new one).
- Fill in the fields — required ones are marked, everything else is optional.
- Click **Publish**. Within about a minute the change is live on the site.
- For Portfolio specifically: image width/height are optional — leave them
  blank if you don't know the pixel size, the site falls back gracefully.
- For Reviews: uncheck **"Sample / placeholder"** once you replace a sample
  quote with a real, approved one — that's what removes the "Sample" badge.
- For Team/Clients photos: leave the photo/logo field empty to fall back to
  initials (Team) or a plain text name (Clients) instead of a broken image.

## Where the data actually lives

Each collection edits one plain JSON file under `data/`, listed below. If a
CMS edit ever looks wrong, these are readable/fixable directly, CMS or not:

| Collection | File |
|---|---|
| Portfolio | `data/portfolio.json` |
| Games | `data/games.json` |
| Reviews | `data/testimonials.json` |
| Team | `data/team.json` |
| Sculpt to Final | `data/pairs.json` |
| Clients | `data/clients.json` |
| Blog Posts | `data/posts.json` |
| Careers | `data/roles.json` |
| Press | `data/press.json` |
| Settings | `data/config.json` |

## Not in the admin panel yet

**Case Studies** (the detailed game breakdowns with client/year/engine/stats)
still live in `js/data.js` (`CASES`) rather than a CMS-editable file. That
section isn't currently displayed anywhere on the live site, and its data
shape (a list of stat pairs) doesn't map cleanly onto a CMS form yet — so it
was left as-is rather than risk losing data. Ask if you'd like this built
out properly once (or if) that section gets used.
