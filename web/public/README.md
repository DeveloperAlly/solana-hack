# web/public: logo and favicon

Static files Vite copies as-is to the site root ([Vite docs: the public directory](https://vite.dev/guide/assets#the-public-directory)). They were added for [issue #47](https://github.com/DeveloperAlly/solana-hack/issues/47). The look is wireframe black and white, per [ADR-009](../../.agentic/what/decisions/adr_009_rename_jamjam.md).

## Files

| File | What it is |
|---|---|
| `brand/logo-mark.svg` | **Source of the mark**: the pitch deck's mark, a square with both diagonals, on a 64-unit grid at the deck's proportions (3-unit square, 2-unit diagonals), drawn in `currentColor`. The owner chose it over the #47 options on 2026-10-12. The in-app logo uses this file's geometry. |
| `brand/icon-mark.svg` | The same mark with heavier strokes (6-unit square, 4-unit diagonals) and a small inset, so it still reads at 16 and 32 px. The favicon files are drawn from it. |
| `brand/options/*.svg` | The three concepts first drawn for #47 and not used: `jar-check.svg`, `interlocking-js.svg` and `jj-box.svg`. Kept for reference. |
| `favicon.svg` | Browser-tab icon: `icon-mark.svg` in black on a white square. A `prefers-color-scheme: dark` rule inside the SVG swaps it to white on black. |
| `favicon-32.png` | 32 px PNG fallback for browsers without SVG favicons. |
| `apple-touch-icon.png` | 180 px home-screen icon for iOS: the mark on an opaque white square with a margin around it. Safari uses `apple-touch-icon.png` from `<link rel="apple-touch-icon">` or the site root ([Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)). |
| `site.webmanifest` | Web app manifest: the name JamJam and the three icons. |

`web/index.html` links `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` and `site.webmanifest`.

The in-app logo is the React component `web/src/ui/brand/Logo.tsx`. It inlines `logo-mark.svg`'s geometry in `currentColor`, so it follows the theme's text colour. The "JamJam" wordmark is live text in the theme's display font (`--wl-font-display`), so a new theme restyles it.

## Regenerate the PNGs

The converter is [`@resvg/resvg-js`](https://github.com/thx/resvg-js). It is not a project dependency, so install it without saving it:

```sh
cd web
npm i --no-save @resvg/resvg-js@2.6.2
node scripts/make-icons.mjs
```

`scripts/make-icons.mjs` reads `brand/icon-mark.svg` and writes `favicon-32.png` and `apple-touch-icon.png`. A later `npm ci` removes the converter again.

## Swap in another option

1. Copy the shapes inside the option's `<svg>`, for example `brand/options/jj-box.svg`, into `brand/logo-mark.svg`. Keep the `viewBox="0 0 64 64"` and any per-shape `stroke-width`.
2. Put the small-size version of the same shapes (heavier strokes) in `brand/icon-mark.svg` and inside the `<g class="ink">` in `favicon.svg`.
3. Put the same shapes inside the `<svg>` in `web/src/ui/brand/Logo.tsx`, using JSX attribute names (`strokeWidth`, not `stroke-width`).
4. Regenerate the PNGs as shown above.
5. Run `npm run lint:tokens && npm test` in `web/`.
