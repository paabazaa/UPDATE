// Quote request: model, form, page and summary
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

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
// Generating a quote needs an account and a login. Asking a question does not.
function quoteGate() {
  const item = state.quoteItem || currentQuery().get("item") || "";
  const next = encodeURIComponent("/generate-quote" + (item ? "?item=" + encodeURIComponent(item) : ""));
  return banner("Generate a quote", [{label: "Generate a quote"}], "Quote requests are kept under your account so you can follow them up.")
    + `<section class="wrap narrow sec"><div class="box tint quote-gate" role="region" aria-labelledby="gate-title">
      <h2 class="h-sec" id="gate-title">Please log in to generate a quote</h2>
      <p style="margin-top:12px">You need an account, and to be logged in, before you can generate a quote. It takes a minute to create one.${item ? ` Your choice, <strong>${escapeHtml(item)}</strong>, will be waiting for you.` : ""}</p>
      <div class="row" style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn lg" href="/login?next=${next}">Log in</a><a class="btn lg line" href="/sign-up?next=${next}">Create account</a></div>
      <p class="muted" style="margin-top:20px;font-size:14px">Only have a question? You can <a href="/contact-us">ask us without an account</a>.</p>
    </div></section>`;
}
function quotePage() {
  if (state.submitted && state.lastQuoteId) {
    const user = Accounts.current();
    const record = Records.visibleQuote(state.lastQuoteId, user && user.id);
    if (record) return quoteDone(record);
  }
  if (!Accounts.current()) return quoteGate();
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
          <a class="btn line" href="/contact-us">Ask a question</a></div>
    </aside>
          </div>
          </section>`;
}
function quoteDone(record) {
  const user = Accounts.current();
  const filing = user
    ? `<p><a href="/account/quotes/${encodeURIComponent(record.id)}">View it in My quotes</a></p>`
    : `<p><a href="/sign-up?next=${encodeURIComponent("/account/quotes")}">Create an account</a> with ${escapeHtml(record.contact.email)} ${"to keep your future requests together under My quotes."}</p>`;
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
