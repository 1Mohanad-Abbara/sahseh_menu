# Sahseh Static Menu

Static Arabic RTL QR menu website for Sahseh.

This repo is the deployed in-restaurant menu. It is separate from the future ordering app and should stay fast, reliable, and usable without checkout/order actions.

## Source Of Truth

Do not manually edit menu data or shared visual assets here as the source of truth.

Canonical data and shared assets live in the sibling source repo:

```text
../sahseh_source/
```

This static repo keeps deploy copies because Vercel serves this repo independently and the browser must fetch local public paths such as `data/menu.json` and `assets/beauty/icons/...`.

## Structure

- index.html - static page shell, fallback menu markup, header, footer, and modal markup.
- styles.css - responsive RTL menu styling and modal styling.
- script.js - loads `data/menu.json`, renders the visible menu, and preserves fallback behavior.
- data/menu.json - synced deploy copy from `../sahseh_source/data/menu.json`.
- assets/brand/brand-art.png - synced deploy copy of the logo.
- assets/beauty/ - synced deploy copy of background and icons.
- assets/img/products/ - synced deploy copy of future product images.
- assets/qr/ - static menu QR assets owned by this repo.

## Runtime Behavior

`index.html` loads first with a hardcoded fallback menu. Then `script.js` fetches `data/menu.json` and rebuilds the visible menu from JSON.

If `data/menu.json` fails to load, the fallback HTML menu remains visible.

## Current Behavior Notes

- The header keeps a deliberate small visual gap between the brand title `صَح صِح` and the statement `بيتك ومطرحك`; this is controlled by `.brand-statement` in `styles.css`.
- In the footer, only the phone number text is clickable. The phone link is wrapped inside `p.footer-phone` so the surrounding footer area does not trigger the telephone link.
- Product rows are clickable and keyboard accessible, but touch/click should not show a color flash, hover background, or active scale animation. Keep the keyboard `:focus-visible` outline.
- Section buttons scroll to the exact section start below the sticky header and should not show a tap/active color flash. Initial page loads with a URL hash such as `#section-10` must behave the same way.
- `script.js` sets manual scroll restoration and re-settles the hash target after paint, font readiness, page load, and JSON menu render. Preserve this if changing the header height, menu rendering, font loading, or section navigation.
- When checking hash behavior, test through a local HTTP server rather than opening `index.html` directly, because the runtime menu fetch depends on `data/menu.json` being served over HTTP.

## Publish

This repo is intended for Vercel static hosting through GitHub. Use the repository root as the project root and serve `index.html` as the home page. No build command is required for the current static version.

## Update Workflow

1. Edit menu data/assets in `../sahseh_source`.
2. Run the source sync script from the parent workspace.
3. Run the source validation script.
4. Commit and deploy this static repo if its deploy copies changed.

## Current Counts

- 13 categories.
- 103 products.
- 103 prices.
- No empty price slots.
