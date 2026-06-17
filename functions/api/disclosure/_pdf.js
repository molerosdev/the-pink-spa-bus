// PDF generation for disclosure forms.
// Depends on pdf-lib (bundled via npm).
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PINK     = rgb(0.949, 0.424, 0.678);   // #F26CAD
const PURPLE   = rgb(0.180, 0.102, 0.278);   // #2E1A47
const LAVENDER = rgb(0.541, 0.310, 0.749);   // #8A4FBF

export async function buildPDF(d, origin, isUpdate) {
  const pdfDoc   = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page     = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const lm = 50, rm = 562, cw = 512;

  // Try to embed logo
  let logo = null;
  try {
    const r = await fetch(`${origin}/images/logo.png`);
    if (r.ok) {
      logo = await pdfDoc.embedPng(new Uint8Array(await r.arrayBuffer()));
    }
  } catch (_) {}

  // Header band
  page.drawRectangle({ x: 0, y: height - 36, width, height: 36, color: PINK });
  page.drawText('The Pink Spa Bus — Disclosure Form', {
    x: lm, y: height - 24, font: boldFont, size: 12, color: rgb(1, 1, 1)
  });

  let y = height - 60;

  // Logo + title row
  if (logo) {
    const dim = logo.scale(0.07);
    page.drawImage(logo, { x: lm, y: y - dim.height + 14, width: dim.width, height: dim.height });
  }
  const logoOffset = logo ? 46 : 0;
  page.drawText(`Reference: ${d.ref_number}`, { x: lm + logoOffset, y, font: boldFont, size: 10, color: PURPLE });
  y -= 14;
  page.drawText(`Status: ${isUpdate ? 'Updated Disclosure' : 'Original Submission'}`, { x: lm + logoOffset, y, font, size: 9, color: LAVENDER });
  y -= 12;
  page.drawText(`Submitted: ${d.updated_at || d.created_at}`, { x: lm + logoOffset, y, font, size: 9, color: LAVENDER });
  y -= 22;
  page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.5, color: PINK });
  y -= 16;

  function section(title) {
    page.drawText(title, { x: lm, y, font: boldFont, size: 10, color: PINK });
    y -= 14;
  }

  function row(label, value) {
    if (!value) return;
    page.drawText(`${label}:`, { x: lm, y, font: boldFont, size: 8, color: PURPLE });
    page.drawText(String(value), { x: lm + 110, y, font, size: 8, color: rgb(0, 0, 0) });
    y -= 12;
  }

  function wrap(text, maxW) {
    const words = String(text || '').split(' ');
    const lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (test.length * 4.5 > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  // Parent
  section('PARENT / GUARDIAN');
  row('Name', d.parent_name);
  row('Email', d.customer_email);
  row('Phone', d.phone);
  row('Event Date', d.event_date);
  row('Event Address', d.event_address);

  y -= 6;
  page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
  y -= 14;

  // Children
  const children = JSON.parse(d.children_json || '[]');
  section(`CHILDREN (${children.length})`);
  children.forEach((c, i) => {
    const label = `${i + 1}. ${c.name || 'Guest ' + (i + 1)}${c.age ? ', Age ' + c.age : ''}`;
    page.drawText(label, { x: lm + 8, y, font: boldFont, size: 8, color: PURPLE });
    y -= 11;
    if (c.allergies) {
      const noteLines = wrap(`Allergies/Notes: ${c.allergies}`, cw - 20);
      noteLines.forEach(l => {
        page.drawText(l, { x: lm + 16, y, font, size: 7.5, color: rgb(0.6, 0, 0) });
        y -= 10;
      });
    }
    if (c.medical) {
      page.drawText(`Medical: ${c.medical}`, { x: lm + 16, y, font, size: 7.5, color: LAVENDER });
      y -= 10;
    }
    y -= 2;
    if (y < 120) {
      // Basic safety guard — multi-page not fully implemented
      y = 700;
    }
  });

  y -= 4;
  page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
  y -= 14;

  // Emergency contact
  const emg = JSON.parse(d.emergency_json || '{}');
  section('EMERGENCY CONTACT');
  row('Name', emg.name);
  row('Relationship', emg.relationship);
  row('Phone', emg.phone);

  y -= 6;
  page.drawLine({ start: { x: lm, y }, end: { x: rm, y }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
  y -= 14;

  // Consent
  section('CONSENT & WAIVER');
  page.drawText('Parent has read and agreed to the Liability Waiver', { x: lm + 8, y, font, size: 8, color: PURPLE });
  y -= 11;
  row('Signed by', d.signer_name);
  row('Signature date', d.sig_date);
  row('Submitted', d.updated_at || d.created_at);

  // Signature image
  if (d.signature_b64) {
    y -= 8;
    section('SIGNATURE');
    try {
      const sigData = d.signature_b64.startsWith('data:') ? d.signature_b64.split(',')[1] : d.signature_b64;
      const sigBytes = Uint8Array.from(atob(sigData), c => c.charCodeAt(0));
      const sigImg = await pdfDoc.embedPng(sigBytes);
      const dim = sigImg.scale(Math.min(200 / sigImg.width, 60 / sigImg.height));
      if (y - dim.height - 10 > 60) {
        page.drawImage(sigImg, { x: lm, y: y - dim.height, width: dim.width, height: dim.height });
        y -= dim.height + 10;
      }
    } catch (_) {}
  }

  // Footer
  page.drawLine({ start: { x: 0, y: 40 }, end: { x: width, y: 40 }, thickness: 0.5, color: PINK });
  page.drawText(`The Pink Spa Bus · ${d.ref_number} · thepinkspabus.com`, {
    x: lm, y: 26, font, size: 7, color: LAVENDER
  });
  if (isUpdate) {
    page.drawText(`Updated on: ${d.updated_at}`, { x: lm, y: 16, font, size: 7, color: rgb(0.5, 0, 0) });
  }

  return await pdfDoc.save();
}
