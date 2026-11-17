# Newcode homepage refresh: coded prototype

A working prototype of the refreshed newcode.ai homepage, built from `website-refresh-build-brief.md` (17 Nov 2026). It is a design artifact to agree direction. It is not the production site.

## Stack

Plain HTML, CSS and a small vanilla JavaScript file. No framework and no build step.

```
index.html          the page (all 11 sections, navigation, footer)
css/styles.css      brand tokens, layout, components
js/main.js          navigation, tabs, quiet motion
assets/             real Newcode material taken from the live site
scripts/            optional single-file build
```

## Preview

```
cd newcode-homepage
python3 -m http.server 4173
# open http://127.0.0.1:4173/
```

Any static host works as is (Vercel, Netlify, GitHub Pages, S3): publish this folder.

`node scripts/build-artifact.mjs` writes a single-file version to `dist/artifact/` for hosts that wrap the page in their own document shell.

## Where the content comes from

- Copy, customer names, quotes and product descriptions are taken from the live newcode.ai pages as captured on 17 Nov 2026. Copy was changed only where the brief marks it as duplicated or broken (typos, em dashes, UK spellings, the harness story told more than once).
- Product screenshots, customer logos, portraits, office photos and news images are Newcode's own files from the live site.
- Anything missing or unconfirmed is a labeled placeholder on the page. The full list is generated at the bottom of the page under "Prototype notes".

## Typeface

Grain is the website typeface and is licensed, so the font file is not in this repository. The page falls back to Inter (bundled, SIL Open Font License). To see the page in Grain, add the licensed file as a `url()` source in the `@font-face` rule named "Grain" at the top of `css/styles.css`.

## Brand tokens

All colors are the eight tokens from the brief, defined once in `:root` in `css/styles.css`. Deep purple is used only on the hero and the closing CTA band (and on buttons and links). Ink is used only for text and the security band.
