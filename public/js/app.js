// Public pages, navigation, search and the enquiry form.
// Routes use the URL hash (for example #/products), so the site works on any static host.
// Depends on data.js, places.js, config.js, accounts.js, records.js and customer.js, loaded first.

// Image paths by key, relative to the site root.
const IMAGES = {
  "productBrushRack": "images/product-ibr-brush-rack.jpg",
  "productHealthMonitor": "images/product-covidot-health-monitor.jpg",
  "productTrayIntegrityTest": "images/product-tray-integrity-test.jpg",
  "productCountSheetHolder": "images/product-count-sheet-holder.jpg",
  "productMasterWrap": "images/product-master-wrap.jpg",
  "productQualityAssuranceCard": "images/product-quality-assurance-card.jpg",
  "softwareDashboard": "images/software-sterile-matrix.jpg",
  "softwareCaseCart": "images/software-case-cart-matrix.jpg",
  "softwareCrashCart": "images/software-crash-cart-matrix.jpg",
  "softwareEndoscope": "images/software-endoscope-matrix.jpg",
  "heroMasterWrap": "images/hero-master-wrap.jpg",
  "serviceLeadership": "images/service-operating-room.jpg",
  "serviceMorale": "images/service-sterile-storage.jpg",
  "serviceTraining": "images/service-technicians.jpg",
  "heroSterileProcessing": "images/hero-sterile-services.jpg",
  "logo": "images/logo.png"
};
const company = {
  name: "SURGICISS LTD", tagline: "We're dedicated to best surgical outcomes.",
  address: "", phone: "", email: "", registration: "", hours: "",
  intro: "SURGICISS LTD works with hospitals, surgery centres and sterile services departments to support the consistent delivery of clean, sterile, functional and relevant surgical instruments, equipment and supplies — on time and on budget."
};
const detail = (v, fb = "Available on request") => (v && v.trim() ? v : fb);
const {productCategories, products, software, services, programmes} = DATA;
const imageUrl = k => IMAGES[k];
const catName = s => (productCategories.find(c => c.slug === s) || {}).name || s;
// Escapes text before it is placed inside an HTML template.
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
// Inline SVG icons used across the page templates.
const icons = {
  pin: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg class="ico" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
  down: '<svg class="ico" style="margin:0" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  left: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  menu: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  chev: '<svg class="ico" style="margin:0;width:12px;height:12px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>'
};

/* ---------- state ---------- */
const state = {menu: null, mobile: false, slide: 0, quoteItem: "", submitted: false, errors: {}, subscribed: false, q: ""};
const slides = [
  {image: "heroSterileProcessing", title: "SURGICISS LTD:", body: "With advanced technologies and patient-centred expertise, SURGICISS instrument systems support the consistent delivery of clean, sterile, functional and relevant surgical instruments, equipment and supplies — on time and on budget.", cta: ["Generate quote", "/generate-quote"]},
  {image: services[0].image, title: "For patient safety and system viability:", body: "Healthcare providers must improve quality, increase efficiency, eliminate waste and lower cost. We partner with them to make that possible.", cta: ["Our services", "/services"]},
  {image: "heroMasterWrap", title: "Surgical Instrument Master Wrap", body: "Master Wrap applies impact displacement to help prevent a tear or puncture of a wrapped instrument tray.", cta: ["View product", "/products/surgical-instrument-master-wrap"]},
  {image: "softwareDashboard", title: "We supercharge instrument technicians:", body: "We support sterile processing technicians with practical skills, structured training and analytical technologies that show what is happening in the department.", cta: ["Training programme", "/services/sterile-processing-technician-training-programme"]},
  {image: services[2].image, title: "Enrol in our hospital viability programme:", body: "A structured review of instrument sets, workflow and spend, carried out with your own team inside your own department.", cta: ["See programmes", "/programmes"]}
].concat(
  products.map(p => ({image: p.image, title: p.name, body: p.summary, cta: ["View product", "/products/" + p.slug]})),
  software.map(s => ({image: s.image, title: s.name, body: s.summary, cta: ["Explore system", "/software/" + s.slug]}))
);

/* ---------- shared pieces ---------- */
const href = p => "#" + p;
const quoteHref = item => "#/generate-quote" + (item ? "?item=" + encodeURIComponent(item) : "");
const crumbs = list => {
  const items = [`<li style="display:flex;align-items:center;gap:4px"><a href="#/">Home</a>${icons.chev}</li>`].concat(list.map((c, i) => {
    const last = i === list.length - 1;
    return `<li style="display:flex;align-items:center;gap:4px">${c.to && !last ? `<a href="${href(c.to)}">${escapeHtml(c.label)}</a>` : `<span class="cur">${escapeHtml(c.label)}</span>`}${last ? "" : icons.chev}</li>`;
  }));
  return `<nav aria-label="Breadcrumb" class="crumbs" style="margin-top:16px"><ol class="crumbs" style="margin:0">${items.join("")}</ol></nav>`;
};
const banner = (title, cr = [], lead = "") => `<div class="banner"><div class="wrap"><h1>${escapeHtml(title)}</h1>${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ""}${crumbs(cr)}</div></div>`;
// Closing banner with the two main actions.
const callToAction = (h, b) => `<section class="cta"><div class="wrap"><div><h2>${escapeHtml(h)}</h2><p>${escapeHtml(b)}</p>
  </div>
  <div class="row"><a class="btn" href="#/generate-quote">Generate quote</a><a class="btn ghost" href="#/contact-us">Ask a question</a></div>
  </div>
  </section>`;
const productCard = p => `<article class="card"><a class="img" href="${href("/products/" + p.slug)}"><img src="${imageUrl(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" width="900" height="700"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></h3><p>${escapeHtml(p.summary)}</p><div class="acts"><a class="btn" href="${quoteHref(p.name)}">Request a quote</a><a class="btn line" href="${href("/products/" + p.slug)}">Read more</a></div></div></article>`;
const serviceCard = s => `<article class="card"><a class="img" href="${href("/services/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/services/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/services/" + s.slug)}">Read more</a></div></div></article>`;
const progCard = s => `<article class="card"><a class="img" href="${href("/programmes/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/programmes/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/programmes/" + s.slug)}">Read more</a></div></div></article>`;
const swCard = s => `<article class="swcard"><h3><a class="stretch" href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><a class="btn" href="${href("/software/" + s.slug)}">Explore</a></article>`;
const barList = a => `<ul class="bar-list">${a.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
const paras = a => a.map(p => `<p>${escapeHtml(p)}</p>`).join("");

/* ---------- header / footer ---------- */
const isDark = () => document.documentElement.dataset.theme === "dark";
function themeButton() {
  const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  return `<button type="button" class="theme" id="themebtn" aria-label="${isDark() ? "Switch to light mode" : "Switch to dark mode"}">${isDark() ? sun : moon}<span class="tt">${isDark() ? "Light" : "Dark"}</span></button>`;
}
function header() {
  const r = currentPath();
  const act = p => (p === "/" ? r === "/" : r === p || r.startsWith(p + "/")) ? " active" : "";
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const swL = software.map(s => ({label: s.name, to: "/software/" + s.slug}));
  const prL = products.map(p => ({label: p.name, to: "/products/" + p.slug}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="#/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="1520" height="384" decoding="async"></a>
    <div style="display:flex;align-items:center">
    <nav class="main" aria-label="Main navigation">
      <a class="tl${act("/")}" href="#/">Home</a>
      ${dd("software", "Software", swL, "/software", "All Software")}
      ${dd("products", "Products", prL, "/products", "All Products")}
      <a class="tl${act("/count-sheet-holders")}" href="#/count-sheet-holders">Instrument Count Sheet Holders</a>
      <a class="tl${act("/contact-us")}" href="#/contact-us">Contact Us</a>
    </nav>
    <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav">${state.mobile ? icons.close : icons.menu}Menu</button>
    ${themeButton()}
    </div></div>
    ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a href="#/">Home</a>${mgroup("Software", swL, "/software", "All Software")}${mgroup("Products", prL, "/products", "All Products")}<a href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a href="#/about">About</a><a href="#/contact-us">Contact Us</a><a class="quote" href="#/request-quote">Request a quote</a></nav>
      </div>` : ""}
  </header>`;
}
function footer() {
  return `<footer class="site"><div class="wrap fgrid">
    <div><h2>Contact Us</h2>
    <div class="rule"></div>
    <ul>
      <li>${icons.pin}<span>${escapeHtml(detail(company.address, "Address available on request"))}</span></li>
      <li>${icons.phone}<span>${escapeHtml(detail(company.phone, "Telephone available on request"))}</span></li>
      <li>${icons.mail}<span>${escapeHtml(detail(company.email, "Use the enquiry form"))}</span></li>
        </ul>
      <a class="go" href="#/contact-us">Send an enquiry</a></div>
    <div><h2>Software</h2>
        <div class="rule"></div>
        <ul>${software.map(s => `<li><a href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></li>`).join("")}<li><a href="#/software">All Software</a></li>
      </ul>
      </div>
    <div><h2>Products</h2>
      <div class="rule"></div>
      <ul>${products.map(p => `<li><a href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></li>`).join("")}</ul>
      </div>
    <div><h2>Newsletter</h2>
      <div class="rule"></div>
      <p class="small">Notes on sterile services practice, products and training. ${byMode("This form stays in your browser until a mailing service is connected — it does not add you to a list by itself.", "Enter your email address to be added to the list.")}</p>
      <form id="newsletter"><label for="newsletter-email" class="sr">Email address</label>
      <input id="newsletter-email" type="email" required placeholder="Your email address"><button type="submit">Subscribe</button></form>
      ${state.subscribed ? `<p class="small" style="font-size:12px" role="status">Saved in this browser only. You have not been added to a mailing list.</p>` : ""}</div>
  </div>
  <div class="fbase"><div class="wrap"><p>&copy; 2026 ${company.name}. All rights reserved.</p>
    <nav aria-label="Legal"><a href="#/about">About</a><a href="#/services">Services</a><a href="#/programmes">Programmes</a><a href="#/resources">Resources</a><a href="#/faq">FAQ</a><a href="#/search">Search</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></nav>
    </div>
    </div>
    </footer>`;
}

/* ---------- forms ---------- */
const interestGroups = () => [
  {g: "Products", items: products.map(p => p.name)}, {g: "Software", items: software.map(s => s.name)},
  {g: "Services", items: services.map(s => s.name)}, {g: "Programmes", items: programmes.map(s => s.name)}, {g: "Other", items: ["General enquiry"]}
];
function field(label, name, o = {}) {
  return `<div class="fld"><label for="${name}">${label}${o.req ? ' <span class="req">*</span>' : ""}</label><input id="${name}" name="${name}" type="${o.type || "text"}" maxlength="255" ${o.ph ? `placeholder="${o.ph}"` : ""}>${state.errors[name] ? `<p class="err">${state.errors[name]}</p>` : ""}</div>`;
}
function enquiryForm(variant, defaultInterest = "") {
  if (state.submitted) {
    const result = state.submitResult || {delivered: false, failed: false};
    const headline = result.delivered
      ? "Your enquiry has been sent."
      : (result.failed ? "We could not deliver your enquiry." : "Your enquiry has not been sent.");
    const detail = result.delivered
      ? "It reached the submission service. Keep the reference if you need to follow it up."
      : (result.failed
        ? "The submission service did not accept the message, so it should not be treated as delivered. A copy is saved in this browser."
        : "No submission service is connected yet, so SURGICISS has not received this message. A copy is saved in this browser under the reference below.");
    return `<div class="done" role="status"><h2>${headline}</h2><p>${detail}</p>${result.id ? `<p>Reference <strong>${escapeHtml(result.id)}</strong>.</p>` : ""}<p>${result.delivered ? "The team can reply using the contact method you chose." : "Create an account with the same email address if you want this copy filed under My enquiries on this browser."}</p><button type="button" id="again">Send another enquiry</button></div>`;
  }
  return `<form class="enq" id="enquiry" data-variant="${variant}" novalidate>
    <div class="fields">${field("Full name", "name", {req: 1})}${field("Email address", "email", {type: "email", req: 1})}${field("Telephone", "phone")}${field("Organisation", "organisation", {req: 1})}${Places.countryField("", {required: true, error: state.errors.country ? `<p class="err">${state.errors.country}</p>` : ""})}${Places.cityField("", "")}</div>
    <div class="fields"><div class="fld"><label for="interest">Your enquiry relates to <span class="req">*</span></label>
      <select id="interest" name="interest"><option value="">Please choose…</option>${interestGroups().map(g => `<optgroup label="${g.g}">${g.items.map(i => `<option value="${escapeHtml(i)}"${i === defaultInterest ? " selected" : ""}>${escapeHtml(i)}</option>`).join("")}</optgroup>`).join("")}</select>${state.errors.interest ? `<p class="err">${state.errors.interest}</p>` : ""}</div>
    ${variant === "quote" ? field("Quantity required", "quantity", {ph: "e.g. 200"}) : "<div></div>"}</div>
    ${variant === "contact" ? `<div class="fld"><label for="subject">Subject <span class="req">*</span></label>
      <input id="subject" name="subject" type="text" maxlength="160" autocomplete="off" placeholder="What would you like to ask?">${state.errors.subject ? `<p class="err">${state.errors.subject}</p>` : ""}</div>` : ""}
    <fieldset class="fld"><legend>Preferred contact method</legend><div class="radios">${["Email", "Telephone", "Either"].map((m, i) => `<label><input type="radio" name="preferredContact" value="${m}"${i === 0 ? " checked" : ""}>${m}</label>`).join("")}</div></fieldset>
    <div class="fld"><label for="message">Your message <span class="req">*</span></label><textarea id="message" name="message" rows="6" maxlength="2000" placeholder="Tell us about your department, the sets involved and any timescales."></textarea>${state.errors.message ? `<p class="err">${state.errors.message}</p>` : ""}</div>
    <div><button class="btn lg" type="submit" style="font-size:14px">${variant === "quote" ? "Submit quote request" : "Send enquiry"}</button></div></form>`;
}
function validate(v) {
  const e = {}, t = k => (v[k] || "").trim();
  if (t("name").length < 2) e.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t("email"))) e.email = "Please enter a valid email address.";
  if (t("organisation").length < 2) e.organisation = "Please tell us which organisation you represent.";
  if (t("country").length < 2) e.country = "Please enter your country.";
  if (!t("interest")) e.interest = "Please choose what your enquiry relates to.";
  if ("subject" in v && t("subject").length < 3) e.subject = "Please add a short subject.";
  if (t("message").length < 10) e.message = "Please give us a little more detail — a sentence or two is enough.";
  return e;
}

/* ---------- pages ---------- */
const featuredSlugs = ["quality-assurance-card", "surgical-instrument-master-wrap", "universal-surgical-count-sheet-holder"];
const pages = {
  home() {
    const s = slides[state.slide];
    const featured = featuredSlugs.map(x => products.find(p => p.slug === x)).filter(Boolean);
    return `<section class="hero" id="hero" aria-label="Featured products, software and services"><h1 class="sr">SURGICISS LTD — Sterile Instrument Systems</h1>
      <div class="slides">${slides.map((sl, i) => `<div class="slide${i === state.slide ? " on" : ""}${/^(software|product)/.test(sl.image) ? " lt" : ""}" aria-hidden="${i !== state.slide}"><img src="${imageUrl(sl.image)}" alt="" width="1600" height="900"><div class="in"><h2 class="st">${escapeHtml(sl.title)}</h2><p class="sb">${escapeHtml(sl.body)}</p><a class="btn hb" href="${href(sl.cta[1])}">${sl.cta[0]}</a></div></div>`).join("")}</div>
      <button type="button" class="nav" style="left:0" aria-label="Previous slide" data-slide="-1">${icons.left}</button><button type="button" class="nav" style="right:0" aria-label="Next slide" data-slide="1">${icons.right}</button>
      <div class="dots">${slides.map((sl, i) => `<button type="button" aria-label="Show slide ${i + 1}: ${escapeHtml(sl.title)}" aria-current="${i === state.slide}" data-goto="${i}"></button>`).join("")}</div>
        </section>
    <section class="sec tint" style="padding-block:0" aria-label="Software"><div class="wrap quick">${software.map(x => `<a href="${href("/software/" + x.slug)}">${escapeHtml(x.name)}</a>`).join("")}</div></section>
    <section class="wrap sec intro"><h2>${company.name}</h2><h3>${company.tagline}</h3>
      <p>The problem with healthcare today is not the lack of advanced technologies and skilled hands, but the absence of simple innovations that help each pair of hands get the basics done right the first time. These seemingly trivial steps have led to failure, time and again, in even the most sophisticated operating rooms. For patient safety, SURGICISS LTD provides simple innovations that prevent error, minimise delay, reduce unnecessary cost and support real-time compliance in sterile processing departments and operating rooms.</p>
      </section>
    <section class="wrap" style="padding-bottom:48px"><div class="grid g3" style="gap:32px">${services.map(x => `<article class="feat"><a href="${href("/services/" + x.slug)}" style="display:block;overflow:hidden;background:var(--tint)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/services/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${href("/services/" + x.slug)}">Read more</a></article>`).join("")}</div>
      </section>
    <section class="sec tint"><div class="wrap intro"><h2>Products</h2>
      <p>Through research, development and the steady use of instrument processing products, software and methods in real departments, we work to support patient safety and the viability of the services that deliver it.</p>
      <div class="grid g3" style="gap:32px;margin-top:32px;text-align:left">${featured.map(x => `<article class="feat"><a href="${href("/products/" + x.slug)}" style="display:block;overflow:hidden;background:var(--card)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/products/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${quoteHref(x.name)}">Request a quote</a></article>`).join("")}</div>
      <div class="center" style="margin-top:40px"><a class="btn lg" href="#/products">All Products</a></div>
        </div>
        </section>`;
  },
  about() {
    return banner("About us", [{label: "About"}]) + `<section class="wrap sec" style="padding-block:56px"><div class="two about"><div class="rich"><h2 class="section-title">Dedicated to best surgical outcomes</h2>
      <p style="margin-top:16px">${escapeHtml(company.intro)}</p>
      <p>Our work sits in the space between the operating theatre and the sterile services department, where most instrument problems are either created or prevented. We supply products that protect the sterile barrier, software that records what happened to a set, and support for the teams responsible for both.</p>
      <p>We would rather solve a problem in a department's own routine than sell it something it does not need, which is why most of our conversations begin with a walk through the department rather than a catalogue.</p>
      <h3>How we work</h3>
      <p>Every recommendation we make should be defensible: traceable to the department's own records, achievable with the staff and equipment available, and measurable once it is in place. Where we do not yet hold information — a specification, a certification, a lead time — we say so rather than fill the gap.</p>
      <h3>Company details</h3>
      <dl class="kv cols"><div><dt>Registered name</dt><dd>${company.name}</dd></div><div><dt>Company registration</dt><dd>${escapeHtml(detail(company.registration))}</dd></div><div><dt>Registered address</dt><dd>${escapeHtml(detail(company.address))}</dd></div><div><dt>Office hours</dt><dd>${escapeHtml(detail(company.hours))}</dd></div></dl></div>
      <div><img class="wideimg" style="aspect-ratio:1920/1000" src="${imageUrl("heroSterileProcessing")}" alt="Sterile services technicians at work" loading="lazy"></div></div></section>`
      + callToAction("Considering a change in your department?", "Send us the detail and we will tell you honestly whether we can help.");
  },
  products() {
    return banner("Products", [{label: "Products"}], "Practical devices for the parts of the process that most often go wrong: protecting wrapped trays, keeping brushes and count sheets where they belong, and proving that checks were carried out.")
      + `<section class="wrap sec"><div class="tags">${productCategories.map(c => `<a href="${href("/product-category/" + c.slug)}">${escapeHtml(c.name)}</a>`).join("")}</div><div class="grid g3" style="margin-top:40px">${products.map(productCard).join("")}</div></section>`
      + callToAction("Need a quotation for several lines?", "Send one enquiry with the products and quantities and we will price it together.");
  },
  category(slug) {
    const c = productCategories.find(x => x.slug === slug); if (!c) return null;
    const list = products.filter(p => p.category === slug);
    return banner(c.name, [{label: "Products", to: "/products"}, {label: c.name}], c.description)
      + `<section class="wrap sec">${list.length ? `<div class="grid g3">${list.map(productCard).join("")}</div>` : `<p class="muted" style="font-size:14px">No products are listed in this category yet. <a style="color:var(--link)" href="#/contact-us">Contact us</a> for the current range.</p>`}<div style="margin-top:40px"><a class="btn outline lg" href="#/products">All products</a></div></section>`
      + callToAction("Not sure which option suits your sets?", "Describe the trays and we will recommend a fit.");
  },
  product(slug) {
    const p = products.find(x => x.slug === slug); if (!p) return null;
    const related = products.filter(x => x.slug !== p.slug && x.category === p.category).slice(0, 3);
    return banner(p.name, [{label: "Products", to: "/products"}, {label: p.name}])
      + `<section class="wrap sec"><div class="two prod"><div><img class="pimg" src="${imageUrl(p.image)}" alt="${escapeHtml(p.name)}" width="1024" height="1024"><p class="muted" style="margin-top:16px;font-size:12px;text-transform:uppercase;letter-spacing:.03em">Category: <a style="color:var(--link)" href="${href("/product-category/" + p.category)}">${escapeHtml(catName(p.category))}</a></p></div>
      <div><p style="font-size:16px;line-height:1.7">${escapeHtml(p.summary)}</p>
      <div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px"><a class="btn lg" href="${quoteHref(p.name)}">Request a quote</a><a class="btn line lg" href="#/contact-us">Ask a question</a></div>
      <div class="rich" style="margin-top:32px">${paras(p.body)}</div>
      <div class="grid g2" style="margin-top:40px;gap:32px"><div><h2 class="h-sec">Features</h2>${barList(p.features)}</div><div><h2 class="h-sec">Where it is used</h2>${barList(p.applications)}</div></div>
      ${p.application ? `<h2 class="h-sec" style="margin-top:40px">Application</h2><p class="rich" style="margin-top:12px">${escapeHtml(p.application)}</p>` : ""}
      <h2 class="h-sec" style="margin-top:40px">Specification</h2>
        <div class="tbl-wrap"><table class="spec"><tbody>${p.specifications.map(s => `<tr><th scope="row">${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`).join("")}</tbody></table></div>${p.faq ? `<h2 class="h-sec" style="margin-top:40px">Frequently asked questions</h2>
        <dl class="faq" style="margin-top:12px">${p.faq.map(f => `<div><dt>${escapeHtml(f[0])}</dt><dd>${escapeHtml(f[1])}</dd></div>`).join("")}</dl>` : ""}</div></div>
      ${related.length ? `<div style="margin-top:64px"><h2 class="section-title">Related products</h2>
        <div class="grid g3" style="margin-top:24px">${related.map(productCard).join("")}</div></div>` : ""}</section>`
      + callToAction("Quotation for " + p.name, "Tell us quantities and delivery point and we will price it.");
  },
  softwareIndex() {
    return banner("Software", [{label: "Software"}], "Four systems built around the way a sterile services department actually runs: sets in motion, trolleys due for checking, and records that have to stand up afterwards.")
      + `<section class="wrap sec"><div class="grid g2">${software.map(swCard).join("")}</div></section>` + callToAction("Ask for a walkthrough", "We will show the system against your own workflow, not a demonstration dataset.");
  },
  softwareItem(slug) {
    const s = software.find(x => x.slug === slug); if (!s) return null;
    const others = software.filter(x => x.slug !== slug);
    return banner(s.name, [{label: "Software", to: "/software"}, {label: s.name}], s.summary)
      + `<section class="wrap sec"><div class="two side"><div><img class="wideimg sw" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)} screens" loading="lazy"><div class="rich" style="margin-top:32px">${paras(s.body)}</div>
      <div class="grid g2" style="margin-top:40px;gap:32px"><div><h2 class="h-sec">Modules</h2>${barList(s.modules)}</div><div><h2 class="h-sec">What departments get from it</h2>${barList(s.benefits)}</div>
        </div>
        </div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">Enquire about ${escapeHtml(s.name)}</h2>
        <p>Tell us how many sets, trolleys or scopes you handle and we will scope the work against that.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request a quote</a></div>
      <div class="box"><h2 class="h-sec">Other software</h2><ul class="links">${others.map(o => `<li><a href="${href("/software/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Considering " + s.name + "?", "We will talk you through what it does and what it does not do.");
  },
  servicesIndex() {
    return banner("Services", [{label: "Services"}], "Departments are held together by people. These services are aimed at the supervisors, managers and technicians who carry the work.")
      + `<section class="wrap sec"><div class="grid g3">${services.map(serviceCard).join("")}</div></section>` + callToAction("Talk to us about your department", "A short conversation is usually enough to see whether we can help.");
  },
  serviceItem(slug) {
    const s = services.find(x => x.slug === slug); if (!s) return null;
    return banner(s.name, [{label: "Services", to: "/services"}, {label: s.name}], s.summary)
      + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" loading="lazy"><div class="rich" style="margin-top:32px">${paras(s.body)}</div><h2 class="h-sec" style="margin-top:40px">What is included</h2>${barList(s.includes)}</div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">Enquire</h2>
        <p>Tell us the size of the team and the problem you want addressed first.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request a proposal</a></div>
      <div class="box"><h2 class="h-sec">Other services</h2>
        <ul class="links">${services.filter(o => o.slug !== slug).map(o => `<li><a href="${href("/services/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Ready to start?", "We will set out scope, timings and cost before any work begins.");
  },
  programmesIndex() {
    return banner("Programmes", [{label: "Programmes"}], "Longer pieces of work, run with the department rather than around it, each with an agreed measure of success.")
      + `<section class="wrap sec"><div class="grid g3">${programmes.map(progCard).join("")}</div></section>` + callToAction("Which programme fits your position?", "Tell us the pressure you are under and we will suggest a starting point.");
  },
  programmeItem(slug) {
    const s = programmes.find(x => x.slug === slug); if (!s) return null;
    return banner(s.name, [{label: "Programmes", to: "/programmes"}, {label: s.name}], s.summary)
      + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" loading="lazy"><div class="rich" style="margin-top:32px">${paras(s.body)}</div>
        </div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">Enquire</h2>
        <p>Tell us where the pressure is and we will outline how this programme would run.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request an outline</a></div>
      <div class="box"><h2 class="h-sec">Other programmes</h2>
        <ul class="links">${programmes.filter(o => o.slug !== slug).map(o => `<li><a href="${href("/programmes/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Interested in this programme?", "We will send the outline, timescales and what we need from you.");
  },
  countSheets() {
    const holders = products.filter(p => p.category === "count-sheet-holders");
    return banner("Instrument count sheet holders", [{label: "Instrument count sheet holders"}], "A count sheet only helps if the technician can read it, reach it and trust that it belongs to the tray in front of them.")
      + `<section class="wrap sec"><div class="rich" style="max-width:768px"><h2 class="section-title">Why holders matter</h2>
        <p style="margin-top:16px">Count sheets get wet, torn, filed in the wrong tray or left on a bench. Each of those small failures turns into a recount, a delayed set or a discrepancy that nobody can resolve afterwards.</p>
        <p>A holder fixes the sheet in one predictable place, keeps it legible during assembly and inspection, and travels with the tray so the record and the instruments never separate.</p>
        </div>
      <div class="grid g3" style="margin-top:40px">${holders.map(productCard).join("")}</div>
        <div style="margin-top:40px"><a class="btn outline lg" href="#/products">All products</a></div>
        </section>`
      + callToAction("Sizing a holder to your sheets?", "Send us the sheet dimensions and tray type and we will confirm the fit.");
  },
  contact() {
    return banner("Contact us", [{label: "Contact us"}], "Tell us what your department is dealing with. We answer enquiries ourselves rather than routing them through a call centre.")
      + `<section class="wrap sec"><div class="two contact"><aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">SURGICISS LTD</h2>
        <dl class="kv">
        <div><dt>Address</dt><dd>${escapeHtml(detail(company.address, "Address available on request"))}</dd></div><div><dt>Telephone</dt><dd>${escapeHtml(detail(company.phone, "Telephone available on request"))}</dd></div><div><dt>Email</dt><dd>${escapeHtml(detail(company.email, "Use the enquiry form"))}</dd></div><div><dt>Office hours</dt><dd>${escapeHtml(detail(company.hours))}</dd></div><div><dt>Company registration</dt><dd>${escapeHtml(detail(company.registration))}</dd></div></dl></div>
        <div class="box"><h2 class="h-sec">Who we work with</h2><p>${escapeHtml(company.intro)}</p>
          </div>
          </aside>
        <div><h2 class="section-title">Send us an enquiry</h2>
          <p class="muted" style="margin-top:12px;font-size:14px">Fields marked with an asterisk are required. You can ask a question without creating an account. The confirmation will tell you whether the message was actually sent.</p>
          <div style="margin-top:24px">${enquiryForm("contact")}</div></div></div></section>`;
  },
  quote() {
    const item = state.quoteItem;
    return banner("Request a quote", [{label: "Request a quote"}], "The more you can tell us about the sets, volumes and timescales, the more useful our quotation will be.")
      + `<section class="wrap sec"><div class="two quote"><div>${item ? `<p class="callout">Enquiry about: <strong>${escapeHtml(item)}</strong></p>` : ""}${enquiryForm("quote", item)}</div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">What happens next</h2>
        <ol class="muted" style="margin-top:12px;display:grid;gap:8px;font-size:14px"><li>1. We read the enquiry and check what we need to clarify.</li>
        <li>2. We come back with questions or a written quotation.</li>
        <li>3. If it is a fit, we agree delivery or a start date.</li>
        </ol>
        </div>
      <div class="box"><h2 class="h-sec">Prefer to speak to us?</h2>
        <p>${escapeHtml(detail(company.phone, "Telephone available on request"))}</p><p style="margin-top:0">${escapeHtml(detail(company.email, "Use the form on this page"))}</p><p style="margin-top:8px">${escapeHtml(detail(company.hours, "Opening hours available on request"))}</p></div></aside></div></section>`;
  },
  faq() {
    const faqs = [
      ["How do you prepare a quotation?", "We ask for the products or modules you are considering, the quantities involved and where the goods or work are going. We then quote against that rather than publishing a single list price, because volume and delivery change the figure."],
      ["What are your lead times?", "Lead times depend on the item and the quantity ordered. We confirm a date in writing with every quotation."],
      ["Can we trial a product before committing?", "For most physical products we can arrange an evaluation quantity so your technicians can judge it in their own workflow. Terms for evaluations are agreed case by case."],
      ["Is your software hosted by you or by us?", "Both arrangements are possible and the choice usually depends on your IT policy. The specific hosting, interface and data-retention options we support are confirmed during scoping."],
      ["Do you deliver training on site?", "Yes. Technician training and morale sessions are normally delivered in the department, because the point is to work with the equipment and pressures your team actually faces."],
      ["What regulatory information can you supply?", "We provide the documentation relevant to each product on request. Classifications and certifications differ by item and market."]
    ];
    return banner("Frequently asked questions", [{label: "FAQ"}], "The questions departments ask us most often. If yours is not here, send it to us.")
      + `<section class="wrap narrow sec"><dl class="faq">${faqs.map(f => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join("")}</dl></section>` + callToAction("Still have a question?", "Ask us directly and we will answer plainly.");
  },
  resources() {
    const r = [
      ["Protecting the sterile barrier in transit", "Where wrapped trays are most often damaged between the sterilizer and the theatre, and the handling changes that reduce it.", "/product-category/sterile-barrier", "See sterile barrier products"],
      ["Making a count sheet usable", "Practical points on layout, protection and placement so a count sheet survives assembly and theatre use intact.", "/count-sheet-holders", "See count sheet holders"],
      ["Receiving loaner instrument sets", "A receipt-to-return sequence for loaners, including what to record when a set arrives late or incomplete.", "/programmes/loaner-instrument-processing", "See loaner instrument processing"],
      ["Endoscope traceability basics", "The minimum record set that lets a department reconstruct which scope was used, on whom, and after which reprocessing cycle.", "/software/endoscope-matrix", "See Endoscope Matrix"]
    ];
    return banner("Resources", [{label: "Resources"}], "Short pieces written for the people doing the work. Downloadable versions are being prepared.")
      + `<section class="wrap sec"><div class="grid g2">${r.map(x => `<article class="box rcard" style="background:var(--card)"><h2 style="font-size:16px;color:var(--heading)"><a class="stretch" href="${href(x[2])}">${x[0]}</a></h2><p>${x[1]}</p><p style="margin-top:14px"><a class="tlink" href="${href(x[2])}">${x[3]}</a></p></article>`).join("")}</div>
        <p class="muted" style="margin-top:40px;font-size:14px">Looking for something specific? <a style="color:var(--link)" href="#/contact-us">Ask us</a> and we will point you to it or write it.</p>
        </section>`
      + callToAction("Want these as handouts for your team?", "Tell us how many you need and in what format.");
  },
  search() {
    const idx = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})), services.map(p => ({k: "Service", n: p.name, s: p.summary, to: "/services/" + p.slug})), programmes.map(p => ({k: "Programme", n: p.name, s: p.summary, to: "/programmes/" + p.slug})));
    return banner("Search", [{label: "Search"}], "Search our products, software, services and programmes.")
      + `<section class="wrap narrow sec"><label for="site-search" style="font-size:14px;font-weight:500">What are you looking for?</label>
        <input class="search-in" style="padding:12px 16px" id="site-search" type="search" value="${escapeHtml(state.q)}" placeholder="e.g. master wrap, endoscope, training" maxlength="80"><div id="results" style="margin-top:32px">${searchResults(idx)}</div></section>`;
  },
  privacy() {
    return banner("Privacy notice", [{label: "Privacy notice"}]) + `<section class="wrap narrow sec"><div class="rich">
      <h2 class="lt">What we collect</h2>
      <p>If you create an account, ask a question or prepare a quote request, the details you type (name, organisation, email, telephone, location and message) are stored in this browser. They are sent to SURGICISS only when a submission service is connected and the request succeeds. Until then, they do not leave this device.</p>
      <h2 class="lt">Why we would use it</h2>
      <p>Once a server is connected, those details are there so the team can answer the enquiry, prepare a quotation and keep a record of the correspondence. They are not for sale, and this site does not add you to a marketing list on its own.</p>
      <h2 class="lt">Accounts</h2>
      <p>Sign-in on this website is optional and is not required to read any public page. An account stored only in the browser is not secure authentication and is not shared with SURGICISS. Do not put clinical records or a password you use elsewhere into it.</p>
      <h2 class="lt">How long we keep it</h2>
      <p>Information kept in the browser stays until you clear the site data or delete the account from Account settings. Server-side retention, once a system is connected, should last only as long as needed to deal with the enquiry and any resulting supply, then be reviewed and deleted.</p>
      <h2 class="lt">Who processes it</h2>
      <p>Nothing is processed by SURGICISS staff until a form endpoint is connected and a submission succeeds. A future hosting or email provider should act under written terms.</p>
      <h2 class="lt">Your rights</h2>
      <p>You can delete the local account and its saved requests from Account settings. A request for a copy of information SURGICISS itself holds will need to go to the company once a contact address is published, or through the enquiry form if that form is delivering messages.</p>
      <h2 class="lt">Cookies</h2>
      <p>This site works without advertising or tracking cookies. Any measurement we add in future will be described here first.</p>
      <p class="muted" style="margin-top:32px;font-size:12px">This notice is provided in good faith and is not legal advice. Have it reviewed before publication.</p>
      </div>
      </section>`;
  },
  terms() {
    return banner("Terms of use", [{label: "Terms of use"}]) + `<section class="wrap narrow sec"><div class="rich">
      <h2 class="lt">About this site</h2>
      <p>This website is operated by ${company.name}, company registration ${escapeHtml(detail(company.registration))}, registered at ${escapeHtml(detail(company.address))}. By using the site you accept these terms.</p>
      <h2 class="lt">Product information</h2>
        <p>Descriptions, specifications and images are provided as a guide. Where a specification is marked as pending it has not yet been confirmed and must not be relied on. Always confirm the current specification with us before ordering or writing a device into a local procedure.</p>
      <h2 class="lt">Not clinical advice</h2>
        <p>Nothing on this site replaces manufacturer instructions for use, national guidance or your own local policy. Decisions about reprocessing, sterilisation and instrument handling remain with the responsible clinician or department manager.</p>
      <h2 class="lt">Quotations and orders</h2>
        <p>A quote request prepared on this website is not an order and does not confirm a price, tax or delivery charge. Quotations are valid for the period stated on them once they are issued. Conditions of sale are available on request.</p>
      <h2 class="lt">Intellectual property</h2>
        <p>The SURGICISS name, site text, images and software interfaces are our property or used with permission. Please ask before reproducing them.</p>
      <h2 class="lt">Governing law</h2>
        <p>The governing law is stated on each quotation.</p>
      <p class="muted" style="margin-top:32px;font-size:12px">Provided in good faith and not legal advice. Have these terms reviewed before publication.</p>
        </div>
        </section>`;
  },
  notFound() {
    return `<section class="wrap nf"><h1>404</h1>
      <h2>We can't find that page</h2>
      <p class="muted" style="margin-top:8px;font-size:14px">The page you are looking for does not exist or may have moved.</p>
      <div class="row"><a class="btn lg" href="#/">Go home</a><a class="btn line lg" href="#/contact-us">Contact us</a></div>
      </section>`;
  }
};
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
  document.getElementById("app").innerHTML = header() + `<main id="main">${lastMain}</main>` + footer();
}
function rerenderKeepScroll(main) {const y = scrollY; render(main); scrollTo(0, y);}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-toggle],[data-mtoggle],[data-slide],[data-goto],#menubtn,#themebtn,#again,#totop");
  const inDD = e.target.closest(".dd");
  if (!inDD) document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
  const link = e.target.closest("a[href^='#']");
  if (link) {
    document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
    if (link.getAttribute("href") === (location.hash || "#/")) scrollTo({top: 0, behavior: "smooth"});
    if (link.closest("#mobnav")) setTimeout(() => {if (state.mobile) {state.mobile = false; rerenderKeepScroll();} }, 0);
  }
  if (!t) return;
  if (t.dataset.toggle) {const box = t.closest(".dd"); const was = box.classList.contains("open"); document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open")); box.classList.toggle("open", !was); t.setAttribute("aria-expanded", String(!was));}
  else if (t.hasAttribute("data-mtoggle")) {const sub = t.closest(".mg").querySelector(".msub"); sub.hidden = !sub.hidden; t.setAttribute("aria-expanded", String(!sub.hidden));}
  else if (t.dataset.slide) {setSlide(state.slide + Number(t.dataset.slide));}
  else if (t.dataset.goto) {setSlide(Number(t.dataset.goto));}
  else if (t.id === "menubtn") {state.mobile = !state.mobile; rerenderKeepScroll();}
  else if (t.id === "themebtn") {const next = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = next; try {localStorage.setItem("surgiciss-theme", next);} catch (e) {} t.outerHTML = themeButton();}
  else if (t.id === "again") {state.submitted = false; state.errors = {}; route();}
  else if (t.id === "totop") scrollTo({top: 0, behavior: "smooth"});
});
function setSlide(n) {
  state.slide = (n + slides.length) % slides.length;
  const h = document.getElementById("hero"); if (!h) return;
  h.querySelectorAll(".slide").forEach((el, i) => {const on = i === state.slide; el.classList.toggle("on", on); el.setAttribute("aria-hidden", String(!on));});
  h.querySelectorAll(".dots button").forEach((b, i) => b.setAttribute("aria-current", String(i === state.slide)));
}
function rerenderMain() {if (currentPath() === "/") rerenderKeepScroll(pages.home());}
document.addEventListener("keydown", e => {if (e.key === "Escape") {document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open")); if (state.mobile) {state.mobile = false; rerenderKeepScroll();} } });
document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "newsletter") {
    const v = e.target.querySelector("input").value.trim();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      state.subscribed = true;
      try {
        const list = JSON.parse(localStorage.getItem("surgiciss-newsletter") || "[]");
        if (!list.includes(v)) list.push(v);
        localStorage.setItem("surgiciss-newsletter", JSON.stringify(list));
      } catch (err) { /* storage may be blocked */}
      if (Api.enabled) Api.post("/newsletter", {email: v});
      rerenderKeepScroll();
    }
    return;
  }
  if (e.target.id === "enquiry") {
    if (window.handleEnquirySubmit) {handleEnquirySubmit(e); return;}
    const v = Object.fromEntries(new FormData(e.target).entries());
    const errs = validate(v);
    if (Object.keys(errs).length) {
      state.errors = errs;
      const keep = v; rerenderKeepScroll(pages[currentPath() === "/request-quote" ? "quote" : "contact"]());
      for (const [k, val] of Object.entries(keep)) {const el = document.querySelector(`#enquiry [name="${k}"]`); if (el && el.type !== "radio") el.value = val;}
      const first = document.querySelector("#enquiry .err"); if (first) first.closest(".fld").querySelector("input,select,textarea").focus();
      return;
    }
    state.errors = {}; state.submitted = true; route();
  }
});
document.addEventListener("input", e => {
  if (e.target.id === "site-search") {
    state.q = e.target.value;
    const idx = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})), services.map(p => ({k: "Service", n: p.name, s: p.summary, to: "/services/" + p.slug})), programmes.map(p => ({k: "Programme", n: p.name, s: p.summary, to: "/programmes/" + p.slug})));
    document.getElementById("results").innerHTML = searchResults(idx);
  }
});
addEventListener("scroll", () => {
  const h = document.getElementById("hdr"); if (h) h.classList.toggle("stuck", scrollY > 8);
  document.getElementById("totop").hidden = scrollY < 400;
}, {passive: true});
addEventListener("hashchange", () => {state.submitted = false; state.errors = {}; state.submitResult = null; if (window.onBeforeRoute) onBeforeRoute(); route(); scrollTo(0, 0);});
// The slides always advance on their own, one after the other. (Reduced-motion settings only switch off the zoom effect, not the change of slide.)
setInterval(() => {if (currentPath() === "/" && !document.hidden && !state.mobile) setSlide(state.slide + 1);}, 5500);
try {const s = localStorage.getItem("surgiciss-theme"); if (s === "dark" || s === "light") document.documentElement.dataset.theme = s;} catch (e) {}
if (window.installCustomer) installCustomer();
// With the API on, wait briefly to learn whether the visitor is signed in before drawing the first page.
if (window.Accounts && Accounts.pending()) Accounts.ready.then(route);
else route();
