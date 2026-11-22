// The shield sits at the front door of the Node server. Every request passes through it before any page or API code runs.
//  1. Filter: requests that match known attack patterns (SQL injection, script injection, path traversal, scanners, probing for
//     files that do not exist here) are refused straight away.
//  2. Behaviour: each visitor address gets a score that rises with suspicious behaviour and falls back while it behaves.
//     Low score: normal. Medium: throttled (one request every couple of seconds). High: temporarily banned.
//     Repeat offenders are banned for longer each time. Volume alone is a weak signal, behaviour is the strong one.
// Everything is held in memory and fails open: if the shield itself ever throws, the request is let through.

const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

const SCANNER_AGENTS = /\b(sqlmap|nikto|nmap|masscan|acunetix|nessus|wpscan|dirbuster|gobuster|ffuf|havij|zgrab|nuclei|hydra|metasploit|openvas|burpcollaborator)\b/i;

const PROBE_PATHS = /^\/(\.env|\.git|\.svn|\.hg|\.ht|\.aws|\.ssh|\.docker|wp-|wordpress|xmlrpc\.php|phpmyadmin|pma\b|cgi-bin|vendor\/phpunit|actuator|server-status|server-info|id_rsa|backup|dump\.sql|database\.sql|config\.(json|yml|yaml|php|bak)|console\b|manager\/html|boaform|hnap1|solr)|\.(php\d?|asp|aspx|jsp|cgi|bak|sql|old|swp)(\/|$|\?)/i;

// Each rule: a name, what it looks at, and how many points it adds. "block" rules also refuse the request.
const RULES = [
  { name: "path-traversal", points: 30, test: s => /(\.\.[/\\]|%2e%2e|%252e|\.\.%2f|\.\.%5c)/i.test(s) },
  { name: "null-byte", points: 30, test: s => /%00|\0/.test(s) },
  { name: "sql-injection", points: 30, test: s => /(\bunion\b[\s\S]{0,30}\bselect\b|\binformation_schema\b|\bsleep\s*\(\s*\d|\bbenchmark\s*\(|\bor\b\s+\d+\s*=\s*\d+|'\s*or\s*'|"\s*or\s*"|;\s*drop\s+table|\bload_file\s*\(|\binto\s+outfile\b|\bxp_cmdshell\b|\bwaitfor\s+delay\b)/i.test(s) },
  { name: "script-injection", points: 30, test: s => /(<\s*script|<\s*\/\s*script|javascript\s*:|\bon(error|load|click|mouseover|focus)\s*=|<\s*(iframe|svg|img|object|embed)[^>]*>|document\.cookie|\balert\s*\()/i.test(s) },
  { name: "command-injection", points: 30, test: s => /((;|\|\||&&|\|)\s*(cat|wget|curl|bash|sh|nc|whoami|chmod|rm)\b|\/etc\/passwd|\/bin\/(ba)?sh|cmd\.exe|\$\{jndi:)/i.test(s) }
];

// The host's own health checks and local traffic come from private addresses. They are never scored.
export const internal = ip => /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::ffff:127\.|fc|fd)/i.test(ip);

export function createShield(options = {}) {
  const now = options.now || (() => Date.now());
  const log = options.log || (message => console.warn(message));
  const enabled = options.enabled !== false;
  const allowlist = new Set(options.allowlist || []);
  const cfg = {
    throttleAt: 40,                  // score at which the visitor is slowed down
    banAt: 80,                       // score at which the visitor is banned
    decayPerSecond: 0.34,            // about 20 points a minute back towards normal
    throttleGapMs: 2000,             // while throttled, one request every two seconds gets through
    banMinutes: [10, 60, 1440],      // first ban, second ban, third and later ban
    strikeMemoryMs: 24 * 3600e3,     // a clean day wipes the record of earlier bans
    maxUrlLength: 4096,
    maxVisitors: 20000,
    ...options.settings
  };
  const visitors = new Map();
  const stats = { blocked: 0, throttled: 0, banned: 0, bans: 0 };

  const record = ip => {
    let v = visitors.get(ip);
    if (!v) {
      v = { score: 0, updated: now(), strikes: 0, lastStrike: 0, bannedUntil: 0, lastPass: 0, notFound: new Map(), reasons: [] };
      visitors.set(ip, v);
      if (visitors.size > cfg.maxVisitors) prune();
    }
    return v;
  };

  function prune() {
    const t = now();
    for (const [ip, v] of visitors) {
      if (v.bannedUntil <= t && v.score <= 1 && t - v.lastStrike > cfg.strikeMemoryMs) visitors.delete(ip);
    }
    // Still too many (a flood from many addresses): drop the quietest half so memory stays bounded.
    if (visitors.size > cfg.maxVisitors) {
      const quiet = [...visitors].filter(([, v]) => v.bannedUntil <= t).sort((a, b) => a[1].score - b[1].score);
      for (const [ip] of quiet.slice(0, Math.ceil(quiet.length / 2))) visitors.delete(ip);
    }
  }

  function settle(v) {
    const t = now();
    v.score = Math.max(0, v.score - ((t - v.updated) / 1000) * cfg.decayPerSecond);
    v.updated = t;
    if (v.strikes && t - v.lastStrike > cfg.strikeMemoryMs) v.strikes = 0;
    return t;
  }

  function addPoints(ip, points, reason) {
    const v = record(ip);
    const t = settle(v);
    v.score += points;
    if (reason && v.reasons.length < 6) v.reasons.push(reason);
    if (v.score >= cfg.banAt && v.bannedUntil <= t) {
      const minutes = cfg.banMinutes[Math.min(v.strikes, cfg.banMinutes.length - 1)];
      v.strikes += 1;
      v.lastStrike = t;
      v.bannedUntil = t + minutes * 60000;
      v.score = 0;
      stats.bans += 1;
      log(`[shield] ban ip=${ip} minutes=${minutes} strike=${v.strikes} reasons=${v.reasons.join(",")}`);
      v.reasons = [];
    }
  }

  // Looks only at the address, the method, the headers and the user agent. Returns null to let the request through,
  // or { status, reason, retryAfter } to refuse it.
  function inspect(req, ip) {
    if (!enabled || allowlist.has(ip) || internal(ip)) return null;
    try {
      const v = record(ip);
      const t = settle(v);

      if (v.bannedUntil > t) {
        stats.banned += 1;
        return { status: 403, reason: "banned", retryAfter: Math.ceil((v.bannedUntil - t) / 1000) };
      }

      const url = String(req.url || "/");
      const method = String(req.method || "GET").toUpperCase();
      const agent = String(req.headers?.["user-agent"] || "");

      let found = null;
      if (!METHODS.has(method)) found = { name: "method", points: 10, status: 405 };
      else if (url.length > cfg.maxUrlLength) found = { name: "long-url", points: 10, status: 414 };
      else if (SCANNER_AGENTS.test(agent)) found = { name: "scanner", points: 60, status: 403 };
      else {
        let decoded = url;
        try {
          decoded = decodeURIComponent(decodeURIComponent(url));
        } catch {
          try {
            decoded = decodeURIComponent(url);
          } catch {
            found = { name: "malformed-url", points: 10, status: 400 };
          }
        }
        if (!found) {
          const path = decoded.split("?")[0];
          if (PROBE_PATHS.test(path)) found = { name: "probe", points: 15, status: 404 };
          else {
            const rule = RULES.find(r => r.test(url) || r.test(decoded));
            if (rule) found = { name: rule.name, points: rule.points, status: 403 };
          }
        }
      }
      if (found) {
        stats.blocked += 1;
        addPoints(ip, found.points, found.name);
        log(`[shield] blocked ip=${ip} rule=${found.name} method=${method} url=${url.slice(0, 120).replace(/[\r\n]/g, " ")}`);
        return { status: found.status, reason: found.name };
      }

      if (v.score >= cfg.throttleAt) {
        if (t - v.lastPass < cfg.throttleGapMs) {
          stats.throttled += 1;
          return { status: 429, reason: "throttled", retryAfter: Math.ceil(cfg.throttleGapMs / 1000) };
        }
        v.lastPass = t;
      }
      return null;
    } catch (error) {
      log(`[shield] error, request allowed: ${error.message}`);
      return null;
    }
  }

  // Called when a response has been sent. What the visitor got back tells us how they behave.
  function observe(req, ip, status) {
    if (!enabled || allowlist.has(ip) || internal(ip)) return;
    try {
      const path = String(req.url || "/").split("?")[0];
      const isApi = path.startsWith("/api/") || path.startsWith("/auth/");
      const isAuth = /\/(login|signup|register|forgot|reset|password)/i.test(path);
      if (status === 404) {
        const v = record(ip);
        const t = now();
        v.notFound.set(path.slice(0, 200), t);
        for (const [p, at] of v.notFound) if (t - at > 60000) v.notFound.delete(p);
        // Scanners ask for lots of different things that do not exist. A person with one broken link does not.
        addPoints(ip, v.notFound.size >= 8 ? 20 : 3, v.notFound.size >= 8 ? "scanning" : "");
      } else if (status === 429) addPoints(ip, 8, "rate-limited");
      else if (status === 401 || status === 403) addPoints(ip, isAuth ? 8 : 5, "denied");
      else if (status === 400 || status === 422) addPoints(ip, isApi ? 2 : 1, "");
      else if (isApi) addPoints(ip, 0.4, ""); // a steady stream of API calls adds up slowly: volume counts, but little
    } catch (error) {
      log(`[shield] error: ${error.message}`);
    }
  }

  function state(ip) {
    const v = visitors.get(ip);
    if (!v) return { level: "normal", score: 0 };
    settle(v);
    const level = v.bannedUntil > now() ? "banned" : v.score >= cfg.throttleAt ? "throttled" : "normal";
    return { level, score: Math.round(v.score * 10) / 10, strikes: v.strikes };
  }

  return { inspect, observe, state, stats, size: () => visitors.size };
}

// Sends the refusal. Plain text, no detail about which rule matched, so attackers learn nothing.
export function refuse(res, verdict) {
  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };
  if (verdict.retryAfter) headers["Retry-After"] = String(verdict.retryAfter);
  const text = verdict.status === 429 ? "Too many requests. Please slow down." : verdict.status === 404 ? "Not found" : "Request blocked.";
  res.writeHead(verdict.status, headers);
  res.end(text);
}
