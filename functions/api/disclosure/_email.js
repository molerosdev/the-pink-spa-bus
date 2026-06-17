// Email HTML builders for disclosure forms.
import { esc } from './_helpers.js';

export function companyHtml(d, isUpdate, origin) {
  const children = JSON.parse(d.children_json || '[]');
  const emg = JSON.parse(d.emergency_json || '{}');
  const hasAlert = children.some(c => c.allergies || c.medical);
  const childRows = children.map((c, i) => `
    <tr>
      <td style="padding:6px 0;font:13px Arial;color:#2E1A47;border-bottom:1px solid #f0e8f8">
        <strong>${i + 1}. ${esc(c.name) || 'Guest ' + (i + 1)}${c.age ? ' · Age ' + esc(c.age) : ''}</strong>
        ${c.allergies ? `<br><span style="color:#c00">&#9888; Allergies/Notes: ${esc(c.allergies)}</span>` : ''}
        ${c.medical ? `<br><span style="color:#8A4FBF">Medical: ${esc(c.medical)}</span>` : ''}
        ${c.special ? `<br>Special: ${esc(c.special)}` : ''}
      </td>
    </tr>`).join('');

  return `<div style="max-width:640px;margin:auto;font-family:Arial,sans-serif">
    <div style="background:#F26CAD;padding:16px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#fff;margin:0;font-size:18px">${isUpdate ? 'Updated' : 'New'} Disclosure &mdash; The Pink Spa Bus</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #f0e8f8">
      ${hasAlert ? `<div style="background:#fff3f3;border:1px solid #c00;padding:12px;margin-bottom:16px;border-radius:6px"><strong style="color:#c00">&#9888; Important: Allergy or medical information was provided for one or more children. Please review the attached disclosure carefully.</strong></div>` : ''}
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial;white-space:nowrap">Reference</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47"><strong>${esc(d.ref_number)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Status</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${isUpdate ? 'Updated Disclosure' : 'Original Submission'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Parent Name</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.parent_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Email</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.customer_email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Phone</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.phone)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Event Date</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.event_date)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Event Address</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.event_address)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Children</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${d.children_count}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Signed by</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.signer_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Sig. Date</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.sig_date)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Submitted</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.updated_at || d.created_at)}</td></tr>
      </table>
      <h3 style="color:#F26CAD;font-size:14px;margin:20px 0 8px">Children (${children.length})</h3>
      <table style="width:100%;border-collapse:collapse">${childRows}</table>
      <h3 style="color:#F26CAD;font-size:14px;margin:20px 0 8px">Emergency Contact</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Name</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(emg.name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Relationship</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(emg.relationship)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Phone</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(emg.phone)}</td></tr>
      </table>
      ${d.signature_b64 ? `<h3 style="color:#F26CAD;font-size:14px;margin:20px 0 8px">Signature</h3><img src="${d.signature_b64.startsWith('data:') ? d.signature_b64 : 'data:image/png;base64,' + d.signature_b64}" alt="Signature" style="max-width:260px;border:1px solid #f0e8f8;border-radius:6px;padding:8px">` : ''}
      <p style="font:11px Arial;color:#999;margin-top:20px">The complete disclosure is attached as a PDF.</p>
    </div>
  </div>`;
}

export function customerHtml(d, editUrl) {
  return `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif">
    <div style="background:#F26CAD;padding:16px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#fff;margin:0;font-size:18px">Your Disclosure &mdash; The Pink Spa Bus</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #f0e8f8">
      <p style="font:15px Arial;color:#2E1A47">Your disclosure form has been received successfully. Please keep this copy for your records.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial;white-space:nowrap">Reference</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47"><strong>${esc(d.ref_number)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Event Date</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.event_date)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Children</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${d.children_count}</td></tr>
      </table>
      <div style="background:#fdf4ff;border:1px solid #f0e8f8;padding:16px;border-radius:8px;margin:20px 0">
        <p style="font:13px Arial;color:#2E1A47;margin:0 0 10px">Need to update your party information? Use the secure link below to edit this disclosure. Please do not share this link with anyone else.</p>
        <a href="${editUrl}" style="display:inline-block;background:#F26CAD;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font:600 13px Arial">Edit My Disclosure</a>
      </div>
      <p style="font:12px Arial;color:#8A4FBF">The complete disclosure is attached as a PDF. If you don't see the email, please check your spam or junk folder.</p>
    </div>
  </div>`;
}

export function customerUpdateHtml(d, editUrl) {
  return `<div style="max-width:600px;margin:auto;font-family:Arial,sans-serif">
    <div style="background:#F26CAD;padding:16px 24px;border-radius:8px 8px 0 0">
      <h2 style="color:#fff;margin:0;font-size:18px">Updated Disclosure &mdash; The Pink Spa Bus</h2>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #f0e8f8">
      <p style="font:15px Arial;color:#2E1A47">Your disclosure has been updated. Please keep this updated copy for your records.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial;white-space:nowrap">Reference</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47"><strong>${esc(d.ref_number)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Event Date</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.event_date)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Children</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${d.children_count}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#8A4FBF;font:700 11px Arial">Updated</td><td style="padding:4px 0;font:13px Arial;color:#2E1A47">${esc(d.updated_at)}</td></tr>
      </table>
      <div style="background:#fdf4ff;border:1px solid #f0e8f8;padding:16px;border-radius:8px;margin:20px 0">
        <p style="font:13px Arial;color:#2E1A47;margin:0 0 10px">You can continue to edit this disclosure using the link below if you need to make further changes.</p>
        <a href="${editUrl}" style="display:inline-block;background:#F26CAD;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font:600 13px Arial">Edit My Disclosure</a>
      </div>
      <p style="font:12px Arial;color:#8A4FBF">The updated disclosure is attached as a PDF.</p>
    </div>
  </div>`;
}
