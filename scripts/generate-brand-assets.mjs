import sharp from 'sharp';

// Derive every app asset from the supplied raster artwork, never redraw it.
const { data, info } = await sharp('public/logo.png').removeAlpha().raw().toBuffer({ resolveWithObject: true });
const pixels = Buffer.alloc(info.width * info.height * 4);
for (let index = 0; index < info.width * info.height; index++) {
  const offset = index * info.channels;
  // Separate white ink from the textured navy background, keeping soft edges.
  const brightness = Math.min(data[offset], data[offset + 1], data[offset + 2]);
  const alpha = Math.round(Math.max(0, Math.min(1, (brightness - 90) / 150)) * 255);
  pixels[index * 4] = pixels[index * 4 + 1] = pixels[index * 4 + 2] = 255;
  pixels[index * 4 + 3] = alpha;
}
const transparent = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
const logo = await sharp(transparent).trim({ background: '#00000000', threshold: 10 }).png().toBuffer();
await sharp(logo).resize({ width: 256 }).png().toFile('public/brand/logo.png');
// The cat-only crop keeps the original expression recognizable at small sizes.
const catCrop = await sharp(transparent).extract({ left: 0, top: 0, width: info.width, height: Math.round(info.height * .65) }).png().toBuffer();
const cat = await sharp(catCrop).trim({ background: '#00000000', threshold: 10 }).png().toBuffer();
await sharp(cat).resize({ width: 256 }).png().toFile('public/brand/mark.png');
async function icon(size, fraction, rounded, filename) {
  const artwork = await sharp(cat).resize({ width: Math.round(size * fraction), height: Math.round(size * fraction), fit: 'inside' }).toBuffer();
  const composed = await sharp({ create: { width: size, height: size, channels: 4, background: '#202a42' } }).composite([{ input: artwork, gravity: 'centre' }]).raw().toBuffer();
  if (rounded) {
    const radius = size * .21;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = Math.max(radius - x - .5, x + .5 - (size - radius), 0);
      const dy = Math.max(radius - y - .5, y + .5 - (size - radius), 0);
      composed[(y * size + x) * 4 + 3] = Math.round(255 * Math.max(0, Math.min(1, radius - Math.hypot(dx, dy) + .5)));
    }
  }
  await sharp(composed, { raw: { width: size, height: size, channels: 4 } }).png().toFile(filename);
}
for (const size of [192, 512]) await icon(size, .82, true, `public/icons/pwa-${size}.png`);
await icon(512, .64, false, 'public/icons/pwa-maskable-512.png');
await icon(180, .72, false, 'public/icons/apple-touch-icon.png');
await icon(32, .88, true, 'public/icons/favicon-32.png');
await icon(64, .88, true, 'public/icons/favicon-64.png');
