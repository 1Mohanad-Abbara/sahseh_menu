# Sahseh Static Menu

Static Arabic RTL QR menu website for Sahseh. This repo is the deployed in-restaurant menu and is separate from any future ordering app. Keep it fast, dependency-free, and usable without checkout/order actions.

Last reviewed against `index.html`, `styles.css`, `script.js`, and `data/menu.json` on 2026-08-06.

## Source Of Truth

Do not manually edit menu data or shared visual assets here as the source of truth.

Canonical data and shared assets live in the sibling source repo:

```text
../sahseh_source/
```

This static repo keeps deploy copies because Vercel serves this repo independently and the browser must fetch local public paths such as `data/menu.json` and `assets/beauty/icons/...`.

## Structure

- `index.html` - Arabic RTL page shell, sticky header, theme button, hardcoded fallback nav/menu, footer, product modal markup, and back-to-top button.
- `styles.css` - all layout, dark/light theme variables, responsive RTL styling, modal styling, focus states, and back-to-top visibility styling.
- `script.js` - theme persistence, JSON menu loading/rendering, section nav scrolling, product modal behavior, and back-to-top behavior.
- `data/menu.json` - synced deploy copy from `../sahseh_source/data/menu.json`.
- `assets/brand/brand-art.png` - current header logo.
- `assets/beauty/background-pattern.svg` - page background pattern.
- `assets/beauty/icons/*.svg` - category icons used by both nav and section headings.
- `assets/img/products/.gitkeep` - placeholder directory for future product images; no product images are currently populated.
- `assets/qr/` - static QR image/PDF assets owned by this repo.

## Runtime Flow

1. `index.html` renders a complete fallback menu immediately. The fallback currently matches the JSON at 13 sections and 104 products.
2. A small inline head script checks `localStorage["sahseh-menu-theme"]` before CSS loads and sets `html[data-theme="light"]` to reduce theme flash.
3. `styles.css` defaults to the dark red/black theme. Light mode is controlled only by `:root[data-theme="light"]` variables and overrides.
4. `script.js` calls `loadMenuData()`, fetches the path in `main.menu-page[data-menu-source]` (`data/menu.json`), then replaces the fallback menu with DOM generated from JSON.
5. If the fetch fails, the fallback HTML remains visible and usable.

Run through a local HTTP server when testing the JSON-rendered path. Opening `index.html` directly can block or fail the `fetch("data/menu.json")` request depending on the browser.

## JavaScript Behavior

- Theme state is stored under `sahseh-menu-theme`; only `"light"` is persisted explicitly as light, everything else falls back to dark.
- Section nav links are wired by `setupSectionNav()` and scroll with `window.scrollTo()` using the sticky header height plus 8px.
- Initial URL hashes rely on normal browser hash behavior plus CSS `scroll-padding-top`/`scroll-margin-top`; there is no manual scroll restoration or post-render hash correction in the current JS.
- `renderMenu()` replaces all children of `.menu-page`, then rewires nav and product row events.
- Product rows become keyboard-accessible buttons with `tabindex="0"`, `role="button"`, click handling, and Enter/Space handling.
- The product modal reads the row text and optional `data-image` / `data-ingredients`. Current JSON has no product images or ingredients, so the modal shows the placeholder image box and `سيتم إضافة المكونات لاحقا.`.
- Modal close behavior is backdrop click and Escape. There is no visible close button in the panel.
- Back-to-top appears after scrolling past 240px and hides while the footer is visible. It uses `IntersectionObserver` when available, with a viewport fallback.

## Implementation Details To Preserve

- This repo should not add checkout, cart, or ordering controls; it is the QR menu only.
- The header keeps a deliberate small visual gap between `صَح صِح` and `بيتك ومطرحك`; `.brand-statement` controls it.
- In the footer, only the phone number text is clickable. The phone link is wrapped inside `p.footer-phone` so the surrounding footer area does not trigger a telephone link.
- Product rows and section buttons should not gain touch/click color flashes, hover backgrounds, or active scale animation. Keep keyboard `:focus-visible` outlines.
- All runtime assets are local except the Google Font request. There is no third-party JavaScript and no build step.

## Data Contract

`data/menu.json` uses `schemaVersion: 1`, `locale: "ar-SY"`, `direction: "rtl"`, and `currencyCode: "SYP"`.

Each category is expected to have:

- `id`
- `sectionId` matching links like `#section-01`
- `name`
- `order`
- `icon`
- `products`

Each product is expected to have:

- `id`
- `name`
- `price`
- `priceText`
- `order`
- `image`
- `ingredients`
- `available`
- `visibleInDineIn`
- `visibleInOrdering`

Current JS renders categories and products in the array order from JSON. It does not sort by `order` and does not filter by `available`, `visibleInDineIn`, or `visibleInOrdering`. `priceText` wins when present; otherwise a numeric `price` is formatted with two decimals.

When updating menu content, keep `data/menu.json` and the fallback menu inside `index.html` in sync unless the source sync workflow intentionally regenerates both. The fallback matters for fetch failures and no-JS resilience.

## Styling Contract

- The page is Arabic RTL (`html lang="ar" dir="rtl"`) and uses the Google Font `Tajawal`.
- The primary layout is intentionally narrow: `.menu-page` is capped at 760px.
- Header is sticky and participates in scroll offset calculations; if header height changes, retest nav clicks and direct hash URLs.
- Avoid tap/active color flashes on product rows and section buttons. Keep keyboard `:focus-visible` outlines.
- Product row layout reserves a fixed price column so long Arabic names wrap without pushing prices out of alignment.
- Theme changes should stay variable-driven where possible. Dark mode is the default.

## Local Run And Checks

Use any simple static HTTP server from the repo root, then open the local URL:

```text
python -m http.server 8000
```

Useful checks before handoff:

- Verify the page loads in dark mode by default and the theme toggle persists light mode.
- Verify `data/menu.json` loads over HTTP and replaces the fallback without losing section nav or modal behavior.
- Verify category links land below the sticky header on mobile and desktop.
- Verify product rows open the modal with name, price, placeholder image, and fallback ingredients.
- Verify the back-to-top button appears after scrolling and hides near the footer.
- Run `node --check script.js` after JS edits.

## Publish

This repo is intended for Vercel static hosting through GitHub. Use the repository root as the project root and serve `index.html` as the home page. No build command is required for the current static version.

## Update Workflow

1. Edit menu data/assets in `../sahseh_source`.
2. Run the source sync script from the parent workspace.
3. Run the source validation script.
4. In this repo, verify `data/menu.json`, fallback HTML, and copied assets are in sync.
5. Test through a local HTTP server.
6. Commit and deploy this static repo if deploy copies changed.

## Current Counts

- 13 categories.
- 104 products.
- 104 prices.
- 0 populated product images.
- 0 populated product ingredient descriptions.
- No empty price slots.
