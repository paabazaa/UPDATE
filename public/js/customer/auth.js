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
  const accountDesktop = user
    ? `<a class="hbtn solid-soft desk-only" href="/account">${avatarHtml(user, "sm")}My account</a><button type="button" class="hbtn plain desk-only" data-logout>Log out</button>`
    : `<a class="hbtn plain desk-only${act("/login")}" href="/login">Login</a><a class="hbtn outline desk-only${act("/sign-up")}" href="/sign-up">Create account</a>`;
  const accountMobile = user
    ? `<a href="/account">My account</a><a href="/account/quotes">My quotes</a><a href="/account/enquiries">My enquiries</a><a href="/account/orders">My orders</a><button type="button" class="linkish" data-logout>Log out</button>`
    : `<a href="/login">Login</a><a href="/sign-up">Create account</a>`;
  return `<header class="site" id="hdr"><div class="wrap hbar">
    <a class="logo" href="/" aria-label="${company.name} home"><img src="${imageUrl("logo")}" alt="SURGICISS — Empowering healing hands; one innovation at a time." width="760" height="192" decoding="async"></a>
    <div class="htools">
      ${searchBox("desk-only")}
      ${accountDesktop}
      <a class="hbtn primary desk-only" href="/generate-quote">${icons.plus}Generate quote</a>
      <button type="button" class="menubtn" id="menubtn" aria-expanded="${state.mobile}" aria-controls="mobnav">${state.mobile ? icons.close : icons.menu}Menu</button>
      ${themeButton()}
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
    title: "LOGIN",
    lead: "Sign in to open your dashboard, quotes and enquiries.",
    perks: ["Review your saved quotes", "Follow up your enquiries", "Keep your delivery details ready"],
    heading: "Sign in to your account",
    fine: AUTH_FINE(),
    body: `<form class="enq login-form" id="login-form" novalidate>
          ${formError}
          <div class="fld"><label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="username" maxlength="255" placeholder="you@example.com">${fieldError("email")}</div>
          ${passwordField("password", "Password", "current-password")}
          <p class="forgot-row"><a href="${withNext("/forgot-password")}">Forgot password?</a></p>
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
    title: "SIGN UP",
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
