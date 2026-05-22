/**
 * Génère deux favicons à partir du logo PNG transparent :
 *  - favicon-mode.png  → teinte terracotta (mode Antillaise)
 *  - favicon-bio.png   → teinte verte naturelle (Bio & Naturel)
 * Usage : node scripts/generate-favicons.cjs
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const SRC     = path.resolve(__dirname, '../src/assets/logo_ethnispirit_bio.png');
const OUT_DIR = path.resolve(__dirname, '../public/icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function generate() {
  // ── Favicon Bio (vert naturel — couleurs d'origine) ───────────────────────
  await sharp(SRC)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon-bio.png'));
  console.log('✅  favicon-bio.png (64×64, vert)');

  // ── Favicon Mode Antillaise (vert → terracotta via hue rotation) ──────────
  // Vert logo ≈ H 123°, terracotta cible ≈ H 16° → rotation -107°
  await sharp(SRC)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ hue: -107, saturation: 1.6, brightness: 1.8 })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon-mode.png'));
  console.log('✅  favicon-mode.png (64×64, terracotta)');

  // ── Versions 32×32 pour compatibilité ────────────────────────────────────
  await sharp(SRC)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon-bio-32.png'));

  await sharp(SRC)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ hue: -107, saturation: 1.6, brightness: 1.8 })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon-mode-32.png'));
  console.log('✅  versions 32×32 générées');
}

generate().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
