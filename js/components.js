/* ==========================================================================
   components.js  -  small, reusable "components".

   A component here is just a function:  data in  ->  a piece of HTML out.
   For example CutRow(cut) receives ONE steak and returns the HTML for its row.
   We call it once per steak, so the same code makes every row.

   (This is the same idea React uses. If you learn React later, you will
   recognise it straight away.)
   ========================================================================== */


/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

/* SECURITY: never put raw text into HTML.
   If some text contained  <script>...</script>  and we pasted it in as it is,
   the browser would RUN it (this attack is called XSS). escapeHTML turns the
   dangerous characters into harmless ones, so the browser shows them as text.
   Today the data is written by us, but once a CMS is connected other people
   can type it, so we escape everything from the start. */
function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* 54 -> "$54"      4.5 -> "$4.50" */
function formatPrice(amount) {
  const hasCents = !Number.isInteger(amount);
  return CONFIG.currency + (hasCents ? amount.toFixed(2) : amount);
}


/* --------------------------------------------------------------------------
   CutRow - one steak in the "Our cuts" list.
   It uses the built-in <details> and <summary> HTML elements: the browser
   itself handles opening and closing (no JavaScript needed), and it is
   keyboard accessible out of the box.
   Giving every row the same  name="cuts"  makes them open one at a time.
   -------------------------------------------------------------------------- */
function CutRow(cut, index) {
  const openAttribute = index === 0 ? ' open' : ''; // the first steak starts open

  return `
    <details class="cut" name="cuts"${openAttribute}>
      <summary class="cut-summary">
        <span class="cut-name">${escapeHTML(cut.name)}</span>
        <span class="cut-weight">${escapeHTML(cut.weight)}</span>
        <span class="cut-price">${escapeHTML(formatPrice(cut.price))}</span>
        <span class="cut-toggle" aria-hidden="true"></span>
      </summary>
      <div class="cut-detail">
        <img class="cut-image"
             src="${escapeHTML(cut.image)}"
             alt="${escapeHTML(cut.imageAlt)}"
             width="1200" height="900"
             loading="lazy" decoding="async">
        <p class="cut-description">${escapeHTML(cut.description)}</p>
      </div>
    </details>`;
}


/* --------------------------------------------------------------------------
   MenuGroup and MenuItem - the café menu.
   MenuGroup uses MenuItem inside it: components can be built from components.
   -------------------------------------------------------------------------- */
function MenuItem(item) {
  return `
    <li class="menu-item">
      <div class="menu-item-head">
        <span class="menu-item-name">${escapeHTML(item.name)}</span>
        <span class="menu-item-dots" aria-hidden="true"></span>
        <span class="menu-item-price">${escapeHTML(formatPrice(item.price))}</span>
      </div>
      <p class="menu-item-description">${escapeHTML(item.description)}</p>
    </li>`;
}

function MenuGroup(group) {
  const items = group.items.map((item) => MenuItem(item)).join('');

  return `
    <div class="menu-group">
      <h3 class="menu-group-title">${escapeHTML(group.title)}</h3>
      <ul class="menu-list">${items}</ul>
    </div>`;
}


/* --------------------------------------------------------------------------
   HoursRow - one day in the opening-hours table.
   isToday is true for today's row, so we can highlight it.
   -------------------------------------------------------------------------- */
function HoursCell(text) {
  const isClosed = text.trim().toLowerCase() === 'closed';
  const className = isClosed ? ' class="is-closed"' : '';
  return `<td${className}>${escapeHTML(text)}</td>`;
}

function HoursRow(row, isToday) {
  const rowClass = isToday ? ' class="is-today"' : '';
  const badge = isToday ? '<span class="today-badge">Today</span>' : '';

  return `
    <tr${rowClass}>
      <th scope="row">${escapeHTML(row.day)}${badge}</th>
      ${HoursCell(row.cafe)}
      ${HoursCell(row.dinner)}
    </tr>`;
}


/* --------------------------------------------------------------------------
   GalleryItem - one photo in the gallery. It is a <button> (not a plain image)
   so keyboard users can focus it and press Enter to open the big version.
   -------------------------------------------------------------------------- */
function GalleryItem(photo, index) {
  return `
    <button type="button" class="gallery-item" data-index="${index}"
            aria-label="View larger: ${escapeHTML(photo.alt)}">
      <img src="${escapeHTML(photo.src)}"
           alt=""
           width="${Number(photo.width)}" height="${Number(photo.height)}"
           loading="lazy" decoding="async">
    </button>`;
}
