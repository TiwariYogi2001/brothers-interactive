# Portfolio uploader — one-time setup

This turns `/admin` into a private page where you can add a new portfolio
piece (title, category, images, description) and have it appear on the live
site automatically within a minute or two — no code editing.

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
   `/admin/`), log in, and you'll see a **Portfolio** section listing all 59
   existing pieces, editable and ready for new ones.

## Using it day-to-day

- Click **New Portfolio Pieces** (or open an existing piece to edit it).
- Fill in the title, pick a category, upload the main image and any extra
  angle shots, write a short description.
- Click **Publish**. That's it — within about a minute the new piece is
  live on the site, already mixed into the random shuffle and portfolio
  grid like every other piece.
- Image width/height fields are optional — leave them blank if you don't
  know the pixel size; the site falls back gracefully either way.

## If something looks wrong

The portfolio data lives in `data/portfolio.json`. If a CMS edit ever looks
broken, that file is where to check — it's a plain, readable JSON file even
outside the admin page.
