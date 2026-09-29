# Publishing this site

Plain HTML, CSS and JavaScript. No build step, no dependencies, no framework.
Three pages — `index.html`, `skills.html`, `fortune.html` — plus `styles.css`,
`script.js`, `fortune.js` and `assets/`.

Every path in the site is relative, so it works from a domain root
(`nakshatra.com`) or from a subfolder (`user.github.io/portfolio/`) without
any change.

## What ships, and what does not

The folder on disk is about **155 MB**; the site itself is about **2.5 MB**.
The difference is `react-app/` (151 MB, an unrelated Vite project) and source
artwork that no page references. `.gitignore` keeps both out of any deploy
while leaving them on disk.

**Do not** drag the whole `Portfolio` folder to a drag-and-drop host — it will
upload `react-app/` too.

## Recommended: GitHub + Vercel

You already have both from Aux Cord Diagnosis, and this gives you a URL today
plus one-command updates afterwards.

```bash
cd "C:/Users/onlin/OneDrive/Desktop/Portfolio"
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/<you>/portfolio.git
git push -u origin main
```

Then at **vercel.com → Add New → Project → Import** that repo. Leave every
build setting empty (framework: Other, no build command, output directory `.`).
It deploys in under a minute and gives you `something.vercel.app`.

**Every later change is just:**

```bash
git add .
git commit -m "what changed"
git push
```

Vercel redeploys automatically. That is the whole loop.

## Alternative: GitHub Pages

Same push as above, then in the repo: **Settings → Pages → Source: main,
folder: / (root)**. Live at `https://<you>.github.io/portfolio/` in a couple of
minutes. Free forever, no third party. Slightly slower to update than Vercel.

## Fastest, if you want a link in the next five minutes

**Netlify Drop** at <https://app.netlify.com/drop> takes a dragged folder with
no account. But because it uploads everything you drag, first copy the site
files into a clean folder:

`index.html` `skills.html` `fortune.html` `styles.css` `script.js`
`fortune.js` `assets/`

Drag that folder. Updating means dragging again, so this is the worst option
if you plan to keep editing.

## A custom domain

Any of the three accepts one. `nakshatrakadethankar.com` or similar costs
about $12 a year and looks better on an application than `*.vercel.app`.
Worth doing before the URL goes on many applications, since changing it later
means updating everywhere you have sent it.

## Before you send it anywhere

- There is no resume on the site. The Resume button and the PDF were both
  removed, so applications will need the CV attached separately. If you want
  the button back, drop the PDF in `assets/` and say so.
- Check the site on your own phone once. It is tested at nine device sizes,
  but your thumb is the real test.
