// Account dashboard: home, profile, edit and orders
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

const DASH_ICONS = {
  overview: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
  profile: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  orders: '<path d="m7.5 4.3 9 5.2"/><path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
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
  // The first two letters of the name, in capitals: AKAERE becomes AK, and a one-letter name gives one letter.
  return Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
}
function accountShell(title, body) {
  const user = Accounts.current() || {};
  const path = currentPath();
  const home = path === "/account";
  const first = String(user.name || "").trim().split(/\s+/)[0] || "there";
  const item = (hrefPath, label, icon) => `<a href="${hrefPath}" class="${navOn(hrefPath, path) ? "active" : ""}"${navOn(hrefPath, path) ? ' aria-current="page"' : ""}>${dashIcon(icon)}<span>${label}</span></a>`;
  const eyebrow = home ? "Your account" : `<a href="/account">Your account</a><span aria-hidden="true"> / </span>${escapeHtml(title)}`;
  const sub = [user.email, user.organisation].filter(Boolean).map(escapeHtml).join(" · ");
  return `<section class="dash-hero"><div class="wrap dash-hero-in">
      <span class="avatar-wrap"><button type="button" class="avatar-open" data-avatar-open aria-label="View profile picture">${avatarHtml(user, "lg")}</button><label class="avatar-cam" for="avatar-file" title="Upload a profile picture" aria-label="Upload a profile picture">${dashIcon("camera")}</label><input type="file" id="avatar-file" accept="image/png,image/jpeg,image/webp" hidden></span>
      <div class="dash-who"><p class="eyebrow">${eyebrow}</p><h1>${home ? `Welcome back, ${escapeHtml(first)}` : escapeHtml(title)}</h1><p class="sub">${sub}</p></div>
      <div class="dash-actions"><a class="btn light" href="/generate-quote">${dashIcon("plus")}Generate quote</a><a class="btn ghost" href="/contact-us">Ask a question</a></div>
    </div></section>
    <section class="wrap dash"><nav class="dash-nav" aria-label="Account">
      ${item("/account", "Overview", "overview")}
      ${item("/account/quotes", "My quotes", "quotes")}
      ${item("/account/enquiries", "My enquiries", "enquiries")}
      ${item("/account/orders", "My orders", "orders")}
      ${item("/account/history", "Order history", "history")}
      ${item("/account/profile", "My profile", "profile")}
      ${item("/account/profile/edit", "Edit profile", "edit")}
      ${item("/account/settings", "Account settings", "settings")}
      <button type="button" class="navitem" data-logout>${dashIcon("logout")}<span>Log out</span></button>
      <a class="navitem-danger" href="/account/settings?delete=1">${dashIcon("trash")}<span>Delete account</span></a>
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
    ...Records.quotesFor(user.id).map(q => ({kind: "quote", id: q.id, when: q.createdAt, href: `/account/quotes/${encodeURIComponent(q.id)}`, icon: "quotes", title: `Quote request ${q.id}`, meta: `${q.lines.length} item${q.lines.length === 1 ? "" : "s"}`})),
    ...Records.enquiriesFor(user.id).map(n => ({kind: "enquiry", id: n.id, when: n.createdAt, href: `/account/enquiries/${encodeURIComponent(n.id)}`, icon: "enquiries", title: n.subject || "Enquiry", meta: n.id}))
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
    : `<div class="act-empty"><p><b>No activity yet</b></p><p>Quote requests and enquiries you send while signed in will appear here.</p><p><a class="btn" href="/generate-quote">Generate a quote</a></p></div>`;
  const where = [user.city, user.country].filter(Boolean).map(escapeHtml).join(", ");
  const row = (icon, label, value) => `<li>${dashIcon(icon)}<span><small>${label}</small>${value ? escapeHtml(value) : '<em>Not provided</em>'}</span></li>`;
  return accountShell("Your account", `${notice}
    <div class="statgrid dash-stats">
      <a class="stat" href="/account/quotes"><span class="stat-ico">${dashIcon("quotes")}</span><b>${quotes.length}</b><span class="stat-label">Quote requests</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
      <a class="stat" href="/account/enquiries"><span class="stat-ico">${dashIcon("enquiries")}</span><b>${enquiries.length}</b><span class="stat-label">Enquiries</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
      <a class="stat" href="/account/orders"><span class="stat-ico">${dashIcon("orders")}</span><b>${activity.length}</b><span class="stat-label">Orders</span><span class="stat-go">View all ${dashIcon("arrow")}</span></a>
    </div>
    <div class="dash-cols">
      <div class="box dash-card"><div class="card-head"><h2 class="h-sec">Recent activity</h2><span class="count-badge">${activity.length}</span></div>${activityHtml}</div>
      <div class="box dash-card"><div class="card-head"><h2 class="h-sec">Your details</h2><a class="tlink" href="/account/profile/edit">Edit</a></div>
        <ul class="detail-list">
          ${row("profile", "Name", user.name)}${row("quotes", "Organisation", user.organisation)}${row("pin", "Location", where)}${row("phone", "Phone number", user.phone)}
        </ul>
        <p class="dash-email">${escapeHtml(user.email)}</p>
      </div>
    </div>`);
}
function profileList(user) {
  const row = (label, value) => `<div><dt>${label}</dt><dd>${escapeHtml(value || "Not provided")}</dd></div>`;
  return `<dl class="kv">${row("Name", user.name)}${row("Email", user.email)}${row("Phone number", user.phone)}${row("Organisation", user.organisation)}${row("Country", user.country)}${row("City", user.city)}${row("Usual delivery location", user.deliveryLocation)}${row("Account created", formatWhen(user.createdAt))}</dl>`;
}
// Change-password card, shown on My profile and on Account settings. Messages appear inside the card, next to the button.
function passwordCard() {
  const user = Accounts.current();
  if (user && user.hasPassword === false) {
    return `<div class="box" id="password-card"><h2 class="h-sec">Password</h2>
      <p class="muted" style="font-size:14px;margin-top:8px">You sign in with Google or Facebook, so this account has no password. If you would also like to sign in with an email and password, <a href="/forgot-password">request a link to set one</a>.</p></div>`;
  }
  const msg = state.passwordMsg;
  const note = msg ? (msg.ok
    ? `<div class="note info" role="status" style="margin-top:12px"><p>${escapeHtml(msg.text)}</p></div>`
    : `<p class="err" role="alert" style="margin-top:12px">${escapeHtml(msg.text)}</p>`) : "";
  return `<div class="box" id="password-card"><form class="enq" id="password-form" novalidate>
    <h2 class="h-sec">Change password</h2>
    <p class="muted" style="font-size:14px">Changing your password signs you out on your other devices. Use at least 8 characters that you do not use anywhere else.</p>
    ${passwordField("currentPassword", "Current password", "current-password")}
    <div class="fields">${passwordField("nextPassword", "New password", "new-password")}${passwordField("confirmPassword", "Confirm new password", "new-password")}</div>
    ${note}
    <div><button class="btn lg" type="submit">Update password</button></div>
  </form></div>`;
}
function accountProfile() {
  const user = Accounts.current();
  return accountShell("My profile", `<div class="box"><h2 class="h-sec">Profile</h2>
    <p class="muted" style="margin-top:8px;font-size:14px">The email address is the sign-in name and cannot be changed here.</p>${profileList(user)}<a class="btn" href="/account/profile/edit" style="margin-top:16px">Edit profile</a></div>
    <div style="margin-top:24px">${passwordCard()}</div>`);
}
function accountEdit() {
  const user = Accounts.current();
  const notice = state.notice ? `<div class="note info" role="status"><p>${escapeHtml(state.notice)}</p></div>` : "";
  const error = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  const photo = `<div class="photo-card"><div class="photo-preview"><button type="button" class="avatar-open" data-avatar-open aria-label="View profile picture">${avatarHtml(user, "xl")}</button></div><div class="photo-text"><h2 class="h-sec">Profile picture</h2><p class="muted">JPEG, PNG or WebP. The picture is resized to fit and stored with your account.</p><div class="photo-actions"><label class="btn" for="avatar-file" role="button" tabindex="0">${dashIcon("camera")}${user.avatar ? "Change picture" : "Upload picture"}</label>${user.avatar ? `<button type="button" class="btn line" data-avatar-remove>Remove picture</button>` : ""}</div></div></div>`;
  return accountShell("Edit profile", `${notice}${error}${photo}<form class="enq" id="profile-form" novalidate>
    <div class="fields">
      <div class="fld"><label for="name">Full name <span class="req">*</span></label>
      <input id="name" name="name" maxlength="255" autocomplete="name" value="${escapeHtml(user.name)}">${fieldError("name")}</div>
      <div class="fld"><label for="email">Email address</label>
        <input id="email" name="email" value="${escapeHtml(user.email)}" disabled><p class="muted" style="margin-top:6px;font-size:12px">Used to sign in.</p>
        </div>
      <div class="fld"><label for="phone">Phone number</label>
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
      <p style="margin-top:16px"><a class="btn" href="/generate-quote">Generate quote</a></p>
      </div>`);
  }
  return accountShell("My orders", `${notice}<div class="box dash-card"><div class="card-head"><h2 class="h-sec">All orders</h2><span class="count-badge">${list.length}</span></div>${activityList(list)}</div>`);
}
