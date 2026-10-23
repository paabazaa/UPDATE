// SURGICISS LTD - Professional Customer v2 - Secure accounts + Quote builder
// Purple oriented, form-first login, social second

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
  return `<div class="note info"><p><strong>Accounts are secure.</strong> Stored in MySQL with encrypted passwords. Read public pages without account, but account lets you track quotes & enquiries. SURGICISS protects your data.</p></div>`;
}
function deliveryCopy(record) {
  if (record.delivered) return "This request was accepted by the submission service.";
  if (record.deliveryError) return "Server could not be reached. SURGICISS has not received it. Please try again.";
  return "This request has been saved and will be sent shortly.";
}
function statusPill(record) {
  if (record.delivered) return `<span class="pill ok">Sent</span>`;
  if (record.deliveryError) return `<span class="pill bad">Not delivered</span>`;
  return `<span class="pill wait">Not sent</span>`;
}
function blankFields(fields) {
  const user = Accounts.current();
  const base = {
    name: user ? user.name : "", email: user ? user.email : "", phone: user ? user.phone : "",
    organisation: user ? user.organisation : "", country: user ? user.country : "",
    city: user ? user.city : "", delivery: user ? user.deliveryLocation : "",
    requirements: "", preferredContact: "Email"
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
      name: value("name"), email: value("email"), phone: value("phone"),
      organisation: value("organisation"), country: value("country"),
      city: value("city"), delivery: value("delivery"),
      requirements: value("requirements"),
      preferredContact: preferred ? preferred.value : "Email"
    }
  };
}
function validateQuote(model) {
  const errors = {}; const fields = model.fields;
  if (!model.lines.length) errors.lines = "Add at least one item.";
  model.lines.forEach((line, index) => {
    if (!line.ref) errors["line" + index] = "Choose an item.";
    if (!/^[1-9]\d*$/.test(String(line.qty || "").trim())) errors["qty" + index] = "Enter 1 or more.";
    if (String(line.note || "").trim().length > 240) errors["note" + index] = "Keep under 240 characters.";
  });
  if (String(fields.name || "").trim().length < 2) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fields.email || "").trim())) errors.email = "Enter valid email.";
  if (String(fields.organisation || "").trim().length < 2) errors.organisation = "Enter organisation.";
  if (String(fields.country || "").trim().length < 2) errors.country = "Enter country.";
  if (String(fields.delivery || "").trim().length < 3) errors.delivery = "Enter delivery location.";
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
    <div class="fld"><label for="ref-${index}">Item <span class="req">*</span></label><select id="ref-${index}" name="ref">${lineOptions(line.ref)}</select>${state.errors["line" + index] ? `<p class="err">${escapeHtml(state.errors["line" + index])}</p>` : ""}</div>
    <div class="fld"><label for="qty-${index}">Quantity <span class="req">*</span></label><input id="qty-${index}" name="qty" inputmode="numeric" maxlength="6" value="${escapeHtml(line.qty || "")}">${state.errors["qty" + index] ? `<p class="err">${escapeHtml(state.errors["qty" + index])}</p>` : ""}</div>
    <div class="fld"><label for="note-${index}">Note</label><input id="note-${index}" name="note" maxlength="240" placeholder="Size, set type" value="${escapeHtml(line.note || "")}">${state.errors["note" + index] ? `<p class="err">${escapeHtml(state.errors["note" + index])}</p>` : ""}</div>
    <button type="button" class="btn line" data-remove-line="${index}"${model.lines.length === 1 ? " disabled" : ""}>Remove</button>
  </div>`).join("");
}
function contactFieldsHtml(fields) {
  const radio = value => `<label><input type="radio" name="preferredContact" value="${value}"${fields.preferredContact === value ? " checked" : ""}>${value}</label>`;
  const err = name => state.errors[name] ? `<p class="err">${escapeHtml(state.errors[name])}</p>` : "";
  return `<div class="fields">
      <div class="fld"><label for="name">Full name <span class="req">*</span></label><input id="name" name="name" autocomplete="name" maxlength="255" value="${escapeHtml(fields.name || "")}">${err("name")}</div>
      <div class="fld"><label for="email">Email address <span class="req">*</span></label><input id="email" name="email" type="email" autocomplete="email" maxlength="255" value="${escapeHtml(fields.email || "")}">${err("email")}</div>
      <div class="fld"><label for="phone">Telephone</label><input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="255" value="${escapeHtml(fields.phone || "")}"></div>
      <div class="fld"><label for="organisation">Organisation <span class="req">*</span></label><input id="organisation" name="organisation" autocomplete="organization" maxlength="255" value="${escapeHtml(fields.organisation || "")}">${err("organisation")}</div>
      ${Places.countryField(fields.country, {required: true, error: err("country")})}
      ${Places.cityField(fields.country, fields.city)}
    </div>
    <div class="fld"><label for="delivery">Delivery location <span class="req">*</span></label><textarea id="delivery" name="delivery" rows="3" maxlength="500" placeholder="Department, hospital and address.">${escapeHtml(fields.delivery || "")}</textarea>${err("delivery")}</div>
    <fieldset class="fld"><legend>Preferred contact</legend><div class="radios">${radio("Email")}${radio("Telephone")}${radio("Either")}</div></fieldset>
    <div class="fld"><label for="requirements">Additional requirements</label><textarea id="requirements" name="requirements" rows="5" maxlength="2000" placeholder="Sets, timescales...">${escapeHtml(fields.requirements || "")}</textarea></div>`;
}
function quoteText(record) {
  const lines = record.lines.map((line, index) => `${index + 1}. ${line.name} — qty ${line.quantity}${line.note ? " — " + line.note : ""}`).join("\n");
  return ["SURGICISS LTD — quote request","Reference: " + record.id,"Prepared: " + formatWhen(record.createdAt),"","Items",lines || "None","","Organisation: " + record.contact.organisation,"Contact: " + record.contact.name,"Email: " + record.contact.email,"Delivery: " + record.contact.deliveryLocation].join("\n");
}
function quotePage() {
  if (state.submitted && state.lastQuoteId) {
    const user = Accounts.current();
    const record = Records.visibleQuote(state.lastQuoteId, user && user.id);
    if (record) return quoteDone(record);
  }
  const model = buildQuoteModel();
  const user = Accounts.current();
  const accountNote = user ? `<p class="muted">Signed in as ${escapeHtml(user.email)}. Filed under My quotes.</p>` : `<p class="muted">You can prepare without account. <a class="js-save-draft" href="#/login?next=${encodeURIComponent("/generate-quote")}">Log in</a> or <a class="js-save-draft" href="#/sign-up?next=${encodeURIComponent("/generate-quote")}">create account</a> to save. Selections are kept.</p>`;
  return banner("Generate a quote", [{label: "Generate a quote"}]) + `<section class="wrap sec"><div class="two quote"><div>
      <div class="note info"><p>Submitting does not place an order. Saving against your name needs account.</p></div>
      <div style="margin-top:16px">${accountNote}</div>
      <form class="enq" id="quote-form" novalidate style="margin-top:20px">
        <h2 class="h-sec">Items</h2><p class="muted" style="margin:8px 0 12px;font-size:14px">Quantity means units, sets, licences or days. No price shown here.</p>
        <div class="lines">${quoteLinesHtml(model)}</div>${state.errors.lines ? `<p class="err">${escapeHtml(state.errors.lines)}</p>` : ""}
        <p style="margin-top:12px"><button type="button" class="btn line" id="add-line">Add another item</button></p>
        <h2 class="h-sec" style="margin-top:28px">Your details</h2><div class="stack">${contactFieldsHtml(model.fields)}</div>
        <div><button class="btn lg" type="submit">Submit quote request</button></div>
      </form>
    </div><aside><div class="box tint"><h2 class="h-sec">What happens next</h2><ol class="steps"><li>We check items.</li><li>Request is sent if service connected.</li><li>Quotation comes back separately.</li></ol></div></aside></div></section>`;
}
function quoteDone(record) {
  const user = Accounts.current();
  const filing = user ? `<p><a href="#/account/quotes/${encodeURIComponent(record.id)}">View in My quotes</a></p>` : `<p><a href="#/sign-up?next=${encodeURIComponent("/account/quotes")}">Create account</a> with ${escapeHtml(record.contact.email)} to keep requests together.</p>`;
  return banner("Quote request", [{label: "Generate a quote"}]) + `<section class="wrap narrow sec"><div class="done" role="status"><h2>${record.delivered ? "Quote request sent." : "Quote request saved."}</h2><p>${escapeHtml(deliveryCopy(record))}</p><p>Reference <strong>${escapeHtml(record.id)}</strong>.</p>${filing}<div class="row" style="margin-top:16px;display:flex;gap:12px"><button type="button" class="btn" data-download="${escapeHtml(record.id)}">Download copy</button><button type="button" class="btn line" id="again">Prepare another</button></div></div>${quoteSummary(record)}</section>`;
}
function quoteSummary(record) {
  const rows = record.lines.map(line => `<tr><td>${escapeHtml(line.name)}</td><td>${escapeHtml(String(line.quantity))}</td><td>${escapeHtml(line.note || "—")}</td></tr>`).join("");
  return `<div class="box" style="margin-top:24px"><div style="display:flex;justify-content:space-between;gap:12px"><h2 class="h-sec">${escapeHtml(record.id)}</h2>${statusPill(record)}</div><p class="muted" style="margin-top:8px;font-size:14px">${escapeHtml(formatWhen(record.createdAt))}</p><div class="table-scroll"><table class="lines"><thead><tr><th>Item</th><th>Quantity</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function customerHeader() {
  const path = currentPath();
  const act = item => (item === "/" ? path === "/" : path === item || path.startsWith(item + "/")) ? " active" : "";
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const softwareLinks = software.map(item => ({label: item.name, to: "/software/" + item.slug}));
  const productLinks = products.map(item => ({label: item.name, to: "/products/" + item.slug}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const user = Accounts.current();
  const accountDesktop = user ? `<a class="tl acct desk-only" href="#/account">My account</a><button type="button" class="tl acct desk-only" data-logout>Log out</button>` : `<a class="tl acct desk-only${act("/login")}" href="#/login">Login</a><a class="tl acct desk-only${act("/sign-up")}" href="#/sign-up">Create account</a>`;
  const accountMobile = user ? `<a href="#/account">My account</a><a href="#/account/quotes">My quotes</a><a href="#/account/enquiries">My enquiries</a><button type="button" class="linkish" data-logout>Log out</button>` : `<a href="#/login">Login</a><a href="#/sign-up">Create account</a>`;
  return `<header class="site" id="hdr"><div class="wrap hbar"><a class="logo" href="#/"><img src="${imageUrl("logo")}" alt="SURGICISS" width="1520" height="384"></a><div class="htools"><a class="btn desk-only" href="#/generate-quote">Generate quote</a>${accountDesktop}<button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}">${state.mobile ? icons.close : icons.menu}Menu</button>${themeButton()}</div></div><div class="navrow"><nav class="main"><a class="tl${act("/")}" href="#/">Home</a>${dd("software", "Software", softwareLinks, "/software", "All Software")}${dd("products", "Products", productLinks, "/products", "All Products")}<a class="tl${act("/count-sheet-holders")}" href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a class="tl${act("/contact-us")}" href="#/contact-us">Contact Us</a></nav></div><div class="mobile-cta"><a href="#/generate-quote">Generate quote</a><a href="#/contact-us">Ask a question</a></div>${state.mobile ? `<div id="mobnav"><nav class="wrap"><a href="#/">Home</a>${mgroup("Software", softwareLinks, "/software", "All Software")}${mgroup("Products", productLinks, "/products", "All Products")}<a href="#/count-sheet-holders">Instrument Count Sheet Holders</a><a href="#/contact-us">Contact Us</a>${accountMobile}<a class="quote" href="#/generate-quote">Generate quote</a></nav></div>` : ""}</header>`;
}

/* ---------- AUTH - PROFESSIONAL PURPLE, FORM FIRST ---------- */
function authShell(body) {
  return `<div class="auth-wrap"><div class="auth-card">${body}</div></div>`;
}
function fieldError(name) { return state.errors[name] ? `<p class="err">${escapeHtml(state.errors[name])}</p>` : ""; }

const SOCIAL = {
  google: { label: "Google", icon: `<svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"/></svg>` },
  facebook: { label: "Facebook", icon: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#1877F2" d="M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z"/></svg>` }
};
const SOCIAL_ERRORS = {
  oauth_unavailable: "Sign-in not available. Use email and password.",
  oauth_denied: "Sign-in cancelled.",
  oauth_failed: "Could not complete sign-in.",
  oauth_no_email: "No email shared. Allow email or use password.",
  oauth_unverified: "Email not verified with provider."
};
function socialButtons() {
  const providers = Accounts.providers ? Accounts.providers() : [];
  if (!providers.length) return "";
  const next = safeNext(currentQuery().get("next") || "/account");
  const links = providers.filter(name => SOCIAL[name]).map(name => `<a class="btn social" href="${escapeHtml(Api.base)}/api/auth/oauth/${name}/start?next=${encodeURIComponent(next)}">${SOCIAL[name].icon}<span>Continue with ${SOCIAL[name].label}</span></a>`).join("");
  return `<div class="or">or continue with</div><div class="social-block"><div class="social-list">${links}</div></div>`;
}
function socialError() { return SOCIAL_ERRORS[currentQuery().get("error")] || ""; }

function loginPage() {
  const message = state.authError || socialError();
  return `<div class="auth-wrap"><div class="auth-card">
    <div class="auth-head"><h1>Login</h1><p>Welcome back — sign in to your SURGICISS account</p></div>
    <div class="auth-body">
      ${message ? `<div class="note warn" style="margin-bottom:16px"><p>${escapeHtml(message)}</p></div>` : ""}
      <form class="enq" id="login-form" novalidate>
        <div class="fld"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="username" placeholder="you@company.com" maxlength="255" required>${fieldError("email")}</div>
        <div class="fld"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" maxlength="128" required>${fieldError("password")}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 18px;font-size:13px"><label class="check"><input type="checkbox"> Remember me</label><a href="${withNext("/forgot-password")}" style="color:var(--link)">Forgot password?</a></div>
        <button class="btn primary" type="submit" style="width:100%;border-radius:8px;padding:14px">LOGIN</button>
      </form>
      <div style="text-align:center;margin-top:14px;font-size:13px"><span class="muted">Don't have account?</span> <a href="${withNext("/sign-up")}" style="color:var(--link);font-weight:600">Create account</a></div>
      ${socialButtons()}
      <p style="text-align:center;font-size:11px;color:var(--muted-fg);margin-top:18px">🔒 256-bit SSL • HIPAA compliant</p>
    </div>
  </div></div>`;
}

function signupPage() {
  const message = state.authError || socialError();
  return `<div class="auth-wrap"><div class="auth-card">
    <div class="auth-head"><h1>Create account</h1><p>Join SURGICISS for quotes & tracking</p></div>
    <div class="auth-body">
      ${message ? `<div class="note warn" style="margin-bottom:16px"><p>${escapeHtml(message)}</p></div>` : ""}
      <form class="enq" id="signup-form" novalidate>
        <div class="fields">
          <div class="fld"><label>Full name *</label><input name="name" autocomplete="name" placeholder="Dr. John Smith" required>${fieldError("name")}</div>
          <div class="fld"><label>Email *</label><input name="email" type="email" placeholder="you@hospital.com" required>${fieldError("email")}</div>
          <div class="fld"><label>Password *</label><input name="password" type="password" placeholder="At least 8 characters" required>${fieldError("password")}</div>
          <div class="fld"><label>Confirm *</label><input name="confirm" type="password" required>${fieldError("confirm")}</div>
        </div>
        <button class="btn primary" type="submit" style="width:100%;margin-top:12px;border-radius:8px;padding:14px">Create Account</button>
      </form>
      <div style="text-align:center;margin-top:14px;font-size:13px"><span class="muted">Already have?</span> <a href="${withNext("/login")}" style="color:var(--link);font-weight:600">Login</a></div>
      ${socialButtons()}
    </div>
  </div></div>`;
}

function forgotPage() {
  if (state.forgotSent) {
    return `<div class="auth-wrap"><div class="auth-card"><div class="auth-head"><h1>Check email</h1><p>If account exists, link sent. Expires in 1 hour.</p></div><div class="auth-body"><div class="done"><p>Check inbox. <a href="${withNext("/login")}">Back to login</a></p></div></div></div></div>`;
  }
  return `<div class="auth-wrap"><div class="auth-card"><div class="auth-head"><h1>Forgot password</h1><p>Enter email to get reset link</p></div><div class="auth-body">
    ${state.authError ? `<div class="note warn"><p>${escapeHtml(state.authError)}</p></div>` : ""}
    <form class="enq" id="forgot-form" novalidate><div class="fld"><label>Email address</label><input name="email" type="email" required></div><button class="btn primary" type="submit" style="width:100%;border-radius:8px;padding:14px">Request reset</button></form>
    <div style="text-align:center;margin-top:14px"><a href="${withNext("/login")}" style="color:var(--link)">Back to login</a></div>
  </div></div></div>`;
}
function resetPage() {
  if (state.resetDone) {
    return `<div class="auth-wrap"><div class="auth-card"><div class="auth-head"><h1>Password changed</h1></div><div class="auth-body"><div class="done"><p>Now log in with new password.</p><p><a class="btn" href="#/login">Login</a></p></div></div></div></div>`;
  }
  if (!currentQuery().get("token")) {
    return `<div class="auth-wrap"><div class="auth-card"><div class="auth-body"><div class="done"><p>Link incomplete. Open from email or <a href="#/forgot-password">request new</a>.</p></div></div></div></div>`;
  }
  return `<div class="auth-wrap"><div class="auth-card"><div class="auth-head"><h1>New password</h1></div><div class="auth-body">
    ${state.authError ? `<div class="note warn"><p>${escapeHtml(state.authError)}</p></div>` : ""}
    <form class="enq" id="reset-form" novalidate><div class="fld"><label>New password</label><input name="password" type="password" required></div><div class="fld"><label>Confirm</label><input name="confirm" type="password" required></div><button class="btn primary" type="submit" style="width:100%;border-radius:8px;padding:14px">Save password</button></form>
  </div></div></div>`;
}

function accountShell(title, body) {
  const path = currentPath();
  const link = (hrefPath, label) => `<a href="#${hrefPath}" class="${navOn(hrefPath, path) ? "active" : ""}">${label}</a>`;
  const crumb = path === "/account" ? [{label: "Your account"}] : [{label: "Your account", to: "/account"}, {label: title}];
  return banner(title, crumb) + `<section class="wrap sec"><div class="acct-layout"><nav class="acct-nav"><a href="#/account" class="${navOn("/account", path) ? "active" : ""}">Overview</a><a href="#/account/profile">My profile</a><a href="#/account/quotes">My quotes</a><a href="#/account/enquiries">My enquiries</a><a href="#/account/settings">Settings</a><button type="button" class="navitem" data-logout>Log out</button></nav><div>${body}</div></div></section>`;
}
function navOn(hrefPath, path) { if (hrefPath === "/account") return path === "/account"; return path === hrefPath || path.startsWith(hrefPath + "/"); }
function accountHome() {
  const user = Accounts.current();
  const quotes = Records.quotesFor(user.id);
  const enquiries = Records.enquiriesFor(user.id);
  const notice = state.notice ? `<div class="note info" style="margin-bottom:16px"><p>${escapeHtml(state.notice)}</p></div>` : "";
  return accountShell("Your account", `${notice}${localNotice()}<div class="statgrid"><div class="stat"><b>${quotes.length}</b><span>Quotes</span></div><div class="stat"><b>${enquiries.length}</b><span>Enquiries</span></div></div><div class="box" style="margin-top:20px"><h2 class="h-sec">Signed in as</h2><p style="margin-top:12px">${escapeHtml(user.name)}</p><p>${escapeHtml(user.email)}</p><div style="margin-top:16px;display:flex;gap:12px"><a class="btn" href="#/generate-quote">Generate quote</a><a class="btn line" href="#/contact-us">Ask question</a></div></div>`);
}
function profileList(user) { const row = (l,v) => `<div><dt>${l}</dt><dd>${escapeHtml(v || "Not provided")}</dd></div>`; return `<dl class="kv">${row("Name", user.name)}${row("Email", user.email)}${row("Phone", user.phone)}${row("Org", user.organisation)}${row("Country", user.country)}</dl>`; }
function accountProfile() { const user = Accounts.current(); return accountShell("My profile", `<div class="box"><h2 class="h-sec">Profile</h2>${profileList(user)}<a class="btn" href="#/account/profile/edit" style="margin-top:16px">Edit</a></div>`); }
function accountEdit() { const user = Accounts.current(); const notice = state.notice ? `<div class="note info"><p>${escapeHtml(state.notice)}</p></div>` : ""; const error = state.authError ? `<p class="err">${escapeHtml(state.authError)}</p>` : ""; return accountShell("Edit profile", `${notice}<form class="enq" id="profile-form" novalidate>${error}<div class="fields"><div class="fld"><label>Full name *</label><input name="name" value="${escapeHtml(user.name)}">${fieldError("name")}</div><div class="fld"><label>Email</label><input value="${escapeHtml(user.email)}" disabled></div><div class="fld"><label>Phone</label><input name="phone" value="${escapeHtml(user.phone)}"></div><div class="fld"><label>Organisation</label><input name="organisation" value="${escapeHtml(user.organisation)}"></div>${Places.countryField(user.country)}${Places.cityField(user.country, user.city)}</div><div class="fld"><label>Delivery</label><textarea name="deliveryLocation" rows="3">${escapeHtml(user.deliveryLocation)}</textarea></div><div><button class="btn lg" type="submit">Save</button></div></form>`); }
function accountOrders() { return accountShell("My orders", `<div class="empty"><h2>No orders held</h2><p>Quotations are under My quotes. A quotation is not an order.</p></div>`); }
function accountQuotes() { const user = Accounts.current(); const list = Records.quotesFor(user.id); if (!list.length) return accountShell("My quotes", `<div class="empty"><h2>No quotes yet</h2><p><a class="btn" href="#/generate-quote">Generate quote</a></p></div>`); const rows = list.map(item => `<li><div class="listhead"><a href="#/account/quotes/${encodeURIComponent(item.id)}">${escapeHtml(item.id)}</a>${statusPill(item)}</div><p>${escapeHtml(formatWhen(item.createdAt))}</p></li>`).join(""); return accountShell("My quotes", `<ul class="rec-list">${rows}</ul>`); }
function accountQuoteDetail(id) { const user = Accounts.current(); const record = Records.visibleQuote(decodeURIComponent(id), user.id); if (!record) return accountShell("Quote", `<div class="empty"><h2>Not found</h2></div>`); return accountShell("Quote", `${quoteSummary(record)}`); }
function accountEnquiries() { const user = Accounts.current(); const list = Records.enquiriesFor(user.id); if (!list.length) return accountShell("My enquiries", `<div class="empty"><h2>No enquiries</h2><p><a class="btn" href="#/contact-us">Ask question</a></p></div>`); const rows = list.map(item => `<li><div class="listhead"><a href="#/account/enquiries/${encodeURIComponent(item.id)}">${escapeHtml(item.subject || "Enquiry")}</a>${statusPill(item)}</div><p>${escapeHtml(item.id)}</p></li>`).join(""); return accountShell("My enquiries", `<ul class="rec-list">${rows}</ul>`); }
function accountEnquiryDetail(id) { const user = Accounts.current(); const record = Records.visibleEnquiry(decodeURIComponent(id), user.id); if (!record) return accountShell("Enquiry", `<div class="empty"><h2>Not found</h2></div>`); return accountShell("Enquiry", `<div class="box"><h2 class="h-sec">${escapeHtml(record.subject || "Enquiry")}</h2><p>${escapeHtml(record.message || "")}</p></div>`); }
function accountSettings() { const notice = state.notice ? `<div class="note info"><p>${escapeHtml(state.notice)}</p></div>` : ""; const error = state.authError ? `<p class="err">${escapeHtml(state.authError)}</p>` : ""; const user = Accounts.current(); const noPassword = Boolean(user && user.hasPassword === false); return accountShell("Account settings", `${notice}${error}${noPassword ? `<p class="muted">You sign in with Google/Facebook, no password.</p>` : `<form class="enq" id="password-form" novalidate><h2 class="h-sec">Change password</h2><div class="fld"><label>Current</label><input name="currentPassword" type="password"></div><div class="fields"><div class="fld"><label>New</label><input name="nextPassword" type="password"></div><div class="fld"><label>Confirm</label><input name="confirmPassword" type="password"></div></div><div><button class="btn lg" type="submit">Update</button></div></form>`}<form class="enq" id="delete-form" style="margin-top:32px"><h2 class="h-sec">Delete account</h2><label class="check"><input type="checkbox" name="confirmDelete" value="yes"> I understand cannot be undone.</label><div><button class="btn line" type="submit">Delete account</button></div></form>`); }

function gatedPath() {
  let path = currentPath();
  if (path.startsWith("/account") && !Accounts.current()) { history.replaceState(null, "", "#/login?next=" + encodeURIComponent(path)); path = "/login"; }
  if ((path === "/login" || path === "/sign-up") && Accounts.current()) { const next = safeNext(currentQuery().get("next") || "/account"); history.replaceState(null, "", "#" + next); path = next.split("?")[0]; }
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
  const t = {"/login": "Login", "/sign-up": "Create account", "/forgot-password": "Forgot password", "/reset-password": "New password", "/account": "Your account", "/account/profile": "My profile", "/account/quotes": "My quotes", "/account/enquiries": "My enquiries", "/account/settings": "Settings"};
  return t[path] ? t[path] + " — SURGICISS LTD" : "Account — SURGICISS LTD";
}

/* ---------- handlers ---------- */
function restoreEnquiry(values) { Object.entries(values).forEach(([k,v]) => { document.querySelectorAll(`#enquiry [name="${k}"]`).forEach(f => { if (f.type === "radio") f.checked = f.value === v; else f.value = v; }); }); }
async function handleEnquirySubmit(event) {
  const form = event.target; if (form.dataset.busy === "1") return;
  const values = Object.fromEntries(new FormData(form).entries());
  const errors = validate(values);
  if (Object.keys(errors).length) { state.errors = errors; state.submitted = false; rerenderKeepScroll(pages.contact()); restoreEnquiry(values); return; }
  form.dataset.busy = "1";
  const user = Accounts.current();
  const record = { id: Records.stamp("E"), createdAt: new Date().toISOString(), userId: user ? user.id : null, subject: String(values.subject || "").trim(), message: String(values.message || "").trim(), interest: String(values.interest || "").trim(), contact: { name: String(values.name || "").trim(), email: String(values.email || "").trim(), phone: String(values.phone || "").trim(), organisation: String(values.organisation || "").trim(), country: String(values.country || "").trim(), city: String(values.city || "").trim(), preferredContact: values.preferredContact || "Email" }, delivered: false, deliveryError: false };
  try { const result = await Records.deliver("enquiry", record); record.delivered = !!result.delivered; record.deliveryError = !!result.failed; if (result.id) record.id = result.id; } catch { record.deliveryError = true; }
  Records.saveEnquiry(record); state.errors = {}; state.submitted = true; state.submitResult = {delivered: record.delivered, failed: record.deliveryError, id: record.id}; route();
}
async function submitQuote(form) {
  if (form.dataset.busy === "1") return;
  const model = readQuoteForm(form); const errors = validateQuote(model); state.quoteHold = model; Records.saveDraft(model); state.errors = errors;
  if (Object.keys(errors).length) { state.submitted = false; rerenderKeepScroll(pages.quote()); return; }
  form.dataset.busy = "1";
  const user = Accounts.current(); const fields = model.fields;
  const record = { id: Records.stamp("Q"), createdAt: new Date().toISOString(), userId: user ? user.id : null, lines: model.lines.map(line => ({ ref: line.ref, name: refLabel(line.ref), quantity: Number(line.qty), note: String(line.note || "").trim() })), contact: { name: fields.name.trim(), email: fields.email.trim(), phone: fields.phone.trim(), organisation: fields.organisation.trim(), country: fields.country.trim(), city: fields.city.trim(), deliveryLocation: fields.delivery.trim(), preferredContact: fields.preferredContact || "Email" }, requirements: String(fields.requirements || "").trim(), delivered: false, deliveryError: false };
  try { const result = await Records.deliver("quote", record); record.delivered = !!result.delivered; record.deliveryError = !!result.failed; if (result.id) record.id = result.id; } catch { record.deliveryError = true; }
  Records.saveQuote(record); Records.clearDraft(); state.quoteHold = null; state.errors = {}; state.submitted = true; state.lastQuoteId = record.id; route();
}
function downloadQuote(id) { const user = Accounts.current(); const record = Records.visibleQuote(id, user && user.id); if (!record) return; const blob = new Blob([quoteText(record)], {type: "text/plain;charset=utf-8"}); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = record.id + ".txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
function snapshotInputs() { const root = document.getElementById("main"); if (!root) return []; return [...root.querySelectorAll("input, select, textarea")].filter(el => !el.disabled).map(el => ({ id: el.id, type: el.type, value: el.value, checked: el.checked })); }
function restoreInputs(saved) { saved.forEach(item => { if (!item.id) return; const el = document.getElementById(item.id); if (!el || el.disabled) return; if (item.type === "radio" || item.type === "checkbox") el.checked = item.checked; else el.value = item.value; }); }

function installCustomer() {
  const baseRoute = route; const baseRerender = rerenderKeepScroll; const baseRender = render;
  header = customerHeader; pages.quote = quotePage;
  rerenderKeepScroll = function(main) {
    const saved = main === undefined ? snapshotInputs() : null;
    if (main === undefined) {
      const form = document.getElementById("quote-form");
      if (form) { state.quoteHold = readQuoteForm(form); Records.saveDraft(state.quoteHold); const path = currentPath(); if (path === "/generate-quote" || path === "/request-quote") main = pages.quote(); }
    }
    const restore = saved && main === undefined; baseRerender(main); if (restore) restoreInputs(saved);
  };
  render = function(main) {
    let flash = ""; try { flash = sessionStorage.getItem("surgiciss-flash") || ""; if (flash) sessionStorage.removeItem("surgiciss-flash"); } catch {}
    if (flash && main !== undefined) main = `<div class="wrap flashwrap"><div class="note info">${escapeHtml(flash)}</div></div>` + main;
    baseRender(main);
  };
  route = function() {
    const path = gatedPath(); const html = accountView(path);
    if (html != null) { document.title = accountTitle(path); state.menu = null; state.mobile = false; render(html); return; }
    baseRoute();
  };
  document.addEventListener("click", event => {
    const add = event.target.closest("#add-line"); const remove = event.target.closest("[data-remove-line]"); const download = event.target.closest("[data-download]"); const logout = event.target.closest("[data-logout]"); const saveDraft = event.target.closest(".js-save-draft");
    if (saveDraft) { const form = document.getElementById("quote-form"); if (form) { state.quoteHold = readQuoteForm(form); Records.saveDraft(state.quoteHold); } }
    if (add) { const form = document.getElementById("quote-form"); state.quoteHold = readQuoteForm(form); state.quoteHold.lines.push({ref: "", qty: "1", note: ""}); Records.saveDraft(state.quoteHold); rerenderKeepScroll(pages.quote()); }
    else if (remove && !remove.disabled) { const form = document.getElementById("quote-form"); state.quoteHold = readQuoteForm(form); const index = Number(remove.dataset.removeLine); if (state.quoteHold.lines.length > 1) state.quoteHold.lines.splice(index, 1); Records.saveDraft(state.quoteHold); rerenderKeepScroll(pages.quote()); }
    else if (download) downloadQuote(download.dataset.download);
    else if (logout) { Accounts.logout(); location.hash = "#/"; }
  });
  document.addEventListener("input", event => { const form = event.target.closest("#quote-form"); if (!form) return; state.quoteHold = readQuoteForm(form); Records.saveDraft(state.quoteHold); });
  document.addEventListener("submit", event => {
    const id = event.target.id;
    if (id === "quote-form") { event.preventDefault(); submitQuote(event.target); }
    else if (id === "login-form") { event.preventDefault(); submitLogin(event.target); }
    else if (id === "signup-form") { event.preventDefault(); submitSignup(event.target); }
    else if (id === "forgot-form") { event.preventDefault(); submitForgot(event.target); }
    else if (id === "reset-form") { event.preventDefault(); submitReset(event.target); }
    else if (id === "profile-form") { event.preventDefault(); submitProfile(event.target); }
    else if (id === "password-form") { event.preventDefault(); submitPassword(event.target); }
    else if (id === "delete-form") { event.preventDefault(); submitDelete(event.target); }
  });
}
async function submitLogin(form) {
  if (form.dataset.busy === "1") return; form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.login(data.email || "", data.password || "");
  form.dataset.busy = "";
  if (!result.ok) { state.authError = result.error; rerenderKeepScroll(loginPage()); return; }
  state.authError = ""; goNext("/account");
}
async function submitSignup(form) {
  if (form.dataset.busy === "1") return; form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.register(data);
  form.dataset.busy = "";
  if (!result.ok) { state.authError = result.error; rerenderKeepScroll(signupPage()); return; }
  state.authError = ""; goNext("/account");
}
async function submitForgot(form) {
  if (form.dataset.busy === "1") return;
  const email = String((form.elements.email && form.elements.email.value) || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { state.authError = "Enter email address."; rerenderKeepScroll(forgotPage()); return; }
  form.dataset.busy = "1"; const result = await Accounts.forgot(email); form.dataset.busy = ""; state.authError = result.ok ? "" : result.error; state.forgotSent = result.ok; rerenderKeepScroll(forgotPage());
}
async function submitReset(form) {
  if (form.dataset.busy === "1") return; const data = Object.fromEntries(new FormData(form).entries()); form.dataset.busy = "1";
  const result = await Accounts.resetPassword(currentQuery().get("token") || "", data.password || "", data.confirm || ""); form.dataset.busy = ""; state.authError = result.ok ? "" : result.error; state.resetDone = result.ok; rerenderKeepScroll(resetPage());
}
async function submitProfile(form) { const data = Object.fromEntries(new FormData(form).entries()); const result = await Accounts.updateProfile(data); state.authError = result.ok ? "" : result.error; state.notice = result.ok ? "Profile updated." : ""; rerenderKeepScroll(accountEdit()); }
async function submitPassword(form) { const data = Object.fromEntries(new FormData(form).entries()); const result = await Accounts.changePassword(data.currentPassword, data.nextPassword, data.confirmPassword); state.notice = result.ok ? "Password updated." : ""; state.authError = result.ok ? "" : result.error; rerenderKeepScroll(accountSettings()); }
async function submitDelete(form) { const data = Object.fromEntries(new FormData(form).entries()); if (data.confirmDelete !== "yes") { state.authError = "Tick box to confirm."; rerenderKeepScroll(accountSettings()); return; } const result = await Accounts.removeAccount(data.password || "", data.confirmText || ""); if (!result.ok) { state.authError = result.error; rerenderKeepScroll(accountSettings()); return; } try { sessionStorage.setItem("surgiciss-flash", "Account removed."); } catch {} location.hash = "#/"; }
