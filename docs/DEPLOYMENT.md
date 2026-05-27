# Deployment

This portfolio is a static site — no build step, no server runtime. Drop the files on any static host.

---

## GitHub Pages (recommended)

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Set the source to the `main` branch, root folder `/`.
4. GitHub Pages will serve `index.html` automatically.
5. The current default project URL is:
   ```text
   https://ron-cd.github.io/My-Portfolio/
   ```
6. If the repository name or domain changes, update the canonical URL, OG tags, `robots.txt`, and `sitemap.xml`:
   ```html
   <link rel="canonical" href="https://your-username.github.io/" />
   <meta property="og:url" content="https://your-username.github.io/" />
   ```

For a custom domain, add a `CNAME` file to the repo root containing your domain, then configure DNS with your registrar.

---

## Netlify

1. Drag and drop the project folder onto [netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo.
2. No build command needed. Publish directory: `/` (root).
3. Netlify will detect `index.html` as the entry point.

### Netlify Forms (contact form)

The contact form is already wired for Netlify Forms:

- `index.html` includes `name="contact"`, `method="POST"`, `data-netlify="true"`, a `form-name` hidden input, and a honeypot field.
- `js/main.js` keeps the custom validation, then posts the form to Netlify using `application/x-www-form-urlencoded`.
- Submissions appear in the Netlify dashboard under **Forms** after the site is deployed.

---

## Vercel

1. Import the GitHub repository on [vercel.com](https://vercel.com).
2. Framework preset: **Other**.
3. Build command: *(leave blank)*
4. Output directory: `.` (root)
5. Deploy.

---

## Third-Party Form Services

### Formspree

1. Sign up at [formspree.io](https://formspree.io) and create a form.
2. Add `action` and `method` to the form:
   ```html
   <form action="https://formspree.io/f/your-form-id" method="POST">
   ```
3. Remove the `novalidate` attribute (or keep it and rely on your JS validation).
4. Formspree handles submission and sends you an email.

### EmailJS

1. Sign up at [emailjs.com](https://www.emailjs.com) and create a service + template.
2. Add the EmailJS SDK to `index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   ```
3. In `js/main.js` inside `initContactForm()`, replace the fake submit handler:
   ```js
   form.addEventListener('submit', e => {
     e.preventDefault();
     if (!validate()) return;
     emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
       .then(() => { /* show success */ })
       .catch(() => { /* show error */ });
   });
   ```

---

## Assets Checklist Before Launch

- [ ] Run `npm test`.
- [ ] Replace `assets/img/og-image.png` with a real 1200x630px social preview image.
- [ ] Replace `assets/Aaron_Dela_Cruz_CV.pdf` with your actual CV.
- [ ] Update `robots.txt` if you want to disallow any paths.
- [ ] Update `sitemap.xml` with your real domain.
- [ ] Verify `canonical` and OG/Twitter meta tags point to the correct URL.
- [ ] Test the contact form end-to-end on the deployed Netlify site.
- [ ] Run Lighthouse in Chrome DevTools and aim for 90+ on Performance, Accessibility, Best Practices, SEO.

---

## Performance Notes

- **Fonts** are loaded from `css/base.css` with preconnect hints in each page head.
- **Font Awesome** is loaded as an SRI-protected stylesheet with `referrerpolicy="no-referrer"`.
- **Three.js** and **GSAP** libs are served from `libs/` (local copies), avoiding CDN latency.
- **`three.min.js`** and **`OBJLoader.js`** use `defer` to avoid blocking the parser.
- The satellite `.obj` model and textures are skipped on compact, reduced-motion, save-data, and constrained devices.
