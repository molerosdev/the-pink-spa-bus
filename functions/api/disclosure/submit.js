// Cloudflare Pages Function — POST /api/disclosure/submit
// Creates a new disclosure record in D1 and emails via Resend.
//
// Required env vars (Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY   secret, e.g. re_xxx
//   MAIL_FROM        verified sender, e.g. "The Pink Spa Bus <forms@thepinkspabus.com>"
//   DB               D1 binding (configured in wrangler.toml)
//
// TODO: Add Cloudflare Turnstile bot protection once the site token is provisioned.
// TODO: Rate limiting — currently relies on Cloudflare DDoS protection. For stricter
//       enforcement, add a rate_limits table in D1 and check submissions per IP/email
//       in a sliding 10-minute window.

import { buildPDF } from './_pdf.js';
import { companyHtml, customerHtml } from './_email.js';
import { norm, esc, genToken, uint8ToB64 } from './_helpers.js';

async function sendEmail(apiKey, body) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return Response.json({ ok: false, error: 'Database not configured.' }, { status: 500 });
  if (!env.RESEND_API_KEY) return Response.json({ ok: false, error: 'Email not configured.' }, { status: 500 });

  let p;
  try { p = await request.json(); } catch { return Response.json({ ok: false, error: 'Bad JSON' }, { status: 400 }); }

  // Validate required fields
  const email = norm(p.customer_email);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Invalid email.' }, { status: 400 });
  }
  if (!p.parent_name || !p.event_date || !p.phone || !p.event_address) {
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
  }
  if (!p.waiver_accepted) {
    return Response.json({ ok: false, error: 'Waiver must be accepted.' }, { status: 400 });
  }
  if (!p.signer_name) {
    return Response.json({ ok: false, error: 'Signer name required.' }, { status: 400 });
  }
  if (!p.signature_b64) {
    return Response.json({ ok: false, error: 'Signature required.' }, { status: 400 });
  }

  const children = Array.isArray(p.children) ? p.children.slice(0, 20) : [];
  if (children.length === 0) {
    return Response.json({ ok: false, error: 'At least one child required.' }, { status: 400 });
  }

  // Duplicate check
  const existing = await env.DB
    .prepare('SELECT ref_number, edit_token FROM disclosures WHERE customer_email=? AND event_date=?')
    .bind(email, p.event_date)
    .first();
  if (existing) {
    return Response.json(
      { ok: false, duplicate: true, error: 'A disclosure already exists for this email and event date. Check your email for the edit link.' },
      { status: 409 }
    );
  }

  // Create record
  const token = genToken();
  const now = new Date().toISOString();
  const year = now.slice(0, 4);

  const childrenJson = JSON.stringify(
    children.map(c => ({
      name: String(c.name || '').slice(0, 100).trim(),
      age: String(c.age || '').slice(0, 3),
      allergies: String(c.allergies || '').slice(0, 400).trim(),
      medical: String(c.medical || '').slice(0, 400).trim(),
      special: String(c.special || '').slice(0, 400).trim()
    }))
  );

  const emergencyJson = JSON.stringify({
    name: String(p.emergency_name || '').slice(0, 200).trim(),
    relationship: String(p.emergency_relationship || '').slice(0, 100).trim(),
    phone: String(p.emergency_phone || '').slice(0, 40).trim()
  });

  const inserted = await env.DB.prepare(
    `INSERT INTO disclosures
       (ref_number, edit_token, customer_email, event_date, parent_name, phone, event_address,
        children_count, children_json, emergency_json, waiver_accepted, signer_name, sig_date,
        signature_b64, initial_email_sent, customer_email_sent, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?,?)`
  ).bind(
    'PENDING', token, email,
    String(p.event_date).slice(0, 20),
    String(p.parent_name).slice(0, 200).trim(),
    String(p.phone || '').slice(0, 40).trim(),
    String(p.event_address || '').slice(0, 400).trim(),
    children.length,
    childrenJson,
    emergencyJson,
    1,
    String(p.signer_name || '').slice(0, 200).trim(),
    String(p.sig_date || '').slice(0, 20),
    String(p.signature_b64 || '').slice(0, 200000),
    now, now
  ).run();

  const id = inserted.meta.last_row_id;
  const refNumber = `TPS-DISC-${year}-${String(id).padStart(6, '0')}`;
  await env.DB.prepare('UPDATE disclosures SET ref_number=? WHERE id=?').bind(refNumber, id).run();

  // Fetch back full record
  const rec = await env.DB.prepare('SELECT * FROM disclosures WHERE id=?').bind(id).first();
  rec.ref_number = refNumber;

  const origin = new URL(request.url).origin;
  const editUrl = `${origin}/disclosure.html?edit=${token}`;

  // Generate PDF
  let pdfBytes = null;
  try { pdfBytes = await buildPDF(rec, origin, false); } catch (e) { console.error('PDF error', e); }

  const from = env.MAIL_FROM || 'The Pink Spa Bus <forms@thepinkspabus.com>';
  const pdfB64 = pdfBytes ? uint8ToB64(new Uint8Array(pdfBytes)) : null;
  const filename = `The-Pink-Spa-Bus-Disclosure-${refNumber}.pdf`;

  // Company email
  const companyBody = {
    from,
    to: ['info@thepinkspabus.com'],
    bcc: ['thepinkspabus@gmail.com'],
    reply_to: email,
    subject: `New Disclosure Form — ${p.parent_name} — ${p.event_date} — ${refNumber}`,
    html: companyHtml(rec, false, origin)
  };
  if (pdfB64) companyBody.attachments = [{ filename, content: pdfB64 }];

  // Customer email
  const customerBody = {
    from,
    to: [email],
    reply_to: 'info@thepinkspabus.com',
    subject: `Your Pink Spa Bus Disclosure — ${p.event_date} — ${refNumber}`,
    html: customerHtml(rec, editUrl)
  };
  if (pdfB64) customerBody.attachments = [{ filename, content: pdfB64 }];

  const [companySent, customerSent] = await Promise.all([
    sendEmail(env.RESEND_API_KEY, companyBody),
    sendEmail(env.RESEND_API_KEY, customerBody)
  ]);
  if (companySent) await env.DB.prepare('UPDATE disclosures SET initial_email_sent=1 WHERE id=?').bind(id).run();
  if (customerSent) await env.DB.prepare('UPDATE disclosures SET customer_email_sent=1 WHERE id=?').bind(id).run();

  return Response.json({ ok: true, refNumber, editToken: token, customerEmailSent: customerSent });
}

export async function onRequestGet() {
  return new Response('The Pink Spa Bus disclosure submit endpoint. POST JSON here.', { status: 405 });
}
