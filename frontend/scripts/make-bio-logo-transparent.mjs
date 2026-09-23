/**
 * Extrait le logo "Ethnispirit Natural" du visuel Bio (fond crème) et rend le fond
 * transparent (flood-fill depuis les bords : les zones crème enfermées dans le logo,
 * comme l'hibiscus, sont conservées).
 * Usage : node scripts/make-bio-logo-transparent.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = path.join(ROOT, 'src/assets/logo_ethnispirit_natural.jpeg');
const OUT  = path.join(ROOT, 'src/assets/logo_ethnispirit_natural_transparent.png');

const CROP = { left: 270, top: 70, width: 740, height: 660 };
const HARD = 42;   // distance RGB en dessous de laquelle c'est du fond
const SOFT = 90;   // au-delà, opaque ; entre les deux, bord adouci

const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => (y * W + x) * 3;
const at = (x, y) => (y * W + x) * 3;

// Couleur de fond = moyenne des 4 coins (patchs 12×12)
let r = 0, g = 0, b = 0, n = 0;
for (const [cx, cy] of [[0, 0], [W - 12, 0]])
  for (let y = cy; y < cy + 12; y++) for (let x = cx; x < cx + 12; x++) {
    const i = px(x, y); r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
const bg = [r / n, g / n, b / n];
const dist = (x, y) => { const i = px(x, y); return Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]); };

// Le haut du flacon (produit) déborde en bas à droite du recadrage : on le gomme
for (let y = 615; y < H; y++) for (let x = (y >= 645 ? 0 : 490); x < W; x++) { const i = at(x, y); data[i] = bg[0]; data[i + 1] = bg[1]; data[i + 2] = bg[2]; }

// Flood-fill du fond depuis les bords
const isBg = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; if (isBg[k] || dist(x, y) > HARD) return; isBg[k] = 1; stack.push(k); };
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
while (stack.length) {
  const k = stack.pop(), x = k % W, y = (k / W) | 0;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// Contre-formes des lettres (ex. panse du "p") : fond crème enfermé sous les visages
for (let y = 360; y < H; y++) for (let x = 0; x < W; x++) if (dist(x, y) <= HARD) isBg[y * W + x] = 1;

// Alpha : fond = 0 ; pixels au contact du fond = adoucis ; le reste = opaque
const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = y * W + x, i = px(x, y), o = k * 4;
  let a = 255;
  if (isBg[k]) a = 0;
  else {
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && isBg[yy * W + xx]) { near = true; break; }
    }
    if (near) a = Math.round(255 * Math.min(1, Math.max(0, (dist(x, y) - HARD) / (SOFT - HARD))));
  }
  out[o] = data[i]; out[o + 1] = data[i + 1]; out[o + 2] = data[i + 2]; out[o + 3] = a;
}

await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .trim()                       // retire les marges transparentes
  .resize({ width: 480 })
  .png({ compressionLevel: 9 })
  .toFile(OUT);
console.log('✅', path.basename(OUT), 'bg=', bg.map(Math.round));
