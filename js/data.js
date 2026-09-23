/* ==========================================================================
   data.js  -  ALL the website's content lives in this one file.

   Why? Because it separates CONTENT (what the site says) from CODE (how the
   site works). To change a price, a photo or the opening hours you only edit
   this file. You never touch the layout code.

   Later, in the CMS step, we will replace these plain lists with data that is
   fetched from the CMS. The rest of the site will not need to change, because
   it only cares about the SHAPE of the data (the field names below).
   ========================================================================== */


/* --------------------------------------------------------------------------
   CONFIG - small switches and settings used by the JavaScript
   -------------------------------------------------------------------------- */
const CONFIG = {
  // true  = the reservation form only PRETENDS to send.
  // false = the form really sends a POST request to the backend server.
  demoMode: false,

  // The address of the backend endpoint that receives reservation requests.
  // This is a FULL address (not just "/api/reservations") because your
  // website is opened straight from a file on your computer (a "file://"
  // address), so a short address would have nowhere real to point to.
  // When you eventually put the real website online, change this to your
  // real server's address, e.g. 'https://api.your-restaurant.com/api/reservations'.
  reservationEndpoint: 'http://localhost:3001/api/reservations',

  // Where the site fetches the LIVE cuts, café menu and opening hours from
  // (edited at /admin - see js/main.js for what happens if this is offline).
  contentEndpoint: 'http://localhost:3001/api/content',

  currency: '$',

  // Rules used by the reservation form
  maxGuests: 8,          // bigger parties are asked to call
  maxDaysAhead: 90,      // how far ahead people can book
  timeSlots: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
};


/* --------------------------------------------------------------------------
   OUR CUTS, CAFE MENU and OPENING HOURS below are now DEFAULT / FALLBACK
   content, used only if the live server can't be reached.

   The real, editable copy of this same content now lives on the backend
   server, in server/data/content.json - edited through the dashboard at
   http://localhost:3001/admin. Every time the site loads, js/main.js tries
   to fetch the live version and use that instead (see loadLiveContent() in
   js/main.js). If the server is offline, the site quietly uses what's
   written here instead, so the page never breaks.

   They're declared with "let" instead of "const" for exactly that reason:
   js/main.js may replace them with freshly fetched content before drawing
   the page.
   -------------------------------------------------------------------------- */

/* OUR CUTS - one object per steak
   Fields: name, weight, price (a number), description, image path, image alt text */
let CUTS = [
  {
    name: 'The Tomahawk',
    weight: '40 oz, serves two',
    price: 128,
    description:
      'A bone-in ribeye with the long bone left on, carved at your table. Deep, beefy and rich. This is the one to share.',
    image: 'images/cuts/tomahawk.webp',
    imageAlt: 'A bone-in tomahawk steak resting on a wooden board with rosemary and coarse salt',
  },
  {
    name: 'Ribeye',
    weight: '14 oz',
    price: 54,
    description:
      'The most marbled cut we serve. The fat melts into the meat over the charcoal and leaves a dark, savory crust.',
    image: 'images/cuts/ribeye.webp',
    imageAlt: 'A thick ribeye steak with a dark crust and melting butter',
  },
  {
    name: 'Fillet',
    weight: '8 oz',
    price: 52,
    description:
      'Lean, tender and mild. We cut it thick so the middle stays juicy while the outside picks up the smoke.',
    image: 'images/cuts/fillet.webp',
    imageAlt: 'A tall, round fillet steak on a dark plate',
  },
  {
    name: 'Sirloin',
    weight: '12 oz',
    price: 46,
    description:
      'Firm, properly beefy, with a strip of fat along the edge that crisps on the grill. The one our regulars order most.',
    image: 'images/cuts/sirloin.webp',
    imageAlt: 'A sirloin steak with a crisp fat cap on a wooden board',
  },
  {
    name: 'T-Bone',
    weight: '22 oz',
    price: 72,
    description:
      'A strip on one side of the bone and a fillet on the other. Two textures in one cut, for a big appetite.',
    image: 'images/cuts/t-bone.webp',
    imageAlt: 'A T-bone steak showing the strip and the fillet either side of the bone',
  },
];


/* CAFE MENU - groups, and each group has a list of items */
let CAFE_MENU = [
  {
    title: 'Coffee',
    items: [
      { name: 'Espresso',     price: 3.5,  description: 'Double shot, roasted weekly by a small roaster nearby.' },
      { name: 'Flat white',   price: 4.75, description: 'Double ristretto with silky steamed milk.' },
      { name: 'Cold brew',    price: 5,    description: 'Steeped for 18 hours, served over ice.' },
      { name: 'House chocolate', price: 5, description: 'Dark chocolate melted into steamed milk.' },
    ],
  },
  {
    title: 'From the oven',
    items: [
      { name: 'Butter croissant',  price: 4.25, description: 'Laminated over three days. Crisp outside, soft inside.' },
      { name: 'Almond croissant',  price: 5.25, description: 'Twice-baked and filled with almond cream.' },
      { name: 'Cardamom bun',      price: 4.5,  description: 'Swedish-style, sticky and topped with pearl sugar.' },
    ],
  },
  {
    title: 'Brunch',
    items: [
      { name: 'Eggs on sourdough', price: 12, description: 'Soft scrambled eggs, chives and brown butter.' },
      { name: 'Ricotta toast',     price: 10, description: 'Whipped ricotta, honey and toasted hazelnuts.' },
      { name: 'Steak and eggs',    price: 19, description: 'Flat iron steak, two fried eggs and crispy potatoes.' },
    ],
  },
];


/* OPENING HOURS - one object per day, Monday first.
   Write times like "07:30–15:00" (24-hour clock, with an en dash) or "Closed".
   The site reads these to highlight today's row, show the live "open now"
   message, and stop people booking on a day we are closed. */
let OPENING_HOURS = [
  { day: 'Monday',    cafe: '07:30–15:00', dinner: 'Closed' },
  { day: 'Tuesday',   cafe: '07:30–15:00', dinner: '17:30–22:30' },
  { day: 'Wednesday', cafe: '07:30–15:00', dinner: '17:30–22:30' },
  { day: 'Thursday',  cafe: '07:30–15:00', dinner: '17:30–22:30' },
  { day: 'Friday',    cafe: '07:30–15:00', dinner: '17:30–23:30' },
  { day: 'Saturday',  cafe: '08:30–16:00', dinner: '17:00–23:30' },
  { day: 'Sunday',    cafe: '08:30–16:00', dinner: '17:00–21:30' },
];


/* --------------------------------------------------------------------------
   GALLERY - one object per photo.
   width and height are the real pixel size of the image file. The browser uses
   them to reserve the right amount of space BEFORE the image loads, so the
   page does not jump around while loading.
   -------------------------------------------------------------------------- */
/* TIP: the gallery fills its columns from top to bottom. The order below is
   chosen so the columns end at about the same height (portrait, landscape and
   square photos are mixed on purpose). If you change the shape of a photo and
   one column ends up shorter, just move the entry to a different position. */
const GALLERY = [
  { src: 'images/gallery/gallery-01.webp', width: 1200, height: 1500, alt: 'The dining room at night, with candles on every table' },
  { src: 'images/gallery/gallery-02.webp', width: 1600, height: 1067, alt: 'Sliced ribeye, medium-rare, on a wooden board' },
  { src: 'images/gallery/gallery-05.webp', width: 1600, height: 1067, alt: 'The front of the restaurant at dusk with glowing windows' },
  { src: 'images/gallery/gallery-04.webp', width: 1200, height: 1500, alt: 'The chef finishing a steak in the open kitchen' },
  { src: 'images/gallery/gallery-07.webp', width: 1200, height: 1500, alt: 'Morning light on the café counter, with croissants in the glass case' },
  { src: 'images/gallery/gallery-03.webp', width: 1200, height: 1200, alt: 'An Old Fashioned with an orange peel at the bar' },
  { src: 'images/gallery/gallery-06.webp', width: 1200, height: 1200, alt: 'A slice of burnt cheesecake with an espresso' },
  { src: 'images/gallery/gallery-08.webp', width: 1600, height: 1067, alt: 'A table set for dinner with wine glasses and linen napkins' },
];
