# The Pink Spa Bus — deploy & maintenance guide

Standard Cloudflare Pages layout: served files live in **`public/`**, the form API in
**`functions/`**, and `wrangler.toml` marks it as a Pages project. No build step.

```
the-pink-bus/
├─ public/                    ← BUILD OUTPUT DIR (this is what gets served)
│  ├─ index.html              ← the website
│  ├─ _headers                ← caching + security headers
│  └─ images/
│     ├─ logo.png             ← brand logo / favicon
│     ├─ hero/bus-1..4.jpg    ← blurred hero slideshow
│     ├─ sections/interior.jpg← Experience-section photo
│     └─ gallery/<event>/large/NN.jpg + thumb/NN.jpg
├─ functions/api/submit.js    ← Pages Function → Resend (POST /api/submit)
├─ wrangler.toml              ← pages_build_output_dir = "./public"
├─ package.json               ← wrangler dev/deploy scripts
└─ images/                    ← SOURCE only (Pictures/, Colors-branding.pdf) — NOT served
```

The original demo is kept as `pub-pink-spa-bus.html` (root, not served) for reference. Root
`images/Pictures/` and `Colors-branding.pdf` are source assets — they are git-ignored and never
deployed.

---

## ⚠️ GoDaddy Website Builder can't host this — we use Cloudflare Pages

thepinkspabus.com currently runs on **GoDaddy Website Builder**, which does **not** allow custom
HTML/CSS/JS uploads. **Chosen setup:** host on **Cloudflare Pages**, keep **GoDaddy as the domain
registrar only**, and handle forms with a **Cloudflare Pages Function + Resend**.

### Deploy to Cloudflare Pages
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages tab → Connect to Git** → pick the repo.
   ⚠️ Use the **Pages** tab, not Workers — otherwise it runs `wrangler deploy` (Worker mode) and
   fails looking for a Worker entry point.
   - **Framework preset:** None
   - **Build command:** *(leave empty — it's static)*
   - **Build output directory:** `public`
   - Cloudflare reads `wrangler.toml`, serves `public/`, and auto-deploys `functions/` → `/api/submit`.
3. **Preview/staging URLs:** every branch & PR gets its own `*.pages.dev` URL automatically.
   `main` (the "production branch") = production. Push to a `staging` branch → review that URL,
   then merge to `main` to go live. (This is your "preview → promote to main domain" flow.)
4. **Custom domain:** Pages → your project → **Custom domains → Set up** `thepinkspabus.com` +
   `www`. Cloudflare gives DNS records; add them in **GoDaddy → DNS** (or move the domain's
   nameservers to Cloudflare for the smoothest setup). HTTPS is automatic.

> A literal **`.dev`** is a separate paid TLD — you don't need one. Use the Cloudflare `*.pages.dev`
> preview URL (or a `staging.thepinkspabus.com` custom subdomain) as your staging environment.

---

## Forms (waiver + contact) → Resend email

The two forms POST JSON to the Pages Function **`functions/api/submit.js`**, which emails via
**Resend**. Front-end config is `FORM_CONFIG` in `index.html` (`endpoint: '/api/submit'`). When the
file is opened directly (`file://`) it runs in safe **DEMO mode** (nothing sent).

**Setup:**
1. Create a Resend account and an API key at https://resend.com.
2. **Verify your sending domain** (`thepinkspabus.com`) in Resend by adding the DNS records it
   gives you (in GoDaddy DNS or Cloudflare). Until verified, the function falls back to Resend's
   `onboarding@resend.dev` test sender.
3. In **Cloudflare Pages → Settings → Environment variables**, set:
   - `RESEND_API_KEY` = `re_…` (mark as **secret**)
   - `MAIL_TO` = `info@thepinkspabus.com,owner@example.com` (comma-separated — add the client's
     email + the TBD third address here; this is how multiple recipients are configured)
   - `MAIL_FROM` = `The Pink Spa Bus <noreply@thepinkspabus.com>`
4. **Local testing:** `cp .dev.vars.example .dev.vars`, fill it in, then `npm install && npm run dev`.

The **waiver** email includes all parent fields, each child (name/age/allergies), the disclosure
acceptance, the language used, and the **signature attached as `signature.png`**. The **contact**
email includes the contact fields. The submitter's email is set as `reply-to` so you can reply
directly.

---

## Adding a gallery event (up to 6, 10 photos each)

1. Optimise photos into `images/gallery/<slug>/large/NN.jpg` (≈1600px) and
   `images/gallery/<slug>/thumb/NN.jpg` (≈700px), named `01.jpg, 02.jpg, …`.
   (The script used for Emma's Birthday lives in the commit history / can be re-run.)
2. In `index.html`, add an entry to the `GALLERY` array:
   ```js
   const GALLERY = [
     { title: "Emma's Birthday", slug: "emmas-birthday", count: 10 },
     { title: "Sofia's 7th",     slug: "sofias-7th",     count: 8 },
   ];
   ```
That's it — the card + lightbox are generated automatically.

---

## Before going live
- [ ] Confirm **packages & prices** with the client (currently placeholders — see TODO comment in `#programme`).
- [ ] Verify the **liability-waiver wording** matches the legal text on the live site (see NOTE in `#disclosure`).
- [ ] Set Resend env vars (`RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM`) in Cloudflare Pages + verify the sending domain in Resend.
- [ ] Flip `<meta name="robots">` from `noindex,nofollow` to `index,follow`.
- [ ] Double-check **social links** and the **public email** (gmail vs info@).
