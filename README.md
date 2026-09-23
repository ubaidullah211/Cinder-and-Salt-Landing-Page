# Cinder & Salt

A responsive landing page for a premium steakhouse and café, with a real backend: a working reservation form and a small content dashboard (CMS) that lets a non-technical owner edit the menu and hours without touching code.

Built for the *Steakhouse & Café landing page* task.

## What's in it

**Public website** — Header/nav, Hero, About us, Our cuts, Café, Gallery (with a photo viewer), Opening hours, Reservation form, Location/map, Footer. Fully responsive (phone/tablet/desktop).

**Backend** — An Express server that does two jobs:
1. Receives and validates reservation requests (`POST /api/reservations`)
2. Serves a password-protected content dashboard at `/admin` for editing the cuts, café menu and opening hours

**The connection** — The website fetches its cuts/menu/hours live from the backend every time it loads. If the backend is offline, it quietly falls back to built-in defaults, so the site never breaks.

## Technology (and why)

| Part | Choice | Why |
|---|---|---|
| Frontend structure | Semantic **HTML5** | Accessible and SEO-friendly by default |
| Frontend styling | Plain **CSS** with variables, mobile-first | No build tools; easy to read and explain |
| Frontend behaviour | Plain **JavaScript** (no framework) | The whole codebase can be understood in one sitting; nothing to compile |
| Reusable UI pieces | Small "component" functions in `js/components.js` | Same idea as React components — one function, called once per data item — with zero setup |
| Backend | **Node.js + Express** | Minimal, well-documented, easy to explain line by line |
| Content storage | JSON files (`server/data/`) | Honest and simple for a small project — human-readable, no database server to install or manage |
| Admin login | HTTP Basic Auth | Enough for one owner on their own computer; see *Limitations* below |
| Fonts | Gloock + Hanken Grotesk (Google Fonts) | A characterful serif for headlines, a clean sans for reading |
| Map | OpenStreetMap embed | Free, no API key needed |

## Folder structure

```
cinder-and-salt/
├── index.html              the public website (all sections)
├── css/
│   ├── base.css             colours, fonts, resets, buttons
│   └── sections.css         the styles of each section
├── js/
│   ├── data.js               DEFAULT content + settings (used if the server is offline)
│   ├── components.js         functions that turn data into HTML
│   └── main.js                menu, live status, photo viewer, form, fetching live content
├── images/                  photos (see images/README.md for sizes)
├── favicon.svg
└── server/
    ├── server.js              the backend: reservations API + content API + admin
    ├── package.json
    ├── .env.example           template for your own server/.env (never committed)
    ├── admin/                 the content dashboard (HTML/CSS/JS)
    │   ├── index.html
    │   ├── admin.css
    │   └── admin.js
    └── data/
        ├── content.json       the LIVE cuts/menu/hours (editable via /admin)
        └── reservations.json  saved bookings (not committed - see .gitignore)
```

## Prerequisites

- **Node.js** (v18 or newer) — check with `node -v`. Get it at [nodejs.org](https://nodejs.org) if needed.

## Run it locally

This project has two separate pieces running at once: the **website** and the **backend server**. Open two terminal windows.

**Terminal 1 — the backend:**
```
cd server
npm install
```
Then create your own `server/.env` file (copy `.env.example` and fill it in):
```
PORT=3001
ADMIN_USERNAME=owner
ADMIN_PASSWORD=choose-your-own-password
```
Then start it:
```
npm run dev
```
You should see `Server running at http://localhost:3001`.

**Terminal 2 — the website**, from the project's root folder (not `server/`):
```
npx serve -l 5500 .
```
The first run will ask permission to install a small tool called `serve` — type `y`.

**Now open:**
- **The website:** http://localhost:5500
- **The admin dashboard:** http://localhost:3001/admin (log in with the username/password from your `.env`)

## Using the admin dashboard

Four tabs:
- **Our cuts, Café menu, Opening hours** — plain form fields and a **Save** button each. Add or remove steaks and menu items freely; the seven days of the week are fixed (only their hours are editable). Saved changes are written to `server/data/content.json` and picked up by the website the next time it loads.
- **Reservations** — every booking request sent through the website, upcoming ones first (soonest first), with past bookings shown separately and greyed out. This tab is view-and-delete only — there's nothing to edit or save, since a booking is either there or it isn't.

## How to change things

- **Default/fallback content** (used only if the server is offline): `js/data.js`
- **Live content:** edit through `/admin` instead — that's the whole point of the dashboard
- **Photos:** replace files in `images/` (same names). Sizes are listed in `images/README.md`
- **Colours and fonts:** the variables at the top of `css/base.css`
- **Address, phone, email:** search for `42 Foundry Lane` and `555` in `index.html`
- **Map:** follow the comment above the `<iframe>` in `index.html`

## Frontend approach

- **Mobile-first responsive design.** Base styles target phones; `min-width` media queries add layout for tablets (48rem), laptops (60rem) and desktops (64rem).
- **Reusable components.** `CutRow`, `MenuGroup`, `HoursRow` and `GalleryItem` each render one piece from one data object — the same function runs once per item.
- **Themes.** Each section has one theme class (`theme-night`, `theme-paper`...) that sets its colours; buttons, lines and text adapt automatically.
- **Live details.** The hero says whether the café or steakhouse is open right now, and today's row is highlighted in the hours table — both calculated from the same data driving the table itself.
- **Progressive enhancement.** `loadLiveContent()` in `js/main.js` tries to fetch live data from the backend (with a 3-second timeout), and silently falls back to the defaults in `js/data.js` if that fails. The page always renders either way.

## Backend approach

Two small JSON APIs, both in `server/server.js`:

- **`POST /api/reservations`** — public. Validates every field again on the server (never trusting the browser alone), checks a hidden honeypot field to quietly discard bot submissions, rate-limits to 5 requests per 15 minutes per visitor, and appends good bookings to `data/reservations.json`.
- **`GET /api/reservations`** — protected by login. Returns every saved booking, upcoming first (soonest first), each tagged with whether its date has already passed.
- **`DELETE /api/reservations/:id`** — protected by login. Removes one booking, e.g. once it's been dealt with.
- **`GET /api/content`** — public. Returns the live cuts/menu/hours as JSON. This is what the website fetches on every page load.
- **`PUT /api/content/cuts`, `/cafe-menu`, `/hours`** — protected by login. Validates the shape and values of whatever's submitted, then overwrites that section of `data/content.json`.
- **`GET /admin`** — protected by login. Serves the dashboard's static files.

**How the frontend and backend talk to each other:** plain `fetch()` calls returning JSON, no framework or library involved on either side. CORS is left open (`app.use(cors())`) so the website (on one local address) can call the API (on another) during development; a real deployment would restrict this to the site's actual domain (there's a commented example for this in `server.js`).

## Validation, performance and security

**Validation** — every form field is checked in the browser first (for instant feedback) and then checked again from scratch on the server (because anyone can bypass a browser). This applies to both the reservation form and the admin dashboard's saves.

**Security**
- Passwords and other secrets live only in `server/.env`, which is git-ignored and never committed
- All user-generated and CMS text is HTML-escaped before being inserted into the page (`escapeHTML()` in `js/components.js`), which prevents XSS
- The admin dashboard and its save endpoints require login (HTTP Basic Auth); the reservation and content-reading endpoints don't, since a restaurant's menu and hours are public information anyway
- A honeypot field and rate limiting protect the reservation form from spam and abuse
- External links use `rel="noopener noreferrer"`
- Server errors are logged for the developer but never shown to visitors in detail (no stack traces leaked)

**Performance**
- No frameworks or build step — the page ships only a few KB of CSS and JavaScript
- Images have `width`/`height` set (no layout shift while loading), use `loading="lazy"` below the fold, and the hero image is marked `fetchpriority="high"`
- Live content fetches have a 3-second timeout so a slow/offline server never leaves a visitor staring at a blank page

**Accessibility** — skip link, semantic landmarks, a keyboard-friendly menu/cuts list/photo viewer, visible focus rings, `prefers-reduced-motion` respected, sufficient colour contrast.

## Known limitations (honest notes, not hidden)

- **Storage is JSON files, not a database.** Fine at this scale (one restaurant, low traffic); a busier site would move to a real database like PostgreSQL or SQLite without changing how the rest of the app talks to it.
- **Admin login is single-user Basic Auth**, stored as one username/password in `.env`. It's not built for multiple staff accounts or permission levels — a real multi-user system would need proper sessions/tokens and a users table.
- **No image upload in the dashboard.** New steak/menu photos still need to be dropped into the `images/` folder by hand; the dashboard only edits the text path pointing to them.
- **CORS is wide open** for local development convenience. Before a real deployment, `server.js` should restrict it to the site's actual domain (see the commented example in the file).

## If I had more time, I'd add

- A real database instead of JSON files
- Image upload directly from the admin dashboard
- Proper multi-user login for the dashboard
- Automated tests (this project was instead tested manually and thoroughly by hand at every step — headless-browser checks, full API test batteries, and deliberate "break it on purpose" cases like bad input, wrong passwords, and the server being offline)
- Deploying it live (Vercel/Render for the backend, any static host for the frontend)
