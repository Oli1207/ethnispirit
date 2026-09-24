/**
 * Versions allégées des images statiques chargées sur toutes les pages
 * (logos de navbar affichés à ~60 px).
 * Usage : node scripts/optimize-static-assets.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = (f) => path.join(ROOT, 'src/assets', f);
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// Navbar Mode : logo à fond blanc (le fond est fondu par mix-blend-mode dans le CSS)
await sharp(A('logo_ethnispirit_mode.jpeg')).linear(1.03, 2)
  .resize(240, 240, { fit: 'contain', background: WHITE })
  .webp({ quality: 88 }).toFile(A('logo_ethnispirit_mode_nav.webp'));

// Navbar Bio : logo transparent
await sharp(A('logo_ethnispirit_natural_transparent.png'))
  .resize({ width: 240 })
  .webp({ quality: 90, alphaQuality: 100 }).toFile(A('logo_ethnispirit_natural_nav.webp'));

for (const f of ['logo_ethnispirit_mode_nav.webp', 'logo_ethnispirit_natural_nav.webp']) {
  const m = await sharp(A(f)).metadata();
  console.log(f, m.width + '×' + m.height);
}
