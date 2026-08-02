# ChromaEngine

A colour harmony explorer for painters, printmakers, illustrators and designers — any medium, one wheel.

Two modes: **build a palette from one colour**, or **analyse a palette you already have**.

## Build from a colour

Pick a colour by picker, hex, RGB or HSL sliders and ChromaEngine hands back everything you need to put it to work:

1. **Choose your colour** — picker, hex, RGB, and H/S/L sliders, plus six studio-start swatches
2. **What's the plan for your palette?** — an opinionated brief tuned to the job: 🌐 Website/App, 🎨 Brand identity, 📱 Social media, 📦 Packaging, 📖 Book/Editorial, 🎭 Illustration/Fine art, or ➕ Other. Each brief gives a verdict, four moves, exact hand-off values (HEX / RGB / CMYK / HSL and more), and the tests the colour has to pass
3. **Tints & shades** — a seven-step value ramp
4. **Colour families** — analogous, complementary, split-complementary, triadic, tetradic and monochromatic schemes, every swatch copy-on-tap
5. **Put to work** — live poster, website and promo-tile mockups built from the current family
6. **Contrast & legibility** — WCAG 2.x contrast ratios (AA/AAA, body/large/UI), nearest-passing colour fixes, and ready-made readable pairs
7. **Accessible UI theme** — light and dark token sets derived from the colour, each token checked against its WCAG target, exportable as CSS variables

## Analyse a palette

Already have a colour scheme? Add up to five colours and ChromaEngine reads the room — or start from a photo:

- **Extract from a photo** — drop in a reference image (nothing leaves your browser) and it's sampled with k-means clustering in OKLab, spread across the shadows, midtones and highlights rather than averaged into mud. Every swatch is a real pixel from the photo, never a synthetic blend. Choose 3–5 swatches, then load them straight into the palette below for scoring, fixing and theming

1. **Palette Health Score** — a 0–100 score built from measurable colour science, not a magic AI number. Dimensions include accessibility (WCAG contrast banding), harmony (best-fit against harmonic templates, e.g. "78% triadic", plus OKLab perceptual spacing, temperature distribution and saturation rhythm), value hierarchy (range, minimum separation, evenness), chroma balance (intentional saturation, colour fatigue), distinctiveness (OKLab ΔE between every pair), practicality (can buttons, links, body text, cards, dark mode and CMYK print actually be built?), flexibility (how many pairings pass contrast), plus brand proxies (memorability, emotional consistency) and focal emphasis. The dimensions and their weights change with the chosen goal — 🧭 General, 🌐 Website, 🎨 Brand, 📱 Social, 📦 Packaging, 📖 Editorial, or 🎭 Fine art, where accessibility all but disappears because it isn't the objective. Roles (ground, ink, lead accent, supports) are assigned automatically
2. **Observations, not errors** — plain-language notes on what's straining ("Teal and orange are both demanding attention"), each with a concrete suggestion in exact numbers
3. **One-click fixes** — moves, not replacements: every suggestion keeps the hue exactly where you put it and only nudges saturation or lightness
4. **Improve but keep my style** — applies all the moves at once and reports the result against the health score ("Overall palette quality improved by 31%"), with 🟢🟡🟠 per-dimension deltas, before/after strips, and an undo-friendly apply
5. **Production-ready Theme** — once the palette is behaving, generate a light/dark UI token system mapped directly from your approved colours: ground → background, ink → body text, lead accent → button, next accent → link, a third accent or neutral → muted text. Nothing is resynthesized from a single hue — each token keeps the exact approved colour unless it fails its WCAG target, in which case it's nudged the minimum distance needed, exactly like the one-click fixes. Copy the CSS variables or save `theme.css` straight to disk

## Polychromos pencil matching

Every colour in the app, in Build mode's colour picker, every swatch in an analysed palette, and every photo-extracted swatch, is matched against a real set of 120 Faber-Castell Polychromos pencils (mapped to Pantone and hand-calibrated to RGB by swatching, scanning and colour-picking). Matching runs in OKLab, so "closest" tracks how the eye reads difference, not raw RGB distance.

- Build mode shows the three nearest pencils with a plain-language read on how close each one is (near-identical, very close, close, noticeably different)
- If no single pencil is genuinely close, it suggests a two-pencil layering estimate (e.g. "cadmium yellow lemon 60% + leaf green 40%"), clearly flagged as an approximation, since real layering depends on pressure, paper and order, not a physical mixing model
- Analyse mode and photo extraction tag each swatch with its nearest pencil name inline

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
