// Search, address reading, routing and rendering
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

function searchResults(idx) {
  const term = state.q.trim().toLowerCase();
  if (term.length < 2) return `<p class="muted" style="font-size:14px">Type at least two characters to search.</p>`;
  const res = idx.filter(e => (e.n + " " + e.s).toLowerCase().includes(term));
  if (!res.length) return `<p class="muted" style="font-size:14px">Nothing matched “${escapeHtml(state.q)}”. <a style="color:var(--link)" href="#/contact-us">Ask us</a> and we will tell you whether we can supply it.</p>`;
  return `<ul class="results">${res.map(e => `<li><p class="k">${e.k}</p><a href="${href(e.to)}">${escapeHtml(e.n)}</a><p>${escapeHtml(e.s)}</p></li>`).join("")}</ul>`;
}

/* ---------- router ---------- */
function currentPath() {return (location.hash.slice(1).split("?")[0] || "/").replace(/\/+$/, "") || "/";}
function currentQuery() {const q = location.hash.split("?")[1] || ""; return new URLSearchParams(q);}
const titles = {"/": "SURGICISS LTD — Sterile Instrument Systems", "/about": "About SURGICISS LTD", "/products": "Products — SURGICISS LTD", "/software": "Software — SURGICISS LTD", "/services": "Services — SURGICISS LTD", "/programmes": "Programmes — SURGICISS LTD", "/count-sheet-holders": "Instrument count sheet holders — SURGICISS LTD", "/contact-us": "Contact SURGICISS LTD", "/request-quote": "Generate a quote — SURGICISS LTD", "/generate-quote": "Generate a quote — SURGICISS LTD", "/faq": "Frequently asked questions — SURGICISS LTD", "/resources": "Resources — SURGICISS LTD", "/search": "Search — SURGICISS LTD", "/privacy": "Privacy notice — SURGICISS LTD", "/terms": "Terms of use — SURGICISS LTD"};
function route() {
  const p = currentPath(), seg = p.split("/").filter(Boolean);
  let html = null;
  if (p === "/") html = pages.home();
  else if (seg.length === 1) {
    const m = {about: "about", products: "products", software: "softwareIndex", services: "servicesIndex", programmes: "programmesIndex", "count-sheet-holders": "countSheets", "contact-us": "contact", "request-quote": "quote", "generate-quote": "quote", faq: "faq", resources: "resources", search: "search", privacy: "privacy", terms: "terms"}[seg[0]];
    if (seg[0] === "request-quote" || seg[0] === "generate-quote") state.quoteItem = currentQuery().get("item") || "";
    if (m) html = pages[m]();
  } else if (seg.length === 2) {
    const m = {products: "product", "product-category": "category", software: "softwareItem", services: "serviceItem", programmes: "programmeItem"}[seg[0]];
    if (m) html = pages[m](seg[1]);
  }
  if (html === null) html = pages.notFound();
  const detailTitle = seg.length === 2 && html && !html.includes("We can't find that page") ? ((html.match(/<h1>(.*?)<\/h1>/) || [])[1] || "") : "";
  document.title = detailTitle ? detailTitle.replace(/&amp;/g, "&") + " — SURGICISS LTD" : (titles[p] || "Page not found — SURGICISS LTD");
  state.menu = null; state.mobile = false;
  render(html);
}

let lastMain = "";
function render(main) {
  if (main !== undefined) lastMain = main;
  document.getElementById("app").innerHTML = header() + `<main id="main" tabindex="-1">${lastMain}</main>` + footer();
}
function rerenderKeepScroll(main) {const y = scrollY; render(main); scrollTo(0, y);}
