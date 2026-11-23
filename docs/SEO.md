# Search engine optimisation

What was done for each of the 14 points, and the steps that only you can do (they need your Google account or your business).

## How the site now reaches search engines
Before, every page was built by JavaScript in the visitor's browser, so a search engine often saw an empty page. Now the server runs the very same page-building code once at start (`server/seo.js`) and keeps the finished HTML of every page in memory. Each address answers with the real page content, its own title, description, canonical address and structured data. The browser then takes over exactly as before.

`SITE_URL` must be the real public address of the site (for example `https://www.surgiciss.com`). Canonical addresses, the sitemap, the robots file and structured data are all written from it. When the domain changes, change `SITE_URL` and redeploy. Nothing else needs editing.

## The 14 points
| # | Point | Status |
|---|---|---|
| 1 | Server-render your pages | **Done.** All public pages, plus the sign-in pages, arrive as full HTML. Checked by `server/test/seo.test.mjs`: every page has an `h1` and real content in the HTML the server sends. If building them ever fails at start, the site falls back to the plain app instead of going down. |
| 2 | Use real links | Every navigation item is an `<a href>`. The tests fail on any `href="#"` or `javascript:` link. The few buttons left (slide arrows, menu toggles) do not navigate. |
| 3 | Set up Search Console | **Needs you**, see the steps below. The code is ready: set `GOOGLE_SITE_VERIFICATION` and every page carries the tag. |
| 4 | Add a sitemap.xml | **Done.** `/sitemap.xml` is written by the server from the real list of public pages (32 today), on the `SITE_URL` address. `/robots.txt` names it. The old hand-written files were removed because they had a fixed address. |
| 5 | Hunt for stray noindex | **Checked.** Nothing on the site says noindex except the pages that should: sign-in, account, search results and not-found pages. A test fails if any public page ever gets one. |
| 6 | Return real 404s | **Done.** An address that does not exist now answers with status 404 (and `noindex`) instead of showing the home page with a 200. |
| 7 | One URL per page | **Done.** Trailing slashes (`/products/`), capital letters (`/Products`), `/index.html` and `/request-quote` all redirect (301) to the one real address, and every page names its canonical address. |
| 8 | Unique title per page | **Done.** Every page has its own title and its own description. A test fails on any repeated title or a description outside 50 to 165 characters. |
| 9 | Same content on mobile | **Checked.** The phone layout is the same HTML restyled, not a different page. Nothing in the page content is hidden on small screens; only the header's account links move into the menu. |
| 10 | Write image alt text | **Done.** Product, software and slide pictures now describe what they show. Only purely decorative images (page banners, the round avatar) have empty alt text, on purpose. A test fails on any image with no `alt`. |
| 11 | Add structured data | **Done.** Organization and WebSite on the home page, Organization on Contact, FAQ on the FAQ page, Product on each product, SoftwareApplication on each software system, Service on each service and programme, and breadcrumbs on all inner pages. It contains only facts that are already on the page. There are no invented prices or star ratings, and a test checks that. |
| 12 | Pass Core Web Vitals | **Improved, not proven.** The header logo went from 269 KB to 51 KB, pages and scripts are compressed (brotli) and cached, the first slide image loads first, and images have width and height so the page does not jump. Real scores only come from real visitors: after launch, read the Core Web Vitals report in Search Console (it needs about a month of visits). |
| 13 | Fact-check AI content | **Needs you**, see `docs/CONTENT-CHECK.md`. It lists every claim on the site that needs evidence before it is left up. |
| 14 | Claim Google Business Profile | **Needs you**, see the steps below. |

## Search Console (about 10 minutes)
1. Go to search.google.com/search-console and sign in with the Google account that should own this.
2. Add the property. Choose "URL prefix" and enter the exact `SITE_URL`.
3. Choose the "HTML tag" verification method. Copy only the value of `content="..."`.
4. In Render, add the environment variable `GOOGLE_SITE_VERIFICATION` with that value and redeploy. Then press Verify in Search Console.
5. Open Sitemaps, enter `sitemap.xml` and submit it.
6. Open URL Inspection, paste the home page address and press "Request indexing". Do the same for Products, Software and Contact.
7. Come back in a week and look at Pages (what is indexed and why anything is not) and later Core Web Vitals.

## Google Business Profile (about 15 minutes, then a verification step from Google)
1. Go to business.google.com and search for SURGICISS LTD first. If a profile already exists, claim it instead of making a new one.
2. Name: `SURGICISS LTD`, exactly as on the website. Category: choose the closest to a medical supplier or equipment supplier.
3. Address, phone and website must match the website **exactly**: Bolgatanga, Upper East Region, Ghana; +233542205201; the `SITE_URL` address. Search engines compare these.
4. If customers do not visit an office, set it as a service-area business and hide the street address.
5. Verify with the method Google offers (postcard, phone, video or email). Without this the profile stays hidden.
6. Add real photos (the building, the team, the products) and the opening hours. The website currently shows opening hours as "Available on request", so decide the real hours first.
7. Do not ask for or buy fake reviews. Ask real customers to leave real ones.

## Keeping it healthy
- When you add a product, software system, service or programme in `public/js/data.js`, it appears in the sitemap, gets its own title, description and structured data, and is built on the server. No other change is needed.
- Run `npm test` before every release. `server/test/seo.test.mjs` fails if a page loses its title, content, canonical address or structured data.
