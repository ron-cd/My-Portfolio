# Deployment Guide

This document covers every way to get the portfolio live, from GitHub Pages (free) to a custom domain with HTTPS.

---

## 1. GitHub Pages (Recommended — Free)

### Step 1: Create the repository

```bash
cd aaron-portfolio
git init
git add .
git commit -m "feat: initial portfolio release"
```

Go to [github.com/new](https://github.com/new) and create a **public** repository named `aaron-portfolio` (or your GitHub username for a user page: `YOUR_USERNAME.github.io`).

```bash
git remote add origin https://github.com/YOUR_USERNAME/aaron-portfolio.git
git branch -M main
git push -u origin main
```

### Step 2: Enable Pages

1. Open the repo on GitHub
2. **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`
5. Click **Save**

Your site will be live at:
```
https://YOUR_USERNAME.github.io/aaron-portfolio/
```

> If you name the repo exactly `YOUR_USERNAME.github.io`, it will be served at the root (`https://YOUR_USERNAME.github.io/`).

### Step 3: Update the canonical URL

In `index.html`, replace the canonical link:
```html
<link rel="canonical" href="https://YOUR_USERNAME.github.io/aaron-portfolio/" />
```

And the Open Graph / Twitter URLs:
```html
<meta property="og:url" content="https://YOUR_USERNAME.github.io/aaron-portfolio/" />
```

---

## 2. Netlify (Drag & Drop — Free)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the **entire `aaron-portfolio/` folder** onto the deploy zone
3. Netlify assigns a random subdomain (e.g. `quirky-goldfish-abc123.netlify.app`)
4. Rename it under **Site settings → Domain management → Options → Edit site name**

### Netlify via CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --dir . --prod
```

### Netlify `_headers` file (recommended for security)

Create `aaron-portfolio/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self';
```

---

## 3. Vercel (Free)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel auto-detects a static site. No config needed.

---

## 4. Custom Domain

### On GitHub Pages

1. Buy a domain (Namecheap, Cloudflare, Google Domains, etc.)
2. GitHub → Settings → Pages → **Custom domain** → enter `yourdomain.com`
3. At your registrar, add these DNS records:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | YOUR_USERNAME.github.io  |

4. Wait up to 24 hours for DNS propagation
5. Tick **Enforce HTTPS** in GitHub Pages settings

### On Netlify

1. **Site settings → Domain management → Add custom domain**
2. Follow Netlify's DNS instructions (they provide nameservers)
3. HTTPS is automatic via Let's Encrypt

---

## 5. Contact Form — Backend Options

The form currently shows a success state on submit but doesn't send email. Choose one:

### Option A: Formspree (easiest, free tier)

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form → copy your endpoint URL
3. In `js/main.js`, replace the form submit handler:

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  const data = new FormData(form);
  const res  = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    body: data,
    headers: { Accept: 'application/json' },
  });

  if (res.ok) {
    btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
    btn.classList.add('sent');
    form.reset();
  } else {
    btn.innerHTML = '<i class="fas fa-times"></i> Error — try again';
  }

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    btn.classList.remove('sent');
    btn.disabled = false;
  }, 4000);
});
```

### Option B: EmailJS (client-side, free tier)

1. Sign up at [emailjs.com](https://emailjs.com)
2. Create a service + email template
3. Add their SDK before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script>emailjs.init('YOUR_PUBLIC_KEY');</script>
```

4. In the submit handler, call:
```js
emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form);
```

### Option C: Netlify Forms (zero code, Netlify only)

Add `netlify` attribute to your form tag:
```html
<form class="contact-form" id="contact-form" netlify name="contact" novalidate>
```
Netlify intercepts submissions automatically. View them in the dashboard.

---

## 6. Pre-launch Checklist

### Content
- [ ] Replace all placeholder names, emails, URLs with real ones
- [ ] Add real project screenshots or update emoji thumbnails
- [ ] Add real GitHub/LinkedIn/Twitter links
- [ ] Upload your CV as `assets/Aaron-Dela-Cruz-CV.pdf`
- [ ] Create a 1200×630px `assets/images/og-image.png` for social sharing

### Assets
- [ ] Generate favicons from [realfavicongenerator.net](https://realfavicongenerator.net)
- [ ] Place in `assets/icons/`: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`
- [ ] Update `assets/icons/site.webmanifest` with your site name and colours

### Technical
- [ ] Test on Chrome, Firefox, Safari, and mobile
- [ ] Run Lighthouse audit (target: Performance ≥ 90, Accessibility ≥ 95)
- [ ] Validate HTML at [validator.w3.org](https://validator.w3.org)
- [ ] Check all links work (no `href="#"` placeholders left)
- [ ] Wire up contact form backend
- [ ] Set canonical URL to your real domain
- [ ] Add `_headers` (Netlify) or equivalent security headers
- [ ] Enable HTTPS

### SEO
- [ ] Submit sitemap to Google Search Console
- [ ] Verify Open Graph image with [opengraph.xyz](https://www.opengraph.xyz)
- [ ] Add `robots.txt` if needed (default: allow all)
