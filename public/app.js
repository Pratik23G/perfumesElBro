// Perfumes El Bro — storefront
document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
}

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

/* ---------------- i18n ---------------- */
const DICT = {
  es: {
    skip: 'Ir a la tienda',
    'nav.shop': 'Tienda', 'nav.why': 'Cómo funciona', 'nav.reviews': 'Reseñas', 'nav.contact': 'Contacto',
    'hero.lead': 'Chanel, Dior, Yves Saint Laurent, Creed y Tom Ford desde $80 el frasco. Paga con Zelle o Venmo. Pide por WhatsApp o mensaje de texto.',
    'hero.wa': 'Pedir por WhatsApp',
    'p.sealed': 'Sellado', 'hero.see': 'Ver perfume',
    'slide.0.title': 'Para él', 'slide.0.lead': 'Originales sellados desde $80 el frasco. Directo de una persona.', 'slide.0.cta': 'Ver perfumes para hombre',
    'slide.1.title': 'Para ella', 'slide.1.lead': 'Florales, frescos y dulces, sellados. Desde $80 el frasco.', 'slide.1.cta': 'Ver perfumes para mujer',
    'slide.2.title': 'Para todos', 'slide.2.lead': 'Aromas unisex de Tom Ford, Creed y más.', 'slide.2.cta': 'Ver perfumes unisex',
    'col.title': 'Compra por colección', 'col.cta': 'Ver colección', 'hero.tabs': 'Colecciones',
    'trust.1': 'Pago directo', 'trust.1d': 'Zelle o Venmo',
    'trust.2': 'Envíos a todo el país', 'trust.2d': 'Directo hasta tu puerta',
    'trust.3': 'Calidad garantizada', 'trust.3d': 'Perfumes en su caja',
    'trust.4': 'Precio fijo', 'trust.4d': '$80 por frasco',
    'shop.title': 'Todos los perfumes', 'shop.count1': 'perfume', 'shop.countN': 'perfumes', 'shop.empty': 'No encontramos fragancias con ese filtro.',
    'f.all': 'Todos', 'f.men': 'Hombre', 'f.women': 'Mujer', 'f.unisex': 'Unisex', 'f.search': 'Buscar', 'f.brands': 'Todas las marcas', 'f.title': 'Filtrar y ordenar', 'f.sort': 'Ordenar', 'f.brand': 'Marca', 'f.conc': 'Concentración', 'f.clear': 'Limpiar todo', 'f.show': 'Ver', 'f.clearAll': 'Limpiar todo',
    'sort.featured': 'Destacados', 'sort.az': 'Nombre A–Z', 'sort.pa': 'Precio: menor a mayor', 'sort.pd': 'Precio: mayor a menor', 'sort.rating': 'Mejor valorados',
    'why.title': 'Cómo funciona tu pedido',
    'why.lead': 'Elige, paga y recíbelo en casa. Cada pedido se prepara con cuidado y se envía protegido.',
    'why.s1': 'Elige tu fragancia', 'why.s1d': 'Explora la colección y encuentra el aroma que va contigo.',
    'why.s2': 'Paga con Zelle o Venmo', 'why.s2d': 'Envía el pago desde tu app y enviamos tu pedido en cuanto lo vemos.',
    'why.s3': 'Recíbelo en casa', 'why.s3d': 'Enviamos a todo el país, empacado para llegar perfecto.',
    'rev.live': 'En vivo', 'rev.title': 'Lo que dicen nuestros clientes',
    'rev.write': 'Deja tu reseña', 'rev.product': 'Perfume', 'rev.general': 'Perfumes El Bro (general)', 'rev.rating': 'Tu calificación',
    'rev.name': 'Tu nombre', 'rev.comment': 'Tu opinión', 'rev.send': 'Publicar reseña',
    'rev.none': 'Aún no hay reseñas', 'rev.noneLong': 'Sé el primero en opinar. Tu reseña aparece al instante para todos.',
    'rev.one': 'reseña', 'rev.many': 'reseñas', 'rev.about': 'sobre',
    'rev.productReviews': 'Reseñas de este perfume', 'rev.writeAbout': 'Escribir una reseña', 'rev.noneProduct': 'Este perfume aún no tiene reseñas.',
    'rev.errInvalid': 'Completa tu nombre, calificación (estrellas) y opinión.', 'rev.errRate': 'Demasiadas reseñas seguidas. Inténtalo más tarde.', 'rev.errGeneric': 'No pudimos publicar tu reseña. Inténtalo de nuevo.',
    'rev.thanks': 'Gracias por tu reseña', 'rev.newBy': 'Nueva reseña de',
    'ct.title': 'Haz tu pedido por WhatsApp', 'ct.lead': 'Escríbenos por WhatsApp para pedidos especiales, disponibilidad y asesoría para elegir tu perfume.', 'ct.follow': 'Síguenos', 'ct.owner': 'Atendido por',
    'foot.note': 'Las marcas citadas pertenecen a sus respectivos propietarios.',
    'cart.title': 'Tu carrito', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Tarjeta o Apple Pay', 'cart.wa': 'Pedir por WhatsApp',
    'cart.empty': 'Tu carrito está vacío.', 'cart.remove': 'Quitar', 'cart.added': 'Añadido al carrito',
    'cart.shipFree': 'Envío gratis a todo el país.', 'cart.ship': 'Envío', 'cart.shipFreeOver': 'Envío gratis en pedidos desde',
    'cart.noStripe': 'Pide por WhatsApp o mensaje de texto.', 'cart.sms': 'Enviar texto', 'ct.sms': 'Mensaje de texto', 'pay.confirmSms': 'Avisar por mensaje',
    'cart.err': 'No pudimos iniciar el pago. Inténtalo de nuevo o pide por WhatsApp.', 'cart.redirect': 'Redirigiendo a pago seguro', 'pm.ship': 'Envío a todo el país. Paga con Zelle o Venmo.', 'pm.drag': 'Arrastra para girar · 360°', 'pm.pack': 'Caja y frasco', 'pm.stock': 'Nuestro stock', 'pm.imgBy': 'Imagen:',
    'p.ask': 'Consultar precio', 'p.askBtn': 'Preguntar', 'p.add': 'Añadir', 'p.test': 'precio de prueba', 'p.view': 'Ver detalles',
    'p.added': 'Añadido', 'cart.accepts': 'Aceptamos', 'pay.venmoPhone': 'En Venmo, busca este número', 'nav.menu': 'Menú', 'brands.more': 'marcas',
    'pay.zelleTitle': 'Pagar con Zelle', 'pay.venmoTitle': 'Pagar con Venmo', 'pay.acTitle': 'Pagar con Apple Cash', 'pay.acHow': 'Solo iPhone. Abre Mensajes, escribe a este número, toca + y elige Apple Cash. Si tienes Android, usa Zelle o Venmo.', 'pay.openMsgs': 'Abrir Mensajes', 'wa.iam': 'Hola, soy', 'wa.thanks': 'Gracias.', 'pay.s1': 'Envías el pago', 'pay.s2': 'Te confirmamos por mensaje de texto', 'pay.s3': 'Enviamos tu pedido y te mandamos el rastreo',
    'pay.lead': 'Déjanos tus datos de envío. Después te mostramos cómo enviar el pago.',
    'pay.name': 'Nombre completo', 'pay.phone': 'Teléfono', 'pay.email': 'Correo (opcional)', 'pay.address': 'Dirección', 'pay.address2': 'Apartamento, suite (opcional)', 'pay.city': 'Ciudad', 'pay.state': 'Estado', 'pay.zip': 'ZIP',
    'pay.place': 'Hacer pedido', 'pay.err': 'Revisa tus datos: nombre, teléfono, dirección completa y un ZIP de 5 dígitos.', 'pay.errGeneric': 'No pudimos crear el pedido. Inténtalo de nuevo o escríbenos por WhatsApp.',
    'pay.doneTitle': 'Pedido recibido', 'pay.order': 'Pedido', 'pay.send': 'Envía exactamente', 'pay.via': 'por', 'pay.to': 'a', 'pay.note': 'En la nota escribe',
    'pay.copy': 'Copiar', 'pay.copied': 'Copiado', 'pay.openVenmo': 'Abrir Venmo', 'pay.confirm': 'Avisar por WhatsApp',
    'pay.next': 'Enviamos tu pedido en cuanto veamos el pago. Avísanos por WhatsApp cuando lo hagas.', 'pay.card': 'Pagar con tarjeta o Apple Pay',
    'wa.paid': 'acabo de enviar el pago de mi pedido.',
    'wa.hello': 'Hola, me gustaría hacer un pedido.', 'wa.ask': 'Hola, quiero información sobre', 'wa.order': 'Hola, me gustaría pedir:',
    'close': 'Cerrar',
    'g.men': 'Hombre', 'g.women': 'Mujer', 'g.unisex': 'Unisex',
  },
  en: {
    skip: 'Skip to shop',
    'nav.shop': 'Shop', 'nav.why': 'How it works', 'nav.reviews': 'Reviews', 'nav.contact': 'Contact',
    'hero.lead': 'Chanel, Dior, Yves Saint Laurent, Creed and Tom Ford from $80 a bottle. Pay with Zelle or Venmo. Order on WhatsApp or text.',
    'hero.wa': 'Order on WhatsApp',
    'p.sealed': 'Sealed', 'hero.see': 'View',
    'slide.0.title': 'For him', 'slide.0.lead': 'Sealed originals from $80 a bottle. Straight from one person.', 'slide.0.cta': 'Shop men',
    'slide.1.title': 'For her', 'slide.1.lead': 'Floral, fresh and sweet, sealed. From $80 a bottle.', 'slide.1.cta': 'Shop women',
    'slide.2.title': 'For everyone', 'slide.2.lead': 'Unisex scents from Tom Ford, Creed and more.', 'slide.2.cta': 'Shop unisex',
    'col.title': 'Shop by collection', 'col.cta': 'View collection', 'hero.tabs': 'Collections',
    'trust.1': 'Direct payment', 'trust.1d': 'Zelle or Venmo',
    'trust.2': 'Nationwide shipping', 'trust.2d': 'Straight to your door',
    'trust.3': 'Quality guaranteed', 'trust.3d': 'Perfumes in their box',
    'trust.4': 'Flat pricing', 'trust.4d': '$80 per bottle',
    'shop.title': 'All perfumes', 'shop.count1': 'perfume', 'shop.countN': 'perfumes', 'shop.empty': 'No fragrances match that filter.',
    'f.all': 'All', 'f.men': 'Men', 'f.women': 'Women', 'f.unisex': 'Unisex', 'f.search': 'Search', 'f.brands': 'All brands', 'f.title': 'Filter and sort', 'f.sort': 'Sort by', 'f.brand': 'Brand', 'f.conc': 'Concentration', 'f.clear': 'Clear all', 'f.show': 'Show', 'f.clearAll': 'Clear all',
    'sort.featured': 'Featured', 'sort.az': 'Name A–Z', 'sort.pa': 'Price: low to high', 'sort.pd': 'Price: high to low', 'sort.rating': 'Top rated',
    'why.title': 'How your order works',
    'why.lead': 'Choose, pay and get it at home. Every order is prepared with care and shipped protected.',
    'why.s1': 'Choose your fragrance', 'why.s1d': 'Browse the collection and find the scent that fits you.',
    'why.s2': 'Pay with Zelle or Venmo', 'why.s2d': 'Send the payment from your app and we ship as soon as we see it.',
    'why.s3': 'Get it at home', 'why.s3d': 'We ship nationwide, packed to arrive perfectly.',
    'rev.live': 'Live', 'rev.title': 'What our customers say',
    'rev.write': 'Leave a review', 'rev.product': 'Perfume', 'rev.general': 'Perfumes El Bro (general)', 'rev.rating': 'Your rating',
    'rev.name': 'Your name', 'rev.comment': 'Your opinion', 'rev.send': 'Post review',
    'rev.none': 'No reviews yet', 'rev.noneLong': 'Be the first to share your opinion. Your review appears instantly for everyone.',
    'rev.one': 'review', 'rev.many': 'reviews', 'rev.about': 'about',
    'rev.productReviews': 'Reviews for this perfume', 'rev.writeAbout': 'Write a review', 'rev.noneProduct': 'This perfume has no reviews yet.',
    'rev.errInvalid': 'Please add your name, a star rating and your opinion.', 'rev.errRate': 'Too many reviews in a row. Please try later.', 'rev.errGeneric': "We couldn't post your review. Please try again.",
    'rev.thanks': 'Thanks for your review', 'rev.newBy': 'New review from',
    'ct.title': 'Order on WhatsApp', 'ct.lead': 'Message us on WhatsApp for special orders, availability and help choosing your perfume.', 'ct.follow': 'Follow us', 'ct.owner': 'Run by',
    'foot.note': 'Brands mentioned belong to their respective owners.',
    'cart.title': 'Your cart', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Card or Apple Pay', 'cart.wa': 'Order on WhatsApp',
    'cart.empty': 'Your cart is empty.', 'cart.remove': 'Remove', 'cart.added': 'Added to cart',
    'cart.shipFree': 'Free shipping nationwide.', 'cart.ship': 'Shipping', 'cart.shipFreeOver': 'Free shipping on orders from',
    'cart.noStripe': 'Order on WhatsApp or text.', 'cart.sms': 'Text us', 'ct.sms': 'Text us', 'pay.confirmSms': 'Tell us by text',
    'cart.err': "We couldn't start checkout. Try again or order on WhatsApp.", 'cart.redirect': 'Redirecting to secure checkout', 'pm.ship': 'Shipping nationwide. Pay with Zelle or Venmo.', 'pm.drag': 'Drag to rotate · 360°', 'pm.pack': 'Box and bottle', 'pm.stock': 'Our stock', 'pm.imgBy': 'Image:',
    'p.ask': 'Ask for price', 'p.askBtn': 'Ask', 'p.add': 'Add', 'p.test': 'test price', 'p.view': 'View details',
    'p.added': 'Added', 'cart.accepts': 'We accept', 'pay.venmoPhone': 'In Venmo, search for this number', 'nav.menu': 'Menu', 'brands.more': 'brands',
    'pay.zelleTitle': 'Pay with Zelle', 'pay.venmoTitle': 'Pay with Venmo', 'pay.acTitle': 'Pay with Apple Cash', 'pay.acHow': 'iPhone only. Open Messages, start a chat with this number, tap + and choose Apple Cash. On Android, use Zelle or Venmo.', 'pay.openMsgs': 'Open Messages', 'wa.iam': 'Hello, this is', 'wa.thanks': 'Thank you.', 'pay.s1': 'You send the payment', 'pay.s2': 'We confirm by text message', 'pay.s3': 'We ship and text you the tracking number',
    'pay.lead': 'Leave your shipping details. Next we show you how to send the payment.',
    'pay.name': 'Full name', 'pay.phone': 'Phone', 'pay.email': 'Email (optional)', 'pay.address': 'Address', 'pay.address2': 'Apartment, suite (optional)', 'pay.city': 'City', 'pay.state': 'State', 'pay.zip': 'ZIP',
    'pay.place': 'Place order', 'pay.err': 'Check your details: name, phone, full address and a 5-digit ZIP.', 'pay.errGeneric': "We couldn't create the order. Try again or message us on WhatsApp.",
    'pay.doneTitle': 'Order received', 'pay.order': 'Order', 'pay.send': 'Send exactly', 'pay.via': 'with', 'pay.to': 'to', 'pay.note': 'In the note write',
    'pay.copy': 'Copy', 'pay.copied': 'Copied', 'pay.openVenmo': 'Open Venmo', 'pay.confirm': 'Tell us on WhatsApp',
    'pay.next': 'We ship as soon as we see the payment. Message us on WhatsApp once you have sent it.', 'pay.card': 'Pay by card or Apple Pay',
    'wa.paid': 'I just sent the payment for my order.',
    'wa.hello': "Hello, I'd like to place an order.", 'wa.ask': "Hi, I'd like information about", 'wa.order': "Hello, I'd like to order:",
    'close': 'Close',
    'g.men': 'Men', 'g.women': 'Women', 'g.unisex': 'Unisex',
  },
};
let lang = store.get('elbro.lang', null) || ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
if (!DICT[lang]) lang = 'es';
const t = k => DICT[lang][k] ?? DICT.es[k] ?? k;

function applyI18n() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  $('#langBtn').textContent = lang === 'es' ? 'EN' : 'ES';
  $('#cartBtn').setAttribute('aria-label', t('cart.title'));
  $('#pmClose').setAttribute('aria-label', t('close'));
  $('#drawerClose').setAttribute('aria-label', t('close'));
}

/* ---------------- state ---------------- */
let cfg = { currency: 'usd', locale: 'en-US', whatsapp: '', socials: {}, stripeEnabled: false, shippingCents: 0, freeShippingOverCents: 0 };
let products = [];
let byId = new Map();
let summary = { products: {}, total: 0, avg: 0 };
let reviews = [];
let cart = store.get('elbro.cart', {});
const filter = { g: 'all', brands: new Set(), concs: new Set(), sort: 'featured', q: '' };
const conc = p => /toilette/i.test(p.type) ? 'Eau de Toilette' : /eau de parfum/i.test(p.type) ? 'Eau de Parfum' : /parfum|elixir/i.test(p.type) ? 'Parfum' : null;
const CONC_ES = { 'Eau de Toilette': 'Eau de Toilette', 'Eau de Parfum': 'Eau de Parfum', 'Parfum': 'Parfum' };

const money = cents => new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fullName = p => `${p.brand} ${p.name}`;
const meta = p => [p.type, p.size].filter(Boolean).join(' · ');
const smsLink = text => `sms:+${cfg.whatsapp}?&body=${encodeURIComponent(text)}`;
const waLink = text => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;

function toast(msg) {
  const n = $('#toast');
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => n.classList.remove('show'), 2800);
}

/* ---------------- stars ---------------- */
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z';
function stars(avg) {
  const wrap = el('span', { class: 'stars', role: 'img', 'aria-label': `${avg} / 5` });
  for (let i = 1; i <= 5; i++) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    if (avg >= i - 0.25) s.classList.add('on');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', STAR);
    s.append(p);
    wrap.append(s);
  }
  return wrap;
}
const countLabel = n => `${n} ${n === 1 ? t('rev.one') : t('rev.many')}`;

/* ---------------- catalog ---------------- */
function featuredOrder(list) {
  const buckets = { men: [], women: [], unisex: [] };
  list.forEach(p => buckets[p.gender]?.push(p));
  const out = [];
  while (out.length < list.length) {
    for (const g of ['women', 'men', 'unisex']) { const n = buckets[g].shift(); if (n) out.push(n); }
  }
  return out;
}

function visibleProducts() {
  const q = norm(filter.q.trim());
  let list = products.filter(p =>
    (filter.g === 'all' || p.gender === filter.g) &&
    (!filter.brands.size || filter.brands.has(p.brand)) &&
    (!filter.concs.size || filter.concs.has(conc(p))) &&
    (!q || norm(`${p.brand} ${p.name} ${p.type}`).includes(q)));
  const priceOf = p => p.priceCents ?? Infinity;
  switch (filter.sort) {
    case 'az': list.sort((a, b) => fullName(a).localeCompare(fullName(b))); break;
    case 'priceAsc': list.sort((a, b) => priceOf(a) - priceOf(b)); break;
    case 'priceDesc': list.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1)); break;
    case 'rating': list.sort((a, b) => (summary.products[b.id]?.avg ?? 0) - (summary.products[a.id]?.avg ?? 0) || (summary.products[b.id]?.count ?? 0) - (summary.products[a.id]?.count ?? 0)); break;
    default: list = featuredOrder(list);
  }
  return list;
}

function priceBlock(p) {
  if (p.priceCents == null) return el('div', { class: 'price ask', text: t('p.ask') });
  return el('div', { class: 'price' }, money(p.priceCents), p.placeholder ? el('small', { text: t('p.test') }) : null);
}
function actionBtn(p, cls = 'add') {
  if (p.priceCents == null) return el('a', { class: cls, href: waLink(`${t('wa.ask')} ${fullName(p)}`), target: '_blank', rel: 'noopener', text: t('p.askBtn') });
  return el('button', { class: cls, type: 'button', dataset: { act: 'add', id: p.id }, text: t('p.add') });
}

function card(p, i) {
  const r = summary.products[p.id];
  const img = el('img', { src: p.thumb, alt: `${fullName(p)}${p.type ? ' ' + p.type : ''}`, width: 640, height: 1138, loading: i < 4 ? 'eager' : 'lazy', decoding: 'async' });
  const done = () => img.classList.add('loaded');
  img.addEventListener('load', done);
  if (img.complete) done();
  return el('article', { class: 'card', dataset: { reveal: '' }, style: `--i:${i % 4}` },
    el('button', { class: 'card-img', type: 'button', dataset: { act: 'open', id: p.id }, 'aria-label': `${t('p.view')}: ${fullName(p)}` },
      img, el('span', { class: 'seal', text: t('p.sealed') })),
    el('div', { class: 'card-body' },
      el('div', { class: 'card-brand', text: p.brand }),
      el('h3', { class: 'card-name', text: p.name }),
      el('div', { class: 'card-meta', text: [t('g.' + p.gender), meta(p)].filter(Boolean).join(' · ') }),
      el('div', { class: 'rating-mini' }, r ? [stars(r.avg), `${r.avg} (${r.count})`] : null),
      el('div', { class: 'card-foot' }, priceBlock(p), actionBtn(p))));
}

function renderGrid() {
  const list = visibleProducts();
  const grid = $('#grid');
  grid.replaceChildren(...list.map(card));
  $('#gridEmpty').hidden = list.length > 0;
  renderFilterUI();
  reveal();
  $('#resultCount').textContent = `${list.length} ${list.length === 1 ? t('shop.count1') : t('shop.countN')}`;
}

const SORTS = ['featured', 'az', 'priceAsc', 'priceDesc', 'rating'];
const SORT_KEY = { featured: 'sort.featured', az: 'sort.az', priceAsc: 'sort.pa', priceDesc: 'sort.pd', rating: 'sort.rating' };
const filterCount = () => filter.brands.size + filter.concs.size + (filter.sort !== 'featured' ? 1 : 0);

function countWith(pred) { // how many products match gender + search + the other facet, for the numbers in the panel
  const q = norm(filter.q.trim());
  return products.filter(p => (filter.g === 'all' || p.gender === filter.g) && (!q || norm(`${p.brand} ${p.name} ${p.type}`).includes(q)) && pred(p)).length;
}
function renderFilterPanel() {
  const opt = (kind, value, label, checked, n) => el('button', { class: 'f-opt' + (kind === 'sort' ? ' radio' : ''), type: 'button', role: kind === 'sort' ? 'radio' : 'checkbox', 'aria-checked': String(checked), dataset: { fk: kind, fv: value } },
    el('span', { class: 'box' }), el('span', { class: 'lbl', text: label }), n != null ? el('span', { class: 'n', text: String(n) }) : null);
  const brands = [...new Set(products.map(p => p.brand))].sort((a, b) => a.localeCompare(b));
  const concs = ['Parfum', 'Eau de Parfum', 'Eau de Toilette'].filter(c => products.some(p => conc(p) === c));
  $('#fBody').replaceChildren(
    el('section', { class: 'f-sec', role: 'radiogroup', 'aria-label': t('f.sort') }, el('h4', { text: t('f.sort') }), ...SORTS.map(s => opt('sort', s, t(SORT_KEY[s]), filter.sort === s))),
    el('section', { class: 'f-sec' }, el('h4', { text: t('f.brand') }), ...brands.map(b => opt('brand', b, b, filter.brands.has(b), countWith(p => p.brand === b && (!filter.concs.size || filter.concs.has(conc(p))))))),
    el('section', { class: 'f-sec' }, el('h4', { text: t('f.conc') }), ...concs.map(c => opt('conc', c, CONC_ES[c], filter.concs.has(c), countWith(p => conc(p) === c && (!filter.brands.size || filter.brands.has(p.brand)))))));
  const n = visibleProducts().length;
  $('#fShow').textContent = `${t('f.show')} ${n} ${n === 1 ? t('shop.count1') : t('shop.countN')}`;
  $('#fClear').hidden = filterCount() === 0;
}
function renderFilterUI() {
  const n = filterCount();
  $('#filterN').hidden = n === 0; $('#filterN').textContent = n;
  const box = $('#activeFilters');
  const tags = [
    ...[...filter.brands].map(b => ['brand', b, b]),
    ...[...filter.concs].map(c => ['conc', c, CONC_ES[c]]),
    ...(filter.sort !== 'featured' ? [['sort', 'featured', `${t('f.sort')}: ${t(SORT_KEY[filter.sort])}`]] : []),
  ];
  box.hidden = tags.length === 0;
  box.replaceChildren(...tags.map(([k, v, label]) => el('button', { class: 'tagx', type: 'button', dataset: { fk: k, fv: v, rm: '1' }, 'aria-label': `${t('remove') || 'Remove'} ${label}` }, label, el('b', { text: '×' }))),
    ...(tags.length > 1 ? [el('button', { class: 'link', type: 'button', id: 'fClearInline', text: t('f.clearAll') })] : []));
  if ($('#filterPanel').classList.contains('open')) renderFilterPanel();
}
function clearFilters() { filter.brands.clear(); filter.concs.clear(); filter.sort = 'featured'; renderGrid(); }

function renderReviewProductSelect() {
  const sel = $('#revProduct');
  const cur = sel.value;
  const opts = [...products].sort((a, b) => fullName(a).localeCompare(fullName(b)));
  sel.replaceChildren(el('option', { value: '', text: t('rev.general') }), ...opts.map(p => el('option', { value: p.id, text: fullName(p) })));
  sel.value = byId.has(cur) ? cur : '';
}

/* ---------------- product modal ---------------- */
let modalId = null;
function openProduct(id) {
  const p = byId.get(id);
  if (!p) return;
  modalId = id;
  const img = $('#pmImg');
  img.src = p.image;
  img.alt = fullName(p);
  initGallery(p);
  initViewer(p);
  $('#pmBrand').textContent = p.brand;
  $('#pmTitle').textContent = p.name;
  $('#pmMeta').textContent = [t('g.' + p.gender), meta(p)].filter(Boolean).join(' · ');
  renderModalDynamic();
  const d = $('#pModal');
  if (!d.open) d.showModal();
}
function renderModalDynamic() {
  if (!modalId) return;
  const p = byId.get(modalId);
  const r = summary.products[p.id];
  $('#pmRating').replaceChildren(...(r ? [stars(r.avg), el('span', { class: 'muted small', text: ` ${r.avg} · ${countLabel(r.count)}` })] : []));
  $('#pmPrice').replaceChildren(priceBlock(p));
  $('#pmActions').replaceChildren(actionBtn(p, 'btn btn-gold'));
  const list = reviews.filter(x => x.productId === p.id);
  $('#pmReviews').replaceChildren(...(list.length ? list.map(x => reviewCard(x, false)) : [el('p', { class: 'muted small', text: t('rev.noneProduct') })]));
}

function initGallery(p) {
  const thumbs = $('#pmThumbs'), credit = $('#pmCredit');
  stage.classList.remove('pack');
  const extra = (p.gallery || []).map((src, i) => ({ src, pack: false, label: `${fullName(p)} ${i + 2}` }));
  if (!p.pack && !extra.length) { thumbs.hidden = true; credit.hidden = true; return; }
  const views = [{ src: p.image, pack: false, label: t('pm.stock') }, ...(p.pack ? [{ src: p.pack.image, pack: true, label: t('pm.pack') }] : []), ...extra];
  thumbs.replaceChildren(...views.map((v, i) => el('button', { type: 'button', class: i === 0 ? 'is-on' : '', 'aria-label': v.label, onclick: e => {
    $('#pmImg').src = v.src; stage.classList.toggle('pack', v.pack); credit.hidden = !v.pack;
    $$('button', thumbs).forEach(b => b.classList.toggle('is-on', b === e.currentTarget));
  } }, el('img', { src: v.src, alt: '' }))));
  thumbs.hidden = false;
  credit.hidden = true;
  if (!p.pack) return;
  credit.replaceChildren(`${t('pm.imgBy')} `, el('a', { href: p.pack.url, target: '_blank', rel: 'noopener', text: p.pack.credit }), ` · ${p.pack.license}`);
}

/* ---------------- product viewer: 360 turntable, or 3D tilt for a single photo ---------------- */
const stage = $('#pmStage');
let viewer = null;
function stopViewer() {
  if (!viewer) return;
  clearInterval(viewer.timer);
  viewer.off.forEach(fn => fn());
  viewer = null;
  stage.classList.remove('spin', 'dragging');
  $('#pmHint').hidden = true;
  $('#pmImg').style.transform = '';
}
function initViewer(p) {
  stopViewer();
  const img = $('#pmImg');
  const frames = p.frames || [];
  const off = [];
  const on = (target, ev, fn, opts) => { target.addEventListener(ev, fn, opts); off.push(() => target.removeEventListener(ev, fn, opts)); };
  viewer = { off, timer: null };
  if (frames.length >= 2) {
    frames.forEach(src => { const i = new Image(); i.src = src; });
    let idx = 0, dragging = false, startX = 0, startIdx = 0;
    const show = i => { idx = ((i % frames.length) + frames.length) % frames.length; img.src = frames[idx]; };
    stage.classList.add('spin');
    const hint = $('#pmHint'); hint.textContent = t('pm.drag'); hint.hidden = false;
    show(0);
    const stopAuto = () => { clearInterval(viewer.timer); viewer.timer = null; };
    if (!reduceMotion) viewer.timer = setInterval(() => show(idx + 1), 110);
    on(stage, 'pointerdown', e => { dragging = true; startX = e.clientX; startIdx = idx; stopAuto(); stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId); });
    on(stage, 'pointermove', e => { if (!dragging) return; const step = stage.clientWidth / frames.length * 1.4; show(startIdx - Math.round((e.clientX - startX) / step)); });
    const end = () => { dragging = false; stage.classList.remove('dragging'); };
    on(stage, 'pointerup', end); on(stage, 'pointercancel', end);
    on(stage, 'keydown', e => { if (e.key === 'ArrowLeft') { stopAuto(); show(idx - 1); } else if (e.key === 'ArrowRight') { stopAuto(); show(idx + 1); } });
  } else if (!reduceMotion) {
    // one photo only: follow the pointer with a small 3D tilt
    on(stage, 'pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      img.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale(1.04)`;
    });
    on(stage, 'pointerleave', () => { img.style.transform = ''; });
  }
}

/* ---------------- reviews ---------------- */
function timeAgo(ts) {
  const diff = (ts - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(0, 'second');
}
function reviewCard(r, showProduct = true, isNew = false) {
  const p = r.productId ? byId.get(r.productId) : null;
  return el('article', { class: 'rev' + (isNew ? ' new' : ''), dataset: { rid: r.id } },
    el('div', { class: 'rev-top' },
      el('span', { class: 'rev-name', text: r.name }),
      stars(r.rating)),
    showProduct && p ? el('button', { class: 'rev-prod', type: 'button', dataset: { act: 'open', id: p.id }, text: `${t('rev.about')} ${fullName(p)}` }) : null,
    el('p', { text: r.comment }),
    el('time', { datetime: new Date(r.createdAt).toISOString(), text: timeAgo(r.createdAt) }));
}
function renderFeed(newId) {
  const feed = $('#revFeed');
  if (!reviews.length) {
    feed.replaceChildren(el('div', { class: 'rev-empty' }, el('b', { text: t('rev.none') }), el('p', { text: t('rev.noneLong') })));
    return;
  }
  feed.replaceChildren(...reviews.map(r => reviewCard(r, true, r.id === newId)));
}
function renderSummary() {
  $('#revSummary').hidden = !summary.total;
  $('#revAvg').textContent = summary.total ? summary.avg.toFixed(1) : '—';
  const s = $('#revStars');
  s.replaceChildren(...(summary.total ? [stars(summary.avg)] : []));
  s.removeAttribute('aria-hidden');
  $('#revCount').textContent = summary.total ? countLabel(summary.total) : t('rev.none');
}
function addReview(r) {
  if (reviews.some(x => x.id === r.id)) return false;
  reviews.unshift(r);
  reviews = reviews.slice(0, 60);
  summary.total += 1;
  summary.avg = Math.round(((summary.avg * (summary.total - 1) + r.rating) / summary.total) * 10) / 10;
  if (r.productId) {
    const cur = summary.products[r.productId] || { count: 0, avg: 0 };
    const count = cur.count + 1;
    summary.products[r.productId] = { count, avg: Math.round(((cur.avg * cur.count + r.rating) / count) * 10) / 10 };
  }
  return true;
}
async function refreshReviews() {
  const [list, sum] = await Promise.all([
    fetch('/api/reviews').then(r => r.json()),
    fetch('/api/reviews/summary').then(r => r.json()),
  ]);
  reviews = list; summary = sum;
}
function rerenderReviewViews(newId) {
  renderSummary(); renderFeed(newId); renderGrid(); renderModalDynamic();
}
function connectStream() {
  if (!('EventSource' in window)) return;
  const es = new EventSource('/api/reviews/stream');
  es.addEventListener('review', e => {
    const r = JSON.parse(e.data);
    if (addReview(r)) { rerenderReviewViews(r.id); toast(`${t('rev.newBy')} ${r.name}`); }
  });
  es.addEventListener('review-deleted', async () => { await refreshReviews(); rerenderReviewViews(); });
  let wasDown = false;
  es.onerror = () => { wasDown = true; };
  es.onopen = async () => { if (wasDown) { wasDown = false; await refreshReviews(); rerenderReviewViews(); } };
}

function buildRateInputs() {
  const box = $('#rateInputs');
  // reversed DOM order so the CSS sibling selector can light stars up to the hovered one
  for (let i = 5; i >= 1; i--) {
    const id = `rate${i}`;
    const svg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg>`;
    const input = el('input', { type: 'radio', name: 'rating', id, value: String(i) });
    const label = el('label', { for: id, title: `${i}/5` });
    label.innerHTML = svg + `<span class="sr" style="position:absolute;left:-9999px">${i}</span>`;
    box.append(input, label);
  }
}

async function submitReview(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const msg = $('#revMsg');
  const fd = new FormData(form);
  const body = { name: fd.get('name'), comment: fd.get('comment'), rating: Number(fd.get('rating')), productId: fd.get('productId') || null, website: fd.get('website') };
  if (!String(body.name).trim() || String(body.comment).trim().length < 3 || !body.rating) {
    msg.className = 'form-msg err'; msg.textContent = t('rev.errInvalid'); return;
  }
  const btn = $('button[type=submit]', form);
  btn.disabled = true;
  try {
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 429) { msg.className = 'form-msg err'; msg.textContent = t('rev.errRate'); return; }
    if (!res.ok) throw new Error(String(res.status));
    const r = await res.json();
    if (r.id && addReview(r)) rerenderReviewViews(r.id);
    form.reset();
    store.set('elbro.name', body.name);
    form.elements.name.value = body.name;
    msg.className = 'form-msg ok'; msg.textContent = t('rev.thanks');
  } catch {
    msg.className = 'form-msg err'; msg.textContent = t('rev.errGeneric');
  } finally { btn.disabled = false; }
}

/* ---------------- cart ---------------- */
const saveCart = () => store.set('elbro.cart', cart);
const cartLines = () => Object.entries(cart).map(([id, qty]) => ({ p: byId.get(id), qty })).filter(l => l.p && l.p.priceCents != null && l.qty > 0);
const cartCount = () => cartLines().reduce((n, l) => n + l.qty, 0);
const subtotal = () => cartLines().reduce((n, l) => n + l.p.priceCents * l.qty, 0);

function addToCart(id) {
  const p = byId.get(id);
  if (!p || p.priceCents == null) return;
  cart[id] = Math.min(10, (cart[id] || 0) + 1);
  saveCart(); renderCart(); toast(`${t('cart.added')}: ${fullName(p)}`);
  const cb = $('#cartBtn'); cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump');
}
function setQty(id, qty) {
  if (qty <= 0) delete cart[id]; else cart[id] = Math.min(10, qty);
  saveCart(); renderCart();
}

function renderCart() {
  const lines = cartLines();
  const n = cartCount();
  const badge = $('#cartCount');
  badge.hidden = n === 0;
  badge.textContent = n;
  $('#cartTotal').textContent = n ? money(subtotal()) : '';
  const box = $('#cartItems');
  if (!lines.length) box.replaceChildren(el('p', { class: 'cart-empty', text: t('cart.empty') }));
  else box.replaceChildren(...lines.map(({ p, qty }) => el('div', { class: 'ci' },
    el('img', { src: p.thumb, alt: '', width: 72, height: 88 }),
    el('div', {},
      el('b', { text: fullName(p) }),
      el('span', { class: 'muted', text: meta(p) }),
      el('div', { class: 'qty' },
        el('button', { type: 'button', 'aria-label': '−', dataset: { act: 'dec', id: p.id }, text: '−' }),
        el('span', { text: String(qty) }),
        el('button', { type: 'button', 'aria-label': '+', dataset: { act: 'inc', id: p.id }, text: '+' }))),
    el('div', { class: 'line' }, money(p.priceCents * qty),
      el('button', { class: 'rm', type: 'button', dataset: { act: 'rm', id: p.id }, text: t('cart.remove') })))));
  const sub = subtotal();
  $('#cartSub').textContent = money(sub);
  let note;
  if (cfg.shippingCents > 0) {
    note = `${t('cart.ship')}: ${money(cfg.shippingCents)}.`;
    if (cfg.freeShippingOverCents) note += ` ${t('cart.shipFreeOver')} ${money(cfg.freeShippingOverCents)}.`;
  } else note = t('cart.shipFree');
  $('#cartShipNote').textContent = note;
  const wa = $('#cartWa');
  wa.href = waLink(lines.length ? `${t('wa.order')}\n${lines.map(l => `• ${l.qty}× ${fullName(l.p)} ${l.p.size}`.trim()).join('\n')}\n${t('cart.subtotal')}: ${money(sub)}\n${t('wa.thanks')}` : t('wa.hello'));
  const smsText = lines.length ? `${t('wa.order')}\n${lines.map(l => `• ${l.qty}× ${fullName(l.p)} ${l.p.size}`.trim()).join('\n')}\n${t('cart.subtotal')}: ${money(sub)}\n${t('wa.thanks')}` : t('wa.hello');
  $('#cartSms').href = smsLink(smsText);
  $('#cartMsg').textContent = '';
  $('#cartMsg').className = 'form-msg';
  const pay = cfg.payments || {};
  $('#payZelle').hidden = !pay.zelle; $('#payVenmo').hidden = !pay.venmo; $('#payApple').hidden = !pay.applecash;
  $('#payAlt').hidden = !pay.zelle && !pay.venmo && !pay.applecash;
  $$('#payAlt button').forEach(b => { b.disabled = !lines.length; });
  const hasManual = !!(pay.zelle || pay.venmo || pay.applecash);
  $('#payAlt').classList.add('primary');
  const accepts = [pay.zelle && 'Zelle', pay.venmo && 'Venmo', pay.applecash && 'Apple Cash',].filter(Boolean);
  $('#cartAccepts').textContent = accepts.length ? `${t('cart.accepts')} ${accepts.join(' · ')}` : '';
  if (!cfg.stripeEnabled && !hasManual && lines.length) { $('#cartMsg').textContent = t('cart.noStripe'); }
}

async function checkout() {
  const btn = $('#checkoutBtn');
  const msg = $('#cartMsg');
  if (!cfg.stripeEnabled) { msg.className = 'form-msg err'; msg.textContent = t('cart.noStripe'); return; }
  btn.disabled = true;
  msg.className = 'form-msg'; msg.textContent = t('cart.redirect');
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartLines().map(l => ({ id: l.p.id, qty: l.qty })) }) });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || res.status);
    location.href = data.url;
  } catch {
    msg.className = 'form-msg err'; msg.textContent = t('cart.err'); btn.disabled = false;
  }
}

/* ---------------- Zelle / Venmo order ---------------- */
const payModal = $('#payModal'), payForm = $('#payForm'), payDone = $('#payDone');
let payMethod = null;
function openPay(method) {
  payMethod = method;
  $('#payTitle').textContent = t({ zelle: 'pay.zelleTitle', venmo: 'pay.venmoTitle', applecash: 'pay.acTitle' }[method]);
  $('#payLead').textContent = `${money(subtotal())} · ${t('pay.lead')}`;
  $('#payMsg').textContent = ''; $('#payMsg').className = 'form-msg';
  payForm.hidden = false; payDone.hidden = true;
  closeDrawer();
  payModal.showModal();
}
function copyBtn(text) {
  const b = el('button', { class: 'link', type: 'button', text: t('pay.copy') });
  b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(text); b.textContent = t('pay.copied'); setTimeout(() => { b.textContent = t('pay.copy'); }, 1500); } catch { /* clipboard blocked */ } });
  return b;
}
const isPhone = h => /^[\d+\-\s().]{7,}$/.test(h);
function showPayDone(o) {
  const amount = money(o.amountCents);
  const rows = [
    el('p', { class: 'pay-line' }, `${t('pay.send')} `, el('b', { text: amount }), ` ${t('pay.via')} ${{ zelle: 'Zelle', venmo: 'Venmo', applecash: 'Apple Cash' }[o.method]} ${t('pay.to')}`),
    el('div', { class: 'pay-code' }, el('b', { text: o.method === 'venmo' && !isPhone(o.handle) ? `@${o.handle}` : o.handle }), o.payee ? el('span', { class: 'muted', text: o.payee }) : null, copyBtn(o.handle)),
    el('p', { class: 'pay-line' }, `${t('pay.note')}:`),
    el('div', { class: 'pay-code' }, el('b', { text: o.id }), copyBtn(o.id)),
    o.method === 'venmo' && isPhone(o.handle) ? el('p', { class: 'muted small', text: t('pay.venmoPhone') }) : null,
    o.method === 'applecash' ? el('p', { class: 'muted small', text: t('pay.acHow') }) : null,
    o.method === 'applecash' ? el('a', { class: 'btn btn-gold block', href: `sms:+${cfg.whatsapp}`, text: t('pay.openMsgs') }) : null,
    o.method === 'venmo' && !isPhone(o.handle) ? el('a', { class: 'btn btn-gold block', target: '_blank', rel: 'noopener', href: `https://venmo.com/${encodeURIComponent(o.handle)}?txn=pay&amount=${(o.amountCents / 100).toFixed(2)}&note=${encodeURIComponent(o.id)}`, text: t('pay.openVenmo') }) : null,
    el('ol', { class: 'pay-steps' }, ...['pay.s1', 'pay.s2', 'pay.s3'].map(k => el('li', { text: t(k) }))),
    el('a', { class: 'btn btn-ghost block', target: '_blank', rel: 'noopener', href: waLink([`${t('wa.iam')} ${o.name}.`, t('wa.paid'), `${t('pay.order')} ${o.id}`, ...o.items.map(i => `• ${i.qty}× ${i.name}`), amount, t('wa.thanks')].join('\n')), text: t('pay.confirm') }),
    el('a', { class: 'btn btn-ghost block', href: smsLink([`${t('wa.iam')} ${o.name}.`, t('wa.paid'), `${t('pay.order')} ${o.id}`, amount, t('wa.thanks')].join('\n')), text: t('pay.confirmSms') }),
  ];
  payDone.replaceChildren(el('h3', { text: t('pay.doneTitle') }), el('p', { class: 'muted', text: `${t('pay.order')} ${o.id}` }), ...rows.filter(Boolean));
  payForm.hidden = true; payDone.hidden = false;
}
payForm.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#payMsg'), btn = $('#paySubmit');
  const customer = Object.fromEntries(new FormData(payForm));
  btn.disabled = true; msg.className = 'form-msg'; msg.textContent = '';
  try {
    const res = await fetch('/api/orders/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: payMethod, customer, items: cartLines().map(l => ({ id: l.p.id, qty: l.qty })) }) });
    const data = await res.json();
    if (res.status === 400 && data.error === 'invalid_customer') { msg.className = 'form-msg err'; msg.textContent = t('pay.err'); return; }
    if (!res.ok) throw new Error(data.error || res.status);
    cart = {}; saveCart(); renderCart();
    showPayDone(data);
  } catch {
    msg.className = 'form-msg err'; msg.textContent = t('pay.errGeneric');
  } finally { btn.disabled = false; }
});
$('#payClose').addEventListener('click', () => payModal.close());
payModal.addEventListener('click', e => { if (e.target === payModal) payModal.close(); });
$('#payAlt').addEventListener('click', e => { const b = e.target.closest('[data-method]'); if (b && !b.disabled) openPay(b.dataset.method); });

const drawer = $('#drawer'), scrim = $('#scrim');
function openDrawer() {
  scrim.hidden = false;
  drawer.removeAttribute('inert'); drawer.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => drawer.classList.add('open'));
  $('#drawerClose').focus();
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); drawer.setAttribute('inert', '');
  scrim.hidden = true;
  $('#cartBtn').focus();
}

/* ---------------- socials ---------------- */
const SOCIAL_LABEL = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube' };
function renderSocials() {
  const entries = Object.entries(cfg.socials);
  $('#socials').hidden = entries.length === 0;
  $('#socialList').replaceChildren(...entries.map(([k, url]) =>
    el('li', {}, el('a', { href: url, target: '_blank', rel: 'noopener me' }, SOCIAL_LABEL[k] || k))));
}

/* ---------------- wiring ---------------- */
function rerenderAll() {
  applyI18n();
  renderReviewProductSelect(); renderGrid();
  renderSummary(); renderFeed(); renderCart(); renderModalDynamic();
  if (modalId) { const p = byId.get(modalId); $('#pmMeta').textContent = [t('g.' + p.gender), meta(p)].filter(Boolean).join(' · '); }
  const hello = waLink(t('wa.hello'));
  $('#heroWa').href = hello; $('#waBig').href = hello; $('#smsBig').href = smsLink(t('wa.hello'));
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const { act, id } = b.dataset;
  if (act === 'add') { addToCart(id); if (b.tagName === 'BUTTON') { const card = b.closest('.card'); if (card) card.classList.add('sold'); b.textContent = t('p.added'); b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = t('p.add'); b.classList.remove('done'); if (card) card.classList.remove('sold'); }, 1400); } }
  else if (act === 'open') openProduct(id);
  else if (act === 'inc') setQty(id, (cart[id] || 0) + 1);
  else if (act === 'dec') setQty(id, (cart[id] || 0) - 1);
  else if (act === 'rm') setQty(id, 0);
});

$('#langBtn').addEventListener('click', () => { lang = lang === 'es' ? 'en' : 'es'; store.set('elbro.lang', lang); rerenderAll(); });
function setGender(g) {
  filter.g = g;
  $$('.chip').forEach(x => x.classList.toggle('is-on', x.dataset.g === g));
  renderGrid();
}
$('#genderChips').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  setGender(c.dataset.g);
});
// collection links (hero button and tiles) filter the shop, then the anchor scrolls to it
document.addEventListener('click', e => {
  const l = e.target.closest('[data-g]:not(.chip)'); if (!l) return;
  setGender(l.dataset.g);
});

/* ---------------- hero: each collection plays its video, then three spotlight photos, then the video again ---------------- */
const CATS = ['men', 'women', 'unisex'];
const VIDEO_MS = 5000, PHOTO_MS = 4500, FADE_MS = 1800;
const hero = $('.hero');
const heroVideos = $$('.hero-video');
const heroTabs = $$('#heroTabs button');
const heroSpot = $('#heroSpot');
const heroPill = $('#heroPill');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let cat = 0, step = 'video', photoIdx = 0, stepTimer = null, run = 0;
const spotProducts = () => (((cfg.spotlight || {})[CATS[cat]]) || []).map(id => byId.get(id)).filter(p => p && p.image);
const spotImgs = () => $$(`img[data-cat="${CATS[cat]}"]`, heroSpot);

// every collection's photos live in the page from the start, so switching tabs never reloads them.
// The current collection loads first; the others follow once it has settled.
function buildSpot() {
  const list = [];
  CATS.forEach(c => (((cfg.spotlight || {})[c]) || []).map(id => byId.get(id)).filter(p => p && p.image).forEach(p => list.push([c, p])));
  heroSpot.replaceChildren(...list.map(([c, p]) => el('img', { alt: '', width: 1200, height: 1960, decoding: 'async', dataset: { cat: c, src: p.image } })));
  loadSpot(CATS[cat]);
  setTimeout(() => CATS.forEach(loadSpot), 1500);
}
function loadSpot(c) {
  $$(`img[data-cat="${c}"]`, heroSpot).forEach(im => { if (!im.getAttribute('src')) im.src = im.dataset.src; });
}
const imgReady = (im, ms) => Promise.race([im.decode().then(() => true, () => false), new Promise(r => setTimeout(() => r(false), ms))]);
function showVideo(on) {
  heroVideos.forEach((v, n) => {
    const active = on && n === cat;
    v.classList.toggle('is-on', active);
    if (active) { v.preload = 'auto'; if (!reduceMotion) v.play().catch(() => {}); }
    else setTimeout(() => { if (!v.classList.contains('is-on')) v.pause(); }, FADE_MS + 60);
  });
}
function restartBar() {
  const total = VIDEO_MS + Math.max(spotProducts().length, 1) * PHOTO_MS;
  hero.style.setProperty('--slide', total + 'ms');
  heroTabs.forEach(b => { const bar = b.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; });
}
function fillPill(p) {
  heroPill.dataset.id = p.id;
  heroPill.classList.remove('swap'); void heroPill.offsetWidth; heroPill.classList.add('swap');
  heroPill.replaceChildren(
    el('span', { class: 'pill-name', text: fullName(p) }),
    p.priceCents == null ? null : el('span', { class: 'pill-price', text: money(p.priceCents) }),
    el('span', { class: 'pill-go', text: t('hero.see') }));
  heroPill.hidden = false;
}
function startVideo() {
  clearTimeout(stepTimer);
  const r = ++run;
  // coming back from the photos, the film is already opaque under them: show it at once and let the photos fade away
  if (hero.classList.contains('is-spot')) { hero.classList.add('vcut'); setTimeout(() => hero.classList.remove('vcut'), FADE_MS + 100); }
  step = 'video';
  hero.classList.remove('is-spot');
  $$('img', heroSpot).forEach(im => im.classList.remove('is-on'));
  showVideo(true);
  if (reduceMotion) { showPhoto(0); return; }
  restartBar();
  // the five seconds start when the film is really playing, not while it is still buffering
  const v = heroVideos[cat];
  const go = () => { if (r === run) stepTimer = setTimeout(startPhotos, VIDEO_MS); };
  if (v.readyState >= 3 && !v.paused) go();
  else { v.addEventListener('playing', go, { once: true }); stepTimer = setTimeout(go, 2500); }
}
async function startPhotos() {
  const r = run;
  const imgs = spotImgs();
  if (!imgs.length) { stepTimer = setTimeout(startPhotos, 500); return; }
  loadSpot(CATS[cat]);
  // only cross over once the first photo is decoded; until then the film keeps playing
  const ok = await imgReady(imgs[0], 1500);
  if (r !== run) return;
  if (!ok) { stepTimer = setTimeout(startPhotos, 800); return; }
  step = 'photos';
  // the first photo appears at once; the whole layer fades in over the film
  hero.classList.add('spot-cut'); setTimeout(() => hero.classList.remove('spot-cut'), FADE_MS + 100);
  showVideo(false);
  hero.classList.add('is-spot');
  showPhoto(0);
}
function showPhoto(i) {
  clearTimeout(stepTimer);
  const imgs = spotImgs(), list = spotProducts();
  if (!imgs.length) return;
  photoIdx = i;
  imgs.forEach((im, n) => {
    if (n === i) { im.classList.remove('kb'); void im.offsetWidth; im.classList.add('kb', 'is-on'); }
    else { im.classList.remove('is-on'); setTimeout(() => { if (!im.classList.contains('is-on')) im.classList.remove('kb'); }, FADE_MS + 250); }
  });
  // the label changes at the midpoint of the photo crossfade, not before it
  const r = run;
  if (reduceMotion) fillPill(list[i]); else setTimeout(() => { if (r === run && step === 'photos') fillPill(list[i]); }, FADE_MS / 2);
  imgs[i + 1]?.decode?.().catch(() => {});
  if (reduceMotion) { hero.classList.add('is-spot'); return; }
  stepTimer = setTimeout(() => (i + 1 < imgs.length ? showPhoto(i + 1) : startVideo()), PHOTO_MS);
}
function setCat(i) {
  cat = (i + CATS.length) % CATS.length;
  hero.dataset.cat = CATS[cat];
  heroTabs.forEach((b, n) => { b.classList.toggle('is-on', n === cat); b.setAttribute('aria-selected', n === cat ? 'true' : 'false'); });
  $('#heroTitle').dataset.i18n = `slide.${cat}.title`;
  $('#heroLead').dataset.i18n = `slide.${cat}.lead`;
  const cta = $('#heroCta'); cta.dataset.i18n = `slide.${cat}.cta`; cta.dataset.g = CATS[cat];
  $('#heroTitle').textContent = t(`slide.${cat}.title`);
  $('#heroLead').textContent = t(`slide.${cat}.lead`);
  cta.textContent = t(`slide.${cat}.cta`);
  if (typeof heroIn === 'function') heroIn();
  heroPill.hidden = true;
  loadSpot(CATS[cat]);
  startVideo();
}
function pauseHero() { run++; hero.classList.add('paused'); clearTimeout(stepTimer); }
function resumeHero() { hero.classList.remove('paused'); if (reduceMotion) return; if (step === 'video') startVideo(); else showPhoto(photoIdx); }
heroTabs.forEach(b => b.addEventListener('click', () => setCat(Number(b.dataset.slide))));
if (matchMedia('(hover: hover)').matches) { hero.addEventListener('mouseenter', pauseHero); hero.addEventListener('mouseleave', resumeHero); }
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseHero(); else resumeHero(); });
function heroSpotReady() { buildSpot(); if (reduceMotion && step === 'video') showPhoto(0); }
startVideo();

/* collection tiles play on hover or focus */
$$('.col-tile').forEach(tile => {
  const v = $('video', tile);
  const play = () => { if (!reduceMotion) v.play().catch(() => {}); };
  tile.addEventListener('mouseenter', play); tile.addEventListener('focus', play);
  tile.addEventListener('mouseleave', () => v.pause()); tile.addEventListener('blur', () => v.pause());
});

/* scroll reveal: one short fade and rise per element, once */
const revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;
function reveal(root = document) {
  $$('[data-reveal]:not(.seen)', root).forEach(n => { n.classList.add('seen'); if (revealIO) revealIO.observe(n); else n.classList.add('in'); });
}
$$('.section-head, .trust-grid > div, .col-tile, .steps li, .rev-side > *, .contact-card, .why-grid > div:first-child').forEach((n, i) => { n.dataset.reveal = ''; n.style.setProperty('--i', String(i % 4)); });
reveal();

/* mobile menu */
const header = $('.site-header');
const menuBtn = $('#menuBtn'), nav = $('.nav');
function setMenu(open) { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); header.classList.toggle('menu-open', open); }
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
addEventListener('resize', () => { if (innerWidth > 960) setMenu(false); });

/* hero copy: rise in once per slide */
const heroCopy = $('.hero-copy');
function heroIn() { heroCopy.classList.remove('rise'); void heroCopy.offsetWidth; heroCopy.classList.add('rise'); }
heroIn();

/* header: clear over the hero, solid once scrolled */
const onScroll = () => header.classList.toggle('is-top', scrollY < 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
// filter and sort panel
const fPanel = $('#filterPanel'), fScrim = $('#fScrim');
function openFilters() { renderFilterPanel(); fScrim.hidden = false; fPanel.removeAttribute('inert'); fPanel.setAttribute('aria-hidden', 'false'); requestAnimationFrame(() => fPanel.classList.add('open')); $('#fClose').focus(); }
function closeFilters() { fPanel.classList.remove('open'); fPanel.setAttribute('aria-hidden', 'true'); fPanel.setAttribute('inert', ''); fScrim.hidden = true; $('#filterBtn').focus(); }
$('#filterBtn').addEventListener('click', openFilters);
$('#fClose').addEventListener('click', closeFilters); fScrim.addEventListener('click', closeFilters); $('#fShow').addEventListener('click', closeFilters);
$('#fClear').addEventListener('click', clearFilters);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && fPanel.classList.contains('open')) closeFilters(); });
document.addEventListener('click', e => {
  if (e.target.id === 'fClearInline') { clearFilters(); return; }
  const b = e.target.closest('[data-fk]'); if (!b) return;
  const { fk, fv, rm } = b.dataset;
  if (fk === 'sort') filter.sort = fv;
  else { const set = fk === 'brand' ? filter.brands : filter.concs; if (rm || set.has(fv)) set.delete(fv); else set.add(fv); }
  renderGrid();
});
$('#searchInp').addEventListener('input', e => { filter.q = e.target.value; renderGrid(); });
$('#revForm').addEventListener('submit', submitReview);

$('#cartBtn').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

const modal = $('#pModal');
$('#pmClose').addEventListener('click', () => modal.close());
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
modal.addEventListener('close', () => { modalId = null; stopViewer(); });
$('#pmWrite').addEventListener('click', () => {
  const id = modalId;
  modal.close();
  $('#revProduct').value = id || '';
  $('#reviews').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#revForm').elements.name.focus({ preventScroll: true }), 500);
});

/* ---------------- boot ---------------- */
async function boot() {
  $('#yr').textContent = new Date().getFullYear();
  buildRateInputs();
  applyI18n();
  const savedName = store.get('elbro.name', '');
  if (savedName) $('#revForm').elements.name.value = savedName;

  const [c, prods] = await Promise.all([
    fetch('/api/config').then(r => r.json()),
    fetch('/api/products').then(r => r.json()),
  ]);
  cfg = c; products = prods; byId = new Map(prods.map(p => [p.id, p]));
  heroSpotReady();
  const counts = new Map(); for (const p of products) counts.set(p.brand, (counts.get(p.brand) || 0) + 1);
  const brands = [...counts].sort((x, y) => y[1] - x[1]).map(x => x[0]);
  const shown = brands.slice(0, 6);
  $('#ticker').replaceChildren(...shown.map((b, i) => el('span', { text: b, dataset: { reveal: '' }, style: `--i:${i}` })),
    el('a', { href: '#shop', class: 'more', dataset: { reveal: '' }, style: `--i:${shown.length}`, text: `+${brands.length - shown.length} ${t('brands.more')}` }));
  reveal();
  $('#ownerName').textContent = cfg.owner || '';
  for (const id of ['ownerEmail', 'footEmail']) { const a = $('#' + id); a.textContent = cfg.email || ''; a.href = cfg.email ? `mailto:${cfg.email}` : '#'; a.hidden = !cfg.email; }
  $('#waBigNum').textContent = cfg.whatsappDisplay || 'WhatsApp';
  // drop cart lines for products that disappeared or lost their price
  for (const id of Object.keys(cart)) if (!byId.get(id) || byId.get(id).priceCents == null) delete cart[id];
  saveCart();
  renderSocials();
  try { await refreshReviews(); } catch { /* reviews optional */ }
  rerenderAll();
  connectStream();
}
boot().catch(err => { console.error(err); toast('Error loading the store'); });

// Re-label relative times once a minute
setInterval(() => { if (reviews.length) renderFeed(); }, 60000);
