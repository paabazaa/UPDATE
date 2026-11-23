// What search engines and social previews need to know about each page: its title, description, canonical address,
// whether it may be indexed, and structured data. The browser uses it to keep the tab and head tags right as people move
// around, and the server uses the very same functions to put those details in the HTML it sends, so they never disagree.
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

const seoStatic = {
  "/": ["SURGICISS LTD — Sterile Instrument Systems", "SURGICISS LTD provides sterile barrier products, instrument management software and training for sterile processing departments and operating rooms."],
  "/about": ["About SURGICISS LTD", "Who SURGICISS LTD is, what we believe about patient safety, and how we work with hospitals, surgery centres and sterile services departments."],
  "/products": ["Sterile barrier products — SURGICISS LTD", "Practical devices for the parts of sterile processing that most often go wrong: protecting wrapped trays, keeping count sheets in place, proving checks were done."],
  "/software": ["Instrument management software — SURGICISS LTD", "Software built around how a sterile services department runs: instrument sets, case carts, crash carts and endoscopes, with records that stand up afterwards."],
  "/services": ["Sterile processing services and training — SURGICISS LTD", "Management support, team sessions and technician training delivered inside your own sterile processing department."],
  "/programmes": ["Hospital viability programmes — SURGICISS LTD", "Structured programmes that review instrument sets, workflow and spend, carried out with your own team in your own department."],
  "/count-sheet-holders": ["Instrument count sheet holders — SURGICISS LTD", "Holders that keep surgical count sheets separate from instruments and implants throughout processing, avoiding ink stains and paper-particle contamination."],
  "/contact-us": ["Contact SURGICISS LTD", "Tell us what your department is dealing with. We answer enquiries ourselves, by email, phone or WhatsApp, rather than routing them through a call centre."],
  "/generate-quote": ["Generate a quote — SURGICISS LTD", "Choose the products or software modules you are considering and tell us the quantities and where they are going. We quote against that and confirm in writing."],
  "/faq": ["Frequently asked questions — SURGICISS LTD", "Answers to the questions departments ask us most: quotations, lead times, trials, software hosting, on-site training and regulatory documents."],
  "/resources": ["Resources — SURGICISS LTD", "Documents and instructions for use for SURGICISS LTD products."],
  "/search": ["Search — SURGICISS LTD", "Search SURGICISS LTD products and software to find the item you need."],
  "/privacy": ["Privacy notice — SURGICISS LTD", "What personal information SURGICISS LTD collects through this website, why, how long it is kept and your rights."],
  "/terms": ["Terms of use — SURGICISS LTD", "The terms for using the SURGICISS LTD website, product information and quotations."]
};

// Pages with no business in a search index: sign-in, accounts and the search results page.
const seoPrivate = /^\/(login|sign-up|forgot-password|reset-password|verify|account|auth|search)(\/|$)/;

// Different addresses that show the same page are folded into one.
const seoSameAs = {"/request-quote": "/generate-quote"};

const seoClip = (text, max) => {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
};

// Every page that should be found: the list for the sitemap and for pre-building pages.
function seoPaths() {
  return ["/", "/about", "/products", "/software", "/services", "/programmes", "/count-sheet-holders", "/contact-us", "/generate-quote", "/faq", "/resources", "/privacy", "/terms"]
    .concat(productCategories.filter(c => c.slug !== "count-sheet-holders").map(c => "/product-category/" + c.slug))
    .concat(products.map(p => "/products/" + p.slug), software.map(s => "/software/" + s.slug), services.map(s => "/services/" + s.slug), programmes.map(s => "/programmes/" + s.slug));
}

function seoRecord(path) {
  const [, section, slug] = path.split("/");
  const list = {products, software, services, programmes}[section];
  if (list && slug) return list.find(x => x.slug === slug) || null;
  if (section === "product-category" && slug) return productCategories.find(x => x.slug === slug) || null;
  return null;
}

// path: the page address without query or trailing slash. Returns what the head of that page should say.
function seoInfo(path) {
  path = seoSameAs[path] || path;
  const hit = seoStatic[path];
  if (hit) return {title: hit[0], description: hit[1], path, noindex: seoPrivate.test(path)};
  const record = seoRecord(path);
  if (record) {
    const category = path.startsWith("/product-category/");
    return {title: seoClip(record.name, 52) + " — " + company.name, description: seoClip(category ? record.description : record.summary, 158), path, noindex: false};
  }
  if (seoPrivate.test(path)) return {title: "Account — " + company.name, description: "Your SURGICISS LTD account.", path, noindex: true};
  return {title: "Page not found — " + company.name, description: "That page does not exist.", path, noindex: true};
}

// Structured data (schema.org) describing the page, built only from facts already shown on the page.
function seoData(path, origin) {
  path = seoSameAs[path] || path;
  const abs = p => origin + p;
  const image = key => (IMAGES[key] ? abs(String(IMAGES[key]).split("?")[0]) : undefined);
  const org = {"@type": "Organization", "@id": abs("/#organization"), name: company.name, url: abs("/"), logo: abs(IMAGES.logo.split("?")[0]), email: company.email, telephone: company.phone,
    address: {"@type": "PostalAddress", addressLocality: "Bolgatanga", addressRegion: "Upper East Region", addressCountry: "GH"}};
  const out = [];
  const crumbs = trail => ({"@type": "BreadcrumbList", itemListElement: trail.map((t, i) => ({"@type": "ListItem", position: i + 1, name: t[0], item: abs(t[1])}))});
  if (path === "/") {
    out.push(Object.assign({"@context": "https://schema.org"}, org));
    out.push({"@context": "https://schema.org", "@type": "WebSite", "@id": abs("/#website"), name: company.name, url: abs("/"), publisher: {"@id": abs("/#organization")}});
    return out;
  }
  if (path === "/contact-us") out.push(Object.assign({"@context": "https://schema.org"}, org));
  if (path === "/faq") {
    out.push({"@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map(f => ({"@type": "Question", name: f[0], acceptedAnswer: {"@type": "Answer", text: String(f[1]).replace(/<[^>]+>/g, "")}}))});
  }
  const record = seoRecord(path);
  const section = path.split("/")[1];
  if (record && !seoPrivate.test(path)) {
    const info = seoInfo(path);
    const parent = {products: ["Products", "/products"], software: ["Software", "/software"], services: ["Services", "/services"], programmes: ["Programmes", "/programmes"], "product-category": ["Products", "/products"]}[section];
    out.push(Object.assign({"@context": "https://schema.org"}, crumbs([["Home", "/"], parent, [record.name, path]])));
    const shared = {name: record.name, description: seoClip(record.summary || record.description, 300), url: abs(path), image: image(record.image)};
    if (section === "products") out.push(Object.assign({"@context": "https://schema.org", "@type": "Product", brand: {"@type": "Brand", name: company.name}, category: catName(record.category), manufacturer: {"@id": abs("/#organization")}}, shared));
    else if (section === "software") out.push(Object.assign({"@context": "https://schema.org", "@type": "SoftwareApplication", applicationCategory: "BusinessApplication", publisher: {"@id": abs("/#organization")}}, shared));
    else if (section === "services" || section === "programmes") out.push(Object.assign({"@context": "https://schema.org", "@type": "Service", provider: {"@id": abs("/#organization")}}, shared));
    void info;
  } else if (seoStatic[path] && path !== "/contact-us" && path !== "/faq") {
    out.push(Object.assign({"@context": "https://schema.org"}, crumbs([["Home", "/"], [seoStatic[path][0].split(" — ")[0], path]])));
  }
  return JSON.parse(JSON.stringify(out)); // drops undefined values
}

// Browser side: keep the head tags in step with the page being shown.
function seoApply(path) {
  if (typeof document === "undefined" || !document.head || !document.head.appendChild) return;
  const info = seoInfo(path);
  // Keep using the address the server named (SITE_URL), not whichever address the visitor happened to type.
  const named = document.querySelector('link[rel="canonical"]');
  let origin = location.origin;
  try { if (named && named.href) origin = new URL(named.href).origin; } catch (err) { /* keep the visitor's address */ }
  const set = (selector, make, value) => {
    let el = document.querySelector(selector);
    if (!el) { el = document.createElement(make[0]); el.setAttribute(make[1], make[2]); document.head.appendChild(el); }
    el.setAttribute(make[3], value);
  };
  set('meta[name="description"]', ["meta", "name", "description", "content"], info.description);
  set('meta[name="robots"]', ["meta", "name", "robots", "content"], info.noindex ? "noindex, nofollow" : "index, follow");
  set('link[rel="canonical"]', ["link", "rel", "canonical", "href"], origin + (info.path === "/" ? "/" : info.path));
  set('meta[property="og:title"]', ["meta", "property", "og:title", "content"], info.title);
  set('meta[property="og:description"]', ["meta", "property", "og:description", "content"], info.description);
  set('meta[property="og:url"]', ["meta", "property", "og:url", "content"], origin + (info.path === "/" ? "/" : info.path));
  document.querySelectorAll('script[data-ld]').forEach(el => el.remove && el.remove());
  for (const item of seoData(info.path, origin)) {
    const el = document.createElement("script");
    el.type = "application/ld+json"; el.setAttribute("data-ld", ""); el.textContent = JSON.stringify(item);
    document.head.appendChild(el);
  }
}
