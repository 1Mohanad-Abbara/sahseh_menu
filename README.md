# Sahseh Static Menu

Sahseh Static Menu is the customer-facing Arabic RTL QR menu for in-restaurant use. It is a dependency-free static website and does not contain cart, checkout, or ordering features.

## How It Works

The page shows a complete fallback menu immediately, then loads the canonical menu deploy copy from `data/menu.json`. If the JSON request fails, the fallback remains usable. Customers can browse categories, open product details, switch between dark and light themes, and return to the top of the page.

## Main Files

- `index.html`: page shell and reliable fallback menu.
- `styles.css`: responsive layout and theme styling.
- `script.js`: menu loading and interactive behavior.
- `data/menu.json`: deployed menu data copy.
- `assets/`: logo, icons, background, product-image directory, and QR assets.

## Development

Run the site through a local HTTP server from the repository root so the JSON request works correctly. The project has no build step.

## Source And Deployment

Canonical menu data and shared assets are maintained in `../sahseh_source`. Sync changes from the source repository before deploying this repository through Vercel or another static host.

The current menu contains 13 categories, 104 products, and 104 prices.