// Enquiry and quote submission, download, and form draft helpers
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

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
  window.scrollTo(0, 0);
  const done = document.querySelector(".done");
  if (done) {done.setAttribute("tabindex", "-1"); done.focus({preventScroll: true});}
  openThanksModal();
}

async function submitQuote(form) {
  if (form.dataset.busy === "1") return;
  if (!Accounts.current()) { rerenderKeepScroll(pages.quote()); return; }
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
  window.scrollTo(0, 0);
  const done = document.querySelector(".done");
  if (done) {done.setAttribute("tabindex", "-1"); done.focus({preventScroll: true});}
  openThanksModal();
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
