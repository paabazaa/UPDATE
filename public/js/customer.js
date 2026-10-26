// Optional customer accounts, quote builder and enquiry delivery.
// Public pages do not depend on this file's sign-in state.

function onBeforeRoute() {
  const form = document.getElementById("quote-form");
  // Keep a half-filled quote in memory only, so choosing "Log in" from the quote page does not lose it.
  if (form) state.quoteDraft = readQuoteForm(form);
  state.quoteHold = null;
  state.notice = "";
  state.authError = "";
  state.deleteError = "";
  state.pictureError = "";
  state.forgotSent = false;
  state.resetDone = false;
}

function catalogueGroups() {
  return [
    {label: "Products", items: products.map(item => ({value: "product:" + item.slug, label: item.name}))},
    {label: "Software", items: software.map(item => ({value: "software:" + item.slug, label: item.name}))},
    {label: "Services", items: services.map(item => ({value: "service:" + item.slug, label: item.name}))},
    {label: "Programmes", items: programmes.map(item => ({value: "programme:" + item.slug, label: item.name}))}
  ];
}
function refLabel(ref) {
  for (const group of catalogueGroups()) {
    const hit = group.items.find(item => item.value === ref);
    if (hit) return hit.label;
  }
  return "";
}
function refForName(name) {
  if (!name) return "";
  for (const group of catalogueGroups()) {
    const hit = group.items.find(item => item.label === name);
    if (hit) return hit.value;
  }
  return "";
}
function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"});
}
function safeNext(value) {
  if (!value || value.charAt(0) !== "/" || value.indexOf("//") === 0 || value.indexOf("\\") !== -1 || value.indexOf(":") !== -1) return "/account";
  return value;
}
function withNext(path) {
  const next = currentQuery().get("next");
  return next ? "#" + path + "?next=" + encodeURIComponent(safeNext(next)) : "#" + path;
}
function goNext(fallback) {
  location.hash = "#" + safeNext(currentQuery().get("next") || fallback || "/account");
}
function localNotice() {
  return "";
}
function deliveryCopy(record) {
  if (record.delivered) return "SURGICISS has received this request.";
  return "This request has not reached SURGICISS yet. Please try again later or use the contact page.";
}
function statusPill(record) {
  return `<span class="pill ok">Received</span>`;
}
function blankFields(fields) {
  const user = Accounts.current();
  const base = {
    name: user ? user.name : "",
    email: user ? user.email : "",
    phone: user ? user.phone : "",
    organisation: user ? user.organisation : "",
    country: user ? user.country : "",
    city: user ? user.city : "",
    delivery: user ? user.deliveryLocation : "",
    requirements: "",
    preferredContact: "Email"
  };
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (String(value || "").trim() !== "") base[key] = value;
  });
  return base;
}
function buildQuoteModel() {
  if (state.quoteHold) return {lines: state.quoteHold.lines, fields: blankFields(state.quoteHold.fields)};
  const requested = refForName(currentQuery().get("item") || state.quoteItem || "");
  const draft = state.quoteDraft;
  if (draft && Array.isArray(draft.lines) && draft.lines.length) {
    if (requested && !draft.lines.some(line => line.ref === requested)) draft.lines.unshift({ref: requested, qty: "1", note: ""});
    return {lines: draft.lines, fields: blankFields(draft.fields)};
  }
  return {lines: [{ref: requested, qty: "1", note: ""}], fields: blankFields({})};
}
function readQuoteForm(form) {
  const lines = [...form.querySelectorAll("[data-line]")].map(row => ({
    ref: row.querySelector('[name="ref"]').value,
    qty: row.querySelector('[name="qty"]').value,
    note: row.querySelector('[name="note"]').value
  }));
  const value = name => (form.elements[name] && form.elements[name].value) || "";
  const preferred = form.querySelector('input[name="preferredContact"]:checked');
  return {
    lines: lines.length ? lines : [{ref: "", qty: "1", note: ""}],
    fields: {
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      organisation: value("organisation"),
      country: value("country"),
      city: value("city"),
      delivery: value("delivery"),
      requirements: value("requirements"),
      preferredContact: preferred ? preferred.value : "Email"
    }
  };
}
function validateQuote(model) {
  const errors = {};
  const fields = model.fields;
  if (!model.lines.length) errors.lines = "Add at least one item.";
  model.lines.forEach((line, index) => {
    if (!line.ref) errors["line" + index] = "Choose a product, system, service or programme.";
    if (!/^[1-9]\d*$/.test(String(line.qty || "").trim())) errors["qty" + index] = "Enter a whole number of 1 or more.";
    if (String(line.note || "").trim().length > 240) errors["note" + index] = "Keep this note under 240 characters.";
  });
  if (String(fields.name || "").trim().length < 2) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fields.email || "").trim())) errors.email = "Please enter a valid email address.";
  if (String(fields.organisation || "").trim().length < 2) errors.organisation = "Please tell us which organisation you represent.";
  if (String(fields.country || "").trim().length < 2) errors.country = "Please enter the country for delivery or for the work.";
  if (String(fields.delivery || "").trim().length < 3) errors.delivery = "Please tell us where the goods or the work should go.";
  return errors;
}
function lineOptions(selected) {
  const groups = catalogueGroups().map(group => {
    const options = group.items.map(item => `<option value="${escapeHtml(item.value)}"${item.value === selected ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("");
    return `<optgroup label="${escapeHtml(group.label)}">${options}</optgroup>`;
  }).join("");
  return `<option value="">Select an item…</option>${groups}`;
}
function quoteLinesHtml(model) {
  return model.lines.map((line, index) => `<div class="line-row" data-line>
    <div class="fld">
      <label for="ref-${index}">Item <span class="req">*</span></label>
      <select id="ref-${index}" name="ref">${lineOptions(line.ref)}</select>
      ${state.errors["line" + index] ? `<p class="err">${escapeHtml(state.errors["line" + index])}</p>` : ""}
    </div>
    <div class="fld">
      <label for="qty-${index}">Quantity <span class="req">*</span></label>
      <input id="qty-${index}" name="qty" inputmode="numeric" maxlength="6" value="${escapeHtml(line.qty || "")}">
      ${state.errors["qty" + index] ? `<p class="err">${escapeHtml(state.errors["qty" + index])}</p>` : ""}
    </div>
    <div class="fld">
      <label for="note-${index}">Note</label>
      <input id="note-${index}" name="note" maxlength="240" placeholder="Size, set type, or timing" value="${escapeHtml(line.note || "")}">
      ${state.errors["note" + index] ? `<p class="err">${escapeHtml(state.errors["note" + index])}</p>` : ""}
    </div>
    <button type="button" class="btn line" data-remove-line="${index}"${model.lines.length === 1 ? " disabled" : ""}>Remove</button>
  </div>`).join("");
}
function contactFieldsHtml(fields) {
  const radio = value => `<label><input type="radio" name="preferredContact" value="${value}"${fields.preferredContact === value ? " checked" : ""}>${value}</label>`;
  const err = name => state.errors[name] ? `<p class="err">${escapeHtml(state.errors[name])}</p>` : "";
  return `<div class="fields">
      <div class="fld"><label for="name">Full name <span class="req">*</span></label>
    <input id="name" name="name" autocomplete="name" maxlength="255" value="${escapeHtml(fields.name || "")}">${err("name")}</div>
      <div class="fld"><label for="email">Email address <span class="req">*</span></label>
        <input id="email" name="email" type="email" autocomplete="email" maxlength="255" value="${escapeHtml(fields.email || "")}">${err("email")}</div>
      <div class="fld"><label for="phone">Telephone</label>
        <input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="255" value="${escapeHtml(fields.phone || "")}"></div>
      <div class="fld"><label for="organisation">Organisation <span class="req">*</span></label>
        <input id="organisation" name="organisation" autocomplete="organization" maxlength="255" value="${escapeHtml(fields.organisation || "")}">${err("organisation")}</div>
      ${Places.countryField(fields.country, {required: true, error: err("country")})}
      ${Places.cityField(fields.country, fields.city)}
    </div>
    <div class="fld"><label for="delivery">Delivery location <span class="req">*</span></label><textarea id="delivery" name="delivery" rows="3" maxlength="500" placeholder="Department, hospital and address, or where the work should take place.">${escapeHtml(fields.delivery || "")}</textarea>${err("delivery")}</div>
    <fieldset class="fld"><legend>Preferred contact method</legend><div class="radios">${radio("Email")}${radio("Telephone")}${radio("Either")}</div></fieldset>
    <div class="fld"><label for="requirements">Additional requirements</label><textarea id="requirements" name="requirements" rows="5" maxlength="2000" placeholder="Sets, timescales, or anything the quotation should take into account.">${escapeHtml(fields.requirements || "")}</textarea></div>`;
}
function quoteText(record) {
  const lines = record.lines.map((line, index) => `${index + 1}. ${line.name} — quantity ${line.quantity}${line.note ? " — " + line.note : ""}`).join("\n");
  return [
    "SURGICISS LTD — quote request",
    "Reference: " + record.id,
    "Prepared: " + formatWhen(record.createdAt),
    "Status: " + (record.delivered ? "Received by SURGICISS" : "Not sent to SURGICISS"),
    "",
    "This is a request for a quotation. It is not an order.",
    "No prices, taxes or delivery charges are included.",
    "",
    "Items",
    lines || "None",
    "",
    "Organisation: " + record.contact.organisation,
    "Contact: " + record.contact.name,
    "Email: " + record.contact.email,
    "Telephone: " + (record.contact.phone || "Not given"),
    "Delivery location: " + record.contact.deliveryLocation,
    "Country: " + record.contact.country,
    "City: " + (record.contact.city || "Not given"),
    "Preferred contact: " + (record.contact.preferredContact || "Email"),
    "",
    "Additional requirements:",
    record.requirements || "None given"
  ].join("\n");
}
function quotePage() {
  if (state.submitted && state.lastQuoteId) {
    const user = Accounts.current();
    const record = Records.visibleQuote(state.lastQuoteId, user && user.id);
    if (record) return quoteDone(record);
  }
  const model = buildQuoteModel();
  const user = Accounts.current();
  const accountNote = user
    ? `<p class="muted">You are signed in as ${escapeHtml(user.email)}. ${"This request will be filed under My quotes."}</p>`
    : "";
  return banner("Generate a quote", [{label: "Generate a quote"}], "Choose the items and quantities you want priced. Nothing on this page is an order, and prices are not shown because each request is quoted on its own.")
    + `<section class="wrap sec"><div class="two quote"><div>
      ${accountNote ? `<div style="margin-top:16px">${accountNote}</div>` : ""}
      <form class="enq" id="quote-form" novalidate style="margin-top:20px">
        ${state.errors.form ? `<p class="err login-error" role="alert">${escapeHtml(state.errors.form)}</p>` : ""}
        <h2 class="h-sec">Items</h2>
        <p class="muted" style="margin:8px 0 12px;font-size:14px">Quantity means units, sets, licences or days — whichever fits the item. We will confirm the meaning when the quotation is prepared. No price is calculated here.</p>
        <div class="lines">${quoteLinesHtml(model)}</div>
        ${state.errors.lines ? `<p class="err">${escapeHtml(state.errors.lines)}</p>` : ""}
        <p style="margin-top:12px"><button type="button" class="btn line" id="add-line">Add another item</button></p>
        <h2 class="h-sec" style="margin-top:28px">Your details</h2>
        <div class="stack">${contactFieldsHtml(model.fields)}</div>
        <div><button class="btn lg" type="submit">Submit quote request</button></div>
      </form>
    </div>
    <aside style="display:grid;gap:24px;align-content:start">
      <div class="box tint"><h2 class="h-sec">What happens next</h2>
          <ol class="steps"><li>We check that the items and quantities are clear.</li>
          <li>The request is sent to SURGICISS and you are given a reference.</li>
          <li>A quotation, if we can offer one, comes back separately. It is not confirmed by this form.</li>
          </ol>
          </div>
      <div class="box"><h2 class="h-sec">Just a question?</h2>
          <p>You do not need a quote to ask something. The contact page is open to everyone.</p>
          <a class="btn line" href="#/contact-us">Ask a question</a></div>
    </aside>
          </div>
          </section>`;
}
function quoteDone(record) {
  const user = Accounts.current();
  const filing = user
    ? `<p><a href="#/account/quotes/${encodeURIComponent(record.id)}">View it in My quotes</a></p>`
    : `<p><a href="#/sign-up?next=${encodeURIComponent("/account/quotes")}">Create an account</a> with ${escapeHtml(record.contact.email)} ${"to keep your future requests together under My quotes."}</p>`;
  return banner("Quote request", [{label: "Generate a quote"}], "Keep the reference. A request is not an order.")
    + `<section class="wrap narrow sec"><div class="done" role="status"><h2>Your quote request was sent.</h2><p>${escapeHtml(deliveryCopy(record))}</p><p>Reference <strong>${escapeHtml(record.id)}</strong>.</p>${filing}<div class="row" style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap"><button type="button" class="btn" data-download="${escapeHtml(record.id)}">Download a copy</button><button type="button" class="btn line" id="again">Prepare another</button></div>
      </div>
    ${quoteSummary(record)}</section>`;
}
function quoteSummary(record) {
  const rows = record.lines.map(line => `<tr><td>${escapeHtml(line.name)}</td><td>${escapeHtml(String(line.quantity))}</td><td>${escapeHtml(line.note || "—")}</td></tr>`).join("");
  return `<div class="box" style="margin-top:24px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h2 class="h-sec">${escapeHtml(record.id)}</h2>${statusPill(record)}</div>
    <p class="muted" style="margin-top:8px;font-size:14px">${escapeHtml(formatWhen(record.createdAt))}</p>
    <p style="margin-top:12px">${escapeHtml(deliveryCopy(record))}</p>
    <div class="table-scroll"><table class="lines"><thead><tr><th>Item</th><th>Quantity</th><th>Note</th></tr>
      </thead><tbody>${rows}</tbody></table></div>
    <dl class="kv" style="margin-top:16px"><div><dt>Organisation</dt><dd>${escapeHtml(record.contact.organisation)}</dd></div><div><dt>Contact</dt><dd>${escapeHtml(record.contact.name)} · ${escapeHtml(record.contact.email)}</dd></div><div><dt>Telephone</dt><dd>${escapeHtml(record.contact.phone || "Not given")}</dd></div><div><dt>Delivery location</dt><dd>${escapeHtml(record.contact.deliveryLocation)}</dd></div><div><dt>Country and city</dt><dd>${escapeHtml(record.contact.country)}${record.contact.city ? " · " + escapeHtml(record.contact.city) : ""}</dd></div><div><dt>Requirements</dt><dd>${escapeHtml(record.requirements || "None given")}</dd></div>
      </dl>
    <p class="muted" style="margin-top:16px;font-size:13px">No prices are shown. This is not an order.</p>
      </div>`;
}

function customerHeader() {
  const path = currentPath();
  const act = item => (item === "/" ? path === "/" : path === item || path.startsWith(item + "/")) ? " active" : "";
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(link => `<a class="pi-link" href="${href(link.to)}"><span class="pi">${icons[link.icon || "layers"]}</span><span class="pt"><b>${escapeHtml(link.label)}</b>${link.summary ? `<small>${escapeHtml(link.summary)}</small>` : ""}</span></a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}${icons.arrow}</a></div></div>`;
  const clip = text => (text.length > 70 ? text.slice(0, 67).replace(/\s+\S*$/, "") + "…" : text);
  const softwareLinks = software.map(item => ({label: item.name, to: "/software/" + item.slug, summary: clip(item.summary), icon: "layers"}));
  const productLinks = products.map(item => ({label: item.name, to: "/products/" + item.slug, summary: clip(item.summary), icon: "box"}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const user = Accounts.current();
  const accountDesktop = user
    ? `<a class="hbtn solid-soft desk-only" href="#/account">${avatarHtml(user, "sm")}My account</a><button type="button" class="hbtn plain desk-only" data-logout>Log out</button>`
    : `<a class="hbtn plain desk-only${act("/login")}" href="#/login">Login</a><a class="hbtn outline desk-only${act("/sign-up")}" href="#/sign-up">Create account</a>`;
  const accountMobile = user
    ? `<a href="#/account">My account</a><a href="#/account/quotes">My quotes</a><a href="#/account/enquiries">My enquiries</a><a href="#/account/orders">My orders</a><button type="button" class="linkish" data-logout>Log out</button>`
    : `<a href="#/login">Login</a><a href="#/sign-up">Create account</a>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="#/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="760" height="192" decoding="async"></a>
    <div class="htools">
      ${accountDesktop}
      <a class="hbtn primary desk-only" href="#/generate-quote">${icons.plus}Generate quote</a>
      <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav">${state.mobile ? icons.close : icons.menu}Menu</button>
      ${themeButton()}
    </div>
  </div>
  <div class="navrow"><nav class="main" aria-label="Main navigation">
      <a class="tl home${act("/")}" href="#/" aria-label="Home" title="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>
      ${dd("software", "Software", softwareLinks, "/software", "All Software")}
      ${dd("products", "Products", productLinks, "/products", "All Products")}
      <a class="tl${act("/count-sheet-holders")}" href="#/count-sheet-holders">Instrument Count Sheet Holders</a>
      <a class="tl${act("/contact-us")}" href="#/contact-us">Contact Us</a>
    </nav>
        </div>
    <div class="mobile-cta"><a class="mc-primary" href="#/generate-quote">${icons.plus}Generate quote</a><a class="mc-second" href="#/contact-us">Ask a question</a></div>
    ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a class="homelink" href="#/" aria-label="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg><span>Home</span></a>${mgroup("Software", softwareLinks, "/software", "All Software")}${mgroup("Products", productLinks, "/products", "All Products")}<a href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a href="#/services">Services</a><a href="#/programmes">Programmes</a><a href="#/about">About</a><a href="#/contact-us">Contact Us</a>${accountMobile}<a class="quote" href="#/generate-quote">Generate quote</a><a class="ask" href="#/contact-us">Ask a question</a></nav>
      </div>` : ""}
  </header>`;
}

function authCard(title, lead, body) {
  return banner(title, [{label: title}], lead) + `<section class="wrap sec"><div class="auth-card">${localNotice()}<div style="margin-top:20px">${body}</div></div></section>`;
}
function fieldError(name) {
  return state.errors[name] ? `<p class="err">${escapeHtml(state.errors[name])}</p>` : "";
}
const SOCIAL = {
  google: {
    label: "Google",
    icon: `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"/></svg>`
  },
  facebook: {
    label: "Facebook",
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#1877F2" d="M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z"/></svg>`
  }
};
const SOCIAL_ERRORS = {
  oauth_unavailable: "That sign-in method is not available right now. Please use your email and password.",
  oauth_denied: "Sign-in was cancelled. You can try again or use your email and password.",
  oauth_failed: "We could not complete that sign-in. Please try again.",
  oauth_no_email: "That account did not share an email address with us. Allow email access when asked, or use another way to sign in.",
  oauth_unverified: "The email address on that account has not been verified, so we cannot use it. Please verify it with the provider or use another way to sign in."
};
function socialButtons(intro = "", divider = "before", label = "or continue with") {
  const providers = Accounts.providers ? Accounts.providers() : [];
  if (!providers.length) return "";
  const next = safeNext(currentQuery().get("next") || "/account");
  const links = providers.filter(name => SOCIAL[name]).map(name =>
    `<a class="btn line social" href="${escapeHtml(Api.base)}/api/auth/oauth/${name}/start?next=${encodeURIComponent(next)}">${SOCIAL[name].icon}<span>Continue with ${SOCIAL[name].label}</span></a>`
  ).join("");
  const list = `<div class="social-list">${links}</div>`;
  if (divider === "after") return `<div class="social-block after"><p class="or"><span>${label}</span></p>${list}</div>`;
  return `<div class="social-block">${intro ? `<p class="muted" style="font-size:14px">${intro}</p>` : ""}${list}<p class="or"><span>or use your email</span></p></div>`;
}
function socialError() {
  return SOCIAL_ERRORS[currentQuery().get("error")] || "";
}
// Shared two-panel layout for the login and sign-up pages: purple brand panel with the logo, form on the right.
function authSplit({title, heading, lead, perks, body, fine}) {
  return `<section class="login-page"><div class="wrap">
    <div class="login-card">
      <aside class="login-brand">
        <a class="login-logo" href="#/" aria-label="SURGICISS LTD home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="760" height="192" decoding="async"></a>
        <h1>${title}</h1>
        <p class="login-lead">${lead}</p>
        <ul class="login-perks">${perks.map(text => `<li>${text}</li>`).join("")}</ul>
      </aside>
      <div class="login-main">
        <h2>${heading}</h2>
        ${body}
        ${fine ? `<p class="login-fine">${fine}</p>` : ""}
      </div>
    </div>
  </div></section>`;
}
const EYE_BUTTON = `<button class="pw-toggle" type="button" data-toggle-password aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button>`;
function passwordField(id, label, autocomplete, extra = "", required = false) {
  return `<div class="fld"><div class="label-row"><label for="${id}">${label}${required ? ' <span class="req">*</span>' : ""}</label>${extra}</div>
    <div class="pw"><input id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" maxlength="128">${EYE_BUTTON}</div>${fieldError(id)}</div>`;
}
const AUTH_FINE = () => "";
function loginPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err login-error" role="alert">${escapeHtml(message)}</p>` : "";
  return authSplit({
    title: "Welcome back",
    lead: "Sign in to open your dashboard, quotes and enquiries.",
    perks: ["Review your saved quotes", "Follow up your enquiries", "Keep your delivery details ready"],
    heading: "Sign in to your account",
    fine: AUTH_FINE(),
    body: `<form class="enq login-form" id="login-form" novalidate>
          ${formError}
          <div class="fld"><label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="username" maxlength="255" placeholder="you@example.com">${fieldError("email")}</div>
          ${passwordField("password", "Password", "current-password", `<a href="${withNext("/forgot-password")}">Forgot password?</a>`)}
          <button class="btn lg login-submit" type="submit">Sign in</button>
        </form>
        ${socialButtons("", "after")}
        <p class="login-alt">New to SURGICISS? <a href="${withNext("/sign-up")}">Create an account</a></p>`
  });
}
function signupPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err login-error" role="alert">${escapeHtml(message)}</p>` : "";
  const perks = ["Keep every quote and enquiry in one place", "Reuse your details on each new request"];
  if (Accounts.providers && Accounts.providers().length) perks.push("Or skip the form with Google or Facebook");
  return authSplit({
    title: "Create your account",
    lead: "Use an account only if you want a dashboard for your quotes and enquiries.",
    perks,
    heading: "Your details",
    fine: AUTH_FINE(),
    body: `<form class="enq login-form" id="signup-form" novalidate>
          ${formError}
          <div class="fields">
            <div class="fld"><label for="name">Full name <span class="req">*</span></label>
              <input id="name" name="name" autocomplete="name" maxlength="255">${fieldError("name")}</div>
            <div class="fld"><label for="email">Email address <span class="req">*</span></label>
              <input id="email" name="email" type="email" autocomplete="email" maxlength="255">${fieldError("email")}</div>
            ${passwordField("password", "Password", "new-password", "", true)}
            ${passwordField("confirm", "Confirm password", "new-password", "", true)}
            <div class="fld"><label for="organisation">Organisation</label>
              <input id="organisation" name="organisation" autocomplete="organization" maxlength="255"></div>
            <div class="fld"><label for="phone">Telephone</label>
              <input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="255"></div>
            ${Places.countryField("")}
            ${Places.cityField("", "")}
          </div>
          <button class="btn lg login-submit" type="submit">Create account</button>
        </form>
        ${socialButtons("", "after", "or sign up with")}
        <p class="login-alt">${"Already registered?"} <a href="${withNext("/login")}">Sign in</a></p>`
  });
}
function forgotPage() {
  if (state.forgotSent) {
    return authCard("Forgot password", "Check your email for the next step.", `<div class="done" role="status"><h2>Check your email.</h2>
      <p>If an account exists for that address, we have sent a link to choose a new password. The link works once and expires after one hour. This page does not reveal whether the address is on file.</p>
      <p style="margin-top:12px"><a href="${withNext("/login")}">Back to login</a></p></div>`);
  }
  const user = Accounts.current();
  const signedIn = user ? `<p class="muted" style="font-size:14px">You are already signed in. You can change the password from <a href="#/account/settings">Account settings</a>.</p>` : "";
  const formError = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  return authCard("Forgot password", "Tell us the email address on the account and we will email you a link to choose a new password.", `<form class="enq" id="forgot-form" novalidate>
    ${formError}
    ${signedIn}
    <div class="fld"><label for="email">Email address</label>
      <input id="email" name="email" type="email" autocomplete="email" maxlength="255"></div>
    <div><button class="btn lg" type="submit">Request reset</button></div>
    <p class="muted" style="font-size:14px"><a href="${withNext("/login")}">Back to login</a></p>
  </form>`);
}

function resetPage() {
  if (state.resetDone) {
    return authCard("Choose a new password", "Your password has been changed.", `<div class="done" role="status"><h2>Your password has been changed.</h2>
      <p>You can now log in with the new password. You have been signed out everywhere else.</p>
      <p style="margin-top:12px"><a class="btn" href="#/login">Login</a></p></div>`);
  }
  const formError = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  if (!currentQuery().get("token")) {
    return authCard("Choose a new password", "This link is incomplete.", `<div class="done"><p>Open the link from the reset email again, or <a href="#/forgot-password">request a new one</a>.</p></div>`);
  }
  return authCard("Choose a new password", "Enter a new password for your account.", `<form class="enq" id="reset-form" novalidate>
    ${formError}
    <div class="fld"><label for="password">New password</label>
      <input id="password" name="password" type="password" autocomplete="new-password" maxlength="128"></div>
    <div class="fld"><label for="confirm">Confirm new password</label>
      <input id="confirm" name="confirm" type="password" autocomplete="new-password" maxlength="128"></div>
    <div><button class="btn lg" type="submit">Save new password</button></div>
  </form>`);
}

const DASH_ICONS = {
  overview: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  orders: '<path d="m7.5 4.3 9 5.2"/><path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  quotes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  enquiries: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>'
};
const dashIcon = name => `<svg class="di" viewBox="0 0 24 24" aria-hidden="true">${DASH_ICONS[name]}</svg>`;
const avatarHtml = (user, size) => `<span class="avatar ${size}${user.avatar ? " has-photo" : ""}" aria-hidden="true">${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="">` : escapeHtml(initials(user.name))}</span>`;
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
function accountShell(title, body) {
  const user = Accounts.current() || {};
  const path = currentPath();
  const home = path === "/account";
  const first = String(user.name || "").trim().split(/\s+/)[0] || "there";
  const item = (hrefPath, label, icon) => `<a href="#${hrefPath}" class="${navOn(hrefPath, path) ? "active" : ""}"${navOn(hrefPath, path) ? ' aria-current="page"' : ""}>${dashIcon(icon)}<span>${label}</span></a>`;
  const eyebrow = home ? "Your account" : `<a href="#/account">Your account</a><span aria-hidden="true"> / </span>${escapeHtml(title)}`;
  const sub = [user.email, user.organisation].filter(Boolean).map(escapeHtml).join(" · ");
  return `<section class="dash-hero"><div class="wrap dash-hero-in">
      <span class="avatar-wrap">${avatarHtml(user, "lg")}<label class="avatar-cam" for="avatar-file" title="Upload a profile picture" aria-label="Upload a profile picture">${dashIcon("camera")}</label><input type="file" id="avatar-file" accept="image/png,image/jpeg,image/webp" hidden></span>
      <div class="dash-who"><p class="eyebrow">${eyebrow}</p><h1>${home ? `Welcome back, ${escapeHtml(first)}` : escapeHtml(title)}</h1><p class="sub">${sub}</p></div>
      <div class="dash-actions"><a class="btn light" href="#/generate-quote">${dashIcon("plus")}Generate quote</a><a class="btn ghost" href="#/contact-us">Ask a question</a></div>
    </div></section>
    <section class="wrap dash"><nav class="dash-nav" aria-label="Account">
      ${item("/account", "Overview", "overview")}
      ${item("/account/quotes", "My quotes", "quotes")}
      ${item("/account/enquiries", "My enquiries", "enquiries")}
      ${item("/account/orders", "My orders", "orders")}
      ${item("/account/profile", "My profile", "profile")}
      ${item("/account/profile/edit", "Edit profile", "edit")}
      ${item("/account/settings", "Account settings", "settings")}
      <button type="button" class="navitem" data-logout>${dashIcon("logout")}<span>Log out</span></button>
      <a class="navitem-danger" href="#/account/settings?delete=1">${dashIcon("trash")}<span>Delete account</span></a>
    </nav><div class="dash-main">${state.pictureError ? `<div class="note warn" role="alert" style="margin-bottom:16px"><p>${escapeHtml(state.pictureError)}</p></div>` : ""}${body}</div></section>`;
}
function navOn(hrefPath, path) {
  if (hrefPath === "/account") return path === "/account";
  if (hrefPath === "/account/profile") return path === "/account/profile";
  if (hrefPath === "/account/profile/edit") return path === "/account/profile/edit";
  return path === hrefPath || path.startsWith(hrefPath + "/");
}
function allActivity() {
  const user = Accounts.current();
  return [
    ...Records.quotesFor(user.id).map(q => ({kind: "quote", id: q.id, when: q.createdAt, href: `#/account/quotes/${encodeURIComponent(q.id)}`, icon: "quotes", title: `Quote request ${q.id}`, meta: `${q.lines.length} item${q.lines.length === 1 ? "" : "s"}`})),
    ...Records.enquiriesFor(user.id).map(n => ({kind: "enquiry", id: n.id, when: n.createdAt, href: `#/account/enquiries/${encodeURIComponent(n.id)}`, icon: "enquiries", title: n.subject || "Enquiry", meta: n.id}))
  ].sort((a, b) => String(b.when).localeCompare(String(a.when)));
}
// Message shown above the lists that have delete buttons: what happened, or why a delete did not go through.
const listMessage = () => (state.notice ? `<div class="note info" role="status" style="margin-bottom:16px"><p>${escapeHtml(state.notice)}</p></div>` : "")
  + (state.deleteError ? `<div class="note warn" role="alert" style="margin-bottom:16px"><p>${escapeHtml(state.deleteError)}</p></div>` : "");
const deleteControl = (kind, id) => (state.confirmDelete === kind + ":" + id
  ? `<span class="act-actions" role="group" aria-label="Confirm delete"><span class="act-ask">Delete this?</span><button type="button" class="act-yes" data-del-yes="${kind}:${escapeHtml(id)}">Yes, delete</button><button type="button" class="act-no" data-del-no>Keep</button></span>`
  : `<span class="act-actions"><button type="button" class="act-del" data-del="${kind}:${escapeHtml(id)}" aria-label="Delete ${escapeHtml(id)}">${dashIcon("trash")}<span>Delete</span></button></span>`);
const activityList = list => `<ul class="activity">${list.map(a => `<li><a href="${a.href}"><span class="act-ico">${dashIcon(a.icon)}</span><span class="act-text"><b>${escapeHtml(a.title)}</b><small>${escapeHtml(a.meta)} · ${escapeHtml(formatWhen(a.when))}</small></span><span class="pill ok">Received</span></a>${deleteControl(a.kind, a.id)}</li>`).join("")}</ul>`;
function accountHome() {
  const user = Accounts.current();
  const quotes = Records.quotesFor(user.id);
  const enquiries = Records.enquiriesFor(user.id);
  const notice = listMessage();
  const activity = allActivity();
  const activityHtml = activity.length
    ? `<div class="act-scroll">${activityList(activity)}</div>`
    : `<div class="act-empty"><p><b>No activity yet</b></p><p>Quote requests and enquiries you send while signed in will appear here.</p><p><a class="btn" href="#/generate-quote">Generate a quote</a></p></div>`;
  const where = [user.city, user.country].filter(Boolean).map(escapeHtml).join(", ");
  const row = (icon, label, value) => `<li>${dashIcon(icon)}<span><small>${label}</small>${value ? escapeHtml(value) : '<em>Not provided</em>'}</span></li>`;
  return accountShell("Your account", `${notice}
    <div class="statgrid dash-stats">
      <a class="stat" href="#/account/quotes"><span class="stat-ico">${dashIcon("quotes")}</span><b>${quotes.length}</b><span class="stat-label">Quote requests</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
      <a class="stat" href="#/account/enquiries"><span class="stat-ico">${dashIcon("enquiries")}</span><b>${enquiries.length}</b><span class="stat-label">Enquiries</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
      <a class="stat" href="#/account/orders"><span class="stat-ico">${dashIcon("orders")}</span><b>${activity.length}</b><span class="stat-label">Orders</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
    </div>
    <div class="dash-cols">
      <div class="box dash-card"><div class="card-head"><h2 class="h-sec">Recent activity</h2><span class="count-badge">${activity.length}</span></div>${activityHtml}</div>
      <div class="box dash-card"><div class="card-head"><h2 class="h-sec">Your details</h2><a class="tlink" href="#/account/profile/edit">Edit</a></div>
        <ul class="detail-list">
          ${row("profile", "Name", user.name)}${row("quotes", "Organisation", user.organisation)}${row("pin", "Location", where)}${row("phone", "Telephone", user.phone)}
        </ul>
        <p class="dash-email">${escapeHtml(user.email)}</p>
      </div>
    </div>`);
}
function profileList(user) {
  const row = (label, value) => `<div><dt>${label}</dt><dd>${escapeHtml(value || "Not provided")}</dd></div>`;
  return `<dl class="kv">${row("Name", user.name)}${row("Email", user.email)}${row("Telephone", user.phone)}${row("Organisation", user.organisation)}${row("Country", user.country)}${row("City", user.city)}${row("Usual delivery location", user.deliveryLocation)}${row("Account created", formatWhen(user.createdAt))}</dl>`;
}
function accountProfile() {
  const user = Accounts.current();
  return accountShell("My profile", `<div class="box"><h2 class="h-sec">Profile</h2>
    <p class="muted" style="margin-top:8px;font-size:14px">The email address is the sign-in name and cannot be changed here.</p>${profileList(user)}<a class="btn" href="#/account/profile/edit" style="margin-top:16px">Edit profile</a></div>`);
}
function accountEdit() {
  const user = Accounts.current();
  const notice = state.notice ? `<div class="note info" role="status"><p>${escapeHtml(state.notice)}</p></div>` : "";
  const error = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  const photo = `<div class="photo-card"><div class="photo-preview">${avatarHtml(user, "xl")}</div><div class="photo-text"><h2 class="h-sec">Profile picture</h2><p class="muted">JPEG, PNG or WebP. The picture is resized to fit and stored with your account.</p><div class="photo-actions"><label class="btn" for="avatar-file" role="button" tabindex="0">${dashIcon("camera")}${user.avatar ? "Change picture" : "Upload picture"}</label>${user.avatar ? `<button type="button" class="btn line" data-avatar-remove>Remove picture</button>` : ""}</div></div></div>`;
  return accountShell("Edit profile", `${notice}${error}${photo}<form class="enq" id="profile-form" novalidate>
    <div class="fields">
      <div class="fld"><label for="name">Full name <span class="req">*</span></label>
      <input id="name" name="name" maxlength="255" autocomplete="name" value="${escapeHtml(user.name)}">${fieldError("name")}</div>
      <div class="fld"><label for="email">Email address</label>
        <input id="email" name="email" value="${escapeHtml(user.email)}" disabled><p class="muted" style="margin-top:6px;font-size:12px">Used to sign in.</p>
        </div>
      <div class="fld"><label for="phone">Telephone</label>
        <input id="phone" name="phone" maxlength="255" autocomplete="tel" value="${escapeHtml(user.phone)}"></div>
      <div class="fld"><label for="organisation">Organisation</label>
        <input id="organisation" name="organisation" maxlength="255" autocomplete="organization" value="${escapeHtml(user.organisation)}"></div>
      ${Places.countryField(user.country)}
      ${Places.cityField(user.country, user.city)}
    </div>
    <div class="fld"><label for="deliveryLocation">Usual delivery location</label><textarea id="deliveryLocation" name="deliveryLocation" rows="3" maxlength="500">${escapeHtml(user.deliveryLocation)}</textarea></div>
    <div><button class="btn lg" type="submit">Save profile</button></div>
  </form>`);
}
function accountOrders() {
  const notice = listMessage();
  const list = allActivity();
  if (!list.length) {
    return accountShell("My orders", `${notice}<div class="empty"><h2>No orders yet</h2>
      <p>Quote requests and enquiries you send while signed in are listed here.</p>
      <p style="margin-top:16px"><a class="btn" href="#/generate-quote">Generate quote</a></p>
      </div>`);
  }
  return accountShell("My orders", `${notice}<div class="box dash-card"><div class="card-head"><h2 class="h-sec">All orders</h2><span class="count-badge">${list.length}</span></div>${activityList(list)}</div>`);
}
function accountQuotes() {
  const user = Accounts.current();
  const list = Records.quotesFor(user.id);
  if (!list.length) {
    return accountShell("My quotes", `<div class="empty"><h2>${"No quotes yet"}</h2>
      <p>When you generate a quote while signed in — or later sign in with the same email address — the request appears here. Nothing is shown unless you actually submitted it.</p>
      <p style="margin-top:16px"><a class="btn" href="#/generate-quote">Generate quote</a></p>
      </div>`);
  }
  const rows = list.map(item => `<li><div class="listhead"><a href="#/account/quotes/${encodeURIComponent(item.id)}">${escapeHtml(item.id)}</a>${statusPill(item)}${deleteControl("quote", item.id)}</div><p>${escapeHtml(formatWhen(item.createdAt))} · ${item.lines.length} item${item.lines.length === 1 ? "" : "s"} · ${escapeHtml(item.lines.map(line => line.name).join(", "))}</p></li>`).join("");
  return accountShell("My quotes", `${listMessage()}<ul class="rec-list">${rows}</ul>`);
}
function accountQuoteDetail(id) {
  const user = Accounts.current();
  const record = Records.visibleQuote(decodeURIComponent(id), user.id);
  if (!record || record.userId !== user.id) return accountShell("Quote request", `<div class="empty"><h2>That quote is not on this account</h2>
    <p>${"It may belong to another account, or the reference may be wrong."}</p>
    </div>`);
  return accountShell("Quote request", `${quoteSummary(record)}<p style="margin-top:16px"><button type="button" class="btn" data-download="${escapeHtml(record.id)}">Download a copy</button></p>`);
}
function accountEnquiries() {
  const user = Accounts.current();
  const list = Records.enquiriesFor(user.id);
  if (!list.length) {
    return accountShell("My enquiries", `<div class="empty"><h2>${"No enquiries yet"}</h2>
      <p>Questions you send while signed in, or with the same email address, are listed here after you submit the contact form. The list does not mean SURGICISS has replied.</p>
      <p style="margin-top:16px"><a class="btn" href="#/contact-us">Ask a question</a></p>
      </div>`);
  }
  const rows = list.map(item => `<li><div class="listhead"><a href="#/account/enquiries/${encodeURIComponent(item.id)}">${escapeHtml(item.subject || "Enquiry")}</a>${statusPill(item)}${deleteControl("enquiry", item.id)}</div><p>${escapeHtml(item.id)} · ${escapeHtml(formatWhen(item.createdAt))}</p></li>`).join("");
  return accountShell("My enquiries", `${listMessage()}<ul class="rec-list">${rows}</ul>`);
}
function accountEnquiryDetail(id) {
  const user = Accounts.current();
  const record = Records.visibleEnquiry(decodeURIComponent(id), user.id);
  if (!record || record.userId !== user.id) return accountShell("Enquiry", `<div class="empty"><h2>That enquiry is not on this account</h2>
    <p>${"It may belong to another account, or the reference may be wrong."}</p>
    </div>`);
  return accountShell("Enquiry", `<div class="box"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h2 class="h-sec">${escapeHtml(record.subject || "Enquiry")}</h2>${statusPill(record)}</div>
    <p class="muted" style="margin-top:8px;font-size:14px">${escapeHtml(record.id)} · ${escapeHtml(formatWhen(record.createdAt))}</p>
    <p style="margin-top:12px">${escapeHtml(deliveryCopy(record))}</p>
    <dl class="kv"><div><dt>Relates to</dt><dd>${escapeHtml(record.interest || "Not given")}</dd></div><div><dt>Message</dt><dd>${escapeHtml(record.message || "")}</dd></div><div><dt>Contact</dt><dd>${escapeHtml(record.contact.name)} · ${escapeHtml(record.contact.email)}</dd></div><div><dt>Organisation</dt><dd>${escapeHtml(record.contact.organisation || "Not given")}</dd></div><div><dt>Telephone</dt><dd>${escapeHtml(record.contact.phone || "Not given")}</dd></div><div><dt>Preferred contact</dt><dd>${escapeHtml(record.contact.preferredContact || "Email")}</dd></div></dl></div>`);
}
function accountSettings() {
  if (currentQuery().get("delete")) setTimeout(() => {
    const form = document.getElementById("delete-form");
    if (!form) return;
    form.scrollIntoView({behavior: "smooth", block: "center"});
    const field = form.querySelector("input");
    if (field) field.focus({preventScroll: true});
  }, 60);
  const notice = state.notice ? `<div class="note info" role="status"><p>${escapeHtml(state.notice)}</p></div>` : "";
  const error = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  const user = Accounts.current();
  const noPassword = Boolean(user && user.hasPassword === false);
  const passwordSection = noPassword
    ? `<section><h2 class="h-sec">Password</h2>
      <p class="muted" style="font-size:14px">You sign in with Google or Facebook, so this account has no password. If you would also like to sign in with an email and password, <a href="#/forgot-password">request a link to set one</a>.</p></section>`
    : `<form class="enq" id="password-form" novalidate>
      <h2 class="h-sec">Change password</h2>
      <p class="muted" style="font-size:14px">${"Changing your password signs you out on your other devices."}</p>
      <div class="fld"><label for="currentPassword">Current password</label>
    <input id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" maxlength="128"></div>
      <div class="fields">
        <div class="fld"><label for="nextPassword">New password</label>
    <input id="nextPassword" name="nextPassword" type="password" autocomplete="new-password" maxlength="128"></div>
        <div class="fld"><label for="confirmPassword">Confirm new password</label>
    <input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" maxlength="128"></div>
      </div>
      <div><button class="btn lg" type="submit">Update password</button></div>
    </form>`;
  return accountShell("Account settings", `${notice}${error}
    ${passwordSection}
    <form class="enq" id="delete-form" novalidate style="margin-top:32px">
      <h2 class="h-sec">${"Delete account"}</h2>
      <p class="muted" style="font-size:14px">${"This permanently deletes your account and the quotes and enquiries filed under it. Requests you sent without signing in are not affected. This cannot be undone."}</p>
      ${noPassword
    ? `<div class="fld"><label for="confirmText">Type DELETE to confirm</label>
    <input id="confirmText" name="confirmText" autocomplete="off" maxlength="20"></div>`
    : `<div class="fld"><label for="deletePassword">Password</label>
    <input id="deletePassword" name="password" type="password" autocomplete="current-password" maxlength="128"></div>`}
      <label class="check"><input type="checkbox" name="confirmDelete" value="yes"> ${"I understand this cannot be undone."}</label>
      ${state.deleteError ? `<p class="err" role="alert">${escapeHtml(state.deleteError)}</p>` : ""}
      <div><button class="btn danger" type="submit">${dashIcon("trash")}Delete account</button></div>
    </form>`);
}

function gatedPath() {
  let path = currentPath();
  if (path.startsWith("/account") && !Accounts.current()) {
    history.replaceState(null, "", "#/login?next=" + encodeURIComponent(path));
    path = "/login";
  }
  if ((path === "/login" || path === "/sign-up") && Accounts.current()) {
    const next = safeNext(currentQuery().get("next") || "/account");
    history.replaceState(null, "", "#" + next);
    path = next.split("?")[0];
  }
  return path;
}
function accountView(path) {
  const parts = path.split("/").filter(Boolean);
  if (path === "/login") return loginPage();
  if (path === "/sign-up") return signupPage();
  if (path === "/forgot-password") return forgotPage();
  if (path === "/reset-password") return resetPage();
  if (!path.startsWith("/account")) return null;
  if (!Accounts.current()) return loginPage();
  if (path === "/account") return accountHome();
  if (path === "/account/profile") return accountProfile();
  if (path === "/account/profile/edit") return accountEdit();
  if (path === "/account/orders") return accountOrders();
  if (path === "/account/quotes") return accountQuotes();
  if (path === "/account/enquiries") return accountEnquiries();
  if (path === "/account/settings") return accountSettings();
  if (parts[0] === "account" && parts[1] === "quotes" && parts[2]) return accountQuoteDetail(parts[2]);
  if (parts[0] === "account" && parts[1] === "enquiries" && parts[2]) return accountEnquiryDetail(parts[2]);
  return null;
}
function accountTitle(path) {
  const titles = {
    "/login": "Login — SURGICISS LTD",
    "/sign-up": "Create account — SURGICISS LTD",
    "/forgot-password": "Forgot password — SURGICISS LTD",
    "/reset-password": "Choose a new password — SURGICISS LTD",
    "/account": "Your account — SURGICISS LTD",
    "/account/profile": "My profile — SURGICISS LTD",
    "/account/profile/edit": "Edit profile — SURGICISS LTD",
    "/account/orders": "My orders — SURGICISS LTD",
    "/account/quotes": "My quotes — SURGICISS LTD",
    "/account/enquiries": "My enquiries — SURGICISS LTD",
    "/account/settings": "Account settings — SURGICISS LTD"
  };
  if (titles[path]) return titles[path];
  if (path.startsWith("/account/quotes/")) return "Quote request — SURGICISS LTD";
  if (path.startsWith("/account/enquiries/")) return "Enquiry — SURGICISS LTD";
  return "Account — SURGICISS LTD";
}

function restoreEnquiry(values) {
  Object.entries(values).forEach(([key, value]) => {
    const fields = document.querySelectorAll(`#enquiry [name="${key}"]`);
    fields.forEach(field => {
      if (field.type === "radio") field.checked = field.value === value;
      else field.value = value;
    });
  });
}
async function handleEnquirySubmit(event) {
  const form = event.target;
  if (form.dataset.busy === "1") return;
  const values = Object.fromEntries(new FormData(form).entries());
  const errors = validate(values);
  if (Object.keys(errors).length) {
    state.errors = errors;
    state.submitted = false;
    rerenderKeepScroll(pages.contact());
    restoreEnquiry(values);
    const first = document.querySelector("#enquiry .err");
    if (first) {
      const input = first.closest(".fld").querySelector("input,select,textarea");
      if (input) input.focus();
    }
    return;
  }
  form.dataset.busy = "1";
  const user = Accounts.current();
  const record = {
    id: Records.stamp("E"),
    createdAt: new Date().toISOString(),
    userId: user ? user.id : null,
    subject: String(values.subject || "").trim(),
    message: String(values.message || "").trim(),
    interest: String(values.interest || "").trim(),
    contact: {
      name: String(values.name || "").trim(),
      email: String(values.email || "").trim(),
      phone: String(values.phone || "").trim(),
      organisation: String(values.organisation || "").trim(),
      country: String(values.country || "").trim(),
      city: String(values.city || "").trim(),
      preferredContact: values.preferredContact || "Email"
    },
    delivered: false,
    deliveryError: false
  };
  const result = await Records.deliver("enquiry", record);
  form.dataset.busy = "";
  if (!result.delivered) {
    state.errors = {form: result.error || "We could not send your enquiry. Please try again."};
    state.submitted = false;
    rerenderKeepScroll(pages.contact());
    restoreEnquiry(values);
    return;
  }
  state.errors = {};
  state.submitted = true;
  state.submitResult = {delivered: true, id: result.id || record.id};
  route();
}

async function submitQuote(form) {
  if (form.dataset.busy === "1") return;
  const model = readQuoteForm(form);
  const errors = validateQuote(model);
  state.quoteHold = model;
  state.errors = errors;
  if (Object.keys(errors).length) {
    state.submitted = false;
    rerenderKeepScroll(pages.quote());
    const first = document.querySelector("#quote-form .err");
    if (first) {
      const box = first.closest(".fld, .line-row");
      const input = box && box.querySelector("input,select,textarea");
      if (input) input.focus();
    }
    return;
  }
  form.dataset.busy = "1";
  const user = Accounts.current();
  const fields = model.fields;
  const record = {
    id: Records.stamp("Q"),
    createdAt: new Date().toISOString(),
    userId: user ? user.id : null,
    lines: model.lines.map(line => ({
      ref: line.ref,
      name: refLabel(line.ref),
      quantity: Number(line.qty),
      note: String(line.note || "").trim()
    })),
    contact: {
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      organisation: fields.organisation.trim(),
      country: fields.country.trim(),
      city: fields.city.trim(),
      deliveryLocation: fields.delivery.trim(),
      preferredContact: fields.preferredContact || "Email"
    },
    requirements: String(fields.requirements || "").trim(),
    delivered: false,
    deliveryError: false
  };
  const result = await Records.deliver("quote", record);
  form.dataset.busy = "";
  if (!result.delivered) {
    state.errors = {form: result.error || "We could not send your quote request. Please try again."};
    state.submitted = false;
    rerenderKeepScroll(pages.quote());
    return;
  }
  record.delivered = true;
  record.id = result.id || record.id;
  Records.remember(record);
  state.quoteHold = null;
  state.quoteDraft = null;
  state.errors = {};
  state.submitted = true;
  state.lastQuoteId = record.id;
  route();
}

function downloadQuote(id) {
  const user = Accounts.current();
  const record = Records.visibleQuote(id, user && user.id);
  if (!record) return;
  const blob = new Blob([quoteText(record)], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = record.id + ".txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function snapshotInputs() {
  const root = document.getElementById("main");
  if (!root) return [];
  return [...root.querySelectorAll("input, select, textarea")].filter(el => !el.disabled).map(el => ({
    id: el.id, type: el.type, value: el.value, checked: el.checked
  }));
}
function restoreInputs(saved) {
  saved.forEach(item => {
    if (!item.id) return;
    const el = document.getElementById(item.id);
    if (!el || el.disabled) return;
    if (item.type === "radio" || item.type === "checkbox") el.checked = item.checked;
    else el.value = item.value;
  });
}
function installCustomer() {
  const baseRoute = route;
  const baseRerender = rerenderKeepScroll;
  const baseRender = render;
  header = customerHeader;
  pages.quote = quotePage;
  rerenderKeepScroll = function(main) {
    const saved = main === undefined ? snapshotInputs() : null;
    if (main === undefined) {
      const form = document.getElementById("quote-form");
      if (form) {
        state.quoteHold = readQuoteForm(form);
        const path = currentPath();
        if (path === "/generate-quote" || path === "/request-quote") main = pages.quote();
      }
    }
    const restore = saved && main === undefined;
    baseRerender(main);
    if (restore) restoreInputs(saved);
  };
  render = function(main) {
    let flash = "";
    try {
      flash = sessionStorage.getItem("surgiciss-flash") || "";
      if (flash) sessionStorage.removeItem("surgiciss-flash");
    } catch (err) { /* ignore */}
    if (flash && main !== undefined) {
      main = `<div class="wrap flashwrap"><div class="note info" role="status">${escapeHtml(flash)}</div></div>` + main;
    }
    baseRender(main);
  };
  route = function() {
    const path = gatedPath();
    const html = accountView(path);
    if (html != null) {
      document.title = accountTitle(path);
      state.menu = null;
      state.mobile = false;
      render(html);
      return;
    }
    baseRoute();
  };

  const refreshAccount = () => rerenderKeepScroll(accountView(currentPath()));
  document.addEventListener("click", async event => {
    const del = event.target.closest("[data-del]");
    const delYes = event.target.closest("[data-del-yes]");
    const delNo = event.target.closest("[data-del-no]");
    const removePhoto = event.target.closest("[data-avatar-remove]");
    if (del) {state.confirmDelete = del.dataset.del; state.notice = ""; state.deleteError = ""; refreshAccount(); return;}
    if (delNo) {state.confirmDelete = null; refreshAccount(); return;}
    if (delYes) {
      const [kind, ...rest] = delYes.dataset.delYes.split(":");
      let result;
      try {
        result = typeof Records.remove === "function"
          ? await Records.remove(kind, rest.join(":"))
          : {ok: false, error: "This page is out of date. Please refresh it (Ctrl+F5) and try again."};
      } catch (err) {
        result = {ok: false, error: "The item could not be deleted. Please try again."};
      }
      state.confirmDelete = null;
      state.notice = result.ok ? "Deleted. The list and the orders count are up to date." : "";
      state.deleteError = result.ok ? "" : (result.status === 404 || result.error === "Not found."
        ? "That item could not be deleted. Please try again in a little while."
        : (result.error || "The item could not be deleted. Please try again."));
      refreshAccount();
      return;
    }
    if (removePhoto) {
      const result = await Accounts.removeAvatar();
      state.notice = result.ok ? "Your profile picture has been removed." : "";
      state.pictureError = result.ok ? "" : pictureProblem(result.error);
      refreshAccount();
      return;
    }
    const add = event.target.closest("#add-line");
    const remove = event.target.closest("[data-remove-line]");
    const download = event.target.closest("[data-download]");
    const logout = event.target.closest("[data-logout]");
    const reveal = event.target.closest("[data-toggle-password]");
    if (reveal) {
      const input = reveal.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      reveal.innerHTML = show ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.7 10.7 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.1-5.9M9.9 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/></svg>` : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
      reveal.setAttribute("aria-label", show ? "Hide password" : "Show password");
      reveal.setAttribute("aria-pressed", show ? "true" : "false");
      return;
    }
    if (add) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      state.quoteHold.lines.push({ref: "", qty: "1", note: ""});
      rerenderKeepScroll(pages.quote());
    } else if (remove && !remove.disabled) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      const index = Number(remove.dataset.removeLine);
      if (state.quoteHold.lines.length > 1) state.quoteHold.lines.splice(index, 1);
      rerenderKeepScroll(pages.quote());
    } else if (download) {
      downloadQuote(download.dataset.download);
    } else if (logout) {
      Accounts.logout();
      location.hash = "#/";
    }
  });

  document.addEventListener("input", event => {
    const form = event.target.closest("#quote-form");
    if (!form) return;
    state.quoteHold = readQuoteForm(form);
  });

  document.addEventListener("submit", event => {
    const id = event.target.id;
    if (id === "quote-form") submitQuote(event.target);
    else if (id === "login-form") submitLogin(event.target);
    else if (id === "signup-form") submitSignup(event.target);
    else if (id === "forgot-form") submitForgot(event.target);
    else if (id === "reset-form") submitReset(event.target);
    else if (id === "profile-form") submitProfile(event.target);
    else if (id === "password-form") submitPassword(event.target);
    else if (id === "delete-form") submitDelete(event.target);
  });
}

async function submitLogin(form) {
  if (form.dataset.busy === "1") return;
  form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.login(data.email || "", data.password || "");
  form.dataset.busy = "";
  if (!result.ok) {
    state.authError = result.error;
    rerenderKeepScroll(loginPage());
    const email = document.querySelector("#login-form [name=email]");
    if (email) {email.value = data.email || ""; email.focus();}
    return;
  }
  state.authError = "";
  goNext("/account");
}
async function submitSignup(form) {
  if (form.dataset.busy === "1") return;
  form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.register(data);
  form.dataset.busy = "";
  if (!result.ok) {
    state.authError = result.error;
    rerenderKeepScroll(signupPage());
    ["name", "email", "organisation", "phone", "country"].forEach(key => {
      const input = document.querySelector(`#signup-form [name=${key}]`);
      if (input) input.value = data[key] || "";
    });
    return;
  }
  state.authError = "";
  goNext("/account");
}
async function submitForgot(form) {
  if (form.dataset.busy === "1") return;
  const email = String((form.elements.email && form.elements.email.value) || "").trim();
  state.errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    state.authError = "Please enter the email address on the account.";
    rerenderKeepScroll(forgotPage());
    return;
  }
  form.dataset.busy = "1";
  const result = await Accounts.forgot(email);
  form.dataset.busy = "";
  state.authError = result.ok ? "" : result.error;
  state.forgotSent = result.ok;
  rerenderKeepScroll(forgotPage());
}
async function submitReset(form) {
  if (form.dataset.busy === "1") return;
  const data = Object.fromEntries(new FormData(form).entries());
  form.dataset.busy = "1";
  const result = await Accounts.resetPassword(currentQuery().get("token") || "", data.password || "", data.confirm || "");
  form.dataset.busy = "";
  state.authError = result.ok ? "" : result.error;
  state.resetDone = result.ok;
  rerenderKeepScroll(resetPage());
}
async function submitProfile(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.updateProfile(data);
  if (!result.ok) {
    state.authError = result.error;
    state.notice = "";
  } else {
    state.authError = "";
    state.notice = "Your profile has been updated.";
  }
  rerenderKeepScroll(accountEdit());
}
async function submitPassword(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.changePassword(data.currentPassword, data.nextPassword, data.confirmPassword);
  state.notice = result.ok ? "Your password has been updated." : "";
  state.authError = result.ok ? "" : result.error;
  rerenderKeepScroll(accountSettings());
}
async function submitDelete(form) {
  if (form.dataset.busy === "1") return;
  const data = Object.fromEntries(new FormData(form).entries());
  // Shows why the account was not deleted next to the button, where the person is looking.
  const refuse = message => {
    state.deleteError = message;
    state.notice = "";
    rerenderKeepScroll(accountSettings());
    const box = document.getElementById("delete-form");
    if (box) box.scrollIntoView({block: "center"});
  };
  state.deleteError = "";
  if (data.confirmDelete !== "yes") return refuse("Tick the box to confirm you want the account removed.");
  form.dataset.busy = "1";
  let result;
  try {
    result = await Accounts.removeAccount(data.password || "", data.confirmText || "");
  } catch (err) {
    result = {ok: false, error: "The account could not be deleted. Please try again."};
  }
  form.dataset.busy = "";
  if (!result.ok) return refuse(result.error || "The account could not be deleted. Please try again.");
  try {sessionStorage.setItem("surgiciss-flash", "Your account has been removed. You are back on the public site.");}
  catch (err) { /* ignore */}
  location.hash = "#/";
}

// Profile picture: the chosen file is cropped to a square and shrunk in the page before it is sent to the server.
function pictureToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256, side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {URL.revokeObjectURL(url); reject(new Error("unreadable"));};
    img.src = url;
  });
}
// Server messages that are meant for the customer are shown as they are; anything technical becomes a plain sentence.
const pictureProblem = text => (/^(Please|That file|That picture|Too many)/.test(String(text || ""))
  ? text
  : "The picture could not be saved right now. Please try again in a little while.");
document.addEventListener("change", async event => {
  const input = event.target.closest && event.target.closest("#avatar-file");
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = "";
  state.notice = ""; state.authError = ""; state.pictureError = "";
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) state.pictureError = "Please choose a JPEG, PNG or WebP picture.";
  else if (file.size > 10 * 1024 * 1024) state.pictureError = "That picture is larger than 10 MB. Please choose a smaller one.";
  else {
    try {
      const result = await Accounts.setAvatar(await pictureToDataUrl(file));
      if (result.ok) state.notice = "Your profile picture has been updated."; else state.pictureError = pictureProblem(result.error);
    } catch (err) {
      state.pictureError = "That file could not be read as a picture. Please choose another.";
    }
  }
  rerenderKeepScroll(accountView(currentPath()));
  window.scrollTo({top: 0, behavior: "smooth"});
});
document.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches && event.target.matches("label[for=avatar-file]")) {
    event.preventDefault();
    const input = document.getElementById("avatar-file");
    if (input) input.click();
  }
});
