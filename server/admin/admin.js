/* ==========================================================================
   admin.js  -  makes the content dashboard work.

   The pattern for each of the 3 sections (cuts, café menu, hours) is the
   same shape every time:
     1. Fetch the current content and build one HTML "card" per item
     2. Let you add, remove, or edit cards freely in the page
     3. On Save, read whatever is currently in the fields, and PUT it
   Nothing is saved automatically - only when you press a Save button.
   ========================================================================== */

// Same idea as escapeHTML() in the main site's js/components.js: never let
// someone's text (a name, a description...) accidentally break the HTML of
// the page it's being placed into.
function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let content = { cuts: [], cafeMenu: [], openingHours: [] };
let reservations = [];

// "2026-09-23" -> "Wed, Sep 23"
function formatReservationDate(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// The ISO timestamp saved the moment a booking arrived -> "Sep 22, 2026, 9:58 PM"
function formatReceivedAt(isoText) {
  const date = new Date(isoText);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Without this, clicking into a short field (like a price) and typing a new
// number INSERTS it next to the old one instead of replacing it - e.g. "128"
// becomes "128135" instead of "135". Selecting the whole value on focus means
// typing immediately replaces it, the way most people expect a form to work.
// This deliberately skips <textarea> fields (the longer description boxes),
// where people usually want to click into a precise spot and edit around it.
document.addEventListener('focus', (event) => {
  if (event.target.tagName === 'INPUT') {
    event.target.select();
  }
}, true);   // "true" = capture phase, needed because focus events don't bubble


/* ==========================================================================
   TABS
   ========================================================================== */
document.querySelectorAll('.tab-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));

    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
  });
});


/* ==========================================================================
   SAVING - shared by all three sections
   ========================================================================== */
async function saveSection(url, payload, statusEl, button) {
  button.disabled = true;
  statusEl.className = 'save-status';
  statusEl.textContent = 'Saving...';

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Could not save. Please try again.');
    }

    statusEl.textContent = data.message || 'Saved.';
    statusEl.classList.add('is-success');
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('is-error');
  } finally {
    button.disabled = false;
  }
}


/* ==========================================================================
   1. OUR CUTS
   ========================================================================== */
function cutCardHTML(cut, index) {
  return `
    <div class="edit-card" data-index="${index}">
      <div class="edit-card-head">
        <h3>${escapeHTML(cut.name) || `Cut ${index + 1}`}</h3>
        <button type="button" class="remove-btn" data-action="remove-cut">Remove</button>
      </div>
      <label>Name
        <input type="text" class="f-name" value="${escapeHTML(cut.name)}">
      </label>
      <label>Weight
        <input type="text" class="f-weight" value="${escapeHTML(cut.weight)}" placeholder="e.g. 14 oz">
      </label>
      <label>Price (USD)
        <input type="number" step="0.01" min="0" class="f-price" value="${Number(cut.price) || 0}">
      </label>
      <label>Description
        <textarea class="f-description" rows="2">${escapeHTML(cut.description)}</textarea>
      </label>
      <label>Image path
        <input type="text" class="f-image" value="${escapeHTML(cut.image)}" placeholder="images/cuts/example.webp">
      </label>
      <label>Image alt text (for screen readers)
        <input type="text" class="f-imageAlt" value="${escapeHTML(cut.imageAlt)}">
      </label>
    </div>`;
}

function renderCuts() {
  document.getElementById('cuts-list').innerHTML = content.cuts.map(cutCardHTML).join('');
}

function readCutsFromForm() {
  return [...document.querySelectorAll('#cuts-list .edit-card')].map((card) => ({
    name: card.querySelector('.f-name').value.trim(),
    weight: card.querySelector('.f-weight').value.trim(),
    price: Number(card.querySelector('.f-price').value),
    description: card.querySelector('.f-description').value.trim(),
    image: card.querySelector('.f-image').value.trim(),
    imageAlt: card.querySelector('.f-imageAlt').value.trim(),
  }));
}

document.getElementById('add-cut').addEventListener('click', () => {
  content.cuts = readCutsFromForm();   // keep whatever's already been typed
  content.cuts.push({ name: '', weight: '', price: 0, description: '', image: '', imageAlt: '' });
  renderCuts();
});

document.getElementById('cuts-list').addEventListener('click', (event) => {
  if (event.target.dataset.action !== 'remove-cut') return;
  content.cuts = readCutsFromForm();
  const indexToRemove = Number(event.target.closest('.edit-card').dataset.index);
  content.cuts.splice(indexToRemove, 1);
  renderCuts();
});

document.getElementById('save-cuts').addEventListener('click', (event) => {
  saveSection('/api/content/cuts', readCutsFromForm(), document.getElementById('cuts-status'), event.target);
});


/* ==========================================================================
   2. CAFÉ MENU (groups, each with a list of items)
   ========================================================================== */
function itemRowHTML(item) {
  return `
    <div class="item-row">
      <input type="text" class="f-item-name" value="${escapeHTML(item.name)}" placeholder="Name">
      <input type="number" step="0.01" min="0" class="f-item-price" value="${Number(item.price) || 0}" placeholder="Price">
      <input type="text" class="f-item-description" value="${escapeHTML(item.description)}" placeholder="Description">
      <button type="button" class="remove-btn small" data-action="remove-item" aria-label="Remove this item">&times;</button>
    </div>`;
}

function groupCardHTML(group, groupIndex) {
  const items = (group.items || []).map(itemRowHTML).join('');
  return `
    <div class="edit-card group-card" data-group-index="${groupIndex}">
      <div class="edit-card-head">
        <input type="text" class="f-group-title" value="${escapeHTML(group.title)}" placeholder="Group title, e.g. Coffee">
        <button type="button" class="remove-btn" data-action="remove-group">Remove group</button>
      </div>
      <div class="items-list">${items}</div>
      <button type="button" class="add-item-btn" data-action="add-item">+ Add item</button>
    </div>`;
}

function renderCafeMenu() {
  document.getElementById('cafe-groups').innerHTML = content.cafeMenu.map(groupCardHTML).join('');
}

function readCafeMenuFromForm() {
  return [...document.querySelectorAll('#cafe-groups .group-card')].map((groupEl) => ({
    title: groupEl.querySelector('.f-group-title').value.trim(),
    items: [...groupEl.querySelectorAll('.item-row')].map((itemEl) => ({
      name: itemEl.querySelector('.f-item-name').value.trim(),
      price: Number(itemEl.querySelector('.f-item-price').value),
      description: itemEl.querySelector('.f-item-description').value.trim(),
    })),
  }));
}

document.getElementById('add-group').addEventListener('click', () => {
  content.cafeMenu = readCafeMenuFromForm();
  content.cafeMenu.push({ title: '', items: [{ name: '', price: 0, description: '' }] });
  renderCafeMenu();
});

// One listener handles clicks anywhere in the café menu area - for "add item",
// "remove item" and "remove group" - by checking which button was actually clicked.
document.getElementById('cafe-groups').addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  if (!action) return;

  content.cafeMenu = readCafeMenuFromForm();   // keep whatever's already been typed

  if (action === 'remove-group') {
    const groupIndex = Number(event.target.closest('.group-card').dataset.groupIndex);
    content.cafeMenu.splice(groupIndex, 1);
  } else if (action === 'add-item') {
    const groupIndex = Number(event.target.closest('.group-card').dataset.groupIndex);
    content.cafeMenu[groupIndex].items.push({ name: '', price: 0, description: '' });
  } else if (action === 'remove-item') {
    const groupEl = event.target.closest('.group-card');
    const groupIndex = Number(groupEl.dataset.groupIndex);
    const itemIndex = [...groupEl.querySelectorAll('.item-row')].indexOf(event.target.closest('.item-row'));
    content.cafeMenu[groupIndex].items.splice(itemIndex, 1);
  }

  renderCafeMenu();
});

document.getElementById('save-cafe').addEventListener('click', (event) => {
  saveSection('/api/content/cafe-menu', readCafeMenuFromForm(), document.getElementById('cafe-status'), event.target);
});


/* ==========================================================================
   3. OPENING HOURS (always exactly 7 fixed days - no add or remove)
   ========================================================================== */
function hoursRowHTML(row) {
  return `
    <div class="hours-row">
      <span class="hours-day">${escapeHTML(row.day)}</span>
      <input type="text" class="f-hours-cafe" value="${escapeHTML(row.cafe)}" aria-label="Café hours on ${escapeHTML(row.day)}" placeholder="e.g. 07:30–15:00">
      <input type="text" class="f-hours-dinner" value="${escapeHTML(row.dinner)}" aria-label="Steakhouse hours on ${escapeHTML(row.day)}" placeholder="e.g. 17:30–22:30">
    </div>`;
}

function renderHours() {
  document.getElementById('hours-list').innerHTML = content.openingHours.map(hoursRowHTML).join('');
}

function readHoursFromForm() {
  return [...document.querySelectorAll('#hours-list .hours-row')].map((row, index) => ({
    day: content.openingHours[index].day,   // the day name itself is never editable
    cafe: row.querySelector('.f-hours-cafe').value.trim(),
    dinner: row.querySelector('.f-hours-dinner').value.trim(),
  }));
}

document.getElementById('save-hours').addEventListener('click', (event) => {
  saveSection('/api/content/hours', readHoursFromForm(), document.getElementById('hours-status'), event.target);
});


/* ==========================================================================
   4. RESERVATIONS (view + delete only - there's nothing here to "save",
   so this section has no Save button and no editable fields)
   ========================================================================== */
function reservationCardHTML(reservation) {
  const pastClass = reservation.isPast ? ' is-past' : '';
  const pastBadge = reservation.isPast ? '<span class="past-badge">Past</span>' : '';
  const guestWord = reservation.guests === 1 ? 'guest' : 'guests';
  const contact = [reservation.email, reservation.phone].filter(Boolean).join(' · ');

  return `
    <div class="reservation-card${pastClass}" data-id="${escapeHTML(reservation.id)}">
      <div class="reservation-head">
        <h3 class="reservation-name">${escapeHTML(reservation.name)}</h3>
        ${pastBadge}
        <button type="button" class="remove-btn" data-action="delete-reservation">Delete</button>
      </div>
      <p class="reservation-meta">${formatReservationDate(reservation.date)} · ${escapeHTML(reservation.time)} · ${reservation.guests} ${guestWord}</p>
      ${contact ? `<p class="reservation-contact">${escapeHTML(contact)}</p>` : ''}
      ${reservation.notes ? `<p class="reservation-notes">"${escapeHTML(reservation.notes)}"</p>` : ''}
      <p class="reservation-received">Requested ${formatReceivedAt(reservation.receivedAt)}</p>
    </div>`;
}

function renderReservations() {
  const summaryEl = document.getElementById('reservations-summary');
  const listEl = document.getElementById('reservations-list');

  if (reservations.length === 0) {
    summaryEl.textContent = '';
    listEl.innerHTML = '<p class="empty-state">No reservations yet. They\'ll show up here as soon as someone books a table.</p>';
    return;
  }

  const upcomingCount = reservations.filter((r) => !r.isPast).length;
  const pastCount = reservations.length - upcomingCount;
  summaryEl.textContent = `${upcomingCount} upcoming, ${pastCount} past`;
  listEl.innerHTML = reservations.map(reservationCardHTML).join('');
}

document.getElementById('reservations-list').addEventListener('click', async (event) => {
  if (event.target.dataset.action !== 'delete-reservation') return;

  const card = event.target.closest('.reservation-card');
  const id = card.dataset.id;
  const name = card.querySelector('.reservation-name').textContent;

  // A real, if simple, confirmation step - deleting is permanent and this
  // is customer data, so a stray click shouldn't be able to lose it.
  if (!window.confirm(`Delete the reservation for ${name}? This can't be undone.`)) return;

  event.target.disabled = true;
  try {
    const response = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not delete this reservation.');

    reservations = reservations.filter((r) => r.id !== id);
    renderReservations();
  } catch (error) {
    window.alert(error.message);
    event.target.disabled = false;
  }
});


/* ==========================================================================
   LOAD EVERYTHING ON PAGE OPEN
   ========================================================================== */
async function init() {
  const [contentResponse, reservationsResponse] = await Promise.all([
    fetch('/api/content'),
    fetch('/api/reservations'),
  ]);

  content = await contentResponse.json();
  renderCuts();
  renderCafeMenu();
  renderHours();

  try {
    if (!reservationsResponse.ok) throw new Error('Server responded with ' + reservationsResponse.status);
    reservations = await reservationsResponse.json();
  } catch (error) {
    document.getElementById('reservations-summary').textContent = 'Could not load reservations.';
    console.error(error);
  }
  renderReservations();
}

init();
