/**
 * Supprime le fond crème/blanc du logo JPEG et génère un PNG transparent.
 * Usage : node scripts/remove-logo-bg.js
 */
const sharp = require('sharp');
const path  = require('path');

async function run() {
  const input  = path.resolve(__dirname, '../src/assets/logo_ethnispirit_bio.jpeg');
  const output = path.resolve(__dirname, '../src/assets/logo_ethnispirit_bio.png');

  // 1. Lire les pixels bruts avec canal alpha ajouté
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = new Uint8Array(data);

  // 2. Rendre transparents les pixels proches du fond crème (#F4EDE4 ≈ 244,237,228)
  //    Seuils légèrement en-dessous de la couleur du fond pour ne pas mordre sur le logo
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4 + 0];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];

    // Fond : canaux tous clairs (blanc → crème léger)
    if (r > 215 && g > 205 && b > 190) {
      pixels[i * 4 + 3] = 0; // transparent
    }
  }

  // 3. Sauvegarder en PNG avec transparence
  await sharp(Buffer.from(pixels.buffer), {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(output);

  console.log(`✅  PNG transparent généré → ${output}`);
}

run().catch((err) => {
  console.error('❌  Erreur :', err.message);
  process.exit(1);
});
