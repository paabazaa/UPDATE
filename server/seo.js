// Search-engine friendly pages. The site's pages are built by JavaScript in the browser, which leaves search engines and
// link previews with an empty page. This runs the very same page-building code on the server, once at start, and keeps the
// finished HTML of every page in memory. Each address then answers with real content, its own title, description,
// canonical address and structured data, and unknown addresses get a real 404 status.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";

const NOT_FOUND_MARK = "We can't find that page";
const noop = () => {};

export function createSeo({ root, config = {}, verification = "", log = noop }) {
  const template = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...template.matchAll(/<script[^>]+src="([^"?]+)/g)].map(m => m[1]).filter(src => src.startsWith("/js/") && src !== "/js/site/events.js");

  // A tiny stand-in for the browser, just enough for the page code to build strings.
  const app = { innerHTML: "" };
  const element = () => ({ style: {}, dataset: {}, children: [], textContent: "", classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, setAttribute: noop, getAttribute: () => null, querySelector: () => null, querySelectorAll: () => [], appendChild: noop, remove: noop, innerHTML: "" });
  const location = { pathname: "/", search: "", hash: "", origin: "https://example.invalid", href: "" };
  const document = {
    title: "", cookie: "", readyState: "loading", head: element(), body: element(), documentElement: element(),
    getElementById: id => (id === "app" ? app : element()), querySelector: () => null, querySelectorAll: () => [],
    addEventListener: noop, createElement: element
  };
  const store = { getItem: () => null, setItem: noop, removeItem: noop };
  const context = {
    console: { log: noop, warn: noop, error: noop }, URL, URLSearchParams, Date, Math, JSON, Promise, Map, Set,
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop, requestAnimationFrame: noop, scrollTo: noop, scrollY: 0, innerWidth: 1280,
    location, history: { pushState: noop, replaceState: noop }, document, localStorage: store, sessionStorage: store,
    matchMedia: () => ({ matches: false, addEventListener: noop }), addEventListener: noop, navigator: { userAgent: "server" },
    fetch: () => Promise.reject(new Error("no network on the server")), IntersectionObserver: class { observe() {} }
  };
  context.window = context;
  vm.createContext(context);
  for (const src of scripts) {
    vm.runInContext(fs.readFileSync(path.join(root, src), "utf8"), context, { filename: src });
  }
  // The pages are built with the signed-out header, exactly what a search engine should see.
  vm.runInContext("if (typeof installCustomer === 'function') installCustomer();", context);
  const run = code => vm.runInContext(code, context);

  const escapeAttr = text => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const origin = () => config.siteUrl || "";
  const cache = new Map();

  function build(pathname, search = "") {
    location.pathname = pathname;
    location.search = search;
    app.innerHTML = "";
    run("route()");
    const appHtml = app.innerHTML;
    const missing = appHtml.includes(NOT_FOUND_MARK);
    const seoPath = missing ? "/404" : pathname;
    const info = run(`seoInfo(${JSON.stringify(seoPath)})`);
    const base = origin();
    const canonical = base + (info.path === "/" ? "/" : info.path);
    const data = missing || info.noindex ? [] : run(`seoData(${JSON.stringify(info.path)}, ${JSON.stringify(base)})`);
    const image = base + String(run("IMAGES.logo")).split("?")[0];
    const head = [
      `<title>${escapeAttr(info.title).replace(/&quot;/g, '"')}</title>`,
      `<meta name="description" content="${escapeAttr(info.description)}">`,
      `<meta name="robots" content="${info.noindex ? "noindex, nofollow" : "index, follow"}">`,
      base ? `<link rel="canonical" href="${escapeAttr(canonical)}">` : "",
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="SURGICISS LTD">`,
      `<meta property="og:title" content="${escapeAttr(info.title)}">`,
      `<meta property="og:description" content="${escapeAttr(info.description)}">`,
      base ? `<meta property="og:url" content="${escapeAttr(canonical)}">` : "",
      base ? `<meta property="og:image" content="${escapeAttr(image)}">` : "",
      `<meta name="twitter:card" content="${base ? "summary_large_image" : "summary"}">`,
      verification ? `<meta name="google-site-verification" content="${escapeAttr(verification)}">` : "",
      ...data.map(item => `<script type="application/ld+json" data-ld>${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`)
    ].filter(Boolean).join("\n");
    let html = template.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n${head}\n<!--/seo-->`);
    html = html.replace('<div id="app"></div>', () => `<div id="app">${appHtml}</div>`);
    return { status: missing ? 404 : 200, html, noindex: missing || info.noindex };
  }

  // The finished page for an address, or the 404 page. Never builds more than one entry per known address.
  function page(pathname) {
    const known = knownPaths.has(pathname) || isAccountPath(pathname);
    const key = known ? pathname : "/404";
    let entry = cache.get(key);
    if (!entry) {
      entry = key === "/404" ? build("/does-not-exist") : build(key);
      cache.set(key, entry);
    }
    return entry;
  }
  const isAccountPath = p => /^\/(login|sign-up|forgot-password|reset-password|verify|account(\/[a-z-]+(\/[a-z-]+)?)?)$/.test(p);

  const knownPaths = new Set(run("seoPaths()"));
  knownPaths.add("/search"); knownPaths.add("/request-quote");
  for (const p of knownPaths) page(p);
  page("/404");
  log(`[seo] ${cache.size} pages ready (server-rendered, with titles, descriptions and structured data)`);

  // Addresses that should send the visitor (and search engines) to the one real address.
  function redirectFor(pathname, search = "") {
    if (pathname === "/index.html") return "/" + search;
    if (pathname === "/request-quote") return "/generate-quote" + search;
    if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "") + search;
    if (pathname !== pathname.toLowerCase() && !path.extname(pathname)) return pathname.toLowerCase() + search;
    return null;
  }

  function sitemapXml(base) {
    const urls = run("seoPaths()").map(p => `  <url>\n    <loc>${escapeAttr(base + (p === "/" ? "/" : p))}</loc>\n  </url>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  }
  function robotsTxt(base) {
    return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account\nDisallow: /login\nDisallow: /sign-up\n\nSitemap: ${base}/sitemap.xml\n`;
  }

  return { page, redirectFor, sitemapXml, robotsTxt, paths: () => run("seoPaths()"), count: () => cache.size, evaluate: run };
}
