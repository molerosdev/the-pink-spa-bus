# The Pink Spa Bus · Party Mobile

Marketing site for **The Pink Spa Bus** — a kids' mobile spa-party bus serving Central Florida.

A multi-page static site (Home / Packages / Gallery / Disclosure / Contact) with a bilingual
**EN/ES** liability‑waiver flow, an event **gallery + lightbox**, and a **contact** form. Shared
styles in `public/css/styles.css`, shared behaviour in `public/js/main.js`. Forms email via
**Resend** through a **Cloudflare Pages Function** (`functions/api/submit.js`).

- **Hosting:** Cloudflare Pages (GoDaddy stays the domain registrar).
- **Brand:** pink `#F26CAD`, purple `#9F75C9`, cyan `#33C0E1` (from `images/Colors-branding.pdf`).
- **Deploy, forms, DNS, and how to add gallery events:** see **[DEPLOY.md](DEPLOY.md)**.

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in Resend keys for local testing
npm run dev                      # wrangler pages dev — serves site + /api/submit
```

`pub-pink-spa-bus.html` is the original design prototype, kept for reference.
