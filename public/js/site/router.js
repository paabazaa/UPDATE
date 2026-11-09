// Search, address reading, routing and rendering
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

function searchResults(idx) {
  const term = state.q.trim().toLowerCase();
  if (term.length < 2) return `<p class="muted" style="font-size:14px">Type at least two characters to search.</p>`;
  const res = idx.filter(e => (e.n + " " + e.s).toLowerCase().includes(term));
  if (!res.length) return `<p class="muted" style="font-size:14px">Nothing matched “${escapeHtml(state.q)}”. <a style="color:var(--link)" href="/contact-us">Ask us</a> and we will tell you whether we can supply it.</p>`;
  return `<ul class="results">${res.map(e => `<li><p class="k">${e.k}</p><a href="${href(e.to)}">${escapeHtml(e.n)}</a><p>${escapeHtml(e.s)}</p></li>`).join("")}</ul>`;
}

/* ---------- router ---------- */
function currentPath() {return (location.pathname.replace(/\/+$/, "")) || "/";}
function currentQuery() {return new URLSearchParams(location.search);}
// Move to another page of the site without reloading it.
function navigate(to, replace) {
  history[replace ? "replaceState" : "pushState"](null, "", to);
  pageChanged();
}
function pageChanged() {
  state.submitted = false; state.errors = {}; state.submitResult = null;
  if (window.onBeforeRoute) onBeforeRoute();
  route();
  scrollTo(0, 0);
}
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

// Search bar shown under the header on every page except the search page itself. It looks through products and software.
function searchBar() {
  if (currentPath() === "/search") return "";
  return `<div class="sbar"><div class="wrap"><form class="sbar-form" id="bar-search-form" role="search" autocomplete="off">
    <label class="sr" for="bar-search">Search products and software</label>
    <svg class="ico sbar-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input id="bar-search" type="search" placeholder="Search products and software" maxlength="80" aria-controls="bar-results" aria-expanded="false">
    <div class="sbar-results" id="bar-results" hidden></div></form></div></div>`;
}
function barMatches(term) {
  const t = term.trim().toLowerCase();
  if (t.length < 2) return [];
  const all = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})));
  return all.filter(e => (e.n + " " + e.s).toLowerCase().includes(t));
}

let lastMain = "";
function render(main) {
  if (main !== undefined) lastMain = main;
  document.getElementById("app").innerHTML = header() + searchBar() + `<main id="main" tabindex="-1">${lastMain}</main>` + footer();
}
function rerenderKeepScroll(main) {const y = scrollY; render(main); scrollTo(0, y);}
