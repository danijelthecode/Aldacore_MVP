# Newcode homepage: coded prototype

A working prototype of a new newcode.ai homepage. It started from `website-refresh-build-brief.md` (17 Nov 2026) and then took a newer direction from design: keep the Newcode colors, build a clearly better page, and show the product on photographic imagery instead of purple gradient backgrounds. It is a design artifact to agree direction. It is not the production site.

## Stack

Plain HTML, CSS and a small vanilla JavaScript file. No framework and no build step.

```
index.html          the page (all 11 sections, navigation, footer)
css/styles.css      brand tokens, layout, components, the product UI kit
js/main.js          navigation, tabs, quiet motion
assets/             Newcode material from the live site, plus generated plates
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
- Customer logos, portraits, office photos, the film still and the three document images are Newcode's own files from the live site.
- Anything missing or unconfirmed is a labeled placeholder on the page. The full list is generated at the bottom of the page under "Prototype notes".

## How the product imagery is made

Two layers, never one generated picture of an interface.

1. A plate: a generated photograph of a real material or room (`assets/plates/`), with an empty area, one light source from the left, and no text, screens, logos or people.
2. The product UI on top: an HTML rebuild of screens that newcode.ai shows today, with the same demo content. It lives in `index.html` under the `.ui` class and scales with its plate.

For production, replace each HTML rebuild with a 2x export of the real screen from the product design file, and replace or approve each plate. Both points are listed on the page under "Prototype notes".

## Typeface

Grain is the website typeface and is licensed, so the font file is not in this repository. The page falls back to Inter (bundled, SIL Open Font License). To see the page in Grain, add the licensed file as a `url()` source in the `@font-face` rule named "Grain" at the top of `css/styles.css`.

## Brand tokens

All colors are the eight tokens from the brief, defined once in `:root` in `css/styles.css`. Deep purple is used on buttons, links, small accents and the closing band. Ink is used for text and the security band. Product UI never sits on a purple background.
