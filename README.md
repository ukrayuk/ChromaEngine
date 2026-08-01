# ChromaEngine

A colour harmony explorer for painters, printmakers, illustrators and designers — any medium, one wheel.

Pick a colour by picker, hex, RGB or HSL sliders and ChromaEngine hands back everything you need to put it to work:

1. **Choose your colour** — picker, hex, RGB, and H/S/L sliders, plus six studio-start swatches
2. **What's the plan for your palette?** — an opinionated brief tuned to the job: website/app, promotional & business print, brand identity, or studio & fine art. Each brief gives a verdict, four moves, exact hand-off values (HEX / RGB / CMYK / HSL and more), and the tests the colour has to pass
3. **Tints & shades** — a seven-step value ramp
4. **Colour families** — analogous, complementary, split-complementary, triadic, tetradic and monochromatic schemes, every swatch copy-on-tap
5. **Put to work** — live poster, website and promo-tile mockups built from the current family
6. **Contrast & legibility** — WCAG 2.x contrast ratios (AA/AAA, body/large/UI), nearest-passing colour fixes, and ready-made readable pairs
7. **Accessible UI theme** — light and dark token sets derived from the colour, each token checked against its WCAG target, exportable as CSS variables

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
