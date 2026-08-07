# ChromaEngine

A colour harmony explorer for painters, printmakers, illustrators and designers — any medium, one wheel.

Four modes: **build a palette from one colour**, **analyse a palette you already have**, **extract one from a photo**, or **discover one from intent alone**.

## Build from a colour

Pick a colour by picker, hex, RGB or HSL sliders and ChromaEngine hands back everything you need to put it to work:

1. **Choose your colour** — picker, hex, RGB, and H/Chroma/L sliders each paired with a typeable number field for exact values, twelve studio-start swatches (Studio Artistry by Ray's own brand colours, used across the whole studio), and an **I'm feeling lucky** button that generates a starting colour directly in OKLCH space rather than raw RGB — hue is unconstrained, but lightness and chroma are kept in a band realistic to build a palette around, with chroma taken as a fraction of what each hue can actually hold before clipping (so every hue comes out comparably vivid, not always-muted yellows next to always-maxed blues). It's offered as a place to begin, not an answer
2. **What's the plan for your palette?** — an opinionated brief tuned to the job: 🌐 Website/App, 🎨 Brand identity, 📱 Social media, 📦 Packaging, 📖 Book/Editorial, 🎭 Illustration/Fine art, or ➕ Other. Each brief gives a verdict, four moves, exact hand-off values (HEX / RGB / CMYK / HSL and more), and the tests the colour has to pass
3. **Tints & shades** — a ten-step value ramp, evenly spaced from 95 down to 10
4. **Colour families** — analogous (5), complementary (dark/base/light of both the colour and its opposite, 6), split-complementary and triadic (the base plus light/dark of each accent hue, 5 each), tetradic (light/base/dark of all four hues, 12, laid out as a compact 3×4 grid), and monochromatic (5 steps, 90 down to 20) — every swatch copy-on-tap
5. **Put to work** — live poster, website and promo-tile mockups built from the current family
6. **Contrast & legibility** — WCAG 2.x contrast ratios (AA/AAA, body/large/UI), nearest-passing colour fixes, and ready-made readable pairs
7. **Accessible UI theme** — light and dark token sets derived from the colour, each token checked against its WCAG target, exportable as CSS variables

## Analyse a palette

Already have a colour scheme? Add up to eight colours and ChromaEngine reads the room.

1. **Palette Health Score** — a 0–100 score built from measurable colour science, not a magic AI number. Dimensions include accessibility (WCAG contrast banding), harmony (best-fit against harmonic templates, e.g. "78% triadic", plus OKLab perceptual spacing, temperature distribution and saturation rhythm), value hierarchy (range, minimum separation, evenness), chroma balance (intentional saturation, colour fatigue), distinctiveness (OKLab ΔE between every pair), practicality (can buttons, links, body text, cards, dark mode and CMYK print actually be built?), flexibility (how many pairings pass contrast), plus brand proxies (memorability, emotional consistency) and focal emphasis. The dimensions and their weights change with the chosen goal — 🧭 General, 🌐 Website, 🎨 Brand, 📱 Social, 📦 Packaging, 📖 Editorial, or 🎭 Fine art, where accessibility all but disappears because it isn't the objective. Roles (ground, ink, lead accent, supports) are assigned automatically
2. **Observations, not errors** — plain-language notes on what's straining ("Teal and orange are both demanding attention"), each with a concrete suggestion in exact numbers
3. **One-click fixes** — moves, not replacements: every suggestion keeps the hue exactly where you put it and only nudges chroma or lightness
4. **Improve but keep my style** — applies all the moves at once and reports the result against the health score ("Overall palette quality improved by 31%"), with 🟢🟡🟠 per-dimension deltas, before/after strips, and an undo-friendly apply
5. **Production-ready Theme** — once the palette is behaving, generate a light/dark UI token system mapped directly from your approved colours: ground → background, ink → body text, lead accent → button, next accent → link, a third accent or neutral → muted text. Nothing is resynthesized from a single hue — each token keeps the exact approved colour unless it fails its WCAG target, in which case it's nudged the minimum distance needed, exactly like the one-click fixes. Copy the CSS variables or save `theme.css` straight to disk
6. **Save, load and a palette gallery** — name a palette and save it as a small portable JSON file, or save it straight into an in-browser library (no file dialog, no account, just this browser's local storage) that also keeps the reference photo if the palette came from one. Since the theme, health score and fixes are all pure functions of the palette plus which goal it's scored against, saving those two things is saving everything — reloading reconstructs it byte-for-byte identical
7. **Print a swatch card** — generates a printable card (swatch, hex/RGB, nearest Polychromos pencil with its match percentage, and three blank rows to test the physical pencil against) for the current palette, plus the reference photo if there is one. Laid out in physical units on a fixed A4 page with a fixed 4-column grid, so up to the full 8-swatch palette plus photo reliably fits on one sheet rather than spilling a couple of orphaned swatches onto a second page. Uses the browser's own print-to-PDF rather than a bundled library, so it stays part of the one dependency-free file

## Extract from a photo

Its own tab alongside Build and Analyse. Drop in a reference image (nothing leaves your browser) and it's sampled with k-means clustering in OKLab, spread across the shadows, midtones and highlights rather than averaged into mud. Every swatch is a real pixel from the photo, never a synthetic blend. Choose 3–8 swatches, then "Use these colours" switches you straight into Analyse mode with them loaded, ready for scoring, fixing and theming.

Every swatch — auto-extracted or manually picked — leaves a marker on the photo showing exactly where it was sampled from, so you can see at a glance whether the colours are spread across the image or clumped in one corner. Each swatch, auto or manual, is individually removable and copy-able: if the algorithm picks up something you don't want (a background colour, a stray reflection), drop it from the list and, if you like, replace it with an exact point of your own.

**Or click the photo to sample an exact point** — the eyedropper. Full-resolution pixel sampling (not the downscaled copy used for clustering). Matches how a painter actually works from a reference: pick the spot, not an algorithm's average of the whole image. A manually sampled point can be dragged after placing to fine-tune it, re-sampling live as you move it, rather than removing and re-clicking. Manually sampled points combine with the auto-extracted swatches when you hand off to Analyse mode.

## Discover a palette

Never asks "what's your favourite colour" — most people don't know that. What they know is what they want to feel. This mode turns that feeling into a target region of colour space and generates palettes into it, rather than asking for one directly:

1. **About the brand** — what you do (optional, only used in the write-up), up to three words that describe the brand and up to three you never want to hear about it, picked from a curated chip list. Each word nudges five measurable axes (chroma, value range, temperature, harmony tension, accent count) by a fixed, known amount — never an arbitrary interpretation of free text
2. **What's it for** — the same seven goal categories as the Health Score, since that's exactly what they'll be used for: scoring the generated candidates
3. **Which feels closer** — four quick pairwise calls (warm/cool, muted/vibrant, restrained/bold, minimal/layered) with no colour names at all, using abstract built-in colour cards. You can also compare two photos of your own instead of the built-in cards — each photo is measured with the same OKLab pipeline as everywhere else in the app (never trusted as a vibe), and whichever one you pick nudges the axis by how much it actually measured warmer, more saturated, or more varied than the other
4. **Your directions** — generates ~500 candidate palettes inside the resulting target region (seed hue from the temperature bias, a harmony template weighted by the tension bias, chroma/value targets from the rest), scores every one with the exact same health-score engine used everywhere else, keeps the ones that pass a real accessibility/hierarchy gate, and surfaces the four highest-scoring that are also visibly distinct from each other. Each direction gets a name and a "why this" explanation derived entirely from your answers and that palette's own measured properties, never invented copy. Choosing one switches straight into Analyse mode with it loaded

## Polychromos pencil matching

Every colour in the app, in Build mode's colour picker, every swatch in an analysed palette, and every photo-extracted swatch, is matched against a real set of 120 Faber-Castell Polychromos pencils (mapped to Pantone and hand-calibrated to RGB by swatching, scanning and colour-picking). Matching runs in OKLab, so "closest" tracks how the eye reads difference, not raw RGB distance.

- Build mode shows the three nearest pencils with a match percentage (100% is an exact match), derived from OKLab distance against a calibrated reference so real matches use the full range rather than piling up near either end
- If no single pencil is genuinely close, it suggests a two-pencil layering estimate (e.g. "cadmium yellow lemon 60% + leaf green 40%") with its own match percentage, clearly flagged as an approximation, since real layering depends on pressure, paper and order, not a physical mixing model
- Analyse mode and photo extraction tag each swatch with its nearest pencil name and the same match percentage inline
- The printable swatch card carries the match percentage too

## Running it

There is no build step and there are no dependencies. Everything — markup, styles, colour math — lives in a single `index.html`.

- Open `index.html` in any browser, or
- Serve the folder statically (`python3 -m http.server`), or
- Enable **GitHub Pages** on this repo (Settings → Pages → deploy from the `main` branch) to host it at a public URL

## Notes

- All colour computation happens client-side; nothing is sent anywhere.
- CMYK values are approximate conversions — proof with your printer before signing off.
- Contrast math follows the WCAG 2.x relative-luminance formula.

Made by Studio Artistry by Ray.
