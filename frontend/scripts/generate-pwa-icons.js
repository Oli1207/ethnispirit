/**
 * Génère les icônes PWA EthniSpirit à partir du logo PNG transparent.
 * Utilise sharp (déjà dans devDependencies).
 * Usage : node scripts/generate-pwa-icons.js
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LOGO_SRC   = path.join(ROOT, 'src/assets/logo_ethnispirit_bio.png');
const OUTPUT_DIR = path.join(ROOT, 'public/icons');

// Couleurs de la charte EthniSpirit
const BG_CREAM      = { r: 244, g: 237, b: 228, alpha: 1 }; // #F4EDE4
const BG_TERRACOTTA = { r: 198, g: 93,  b: 59,  alpha: 1 }; // #C65D3B

/**
 * Crée une icône carrée : fond coloré + logo centré avec padding.
 * @param {number} size      Taille finale en px
 * @param {number} padding   Padding autour du logo (px)
 * @param {{r,g,b,alpha}} bg Couleur de fond
 * @param {string} outPath   Chemin de sortie
 */
async function makeIcon(size, padding, bg, outPath) {
  const logoSize = size - padding * 2;

  // Redimensionner le logo
  const logoResized = await sharp(LOGO_SRC)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Fond carré + logo centré
  await sharp({
    create: {
      width:      size,
      height:     size,
      channels:   4,
      background: bg,
    },
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png()
    .toFile(outPath);

  console.log(`✅  ${path.basename(outPath)} (${size}×${size})`);
}

async function main() {
  console.log('\n🎨  Génération des icônes PWA EthniSpirit\n');

  // icon-192.png — fond crème, padding 24px
  await makeIcon(192, 24, BG_CREAM, path.join(OUTPUT_DIR, 'icon-192.png'));

  // icon-512.png — fond crème, padding 64px
  await makeIcon(512, 64, BG_CREAM, path.join(OUTPUT_DIR, 'icon-512.png'));

  // icon-maskable-512.png — fond terracotta, padding 96px (safe zone = 40%)
  await makeIcon(512, 96, BG_TERRACOTTA, path.join(OUTPUT_DIR, 'icon-maskable-512.png'));

  // apple-touch-icon.png — fond crème, 180×180, padding 22px
  await makeIcon(180, 22, BG_CREAM, path.join(OUTPUT_DIR, 'apple-touch-icon.png'));

  // favicon 32×32 (fond crème)
  await makeIcon(32, 4, BG_CREAM, path.join(OUTPUT_DIR, 'icon-32.png'));

  // favicon 16×16 (fond crème)
  await makeIcon(16, 2, BG_CREAM, path.join(OUTPUT_DIR, 'icon-16.png'));

  console.log('\n✨  Toutes les icônes générées dans public/icons/\n');
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
