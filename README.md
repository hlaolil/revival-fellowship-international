# Revival Fellowship International – Website

Express + EJS website for Revival Fellowship International (Butha-Buthe, Lesotho), with a password-protected admin panel backed by MongoDB.

## Running locally

```bash
npm install
npm run dev      # or: npm start
```

The site runs on http://localhost:3000. Without `MONGODB_URI` the public pages fall back to the JSON files in `data/` (read-only); the admin panel and enquiry form need MongoDB.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. Empty collections are seeded from `data/*.json` on first connect. |
| `ADMIN_PASSWORD` | Password for `/admin`. **Set this in production** – the built-in default is only for local use. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Optional: email a notification for each enquiry. |
| `NOTIFY_EMAIL` | Address that receives enquiry notifications. |

## Pages

| Public | Admin (`/admin`) |
| --- | --- |
| `/` Home, `/about`, `/ministries` (+ detail pages), `/events` church calendar, `/sermons`, `/news` (+ articles), `/gallery`, `/join` → `/inquire` | Dashboard, Enquiries (filter, mark handled, CSV export), Events, Ministries, Testimonials, News, Sermons, Gallery, Home page content (announcement banner, scripture, pastor's message) |

`/sitemap.xml` and `/robots.txt` are generated automatically.

## Images

Anywhere the admin asks for an image you can enter either a filename from `public/images/` (e.g. `service.jpg`) or a full `https://` link to an image hosted elsewhere. New files in `public/images/` need a redeploy; links work immediately.

## Deployment

Configured for Vercel (`vercel.json`). Set the environment variables above in the Vercel project settings.
