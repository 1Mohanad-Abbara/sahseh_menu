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
