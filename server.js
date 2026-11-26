import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@libsql/client';
import { sendOrderEmails, mailEnabled } from './mail.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

try { process.loadEnvFile(); } catch { /* no .env, fine */ }

const __dirname = import.meta.dirname;
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'site.config.json'), 'utf8'));
const rawProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8'));

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const placeholderOn = !PROD && !!process.env.DEV_PLACEHOLDER_PRICES;
const PLACEHOLDER_CENTS = 4990;

// manual payment handles: Zelle (email or phone), Apple Cash (phone), cash on delivery, and optionally Venmo (@username). Env wins over site.config.json.
const PAY = {
  zelle: (process.env.ZELLE_ID || config.payments?.zelle || '').trim(),
  zelleName: (process.env.ZELLE_NAME || config.payments?.zelleName || '').trim(),
  applecash: (process.env.APPLECASH_ID || config.payments?.applecash || '').trim(),
  cash: (process.env.CASH_ON_DELIVERY === '0' ? false : (process.env.CASH_ON_DELIVERY === '1' || config.payments?.cash)) ? 'cash' : '',
  venmo: (process.env.VENMO_HANDLE || config.payments?.venmo || '').trim().replace(/^@/, ''),
};

// ---- catalog -------------------------------------------------------------
const DEFAULT_PRICE = 80;
const LV_PRICE = 90;
const isLV = p => /^(louis vuitton|lv)$/i.test(p.brand);
const spinFrames = id => {
  const dir = path.join(__dirname, 'public/img/360', id);
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort().map(f => `/img/360/${id}/${f}`); } catch { return []; }
};
// Photos are rebuilt in place, so tag every image URL with its file time or browsers keep showing the old ones.
const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
const ver = rel => { if (BUILD) return BUILD; try { return Math.floor(fs.statSync(path.join(__dirname, 'public', rel)).mtimeMs / 1000).toString(36); } catch { return '0'; } };
const img = rel => `${rel}?v=${ver(rel)}`;
const catalog = rawProducts.map(p => {
  // Flat pricing: $80 per bottle, $90 for Louis Vuitton. An explicit "price" in products.json wins.
  const price = p.price ?? (isLV(p) ? LV_PRICE : DEFAULT_PRICE);
  const cents = Math.round(price * 100);
  const usePlaceholder = cents == null && placeholderOn;
  return {
    id: p.id, brand: p.brand, name: p.name, type: p.type, gender: p.gender, size: p.size,
    priceCents: usePlaceholder ? PLACEHOLDER_CENTS : cents,
    placeholder: usePlaceholder,
    image: img(`/img/products/${p.id}.webp`),
    thumb: img(`/img/products/${p.id}-sm.webp`),
    frames: spinFrames(p.id),
    gallery: (p.alt || []).map((_, i) => img(`/img/products/${p.id}-${i + 2}.webp`)),
    pack: p.extra ? { image: `/img/products/${p.id}-pack.webp`, thumb: `/img/products/${p.id}-pack-sm.webp`, credit: p.extra.credit, license: p.extra.license, url: p.extra.url } : null,
  };
});
const byId = new Map(catalog.map(p => [p.id, p]));
const unpriced = catalog.filter(p => p.priceCents == null).length;
if (unpriced) console.warn(`[catalog] ${unpriced}/${catalog.length} products have no price (shown as "ask on WhatsApp"). Set "price" in data/products.json.`);

// ---- database ------------------------------------------------------------
// Turso (hosted SQLite) when TURSO_DATABASE_URL is set, which is what Vercel needs because its disk is temporary.
// Otherwise a local file, so `npm run dev` and a Render disk keep working unchanged.
const onVercel = !!process.env.VERCEL;
if (!process.env.TURSO_DATABASE_URL && !onVercel) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
if (onVercel && !process.env.TURSO_DATABASE_URL) console.error('[db] TURSO_DATABASE_URL is not set: orders and reviews will not be saved on Vercel.');
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || (onVercel ? 'file:/tmp/store.db' : `file:${path.join(__dirname, 'data/store.db')}`),
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    amount_total INTEGER,
    currency TEXT,
    payment_status TEXT,
    shipping_json TEXT,
    items_json TEXT,
    created_at INTEGER NOT NULL
  );
`);
const sql = async (text, args = []) => (await db.execute({ sql: text, args })).rows;
const q = {
  insertReview: async (...a) => Number((await db.execute({ sql: 'INSERT INTO reviews (product_id, name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)', args: a })).lastInsertRowid),
  getReview: async id => (await sql('SELECT * FROM reviews WHERE id = ?', [id]))[0],
  deleteReview: id => sql('DELETE FROM reviews WHERE id = ?', [id]),
  recent: limit => sql('SELECT * FROM reviews ORDER BY created_at DESC, id DESC LIMIT ?', [limit]),
  byProduct: pid => sql('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC, id DESC LIMIT 100', [pid]),
  summary: () => sql('SELECT product_id, COUNT(*) AS count, AVG(rating) AS avg FROM reviews GROUP BY product_id'),
  upsertOrder: (...a) => sql(`INSERT INTO orders (id, email, name, amount_total, currency, payment_status, shipping_json, items_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET payment_status = excluded.payment_status`, a),
  orders: () => sql('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200'),
  setStatus: async (status, id) => (await db.execute({ sql: 'UPDATE orders SET payment_status = ? WHERE id = ?', args: [status, id] })).rowsAffected,
};
const shapeReview = r => ({ id: r.id, productId: r.product_id, name: r.name, rating: r.rating, comment: r.comment, createdAt: r.created_at });

// ---- live reviews (Server-Sent Events) ----------------------------------
const clients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
}

// ---- app -----------------------------------------------------------------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});

// Stripe webhook needs the raw body, so register before express.json().
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Webhook not configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] bad signature:', err.message);
    return res.status(400).send('Invalid signature');
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    await q.upsertOrder(
      s.id, s.customer_details?.email ?? null, s.customer_details?.name ?? null,
      s.amount_total ?? 0, s.currency ?? 'usd', s.payment_status,
      JSON.stringify(s.collected_information?.shipping_details ?? s.shipping_details ?? null),
      s.metadata?.items ?? null, Date.now(),
    );
    console.log(`[order] ${s.id} ${s.payment_status} ${(s.amount_total ?? 0) / 100} ${s.currency}`);
  }
  res.json({ received: true });
});

app.use(express.json({ limit: '20kb' }));

// public config (never exposes secrets)
app.get('/api/config', (_req, res) => {
  res.json({
    name: config.name, currency: config.currency, locale: config.locale,
    whatsapp: config.whatsapp, whatsappDisplay: config.whatsappDisplay, owner: config.owner, email: config.email,
    socials: Object.fromEntries(Object.entries(config.socials).filter(([, v]) => v)),
    spotlight: config.spotlight || {},
    stripeEnabled: !!stripe,
    payments: { zelle: PAY.zelle, zelleName: PAY.zelleName, venmo: PAY.venmo, applecash: PAY.applecash, cash: !!PAY.cash },
    shippingCents: Number(process.env.SHIPPING_CENTS) || 0,
    freeShippingOverCents: Number(process.env.FREE_SHIPPING_OVER_CENTS) || 0,
    placeholderPrices: placeholderOn,
  });
});
app.get('/api/products', (_req, res) => res.json(catalog));

// ---- reviews API ---------------------------------------------------------
app.get('/api/reviews', async (req, res) => {
  const { product } = req.query;
  const rows = product ? await q.byProduct(String(product)) : await q.recent(60);
  res.json(rows.map(shapeReview));
});
app.get('/api/reviews/summary', async (_req, res) => {
  const out = {};
  let total = 0, sum = 0;
  for (const r of await q.summary()) {
    total += r.count; sum += r.avg * r.count;
    if (r.product_id) out[r.product_id] = { count: r.count, avg: Math.round(r.avg * 10) / 10 };
  }
  res.json({ products: out, total, avg: total ? Math.round((sum / total) * 10) / 10 : 0 });
});
app.get('/api/reviews/stream', (req, res) => {
  // Serverless functions cannot hold a connection open; the page falls back to polling when this answers 204.
  if (onVercel) return res.status(204).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  clients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

const hits = new Map(); // ip -> timestamps
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();

app.post('/api/reviews', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(201).json({ ok: true }); // honeypot: pretend success to bots
  if (rateLimited(req.ip, 3, 3600e3)) return res.status(429).json({ error: 'rate_limited' });
  const name = String(b.name ?? '').trim().slice(0, 40);
  const comment = String(b.comment ?? '').trim().slice(0, 600);
  const rating = Number(b.rating);
  const productId = b.productId ? String(b.productId) : null;
  if (!name || comment.length < 3 || !Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'invalid' });
  if (productId && !byId.has(productId)) return res.status(400).json({ error: 'unknown_product' });
  const newId = await q.insertReview(productId, name, rating, comment, Date.now());
  const review = shapeReview(await q.getReview(newId));
  broadcast('review', review);
  res.status(201).json(review);
});

app.delete('/api/reviews/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const id = Number(req.params.id);
  await q.deleteReview(id);
  broadcast('review-deleted', { id });
  res.json({ ok: true });
});

// ---- checkout ------------------------------------------------------------
app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'stripe_not_configured' });
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 30) : [];
  const lines = [];
  let subtotal = 0;
  for (const it of items) {
    const p = byId.get(String(it?.id));
    const qty = Math.min(10, Math.max(1, Math.floor(Number(it?.qty) || 0)));
    if (!p || p.priceCents == null) return res.status(400).json({ error: 'invalid_item', id: it?.id });
    if (p.placeholder && PROD) return res.status(400).json({ error: 'invalid_item', id: p.id });
    subtotal += p.priceCents * qty;
    lines.push({ p, qty });
  }
  if (!lines.length) return res.status(400).json({ error: 'empty_cart' });

  const isHttps = SITE_URL.startsWith('https://');
  const shipCents = Number(process.env.SHIPPING_CENTS) || 0;
  const freeOver = Number(process.env.FREE_SHIPPING_OVER_CENTS) || 0;
  const shipping = shipCents && !(freeOver && subtotal >= freeOver) ? shipCents : 0;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines.map(({ p, qty }) => ({
        quantity: qty,
        price_data: {
          currency: config.currency,
          unit_amount: p.priceCents,
          product_data: {
            name: `${p.brand} ${p.name}`,
            description: [p.type, p.size].filter(Boolean).join(' · ') || undefined,
            ...(isHttps ? { images: [`${SITE_URL}${p.image}`] } : {}),
          },
        },
      })),
      shipping_address_collection: { allowed_countries: config.shippingCountries },
      phone_number_collection: { enabled: true },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shipping ? 'Standard shipping' : 'Free shipping',
          fixed_amount: { amount: shipping, currency: config.currency },
        },
      }],
      metadata: { items: lines.map(l => `${l.p.id}x${l.qty}`).join(',').slice(0, 500) },
      success_url: `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/#shop`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err.message);
    res.status(502).json({ error: 'stripe_error' });
  }
});

// ---- manual payments (Zelle / Apple Cash / cash) ---------------------------------------
// The customer sends the money from their own app with the order code as the note;
// the order stays "awaiting_*" until the owner marks it paid (PATCH /api/orders/:id/paid).
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const orderCode = () => 'EB-' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
const isAdmin = req => {
  const token = process.env.ADMIN_TOKEN;
  const given = String(req.get('x-admin-token') || '');
  return !!token && given.length === token.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(token));
};
app.post('/api/orders/manual', async (req, res) => {
  const b = req.body || {};
  const method = ['venmo', 'zelle', 'applecash', 'cash'].includes(b.method) ? b.method : null;
  if (!method || !PAY[method]) return res.status(400).json({ error: 'method_unavailable' });
  if (rateLimited(req.ip, 6, 3600e3)) return res.status(429).json({ error: 'rate_limited' });
  const lines = []; let subtotal = 0;
  for (const it of (Array.isArray(b.items) ? b.items.slice(0, 30) : [])) {
    const p = byId.get(String(it?.id));
    const qty = Math.min(10, Math.max(1, Math.floor(Number(it?.qty) || 0)));
    if (!p || p.priceCents == null || (p.placeholder && PROD)) return res.status(400).json({ error: 'invalid_item', id: it?.id });
    subtotal += p.priceCents * qty; lines.push({ p, qty });
  }
  if (!lines.length) return res.status(400).json({ error: 'empty_cart' });
  const c = b.customer || {};
  const customer = { name: clean(c.name, 80), phone: clean(c.phone, 30), email: clean(c.email, 120),
    address1: clean(c.address1, 120), address2: clean(c.address2, 60), city: clean(c.city, 60), state: clean(c.state, 30), zip: clean(c.zip, 12) };
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) return res.status(400).json({ error: 'invalid_customer' });
  if (!customer.name || customer.phone.replace(/\D/g, '').length < 7 || !customer.address1 || !customer.city || !customer.state || !/^\d{5}(-\d{4})?$/.test(customer.zip))
    return res.status(400).json({ error: 'invalid_customer' });
  const shipCents = Number(process.env.SHIPPING_CENTS) || 0;
  const freeOver = Number(process.env.FREE_SHIPPING_OVER_CENTS) || 0;
  const total = subtotal + (shipCents && !(freeOver && subtotal >= freeOver) ? shipCents : 0);
  const id = orderCode();
  await q.upsertOrder(id, customer.email || null, customer.name, total, config.currency, `awaiting_${method}`,
    JSON.stringify(customer), lines.map(l => `${l.p.id}x${l.qty}`).join(','), Date.now());
  console.log(`[order] ${id} awaiting_${method} ${total / 100} ${customer.name} ${customer.phone}`);
  const items = lines.map(l => ({ name: `${l.p.brand} ${l.p.name}`, qty: l.qty }));
  const payee = method === 'zelle' ? PAY.zelleName : '';
  const mail = await sendOrderEmails({ id, method, ...customer, items, totalCents: total, handle: PAY[method], payee, lang: b.lang === 'en' ? 'en' : 'es' },
    { owner: config.owner, ownerEmail: (process.env.OWNER_EMAIL || config.email || '').trim(), whatsapp: config.whatsapp, whatsappDisplay: config.whatsappDisplay });
  res.status(201).json({ id, method, name: customer.name, amountCents: total, handle: PAY[method], payee, items, receipt: mail.guest });
});
app.get('/api/orders', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  res.json({
    owner: config.owner, brand: config.brand || 'Perfumes El Bro', pay: { zelle: PAY.zelle, venmo: PAY.venmo, applecash: PAY.applecash, cash: !!PAY.cash },
    orders: (await q.orders()).map(o => ({
      id: o.id, name: o.name, totalCents: o.amount_total, status: o.payment_status, createdAt: o.created_at,
      shipping: JSON.parse(o.shipping_json || 'null'),
      items: String(o.items_json || '').split(',').filter(Boolean).map(x => {
        const m = /^(.*)x(\d+)$/.exec(x); const pid = m ? m[1] : x; const qty = m ? m[2] : 1; const p = byId.get(pid);
        return { qty: Number(qty) || 1, name: p ? `${p.brand} ${p.name}`.trim() : pid, size: p?.size || '' };
      }),
    })),
  });
});
app.patch('/api/orders/:id/status', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const status = String(req.body?.status || '');
  if (!['paid', 'shipped'].includes(status)) return res.status(400).json({ error: 'invalid_status' });
  const changed = await q.setStatus(status, String(req.params.id));
  res.json({ ok: changed > 0 });
});
app.patch('/api/orders/:id/paid', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  const changed = await q.setStatus('paid', String(req.params.id));
  res.json({ ok: changed > 0 });
});

// ---- static --------------------------------------------------------------
app.use('/img', express.static(path.join(__dirname, 'public/img'), { maxAge: '30d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: PROD ? '1h' : 0 }));

if (!onVercel) {
  app.listen(PORT, () => {
    console.log(`Perfumes El Bro on ${SITE_URL}  (stripe: ${stripe ? 'on' : 'OFF - set STRIPE_SECRET_KEY'}, emails: ${mailEnabled ? 'on' : 'off'}${placeholderOn ? ', test prices ON' : ''})`);
  });
}

export default app;
