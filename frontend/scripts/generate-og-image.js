/**
 * Génère l'image Open Graph EthniSpirit (1200×630).
 * Usage : node scripts/generate-og-image.js
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Logo transparent PNG (utilisé pour les icônes PWA)
const LOGO_SRC   = path.join(ROOT, 'src/assets/logo_ethnispirit_bio.png');
const OUTPUT     = path.join(ROOT, 'public/icons/og-default.png');

// Charte EthniSpirit
const BG_CREAM   = { r: 244, g: 237, b: 228, alpha: 1 }; // #F4EDE4

async function main() {
  console.log('\n🎨  Génération og-default.png (1200×630)\n');

  const W = 1200, H = 630;
  const logoSize = 300; // logo centré, 300×300

  // Redimensionner le logo
  const logoResized = await sharp(LOGO_SRC)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Fond crème + logo centré
  await sharp({
    create: { width: W, height: H, channels: 4, background: BG_CREAM },
  })
    .composite([{ input: logoResized, gravity: 'centre' }])
    .png()
    .toFile(OUTPUT);

  console.log(`✅  og-default.png (${W}×${H}) → public/icons/\n`);
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
