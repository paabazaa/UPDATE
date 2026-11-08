// Account actions: login, sign up, reset, profile, password, delete, picture upload
// Part of the customer scripts. Loaded in order by index.html; they share one global scope.

async function submitLogin(form) {
  if (form.dataset.busy === "1") return;
  form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.login(data.email || "", data.password || "");
  form.dataset.busy = "";
  if (!result.ok) {
    state.authError = result.error;
    rerenderKeepScroll(loginPage());
    const email = document.querySelector("#login-form [name=email]");
    if (email) {email.value = data.email || ""; email.focus();}
    return;
  }
  state.authError = "";
  goNext("/account");
}
async function submitSignup(form) {
  if (form.dataset.busy === "1") return;
  form.dataset.busy = "1";
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.register(data);
  form.dataset.busy = "";
  if (!result.ok) {
    state.authError = result.error;
    rerenderKeepScroll(signupPage());
    ["name", "email", "organisation", "phone", "country"].forEach(key => {
      const input = document.querySelector(`#signup-form [name=${key}]`);
      if (input) input.value = data[key] || "";
    });
    return;
  }
  state.authError = "";
  goNext("/account");
}
async function submitForgot(form) {
  if (form.dataset.busy === "1") return;
  const email = String((form.elements.email && form.elements.email.value) || "").trim();
  state.errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    state.authError = "Please enter the email address on the account.";
    rerenderKeepScroll(forgotPage());
    return;
  }
  form.dataset.busy = "1";
  const result = await Accounts.forgot(email);
  form.dataset.busy = "";
  state.authError = result.ok ? "" : result.error;
  state.forgotSent = result.ok;
  rerenderKeepScroll(forgotPage());
}
async function submitReset(form) {
  if (form.dataset.busy === "1") return;
  const data = Object.fromEntries(new FormData(form).entries());
  form.dataset.busy = "1";
  const result = await Accounts.resetPassword(currentQuery().get("token") || "", data.password || "", data.confirm || "");
  form.dataset.busy = "";
  state.authError = result.ok ? "" : result.error;
  state.resetDone = result.ok;
  rerenderKeepScroll(resetPage());
}
async function submitProfile(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const result = await Accounts.updateProfile(data);
  if (!result.ok) {
    state.authError = result.error;
    state.notice = "";
  } else {
    state.authError = "";
    state.notice = "Your profile has been updated.";
  }
  rerenderKeepScroll(accountEdit());
}
async function submitPassword(form) {
  if (form.dataset.busy === "1") return;
  const data = Object.fromEntries(new FormData(form).entries());
  const show = (ok, text) => {
    state.passwordMsg = {ok, text};
    rerenderKeepScroll(accountView(currentPath()));
    const card = document.getElementById("password-card");
    if (card) card.scrollIntoView({block: "center"});
  };
  const current = String(data.currentPassword || ""), next = String(data.nextPassword || "");
  if (!current) return show(false, "Enter your current password.");
  if (next.length < 8) return show(false, "Use at least 8 characters for the new password.");
  if (next.length > 128) return show(false, "Use no more than 128 characters for the new password.");
  if (next !== String(data.confirmPassword || "")) return show(false, "The two new passwords do not match.");
  if (next === current) return show(false, "Choose a new password that is different from the current one.");
  form.dataset.busy = "1";
  const button = form.querySelector("button[type=submit]");
  if (button) {button.disabled = true; button.textContent = "Updating…";}
  let result;
  try {
    result = await Accounts.changePassword(current, next, data.confirmPassword);
  } catch (err) {
    result = {ok: false, error: "The password could not be changed. Please try again."};
  }
  if (result.ok) show(true, "Your password has been updated.");
  else show(false, result.error || "The password could not be changed. Please try again.");
}
async function submitDelete(form) {
  if (form.dataset.busy === "1") return;
  const data = Object.fromEntries(new FormData(form).entries());
  // Shows why the account was not deleted next to the button, where the person is looking.
  const refuse = message => {
    state.deleteError = message;
    state.notice = "";
    rerenderKeepScroll(accountSettings());
    const box = document.getElementById("delete-form");
    if (box) box.scrollIntoView({block: "center"});
  };
  state.deleteError = "";
  if (data.confirmDelete !== "yes") return refuse("Tick the box to confirm you want the account removed.");
  form.dataset.busy = "1";
  let result;
  try {
    result = await Accounts.removeAccount(data.password || "", data.confirmText || "");
  } catch (err) {
    result = {ok: false, error: "The account could not be deleted. Please try again."};
  }
  form.dataset.busy = "";
  if (!result.ok) return refuse(result.error || "The account could not be deleted. Please try again.");
  try {sessionStorage.setItem("surgiciss-flash", "Your account has been removed. You are back on the public site.");}
  catch (err) { /* ignore */}
  location.hash = "#/";
}

// Profile picture: the chosen file is cropped to a square and shrunk in the page before it is sent to the server.
function pictureToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 192, side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {URL.revokeObjectURL(url); reject(new Error("unreadable"));};
    img.src = url;
  });
}
// Server messages that are meant for the customer are shown as they are; anything technical becomes a plain sentence.
const pictureProblem = text => (/^(Please|That file|That picture|Too many)/.test(String(text || ""))
  ? text
  : "The picture could not be saved right now. Please try again in a little while.");
document.addEventListener("change", async event => {
  const input = event.target.closest && event.target.closest("#avatar-file");
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = "";
  state.notice = ""; state.authError = ""; state.pictureError = "";
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) state.pictureError = "Please choose a JPEG, PNG or WebP picture.";
  else if (file.size > 10 * 1024 * 1024) state.pictureError = "That picture is larger than 10 MB. Please choose a smaller one.";
  else {
    try {
      const result = await Accounts.setAvatar(await pictureToDataUrl(file));
      if (result.ok) state.notice = "Your profile picture has been updated."; else state.pictureError = pictureProblem(result.error);
    } catch (err) {
      state.pictureError = "That file could not be read as a picture. Please choose another.";
    }
  }
  rerenderKeepScroll(accountView(currentPath()));
  window.scrollTo({top: 0, behavior: "smooth"});
});
document.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches && event.target.matches("label[for=avatar-file]")) {
    event.preventDefault();
    const input = document.getElementById("avatar-file");
    if (input) input.click();
  }
});
