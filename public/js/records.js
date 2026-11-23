// Quote requests and enquiries saved in this browser.
// With apiBase set, requests are sent to the SURGICISS API and stored in the database.
// Without it, nothing is sent to SURGICISS unless submissionEndpoint is set and accepts the POST.
const Records = (() => {
  const QUOTES = "surgiciss-quotes";
  const ENQUIRIES = "surgiciss-enquiries";
  const DRAFT = "surgiciss-quote-draft";
  const RECENT = "surgiciss-recent-ids";

  function read(key) {
    try {return JSON.parse(localStorage.getItem(key)) || [];}
    catch (e) {return [];}
  }
  function write(key, value) {localStorage.setItem(key, JSON.stringify(value));}
  function remember(id) {
    try {
      const ids = JSON.parse(sessionStorage.getItem(RECENT) || "[]");
      ids.unshift(id);
      sessionStorage.setItem(RECENT, JSON.stringify(ids.slice(0, 20)));
    } catch (e) { /* ignore */}
  }
  function remembered(id) {
    try {return (JSON.parse(sessionStorage.getItem(RECENT) || "[]")).includes(id);}
    catch (e) {return false;}
  }
  function stamp(prefix) {
    const now = new Date();
    const day = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
    return prefix + "-" + day + "-" + tail;
  }
  function saveQuote(record) {
    const all = read(QUOTES);
    all.unshift(record);
    write(QUOTES, all);
    remember(record.id);
    return record;
  }
  function saveEnquiry(record) {
    const all = read(ENQUIRIES);
    all.unshift(record);
    write(ENQUIRIES, all);
    remember(record.id);
    return record;
  }
  // Server mode keeps the signed-in customer's records here after loading them from the API.
  // Only a page of each list is loaded at a time (25), with the true totals kept alongside, so an account with hundreds of
  // requests stays quick. "Show more" fetches the next page.
  const PAGE = 25;
  let fromServer = {quotes: [], enquiries: [], quotesTotal: 0, enquiriesTotal: 0};
  let loadingMore = false;
  // A request just sent from this page, kept so its confirmation can be shown. Lost when the page is reloaded.
  let justSent = [];
  function remember(record) {justSent.unshift(record);}
  async function sync() {
    // Reload at least the first page, and as many as are already on screen, so a refresh does not shorten the list.
    const keep = Math.min(100, Math.max(PAGE, fromServer.quotes.length, fromServer.enquiries.length));
    const result = await Api.get("/me/records?limit=" + keep);
    if (result.ok) {
      const quotes = result.data.quotes || [], enquiries = result.data.enquiries || [];
      fromServer = {quotes, enquiries, quotesTotal: result.data.quotesTotal ?? quotes.length, enquiriesTotal: result.data.enquiriesTotal ?? enquiries.length};
    }
  }
  function reset() {fromServer = {quotes: [], enquiries: [], quotesTotal: 0, enquiriesTotal: 0}; justSent = [];}
  const totalFor = (kind, userId) => (Api.enabled
    ? (kind === "quote" ? fromServer.quotesTotal : fromServer.enquiriesTotal)
    : (kind === "quote" ? quotesFor(userId) : enquiriesFor(userId)).length);
  const hasMore = kind => Api.enabled && (
    kind === "both" ? hasMore("quote") || hasMore("enquiry")
      : kind === "quote" ? fromServer.quotes.length < fromServer.quotesTotal : fromServer.enquiries.length < fromServer.enquiriesTotal);
  // Loads the next page of quotes, enquiries or both. Returns false when nothing could be loaded.
  async function more(kind) {
    if (!Api.enabled || loadingMore) return false;
    loadingMore = true;
    try {
      const wantQuotes = (kind === "quote" || kind === "both") && hasMore("quote");
      const wantEnquiries = (kind === "enquiry" || kind === "both") && hasMore("enquiry");
      if (!wantQuotes && !wantEnquiries) return false;
      const query = "limit=" + PAGE + (wantQuotes ? "&quotesOffset=" + fromServer.quotes.length : "") + (wantEnquiries ? "&enquiriesOffset=" + fromServer.enquiries.length : "")
        + (wantQuotes && !wantEnquiries ? "&only=quotes" : wantEnquiries && !wantQuotes ? "&only=enquiries" : "");
      const result = await Api.get("/me/records?" + query);
      if (!result.ok) return false;
      const merge = (have, next) => have.concat((next || []).filter(item => !have.some(old => old.id === item.id)));
      if (wantQuotes) { fromServer.quotes = merge(fromServer.quotes, result.data.quotes); fromServer.quotesTotal = result.data.quotesTotal ?? fromServer.quotesTotal; }
      if (wantEnquiries) { fromServer.enquiries = merge(fromServer.enquiries, result.data.enquiries); fromServer.enquiriesTotal = result.data.enquiriesTotal ?? fromServer.enquiriesTotal; }
      return true;
    } finally { loadingMore = false; }
  }

  function quotesFor(userId) {return Api.enabled ? fromServer.quotes : read(QUOTES).filter(item => item.userId === userId);}
  function enquiriesFor(userId) {return Api.enabled ? fromServer.enquiries : read(ENQUIRIES).filter(item => item.userId === userId);}
  function visibleQuote(id, userId) {
    if (Api.enabled) return fromServer.quotes.find(item => item.id === id) || justSent.find(item => item.id === id) || null;
    const quote = read(QUOTES).find(item => item.id === id);
    if (!quote) return null;
    if (userId && quote.userId === userId) return quote;
    if (!quote.userId && remembered(id)) return quote;
    return null;
  }
  function visibleEnquiry(id, userId) {
    if (Api.enabled && userId) return fromServer.enquiries.find(item => item.id === id) || null;
    const item = read(ENQUIRIES).find(entry => entry.id === id);
    if (!item) return null;
    if (userId && item.userId === userId) return item;
    if (!item.userId && remembered(id)) return item;
    return null;
  }
  function claim(user) {
    const email = String(user.email || "").toLowerCase();
    write(QUOTES, read(QUOTES).map(item => (
      !item.userId && String(item.contact.email || "").toLowerCase() === email
        ? Object.assign({}, item, {userId: user.id})
        : item
    )));
    write(ENQUIRIES, read(ENQUIRIES).map(item => (
      !item.userId && String(item.contact.email || "").toLowerCase() === email
        ? Object.assign({}, item, {userId: user.id})
        : item
    )));
  }
  function purgeUser(userId) {
    write(QUOTES, read(QUOTES).filter(item => item.userId !== userId));
    write(ENQUIRIES, read(ENQUIRIES).filter(item => item.userId !== userId));
  }
  function loadDraft() {
    try {return JSON.parse(sessionStorage.getItem(DRAFT) || "null");}
    catch (e) {return null;}
  }
  function saveDraft(draft) {
    try {sessionStorage.setItem(DRAFT, JSON.stringify(draft));}
    catch (e) { /* ignore */}
  }
  function clearDraft() {
    try {sessionStorage.removeItem(DRAFT);}
    catch (e) { /* ignore */}
  }
  async function deliver(kind, record) {
    if (Api.enabled) {
      const result = await Api.post("/submissions", {kind, submittedAt: new Date().toISOString(), record});
      if (!result.ok) return {delivered: false, configured: true, failed: true, status: result.status, error: result.error};
      if (window.Accounts && Accounts.current()) await sync();
      return {delivered: true, configured: true, status: result.status, id: result.data.id};
    }
    const endpoint = (window.SURGICISS_CONFIG && SURGICISS_CONFIG.submissionEndpoint) || "";
    if (!endpoint) return {delivered: false, configured: false};
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Accept": "application/json"},
        body: JSON.stringify({kind, submittedAt: new Date().toISOString(), record})
      });
      if (!response.ok) return {delivered: false, configured: true, failed: true, status: response.status};
      return {delivered: true, configured: true, status: response.status};
    } catch (e) {
      return {delivered: false, configured: true, failed: true};
    }
  }
  // Deletes one of the signed-in customer's own quote requests or enquiries.
  async function remove(kind, id) {
    if (Api.enabled) {
      const result = await Api.post("/me/records/delete", {kind, id});
      if (!result.ok) return {ok: false, error: result.error, status: result.status};
      await sync();
      return {ok: true};
    }
    const key = kind === "quote" ? QUOTES : ENQUIRIES;
    write(key, read(key).filter(item => item.id !== id));
    return {ok: true};
  }
  return {
    sync, more, hasMore, totalFor, reset, stamp, remember, remove, saveQuote, saveEnquiry, quotesFor, enquiriesFor,
    visibleQuote, visibleEnquiry, claim, purgeUser,
    loadDraft, saveDraft, clearDraft, deliver
  };
})();
window.Records = Records;
