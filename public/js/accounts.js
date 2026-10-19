// Browser-side account store. This is an interface for a future server,
// not secure authentication. Anyone with access to this browser can read it.
const localAccounts = (() => {
  const KEY = "surgiciss-accounts";
  const SESSION = "surgiciss-session";

  function read() {
    try {return JSON.parse(localStorage.getItem(KEY)) || [];}
    catch (e) {return [];}
  }
  function write(list) {localStorage.setItem(KEY, JSON.stringify(list));}
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  async function digest(password, salt) {
    const material = salt + "\n" + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 2166136261;
    for (let i = 0; i < material.length; i++) {
      h ^= material.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "local-" + (h >>> 0).toString(16);
  }
  function present(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      organisation: user.organisation || "",
      country: user.country || "",
      city: user.city || "",
      deliveryLocation: user.deliveryLocation || "",
      createdAt: user.createdAt
    };
  }
  function current() {
    let id = "";
    try {id = localStorage.getItem(SESSION) || "";}
    catch (e) {return null;}
    if (!id) return null;
    const user = present(read().find(item => item.id === id));
    if (user && window.Records) Records.claim(user);
    return user;
  }
  async function register(input) {
    const email = String(input.email || "").trim().toLowerCase();
    const name = String(input.name || "").trim();
    const password = String(input.password || "");
    const list = read();
    if (name.length < 2) return {ok: false, error: "Please tell us your name."};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {ok: false, error: "Please enter a valid email address."};
    if (password.length < 8) return {ok: false, error: "Use at least 8 characters. Choose a password you do not use anywhere else."};
    if (password !== input.confirm) return {ok: false, error: "The two passwords do not match."};
    if (list.some(user => user.email === email)) {
      return {ok: false, error: "An account with that email is already stored in this browser. Try logging in."};
    }
    const salt = uid();
    const user = {
      id: uid(),
      name,
      email,
      phone: String(input.phone || "").trim(),
      organisation: String(input.organisation || "").trim(),
      country: String(input.country || "").trim(),
      city: String(input.city || "").trim(),
      deliveryLocation: String(input.deliveryLocation || "").trim(),
      salt,
      passwordHash: await digest(password, salt),
      createdAt: new Date().toISOString()
    };
    list.push(user);
    write(list);
    localStorage.setItem(SESSION, user.id);
    if (window.Records) Records.claim(present(user));
    return {ok: true, user: present(user)};
  }
  async function login(email, password) {
    const normalised = String(email || "").trim().toLowerCase();
    const user = read().find(item => item.email === normalised);
    const fail = {ok: false, error: "Those details do not match an account stored in this browser."};
    if (!user) return fail;
    const passwordHash = await digest(String(password || ""), user.salt);
    if (passwordHash !== user.passwordHash) return fail;
    localStorage.setItem(SESSION, user.id);
    if (window.Records) Records.claim(present(user));
    return {ok: true, user: present(user)};
  }
  function logout() {
    try {localStorage.removeItem(SESSION);}
    catch (e) { /* ignore private-mode failures */}
  }
  async function updateProfile(patch) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const index = list.findIndex(user => user.id === id);
    if (index < 0) return {ok: false, error: "Please log in again."};
    const name = String(patch.name || "").trim();
    if (name.length < 2) return {ok: false, error: "Please keep a name on the account."};
    list[index].name = name;
    ["phone", "organisation", "country", "city", "deliveryLocation"].forEach(key => {
      list[index][key] = String(patch[key] || "").trim();
    });
    write(list);
    return {ok: true, user: present(list[index])};
  }
  async function changePassword(currentPassword, nextPassword, confirm) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const index = list.findIndex(user => user.id === id);
    if (index < 0) return {ok: false, error: "Please log in again."};
    const check = await digest(String(currentPassword || ""), list[index].salt);
    if (check !== list[index].passwordHash) return {ok: false, error: "The current password is not correct."};
    if (String(nextPassword || "").length < 8) return {ok: false, error: "Use at least 8 characters for the new password."};
    if (nextPassword !== confirm) return {ok: false, error: "The new passwords do not match."};
    list[index].salt = uid();
    list[index].passwordHash = await digest(nextPassword, list[index].salt);
    write(list);
    return {ok: true};
  }
  async function removeAccount(password) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const user = list.find(item => item.id === id);
    if (!user) return {ok: false, error: "Please log in again."};
    const check = await digest(String(password || ""), user.salt);
    if (check !== user.passwordHash) return {ok: false, error: "The password is not correct, so the account was left as it is."};
    write(list.filter(item => item.id !== id));
    localStorage.removeItem(SESSION);
    if (window.Records) Records.purgeUser(id);
    return {ok: true};
  }
  const notAvailable = {ok: false, error: "Password reset needs the SURGICISS server. It is not connected on this site yet."};
  return {
    current, register, login, logout, updateProfile, changePassword, removeAccount,
    pending: () => false,
    providers: () => [],
    ready: Promise.resolve(),
    forgot: async () => ({ok: true}),
    resetPassword: async () => notAvailable
  };
})();

// Server mode: accounts live in the database and the browser holds only a secure session cookie.
const serverAccounts = (() => {
  let user = null;
  let loading = true;
  let providers = [];

  const ready = (async () => {
    const offered = await Api.get("/auth/oauth/providers", 6000);
    if (offered.ok) providers = offered.data.providers || [];
    const me = await Api.get("/auth/me", 6000);
    if (me.ok && me.data.user) {
      user = me.data.user;
      await Records.sync();
    }
  })().catch(() => { /* treat as signed out */}).then(() => { loading = false; });

  async function enter(data) {
    user = data.user;
    await Records.sync();
    return {ok: true, user};
  }
  const plain = result => (result.ok ? {ok: true, user} : {ok: false, error: result.error});

  return {
    current: () => user,
    pending: () => loading,
    providers: () => providers,
    ready,
    async register(input) {
      const result = await Api.post("/auth/signup", input);
      return result.ok ? enter(result.data) : {ok: false, error: result.error};
    },
    async login(email, password) {
      const result = await Api.post("/auth/login", {email, password});
      return result.ok ? enter(result.data) : {ok: false, error: result.error};
    },
    logout() {
      user = null;
      Records.reset();
      Api.post("/auth/logout");
    },
    async updateProfile(patch) {
      const result = await Api.patch("/auth/profile", patch);
      if (result.ok) user = result.data.user;
      return plain(result);
    },
    async changePassword(currentPassword, nextPassword, confirm) {
      return plain(await Api.post("/auth/password", {currentPassword, nextPassword, confirm}));
    },
    async removeAccount(password, confirmText) {
      const result = await Api.post("/auth/delete", {password, confirmText});
      if (result.ok) {
        user = null;
        Records.reset();
      }
      return plain(result);
    },
    async forgot(email) {
      return plain(await Api.post("/auth/forgot", {email}));
    },
    async resetPassword(token, password, confirm) {
      return plain(await Api.post("/auth/reset", {token, password, confirm}));
    }
  };
})();

const Accounts = Api.enabled ? serverAccounts : localAccounts;
window.Accounts = Accounts;
