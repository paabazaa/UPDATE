// SURGICISS LTD - Professional Accounts v2
// Live mode: accounts in database, browser holds only secure session cookie.
// Local mode: for offline testing. Professional validation & purple UX.

const localAccounts = (() => {
  const KEY = "surgiciss-accounts";
  const SESSION = "surgiciss-session";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function write(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
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
      id: user.id, name: user.name, email: user.email,
      phone: user.phone || "", organisation: user.organisation || "",
      country: user.country || "", city: user.city || "",
      deliveryLocation: user.deliveryLocation || "",
      createdAt: user.createdAt
    };
  }
  function current() {
    let id = "";
    try { id = localStorage.getItem(SESSION) || ""; } catch { return null; }
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
    if (name.length < 2) return { ok: false, error: "Please enter your full name." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid company email." };
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    if (input.confirm && password !== input.confirm) return { ok: false, error: "Passwords do not match." };
    if (list.some(u => u.email === email)) return { ok: false, error: "Account already exists. Please log in." };
    const salt = uid();
    const user = {
      id: uid(), name, email,
      phone: String(input.phone || "").trim(),
      organisation: String(input.organisation || "").trim(),
      country: String(input.country || "").trim(),
      city: String(input.city || "").trim(),
      deliveryLocation: String(input.deliveryLocation || "").trim(),
      salt, passwordHash: await digest(password, salt),
      createdAt: new Date().toISOString()
    };
    list.push(user); write(list);
    localStorage.setItem(SESSION, user.id);
    if (window.Records) Records.claim(present(user));
    return { ok: true, user: present(user) };
  }
  async function login(email, password) {
    const normalised = String(email || "").trim().toLowerCase();
    const user = read().find(item => item.email === normalised);
    if (!user) return { ok: false, error: "No account found with that email." };
    const passwordHash = await digest(String(password || ""), user.salt);
    if (passwordHash !== user.passwordHash) return { ok: false, error: "Incorrect password." };
    localStorage.setItem(SESSION, user.id);
    if (window.Records) Records.claim(present(user));
    return { ok: true, user: present(user) };
  }
  function logout() { try { localStorage.removeItem(SESSION); } catch {} }
  async function updateProfile(patch) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const index = list.findIndex(u => u.id === id);
    if (index < 0) return { ok: false, error: "Please log in again." };
    const name = String(patch.name || "").trim();
    if (name.length < 2) return { ok: false, error: "Name is required." };
    list[index].name = name;
    ["phone", "organisation", "country", "city", "deliveryLocation"].forEach(k => { list[index][k] = String(patch[k] || "").trim(); });
    write(list);
    return { ok: true, user: present(list[index]) };
  }
  async function changePassword(currentPassword, nextPassword, confirm) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const index = list.findIndex(u => u.id === id);
    if (index < 0) return { ok: false, error: "Please log in again." };
    const check = await digest(String(currentPassword || ""), list[index].salt);
    if (check !== list[index].passwordHash) return { ok: false, error: "Current password is incorrect." };
    if (String(nextPassword || "").length < 8) return { ok: false, error: "New password must be 8+ characters." };
    if (nextPassword !== confirm) return { ok: false, error: "New passwords do not match." };
    list[index].salt = uid();
    list[index].passwordHash = await digest(nextPassword, list[index].salt);
    write(list); return { ok: true };
  }
  async function removeAccount(password) {
    const id = localStorage.getItem(SESSION);
    const list = read();
    const user = list.find(item => item.id === id);
    if (!user) return { ok: false, error: "Please log in again." };
    const check = await digest(String(password || ""), user.salt);
    if (check !== user.passwordHash) return { ok: false, error: "Password incorrect." };
    write(list.filter(item => item.id !== id));
    localStorage.removeItem(SESSION);
    if (window.Records) Records.purgeUser(id);
    return { ok: true };
  }
  return {
    current, register, login, logout, updateProfile, changePassword, removeAccount,
    setAvatar: async () => ({ ok: false, error: "Profile pictures need the live server." }),
    removeAvatar: async () => ({ ok: false, error: "Profile pictures need the live server." }),
    pending: () => false,
    providers: () => [],
    ready: Promise.resolve(),
    forgot: async () => ({ ok: true }),
    resetPassword: async () => ({ ok: false, error: "Password reset needs live server." }),
    hasProvider: () => false,
    oauthUrl: () => "#",
    loginWithProvider: () => ({ ok: false, error: "OAuth needs live server." })
  };
})();

// SERVER MODE - Professional
const serverAccounts = (() => {
  let user = null;
  let loading = true;
  let providers = [];
  let listeners = new Set();
  const notify = () => listeners.forEach(fn => fn(user));

  const ready = (async () => {
    try {
      const offered = await Api.get("/auth/oauth/providers", 6000);
      if (offered.ok) providers = offered.data.providers || [];
      const me = await Api.get("/auth/me", 6000);
      if (me.ok && me.data.user) {
        user = me.data.user;
        await Records.sync();
      }
    } catch {} finally {
      loading = false; notify();
    }
  })();

  async function enter(data) {
    user = data.user;
    await Records.sync();
    loading = false; notify();
    return { ok: true, user };
  }
  const plain = result => (result.ok ? { ok: true, user: result.data?.user || user } : { ok: false, error: result.error || "Request failed" });

  return {
    current: () => user,
    pending: () => loading,
    providers: () => providers,
    ready,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },

    async register(input) {
      const email = String(input.email || "").trim();
      if (!email.includes("@")) return { ok: false, error: "Enter a valid company email." };
      if (!input.password || input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
      const result = await Api.post("/auth/signup", input);
      return result.ok ? enter(result.data) : { ok: false, error: result.error };
    },
    async login(email, password) {
      if (!email || !password) return { ok: false, error: "Email and password are required." };
      const result = await Api.post("/auth/login", { email, password });
      return result.ok ? enter(result.data) : { ok: false, error: result.error || "Invalid credentials" };
    },
    logout() {
      user = null; Records.reset(); Api.post("/auth/logout"); notify();
    },
    async updateProfile(patch) {
      const result = await Api.patch("/auth/profile", patch);
      if (result.ok) { user = result.data.user; notify(); }
      return plain(result);
    },
    async setAvatar(image) {
      const result = await Api.post("/auth/avatar", {image});
      if (result.ok) user = result.data.user;
      return plain(result);
    },
    async removeAvatar() {
      const result = await Api.post("/auth/avatar/remove", {});
      if (result.ok) user = result.data.user;
      return plain(result);
    },
    async changePassword(currentPassword, nextPassword, confirm) {
      return plain(await Api.post("/auth/password", { currentPassword, nextPassword, confirm }));
    },
    async removeAccount(password, confirmText) {
      const result = await Api.post("/auth/delete", { password, confirmText });
      if (result.ok) { user = null; Records.reset(); notify(); }
      return plain(result);
    },
    async forgot(email) {
      if (!email?.includes("@")) return { ok: false, error: "Enter your email" };
      return plain(await Api.post("/auth/forgot", { email }));
    },
    async resetPassword(token, password, confirm) {
      return plain(await Api.post("/auth/reset", { token, password, confirm }));
    },
    hasProvider(name) { return providers.includes(name); },
    oauthUrl(provider) {
      const base = window.location.origin;
      return `/auth/oauth/${provider}?return=${encodeURIComponent(base + '/#/account')}`;
    },
    loginWithProvider(provider) {
      if (!this.hasProvider(provider)) return { ok: false, error: `${provider} not enabled` };
      window.location.href = this.oauthUrl(provider);
    }
  };
})();

const Accounts = Api.enabled ? serverAccounts : localAccounts;
window.Accounts = Accounts;
