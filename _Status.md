# ChromaEngine — Project Status
*Updated: 13 August 2026*

status:
stage:
last_touched:
next_action:
feeds_into: []        # or content_source: [] for multi-parent (e.g. a
                       # project fed by more than one upstream)

---

## Current State

- **Status**: Active
- **Started**: 2 August 2026
- **Summary**: A dependency-free, single-file colour tool for artists, built in support of three parallel projects: the book (Colour Theory for the Coloured Pencil Artist), and the two website builds, studioartistrybyray.co.uk and ctftcpa.co.uk. Four modes: **Build** a palette from one colour (picker/hex/RGB, typeable H/C/L fields, an "I'm feeling lucky" gamut-aware random start, tints/shades, colour families, mockup previews, WCAG/contrast tools, exportable UI theme); **Analyse** an existing palette (goal-weighted Palette Health Score, plain-language fixes, production theme generation); **Extract** from a photo (OKLab k-means auto-extraction plus a manual, now-draggable full-resolution eyedropper, entirely client-side); **Discover** a palette from an intent-first wizard (brand words, goal, pairwise feel questions → ~500 scored candidates, four distinct directions surfaced). Every colour matched against a hand-validated 120-pencil Faber-Castell Polychromos dataset in OKLab, shown as a 0-100% match score everywhere a pencil appears (Build, photo, Analyse, and the printable swatch card). Studio Artistry by Ray's logo now sits in the header.
- **Where it lives**: GitHub repo `ukrayuk/ChromaEngine` (branch `main`), deployed live to `ukrayuk.github.io` via GitHub Pages, mirrored to a private Claude Artifact for instant preview/edit. Explicit standing instruction from Ray: **never** commit this project into the `studioartistrybyray-site` repo — it has its own repo, kept entirely separate.

---

## Recent Progress
*Handoff from a vault-less Claude Code (web) session, 3 August 2026 — Ray found it filed to `iCloudDrive\Chroma Engine\` instead of pasted directly; content pulled in from there*

- **"Discover a palette" mode added** — the fourth mode, not previously recorded here. Intent-first wizard rather than starting from a colour or photo.
- **Manual eyedropper shipped** — full-resolution exact-pixel sampling on an uploaded photo, alongside the automatic OKLab k-means extraction. This closes the Next Action below asking for exactly this.
- **Two photo-mode bugs fixed**: eyedropper sampling the wrong pixel (root cause: sampling canvas and displayed `<img>` disagreed on EXIF rotation for some camera photos — fixed by canonicalising every upload through one canvas at upload time); origin-marker dots drifting off the photo on non-matching aspect ratios (root cause: dots were positioned against the whole photo box, not accounting for `object-fit: contain` letterboxing — fixed with a shared rect-mapping helper).
- **Terminology locked in as "Chroma," never "Saturation,"** user-facing, matching the book's own language and the vault's existing colour-wheel/Chroma rules.
- **Build mode's 12 starter swatches replaced with Ray's actual Studio brand colours**: `#F2A900 #F2CD00 #C4D600 #00BB31 #279989 #307FE2 #654EA3 #852779 #A50050 #CC0000 #FA4616 #F6780B`. **Confirmed by Ray (3 August 2026): these are the hex equivalents of the twelve Pantone colours already used as the book's chapter accent colours in Affinity Publisher** — same palette, not a new one. Not related to the Website's separate 4-colour section-accent scheme, which serves a different purpose and was never claimed to match.
- Tints/shades expanded 7 → 10 stops (95→10); colour families (complementary, split-complementary, triadic, tetradic, monochromatic) reworked with specific swatch counts and layouts per family.
- **"I'm feeling lucky" button added to Build mode** (handoff update, 4 August 2026) — generates a random starting colour in OKLCH rather than raw RGB: hue unconstrained, lightness kept to 30–75 (OKLab L), chroma kept to 35–85% of whatever that specific hue can actually hold before clipping out of sRGB, found per-hue by binary-searching the gamut boundary rather than using one flat chroma range (blues/reds hold far more chroma than yellows before clipping, so a flat range either muddies some hues or blows out others). Ray's own spec, refined a level deeper on the chroma handling. Verified against 2000 generated samples (all valid, all in-range) plus a 32-swatch visual check, no muddy or neon-screaming results.
- **Pencil matching now shows a 0–100% match score instead of wording** (handoff update, 4 August 2026) — "near-identical / very close / close, slight difference / noticeably different" replaced with an actual percentage on both the three nearest single pencils and the two-pencil layering blend estimate. Derived from the existing OKLab distance, rescaled against a calibration constant (0.5) tuned so real matches use the full range — even the worst-case nearest match for a fully random colour against the 120-pencil set lands around 60%, not 0%.
- **Build mode's Hue/Chroma/Lightness fields made typeable** (handoff update, 7 August 2026) — each slider's value is now an editable number input as well as draggable, kept in sync both ways. Caught and fixed a real sync bug along the way: the old logic tracked which control to leave alone via a shared channel-name flag, which silently broke typing into the new field; switched to checking `document.activeElement`, simpler and correct.
- **Pencil match % extended everywhere** (handoff update, 7 August 2026) — previously only Build mode's nearest-pencils panel had it; now also photo mode's swatch list, Analyse mode's palette strip, and the printable swatch card.
- **Photo mode — eyedropper points now draggable** (handoff update, 7 August 2026) — a manually-sampled point can be dragged to a new spot instead of removed and re-clicked, live-sampling the pixel under the pointer during the drag and committing on release. Auto-extracted swatches stay fixed, since they're cluster centroids, not literal clicks.
- **Bug fix — print swatch card overflowing to an orphaned second page** (handoff update, 7 August 2026) — an 8-swatch card with a reference photo could spill 2 swatches onto their own page 2, caught via Ray's own PDF export. Root cause: the print layout was sized in `rem`, which drifts with browser/OS print scaling. Rewritten in fixed mm units, grid pinned to 4 columns (a palette never exceeds 8 swatches, so 4 columns is always 2 rows or fewer), explicit `@page { size: A4; margin: 12mm }` added. Verified at an emulated A4 print viewport — now fits one page with room to spare.
- **Studio Artistry by Ray logo added to the ChromaEngine header** (handoff update, 7 August 2026), next to the ChromaEngine wordmark. Ray's source file had an opaque black square background rather than real transparency; a colour-based cutout was tried first but ate into the logo's own dark interior shadow gradient (which genuinely dips near-black), so it was reprocessed geometrically instead — finding the logo's actual circle boundary and cutting a clean, anti-aliased circular transparency around it. Downscaled and palette-quantized to ~11KB base64, since it only ever displays at ~52px, keeping the page a single dependency-free file with no separate image asset.

---

## Related Projects

- [[Projects/Colour Theory for the Colour Pencil Artist Book/_STATUS|Colour Theory Book]]
- [[Projects/Studio Artistry by Ray Website/_STATUS|Studio Artistry by Ray Website]]
- [[_SHARED/Pigment Ancestry Model/_Status|Pigment Ancestry Model]] — confirmed 13 August 2026: this will replace or supplement the Polychromos/OKLab matching below. Integration not started, sequenced after the Ancestry Model's own open items (ROY anchor pair, orientation review) settle first
- ctftcpa.co.uk — no vault project folder yet; create one if this site becomes its own tracked piece of work

---

## Locked Decisions

- Rebuilt independently of Lovable (started life there as a project called "Chroma Muse") so Ray stops burning Lovable credits and waiting on its build queue. Entirely separate from the studioartistrybyray-site repo, nothing there was touched.
- Ships as a single self-contained HTML file, zero dependencies, zero build step. Lives in two places kept in sync: private GitHub repo `ukrayuk/ChromaEngine` (main branch) and a private Claude artifact for instant preview and edit.
- The Palette Health Score's dimensions are derived from measurable colour science (WCAG contrast, OKLab perceptual distance, hue-template fit, value range) and weighted by the chosen goal (website, brand, social, packaging, editorial, fine art). Never an arbitrary or opaque number.
- "Improve but keep my style" never changes a hue. Only saturation and lightness move, and only as far as they must.
- The production theme generator maps roles straight from the user's approved palette colours (ground, ink, lead accent, second accent), not resynthesised from a single seed hue.
- Photo-to-palette extraction runs entirely client-side, canvas plus k-means clustering in OKLab. Nothing is ever uploaded anywhere.

---

## Open Questions

- IP ownership and where ChromaEngine sits relative to Studio Artistry by Ray and AbR: not yet decided
- Whether it stays an internal tool for the book and the two sites, or becomes something offered more widely: not yet decided
- **Website colour direction under consideration, not a data conflict.** Ray ran ChromaEngine's new Discover-mode wizard himself on the morning of 3 August 2026 and got a set of colours he found more "edgy" than what's currently locked for studioartistrybyray.co.uk. This is a fresh candidate from experimenting with the new mode, not a second, conflicting existing fact — the Website's own file has deliberately **not** been updated with it, and its current locked colours stand until Ray decides otherwise. Worth a discussion before anything changes there.

---

## Next Actions

- [x] Add a manual eyedropper — shipped, see Recent Progress above
- [ ] Ray to playtest the Health Score against real reference palettes (the shop palette already tested well: scored 76, correctly declined to "improve" a palette that already behaved)
- [ ] Ray to playtest photo extraction against real commission reference photos, not just synthetic test images
- [ ] Decide whether to pursue an App Store build. Wrapping the existing web app (Capacitor) is the low-effort path and shares one codebase across iOS and Android; a fully native rewrite is a much bigger, separate undertaking
- [ ] Continue UI polish if further scroll-fatigue issues surface, beyond the sticky section nav already added
- [ ] Munsell notation — not scoped yet, but plan clarified 4 August 2026: Ray already has Munsell data for the existing Polychromos set, and will pull each new pencil brand's Munsell data alongside its RGB/hex data going forward. Do Munsell properly once the second brand is added, both at once, rather than retrofitting Polychromos alone first
- [ ] Multi-brand pencil matching (Caran d'Ache Pablo and/or Derwent Chromaflow next) — workflow defined (pencil code + name + one sRGB hex from artistpigments.org, same validate-and-cross-check process as the Polychromos set), not yet executed. Their data is used with permission; their spectral diagrams are not reproduced and the model-building process itself is only mentioned briefly in the book, not taught as part of the system — confirmed by Ray 3 August 2026, no permissions concern here
- [ ] Pencil range filtering + "not in your kit" suggestions (planned for once a second brand exists) — a per-owned-range on/off toggle (stored locally, same pattern as the palette gallery) so matching only searches ranges the user actually owns; separately, when the best owned-range match is only mediocre, run an unfiltered search across all brands and surface a meaningfully closer pencil outside the owned ranges as a non-pushy "not in your kit" suggestion, with the option to buy just that one pencil via open stock. Reuses the existing matching/percentage logic, no redesign needed
- [ ] Have the website colour direction discussion (see Open Questions) before touching the Website's own locked colours
- [ ] Integrate the Pigment Ancestry Model's matching/data (confirmed direction 13 August 2026, not started, not scoped — replace vs. run alongside the current Polychromos/OKLab matching still undecided). Don't start before the Ancestry Model's own ROY anchor pair and orientation review are settled — see [[_SHARED/Pigment Ancestry Model/_Status|its status file]]
- [ ] Revisit Locked Decisions once ownership and scope are settled

---

*Origin: Ray's own Lovable project "Chroma Muse," rebuilt from scratch as a zero-dependency app once Lovable credits and build time became a bottleneck.*
