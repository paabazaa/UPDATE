// Header for signed-in visitors, and the login, sign-up, forgot and reset pages
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

function customerHeader() {
  const path = currentPath();
  const act = item => (item === "/" ? path === "/" : path === item || path.startsWith(item + "/")) ? " active" : "";
  const dd = (key, label, links, allTo, allLabel) => `<div class="dd" data-dd="${key}"><a class="tl${act(allTo)}" href="${href(allTo)}">${label}</a><button type="button" class="tl" aria-label="Show ${label} menu" aria-expanded="false" data-toggle="${key}">${icons.down}</button><div class="panel">${links.map(link => `<a class="pi-link" href="${href(link.to)}"><span class="pi">${icons[link.icon || "layers"]}</span><span class="pt"><b>${escapeHtml(link.label)}</b>${link.summary ? `<small>${escapeHtml(link.summary)}</small>` : ""}</span></a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}${icons.arrow}</a></div></div>`;
  const clip = text => (text.length > 70 ? text.slice(0, 67).replace(/\s+\S*$/, "") + "…" : text);
  const softwareLinks = software.map(item => ({label: item.name, to: "/software/" + item.slug, summary: clip(item.summary), icon: "layers"}));
  const productLinks = products.map(item => ({label: item.name, to: "/products/" + item.slug, summary: clip(item.summary), icon: "box"}));
  const mgroup = (label, links, allTo, allLabel) => `<div class="mg"><div class="mrow"><a href="${href(allTo)}">${label}</a><button type="button" class="mt" aria-label="Show ${label} menu" aria-expanded="false" data-mtoggle>${icons.down}</button></div><div class="msub" hidden>${links.map(link => `<a href="${href(link.to)}">${escapeHtml(link.label)}</a>`).join("")}<a class="all" href="${href(allTo)}">${allLabel}</a></div></div>`;
  const user = Accounts.current();
  // Signed-in people get their profile in the top right corner with a menu; Log out is always the last choice.
  const menuLinks = [["/account", "Overview"], ["/account/quotes", "My quotes"], ["/account/enquiries", "My enquiries"], ["/account/orders", "My orders"], ["/account/history", "Order history"], ["/account/profile", "My profile"], ["/account/settings", "Account settings"]];
  const menuIcons = ["overview", "quotes", "enquiries", "orders", "history", "profile", "settings"];
  const firstName = user ? (String(user.name || "").trim().split(/\s+/)[0] || "My account") : "";
  const profileMenu = user
    ? `<div class="umenu"><button type="button" class="umenu-btn" data-umenu aria-haspopup="menu" aria-expanded="false" aria-label="Your account menu, ${escapeHtml(firstName)}">${avatarHtml(user, "hd")}${icons.down}</button>
      <div class="umenu-panel" role="menu" hidden><p class="umenu-who"><strong>${escapeHtml(user.name || "Your account")}</strong><span>${escapeHtml(user.email || "")}</span></p>${menuLinks.map(([to, label], i) => `<a role="menuitem" href="${to}"${currentPath() === to ? ' aria-current="page"' : ""}><span class="pi">${dashIcon(menuIcons[i])}</span><span>${label}</span></a>`).join("")}<button type="button" role="menuitem" class="umenu-out" data-logout><span class="pi">${dashIcon("logout")}</span><span>Log out</span></button></div></div>`
    : "";
  const accountDesktop = user
    ? ""
    : `<a class="hbtn plain desk-only${act("/login")}" href="/login">Login</a><a class="hbtn outline desk-only${act("/sign-up")}" href="/sign-up">Create account</a>`;
  const accountMobile = user
    ? `${menuLinks.map(([to, label]) => `<a href="${to}">${label}</a>`).join("")}<button type="button" class="linkish" data-logout>Log out</button>`
    : `<a href="/login">Login</a><a href="/sign-up">Create account</a>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="640" height="177" decoding="async"></a>
    <div class="htools">
      ${searchBox()}
      ${accountDesktop}
      <a class="hbtn primary desk-only" href="/generate-quote">${icons.plus}Generate quote</a>
      <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav" aria-label="${state.mobile ? "Close menu" : "Open menu"}">${state.mobile ? icons.close : icons.menu}</button>
      ${themeButton()}
      ${profileMenu}
    </div>
  </div>
  <div class="navrow"><nav class="main" aria-label="Main navigation">
      <a class="tl home${act("/")}" href="/" aria-label="Home" title="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg></a>
      ${dd("software", "Software", softwareLinks, "/software", "All Software")}
      ${dd("products", "Products", productLinks, "/products", "All Products")}
      <a class="tl${act("/count-sheet-holders")}" href="/count-sheet-holders">Instrument Count Sheet Holders</a>
      <a class="tl${act("/contact-us")}" href="/contact-us">Contact Us</a>
    </nav>
        </div>
    <div class="mobile-cta"><a class="mc-primary" href="/generate-quote">${icons.plus}Generate quote</a><a class="mc-second" href="/contact-us">Ask a question</a></div>
    ${state.mobile ? `<div id="mobnav"><nav class="wrap" aria-label="Mobile navigation"><a class="homelink" href="/" aria-label="Home"><svg class="ico" style="margin:0;width:20px;height:20px" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg><span>Home</span></a>${mgroup("Software", softwareLinks, "/software", "All Software")}${mgroup("Products", productLinks, "/products", "All Products")}<a href="/count-sheet-holders">Instrument Count Sheet Holders</a><a href="/services">Services</a><a href="/programmes">Programmes</a><a href="/about">About</a><a href="/contact-us">Contact Us</a>${accountMobile}<a class="quote" href="/generate-quote">Generate quote</a><a class="ask" href="/contact-us">Ask a question</a></nav>
      </div>` : ""}
  </header>`;
}

function authCard(title, lead, body) {
  return authBox({title: title.toUpperCase(), lead, body: `${localNotice()}${body}`});
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
// One centred card for every sign-in page: a large glowing title, a short line, a link to the other page, then the form.
function authBox({title, lead, switchLine = "", body}) {
  return `<section class="login-page"><div class="wrap">
    <div class="auth-box">
      <h1 class="auth-title">${title}</h1>
      <p class="auth-lead">${lead}</p>
      ${switchLine ? `<p class="auth-switch">${switchLine}</p>` : ""}
      ${body}
    </div>
  </div></section>`;
}
const AUTH_ICON = {
  mail: `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`,
  lock: `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  user: `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  phone: `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`,
  building: `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M19 21V11a2 2 0 0 0-2-2h-2M9 7h2M9 11h2M9 15h2"/></svg>`
};
const EYE_BUTTON = `<button class="pw-toggle" type="button" data-toggle-password aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button>`;
// A labelled box with a small symbol at its left edge.
function authField({id, label, icon, type = "text", autocomplete = "off", placeholder = "", required = false, toggle = false, max = 255}) {
  return `<div class="fld auth-fld"><label for="${id}">${label}${required ? ' <span class="req">*</span>' : ""}</label>
    <div class="auth-input">${AUTH_ICON[icon]}<input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" maxlength="${max}" placeholder="${placeholder}">${toggle ? EYE_BUTTON : ""}</div>${fieldError(id)}</div>`;
}
const passwordField = (id, label, autocomplete, placeholder = "", required = false) => authField({id, label, icon: "lock", type: "password", autocomplete, placeholder, required, toggle: true, max: 128});
function loginPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err login-error" role="alert">${escapeHtml(message)}</p>` : "";
  const social = socialButtons("", "after");
  return authBox({
    title: "LOGIN",
    lead: "Access your SURGICISS account",
    switchLine: `New user? <a href="${withNext("/sign-up")}">Create an account</a>`,
    body: `<form class="enq login-form" id="login-form" novalidate>
          ${formError}
          ${authField({id: "email", label: "Email address", icon: "mail", type: "email", autocomplete: "username", placeholder: "you@example.com"})}
          ${passwordField("password", "Password", "current-password", "Your password")}
          <p class="forgot-row"><a href="${withNext("/forgot-password")}">Forgot password?</a></p>
          <button class="btn lg login-submit" type="submit">LOGIN</button>
        </form>
        ${social || `<p class="or"><span>OR</span></p>`}
        <p class="login-alt">Don't have an account? <a href="${withNext("/sign-up")}">Sign up</a></p>`
  });
}
function signupPage() {
  const message = state.authError || socialError();
  const formError = message ? `<p class="err login-error" role="alert">${escapeHtml(message)}</p>` : "";
  const social = socialButtons("", "after", "or sign up with");
  return authBox({
    title: "CREATE ACCOUNT",
    lead: "Create an account to keep your quotes and enquiries in one place",
    switchLine: `Already have an account? <a href="${withNext("/login")}">Sign in here</a>`,
    body: `<form class="enq login-form" id="signup-form" novalidate>
          ${formError}
          <div class="fields">
            ${authField({id: "first", label: "First name", icon: "user", autocomplete: "given-name", placeholder: "First name", required: true}).replace(fieldError("first"), fieldError("name"))}
            ${authField({id: "last", label: "Last name", icon: "user", autocomplete: "family-name", placeholder: "Last name"})}
            ${authField({id: "email", label: "Email address", icon: "mail", type: "email", autocomplete: "email", placeholder: "you@example.com", required: true})}
            ${authField({id: "phone", label: "Phone number", icon: "phone", type: "tel", autocomplete: "tel", placeholder: "Phone number"})}
            ${authField({id: "organisation", label: "Organisation", icon: "building", autocomplete: "organization", placeholder: "Your organisation"})}
            ${passwordField("password", "Password", "new-password", "At least 8 characters", true)}
            ${passwordField("confirm", "Confirm password", "new-password", "Repeat the password", true)}
            ${Places.countryField("")}
            ${Places.cityField("", "")}
          </div>
          <label class="auth-terms"><input type="checkbox" id="terms" name="terms" value="yes"><span>I agree to the <a href="/terms">Terms of use</a> and <a href="/privacy">Privacy notice</a></span></label>${fieldError("terms")}
          <button class="btn lg login-submit" type="submit">CREATE ACCOUNT</button>
        </form>
        ${social || `<p class="or"><span>OR</span></p>`}
        <p class="login-alt">Already have an account? <a href="${withNext("/login")}">Sign in</a></p>`
  });
}
function forgotPage() {
  if (state.forgotSent) {
    return authCard("Forgot password", "Check your email for the next step.", `<div class="done" role="status"><h2>Check your email.</h2>
      <p>If an account exists for that address, we have sent a link to choose a new password. The link works once and expires after 30 minutes. This page does not reveal whether the address is on file.</p>
      <p style="margin-top:12px"><a href="${withNext("/login")}">Back to login</a></p></div>`);
  }
  const user = Accounts.current();
  const signedIn = user ? `<p class="muted" style="font-size:14px">You are already signed in. You can change the password from <a href="/account/settings">Account settings</a>.</p>` : "";
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
      <p style="margin-top:12px"><a class="btn" href="/login">Login</a></p></div>`);
  }
  const formError = state.authError ? `<p class="err" role="alert">${escapeHtml(state.authError)}</p>` : "";
  if (!currentQuery().get("token")) {
    return authCard("Choose a new password", "This link is incomplete.", `<div class="done"><p>Open the link from the reset email again, or <a href="/forgot-password">request a new one</a>.</p></div>`);
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
