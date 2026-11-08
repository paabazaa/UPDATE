// Wires the account features into the page (installCustomer)
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

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

  const refreshAccount = () => rerenderKeepScroll(accountView(currentPath()));
  document.addEventListener("click", async event => {
    const del = event.target.closest("[data-del]");
    const delYes = event.target.closest("[data-del-yes]");
    const delNo = event.target.closest("[data-del-no]");
    const removePhoto = event.target.closest("[data-avatar-remove]");
    const csvButton = event.target.closest("[data-hist-csv]");
    if (event.target.closest("[data-avatar-open]")) { openAvatarModal(); return; }
    if (event.target.closest("[data-modal-close]")) { closeAvatarModal(); return; }
    if (event.target.closest("[data-modal-update]")) {
      const input = document.getElementById("avatar-file");
      closeAvatarModal();
      if (input) input.click();
      return;
    }
    if (removePhoto) closeAvatarModal();
    if (csvButton) {
      const url = URL.createObjectURL(new Blob([historyCsv(csvButton.dataset.histCsv)], {type: "text/csv;charset=utf-8"}));
      const link = document.createElement("a");
      link.href = url; link.download = "surgiciss-order-history.csv";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }
    if (del) {state.confirmDelete = del.dataset.del; state.notice = ""; state.deleteError = ""; refreshAccount(); return;}
    if (delNo) {state.confirmDelete = null; refreshAccount(); return;}
    if (delYes) {
      const [kind, ...rest] = delYes.dataset.delYes.split(":");
      let result;
      try {
        result = typeof Records.remove === "function"
          ? await Records.remove(kind, rest.join(":"))
          : {ok: false, error: "This page is out of date. Please refresh it (Ctrl+F5) and try again."};
      } catch (err) {
        result = {ok: false, error: "The item could not be deleted. Please try again."};
      }
      state.confirmDelete = null;
      state.notice = result.ok ? "Deleted. The list and the orders count are up to date." : "";
      state.deleteError = result.ok ? "" : (result.status === 404 || result.error === "Not found."
        ? "That item could not be deleted. Please try again in a little while."
        : (result.error || "The item could not be deleted. Please try again."));
      refreshAccount();
      return;
    }
    if (removePhoto) {
      const result = await Accounts.removeAvatar();
      state.notice = result.ok ? "Your profile picture has been removed." : "";
      state.pictureError = result.ok ? "" : pictureProblem(result.error);
      refreshAccount();
      return;
    }
    const add = event.target.closest("#add-line");
    const remove = event.target.closest("[data-remove-line]");
    const download = event.target.closest("[data-download]");
    const logout = event.target.closest("[data-logout]");
    const reveal = event.target.closest("[data-toggle-password]");
    if (reveal) {
      const input = reveal.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      reveal.innerHTML = show ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.7 10.7 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.1-5.9M9.9 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/></svg>` : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
      reveal.setAttribute("aria-label", show ? "Hide password" : "Show password");
      reveal.setAttribute("aria-pressed", show ? "true" : "false");
      return;
    }
    if (add) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      state.quoteHold.lines.push({ref: "", qty: "1", note: ""});
      rerenderKeepScroll(pages.quote());
    } else if (remove && !remove.disabled) {
      const form = document.getElementById("quote-form");
      state.quoteHold = readQuoteForm(form);
      const index = Number(remove.dataset.removeLine);
      if (state.quoteHold.lines.length > 1) state.quoteHold.lines.splice(index, 1);
      rerenderKeepScroll(pages.quote());
    } else if (download) {
      downloadQuote(download.dataset.download);
    } else if (logout) {
      openLogoutModal();
    }
  });

  document.addEventListener("input", event => {
    const form = event.target.closest("#quote-form");
    if (!form) return;
    state.quoteHold = readQuoteForm(form);
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
