// Optimizes the originals in /productImages and /mainLogo into /public/img.
// Never upscales: output width = min(original, target).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const out = path.join(root, 'public/img');
fs.mkdirSync(path.join(out, 'products'), { recursive: true });

// Look: every photo ends up 1200x1960 on a dark stage. Phone photos get a spotlight so shelves and
// cardboard fall into shadow, and the shop's business card lies on a reflective floor under the bottles.
// Photos that already hold a card get the new one laid over it (p.cardAt = [centerX, centerY, width] as fractions).
const W = 1200, TH = 1960, IMG_MAX = 1800;
const CROP = { left: 24, top: 30, width: 288, height: 158 }; // trims the blurred fabric around the card in the photo
const cardSrc = sharp(await sharp(path.join(import.meta.dirname, 'assets/business-card.png')).extract(CROP).toBuffer());
const cardMeta = await cardSrc.metadata();
const cardPng = await cardSrc.clone().composite([{ input: Buffer.from(`<svg width="${cardMeta.width}" height="${cardMeta.height}"><rect width="100%" height="100%" rx="8" fill="#fff"/></svg>`), blend: 'dest-in' }]).png().toBuffer();
const cardRatio = cardMeta.width / cardMeta.height;
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

async function cardLayer(id, cw, angle) {
  const card = await sharp(cardPng).resize({ width: cw, kernel: 'lanczos3' }).sharpen({ sigma: 0.7 }).modulate({ brightness: 0.96 })
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const { width: rw, height: rh } = await sharp(card).metadata();
  const alpha = await sharp(card).ensureAlpha().extractChannel(3).blur(12).linear(0.75).toBuffer();
  const shade = await sharp({ create: { width: rw, height: rh, channels: 3, background: '#000' } }).joinChannel(alpha).png().toBuffer();
  return { card, shade, rw, rh };
}

async function spotlight(buf) {
  const { width: w, height: h } = await sharp(buf).metadata();
  const svg = Buffer.from(`<svg width="${w}" height="${h}"><defs>
    <radialGradient id="r" cx=".5" cy=".5" r=".74"><stop offset=".36" stop-color="#060504" stop-opacity="0"/><stop offset="1" stop-color="#060504" stop-opacity=".9"/></radialGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060504" stop-opacity=".75"/><stop offset=".32" stop-color="#060504" stop-opacity="0"/><stop offset=".86" stop-color="#060504" stop-opacity="0"/><stop offset="1" stop-color="#060504" stop-opacity=".55"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#r)"/><rect width="100%" height="100%" fill="url(#t)"/></svg>`);
  return sharp(buf).gamma(1.08).linear(1.06, -2).modulate({ saturation: 1.1 }).sharpen({ sigma: 0.9 }).composite([{ input: svg }]).toBuffer();
}

// Studio scene for phone photos: the bottle and box are cut out of the original (scripts/assets/cutouts) and set on
// a dark marble counter in front of a dark panelled wall, with a soft reflection and contact shadow.
const cutoutFor = f => path.join(import.meta.dirname, 'assets/cutouts', path.basename(f).replace(/\.[^.]+$/, '') + '.png');
let sceneBg = null;
async function sceneBackground() {
  if (sceneBg) return sceneBg;
  const HZ = 1250; // where the counter starts
  const svg = Buffer.from(`<svg width="${W}" height="${TH}" xmlns="http://www.w3.org/2000/svg"><defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d13"/><stop offset="1" stop-color="#1b1a1c"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#b08a52" stop-opacity=".30"/><stop offset="1" stop-color="#b08a52" stop-opacity="0"/></radialGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2927"/><stop offset=".12" stop-color="#161514"/><stop offset="1" stop-color="#070606"/></linearGradient>
    <filter id="vein" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0035 .011" numOctaves="5" seed="11"/>
      <feColorMatrix values="0 0 0 0 .86  0 0 0 0 .78  0 0 0 0 .62  1 0 0 0 0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 0 0 0 0 0 0 .8 0 0 0 0 0 0 0 0 0 0"/></feComponentTransfer></filter>
    <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>
    <rect width="${W}" height="${TH}" fill="url(#wall)"/>
    <rect x="96" y="110" width="${W - 192}" height="${HZ - 330}" rx="4" fill="#0b0f16" stroke="#ffffff" stroke-opacity=".07" stroke-width="3"/>
    <rect x="150" y="164" width="${W - 300}" height="${HZ - 438}" rx="2" fill="none" stroke="#ffffff" stroke-opacity=".05" stroke-width="2"/>
    <ellipse cx="${W / 2}" cy="${HZ - 330}" rx="620" ry="620" fill="url(#glow)"/>
    <rect y="${HZ}" width="${W}" height="${TH - HZ}" fill="url(#top)"/>
    <rect y="${HZ}" width="${W}" height="${TH - HZ}" filter="url(#vein)" opacity=".4"/>
    <rect y="${HZ}" width="${W}" height="3" fill="#ffffff" fill-opacity=".14"/>
    <rect width="${W}" height="${TH}" fill="url(#vig)"/></svg>`);
  const grain = await sharp({ create: { width: W, height: TH, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 22 } } }).greyscale().linear(0.14, 110).png().toBuffer();
  sceneBg = await sharp(svg).composite([{ input: grain, blend: 'overlay' }]).png().toBuffer();
  return sceneBg;
}

async function renderStage(cutFile, id) {
  const HZ = 1250, BASE = 1400;
  const cut = await sharp(cutFile).ensureAlpha().toBuffer();
  const rgb = await sharp(cut).removeAlpha().toBuffer();
  const a = await sharp(cut).extractChannel(3).blur(1.4).linear(1.6, -60).png().toBuffer(); // pull the edge in: no white fringe
  const tight = await sharp(rgb).joinChannel(a).png().toBuffer();
  const trimmed = await sharp(tight).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).toBuffer();
  const tm = await sharp(trimmed).metadata();
  const scale = Math.min(W * 0.84 / tm.width, 1150 / tm.height);
  const pw = Math.round(tm.width * scale), ph = Math.round(tm.height * scale);
  const prod = await sharp(trimmed).resize(pw, ph, { kernel: 'lanczos3' }).gamma(1.05).modulate({ brightness: 0.96, saturation: 1.05 }).sharpen({ sigma: 0.8 }).png().toBuffer();
  const left = Math.round((W - pw) / 2), top = BASE - ph;
  // reflection on the counter: flipped copy that fades out
  const rh = Math.min(Math.round(ph * 0.42), TH - BASE - 10);
  const flipped = await sharp(prod).flip().extract({ left: 0, top: 0, width: pw, height: rh }).blur(2.5).toBuffer();
  const fadeMask = Buffer.from(`<svg width="${pw}" height="${rh}"><defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#m)"/></svg>`);
  const refl = await sharp(flipped).composite([{ input: fadeMask, blend: 'dest-in' }]).png().toBuffer();
  const shadow = Buffer.from(`<svg width="${W}" height="${TH}"><defs><radialGradient id="s"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W / 2}" cy="${BASE + 6}" rx="${pw * 0.56}" ry="46" fill="url(#s)"/></svg>`);
  const { card, shade, rw, rh: ch } = await cardLayer(id, Math.round(W * 0.4), ((hash(id) % 40) - 20) / 10);
  const cl = Math.round(W / 2 - rw / 2 + ((hash(id + 'x') % 12) - 6) / 100 * W), ct = TH - 56 - ch;
  const cardShadow = Buffer.from(`<svg width="${W}" height="${TH}"><defs><radialGradient id="g"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cl + rw / 2}" cy="${ct + ch}" rx="${rw * 0.64}" ry="${ch * 0.16}" fill="url(#g)"/></svg>`);
  return sharp(await sceneBackground()).composite([
    { input: shadow }, { input: refl, left, top: BASE + 2 }, { input: prod, left, top },
    { input: cardShadow }, { input: shade, left: cl, top: ct + 10 }, { input: card, left: cl, top: ct },
  ]).png().toBuffer();
}

async function render(srcFile, id, opts = {}) {
  if (fs.existsSync(cutoutFor(srcFile)) && !opts.cardAt) return renderStage(cutoutFor(srcFile), id);
  const raw = await sharp(srcFile).rotate().toBuffer();
  const m = await sharp(raw).metadata();
  const h = Math.round(W * m.height / m.width);
  const phone = /\.jpe?g$/i.test(srcFile);
  const layers = [];
  let canvas;
  if (opts.cardAt && h < 1400) {
    // wide photo: keep it whole; the extra height is a blurred, darkened copy of it
    const bg = await sharp(raw).resize(W, TH, { fit: 'cover' }).blur(40).modulate({ brightness: 0.7 }).toBuffer();
    const fg = await sharp(raw).resize({ width: W }).toBuffer();
    const top = Math.max(0, Math.round((TH - h) / 2));
    canvas = await sharp(bg).composite([{ input: fg, left: 0, top }]).png().toBuffer();
    const [cx, cy, cwF] = opts.cardAt;
    const { card, shade, rw, rh } = await cardLayer(id, Math.round(W * cwF * 1.14), 0);
    const left = Math.round(cx * W - rw / 2), t = Math.round(top + cy * Math.min(h, TH) - rh / 2);
    layers.push({ input: shade, left, top: t + 8 }, { input: card, left, top: t });
  } else {
    const imgH = Math.min(h, IMG_MAX);
    let img = await sharp(raw).resize({ width: W }).toBuffer();
    if (h > IMG_MAX) img = await sharp(img).extract({ left: 0, top: Math.round((h - IMG_MAX) * 0.3), width: W, height: IMG_MAX }).toBuffer();
    if (phone) img = await spotlight(img);
    const footer = TH - imgH;
    // floor: reflection of the lowest part of the photo, blurred and sinking into black
    const strip = Math.min(imgH, Math.max(footer, 240));
    const refl = await sharp(img).extract({ left: 0, top: imgH - strip, width: W, height: strip }).flip().resize(W, footer, { fit: 'fill' }).blur(16).modulate({ brightness: 0.55 }).toBuffer();
    const fade = Buffer.from(`<svg width="${W}" height="${footer}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080706" stop-opacity=".25"/><stop offset=".7" stop-color="#080706" stop-opacity=".88"/><stop offset="1" stop-color="#080706" stop-opacity=".96"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`);
    const floor = await sharp(refl).composite([{ input: fade }]).toBuffer();
    canvas = await sharp({ create: { width: W, height: TH, channels: 3, background: '#080706' } })
      .composite([{ input: img, left: 0, top: 0 }, { input: floor, left: 0, top: imgH }]).png().toBuffer();
    // soft join between photo and floor
    const seam = Buffer.from(`<svg width="${W}" height="120"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080706" stop-opacity="0"/><stop offset="1" stop-color="#080706" stop-opacity=".5"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#s)"/></svg>`);
    layers.push({ input: seam, left: 0, top: imgH - 120 });
    if (opts.cardAt) {
      const [cx, cy, cwF] = opts.cardAt;
      const c = await cardLayer(id, Math.round(W * cwF * 1.14), 0);
      const left = Math.round(cx * W - c.rw / 2), t = Math.round(cy * imgH - c.rh / 2);
      layers.push({ input: c.shade, left, top: t + 8 }, { input: c.card, left, top: t });
      return sharp(canvas).composite(layers).png().toBuffer();
    }
    const angle = ((hash(id) % 40) - 20) / 10;
    const { card, shade, rw, rh } = await cardLayer(id, Math.round(W * 0.4), angle);
    const left = Math.round(W / 2 - rw / 2 + ((hash(id + 'x') % 12) - 6) / 100 * W);
    const top = TH - 44 - rh;
    const contact = Buffer.from(`<svg width="${W}" height="${TH}"><defs><radialGradient id="g"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${left + rw / 2}" cy="${top + rh - 2}" rx="${rw * 0.66}" ry="${rh * 0.18}" fill="url(#g)"/></svg>`);
    layers.push({ input: contact }, { input: shade, left, top: top + 10 }, { input: card, left, top });
  }
  return sharp(canvas).composite(layers).png().toBuffer();
}

async function emit(buf, name) {
  const img = sharp(buf);
  await img.clone().webp({ quality: 88, effort: 5 }).toFile(path.join(out, 'products', `${name}.webp`));
  await img.clone().resize({ width: 640 }).webp({ quality: 84, effort: 5 }).toFile(path.join(out, 'products', `${name}-sm.webp`));
}

const only = process.env.ONLY?.split(',');
for (const p of products) {
  if (only && !only.includes(p.id)) continue;
  const files = [p.src, ...(p.alt || [])];
  for (const [i, f] of files.entries()) {
    const src = path.join(root, 'productImages', f);
    if (!fs.existsSync(src)) { console.error('MISSING', f); process.exitCode = 1; continue; }
    const cardAt = i === 0 ? p.cardAt : (p.altCardAt || {})[f];
    await emit(await render(src, p.id + i, { cardAt }), i === 0 ? p.id : `${p.id}-${i + 1}`);
  }
}

// Optional licensed packshot (p.extra.src under productImages/): white background, never cropped.
for (const p of products) {
  if (!p.extra) continue;
  const src = path.join(root, 'productImages', p.extra.src);
  if (!fs.existsSync(src)) { console.error('MISSING', p.extra.src); process.exitCode = 1; continue; }
  const pack = sharp(src).rotate().flatten({ background: '#ffffff' });
  await pack.clone().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 90 }).toFile(path.join(out, 'products', `${p.id}-pack.webp`));
  await pack.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(out, 'products', `${p.id}-pack-sm.webp`));
}

// Optional turntable frames: productImages/360/<product id>/*.jpg (any names, sorted) -> public/img/360/<id>/01.webp ...
const spinRoot = path.join(root, 'productImages', '360');
let spins = 0;
for (const p of products) {
  const dir = path.join(spinRoot, p.id);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  if (files.length < 2) continue;
  const dest = path.join(out, '360', p.id);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const [i, f] of files.entries()) {
    await sharp(path.join(dir, f)).rotate().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 84, effort: 4 })
      .toFile(path.join(dest, `${String(i + 1).padStart(2, '0')}.webp`));
  }
  spins++;
}
console.log(`built ${spins} 360 viewers`);

const logoDir = path.join(root, 'mainLogo');
const logoSrc = path.join(logoDir, fs.readdirSync(logoDir).find(f => /\.(jpe?g|png)$/i.test(f)));
await sharp(logoSrc).webp({ quality: 92 }).toFile(path.join(out, 'logo.webp'));
await sharp(logoSrc).resize(1200, 1200).jpeg({ quality: 88 }).toFile(path.join(out, 'og.jpg'));
// Full original logo everywhere: header badge, tab icon, touch icon, share image.
await sharp(logoSrc).resize(192, 192).webp({ quality: 92 }).toFile(path.join(out, 'logo-badge.webp'));
await sharp(logoSrc).resize(512, 512).png().toFile(path.join(out, 'icon-512.png'));
await sharp(logoSrc).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));
await sharp(logoSrc).resize(64, 64).png().toFile(path.join(out, 'favicon.png'));
await sharp(logoSrc).resize(48, 48).png().toFile(path.join(root, 'public', 'favicon.ico'));
console.log(`built ${products.length} product images + logo`);
