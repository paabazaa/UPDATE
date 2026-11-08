// Pop-ups: log out, thank you and profile picture
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

// Asks "Are you sure?" before logging out. Yes logs out and opens the homepage; No (or Esc, or a click outside) changes nothing.
function closeLogoutModal() {
  const modal = document.getElementById("logout-modal");
  if (!modal) return;
  const opener = modal._opener;
  modal.remove();
  document.documentElement.classList.remove("modal-open");
  if (opener && document.contains(opener)) opener.focus();
}
function openLogoutModal() {
  if (document.getElementById("logout-modal")) return;
  const modal = document.createElement("div");
  modal.id = "logout-modal";
  modal.className = "modal-back";
  modal._opener = document.activeElement;
  modal.innerHTML = `<div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-text">
    <div class="modal-pic"><span class="thanks-tick logout-ico" aria-hidden="true">${dashIcon("logout")}</span></div>
    <h2 id="logout-title">Log out?</h2>
    <p id="logout-text" class="modal-sub">Are you sure you want to log out?</p>
    <div class="modal-actions row"><button type="button" class="btn lg" data-logout-yes>Yes</button><button type="button" class="btn lg line" data-logout-no>No</button></div>
  </div>`;
  document.body.appendChild(modal);
  document.documentElement.classList.add("modal-open");
  modal.querySelector("[data-logout-no]").focus();
}
function confirmLogout() {
  closeLogoutModal();
  Accounts.logout();
  const home = location.hash === "" || location.hash === "#" || location.hash === "#/";
  location.hash = "#/";
  if (home) route();
  window.scrollTo(0, 0);
}
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeLogoutModal();
  if (event.key === "Tab") {
    const modal = document.getElementById("logout-modal");
    if (!modal) return;
    const items = [...modal.querySelectorAll("button")];
    const at = items.indexOf(document.activeElement);
    if (event.shiftKey && at <= 0) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && at === items.length - 1) { event.preventDefault(); items[0].focus(); }
  }
});
document.addEventListener("click", event => {
  if (event.target.closest("[data-logout-yes]")) confirmLogout();
  else if (event.target.closest("[data-logout-no]") || event.target.id === "logout-modal") closeLogoutModal();
});
// Pop-up shown after a quote request or an enquiry has been sent and saved.
function closeThanksModal() {
  const modal = document.getElementById("thanks-modal");
  if (!modal) return;
  modal.remove();
  document.documentElement.classList.remove("modal-open");
}
function openThanksModal() {
  if (document.getElementById("thanks-modal")) return;
  const modal = document.createElement("div");
  modal.id = "thanks-modal";
  modal.className = "modal-back";
  modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="thanks-title" aria-describedby="thanks-text">
    <button type="button" class="modal-x" data-thanks-close aria-label="Close">&times;</button>
    <div class="modal-pic"><span class="thanks-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></div>
    <h2 id="thanks-title">Thank You!</h2>
    <p id="thanks-text" class="modal-sub">Your request has been successfully received and is currently being processed. You will be notified shortly</p>
    <div class="modal-actions"><button type="button" class="btn lg" data-thanks-close>OK</button></div>
  </div>`;
  document.body.appendChild(modal);
  document.documentElement.classList.add("modal-open");
  const ok = modal.querySelector(".btn");
  if (ok) ok.focus();
}
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeThanksModal();
});
document.addEventListener("click", event => {
  if (event.target.closest("[data-thanks-close]") || event.target.id === "thanks-modal") closeThanksModal();
});
// Pop-up shown when the profile picture is clicked: the picture, who it belongs to, and an Update button.
function closeAvatarModal() {
  const modal = document.getElementById("avatar-modal");
  if (!modal) return;
  const opener = modal._opener;
  modal.remove();
  document.documentElement.classList.remove("modal-open");
  if (opener && document.contains(opener)) opener.focus();
}
function openAvatarModal() {
  const user = Accounts.current();
  if (!user || document.getElementById("avatar-modal")) return;
  const modal = document.createElement("div");
  modal.id = "avatar-modal";
  modal.className = "modal-back";
  modal._opener = document.activeElement;
  modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
    <button type="button" class="modal-x" data-modal-close aria-label="Close">&times;</button>
    <div class="modal-pic">${avatarHtml(user, "xxl")}</div>
    <h2 id="avatar-modal-title">${escapeHtml(user.name || "Your profile")}</h2>
    <p class="modal-sub">${[user.email, user.organisation].filter(Boolean).map(escapeHtml).join(" · ")}</p>
    <div class="modal-actions"><button type="button" class="btn lg" data-modal-update>${dashIcon("camera")}${user.avatar ? "Update picture" : "Add picture"}</button>${user.avatar ? '<button type="button" class="btn line" data-avatar-remove>Remove picture</button>' : ""}</div>
  </div>`;
  document.body.appendChild(modal);
  document.documentElement.classList.add("modal-open");
  const first = modal.querySelector("[data-modal-update]");
  if (first) first.focus();
}
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeAvatarModal();
  if (event.key === "Tab") {
    const modal = document.getElementById("avatar-modal");
    if (!modal) return;
    const items = [...modal.querySelectorAll("button")];
    const at = items.indexOf(document.activeElement);
    if (event.shiftKey && at <= 0) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && at === items.length - 1) { event.preventDefault(); items[0].focus(); }
  }
});
document.addEventListener("click", event => {
  if (event.target.id === "avatar-modal") closeAvatarModal();
});
