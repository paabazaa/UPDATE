# Keeping the site up when thousands of people use it

What each of the eleven points means for this site, what was changed, and what still depends on settings outside the code.
This site runs on Node with a MySQL database (not Supabase), so a couple of the points do not apply as written.

| # | Point | Status for this site |
|---|---|---|
| 1 | Real email service | Already used: Brevo or Resend over their web API (no SMTP). Sending now goes through a queue with retries (see 8 and 9). **You must still** set a verified sender in Brevo and `MAIL_FROM`. Free plans have daily caps (check the current numbers in your Brevo or Resend dashboard). |
| 2 | Index every searched column | Audited every `WHERE` and `ORDER BY` in `server/app.js`. All were already indexed except `password_resets.expires_at`; migration `004-search-indexes` adds it, and expired reset links are now cleared out. |
| 3 | Speed up RLS policies | Not applicable. MySQL has no row-level security. Each query filters on the signed-in person's own `user_id` taken from their session, and a test proves one customer cannot read another's records. Those filters are on indexed columns. |
| 4 | Connection pooler | The server uses one shared connection pool, so visitors borrow connections instead of opening their own. Now configurable: `DB_POOL_SIZE` (default 10), `DB_QUEUE_LIMIT` (default 200, beyond it requests fail fast instead of piling up), keep-alive, idle and connect timeouts. Keep `DB_POOL_SIZE` below your Aiven plan's connection limit (check it in the Aiven console). As far as I know Aiven's built-in pooler is for PostgreSQL only, so for MySQL this application pool is the pooler. |
| 5 | Kill N+1 queries | Checked every endpoint: none loops a query per row. The account lists use two queries per list (a page and a count). |
| 6 | Paginate every list | The only database-backed lists are a customer's quote requests and enquiries. They now load 25 at a time (maximum 100) with the true total, newest first, and the account pages show "Showing 25 of 60" with a Show more button. The product and software pages are part of the page code, not database lists. |
| 7 | Cache what is the same for everyone | Website files are read once at start, compressed once (brotli and gzip) and served from memory with ETags, so a returning browser gets a tiny "304 Not Modified". Scripts, styles and images are cached for a day, pages are always revalidated. Nothing personal is cached: API answers are `no-store`. Cloudflare (see FIREWALL-AND-DDOS.md) will also cache the static files at its edge. |
| 8 | Retry AI calls with backoff | The site makes no AI calls. The same retry rule is applied to its one outside call, the email service: up to 4 tries, waits of about 1s, 2s, 4s with random spread, honours `Retry-After`, and does not retry errors that cannot pass (400, 401, 403). |
| 9 | Slow jobs in a queue | Email is sent from an in-process queue (`server/queue.js`): 3 at a time (`MAIL_CONCURRENCY`), at most 500 waiting. The password-reset request used to wait for the email service before answering; it no longer does. On a restart the server finishes waiting jobs first. Limit: jobs waiting in memory are lost if the server crashes, and the queue is not shared between several servers. If email must never be lost, the next step is a database table of pending emails. |
| 10 | Realtime connection limits | The site uses no websockets or live subscriptions. The limits that do apply are now set: the connection pool above, a 30 second request timeout, and keep-alive timeouts that suit Render's load balancer. |
| 11 | Load test before launch | `scripts/loadtest.mjs` (below). |

## Settings (Render environment)

| Name | Default | Meaning |
|---|---|---|
| `DB_POOL_SIZE` | 10 | Most database connections this server opens |
| `DB_QUEUE_LIMIT` | 200 | Requests allowed to wait for a free connection |
| `MAIL_CONCURRENCY` | 3 | Emails sent at the same time |

## Load test

```
node scripts/loadtest.mjs --url https://your-staging-site --users 1000 --seconds 60 --yes
```

Each pretend visitor loads a page and its scripts, calls the sign-in check, pauses like a person and repeats. It only reads: no sign-ups, no forms. Read the notes at the top of the script first. The firewall and shield are meant to throttle one machine sending thousands of requests, so for the test put the testing machine's address in `SHIELD_ALLOWLIST`, pause the edge firewall's rate rules for it, and remove both afterwards. Test a staging copy, not the live site, and tell your host first.

Passing means under 1% errors, a 95th percentile response under 1.5 seconds, and nothing refused.

Local result (a laptop-class sandbox, the real request handler on an in-memory stand-in database, no real network): 1000 simultaneous visitors for 20 seconds, about 11,000 requests per second, 95th percentile 2 ms, no errors. That shows the server code is not the bottleneck. It says nothing about Render's plan, the real MySQL database or the internet, so the real test on staging still has to be run and its numbers kept here.

## Things to watch once it is busy
- Render: CPU and memory graphs, and restarts.
- Aiven: connection count against the plan limit, and slow queries.
- Logs: `[queue] ... gave up` lines (an email was lost), `[shield]` lines (see FIREWALL-AND-DDOS.md).
