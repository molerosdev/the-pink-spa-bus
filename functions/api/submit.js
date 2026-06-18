// Cloudflare Pages Function — POST /api/submit
// Emails waiver + contact submissions via Resend (https://resend.com).
//
// Required env vars (Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY   secret, e.g. re_xxx
//   MAIL_TO          comma-separated recipients, e.g. "info@thepinkspabus.com,owner@example.com"
//   MAIL_FROM        verified sender, e.g. "The Pink Spa Bus <noreply@thepinkspabus.com>"
//                    (until your domain is verified in Resend you can use "onboarding@resend.dev")

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rows(fields = {}) {
  return Object.entries(fields)
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#8A4FBF;font:600 12px Arial;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font:14px Arial;color:#2E1A47">${esc(v)}</td></tr>`)
    .join('');
}

function buildHtml(p) {
  const childRows = (p.children && p.children.length)
    ? `<h3 style="font:600 14px Arial;color:#2E1A47;margin:18px 0 6px">Children</h3><ul style="margin:0;padding-left:18px;font:14px Arial;color:#2E1A47">${p.children.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
    : '';
  const waiverBits = p.type === 'waiver'
    ? `<p style="font:14px Arial;color:#2E1A47"><b>Disclosure accepted:</b> ${p.accepted ? 'Yes' : 'No'}<br><b>Language:</b> ${esc(p.lang || 'en')}</p>${childRows}`
    : '';
  return `<div style="max-width:640px;margin:auto">
    <h2 style="font:600 20px Arial;color:#F26CAD">${esc(p.subject || 'New submission')}</h2>
    <table style="border-collapse:collapse;width:100%">${rows(p.fields)}</table>
    ${waiverBits}
    ${p.type === 'waiver' && p.signature ? '<p style="font:12px Arial;color:#6E5B86;margin-top:14px">Signature attached as <b>signature.png</b>.</p>' : ''}
  </div>`;
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'Email not configured (RESEND_API_KEY missing).' }, { status: 500 });
  }
  let p;
  try { p = await request.json(); } catch { return Response.json({ ok: false, error: 'Bad JSON' }, { status: 400 }); }
  if (!p || (p.type !== 'waiver' && p.type !== 'contact')) {
    return Response.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const to = (env.MAIL_TO || 'info@thepinkspabus.com').split(',').map(s => s.trim()).filter(Boolean);
  const from = env.MAIL_FROM || 'The Pink Spa Bus <onboarding@resend.dev>';
  const replyTo = p.fields && (p.fields.Email || p.fields['Correo electrónico']);

  const body = {
    from,
    to,
    bcc: ['thepinkspabus@gmail.com'],
    subject: `${p.subject || 'New submission'} — The Pink Spa Bus`,
    html: buildHtml(p),
  };
  if (replyTo) body.reply_to = replyTo;

  // attach the signature image (waiver only)
  if (p.type === 'waiver' && typeof p.signature === 'string' && p.signature.startsWith('data:image')) {
    const b64 = p.signature.split(',')[1] || '';
    if (b64) body.attachments = [{ filename: 'signature.png', content: b64 }];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return Response.json({ ok: false, error: 'Email send failed', detail }, { status: 502 });
  }
  return Response.json({ ok: true });
}

// Optional: friendly response to non-POST hits
export async function onRequestGet() {
  return new Response('The Pink Spa Bus form endpoint. POST JSON here.', { status: 405 });
}
