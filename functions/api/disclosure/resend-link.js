// Cloudflare Pages Function — POST /api/disclosure/resend-link
// Looks up a disclosure by email and re-sends the edit link to the customer.

import { norm, esc } from './_helpers.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return Response.json({ ok: false, error: 'Database not configured.' }, { status: 500 });
  if (!env.RESEND_API_KEY) return Response.json({ ok: false, error: 'Email not configured.' }, { status: 500 });

  let p;
  try { p = await request.json(); } catch { return Response.json({ ok: false, error: 'Bad JSON' }, { status: 400 }); }

  const email = norm(p.email);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Invalid email.' }, { status: 400 });
  }

  // Find the most recent disclosure for this email
  const rec = await env.DB
    .prepare('SELECT ref_number, edit_token, event_date, parent_name FROM disclosures WHERE customer_email=? ORDER BY created_at DESC LIMIT 1')
    .bind(email)
    .first();

  // Always return success to avoid email enumeration — if not found, silently succeed
  if (!rec) return Response.json({ ok: true });

  const origin = new URL(request.url).origin;
  const editUrl = `${origin}/disclosure.html?edit=${rec.edit_token}`;
  const from = env.MAIL_FROM || 'The Pink Spa Bus <forms@thepinkspabus.com>';

  const html = `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif">
    <div style="background:#F26CAD;padding:16px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#fff;margin:0;font-size:18px">Your Disclosure Edit Link &mdash; The Pink Spa Bus</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #f0e8f8">
      <p style="font:15px Arial;color:#2E1A47">Hi ${esc(rec.parent_name)},</p>
      <p style="font:14px Arial;color:#2E1A47">Here is your secure link to edit your disclosure for the event on <strong>${esc(rec.event_date)}</strong> (Ref: ${esc(rec.ref_number)}).</p>
      <div style="background:#fdf4ff;border:1px solid #f0e8f8;padding:16px;border-radius:8px;margin:20px 0">
        <p style="font:13px Arial;color:#2E1A47;margin:0 0 10px">Please do not share this link with anyone else — it gives full access to edit your disclosure.</p>
        <a href="${editUrl}" style="display:inline-block;background:#F26CAD;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font:600 13px Arial">Edit My Disclosure</a>
      </div>
      <p style="font:12px Arial;color:#8A4FBF">If you did not request this email, you can safely ignore it.</p>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: 'info@thepinkspabus.com',
      subject: `Your Pink Spa Bus Disclosure Edit Link — ${rec.ref_number}`,
      html
    })
  });

  return Response.json({ ok: true });
}

export async function onRequestGet() {
  return new Response('POST only', { status: 405 });
}
