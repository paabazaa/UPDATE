// Enquiry form pieces and validation
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

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
    const result = state.submitResult || {};
    return `<div class="done" role="status"><h2>Your enquiry has been sent.</h2><p>SURGICISS has received it. Keep the reference if you need to follow it up. The team can reply using the contact method you chose.</p>${result.id ? `<p>Reference <strong>${escapeHtml(result.id)}</strong>.</p>` : ""}<p><button class="btn line" id="again" type="button">Send another enquiry</button></p></div>`;
  }
  return `<form class="enq" id="enquiry" data-variant="${variant}" novalidate>
    ${state.errors.form ? `<p class="err login-error" role="alert">${escapeHtml(state.errors.form)}</p>` : ""}
    <div class="fields">${field("Full name", "name", {req: 1})}${field("Email address", "email", {type: "email", req: 1})}${field("Phone number", "phone")}${field("Organisation", "organisation", {req: 1})}${Places.countryField("", {required: true, error: state.errors.country ? `<p class="err">${state.errors.country}</p>` : ""})}${Places.cityField("", "")}</div>
    <div class="fields"><div class="fld"><label for="interest">Your enquiry relates to <span class="req">*</span></label>
      <select id="interest" name="interest"><option value="">Please choose…</option>${interestGroups().map(g => `<optgroup label="${g.g}">${g.items.map(i => `<option value="${escapeHtml(i)}"${i === defaultInterest ? " selected" : ""}>${escapeHtml(i)}</option>`).join("")}</optgroup>`).join("")}</select>${state.errors.interest ? `<p class="err">${state.errors.interest}</p>` : ""}</div>
    ${variant === "quote" ? field("Quantity required", "quantity", {ph: "e.g. 200"}) : "<div></div>"}</div>
    ${variant === "contact" ? `<div class="fld"><label for="subject">Subject <span class="req">*</span></label>
      <input id="subject" name="subject" type="text" maxlength="160" autocomplete="off" placeholder="What would you like to ask?">${state.errors.subject ? `<p class="err">${state.errors.subject}</p>` : ""}</div>` : ""}
    <fieldset class="fld"><legend>Preferred contact method</legend><div class="radios">${["Email", "Phone", "Either"].map((m, i) => `<label><input type="radio" name="preferredContact" value="${m}"${i === 0 ? " checked" : ""}>${m}</label>`).join("")}</div></fieldset>
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
