# ChromaEngine

A colour harmony explorer for painters, printmakers, illustrators and designers — any medium, one wheel.

Four modes: **build a palette from one colour**, **analyse a palette you already have**, **extract one from a photo**, or **discover one from intent alone**.

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

Already have a colour scheme? Add up to eight colours and ChromaEngine reads the room.

1. **Palette Health Score** — a 0–100 score built from measurable colour science, not a magic AI number. Dimensions include accessibility (WCAG contrast banding), harmony (best-fit against harmonic templates, e.g. "78% triadic", plus OKLab perceptual spacing, temperature distribution and saturation rhythm), value hierarchy (range, minimum separation, evenness), chroma balance (intentional saturation, colour fatigue), distinctiveness (OKLab ΔE between every pair), practicality (can buttons, links, body text, cards, dark mode and CMYK print actually be built?), flexibility (how many pairings pass contrast), plus brand proxies (memorability, emotional consistency) and focal emphasis. The dimensions and their weights change with the chosen goal — 🧭 General, 🌐 Website, 🎨 Brand, 📱 Social, 📦 Packaging, 📖 Editorial, or 🎭 Fine art, where accessibility all but disappears because it isn't the objective. Roles (ground, ink, lead accent, supports) are assigned automatically
2. **Observations, not errors** — plain-language notes on what's straining ("Teal and orange are both demanding attention"), each with a concrete suggestion in exact numbers
3. **One-click fixes** — moves, not replacements: every suggestion keeps the hue exactly where you put it and only nudges saturation or lightness
4. **Improve but keep my style** — applies all the moves at once and reports the result against the health score ("Overall palette quality improved by 31%"), with 🟢🟡🟠 per-dimension deltas, before/after strips, and an undo-friendly apply
5. **Save / load a palette** — name it and save it as a small JSON file, or load one back in later. Since the production theme, health score and fixes are all pure functions of the palette (plus which goal it's scored against), saving those two things is saving the whole theme — reloading it reconstructs everything byte-for-byte identical, no drift between saves
5. **Production-ready Theme** — once the palette is behaving, generate a light/dark UI token system mapped directly from your approved colours: ground → background, ink → body text, lead accent → button, next accent → link, a third accent or neutral → muted text. Nothing is resynthesized from a single hue — each token keeps the exact approved colour unless it fails its WCAG target, in which case it's nudged the minimum distance needed, exactly like the one-click fixes. Copy the CSS variables or save `theme.css` straight to disk

## Extract from a photo

Its own tab alongside Build and Analyse. Drop in a reference image (nothing leaves your browser) and it's sampled with k-means clustering in OKLab, spread across the shadows, midtones and highlights rather than averaged into mud. Every swatch is a real pixel from the photo, never a synthetic blend. Choose 3–8 swatches, then "Use these colours" switches you straight into Analyse mode with them loaded, ready for scoring, fixing and theming.

## Discover a palette

Never asks "what's your favourite colour" — most people don't know that. What they know is what they want to feel. This mode turns that feeling into a target region of colour space and generates palettes into it, rather than asking for one directly:

1. **About the brand** — what you do (optional, only used in the write-up), up to three words that describe the brand and up to three you never want to hear about it, picked from a curated chip list. Each word nudges five measurable axes (chroma, value range, temperature, harmony tension, accent count) by a fixed, known amount — never an arbitrary interpretation of free text
2. **What's it for** — the same seven goal categories as the Health Score, since that's exactly what they'll be used for: scoring the generated candidates
3. **Which feels closer** — four quick pairwise calls (warm/cool, muted/vibrant, restrained/bold, minimal/layered) with no colour names at all, using abstract built-in colour cards. You can also compare two photos of your own instead of the built-in cards — each photo is measured with the same OKLab pipeline as everywhere else in the app (never trusted as a vibe), and whichever one you pick nudges the axis by how much it actually measured warmer, more saturated, or more varied than the other
4. **Your directions** — generates ~500 candidate palettes inside the resulting target region (seed hue from the temperature bias, a harmony template weighted by the tension bias, chroma/value targets from the rest), scores every one with the exact same health-score engine used everywhere else, keeps the ones that pass a real accessibility/hierarchy gate, and surfaces the four highest-scoring that are also visibly distinct from each other. Each direction gets a name and a "why this" explanation derived entirely from your answers and that palette's own measured properties, never invented copy. Choosing one switches straight into Analyse mode with it loaded

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
