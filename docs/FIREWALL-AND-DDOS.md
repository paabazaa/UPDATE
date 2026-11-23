# Firewall, adaptive limits and DDoS plan

Three layers, from the outside in. Each one is meant to stop traffic before the next one has to deal with it.

```
Visitor → [1 Edge firewall (Cloudflare)] → [2 Shield inside the server] → website and API → database
```

## Step 1. Web application firewall in front of the whole stack

A real firewall has to sit **outside** the server, on a network that can absorb attacks, so bad traffic never reaches Render at all. Code inside the server cannot do that. The plan is Cloudflare in front of the Render site (the free plan includes the basics; check the current plan limits in the dashboard before relying on a specific rule count).

### Set up (about 30 minutes, done once)

1. Add the website's domain to Cloudflare and change the domain's name servers to the two Cloudflare gives you.
2. In DNS, point the site name at the Render address and turn the orange cloud (Proxied) **on**. The proxied record is what puts the firewall in front of everything.
3. SSL/TLS → set the mode to **Full (strict)**. Turn on **Always Use HTTPS**.
4. Security → WAF: turn on the **managed rules** (they block SQL injection, script injection, known exploits and common scanners).
5. Security → Bots: turn on **Bot Fight Mode**.
6. Security → Settings: set **Security Level** to Medium. This is the level you raise during an attack (see Step 3).
7. WAF custom rules (blocking, in this order):
   - Block when the URL path contains `/.env`, `/.git`, `/wp-`, `/phpmyadmin`, `xmlrpc.php` or ends in `.php`, `.asp`, `.aspx`, `.jsp`.
   - Managed challenge when the request is to `/api/auth/` and the visitor's threat score is high.
   - Block countries only if the business never serves them. Do not do this by default.
8. Rate limiting rule: `/api/auth/*` more than 20 requests in 1 minute from one address → block for 10 minutes. (The shield and the server also limit this. The edge rule stops it earlier.)
9. **Lock the server to the firewall.** Without this, an attacker can skip Cloudflare by calling the Render address directly.
   - Generate a long random secret (for example `openssl rand -hex 32`).
   - Cloudflare → Rules → Transform Rules → Modify Request Header: add `X-Origin-Secret` with that secret on every request.
   - In Render → Environment, add `ORIGIN_SECRET` with the same value, and redeploy.
   - Check: open the `onrender.com` address directly. It must say "Request blocked". The real domain must still work.
   - Do this step **last**. If `ORIGIN_SECRET` is set before the header is being sent, the site refuses everyone. To undo it, delete the `ORIGIN_SECRET` variable in Render.

When `ORIGIN_SECRET` is set and correct, the server also reads the real visitor address from `CF-Connecting-IP`, so the shield and rate limits see the person, not Cloudflare.

## Step 2. Adaptive rate limiting and behaviour-based bans (built in)

Code: `server/shield.js`, wired in at the very top of `server/index.js`. Tests: `server/test/shield.test.mjs`.

It runs before any page or API code. It has two parts.

**The filter** refuses a request immediately when it matches an attack pattern: SQL injection, script injection, path traversal, command injection, scanner tools (sqlmap, nikto, nmap and similar), requests for files this site does not have (`.env`, `wp-login.php`, `*.php`), unusual methods and oversized addresses. The reply says only "Request blocked", so an attacker learns nothing about which rule matched.

**The score** is kept per visitor address. It rises with suspicious behaviour and fades by about 20 points a minute while the visitor behaves.

| What the visitor does | Points |
|---|---|
| Normal page or file request (200) | 0 |
| API call | 0.05 |
| Bad request (400) | 1–2 |
| Page not found (404) | 3 |
| 8 different missing pages within a minute (scanning) | 20 each |
| Refused (401/403), wrong password | 5–6 |
| Hit the server's own rate limit (429) | 8 |
| Probing for hidden files | 15 |
| Attack pattern in the address | 30 |
| Scanner tool | 60 |

| Score | What happens |
|---|---|
| Under 40 | Normal |
| 40 to 79 | **Throttled**: one request every 2 seconds gets through, the rest get "429 Too many requests" with a Retry-After |
| 80 or more | **Temporary ban** |

Bans escalate on repeat behaviour: **10 minutes**, then **1 hour**, then **24 hours**. A clean day wipes the record. Because points come from behaviour, a fast visitor loading lots of normal files is never penalised, while a quiet scanner or password guesser is.

Safety:
- The shield never scores the host's own health checks (private addresses).
- If the shield itself ever errors, the request is let through. It cannot take the site down.
- Memory is capped (20,000 addresses).
- `SHIELD_ALLOWLIST` (comma separated addresses) exempts your own office or monitoring. `SHIELD=off` switches it off in an emergency.
- Every ban and block is logged in Render as a `[shield]` line.

Limits to know about: the score is held in memory, so it resets when the server restarts and is not shared if the site ever runs on more than one server. A shared address (an office or a school behind one internet connection) shares one score. That is what the allowlist is for.

## Step 3. DDoS response plan

Written before an attack so nobody has to think during one.

### What an attack looks like
- The site is slow or returns errors for many people at once, not just one.
- Render shows a sudden jump in requests, CPU or memory, or the service restarts repeatedly.
- Many `[shield]` lines in the Render logs, or Cloudflare Security → Events showing a spike.

### Who does what
| Role | Person | Job |
|---|---|---|
| Incident lead | (fill in) | Decides, keeps the timeline, speaks to the business |
| Technical responder | (fill in) | Works through the steps below |
| Communications | (fill in) | Tells customers and the team |
Fill in names and phone numbers now, and keep a copy outside the website.

### Steps, in order
**Minutes 0–5. Confirm and contain**
1. Check the Render logs and Cloudflare Security → Events. Is it traffic, or is it a bug or a database outage?
2. Cloudflare → Security → Settings: raise **Security Level** to **High**.
3. Make sure the Cloudflare proxy (orange cloud) is on and `ORIGIN_SECRET` is set, so attackers cannot reach Render directly.

**Minutes 5–15. Shut the main route**
4. If the traffic is mostly one thing (one path, one country, one user agent), add a Cloudflare custom rule to **block or challenge** exactly that.
5. If it is broad and from many places, turn on **Under Attack Mode** in Cloudflare. Visitors see a short check before the site loads. Real people get through, most bots do not.
6. Add a Cloudflare rate-limit rule on whatever is being hit hardest.

**If the site is still down**
7. Render → increase the instance size for the duration of the attack.
8. Serve the public pages from Cloudflare's cache: set a cache rule for the public pages so repeated requests never reach Render.
9. Last resort: temporarily block everything except `/` and the product pages, and put a plain message on the rest.

**Protect the data**
10. Do not turn off HTTPS, login protection or any security setting to "get the site back". If the database is under strain, keep sign-in and quote forms working and drop everything else first.
11. If the attack looks like a smokescreen (a flood while something else is tried), check the logs for logins from new places, password-reset requests and unusual quote or enquiry submissions.

### Communicating
- Within 30 minutes: a short, honest message to the team and anyone waiting on a quote: "Our site is under attack and may be slow. Your information is not affected. We are working on it." Do not say the information is safe until you have checked.
- Keep a timeline: when it started, what was tried, what worked.

### Ending the incident
1. Traffic is normal for at least an hour. Lower Security Level and turn off Under Attack Mode gradually.
2. Scale Render back down.
3. Keep the rules that worked.
4. Within a week write down: what happened, how it was noticed, what worked, what was slow, and the one or two changes to make. Update this document.

### Practice
Twice a year: check the names and numbers above, open the Cloudflare dashboard and find each setting named in this plan, and confirm the origin lock still works (the direct Render address must refuse).

### Do not
- Do not reveal the Render address or `ORIGIN_SECRET` anywhere public.
- Do not pay or negotiate with anyone demanding money to stop an attack. Report it and carry on with the steps.
