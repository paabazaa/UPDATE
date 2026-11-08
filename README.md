# SURGICISS LTD website

Website, customer accounts and quote API for SURGICISS LTD (sterile instrument systems: the Surgical Instrument Master Wrap, count sheet holders, software and more). The public catalogue opens immediately. Reading the site never needs an account.

The pages are plain HTML, CSS and browser JavaScript. One small Node server (`server/index.js`) serves the built site and the API from the same address, and stores accounts, quotes and enquiries in MySQL.

## Getting started

Requires Node.js 20.6 or later (22.5 or later to run the tests).

```bash
npm install        # installs Vite, MySQL and email packages
npm run dev        # development server on http://localhost:8080
npm run build      # production build into dist/
npm run preview    # preview the production build
npm run serve      # serve dist/ with the bundled Node static server (no Vite needed)
npm test           # API and content tests (no browser needed)
npm run test:pages # opens every page in a real browser (needs Playwright, see Tests)
```

The stylesheet, scripts, images and documents live in `public/` and are copied to `dist/` unchanged.

## Deploying on Render

The live site runs as one Render web service connected to this GitHub repository. Every change merged into `main` redeploys it.

| Render setting | Value |
| --- | --- |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `node server/index.js` |
| Environment | the settings in `.env.example`, entered in Render's Environment tab |
| Secret file | the database provider's CA certificate at `/etc/secrets/aiven-ca.pem` (or set `DB_SSL_CA_FILE`) |

After a deploy, open `/api/health` on the site. It shows whether the database is reachable and whether email is switched on (`"mail":{"notifications":true,"provider":"brevo"}`), and never shows any key or address. The Render log prints a `[mail]` line at start that says the same.

## What visitors can do without an account

Home, about, products, product categories, software, services, programmes, count-sheet holders, resources, FAQ, search, privacy, terms and the contact page are all public.

The home page is the first screen. Nothing redirects a new visitor to login.

## Optional accounts

Login and Create account sit in the header (and in the menu on a phone). They open login, create account and forgot password pages, plus a dashboard with My profile, My quotes, My enquiries, My orders and Account settings. Public pages never require an account.

The site runs in one of two modes, chosen by `apiBase` in `public/js/config.js`:

- **Server mode (`apiBase` set):** accounts, quote requests and enquiries are stored in MySQL through the API in `server/`. Passwords are hashed with scrypt, and the browser holds only an HttpOnly session cookie. Forgot password emails a one-hour, single-use link.
- **Browser-only mode (`apiBase` empty):** with no server, accounts and requests stay in the visitor's `localStorage` on that device. This is not secure sign-in and nothing reaches SURGICISS. It exists so the site still works on plain static hosting. Pages have real addresses such as `/products`, so a static host must answer every page address with `index.html` (the Node server in `server/` already does). Old links in the `/#/products` form still open the right page.

**My orders** stays empty in both modes until an order system is connected. No orders are invented.

## Quotes

**Generate quote** is available from the header, the mobile bar and the page footers. Anyone can browse the products first, but **a quote can only be requested by someone who has an account and is logged in**; anyone else is asked to log in or create an account and is brought back to the form afterwards. Selections are kept while they do that.

The form asks for items, quantities, contact details, organisation, delivery location and any extra requirements. When a quote is sent, the customer sees a thank-you message and the business is emailed at `NOTIFY_EMAIL`.

No prices, taxes, discounts or delivery charges are shown. A quote request is not an order, and **My orders** stays empty until an order system is connected.

## Enquiries

**Ask a question** and **Contact us** open the public enquiry form. Name, email, subject and message are required, along with the organisation and country fields already used by the site. **No account is needed to ask a question.** Each enquiry is also emailed to `NOTIFY_EMAIL`, and replying to that email answers the customer directly.

## Database and API (MySQL)

The website cannot talk to MySQL directly: anything in `public/` is downloaded by every visitor. The API in `server/` sits between the site and the database and is the only place that holds database credentials.

### 1. Create the database

In MySQL 8 (or MariaDB 10.5+):

```sql
CREATE DATABASE surgiciss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'surgiciss'@'%' IDENTIFIED BY 'a-long-random-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON surgiciss.* TO 'surgiciss'@'%';
```

Restrict the `'%'` host to your API server's address where your host allows it.

### 2. Configure and start the API

```bash
cp .env.example .env     # then fill in the database, ALLOWED_ORIGINS, SITE_URL and mail settings
npm install
npm run db:migrate:dev   # creates the database and applies any new changes from server/migrations (safe to repeat)
npm run api:dev          # starts the API (default port 3000)
```

On a host that sets environment variables in a control panel instead of a `.env` file, use `npm run db:migrate` and `npm run api`. The API needs Node.js 20.6 or later and must be served over HTTPS in production.

Settings are in `.env.example`. The important ones:

| Setting | Meaning |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection. |
| `ALLOWED_ORIGINS` | Website addresses allowed to call the API, with no path and no trailing slash. When the site and API share one address (as on Render), use that address. |
| `SITE_URL` | Public website address, for example `https://update-xyvr.onrender.com`. Used to build the link in password-reset emails. |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | Use `true` and `None` when the website and API are on different domains (HTTPS required). Use `Lax` when they share a domain. |
| `BREVO_API_KEY` and `MAIL_FROM` | Outgoing email through Brevo's web API (recommended on Render's free plan, which blocks SMTP). `MAIL_FROM` must be an address verified in Brevo, for example `SURGICISS LTD <surgiciss@gmail.com>`. |
| `RESEND_API_KEY` | Alternative to Brevo. Resend only delivers to your own address until a domain is verified. |
| `SMTP_*` | Alternative on hosts that allow SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`. |
| `NOTIFY_EMAIL` | Where new quotes and enquiries are announced. Defaults to `surgiciss@gmail.com`. |
| `TRUST_PROXY` | `true` when a proxy or host sits in front of the API, so rate limits see the real visitor address. |

### 3. Point the website at the API

Set the API address in `public/js/config.js`, then rebuild and redeploy the site:

```js
const SURGICISS_CONFIG = {
  apiBase: "https://api.example.com",
  submissionEndpoint: ""
};
```

### Sign in with Google or Facebook

People who already have a Google or Facebook account can use it instead of creating a password. The buttons appear on the login and sign-up pages only when the provider is configured, so the site works the same without them.

1. Set `API_URL` to the public address of the API and keep `SITE_URL` as the website address (people are sent back there after signing in).
2. **Google:** in Google Cloud Console create an OAuth client (type "Web application") and add `API_URL/api/auth/oauth/google/callback` as an authorised redirect URI. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. **Facebook:** in Meta for Developers create an app with the Facebook Login product and add `API_URL/api/auth/oauth/facebook/callback` as a valid OAuth redirect URI. Put the app ID and secret in `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`. The app must be switched to live mode for people outside your team to use it.
4. Restart the API and run `npm run db:migrate` once so the sign-in tables exist.

How it behaves: a returning person is signed straight in. If the provider's confirmed email matches an existing account, the two are linked, and a password that was never verified is discarded so nobody can keep access they did not own. Accounts created this way have no password; the settings page says so, and deleting one asks the person to type DELETE. The flow is covered by automated tests with a stand-in provider; it has not been run against real Google or Facebook credentials.

### What the API does

- Sign up, login, logout, profile update, password change, account deletion, forgot and reset password.
- Stores quote requests and enquiries (signed in or not). Signed-in customers see only their own under My quotes and My enquiries.
- Stores newsletter sign-ups in `newsletter_subscribers`.
- Rate limits sign-up, login, reset, submissions and newsletter calls, and limits request size.
- Rejects state-changing requests from websites that are not in `ALLOWED_ORIGINS`.
- Emails the business about every new quote and enquiry, and emails password-reset links. A mail failure never loses a saved request: it is written to the log as `[mail] ...` with the reason.
- `GET /api/health` reports database and email status.

### Things to know

- Email addresses are not verified at sign-up. For that reason, requests sent before an account existed are **not** attached to it automatically, so nobody can claim another person's requests by registering their address.
- Quotes and enquiries are stored as JSON in the `payload` column, with the customer's email and account in their own columns for searching. Nothing in the site reads them for staff yet: use your own SQL tool or build an admin view.
- Rate-limit counters live in memory and reset when the API restarts. Run a single API process, or add a shared limiter before scaling out.
- Quotes and enquiries are stored in your own database, so keep backups. If email is not working, they are still saved; look them up with your SQL tool.

## Tests

| Command | What it checks |
| --- | --- |
| `npm test` | The API against an in-memory SQLite database (needs Node.js 22.5 or later; it does not touch MySQL), and the site content: every product, software item, service and programme is complete, every picture, the logo and the Master Wrap PDF exist, and the files named in `index.html` exist. |
| `npm run test:pages` | Opens every page in a real browser: each page has a heading and no script errors, every header and footer link works, pictures load, the Master Wrap PDF downloads, the login page order is right, quotes need a login, and nothing scrolls sideways on a phone. Install Playwright first: `npm install --no-save playwright && npx playwright install chromium`. |

`npm run lint` checks the Node code and `npm run format` tidies the layout of the files (settings in `eslint.config.js` and `.prettierrc.json`). GitHub shows the lint result as an advisory check that never blocks a deploy.

GitHub runs both automatically on every push (`.github/workflows/ci.yml`). A red mark on a commit means a test failed; it does not stop Render from deploying. Run `npm run db:migrate` against a real MySQL once and sign up once to confirm a new setup.

## Folder layout

| Path | Purpose |
| --- | --- |
| `index.html` | Vite entry and page shell. The pages themselves are drawn by the scripts. |
| `vite.config.js` | Vite settings (output in `dist/`). |
| `server/index.js` | Starts the server: creates missing tables, serves `dist/` and the API. |
| `server/app.js` | The API routes: accounts, quotes, enquiries, newsletter, health. |
| `server/config.js` | Reads every setting from environment variables. |
| `server/db.js` | MySQL connection (needs the CA certificate file on Render). |
| `server/mailer.js` | Sends email through Brevo, Resend or SMTP. |
| `server/oauth.js` | Google and Facebook sign-in steps. |
| `server/passwords.js`, `ratelimit.js`, `validation.js` | Password hashing, request limits, input checks. |
| `server/migrations.js`, `server/migrations/` | Database changes, applied in order and recorded in the `schema_migrations` table. To change the database, add a new numbered `.sql` file and list it in `migrations.js`; the server applies it on the next start. |
| `server/test/` | API tests. |
| `test/` | Content tests (`content.test.mjs`) and browser page tests (`pages.test.mjs`). |
| `scripts/` | `serve-static.mjs` (static server), `migrate-db.mjs` (creates tables) and `list-users.mjs` (lists accounts for debugging). |
| `.env.example` | Settings for the server (copy to `.env`, or enter them in Render). |
| `.github/` | Test workflow, Dependabot, issue and pull request templates, code owners. |
| `public/css/styles.css` | Layout and the purple and navy styling. |
| `public/js/data.js` | Products, software, services and programmes. |
| `public/js/places.js` | Country and city pickers used by the forms. |
| `public/js/config.js` | API address (`apiBase`) and company contact details. |
| `public/js/api.js` | Small client for the API. |
| `public/js/accounts.js` | Accounts: browser-only store or the API, depending on `apiBase`. |
| `public/js/records.js` | Quotes, enquiries and the quote draft. |
| `public/js/customer/` | Account pages, quote builder and form delivery, split into small files (core, quote, auth, dashboard, modals, records, forms, events, actions). |
| `public/js/site/` | Public pages, navigation and search, split into small files (core, components, layout, enquiry, pages, pages-*, router, events). |
| `public/images/` | Photographs, product pictures and the logo. |
| `public/documents/` | Downloadable documents, such as the Master Wrap instructions for use. |
| `public/robots.txt`, `sitemap.xml` | For search engines. Update the address in both if the site moves to its own domain. |

## Content

Product names, descriptions, services and programmes are in `public/js/data.js`. No prices, certifications or testimonials have been invented. Where a product code, price or document is not yet available, the page says it is available on request. The Surgical Instrument Master Wrap page includes the full Instructions for Use (PDF download plus the steps, pictures and materials information).
