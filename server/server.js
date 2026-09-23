/* ==========================================================================
   server.js  -  the backend "brain" behind the website.

   Two jobs live in this one file:

   A) THE RESERVATION FORM
      Listens for POST /api/reservations, checks the data is real and
      sensible (never trusts the browser alone), and saves good requests
      to data/reservations.json.

   B) THE CONTENT DASHBOARD (a small CMS)
      A protected page at /admin where you can edit the steaks, café menu
      and opening hours. Saved changes go to data/content.json. The main
      website reads that same file through GET /api/content every time
      someone visits, so edits show up immediately with no coding.

   Run it with:   npm run dev     (restarts itself every time you save)
   Stop it with:  Ctrl + C in the terminal
   ========================================================================== */

const path = require('path');

// { path: ... } points dotenv straight at the .env file that lives NEXT TO
// this script. Without it, dotenv looks for .env in whatever folder the
// "node" command happened to be run FROM - which usually works, but breaks
// silently and confusingly if this server is ever started from a different
// folder (no error, it just quietly finds nothing and admin login stops
// working with no clue why).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;


/* ==========================================================================
   1. BASIC SAFETY MIDDLEWARE
   "Middleware" just means: code that runs on every request, before it
   reaches our actual route below.
   ========================================================================== */

// Browsers block a webpage from talking to a DIFFERENT address (a different
// "origin") unless that address says it's okay. cors() says "it's okay".
// While building locally this is left open. Before you put the real site
// online, change this to only allow your real website's address - see the
// commented example below.
app.use(cors());
// app.use(cors({ origin: 'https://your-real-website.com' }));

// Lets us read JSON data sent in a request's body as req.body.name, etc.
app.use(express.json());

// Stops one visitor (or a bot) from submitting the form over and over.
// windowMs: how long one "window" of time lasts. max: how many requests
// are allowed from the same visitor inside that window.
const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,                     // 5 tries per 15 minutes is plenty for a real guest
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in a little while, or call us.' },
});

/* Checks a username and password before letting someone see or change the
   admin dashboard. This is called "Basic Auth" - the browser itself shows a
   little login popup and remembers your answer for the rest of the visit.
   It is simple and fine for one owner on their own computer. It is NOT
   meant for a big team with many separate logins - a real login system
   would be the next upgrade for that. */
function requireAdminLogin(req, res, next) {
  const header = req.headers.authorization || '';           // looks like "Basic c29tZXRoaW5n..."
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8'); // turns it back into "username:password"
    const separatorIndex = decoded.indexOf(':');
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      return next();   // correct - let the request through
    }
  }

  // Wrong or missing credentials: ask the browser to show its login popup.
  res.set('WWW-Authenticate', 'Basic realm="Cinder & Salt admin"');
  res.status(401).json({ message: 'Please log in to continue.' });
}


/* ==========================================================================
   2. THE SAME RULES AS THE FRONTEND FORM

   Your reservation form (js/main.js) already checks these things in the
   browser, so people get instant feedback. But ANYONE can skip the browser
   entirely and send data straight to this address with their own tool.
   So the server checks EVERYTHING again, from scratch, trusting nothing.

   NOTE: these numbers are duplicated from js/data.js on purpose, to keep
   this file simple for now. Once we connect a CMS in the next step, both
   the frontend and backend will read the same shared settings instead.
   ========================================================================== */

const MAX_GUESTS = 8;
const MAX_DAYS_AHEAD = 90;
const TIME_SLOTS = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const CLOSED_DINNER_DAYS = ['Monday'];   // must match OPENING_HOURS in js/data.js
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* Checks one reservation. Returns an object like { email: 'message' }.
   An empty object means everything is fine - same pattern as the frontend. */
function validateReservation(body) {
  const errors = {};

  const name = String(body.name || '').trim();
  if (name.length < 2) errors.name = 'Please enter your full name.';
  else if (name.length > 80) errors.name = 'Please keep your name under 80 characters.';

  const email = String(body.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const phone = String(body.phone || '').trim();
  if (phone !== '' && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  const dateText = String(body.date || '');
  const chosenDate = new Date(dateText + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latestAllowed = new Date(today);
  latestAllowed.setDate(latestAllowed.getDate() + MAX_DAYS_AHEAD);

  if (!dateText || Number.isNaN(chosenDate.getTime())) {
    errors.date = 'Please choose a valid date.';
  } else if (chosenDate < today) {
    errors.date = 'That date has already passed.';
  } else if (chosenDate > latestAllowed) {
    errors.date = `We take bookings up to ${MAX_DAYS_AHEAD} days ahead.`;
  } else if (CLOSED_DINNER_DAYS.includes(DAY_NAMES[chosenDate.getDay()])) {
    errors.date = "We're closed for dinner that day.";
  }

  if (!TIME_SLOTS.includes(body.time)) {
    errors.time = 'Please choose a valid time.';
  }

  const guests = Number(body.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    errors.guests = `Please choose 1 to ${MAX_GUESTS} guests. For larger parties, call us.`;
  }

  const notes = String(body.notes || '');
  if (notes.length > 500) {
    errors.notes = 'Please keep notes under 500 characters.';
  }

  return errors;
}


/* ==========================================================================
   3. SAVING RESERVATIONS TO A FILE

   For a small project like this, a plain JSON file is a simple, honest way
   to store data - you can open data/reservations.json yourself and read it.
   A busier restaurant would swap this for a real database later without
   changing anything else in this file (the route below wouldn't need to know).
   ========================================================================== */

const DATA_FILE = path.join(__dirname, 'data', 'reservations.json');

function readReservations() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    return [];   // the file doesn't exist yet, or is empty - start fresh
  }
}

function saveReservation(entry) {
  const all = readReservations();
  all.push(entry);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });   // creates data/ if missing
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
}


/* ==========================================================================
   4. THE RESERVATION ROUTES
   Submitting a new one (from the website), viewing them all, and deleting
   one (both only from the admin dashboard, both login-protected - these
   are people's names, emails and phone numbers, not public information).
   ========================================================================== */

app.post('/api/reservations', reservationLimiter, (req, res) => {
  const body = req.body || {};

  // SPAM TRAP: a field called "website" is invisible to real visitors (see
  // the CSS for .hp-field), so only an automated bot fills it in. If it has
  // anything in it, we quietly pretend to succeed but don't actually save it -
  // that way the bot doesn't learn to try again differently.
  if (String(body.website || '').trim() !== '') {
    return res.status(200).json({ message: 'Thank you.' });
  }

  const errors = validateReservation(body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Please check the highlighted fields.', errors });
  }

  const reservation = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    phone: String(body.phone || '').trim(),
    date: body.date,
    time: body.time,
    guests: Number(body.guests),
    notes: String(body.notes || '').trim(),
  };

  try {
    saveReservation(reservation);
  } catch (error) {
    console.error('Could not save reservation:', error);
    return res.status(500).json({ message: 'Something went wrong on our end. Please call us instead.' });
  }

  console.log(`New reservation: ${reservation.name} - ${reservation.date} ${reservation.time} - ${reservation.guests} guests`);
  res.status(201).json({ message: 'Reservation received.' });
});

// PROTECTED: lists every saved reservation for the admin dashboard, soonest
// booking first, each one tagged with whether its date has already passed.
app.get('/api/reservations', requireAdminLogin, (req, res) => {
  try {
    const all = readReservations();
    const todayText = new Date().toISOString().slice(0, 10);   // "YYYY-MM-DD", same format dates are stored in

    const withStatus = all.map((reservation) => ({
      ...reservation,
      isPast: reservation.date < todayText,
    }));

    // Upcoming bookings always come first (soonest first) - that's what
    // actually needs attention. Past ones follow, most recently passed
    // first, since those are the ones worth clearing out soonest.
    withStatus.sort((a, b) => {
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
      const order = (a.date + a.time).localeCompare(b.date + b.time);
      return a.isPast ? -order : order;
    });

    res.json(withStatus);
  } catch (error) {
    console.error('Could not read reservations:', error);
    res.status(500).json({ message: 'Could not load reservations.' });
  }
});

// PROTECTED: removes one reservation, e.g. once it's been dealt with.
app.delete('/api/reservations/:id', requireAdminLogin, (req, res) => {
  const all = readReservations();
  const index = all.findIndex((reservation) => reservation.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'That reservation could not be found - maybe it was already deleted.' });
  }

  const [removed] = all.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2));
  console.log(`Reservation deleted via the admin dashboard: ${removed.name} - ${removed.date} ${removed.time}`);
  res.json({ message: 'Reservation deleted.' });
});

// A simple route you can visit right in your browser to check the server is alive.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});


/* ==========================================================================
   5. THE CONTENT DASHBOARD (a small CMS)

   This lets you edit the steaks, café menu and opening hours from a web
   page instead of editing code. The main website then asks this server
   for that same content every time someone visits.

   Same file-based pattern as reservations: one JSON file, read and
   rewritten as a whole each time something is saved.
   ========================================================================== */

const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function writeContent(content) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
}

/* --- Validation: the same idea as validateReservation() above - never trust
   what arrives, even from your own admin page, in case a field gets left
   blank or a price gets typed in as text by mistake. --- */

function validateCuts(cuts) {
  if (!Array.isArray(cuts) || cuts.length === 0) return 'Please keep at least one cut.';
  for (const cut of cuts) {
    if (!String(cut.name || '').trim()) return 'Every cut needs a name.';
    if (!String(cut.weight || '').trim()) return 'Every cut needs a weight.';
    if (typeof cut.price !== 'number' || !(cut.price > 0)) return `"${cut.name}" needs a price greater than 0.`;
    if (!String(cut.description || '').trim()) return `"${cut.name}" needs a description.`;
    if (!String(cut.image || '').trim()) return `"${cut.name}" needs an image path.`;
  }
  return null;   // null means "no problems found"
}

function validateCafeMenu(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return 'Please keep at least one menu group.';
  for (const group of groups) {
    if (!String(group.title || '').trim()) return 'Every group needs a title.';
    if (!Array.isArray(group.items) || group.items.length === 0) return `"${group.title}" needs at least one item.`;
    for (const item of group.items) {
      if (!String(item.name || '').trim()) return `An item in "${group.title}" is missing a name.`;
      if (typeof item.price !== 'number' || !(item.price > 0)) return `"${item.name}" needs a price greater than 0.`;
    }
  }
  return null;
}

function validateOpeningHours(days) {
  const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (!Array.isArray(days) || days.length !== 7) return 'There must be exactly 7 days.';
  for (let i = 0; i < 7; i++) {
    if (!days[i] || days[i].day !== expectedDays[i]) return `Row ${i + 1} should be ${expectedDays[i]}.`;
    if (!String(days[i].cafe || '').trim()) return `${expectedDays[i]}: café hours can't be empty (use "Closed" if closed).`;
    if (!String(days[i].dinner || '').trim()) return `${expectedDays[i]}: dinner hours can't be empty (use "Closed" if closed).`;
  }
  return null;
}

// PUBLIC route: the main website calls this to get the live content.
// No login needed here - anyone visiting the restaurant's website needs
// to be able to read the menu.
app.get('/api/content', (req, res) => {
  try {
    res.json(readContent());
  } catch (error) {
    console.error('Could not read content:', error);
    res.status(500).json({ message: 'Could not load content.' });
  }
});

// PROTECTED routes: only someone logged in can change the content.
// requireAdminLogin runs first - if it doesn't call next(), these never run.
app.put('/api/content/cuts', requireAdminLogin, (req, res) => {
  const problem = validateCuts(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const content = readContent();
  content.cuts = req.body;
  writeContent(content);
  console.log('Cuts updated via the admin dashboard');
  res.json({ message: 'Cuts saved.' });
});

app.put('/api/content/cafe-menu', requireAdminLogin, (req, res) => {
  const problem = validateCafeMenu(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const content = readContent();
  content.cafeMenu = req.body;
  writeContent(content);
  console.log('Café menu updated via the admin dashboard');
  res.json({ message: 'Café menu saved.' });
});

app.put('/api/content/hours', requireAdminLogin, (req, res) => {
  const problem = validateOpeningHours(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const content = readContent();
  content.openingHours = req.body;
  writeContent(content);
  console.log('Opening hours updated via the admin dashboard');
  res.json({ message: 'Opening hours saved.' });
});

// The admin dashboard page itself - also protected. A visitor who doesn't
// know the password can't even LOAD the page, let alone use it.
app.use('/admin', requireAdminLogin, express.static(path.join(__dirname, 'admin')));


/* ==========================================================================
   6. CATCH ANY SURPRISES

   If something unexpected breaks, this stops the real technical error
   (which could contain sensitive details) from ever reaching a visitor.
   It always sits LAST, after every route.
   ========================================================================== */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Try it: http://localhost:${PORT}/api/health`);
});
