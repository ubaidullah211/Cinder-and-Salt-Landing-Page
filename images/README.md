# Image guide

The project ships with **placeholder** images so the layout works straight away.
To use your real photos: export each one at the size below, name it EXACTLY as shown, and drop it into the matching folder (overwrite the placeholder). No code changes needed.

**Tips**

- Export as **JPG, quality about 75-80%**. Aim for under **300 KB** each (hero: under 400 KB). Free tools: squoosh.app, TinyPNG.
- The sizes are 2x what is shown on screen, so photos stay sharp on high-resolution phones and laptops.
- Free photo sources: Unsplash, Pexels, Pixabay. Check the licence and, if you can, use photos of the real restaurant.
- Use photos with a similar colour mood (warm, low-light for steak; bright and airy for the cafe), so the page feels like one brand.
- If you change a photo's shape (portrait / landscape / square), update its `width` and `height` in `js/data.js` (gallery, cuts) or in `index.html` (hero, about, cafe).

| File (inside `images/`) | Size (px) | What to photograph | Where it appears |
|---|---|---|---|
| `hero/hero.jpg` | 2400 x 1350 | Moody, low-light close-up of a thick steak searing over glowing charcoal, a few embers flying. Keep the darkest area on the left and bottom (the headline sits there) and the subject towards the centre-right. | Hero (full screen background) |
| `about/chef-at-grill.jpg` | 1000 x 1250 | Portrait-orientation photo of a chef at the charcoal grill, turning a steak with tongs. Warm, natural kitchen light. | About us (large image) |
| `about/aging-cellar.jpg` | 800 x 800 | Square photo of the dry-aging cabinet: whole cuts of beef hanging, salt bricks glowing, cool light. | About us (small overlapping image) |
| `cuts/tomahawk.jpg` | 1200 x 900 | Bone-in tomahawk steak resting on a wooden board, long bone visible, rosemary and coarse salt. | Our cuts - The Tomahawk |
| `cuts/ribeye.jpg` | 1200 x 900 | Thick ribeye with heavy marbling and a dark crust, a knob of butter melting on top. | Our cuts - Ribeye |
| `cuts/fillet.jpg` | 1200 x 900 | Tall, round fillet (tenderloin) steak on a dark plate, seared crust, a little jus. | Our cuts - Fillet |
| `cuts/sirloin.jpg` | 1200 x 900 | Sirloin steak with the fat cap on the edge, on a board or in a cast-iron pan. | Our cuts - Sirloin |
| `cuts/t-bone.jpg` | 1200 x 900 | T-bone steak showing the T-shaped bone: strip on one side, fillet on the other. | Our cuts - T-Bone |
| `cafe/cafe-interior.jpg` | 1000 x 1250 | Portrait photo of a sunny cafe corner in morning light: wooden counter, a barista pouring coffee, ceramic cups. | Cafe (large image) |
| `cafe/coffee-and-pastry.jpg` | 800 x 800 | Top-down photo of a flat white with latte art beside an almond croissant on a marble or wooden table. | Cafe (small overlapping image) |
| `gallery/gallery-01.jpg` | 1200 x 1500 | Portrait: the dining room at night, candles on every table, leather booths. | Gallery (portrait) |
| `gallery/gallery-02.jpg` | 1600 x 1067 | Landscape: sliced ribeye, medium-rare, on a wooden board with flaky salt. | Gallery (landscape) |
| `gallery/gallery-03.jpg` | 1200 x 1200 | Square: an Old Fashioned garnished with orange peel on the bar, dark background. | Gallery (square) |
| `gallery/gallery-04.jpg` | 1200 x 1500 | Portrait: the chef finishing a steak at the pass in the open kitchen. | Gallery (portrait) |
| `gallery/gallery-05.jpg` | 1600 x 1067 | Landscape: the front of the restaurant at dusk, windows glowing, sign visible. | Gallery (landscape) |
| `gallery/gallery-06.jpg` | 1200 x 1200 | Square: a slice of burnt cheesecake with an espresso on the side. | Gallery (square) |
| `gallery/gallery-07.jpg` | 1200 x 1500 | Portrait: morning light on the cafe counter, croissants in the glass case. | Gallery (portrait) |
| `gallery/gallery-08.jpg` | 1600 x 1067 | Landscape: a table set for dinner - wine glasses, linen napkins, cutlery. | Gallery (landscape) |
| `social/og-image.jpg` | 1200 x 630 | The picture shown when your link is shared on WhatsApp, Facebook or LinkedIn. A dark crop of the hero photo, with the restaurant name if you like. | Social media link preview |
