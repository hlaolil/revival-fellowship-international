# Revival Fellowship International – Website

Express + EJS website for Revival Fellowship International (Butha-Buthe, Lesotho), with a password-protected admin panel backed by MongoDB.

## Running locally

```bash
npm install
npm run dev      # or: npm start
```

The site runs on http://localhost:3000. Styles are pre-built with Tailwind: after changing classes in `views/`, run `npm run build:css` (or `npm run watch:css` while editing) and commit `public/styles/site.css`. Vercel also runs this automatically through the `vercel-build` script. Without `MONGODB_URI` the public pages fall back to the JSON files in `data/` (read-only); the admin panel and enquiry form need MongoDB.

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
| `/` Home, `/visit` Plan Your Visit, `/about`, `/ministries` (+ detail pages), `/events` church calendar, `/sermons`, `/news` (+ articles), `/gallery`, `/join` → `/inquire`, `/give` (when switched on) | Dashboard, Enquiries (filter, mark handled, CSV export), Events (incl. monthly repeats such as "1st Sunday"), Ministries, Testimonials, News, Sermons, Gallery, Home page content (announcement banner, scripture, pastor's message), Site Settings (contact details, social links, service times, giving details) |

`/sitemap.xml` and `/robots.txt` are generated automatically.

## Images

Admin forms have an **Upload Photo** button: the browser resizes the photo (max 1600px) and it is stored in MongoDB (`media` collection) and served from `/media/<id>`. Uploaded photos are removed when the item using them is deleted or given a new photo. You can also type a filename from `public/images/` (e.g. `service.jpg`) or paste a full `https://` image link.

## Admin login

Sessions last 8 hours. After 5 wrong passwords from the same address, login is blocked for 15 minutes.

## Deployment

Configured for Vercel (`vercel.json`). Set the environment variables above in the Vercel project settings.
