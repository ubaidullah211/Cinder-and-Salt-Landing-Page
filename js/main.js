/* ==========================================================================
   main.js  -  makes the page work.

   Order of the file:
     1. Draw the sections that come from data.js
     2. Live "open now" message in the hero
     3. Header: change on scroll + mobile menu
     4. Gallery photo viewer (lightbox)
     5. Reservation form: validation + sending
     6. Start everything

   Scripts are loaded in this order (see the bottom of index.html):
     data.js  ->  components.js  ->  main.js
   so everything defined in the first two is available here.
   ========================================================================== */

// JavaScript counts days as 0 = Sunday ... 6 = Saturday
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


/* ==========================================================================
   1. DRAW THE SECTIONS THAT COME FROM DATA
   For each list we run a component once per item, join the results into one
   long string of HTML, and put it inside the matching container in index.html.
   ========================================================================== */
function renderPage() {
  document.getElementById('cuts-board').innerHTML =
    CUTS.map((cut, index) => CutRow(cut, index)).join('');

  document.getElementById('cafe-menu').innerHTML =
    CAFE_MENU.map((group) => MenuGroup(group)).join('');

  const todayName = DAY_NAMES[new Date().getDay()];
  document.getElementById('hours-body').innerHTML =
    OPENING_HOURS.map((row) => HoursRow(row, row.day === todayName)).join('');

  document.getElementById('gallery-grid').innerHTML =
    GALLERY.map((photo, index) => GalleryItem(photo, index)).join('');
}


/* ==========================================================================
   2. LIVE "OPEN NOW" MESSAGE
   Reads today's row from OPENING_HOURS and works out what to tell the visitor.
   Note: it uses the visitor's own clock. (A real restaurant would use its own
   time zone - a good improvement for later.)
   ========================================================================== */

// "07:30–15:00" becomes { open: 450, close: 900, ... }  (minutes since midnight)
// "Closed" becomes null
function parseHours(text) {
  const match = /^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;

  return {
    open: Number(match[1]) * 60 + Number(match[2]),
    close: Number(match[3]) * 60 + Number(match[4]),
    openLabel: match[1].padStart(2, '0') + ':' + match[2],
    closeLabel: match[3].padStart(2, '0') + ':' + match[4],
  };
}

function getOpeningStatus(now) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const today = OPENING_HOURS.find((row) => row.day === DAY_NAMES[now.getDay()]);
  if (!today) return { message: '', isOpen: false };

  const services = [
    { name: 'The café', hours: parseHours(today.cafe) },
    { name: 'The steakhouse', hours: parseHours(today.dinner) },
  ];

  // 1. Is something open right now?
  for (const service of services) {
    const h = service.hours;
    if (h && minutesNow >= h.open && minutesNow < h.close) {
      return { message: `${service.name} is open until ${h.closeLabel}.`, isOpen: true };
    }
  }

  // 2. Does something open later today?
  for (const service of services) {
    const h = service.hours;
    if (h && minutesNow < h.open) {
      return { message: `${service.name} opens at ${h.openLabel} today.`, isOpen: false };
    }
  }

  // 3. Otherwise we are done for today: say when the café opens tomorrow.
  const tomorrow = OPENING_HOURS.find((row) => row.day === DAY_NAMES[(now.getDay() + 1) % 7]);
  const tomorrowCafe = tomorrow ? parseHours(tomorrow.cafe) : null;
  const message = tomorrowCafe
    ? `We're closed for now. The café opens tomorrow at ${tomorrowCafe.openLabel}.`
    : "We're closed for now.";
  return { message, isOpen: false };
}

function renderHeroStatus() {
  const status = getOpeningStatus(new Date());
  const box = document.getElementById('hero-status');
  document.getElementById('hero-status-text').textContent = status.message;
  box.classList.toggle('is-open', status.isOpen);
}


/* ==========================================================================
   3. HEADER: CHANGE ON SCROLL + MOBILE MENU
   ========================================================================== */
function setupHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');

  // Give the header a solid background once the page has scrolled a little.
  function updateHeaderOnScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
  updateHeaderOnScroll();

  // Open or close the full-screen menu (phones and tablets).
  function setMenuOpen(isOpen) {
    header.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('no-scroll', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    // "inert" makes the page behind the menu unreachable with the keyboard.
    document.querySelectorAll('main, footer').forEach((part) => {
      part.inert = isOpen;
    });
  }

  toggle.addEventListener('click', () => {
    setMenuOpen(!header.classList.contains('is-open'));
  });

  // Close the menu when a link inside it is chosen, or when Escape is pressed.
  document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  // If someone rotates a tablet or widens the window, make sure the menu resets.
  window.matchMedia('(min-width: 64rem)').addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });
}


/* ==========================================================================
   4. GALLERY PHOTO VIEWER (LIGHTBOX)
   Uses the built-in <dialog> element. The browser gives us for free: a dark
   backdrop, keyboard focus kept inside, and closing with the Escape key.
   ========================================================================== */
function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-image');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-counter');
  let currentIndex = 0;

  function showPhoto(index) {
    // The % trick makes the photos loop: after the last comes the first.
    currentIndex = (index + GALLERY.length) % GALLERY.length;
    const photo = GALLERY[currentIndex];
    image.src = photo.src;
    image.alt = photo.alt;
    caption.textContent = photo.alt;
    counter.textContent = `${currentIndex + 1} of ${GALLERY.length}`;
  }

  // One click listener on the whole grid (instead of one per photo).
  document.getElementById('gallery-grid').addEventListener('click', (event) => {
    const button = event.target.closest('.gallery-item');
    if (!button) return;
    showPhoto(Number(button.dataset.index));
    document.body.classList.add('no-scroll');
    lightbox.showModal();
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(currentIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(currentIndex + 1));

  // Clicking the dark area around the photo closes it.
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  // Arrow keys move between photos.
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(currentIndex + 1);
  });

  // Fires however the dialog was closed (button, Escape key, backdrop click).
  lightbox.addEventListener('close', () => document.body.classList.remove('no-scroll'));
}


/* ==========================================================================
   5. RESERVATION FORM
   Flow:  visitor types  ->  we validate in the browser  ->  we send the data
          to the backend  ->  we show a success or error message.

   IMPORTANT: browser validation is only there to be friendly and fast.
   Anyone can bypass it, so in Step 2 the SERVER repeats the same checks.
   ========================================================================== */
const form = document.getElementById('reserve-form');
const statusBox = document.getElementById('form-status');
const submitButton = form.querySelector('button[type="submit"]');
const FIELD_NAMES = ['name', 'email', 'phone', 'date', 'time', 'guests', 'notes'];

// Fill the time and guests drop-downs from CONFIG, so there is one source of truth.
function fillFormOptions() {
  const timeSelect = form.elements['time'];
  CONFIG.timeSlots.forEach((slot) => timeSelect.add(new Option(slot, slot)));

  const guestsSelect = form.elements['guests'];
  for (let count = 1; count <= CONFIG.maxGuests; count++) {
    guestsSelect.add(new Option(count === 1 ? '1 guest' : `${count} guests`, String(count)));
  }
}

// Turn a Date into "2026-09-22" (the format <input type="date"> uses), in local time.
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// The date picker greys out days in the past and days too far ahead.
function setDateLimits() {
  const today = new Date();
  const last = new Date();
  last.setDate(last.getDate() + CONFIG.maxDaysAhead);
  form.elements['date'].min = toISODate(today);
  form.elements['date'].max = toISODate(last);
}

function isClosedForDinner(date) {
  const row = OPENING_HOURS.find((r) => r.day === DAY_NAMES[date.getDay()]);
  return Boolean(row) && row.dinner.trim().toLowerCase() === 'closed';
}

function getFormValues() {
  // FormData reads every field that has a name="" attribute.
  return Object.fromEntries(new FormData(form));
}

/* The rules. Returns an object like { email: 'Please enter a valid email.' }.
   An empty object means "everything is fine". */
function validateReservation(values) {
  const errors = {};

  const name = (values.name || '').trim();
  if (name.length < 2) errors.name = 'Please enter your full name.';
  else if (name.length > 80) errors.name = 'Please keep your name under 80 characters.';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // something@something.something
  if (!emailPattern.test((values.email || '').trim())) {
    errors.email = 'Please enter a valid email address, like name@example.com.';
  }

  const phone = (values.phone || '').trim();
  if (phone !== '' && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
    errors.phone = 'Use 7 to 20 digits. You can include spaces, + and brackets.';
  }

  if (!values.date) {
    errors.date = 'Please choose a date.';
  } else {
    const chosen = new Date(values.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = new Date(today);
    last.setDate(last.getDate() + CONFIG.maxDaysAhead);

    if (Number.isNaN(chosen.getTime())) errors.date = 'Please choose a valid date.';
    else if (chosen < today) errors.date = 'That date has already passed. Please choose another.';
    else if (chosen > last) errors.date = `We take bookings up to ${CONFIG.maxDaysAhead} days ahead.`;
    else if (isClosedForDinner(chosen)) errors.date = "We're closed for dinner that day. Please choose another date.";
  }

  if (!CONFIG.timeSlots.includes(values.time)) errors.time = 'Please choose a time.';

  const guests = Number(values.guests);
  if (!values.guests) {
    errors.guests = 'Please choose the number of guests.';
  } else if (!Number.isInteger(guests) || guests < 1 || guests > CONFIG.maxGuests) {
    errors.guests = `We take 1 to ${CONFIG.maxGuests} guests online. For larger parties, please call us.`;
  }

  if ((values.notes || '').length > 500) errors.notes = 'Please keep this under 500 characters.';

  return errors;
}

/* Show (or clear) the error message under one field. */
function showFieldError(fieldName, message) {
  const input = form.elements[fieldName];
  document.getElementById(`${fieldName}-error`).textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function showAllErrors(errors) {
  FIELD_NAMES.forEach((fieldName) => showFieldError(fieldName, errors[fieldName] || ''));
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = 'form-status' + (type ? ` is-${type}` : '');
  // Make sure the message is on screen (it sits under the button, which can be off-screen on phones).
  if (message) statusBox.scrollIntoView({ block: 'nearest' });
}

// Send the reservation. In demo mode we wait a moment and pretend it worked.
async function sendReservation(values) {
  if (CONFIG.demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.info('[Demo mode] Reservation NOT sent. It would have been:', values);
    return;
  }

  const response = await fetch(CONFIG.reservationEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  // The backend answers with JSON. If it is not valid JSON we fall back to {}.
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'We could not send your request. Please try again or call us.');
  }
}

function prettyDate(isoDate) {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function setupForm() {
  fillFormOptions();
  setDateLimits();

  // Check a field when the visitor leaves it...
  form.addEventListener('focusout', (event) => {
    const fieldName = event.target.name;
    if (!FIELD_NAMES.includes(fieldName)) return;
    showFieldError(fieldName, validateReservation(getFormValues())[fieldName] || '');
  });

  // ...and re-check while they type, but only if it is currently showing an error.
  form.addEventListener('input', (event) => {
    const fieldName = event.target.name;
    if (!FIELD_NAMES.includes(fieldName)) return;
    if (event.target.getAttribute('aria-invalid') !== 'true') return;
    showFieldError(fieldName, validateReservation(getFormValues())[fieldName] || '');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // stop the browser's own page-reloading submit

    const values = getFormValues();
    const errors = validateReservation(values);
    showAllErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      const firstBadField = FIELD_NAMES.find((fieldName) => errors[fieldName]);
      form.elements[firstBadField].focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    setStatus('', '');

    try {
      // SPAM TRAP: the field called "website" is hidden from real people.
      // Only bots fill it in. If it has text, we quietly skip sending.
      const isBot = (values.website || '').trim() !== '';
      if (!isBot) await sendReservation(values);

      const firstName = values.name.trim().split(' ')[0];
      const guestWord = values.guests === '1' ? 'guest' : 'guests';
      let message =
        `Thank you, ${firstName}. We have your request for ${values.guests} ${guestWord} ` +
        `on ${prettyDate(values.date)} at ${values.time}. We'll email you to confirm.`;
      if (CONFIG.demoMode) message += ' (Demo mode: nothing was actually sent.)';

      form.reset();
      showAllErrors({});
      setStatus(message, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send booking request';
    }
  });
}


/* ==========================================================================
   6. LOAD LIVE CONTENT FROM THE CMS (with a safe fallback)

   CUTS, CAFE_MENU and OPENING_HOURS start out as the default content
   written in js/data.js. This function tries to replace them with the
   LIVE content from the server (whatever was last saved at /admin).

   If the server can't be reached - it's offline, or the page is being
   viewed somewhere without a server at all - this quietly gives up and
   keeps using the defaults, so the page always still works.
   ========================================================================== */
async function loadLiveContent() {
  try {
    // AbortController lets us give up automatically after 3 seconds,
    // instead of the visitor waiting forever for a server that isn't there.
    const timeout = AbortSignal.timeout(3000);
    const response = await fetch(CONFIG.contentEndpoint, { signal: timeout });
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();

    // A quick sanity check before trusting the data - if the shape looks
    // wrong for any reason, it's safer to keep the defaults than to show
    // a broken page.
    const looksValid =
      Array.isArray(data.cuts) && data.cuts.length > 0 &&
      Array.isArray(data.cafeMenu) && data.cafeMenu.length > 0 &&
      Array.isArray(data.openingHours) && data.openingHours.length === 7;

    if (!looksValid) throw new Error('Content from the server was not in the expected shape');

    CUTS = data.cuts;
    CAFE_MENU = data.cafeMenu;
    OPENING_HOURS = data.openingHours;
    console.info('Loaded live content from the server.');
  } catch (error) {
    // Not shown to visitors - just a note for you, in case content ever
    // looks unexpectedly out of date and you want to know why.
    console.info('Using default content (could not reach the live server):', error.message);
  }
}


/* ==========================================================================
   7. START EVERYTHING
   ========================================================================== */
async function init() {
  await loadLiveContent();   // wait for this first - it decides what renderPage() will draw
  renderPage();
  renderHeroStatus();
  setupHeader();
  setupLightbox();
  setupForm();
  document.getElementById('year').textContent = new Date().getFullYear();
}

init();
