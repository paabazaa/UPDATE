// Theme button, header and footer
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

/* ---------- header / footer ---------- */
const isDark = () => document.documentElement.dataset.theme === "dark";
function themeButton() {
  const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  return `<button type="button" class="theme" id="themebtn" aria-label="${isDark() ? "Switch to light mode" : "Switch to dark mode"}">${isDark() ? sun : moon}<span class="sr">${isDark() ? "Light mode" : "Dark mode"}</span></button>`;
}
function header() {
  const r = currentPath();
  const act = p => (p === "/" ? r === "/" : r === p || r.startsWith(p + "/")) ? " active" : "";
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const swL = software.map(s => ({label: s.name, to: "/software/" + s.slug}));
  const prL = products.map(p => ({label: p.name, to: "/products/" + p.slug}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(l => `<a href="${href(l.to)}">${escapeHtml(l.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="760" height="192" decoding="async"></a>
    <div style="display:flex;align-items:center">
    <nav class="main" aria-label="Main navigation">
      <a class="tl home${act("/")}" href="/" aria-label="Home" title="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>
      ${dd("software", "Software", swL, "/software", "All Software")}
      ${dd("products", "Products", prL, "/products", "All Products")}
      <a class="tl${act("/count-sheet-holders")}" href="/count-sheet-holders">Instrument Count Sheet Holders</a>
      <a class="tl${act("/contact-us")}" href="/contact-us">Contact Us</a>
    </nav>
    <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav">${state.mobile ? icons.close : icons.menu}Menu</button>
    ${themeButton()}
    </div></div>
    ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a class="homelink" href="/" aria-label="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg><span>Home</span></a>${mgroup("Software", swL, "/software", "All Software")}${mgroup("Products", prL, "/products", "All Products")}<a href="/count-sheet-holders">Instrument Count Sheet Holders</a><a href="/about">About</a><a href="/contact-us">Contact Us</a><a class="quote" href="/request-quote">Request a quote</a></nav>
      </div>` : ""}
  </header>`;
}
function footer() {
  return `<footer class="site"><div class="wrap fgrid">
    <div><h2>Contact Us</h2>
    <div class="rule"></div>
    <ul>
      <li>${icons.pin}<span>${escapeHtml(company.address)}</span></li>
      <li>${icons.phone}${phoneLink()}</li>
      <li>${icons.mail}${emailLink()}</li>
      <li>${icons.whatsapp}${whatsappLink()}</li>
    </ul>
      <a class="go" href="/contact-us">Send an enquiry</a></div>
    <div><h2>Software</h2>
        <div class="rule"></div>
        <ul>${software.map(s => `<li><a href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></li>`).join("")}<li><a href="/software">All Software</a></li>
      </ul>
      </div>
    <div><h2>Products</h2>
      <div class="rule"></div>
      <ul>${products.map(p => `<li><a href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></li>`).join("")}</ul>
      </div>
    <div><h2>Newsletter</h2>
      <div class="rule"></div>
      <p class="small">Notes on sterile services practice, products and training. Enter your email address to be added to the list.</p>
      <form id="newsletter"><label for="newsletter-email" class="sr">Email address</label>
      <input id="newsletter-email" type="email" required placeholder="Your email address"><button type="submit">Subscribe</button></form>
      ${state.subscribeError ? `<p class="small" style="font-size:12px" role="alert">${escapeHtml(state.subscribeError)}</p>` : ""}${state.subscribed ? `<p class="small" style="font-size:12px" role="status">Thank you. Your email address has been added to the list.</p>` : ""}</div>
  </div>
  <div class="fbase"><div class="wrap"><p>&copy; 2026 ${company.name}. All rights reserved.</p>
    <nav aria-label="Legal"><a href="/about">About</a><a href="/services">Services</a><a href="/programmes">Programmes</a><a href="/resources">Resources</a><a href="/faq">FAQ</a><a href="/search">Search</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
    </div>
    </div>
    </footer>`;
}
