// Helpers shared by the account and quote pages
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

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
  state.passwordMsg = null;
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
  return next ? path + "?next=" + encodeURIComponent(safeNext(next)) : path;
}
function goNext(fallback) {
  navigate(safeNext(currentQuery().get("next") || fallback || "/account"));
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
