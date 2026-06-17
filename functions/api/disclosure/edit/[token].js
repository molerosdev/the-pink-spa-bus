// Cloudflare Pages Function — GET + POST /api/disclosure/edit/:token
//
// GET  → return safe fields so the frontend can pre-fill the edit form
// POST → validate + update D1 + regenerate PDF + send update emails

import { buildPDF } from '../_pdf.js';
import { companyHtml, customerUpdateHtml } from '../_email.js';
import { norm, uint8ToB64 } from '../_helpers.js';

// Safe fields to return on GET (no raw signature for security on initial load — it is included
// so the customer sees their existing sig when editing; only they possess the token).
const SAFE_FIELDS = [
  'ref_number', 'customer_email', 'event_date', 'parent_name', 'phone',
  'event_address', 'children_json', 'emergency_json', 'signer_name',
  'sig_date', 'signature_b64', 'children_count'
];

async function sendEmail(apiKey, body) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok;
}

// GET /api/disclosure/edit/:token — load existing disclosure for editing
export async function onRequestGet({ params, env }) {
  if (!env.DB) return Response.json({ ok: false, error: 'Database not configured.' }, { status: 500 });
  const token = params.token;
  if (!token || token.length < 10) return Response.json({ ok: false, error: 'Invalid token.' }, { status: 400 });

  const rec = await env.DB
    .prepare('SELECT * FROM disclosures WHERE edit_token=?')
    .bind(token)
    .first();

  if (!rec) return Response.json({ ok: false, error: 'Disclosure not found or link has expired.' }, { status: 404 });

  // Build safe response
  const out = { ok: true };
  SAFE_FIELDS.forEach(f => { out[f] = rec[f]; });

  // Parse JSON fields for convenience
  try { out.children = JSON.parse(rec.children_json || '[]'); } catch (_) { out.children = []; }
  try { out.emergency = JSON.parse(rec.emergency_json || '{}'); } catch (_) { out.emergency = {}; }

  return Response.json(out);
}

// POST /api/disclosure/edit/:token — save updated disclosure
export async function onRequestPost({ request, params, env }) {
  if (!env.DB) return Response.json({ ok: false, error: 'Database not configured.' }, { status: 500 });
  if (!env.RESEND_API_KEY) return Response.json({ ok: false, error: 'Email not configured.' }, { status: 500 });

  const token = params.token;
  if (!token || token.length < 10) return Response.json({ ok: false, error: 'Invalid token.' }, { status: 400 });

  // Look up existing record
  const existing = await env.DB
    .prepare('SELECT * FROM disclosures WHERE edit_token=?')
    .bind(token)
    .first();
  if (!existing) return Response.json({ ok: false, error: 'Disclosure not found or link has expired.' }, { status: 404 });

  let p;
  try { p = await request.json(); } catch { return Response.json({ ok: false, error: 'Bad JSON' }, { status: 400 }); }

  // Validate
  if (!p.parent_name || !p.event_date || !p.phone || !p.event_address) {
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
  }
  if (!p.signer_name) return Response.json({ ok: false, error: 'Signer name required.' }, { status: 400 });
  if (!p.signature_b64) return Response.json({ ok: false, error: 'Signature required.' }, { status: 400 });

  const children = Array.isArray(p.children) ? p.children.slice(0, 20) : [];
  if (children.length === 0) return Response.json({ ok: false, error: 'At least one child required.' }, { status: 400 });

  const now = new Date().toISOString();

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

  await env.DB.prepare(
    `UPDATE disclosures SET
       parent_name=?, phone=?, event_address=?, event_date=?,
       children_count=?, children_json=?, emergency_json=?,
       signer_name=?, sig_date=?, signature_b64=?, updated_at=?
     WHERE edit_token=?`
  ).bind(
    String(p.parent_name).slice(0, 200).trim(),
    String(p.phone || '').slice(0, 40).trim(),
    String(p.event_address || '').slice(0, 400).trim(),
    String(p.event_date).slice(0, 20),
    children.length,
    childrenJson,
    emergencyJson,
    String(p.signer_name || '').slice(0, 200).trim(),
    String(p.sig_date || '').slice(0, 20),
    String(p.signature_b64 || '').slice(0, 200000),
    now,
    token
  ).run();

  // Fetch updated record
  const rec = await env.DB.prepare('SELECT * FROM disclosures WHERE edit_token=?').bind(token).first();

  const origin = new URL(request.url).origin;
  const editUrl = `${origin}/disclosure.html?edit=${token}`;

  // Generate PDF
  let pdfBytes = null;
  try { pdfBytes = await buildPDF(rec, origin, true); } catch (e) { console.error('PDF error', e); }

  const from = env.MAIL_FROM || 'The Pink Spa Bus <forms@thepinkspabus.com>';
  const pdfB64 = pdfBytes ? uint8ToB64(new Uint8Array(pdfBytes)) : null;
  const filename = `The-Pink-Spa-Bus-Disclosure-${rec.ref_number}-Updated.pdf`;

  const companyBody = {
    from,
    to: ['info@thepinkspabus.com'],
    bcc: ['thepinkspabus@gmail.com'],
    reply_to: existing.customer_email,
    subject: `Updated Disclosure — ${rec.parent_name} — ${rec.event_date} — ${rec.ref_number}`,
    html: companyHtml(rec, true, origin)
  };
  if (pdfB64) companyBody.attachments = [{ filename, content: pdfB64 }];

  const customerBody = {
    from,
    to: [existing.customer_email],
    reply_to: 'info@thepinkspabus.com',
    subject: `Updated Pink Spa Bus Disclosure — ${rec.event_date} — ${rec.ref_number}`,
    html: customerUpdateHtml(rec, editUrl)
  };
  if (pdfB64) customerBody.attachments = [{ filename, content: pdfB64 }];

  await Promise.all([
    sendEmail(env.RESEND_API_KEY, companyBody),
    sendEmail(env.RESEND_API_KEY, customerBody)
  ]);

  return Response.json({ ok: true, refNumber: rec.ref_number });
}
