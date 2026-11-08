// Pictures, company details, small helpers, icons, page state and the hero slides
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

// Public pages, navigation, search and the enquiry form.
// Routes use the URL hash (for example #/products), so the site can be hosted anywhere.
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
  "masterWrapPrepare": "images/master-wrap-ifu-prepare.jpg",
  "masterWrapPosition": "images/master-wrap-ifu-position.jpg",
  "masterWrapSecure": "images/master-wrap-ifu-secure.jpg",
  "masterWrapCloseup": "images/master-wrap-ifu-closeup.jpg",
  "masterWrapFulltray": "images/master-wrap-ifu-fulltray.jpg",
  "serviceLeadership": "images/service-operating-room.jpg",
  "serviceMorale": "images/service-sterile-storage.jpg",
  "serviceTraining": "images/hero-sterile-services.jpg",
  "heroSterileProcessing": "images/hero-sterile-services.jpg",
  "logo": "images/logo.png"
};

// Official SURGICISS LTD contact information.
// Values are read from config.js, with fallbacks.
const companyConfig = window.SURGICISS_CONFIG?.company || {};

const company = {
  name: "SURGICISS LTD",
  tagline: "We're dedicated to best surgical outcomes.",
  address: companyConfig.location || "Bolgatanga, Upper East Region, Ghana",
  phone: companyConfig.telephone || "+233542205201",
  whatsapp: companyConfig.whatsapp || "+233542205201",
  email: companyConfig.email || "surgiciss@gmail.com",
  registration: "",
  hours: "",
  intro: "SURGICISS LTD works with hospitals, surgery centres and sterile services departments to support the consistent delivery of clean, sterile, functional and relevant surgical instruments, equipment and supplies — on time and on budget."
};

const detail = (v, fb = "Available on request") => (v && v.trim() ? v : fb);
const {productCategories, products, software, services, programmes} = DATA;
const imageUrl = k => IMAGES[k];
const catName = s => (productCategories.find(c => c.slug === s) || {}).name || s;

// Escapes text before it is placed inside an HTML template.
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

// Safe telephone and email link helpers.
const phoneLink = () => `<a href="tel:${escapeHtml(company.phone)}">${escapeHtml(company.phone)}</a>`;
const emailLink = () => `<a href="mailto:${escapeHtml(company.email)}">${escapeHtml(company.email)}</a>`;
const whatsappLink = () => `<a href="https://wa.me/${escapeHtml(company.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener noreferrer">${escapeHtml(company.whatsapp)}</a>`;

// Inline SVG icons used across the page templates.
const icons = {
  tick: '<svg class="ico" style="margin:0;width:18px;height:18px" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  arrow: '<svg class="ico" style="margin:0;width:16px;height:16px" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  plus: '<svg class="ico" style="margin:0;width:16px;height:16px" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  layers: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/></svg>',
  box: '<svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  whatsapp: '<svg class="ico" viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.3A8.4 8.4 0 1 1 21 11.5Z"/><path d="M9 8.8c.3 2.6 2.4 4.7 5.2 5.4l1.2-1.3-1.9-.9-.8.6a4.2 4.2 0 0 1-1.9-1.9l.6-.8-.9-1.9Z"/></svg>',
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
