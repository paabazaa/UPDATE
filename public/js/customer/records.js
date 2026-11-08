// Account records: history, quotes, enquiries, settings and account routing
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

function historyCsv(filter) {
  const cell = value => '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  const rows = allActivity().filter(a => filter !== "quote" && filter !== "enquiry" ? true : a.kind === filter);
  return "\ufeffReference,Type,Details,Date,Status\r\n" + rows.map(a => [a.id, a.kind === "quote" ? "Quote request" : "Enquiry", a.kind === "quote" ? a.meta : a.title, a.when, "Received"].map(cell).join(",")).join("\r\n");
}
function accountHistory() {
  const all = allActivity();
  const show = currentQuery().get("show");
  const filter = show === "quote" || show === "enquiry" ? show : "all";
  const list = filter === "all" ? all : all.filter(a => a.kind === filter);
  const counts = {all: all.length, quote: all.filter(a => a.kind === "quote").length, enquiry: all.filter(a => a.kind === "enquiry").length};
  const tab = (key, label) => `<a class="hist-tab" href="#/account/history${key === "all" ? "" : "?show=" + key}" ${filter === key ? 'aria-current="page"' : ""}>${label}<span>${counts[key]}</span></a>`;
  if (!all.length) {
    return accountShell("Order history", `<div class="empty"><h2>No history yet</h2>
      <p>Every quote request and enquiry you send while signed in is kept here, newest first.</p>
      <p style="margin-top:16px"><a class="btn" href="#/generate-quote">Generate quote</a></p></div>`);
  }
  const monthOf = when => {
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? "Earlier" : d.toLocaleDateString("en-GB", {month: "long", year: "numeric"});
  };
  const groups = [];
  list.forEach(item => {
    const label = monthOf(item.when);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item); else groups.push({label, items: [item]});
  });
  const body = groups.length
    ? groups.map(g => `<div class="box dash-card hist-month"><div class="card-head"><h2 class="h-sec">${escapeHtml(g.label)}</h2><span class="count-badge">${g.items.length}</span></div>${activityList(g.items)}</div>`).join("")
    : `<div class="empty"><h2>Nothing here</h2><p>You have no ${filter === "quote" ? "quote requests" : "enquiries"} in your history.</p></div>`;
  return accountShell("Order history", `${listMessage()}<div class="hist-bar"><nav class="hist-tabs" aria-label="Filter history">${tab("all", "All")}${tab("quote", "Quote requests")}${tab("enquiry", "Enquiries")}</nav><button type="button" class="hist-dl" data-hist-csv="${filter}">${dashIcon("arrow")}<span>Download CSV</span></button></div>${body}`);
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
  return accountShell("Account settings", `${notice}${error}
    ${passwordCard()}
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
  if (path === "/account/history") return accountHistory();
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
    "/account/history": "Order history — SURGICISS LTD",
    "/account/quotes": "My quotes — SURGICISS LTD",
    "/account/enquiries": "My enquiries — SURGICISS LTD",
    "/account/settings": "Account settings — SURGICISS LTD"
  };
  if (titles[path]) return titles[path];
  if (path.startsWith("/account/quotes/")) return "Quote request — SURGICISS LTD";
  if (path.startsWith("/account/enquiries/")) return "Enquiry — SURGICISS LTD";
  return "Account — SURGICISS LTD";
}
