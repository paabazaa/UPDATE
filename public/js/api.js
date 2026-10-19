// Small client for the SURGICISS API. Api.enabled is false when no apiBase is configured.
const Api = (() => {
  const base = String((window.SURGICISS_CONFIG && window.SURGICISS_CONFIG.apiBase) || "").trim().replace(/\/+$/, "");

  async function request(method, path, body, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(base + "/api" + path, {
        method,
        credentials: "include",
        signal: controller.signal,
        headers: {"Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "surgiciss-web"},
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      let data = {};
      try {data = (await response.json()) || {};}
      catch (e) { /* the body was not JSON */}
      return {
        ok: response.ok,
        status: response.status,
        data,
        error: response.ok ? "" : (data.error || "Something went wrong. Please try again.")
      };
    } catch (e) {
      return {ok: false, status: 0, data: {}, error: "The server could not be reached. Please check your connection and try again."};
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    enabled: base !== "",
    base,
    get: (path, timeoutMs) => request("GET", path, undefined, timeoutMs),
    post: (path, body) => request("POST", path, body || {}),
    patch: (path, body) => request("PATCH", path, body || {})
  };
})();
window.Api = Api;

// Picks wording for the two modes: stored in this browser only, or stored on the server.
function byMode(browserText, serverText) {
  return Api.enabled ? serverText : browserText;
}
