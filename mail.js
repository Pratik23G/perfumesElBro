// Order emails: a notice to the owner and a receipt to the guest, sent through Gmail (SMTP + app password).
// Nothing here may break an order: every failure is logged and swallowed.
import nodemailer from 'nodemailer';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = c => '$' + (c / 100).toFixed(c % 100 ? 2 : 0);
const digits = s => String(s || '').replace(/\D/g, '');
const waPhone = s => (digits(s).length === 10 ? '1' : '') + digits(s);

const user = (process.env.SMTP_USER || '').trim();
const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const dryRun = process.env.MAIL_DRY_RUN === '1';
export const mailEnabled = dryRun || !!(user && pass);
const transport = !mailEnabled ? null : dryRun
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass }, connectionTimeout: 6000, greetingTimeout: 6000, socketTimeout: 8000 });

const L = {
  es: {
    subject: id => `Recibimos tu pedido ${id} | Perfumes El Bro`,
    hi: n => `Hola ${n},`,
    thanks: 'Gracias por tu pedido. Esto es lo que pediste:',
    total: 'Total',
    order: 'Pedido',
    pay: { zelle: (h, p, id) => `Para apartarlo, envía el pago por Zelle a ${h}${p ? ` (${p})` : ''} y escribe ${id} en la nota.`,
           applecash: (h, p, id) => `Para apartarlo, envía el pago por Apple Cash a ${h} y escribe ${id} en la nota.`,
           cash: () => 'Pagas en efectivo cuando Alex te entregue tu pedido.', venmo: (h, p, id) => `Envía el pago por Venmo a ${h} y escribe ${id} en la nota.` },
    next: 'Alex te escribirá para coordinar la entrega. Si tienes dudas o quieres más fotos del perfume, escríbele por WhatsApp:',
    bye: 'Gracias por elegir Perfumes El Bro.',
  },
  en: {
    subject: id => `We received your order ${id} | Perfumes El Bro`,
    hi: n => `Hello ${n},`,
    thanks: 'Thank you for your order. Here is what you ordered:',
    total: 'Total',
    order: 'Order',
    pay: { zelle: (h, p, id) => `To reserve it, send the payment by Zelle to ${h}${p ? ` (${p})` : ''} and write ${id} in the note.`,
           applecash: (h, p, id) => `To reserve it, send the payment by Apple Cash to ${h} and write ${id} in the note.`,
           cash: () => 'You pay in cash when Alex hands you your order.', venmo: (h, p, id) => `Send the payment by Venmo to ${h} and write ${id} in the note.` },
    next: 'Alex will message you to arrange delivery. If you have questions or want more photos of the perfume, message him on WhatsApp:',
    bye: 'Thank you for choosing Perfumes El Bro.',
  },
};
const METHOD = { zelle: 'Zelle', applecash: 'Apple Cash', cash: 'Cash', venmo: 'Venmo' };
const first = n => String(n || '').trim().split(/\s+/)[0] || '';

function wrap(inner) {
  return `<div style="font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1b1814;max-width:560px;margin:0 auto;padding:24px">${inner}</div>`;
}
const itemsHtml = items => `<ul style="padding-left:18px;margin:8px 0">${items.map(i => `<li>${esc(i.qty)} × ${esc(i.name)}</li>`).join('')}</ul>`;
const itemsText = items => items.map(i => `• ${i.qty}× ${i.name}`).join('\n');

function guestMail(o, cfg) {
  const t = L[o.lang] || L.es;
  const payLine = (t.pay[o.method] || t.pay.cash)(o.handle, o.payee, o.id);
  const wa = `https://wa.me/${cfg.whatsapp}`;
  const text = [t.hi(first(o.name)), '', t.thanks, itemsText(o.items), '', `${t.total}: ${money(o.totalCents)}`, `${t.order}: ${o.id}`, '', payLine, '', `${t.next} ${cfg.whatsappDisplay} ${wa}`, '', t.bye].join('\n');
  const html = wrap(`<p>${esc(t.hi(first(o.name)))}</p><p>${esc(t.thanks)}</p>${itemsHtml(o.items)}
    <p><b>${esc(t.total)}: ${esc(money(o.totalCents))}</b><br>${esc(t.order)}: <b>${esc(o.id)}</b></p>
    <p>${esc(payLine)}</p><p>${esc(t.next)} <a href="${esc(wa)}">${esc(cfg.whatsappDisplay)}</a></p><p style="color:#6b6458">${esc(t.bye)}</p>`);
  return { to: o.email, subject: t.subject(o.id), text, html, replyTo: cfg.ownerEmail };
}

function ownerMail(o, cfg) {
  const addr = [o.address1, o.address2, `${o.city}, ${o.state} ${o.zip}`].filter(Boolean).join(', ');
  const msg = `Hello ${first(o.name)}, this is ${cfg.owner} from Perfumes El Bro. I received your order ${o.id}. I will message you to arrange the delivery.`;
  const wa = `https://wa.me/${waPhone(o.phone)}?text=${encodeURIComponent(msg)}`;
  const sms = `sms:+${waPhone(o.phone)}?&body=${encodeURIComponent(msg)}`;
  const method = METHOD[o.method] || o.method;
  const text = [`New order ${o.id}`, `${money(o.totalCents)} · ${method}`, '', itemsText(o.items), '', `${o.name}`, `Phone: ${o.phone}`, o.email ? `Email: ${o.email}` : 'Email: not given', `Address: ${addr}`, '', `WhatsApp: ${wa}`, `Text: ${sms}`, '', 'When the payment arrives, mark the order as paid in the Pedidos app.'].join('\n');
  const html = wrap(`<h2 style="margin:0 0 4px">New order ${esc(o.id)}</h2><p style="margin:0 0 12px;color:#6b6458">${esc(money(o.totalCents))} · ${esc(method)}</p>${itemsHtml(o.items)}
    <p><b>${esc(o.name)}</b><br>Phone: <a href="tel:+${esc(waPhone(o.phone))}">${esc(o.phone)}</a><br>${o.email ? `Email: ${esc(o.email)}<br>` : ''}${esc(addr)}</p>
    <p><a href="${esc(wa)}" style="display:inline-block;padding:10px 16px;background:#1b1814;color:#fff;border-radius:999px;text-decoration:none">WhatsApp ${esc(first(o.name))}</a>
    <a href="${esc(sms)}" style="display:inline-block;padding:10px 16px;border:1px solid #1b1814;color:#1b1814;border-radius:999px;text-decoration:none;margin-left:6px">Text</a></p>
    <p style="color:#6b6458">When the payment arrives, mark the order as paid in the Pedidos app.</p>`);
  return { to: cfg.ownerEmail, subject: `New order ${o.id} · ${money(o.totalCents)} · ${method}`, text, html, ...(o.email ? { replyTo: o.email } : {}) };
}

async function send(kind, mail) {
  try {
    const info = await transport.sendMail({ from: `"Perfumes El Bro" <${user || cfgFallbackFrom}>`, replyTo: mail.replyTo || process.env.OWNER_EMAIL, ...mail });
    if (dryRun) console.log(`[mail:dry] ${kind} to ${mail.to}\n${JSON.parse(info.message).subject}`);
    return true;
  } catch (err) {
    console.error(`[mail] ${kind} failed:`, err.message);
    return false;
  }
}
const cfgFallbackFrom = 'orders@localhost';

// Sends both emails. Resolves { owner, guest } (true when sent). Never throws, and gives up after 10 s.
export async function sendOrderEmails(order, cfg) {
  if (!mailEnabled || !cfg.ownerEmail) return { owner: false, guest: false };
  const jobs = [send('owner', ownerMail(order, cfg))];
  if (order.email) jobs.push(send('guest', guestMail(order, cfg)));
  const race = Promise.race([Promise.all(jobs), new Promise(r => setTimeout(() => r([false, false]), 10000))]);
  const [owner, guest = false] = await race;
  return { owner, guest };
}
