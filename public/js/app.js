// SURGICISS LTD - Professional App v2 - Purple oriented, form-first login
// Routes use hash #/ - depends on data.js, places.js, config.js, accounts.js, records.js

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
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const icons = {
  pin: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg class="ico" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
  down: '<svg class="ico" style="margin:0" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  left: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  menu: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  chev: '<svg class="ico" style="margin:0;width:12px;height:12px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  eye: '<svg class="ico" style="margin:0" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  google: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z"/></svg>'
};

const state = {menu: null, mobile: false, slide: 0, quoteItem: "", submitted: false, errors: {}, subscribed: false, q: "", authError: "", authLoading: false};
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
const callToAction = (h, b) => `<section class="cta"><div class="wrap"><div><h2>${escapeHtml(h)}</h2><p>${escapeHtml(b)}</p></div><div class="row"><a class="btn" href="#/generate-quote">Generate quote</a><a class="btn ghost" href="#/contact-us">Ask a question</a></div></div></section>`;
const productCard = p => `<article class="card"><a class="img" href="${href("/products/" + p.slug)}"><img src="${imageUrl(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" width="900" height="700"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></h3><p>${escapeHtml(p.summary)}</p><div class="acts"><a class="btn" href="${quoteHref(p.name)}">Request a quote</a><a class="btn line" href="${href("/products/" + p.slug)}">Read more</a></div></div></article>`;
const serviceCard = s => `<article class="card"><a class="img" href="${href("/services/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/services/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/services/" + s.slug)}">Read more</a></div></div></article>`;
const progCard = s => `<article class="card"><a class="img" href="${href("/programmes/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/programmes/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/programmes/" + s.slug)}">Read more</a></div></div></article>`;
const swCard = s => `<article class="swcard"><h3><a class="stretch" href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><a class="btn" href="${href("/software/" + s.slug)}">Explore</a></article>`;
const barList = a => `<ul class="bar-list">${a.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
const paras = a => a.map(p => `<p>${escapeHtml(p)}</p>`).join("");

function isDark() { return document.documentElement.dataset.theme === "dark"; }
function themeButton() {
  const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  return `<button type="button" class="theme" id="themebtn" aria-label="${isDark() ? "Switch to light mode" : "Switch to dark mode"}">${isDark() ? sun : moon}<span class="tt">${isDark() ? "Light" : "Dark"}</span></button>`;
}

function header() {
  const r = currentPath();
  const act = p => (p === "/" ? r === "/" : r === p || r.startsWith(p + "/")) ? " active" : "";
  const user = Accounts.current();
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const swL = software.map(s => ({label: s.name, to: "/software/" + s.slug}));
  const prL = products.map(p => ({label: p.name, to: "/products/" + p.slug}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;

  const authLinks = user 
    ? `<a class="tl acct" href="#/account">My Account</a><button class="tl" id="logoutBtn">Logout</button>`
    : `<a class="tl${act("/login")}" href="#/login">Login</a><a class="tl${act("/register")}" href="#/register">Create Account</a>`;

  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="#/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="1520" height="384" decoding="async"></a>
    <div class="h-right">
      <div class="htools desk-only">
        <a class="btn" href="#/generate-quote">Generate Quote</a>
        ${authLinks}
      </div>
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
      </div>
    </div>
  </div>
  <div class="navrow"><div class="wrap"><nav class="main" style="display:flex"><a class="tl${act("/")}" href="#/">Home</a>${dd("software", "Software", swL, "/software", "All Software")}${dd("products", "Products", prL, "/products", "All Products")}<a class="tl${act("/count-sheet-holders")}" href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a class="tl${act("/contact-us")}" href="#/contact-us">Contact Us</a></nav></div></div>
  <div class="mobile-cta"><a href="#/generate-quote">Generate Quote</a>${user ? '<a href="#/account">My Account</a>' : '<a href="#/login">Login</a>'}</div>
  ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a href="#/">Home</a>${mgroup("Software", swL, "/software", "All Software")}${mgroup("Products", prL, "/products", "All Products")}<a href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a href="#/contact-us">Contact Us</a><a href="#/login">Login</a><a href="#/register">Create Account</a><a class="quote" href="#/generate-quote">Generate quote</a></nav></div>` : ""}
  </header>`;
}

function footer() {
  return `<footer class="site"><div class="wrap fgrid">
    <div><h2>Contact Us</h2><div class="rule"></div><ul>
      <li>${icons.pin}<span>${escapeHtml(detail(company.address, "Address available on request"))}</span></li>
      <li>${icons.phone}<span>${escapeHtml(detail(company.phone, "Telephone available on request"))}</span></li>
      <li>${icons.mail}<span>${escapeHtml(detail(company.email, "Use the enquiry form"))}</span></li></ul><a class="go" href="#/contact-us">Send an enquiry</a></div>
    <div><h2>Software</h2><div class="rule"></div><ul>${software.map(s => `<li><a href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></li>`).join("")}<li><a href="#/software">All Software</a></li></ul></div>
    <div><h2>Products</h2><div class="rule"></div><ul>${products.map(p => `<li><a href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></li>`).join("")}</ul></div>
    <div><h2>Newsletter</h2><div class="rule"></div><p class="small">Notes on sterile services practice, products and training.</p><form id="newsletter"><label for="newsletter-email" class="sr">Email address</label><input id="newsletter-email" type="email" required placeholder="Your email address"><button type="submit">Subscribe</button></form>${state.subscribed ? `<p class="small" style="font-size:12px" role="status">Saved.</p>` : ""}</div>
  </div><div class="fbase"><div class="wrap"><p>&copy; 2026 ${company.name}. All rights reserved.</p><nav aria-label="Legal"><a href="#/about">About</a><a href="#/services">Services</a><a href="#/programmes">Programmes</a><a href="#/resources">Resources</a><a href="#/faq">FAQ</a><a href="#/search">Search</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></nav></div></div></footer>`;
}

function field(label, name, o = {}) {
  return `<div class="fld"><label for="${name}">${label}${o.req ? ' <span class="req">*</span>' : ""}</label><input id="${name}" name="${name}" type="${o.type || "text"}" maxlength="255" ${o.ph ? `placeholder="${o.ph}"` : ""}>${state.errors[name] ? `<p class="err">${state.errors[name]}</p>` : ""}</div>`;
}
function enquiryForm(variant, defaultInterest = "") {
  if (state.submitted) {
    const result = state.submitResult || {delivered: false, failed: false};
    const headline = result.delivered ? "Your enquiry has been sent." : (result.failed ? "We could not deliver your enquiry." : "Your enquiry has not been sent.");
    const detailMsg = result.delivered ? "It reached the submission service." : (result.failed ? "The submission service did not accept the message." : "No submission service is connected yet, so a copy is saved in this browser.");
    return `<div class="done" role="status"><h2>${headline}</h2><p>${detailMsg}</p>${result.id ? `<p>Reference <strong>${escapeHtml(result.id)}</strong>.</p>` : ""}<button type="button" id="again">Send another enquiry</button></div>`;
  }
  const interestGroups = () => [
    {g: "Products", items: products.map(p => p.name)}, {g: "Software", items: software.map(s => s.name)},
    {g: "Services", items: services.map(s => s.name)}, {g: "Programmes", items: programmes.map(s => s.name)}, {g: "Other", items: ["General enquiry"]}
  ];
  return `<form class="enq" id="enquiry" data-variant="${variant}" novalidate>
    <div class="fields">${field("Full name", "name", {req: 1})}${field("Email address", "email", {type: "email", req: 1})}${field("Telephone", "phone")}${field("Organisation", "organisation", {req: 1})}${Places.countryField("", {required: true, error: state.errors.country ? `<p class="err">${state.errors.country}</p>` : ""})}${Places.cityField("", "")}</div>
    <div class="fields"><div class="fld"><label for="interest">Your enquiry relates to <span class="req">*</span></label>
      <select id="interest" name="interest"><option value="">Please choose…</option>${interestGroups().map(g => `<optgroup label="${g.g}">${g.items.map(i => `<option value="${escapeHtml(i)}"${i === defaultInterest ? " selected" : ""}>${escapeHtml(i)}</option>`).join("")}</optgroup>`).join("")}</select>${state.errors.interest ? `<p class="err">${state.errors.interest}</p>` : ""}</div>
    ${variant === "quote" ? field("Quantity required", "quantity", {ph: "e.g. 200"}) : "<div></div>"}</div>
    ${variant === "contact" ? `<div class="fld"><label for="subject">Subject <span class="req">*</span></label><input id="subject" name="subject" type="text" maxlength="160" autocomplete="off" placeholder="What would you like to ask?">${state.errors.subject ? `<p class="err">${state.errors.subject}</p>` : ""}</div>` : ""}
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

/* ---------- AUTH PAGES - PROFESSIONAL FORM FIRST ---------- */
function loginPage() {
  const providers = Accounts.providers ? Accounts.providers() : [];
  const showGoogle = !providers.length || providers.includes('google');
  const showFacebook = !providers.length || providers.includes('facebook');
  return `<div class="auth-wrap"><div class="auth-card">
    <div class="auth-head"><h1>Login</h1><p>Welcome back — sign in to your SURGICISS account</p></div>
    <div class="auth-body">
      ${state.authError ? `<div class="note warn" style="margin-bottom:16px">${escapeHtml(state.authError)}</div>` : ""}
      <form id="loginForm" novalidate>
        <div class="fld"><label for="loginEmail">Email address</label><input id="loginEmail" name="email" type="email" placeholder="you@company.com" required autocomplete="email"></div>
        <div class="fld"><label for="loginPass">Password</label><div style="position:relative"><input id="loginPass" name="password" type="password" placeholder="••••••••" required autocomplete="current-password" style="padding-right:40px"><button type="button" id="togglePass" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;padding:4px">${icons.eye}</button></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 18px;font-size:13px"><label class="check" style="font-size:13px"><input type="checkbox" name="remember"> Remember me</label><a href="#/forgot" style="color:var(--link)">Forgot password?</a></div>
        <button class="btn primary" type="submit" style="width:100%" ${state.authLoading ? "disabled" : ""}>${state.authLoading ? "Signing in..." : "LOGIN"}</button>
      </form>
      <div class="auth-links" style="justify-content:center;margin-top:16px"><span class="muted">Don't have an account?</span> <a href="#/register">Create account</a></div>
      <div class="or">or continue with</div>
      <div class="social-block"><div class="social-list">
        ${showGoogle ? `<button class="btn social" data-oauth="google">${icons.google} Continue with Google</button>` : ""}
        ${showFacebook ? `<button class="btn social" data-oauth="facebook">${icons.facebook} Continue with Facebook</button>` : ""}
      </div></div>
      <p style="text-align:center;font-size:11px;color:var(--muted-fg);margin-top:20px">🔒 Protected by 256-bit SSL • HIPAA compliant</p>
    </div>
  </div></div>`;
}
function registerPage() {
  return `<div class="auth-wrap"><div class="auth-card">
    <div class="auth-head"><h1>Create Account</h1><p>Join SURGICISS LTD for quotes & tracking</p></div>
    <div class="auth-body">
      ${state.authError ? `<div class="note warn" style="margin-bottom:16px">${escapeHtml(state.authError)}</div>` : ""}
      <form id="registerForm" novalidate>
        <div class="fld"><label>Full name *</label><input name="name" type="text" placeholder="Dr. John Smith" required></div>
        <div class="fld"><label>Email address *</label><input name="email" type="email" placeholder="you@hospital.com" required></div>
        <div class="fld"><label>Password *</label><input name="password" type="password" placeholder="At least 8 characters" required><small style="color:var(--muted-fg)">Min 8 characters</small></div>
        <div class="fld"><label>Confirm password *</label><input name="confirm" type="password" required></div>
        <button class="btn primary" type="submit" style="width:100%;margin-top:12px" ${state.authLoading ? "disabled" : ""}>${state.authLoading ? "Creating..." : "Create Account"}</button>
      </form>
      <div class="auth-links" style="justify-content:center;margin-top:16px"><span class="muted">Already have account?</span> <a href="#/login">Login</a></div>
    </div>
  </div></div>`;
}
function accountPage() {
  const user = Accounts.current();
  if (!user) { location.hash = "#/login"; return "<p>Redirecting...</p>"; }
  return `<div class="wrap sec"><div class="auth-wrap" style="padding:0"><div class="auth-card" style="max-width:700px">
    <div class="auth-head"><h1>My Account</h1><p>${escapeHtml(user.email)}</p></div>
    <div class="auth-body">
      <p><strong>Name:</strong> ${escapeHtml(user.name)}</p>
      <p style="margin-top:8px"><strong>Organisation:</strong> ${escapeHtml(user.organisation || "—")}</p>
      <div style="margin-top:20px;display:flex;gap:12px"><a class="btn" href="#/generate-quote">Generate Quote</a><button class="btn line" id="logoutBtn2">Logout</button></div>
    </div>
  </div></div></div>`;
}

const pages = {
  home() {
    const featured = ["quality-assurance-card", "surgical-instrument-master-wrap", "universal-surgical-count-sheet-holder"].map(x => products.find(p => p.slug === x)).filter(Boolean);
    return `<section class="hero" id="hero" aria-label="Featured"><h1 class="sr">SURGICISS LTD</h1>
      <div class="slides">${slides.map((sl, i) => `<div class="slide${i === state.slide ? " on" : ""}${/^(software|product)/.test(sl.image) ? " lt" : ""}" aria-hidden="${i !== state.slide}"><img src="${imageUrl(sl.image)}" alt="" width="1600" height="900"><div class="in"><h2 class="st">${escapeHtml(sl.title)}</h2><p class="sb">${escapeHtml(sl.body)}</p><a class="btn hb" href="${href(sl.cta[1])}">${sl.cta[0]}</a></div></div>`).join("")}</div>
      <button type="button" class="nav" style="left:0" aria-label="Previous" data-slide="-1">${icons.left}</button><button type="button" class="nav" style="right:0" aria-label="Next" data-slide="1">${icons.right}</button>
      <div class="dots">${slides.map((sl, i) => `<button type="button" aria-label="Show slide ${i+1}" aria-current="${i === state.slide}" data-goto="${i}"></button>`).join("")}</div></section>
    <section class="sec tint" style="padding-block:0"><div class="wrap quick">${software.map(x => `<a href="${href("/software/" + x.slug)}">${escapeHtml(x.name)}</a>`).join("")}</div></section>
    <section class="wrap sec intro"><h2>${company.name}</h2><h3>${company.tagline}</h3><p>The problem with healthcare today is not the lack of advanced technologies and skilled hands, but the absence of simple innovations that help each pair of hands get the basics done right the first time.</p></section>
    <section class="wrap" style="padding-bottom:48px"><div class="grid g3" style="gap:32px">${services.map(x => `<article class="feat"><a href="${href("/services/" + x.slug)}" style="display:block;overflow:hidden;background:var(--tint)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/services/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${href("/services/" + x.slug)}">Read more</a></article>`).join("")}</div></section>
    <section class="sec tint"><div class="wrap intro"><h2>Products</h2><p>Through research, development and the steady use of instrument processing products, software and methods in real departments, we work to support patient safety.</p><div class="grid g3" style="gap:32px;margin-top:32px;text-align:left">${featured.map(x => `<article class="feat"><a href="${href("/products/" + x.slug)}" style="display:block;overflow:hidden;background:var(--card)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/products/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${quoteHref(x.name)}">Request a quote</a></article>`).join("")}</div><div class="center" style="margin-top:40px"><a class="btn lg" href="#/products">All Products</a></div></div></section>`;
  },
  login: loginPage, register: registerPage, account: accountPage,
  about() { return banner("About us", [{label: "About"}]) + `<section class="wrap sec"><div class="rich"><h2 class="section-title">Dedicated to best surgical outcomes</h2><p style="margin-top:16px">${escapeHtml(company.intro)}</p></div></section>` + callToAction("Considering a change?", "Send us the detail and we will tell you honestly whether we can help."); },
  products() { return banner("Products", [{label: "Products"}]) + `<section class="wrap sec"><div class="grid g3">${products.map(productCard).join("")}</div></section>` + callToAction("Need a quotation?", "Send one enquiry with the products and quantities."); },
  category(slug) { const c = productCategories.find(x => x.slug === slug); if (!c) return null; const list = products.filter(p => p.category === slug); return banner(c.name, [{label: "Products", to: "/products"}, {label: c.name}]) + `<section class="wrap sec">${list.length ? `<div class="grid g3">${list.map(productCard).join("")}</div>` : `<p class="muted">No products yet.</p>`}</section>`; },
  product(slug) { const p = products.find(x => x.slug === slug); if (!p) return null; return banner(p.name, [{label: "Products", to: "/products"}, {label: p.name}]) + `<section class="wrap sec"><div class="two prod"><div><img class="pimg" src="${imageUrl(p.image)}" alt="${escapeHtml(p.name)}"></div><div><p>${escapeHtml(p.summary)}</p><div style="margin-top:24px;display:flex;gap:12px"><a class="btn lg" href="${quoteHref(p.name)}">Request a quote</a><a class="btn line lg" href="#/contact-us">Ask a question</a></div><div class="rich" style="margin-top:32px">${paras(p.body)}</div></div></div></section>` + callToAction("Quotation for " + p.name, "Tell us quantities and delivery point."); },
  softwareIndex() { return banner("Software", [{label: "Software"}]) + `<section class="wrap sec"><div class="grid g2">${software.map(swCard).join("")}</div></section>`; },
  softwareItem(slug) { const s = software.find(x => x.slug === slug); if (!s) return null; return banner(s.name, [{label: "Software", to: "/software"}, {label: s.name}]) + `<section class="wrap sec"><div class="two side"><div><img class="wideimg sw" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}"><div class="rich" style="margin-top:32px">${paras(s.body)}</div></div><aside><div class="box tint"><h2 class="h-sec">Enquire about ${escapeHtml(s.name)}</h2><a class="btn" href="${quoteHref(s.name)}">Request a quote</a></div></aside></div></section>`; },
  servicesIndex() { return banner("Services", [{label: "Services"}]) + `<section class="wrap sec"><div class="grid g3">${services.map(serviceCard).join("")}</div></section>`; },
  serviceItem(slug) { const s = services.find(x => x.slug === slug); if (!s) return null; return banner(s.name, [{label: "Services", to: "/services"}, {label: s.name}]) + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt=""><div class="rich" style="margin-top:32px">${paras(s.body)}</div></div><aside><div class="box tint"><h2 class="h-sec">Enquire</h2><a class="btn" href="${quoteHref(s.name)}">Request a proposal</a></div></aside></div></section>`; },
  programmesIndex() { return banner("Programmes", [{label: "Programmes"}]) + `<section class="wrap sec"><div class="grid g3">${programmes.map(progCard).join("")}</div></section>`; },
  programmeItem(slug) { const s = programmes.find(x => x.slug === slug); if (!s) return null; return banner(s.name, [{label: "Programmes", to: "/programmes"}, {label: s.name}]) + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt=""><div class="rich" style="margin-top:32px">${paras(s.body)}</div></div><aside><div class="box tint"><h2 class="h-sec">Enquire</h2><a class="btn" href="${quoteHref(s.name)}">Request an outline</a></div></aside></div></section>`; },
  countSheets() { const holders = products.filter(p => p.category === "count-sheet-holders"); return banner("Instrument count sheet holders", [{label: "Instrument count sheet holders"}]) + `<section class="wrap sec"><div class="grid g3">${holders.map(productCard).join("")}</div></section>`; },
  contact() { return banner("Contact us", [{label: "Contact us"}]) + `<section class="wrap sec"><div class="two contact"><aside><div class="box tint"><h2 class="h-sec">SURGICISS LTD</h2><dl class="kv"><div><dt>Address</dt><dd>${escapeHtml(detail(company.address))}</dd></div><div><dt>Email</dt><dd>${escapeHtml(detail(company.email))}</dd></div></dl></div></aside><div><h2 class="section-title">Send us an enquiry</h2><div style="margin-top:24px">${enquiryForm("contact")}</div></div></div></section>`; },
  quote() { const item = state.quoteItem; return banner("Request a quote", [{label: "Request a quote"}]) + `<section class="wrap sec"><div class="two quote"><div>${item ? `<p class="callout">Enquiry about: <strong>${escapeHtml(item)}</strong></p>` : ""}${enquiryForm("quote", item)}</div><aside><div class="box tint"><h2 class="h-sec">What happens next</h2><ol class="muted" style="margin-top:12px;display:grid;gap:8px;font-size:14px"><li>1. We read the enquiry.</li><li>2. We come back with a quotation.</li><li>3. Agree delivery.</li></ol></div></aside></div></section>`; },
  faq() { return banner("FAQ", [{label: "FAQ"}]) + `<section class="wrap narrow sec"><p>FAQ content...</p></section>`; },
  resources() { return banner("Resources", [{label: "Resources"}]) + `<section class="wrap sec"><p>Resources...</p></section>`; },
  search() { return banner("Search", [{label: "Search"}]) + `<section class="wrap narrow sec"><input class="search-in" id="site-search" type="search" value="${escapeHtml(state.q)}" placeholder="Search..."><div id="results" style="margin-top:32px"></div></section>`; },
  privacy() { return banner("Privacy", [{label: "Privacy"}]) + `<section class="wrap narrow sec"><div class="rich"><p>Privacy notice...</p></div></section>`; },
  terms() { return banner("Terms", [{label: "Terms"}]) + `<section class="wrap narrow sec"><div class="rich"><p>Terms...</p></div></section>`; },
  notFound() { return `<section class="wrap nf"><h1>404</h1><h2>Not found</h2><div class="row"><a class="btn lg" href="#/">Go home</a><a class="btn line lg" href="#/contact-us">Contact us</a></div></section>`; }
};

function currentPath() { return (location.hash.slice(1).split("?")[0] || "/").replace(/\/+$/, "") || "/"; }
function currentQuery() { const q = location.hash.split("?")[1] || ""; return new URLSearchParams(q); }
const titles = {"/": "SURGICISS LTD", "/login": "Login — SURGICISS LTD", "/register": "Create Account — SURGICISS LTD", "/account": "My Account — SURGICISS LTD", "/about": "About", "/products": "Products", "/software": "Software", "/services": "Services", "/programmes": "Programmes", "/count-sheet-holders": "Count Sheet Holders", "/contact-us": "Contact", "/generate-quote": "Generate quote", "/faq": "FAQ", "/resources": "Resources", "/search": "Search", "/privacy": "Privacy", "/terms": "Terms"};

function route() {
  const p = currentPath(), seg = p.split("/").filter(Boolean);
  let html = null;
  if (p === "/") html = pages.home();
  else if (seg.length === 1) {
    const m = {login: "login", register: "register", account: "account", about: "about", products: "products", software: "softwareIndex", services: "servicesIndex", programmes: "programmesIndex", "count-sheet-holders": "countSheets", "contact-us": "contact", "request-quote": "quote", "generate-quote": "quote", faq: "faq", resources: "resources", search: "search", privacy: "privacy", terms: "terms"}[seg[0]];
    if (seg[0] === "request-quote" || seg[0] === "generate-quote") state.quoteItem = currentQuery().get("item") || "";
    if (m) html = pages[m]();
  } else if (seg.length === 2) {
    const m = {products: "product", "product-category": "category", software: "softwareItem", services: "serviceItem", programmes: "programmeItem"}[seg[0]];
    if (m) html = pages[m](seg[1]);
  }
  if (html === null) html = pages.notFound();
  document.title = titles[p] || (p + " — SURGICISS LTD");
  state.menu = null; state.mobile = false;
  render(html);
}
let lastMain = "";
function render(main) {
  if (main !== undefined) lastMain = main;
  document.getElementById("app").innerHTML = header() + `<main id="main">${lastMain}</main>` + footer();
}
function rerenderKeepScroll(main) { const y = scrollY; render(main); scrollTo(0, y); }

document.addEventListener("click", e => {
  const t = e.target.closest("[data-toggle],[data-mtoggle],[data-slide],[data-goto],#menubtn,#themebtn,#again,#totop,#logoutBtn,#logoutBtn2,[data-oauth],#togglePass");
  const inDD = e.target.closest(".dd");
  if (!inDD) document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
  const link = e.target.closest("a[href^='#']");
  if (link) {
    document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
    if (link.closest("#mobnav")) setTimeout(() => { if (state.mobile) { state.mobile = false; rerenderKeepScroll(); } }, 0);
  }
  if (!t) return;
  if (t.dataset.toggle) { const box = t.closest(".dd"); const was = box.classList.contains("open"); document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open")); box.classList.toggle("open", !was); t.setAttribute("aria-expanded", String(!was)); }
  else if (t.hasAttribute("data-mtoggle")) { const sub = t.closest(".mg").querySelector(".msub"); sub.hidden = !sub.hidden; t.setAttribute("aria-expanded", String(!sub.hidden)); }
  else if (t.dataset.slide) { setSlide(state.slide + Number(t.dataset.slide)); }
  else if (t.dataset.goto) { setSlide(Number(t.dataset.goto)); }
  else if (t.id === "menubtn") { state.mobile = !state.mobile; rerenderKeepScroll(); }
  else if (t.id === "themebtn") { const next = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = next; try { localStorage.setItem("surgiciss-theme", next); } catch {} t.outerHTML = themeButton(); }
  else if (t.id === "again") { state.submitted = false; state.errors = {}; route(); }
  else if (t.id === "totop") scrollTo({top: 0, behavior: "smooth"});
  else if (t.id === "logoutBtn" || t.id === "logoutBtn2") { Accounts.logout(); location.hash = "#/"; }
  else if (t.dataset.oauth) { Accounts.loginWithProvider(t.dataset.oauth); }
  else if (t.id === "togglePass") { const inp = document.getElementById("loginPass"); if (inp) inp.type = inp.type === "password" ? "text" : "password"; }
});

function setSlide(n) {
  state.slide = (n + slides.length) % slides.length;
  const h = document.getElementById("hero"); if (!h) return;
  h.querySelectorAll(".slide").forEach((el, i) => { const on = i === state.slide; el.classList.toggle("on", on); el.setAttribute("aria-hidden", String(!on)); });
  h.querySelectorAll(".dots button").forEach((b, i) => b.setAttribute("aria-current", String(i === state.slide)));
}
function rerenderMain() { if (currentPath() === "/") rerenderKeepScroll(pages.home()); }

document.addEventListener("submit", async e => {
  e.preventDefault();
  if (e.target.id === "newsletter") {
    const v = e.target.querySelector("input").value.trim();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      state.subscribed = true;
      try { const list = JSON.parse(localStorage.getItem("surgiciss-newsletter") || "[]"); if (!list.includes(v)) list.push(v); localStorage.setItem("surgiciss-newsletter", JSON.stringify(list)); } catch {}
      if (Api.enabled) Api.post("/newsletter", {email: v});
      rerenderKeepScroll();
    }
    return;
  }
  if (e.target.id === "loginForm") {
    state.authLoading = true; state.authError = ""; rerenderKeepScroll(pages.login());
    const fd = new FormData(e.target);
    const res = await Accounts.login(fd.get("email"), fd.get("password"));
    state.authLoading = false;
    if (res.ok) { state.authError = ""; location.hash = "#/account"; }
    else { state.authError = res.error; rerenderKeepScroll(pages.login()); }
    return;
  }
  if (e.target.id === "registerForm") {
    state.authLoading = true; state.authError = ""; rerenderKeepScroll(pages.register());
    const fd = new FormData(e.target);
    const input = Object.fromEntries(fd.entries());
    const res = await Accounts.register(input);
    state.authLoading = false;
    if (res.ok) { state.authError = ""; location.hash = "#/account"; }
    else { state.authError = res.error; rerenderKeepScroll(pages.register()); }
    return;
  }
  if (e.target.id === "enquiry") {
    if (window.handleEnquirySubmit) { handleEnquirySubmit(e); return; }
    const v = Object.fromEntries(new FormData(e.target).entries());
    const errs = validate(v);
    if (Object.keys(errs).length) {
      state.errors = errs;
      const keep = v; rerenderKeepScroll(pages[currentPath() === "/request-quote" || currentPath() === "/generate-quote" ? "quote" : "contact"]());
      for (const [k, val] of Object.entries(keep)) { const el = document.querySelector(`#enquiry [name="${k}"]`); if (el && el.type !== "radio") el.value = val; }
      return;
    }
    state.errors = {}; state.submitted = true; route();
  }
});

document.addEventListener("input", e => {
  if (e.target.id === "site-search") {
    state.q = e.target.value;
    const idx = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})), services.map(p => ({k: "Service", n: p.name, s: p.summary, to: "/services/" + p.slug})), programmes.map(p => ({k: "Programme", n: p.name, s: p.summary, to: "/programmes/" + p.slug})));
    const term = state.q.trim().toLowerCase();
    const results = term.length < 2 ? `<p class="muted">Type at least two characters.</p>` : (() => { const res = idx.filter(e => (e.n + " " + e.s).toLowerCase().includes(term)); if (!res.length) return `<p class="muted">Nothing matched.</p>`; return `<ul class="results">${res.map(e => `<li><p class="k">${e.k}</p><a href="${href(e.to)}">${escapeHtml(e.n)}</a><p>${escapeHtml(e.s)}</p></li>`).join("")}</ul>`; })();
    const el = document.getElementById("results"); if (el) el.innerHTML = results;
  }
});

addEventListener("scroll", () => {
  const h = document.getElementById("hdr"); if (h) h.classList.toggle("stuck", scrollY > 8);
  const t = document.getElementById("totop"); if (t) t.hidden = scrollY < 400;
}, {passive: true});
addEventListener("hashchange", () => { state.submitted = false; state.errors = {}; state.authError = ""; state.submitResult = null; if (window.onBeforeRoute) onBeforeRoute(); route(); scrollTo(0,0); });
setInterval(() => { if (currentPath() === "/" && !document.hidden && !state.mobile) setSlide(state.slide + 1); }, 5500);
try { const s = localStorage.getItem("surgiciss-theme"); if (s === "dark" || s === "light") document.documentElement.dataset.theme = s; } catch {}
if (window.installCustomer) installCustomer();
if (window.Accounts && Accounts.pending()) Accounts.ready.then(route); else route();
