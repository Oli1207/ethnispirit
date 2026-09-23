/**
 * Génère favicons, icônes PWA, apple-touch-icon et image Open Graph
 * à partir des logos fournis par la cliente :
 *  - src/assets/logo_ethnispirit_mode.jpeg    (Mode Caribéenne, fond blanc)
 *  - src/assets/logo_ethnispirit_natural.jpeg (Bio & Naturel, fond crème)
 * Usage : node scripts/generate-brand-assets.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'public/icons');

const MODE_LOGO = path.join(ROOT, 'src/assets/logo_ethnispirit_mode.jpeg');
const BIO_LOGO  = path.join(ROOT, 'src/assets/logo_ethnispirit_natural.jpeg');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// Zone "médaillon" (les deux visages, sans le texte) — lisible en petite taille
const MODE_EMBLEM = { left: 100, top: 20, width: 1050, height: 925 };
const BIO_EMBLEM  = { left: 375, top: 85, width: 540, height: 370 };
const CREAM = { r: 250, g: 243, b: 231, alpha: 1 };

/** Carré de côté `size` : fond `bg` + image centrée avec `padding`. */
async function square(src, size, padding, bg, outName, extract) {
  // linear() : pousse le quasi-blanc du JPEG en blanc pur (évite un cadre grisé)
  let img = sharp(src).linear(bg === WHITE ? 1.03 : 1, bg === WHITE ? 2 : 0);
  if (extract) img = img.extract(extract);
  const inner = size - padding * 2;
  const buf = await img
    .resize(inner, inner, { fit: 'contain', background: bg })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: buf, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, outName));
  console.log(`✅  ${outName} (${size}×${size})`);
}

async function main() {
  // Favicons (médaillon seul)
  await square(MODE_LOGO, 64, 0, WHITE, 'favicon-mode.png',    MODE_EMBLEM);
  await square(MODE_LOGO, 32, 0, WHITE, 'favicon-mode-32.png', MODE_EMBLEM);
  await square(MODE_LOGO, 32, 0, WHITE, 'icon-32.png',         MODE_EMBLEM);
  await square(MODE_LOGO, 16, 0, WHITE, 'icon-16.png',         MODE_EMBLEM);
  await square(BIO_LOGO,  64, 0, CREAM, 'favicon-bio.png',    BIO_EMBLEM);
  await square(BIO_LOGO,  32, 0, CREAM, 'favicon-bio-32.png', BIO_EMBLEM);

  // Icônes PWA / iOS (logo complet)
  await square(MODE_LOGO, 192, 12, WHITE, 'icon-192.png');
  await square(MODE_LOGO, 512, 32, WHITE, 'icon-512.png');
  await square(MODE_LOGO, 180, 12, WHITE, 'apple-touch-icon.png');
  // Maskable : zone de sécurité ~80 % → plus de marge
  await square(MODE_LOGO, 512, 80, WHITE, 'icon-maskable-512.png');

  // Open Graph 1200×630 : logo centré sur fond blanc
  const logo = await sharp(MODE_LOGO).linear(1.03, 2).resize(590, 590, { fit: 'contain', background: WHITE }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: WHITE } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT, 'og-default.png'));
  console.log('✅  og-default.png (1200×630)');
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
