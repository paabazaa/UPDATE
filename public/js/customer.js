// Secure customer accounts, quote builder and enquiry delivery.
// All accounts are stored securely in MySQL database with encrypted passwords.

function onBeforeRoute() {
  const form = document.getElementById("quote-form");
  if (form) {
    state.quoteHold = readQuoteForm(form);
    Records.saveDraft(state.quoteHold);
  }
  state.quoteHold = null;
  state.notice = "";
  state.authError = "";
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
  return `<div class="note info"><p><strong>Accounts are secure.</strong> Your account is stored securely in our database with encrypted passwords. You can read every public page without one, but an account lets you track your quotes and enquiries from any device. SURGICISS protects your data.</p>
    </div>`;
}
function deliveryCopy(record) {
  if (record.delivered) return "This request was accepted by the submission service.";
  if (record.deliveryError) return "The server could not be reached or did not accept this request, so SURGICISS has not received it. Please try again later or use the contact page.";
  return "This request has been saved. It will be sent to SURGICISS shortly.";
}
function statusPill(record) {
  if (record.delivered) return `<span class="pill ok">Sent</span>`;
  if (record.deliveryError) return `<span class="pill bad">Not delivered</span>`;
  return `<span class="pill wait">Not sent</span>`;
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
  const draft = Records.loadDraft();
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
    "Status: " + (record.delivered ? "Accepted by the submission service" : "Saved in database"),
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
    ? `<p class="muted">You are signed in as ${escapeHtml(user.email)}. This request will be filed under My quotes.</p>`
    : `<p class="muted">You can prepare this request without an account. <a class="js-save-draft" href="#/login?next=${encodeURIComponent("/generate-quote")}">Log in</a> or <a class="js-save-draft" href="#/sign-up?next=${encodeURIComponent("/generate-quote")}">create an account</a> if you want it kept under My quotes. Your selections stay in place while you do that.</p>`;
  return banner("Generate a quote", [{label: "Generate a quote"}], "Choose the items and quantities you want priced. Nothing on this page is an order, and prices are not shown because each request is quoted on its own.")
    + `<section class="wrap sec"><div class="two quote"><div>
      <div class="note info"><p>Browsing the catalogue does not need an account. Saving the request against your name, and seeing it again under My quotes, does. Submitting the form does not place an order.</p>
      </div>
      <div style="margin-top:16px">${accountNote}</div>
      <form class="enq" id="quote-form" novalidate style="margin-top:20px">
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
          <li>Where a submission service is connected, the request is sent and you are told.</li>
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
    : `<p><a href="#/sign-up?next=${encodeURIComponent("/account/quotes")}">Create an account</a> with ${escapeHtml(record.contact.email)} to keep your future requests together under My quotes.</p>`;
  return banner("Quote request", [{label: "Generate a quote"}], "Keep the reference. A request is not an order.")
    + `<section class="wrap narrow sec"><div class="done" role="status"><h2>${record.delivered ? "Your quote request was sent." : "Your quote request is saved."}</h2><p>${escapeHtml(deliveryCopy(record))}</p><p>Reference <strong>${escapeHtml(record.id)}</strong>.</p>${filing}<div class="row" style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap"><button type="button" class="btn" data-download="${escapeHtml(record.id)}">Download a copy</button><button type="button" class="btn line" id="again">Prepare another</button></div>
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
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const softwareLinks = software.map(item => ({label: item.name, to: "/software/" + item.slug}));
  const productLinks = products.map(item => ({label: item.name, to: "/products/" + item.slug}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const user = Accounts.current();
  const accountDesktop = user
    ? `<a class="tl acct desk-only" href="#/account">My account</a><button type="button" class="tl acct desk-only" data-logout>Log out</button>`
    : `<a class="tl acct desk-only${act("/login")}" href="#/login">Login</a><a class="tl acct desk-only${act("/sign-up")}" href="#/sign-up">Create account</a>`;
  const accountMobile = user
    ? `<a href="#/account">My account</a><a href="#/account/quotes">My quotes</a><a href="#/account/enquiries">My enquiries</a><a href="#/account/orders">My orders</a><button type="button" class="linkish" data-logout>Log out</button>`
    : `<a href="#/login">Login</a><a href="#/sign-up">Create account</a>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="#/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="1520" height="384" decoding="async"></a>
    <div class="htools">
      <a class="btn desk-only" href="#/generate-quote">Generate quote</a>
      ${accountDesktop}
      <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav">${state.mobile ? icons.close : icons.menu}Menu</button>
      ${themeButton()}
    </div>
  </div>
  <div class="navrow"><nav class="main" aria-label="Main navigation">
      <a class="tl${act("/")}" href="#/">Home</a>
      ${dd("software", "Software", softwareLinks, "/software", "All Software")}
      ${dd("products", "Products", productLinks, "/products", "All Products")}
      <a class="tl${act("/count-sheet-holders")}" href="#/count-sheet-holders">Instrument Count Sheet Holders</a>
      <a class="tl${act("/contact-us")}" href="#/contact-us">Contact Us</a>
    </nav>
        </div>
    <div class="mobile-cta"><a href="#/generate-quote">Generate quote</a><a href="#/contact-us">Ask a question</a></div>
    ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a href="#/">Home</a>${mgroup("Software", softwareLinks, "/software", "All Software")}${mgroup("Products", productLinks, "/products", "All Products")}<a href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a href="#/services">Services</a><a href="#/programmes">Programmes</a><a href="#/about">About</a><a href="#/contact-us">Contact Us</a>${accountMobile}<a class="quote" href="#/generate-quote">Generate quote</a><a class="ask" href="#/contact-us">Ask a question</a></nav>
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
function socialButtons(intro = "") {
  const providers = Accounts.providers ? Accounts.providers() : [];
  if (!providers.length) return "";
  const next = safeNext(currentQuery().get("next") || "/account");
  const links = providers.filter(name => SOCIAL[name]).map(name =>
    `<a class="btn line social" href="${escapeHtml(Api.base)}/api/auth/oauth/${name}/start?next=${encodeURIComponent(next)}">${SOCIAL[name].icon}<span>Continue with ${SOCIAL[name].label}</span></a>`
  ).join("");
  return `<div class="social-block">${intro ? `<p class="muted" style="font-size:14px">${intro}</p>` : ""}<div class="social-list">${links}</div><p class="or"><span>or use your email</span></p></div>`;
}
function socialError() {
  return SOCIAL_ERRORS[currentQuery().get("error")] || "";
}
function loginPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err" role="alert">${escapeHtml(message)}</p>` : "";
  return authCard("Login", "Sign in to open your dashboard, quotes and enquiries.", `${socialButtons()}<form class="enq" id="login-form" novalidate>
    ${formError}
    <div class="fld"><label for="email">Email address</label>
      <input id="email" name="email" type="email" autocomplete="username" maxlength="255">${fieldError("email")}</div>
    <div class="fld"><label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" maxlength="128">${fieldError("password")}</div>
    <div><button class="btn lg" type="submit">Login</button></div>
    <p class="muted" style="font-size:14px"><a href="${withNext("/forgot-password")}">Forgot password</a> · <a href="${withNext("/sign-up")}">Create account</a></p>
  </form>`);
}
function signupPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err" role="alert">${escapeHtml(message)}</p>` : "";
  return authCard("Create account", "Use an account only if you want a dashboard for your quotes and enquiries.", `${socialButtons("Already have a Google or Facebook account? Continue with it. There is nothing to fill in and no new password to remember.")}<form class="enq" id="signup-form" novalidate>
    ${formError}
    <div class="fields">
      <div class="fld"><label for="name">Full name <span class="req">*</span></label>
      <input id="name" name="name" autocomplete="name" maxlength="255">${fieldError("name")}</div>
      <div class="fld"><label for="email">Email address <span class="req">*</span></label>
        <input id="email" name="email" type="email" autocomplete="email" maxlength="255">${fieldError("email")}</div>
      <div class="fld"><label for="password">Password <span class="req">*</span></label>
        <input id="password" name="password" type="password" autocomplete="new-password" maxlength="128">${fieldError("password")}</div>
      <div class="fld"><label for="confirm">Confirm password <span class="req">*</span></label>
        <input id="confirm" name="confirm" type="password" autocomplete="new-password" maxlength="128">${fieldError("confirm")}</div>
      <div class="fld"><label for="organisation">Organisation</label>
        <input id="organisation" name="organisation" autocomplete="organization" maxlength="255"></div>
      <div class="fld"><label for="phone">Telephone</label>
        <input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="255"></div>
      ${Places.countryField("")}
      ${Places.cityField("", "")}
    </div>
    <div><button class="btn lg" type="submit">Create account</button></div>
    <p class="muted" style="font-size:14px">Already registered? <a href="${withNext("/login")}">Login</a></p>
  </form>`);
}
function forgotPage() {
  if (state.forgotSent) {
    if (Api.enabled) {
      return authCard("Forgot password", "Check your email for the next step.", `<div class="done" role="status"><h2>Check your email.</h2>
      <p>If an account exists for that address, we have sent a link to choose a new password. The link works once and expires after one hour. This page does not reveal whether the address is on file.</p>
      <p style="margin-top:12px"><a href="${withNext("/login")}">Back to login</a></p></div>`);
    }
    return authCard("Forgot password", "Password reset needs an email service before it can leave this website.", `<div class="done" role="status"><h2>We cannot email a reset link from this website.</h2>
      <p>If an account exists, a reset message would be sent only after SURGICISS connects an email service. This page does not change any password, and it does not reveal whether the address is on file.</p>
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

function accountShell(title, body) {
  const path = currentPath();
  const link = (hrefPath, label) => `<a href="#${hrefPath}" class="${navOn(hrefPath, path) ? "active" : ""}">${label}</a>`;
  const crumb = path === "/account" ? [{label: "Your account"}] : [{label: "Your account", to: "/account"}, {label: title}];
  return banner(title, crumb) + `<section class="wrap sec"><div class="acct-layout"><nav class="acct-nav" aria-label="Account">
      ${link("/account", "Overview")}
      ${link("/account/profile", "My profile")}
      ${link("/account/profile/edit", "Edit profile")}
      ${link("/account/orders", "My orders")}
      ${link("/account/quotes", "My quotes")}
      ${link("/account/enquiries", "My enquiries")}
      ${link("/account/settings", "Account settings")}
      <button type="button" class="navitem" data-logout>Log out</button>
    </nav><div>${body}</div></div></section>`;
}
function navOn(hrefPath, path) {
  if (hrefPath === "/account") return path === "/account";
  if (hrefPath === "/account/profile") return path === "/account/profile";
  if (hrefPath === "/account/profile/edit") return path === "/account/profile/edit";
  return path === hrefPath || path.startsWith(hrefPath + "/");
}
function accountHome() {
  const user = Accounts.current();
  const quotes = Records.quotesFor(user.id);
  const enquiries = Records.enquiriesFor(user.id);
  const notice = state.notice ? `<div class="note info" role="status" style="margin-bottom:16px"><p>${escapeHtml(state.notice)}</p></div>` : "";
  return accountShell("Your account", `${notice}${localNotice()}
    <div class="statgrid">
      <div class="stat"><b>${quotes.length}</b><span>Quotes</span></div>
      <div class="stat"><b>${enquiries.length}</b><span>Enquiries</span></div>
      <div class="stat"><b>—</b><span>Orders are not listed here</span></div>
    </div>
    <div class="box" style="margin-top:20px"><h2 class="h-sec">Signed in as</h2>
        <p style="margin-top:12px">${escapeHtml(user.name)}</p><p>${escapeHtml(user.email)}</p><p>${escapeHtml(user.organisation || "No organisation on the profile yet.")}</p>
      <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="#/generate-quote">Generate quote</a><a class="btn line" href="#/contact-us">Ask a question</a></div>
    </div>
    <div class="box" style="margin-top:16px"><h2 class="h-sec">Orders</h2>
      <p>This website does not hold order history. A quote request is not an order, and none have been invented to fill this page. Orders will appear here only after an order system is connected to your account.</p>
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
  return accountShell("Edit profile", `${notice}<form class="enq" id="profile-form" novalidate>
    ${error}
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
  return accountShell("My orders", `<div class="empty"><h2>No orders are held on this website</h2>
    <p>SURGICISS has not connected an order history to this page, so there is nothing to show. Quotations you prepare are listed under My quotes, and a quotation is not an order.</p>
    <p style="margin-top:16px"><a class="btn" href="#/account/quotes">Go to my quotes</a></p>
    </div>`);
}
function accountQuotes() {
  const user = Accounts.current();
  const list = Records.quotesFor(user.id);
  if (!list.length) {
    return accountShell("My quotes", `<div class="empty"><h2>No quotes yet</h2>
      <p>When you generate a quote while signed in, the request appears here. Nothing is shown unless you actually submitted it.</p>
      <p style="margin-top:16px"><a class="btn" href="#/generate-quote">Generate quote</a></p>
      </div>`);
  }
  const rows = list.map(item => `<li><div class="listhead"><a href="#/account/quotes/${encodeURIComponent(item.id)}">${escapeHtml(item.id)}</a>${statusPill(item)}</div><p>${escapeHtml(formatWhen(item.createdAt))} · ${item.lines.length} item${item.lines.length === 1 ? "" : "s"} · ${escapeHtml(item.lines.map(line => line.name).join(", "))}</p></li>`).join("");
  return accountShell("My quotes", `<ul class="rec-list">${rows}</ul>`);
}
function accountQuoteDetail(id) {
  const user = Accounts.current();
  const record = Records.visibleQuote(decodeURIComponent(id), user.id);
  if (!record || record.userId !== user.id) return accountShell("Quote request", `<div class="empty"><h2>That quote is not on this account</h2>
    <p>It may belong to another account, or the reference may be wrong.</p>
    </div>`);
  return accountShell("Quote request", `${quoteSummary(record)}<p style="margin-top:16px"><button type="button" class="btn" data-download="${escapeHtml(record.id)}">Download a copy</button></p>`);
}
function accountEnquiries() {
  const user = Accounts.current();
  const list = Records.enquiriesFor(user.id);
  if (!list.length) {
    return accountShell("My enquiries", `<div class="empty"><h2>No enquiries yet</h2>
      <p>Questions you send while signed in, or with the same email address, are listed here after you submit the contact form. The list does not mean SURGICISS has replied.</p>
      <p style="margin-top:16px"><a class="btn" href="#/contact-us">Ask a question</a></p>
      </div>`);
  }
  const rows = list.map(item => `<li><div class="listhead"><a href="#/account/enquiries/${encodeURIComponent(item.id)}">${escapeHtml(item.subject || "Enquiry")}</a>${statusPill(item)}</div><p>${escapeHtml(item.id)} · ${escapeHtml(formatWhen(item.createdAt))}</p></li>`).join("");
  return accountShell("My enquiries", `<ul class="rec-list">${rows}</ul>`);
}
function accountEnquiryDetail(id) {
  const user = Accounts.current();
  const record = Records.visibleEnquiry(decodeURIComponent(id), user.id);
  if (!record || record.userId !== user.id) return accountShell("Enquiry", `<div class="empty"><h2>That enquiry is not on this account</h2>
    <p>It may belong to another account, or the reference may be wrong.</p>
    </div>`);
  return accountShell("Enquiry", `<div class="box"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h2 class="h-sec">${escapeHtml(record.subject || "Enquiry")}</h2>${statusPill(record)}</div>
    <p class="muted" style="margin-top:8px;font-size:14px">${escapeHtml(record.id)} · ${escapeHtml(formatWhen(record.createdAt))}</p>
    <p style="margin-top:12px">${escapeHtml(deliveryCopy(record))}</p>
    <dl class="kv"><div><dt>Relates to</dt><dd>${escapeHtml(record.interest || "Not given")}</dd></div><div><dt>Message</dt><dd>${escapeHtml(record.message || "")}</dd></div><div><dt>Contact</dt><dd>${escapeHtml(record.contact.name)} · ${escapeHtml(record.contact.email)}</dd></div><div><dt>Organisation</dt><dd>${escapeHtml(record.contact.organisation || "Not given")}</dd></div><div><dt>Telephone</dt><dd>${escapeHtml(record.contact.phone || "Not given")}</dd></div><div><dt>Preferred contact</dt><dd>${escapeHtml(record.contact.preferredContact || "Email")}</dd></div></dl></div>`);
}
function accountSettings() {
  const notice = state.notice ? `<div class="note info" role="status"><p>${escapeHtml(state.notice)}</p></div>` : "";
  const error = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  const user = Accounts.current();
  const noPassword = Boolean(user && user.hasPassword === false);
  const passwordSection = noPassword
    ? `<section><h2 class="h-sec">Password</h2>
      <p class="muted" style="font-size:14px">You sign in with Google or Facebook, so this account has no password. If you would also like to sign in with an email and password, <a href="#/forgot-password">request a link to set one</a>.</p></section>`
    : `<form class="enq" id="password-form" novalidate>
      <h2 class="h-sec">Change password</h2>
      <p class="muted" style="font-size:14px">Changing your password signs you out on your other devices.</p>
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
      <h2 class="h-sec">Delete account</h2>
      <p class="muted" style="font-size:14px">This permanently deletes your account and the quotes and enquiries filed under it. Requests you sent without signing in are not affected. This cannot be undone.</p>
      ${noPassword
    ? `<div class="fld"><label for="confirmText">Type DELETE to confirm</label>
    <input id="confirmText" name="confirmText" autocomplete="off" maxlength="20"></div>`
    : `<div class="fld"><label for="deletePassword">Password</label>
    <input id="deletePassword" name="password" type="password" autocomplete="current-password" maxlength="128"></div>`}
      <label class="check"><input type="checkbox" name="confirmDelete" value="yes"> I understand this cannot be undone.</label>
      <div><button class="btn line" type="submit">Delete account</button></div>
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
  try {
    const result = await Records.deliver("enquiry", record);
    record.delivered = !!result.delivered;
    record.deliveryError = !!result.failed;
    if (result.id) record.id = result.id;
  } catch (err) {
    record.deliveryError = true;
  }
  Records.saveEnquiry(record);
  state.errors = {};
  state.submitted = true;
  state.submitResult = {delivered: record.delivered, failed: record.deliveryError, id: record.id};
  route();
}

async function submitQuote(form) {
  if (form.dataset.busy === "1") return;
  const model = readQuoteForm(form);
  const errors = validateQuote(model);
  state.quoteHold = model;
  Records.saveDraft(model);
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
  try {
    const result = await Records.deliver("quote", record);
    record.delivered = !!result.delivered;
    record.deliveryError = !!result.failed;
    if (result.id) record.id = result.id;
  } catch (err) {
    record.deliveryError = true;
  }
  Records.saveQuote(record);
  Records.clearDraft();
  state.quoteHold = null;
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
        Records.saveDraft(state.quoteHold);
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

  document.addEventListener("click", event => {
    const add = event.target.closest("#add-line");
    const remove = event.target.closest("[data-remove-line]");
    const download = event.target.closest("[data-download]");
    const logout = event.target.closest("[data-logout]");
    const saveDraft = event.target.closest(".js-save-draft");
    if (saveDraft) {
      const form = document.getElementById("quote-form");
      if (form) {
        state.quoteHold = readQuoteForm(form);
        Records.saveDraft(state.quoteHold);
      }
    }
    if (add) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      state.quoteHold.lines.push({ref: "", qty: "1", note: ""});
      Records.saveDraft(state.quoteHold);
      rerenderKeepScroll(pages.quote());
    } else if (remove && !remove.disabled) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      const index = Number(remove.dataset.removeLine);
      if (state.quoteHold.lines.length > 1) state.quoteHold.lines.splice(index, 1);
      Records.saveDraft(state.quoteHold);
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
    Records.saveDraft(state.quoteHold);
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
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.confirmDelete !== "yes") {
    state.authError = "Tick the box to confirm you want the account removed.";
    state.notice = "";
    rerenderKeepScroll(accountSettings());
    return;
  }
  const result = await Accounts.removeAccount(data.password || "", data.confirmText || "");
  if (!result.ok) {
    state.authError = result.error;
    rerenderKeepScroll(accountSettings());
    return;
  }
  try {sessionStorage.setItem("surgiciss-flash", "Your account has been removed. You are back on the public site.");}
  catch (err) { /* ignore */}
  location.hash = "#/";
}