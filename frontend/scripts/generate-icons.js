/**
 * Génère toutes les icônes PNG nécessaires pour PWA et SEO
 * Prérequis : npm install -D sharp
 * Usage    : node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const svgPath   = join(root, 'public', 'favicon.svg');
const outDir    = join(root, 'public', 'icons');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const icons = [
  { name: 'icon-16.png',          size: 16  },
  { name: 'icon-32.png',          size: 32  },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
  { name: 'icon-maskable-512.png',size: 512, padding: 80 },
];

for (const icon of icons) {
  const s = sharp(svgBuffer);

  if (icon.padding) {
    // Version maskable : ajouter un fond coloré + marge
    const inner = icon.size - icon.padding * 2;
    const resized = await sharp(svgBuffer).resize(inner, inner).toBuffer();
    await sharp({
      create: {
        width:      icon.size,
        height:     icon.size,
        channels:   4,
        background: { r: 123, g: 50, b: 37, alpha: 1 }, // --terracotta
      },
    })
      .composite([{ input: resized, gravity: 'centre' }])
      .png()
      .toFile(join(outDir, icon.name));
  } else {
    await s.resize(icon.size, icon.size).png().toFile(join(outDir, icon.name));
  }
  console.log(`✓ ${icon.name} (${icon.size}px)`);
}

console.log('\n✅ Toutes les icônes ont été générées dans public/icons/');
console.log('   Pensez aussi à créer public/icons/og-default.png (1200×630)');
