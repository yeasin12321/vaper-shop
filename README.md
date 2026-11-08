# Yeaxmi site (local copy) with Google Sheet products

## Run locally
Open the folder in VS Code and start **Live Server** (or run `python -m http.server 5500`) then open `http://127.0.0.1:5500/products.html`.
Opening the files by double-click will not load the product data (browsers block `fetch` on `file://`).

## Connect Google Sheets
1. Create a Google Sheet with two tabs: **Products** and **Plans**. Import `data/products.csv` and `data/plans.csv` as a starting point (File > Import).
2. For each tab: File > Share > **Publish to web** > choose the tab > **CSV** > Publish. Copy the link.
3. Paste the two links in `js/config.js` (`PRODUCTS_CSV_URL`, `PLANS_CSV_URL`). Leave empty to use the sample files in `data/`.
Changes in the sheet show on the site within about 5 minutes (`CACHE_MINUTES`; Google also caches published sheets for a few minutes).

### Products tab columns
| column | meaning |
|---|---|
| slug | unique id used in the link `product.html?slug=...` (lowercase, dashes) |
| name, subtitle, category | shown on the card and the detail page |
| image | image path or URL for the card |
| gallery | optional, several image URLs separated by `|` (first one is shown on the card if `image` is empty) |
| badge | optional label on the card, e.g. `Up to 25% off` |
| rating, sold | optional |
| price, price_from | only used when the product has no row in Plans; `price_from` = `yes` shows "From" |
| description | short text on the detail page |
| what_you_get | list, items separated by `|` |
| how_you_get_it, delivery_time, rules_of_use, support | text shown in the details accordion |
| status | `active` (or empty) = visible; `inactive`, `hidden`, `draft` = hidden |
| sort_order | number, lower comes first ("Recommended"); the highest number is "Newest" |

### Plans tab columns
`slug`, `plan` (e.g. 1 Month), `price` (number), `old_price` (optional, shows a Save % badge), `stock` (number, empty = always in stock, 0 = out of stock), `about` (text under "About this plan").
One product can have many plan rows. The card shows "From" the lowest price and "N plans".

## Pages
- `products.html` : list, search, category filter, sort, paging (all from the sheet)
- `product.html?slug=...` : one template for every product (gallery, plans, price, stock, details)
- other pages (home, about, faq, blog, ...) are the saved static pages; the home page product sections are still static and need the same treatment if you want them from the sheet.
- Cart / Buy Now / login / payment are not functional in this static copy: Buy Now stores the item in the browser and opens `cart.html` (`CHECKOUT_URL` in `js/config.js`).

## Rebuild from saved pages
`python split_site.py saved1.htm saved2.htm --out Yeaxmi-site` re-creates the static pages from SingleFile saves.
