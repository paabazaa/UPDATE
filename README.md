# SURGICISS LTD website

Static HTML, CSS and JavaScript site for SURGICISS LTD. The public catalogue opens immediately. Accounts, quotes and enquiries are optional and are not required to read the site.

## Getting started

Requires Node.js 20 or later.

```bash
npm install        # installs Vite and creates package-lock.json
npm run dev        # development server on http://localhost:8080
npm run build      # production build into dist/
npm run preview    # preview the production build
npm run serve      # serve dist/ with the bundled Node static server (no Vite needed)
```

The site itself is plain HTML, CSS and browser JavaScript. Vite provides the dev server and the production build; the stylesheet, scripts and images live in `public/` and are copied to `dist/` unchanged. Commit `package-lock.json` after your first `npm install`.

### GitHub Pages

Keep **Settings → Pages → Source** set to **GitHub Actions**. The workflow in `.github/workflows/main.yml` installs dependencies, runs `npm run build` and publishes `dist/`. After a change, wait for the action to finish and refresh with a cache bypass.

## What visitors can do without an account

Home, about, products, product categories, software, services, programmes, count-sheet holders, resources, FAQ, search, privacy, terms and the contact page are all public.

The home page is the first screen. Nothing redirects a new visitor to login.

## Optional accounts

Login and Create account sit in the header (and in the menu on a phone). They open login, create account and forgot password pages, plus a dashboard with My profile, My quotes, My enquiries, My orders and Account settings. Public pages never require an account.

The site runs in one of two modes, chosen by `apiBase` in `public/js/config.js`:

- **Server mode (`apiBase` set):** accounts, quote requests and enquiries are stored in MySQL through the API in `server/`. Passwords are hashed with scrypt, and the browser holds only an HttpOnly session cookie. Forgot password emails a one-hour, single-use link.
- **Browser-only mode (`apiBase` empty):** with no server, accounts and requests stay in the visitor's `localStorage` on that device. This is not secure sign-in and nothing reaches SURGICISS. It exists so the site still works on plain static hosting.

**My orders** stays empty in both modes until an order system is connected. No orders are invented.

## Quotes

**Generate quote** is available from the header, the mobile bar and the page footers. Visitors can browse products first and add them to a request.

The form asks for items, quantities, contact details, organisation, delivery location and any extra requirements. Selections are kept if the visitor logs in or creates an account halfway through.

No prices, taxes, discounts or delivery charges are shown. A quote request is not an order. The site does not invent orders: **My orders** stays empty until an order system is connected.

## Enquiries

**Ask a question** and **Contact us** open the public enquiry form. Name, email, subject and message are required, along with the organisation and country fields already used by the site. An account is not required.

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
npm run db:migrate:dev   # creates the tables from server/schema.sql (safe to repeat)
npm run api:dev          # starts the API (default port 3000)
```

On a host that sets environment variables in a control panel instead of a `.env` file, use `npm run db:migrate` and `npm run api`. The API needs Node.js 20.6 or later and must be served over HTTPS in production.

Settings are in `.env.example`. The important ones:

| Setting | Meaning |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection. |
| `ALLOWED_ORIGINS` | Website addresses allowed to call the API, with no path and no trailing slash. For GitHub Pages use `https://paabazaa.github.io`. |
| `SITE_URL` | Public website address including any folder, for example `https://paabazaa.github.io/html`. Used in reset emails. |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | Use `true` and `None` when the website and API are on different domains (HTTPS required). Use `Lax` when they share a domain. |
| `SMTP_*`, `MAIL_FROM` | Outgoing email for password resets. Without them no email is sent. |
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

### Things to know

- Email addresses are not verified at sign-up. For that reason, requests sent before an account existed are **not** attached to it automatically, so nobody can claim another person's requests by registering their address.
- Quotes and enquiries are stored as JSON in the `payload` column, with the customer's email and account in their own columns for searching. Nothing in the site reads them for staff yet: use your own SQL tool or build an admin view.
- Rate-limit counters live in memory and reset when the API restarts. Run a single API process, or add a shared limiter before scaling out.
- The test suite (`npm test`) runs the API against an in-memory SQLite database to check logic, and needs Node.js 22.5 or later. It does not run MySQL. Run `npm run db:migrate` against a real MySQL once and sign up once to confirm your setup.

## Folder layout

| Path | Purpose |
| --- | --- |
| `index.html` | Vite entry and page shell. The pages themselves are drawn by the scripts. |
| `vite.config.js` | Vite settings (relative base, output in `dist/`). |
| `scripts/serve-static.mjs` | Small Node static server used by `npm run serve`. |
| `scripts/migrate-db.mjs` | Creates the MySQL tables. |
| `server/` | The API: `app.js`, `schema.sql`, `index.js`, tests in `server/test/`. |
| `.env.example` | Settings for the API (copy to `.env`). |
| `public/css/styles.css` | Layout and the purple and navy styling. |
| `public/js/data.js` | Products, software, services and programmes. |
| `public/js/places.js` | Country and city pickers used by the forms. |
| `public/js/config.js` | API address (`apiBase`). Empty means browser-only mode. |
| `public/js/api.js` | Small client for the API. |
| `public/js/accounts.js` | Accounts: browser-only store or the API, depending on `apiBase`. |
| `public/js/records.js` | Quotes, enquiries and the quote draft. |
| `public/js/customer.js` | Account pages, quote builder and form delivery. |
| `public/js/app.js` | Public pages, navigation and search. |
| `public/images/` | Photographs and logo. |
| `.github/workflows/main.yml` | GitHub Pages build and publish. |

## Content

Product names, descriptions, services and programmes are unchanged from the original site. No prices, certifications, testimonials or contact details were added. Where a telephone number, address or company number was not in the project, the page still says it is available on request.
