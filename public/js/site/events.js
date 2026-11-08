// Page events (clicks, forms, scrolling, slider) and start-up
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-toggle],[data-mtoggle],[data-slide],[data-goto],#menubtn,#themebtn,#again,#totop");
  const inDD = e.target.closest(".dd");
  if (!inDD) document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
  const link = e.target.closest("a[href^='#']");
  if (link) {
    document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open"));
    if (link.getAttribute("href") === (location.hash || "#/")) scrollTo({top: 0, behavior: "smooth"});
    if (link.closest("#mobnav")) setTimeout(() => {if (state.mobile) {state.mobile = false; rerenderKeepScroll();} }, 0);
  }
  if (!t) return;
  if (t.dataset.toggle) {const box = t.closest(".dd"); const was = box.classList.contains("open"); document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open")); box.classList.toggle("open", !was); t.setAttribute("aria-expanded", String(!was));}
  else if (t.hasAttribute("data-mtoggle")) {const sub = t.closest(".mg").querySelector(".msub"); sub.hidden = !sub.hidden; t.setAttribute("aria-expanded", String(!sub.hidden));}
  else if (t.dataset.slide) {setSlide(state.slide + Number(t.dataset.slide));}
  else if (t.dataset.goto) {setSlide(Number(t.dataset.goto));}
  else if (t.id === "menubtn") {state.mobile = !state.mobile; rerenderKeepScroll();}
  else if (t.id === "themebtn") {const next = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = next; try {localStorage.setItem("surgiciss-theme", next);} catch (e) {} t.outerHTML = themeButton();}
  else if (t.id === "again") {state.submitted = false; state.errors = {}; route();}
  else if (t.id === "totop") scrollTo({top: 0, behavior: "smooth"});
});

// Slide pictures are fetched only when they are about to be shown, so the home page does not download all of them at once.
function loadSlide(i) {
  const img = document.querySelectorAll("#hero .slide img")[(i + slides.length) % slides.length];
  if (img && !img.getAttribute("src") && img.dataset.src) img.src = img.dataset.src;
}
function setSlide(n, auto) {
  if (!auto && typeof startSlider === "function") startSlider();
  state.slide = (n + slides.length) % slides.length;
  const h = document.getElementById("hero"); if (!h) return;
  loadSlide(state.slide); loadSlide(state.slide + 1);
  h.querySelectorAll(".slide").forEach((el, i) => {const on = i === state.slide; el.classList.toggle("on", on); el.setAttribute("aria-hidden", String(!on));});
}
function rerenderMain() {if (currentPath() === "/") rerenderKeepScroll(pages.home());}

document.addEventListener("keydown", e => {if (e.key === "Escape") {document.querySelectorAll(".dd.open").forEach(x => x.classList.remove("open")); if (state.mobile) {state.mobile = false; rerenderKeepScroll();} } });

document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "newsletter") {
    const v = e.target.querySelector("input").value.trim();
    if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      Api.post("/newsletter", {email: v}).then(result => {
        state.subscribed = result.ok;
        state.subscribeError = result.ok ? "" : result.error;
        rerenderKeepScroll();
      });
    }
    return;
  }
  if (e.target.id === "enquiry") {
    handleEnquirySubmit(e);
  }
});

document.addEventListener("input", e => {
  if (e.target.id === "site-search") {
    state.q = e.target.value;
    const idx = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})), services.map(p => ({k: "Service", n: p.name, s: p.summary, to: "/services/" + p.slug})), programmes.map(p => ({k: "Programme", n: p.name, s: p.summary, to: "/programmes/" + p.slug})));
    document.getElementById("results").innerHTML = searchResults(idx);
  }
});

addEventListener("scroll", () => {
  const h = document.getElementById("hdr"); if (h) h.classList.toggle("stuck", scrollY > 8);
  document.getElementById("totop").hidden = scrollY < 400;
}, {passive: true});

addEventListener("hashchange", () => {state.submitted = false; state.errors = {}; state.submitResult = null; if (window.onBeforeRoute) onBeforeRoute(); route(); scrollTo(0, 0);});

// The hero slides advance on their own, except for visitors who ask for reduced motion, and they pause while the
// pointer or keyboard focus is on the slider.
// The home-page pictures change every 5 seconds, whether or not the pointer is over them. Using an arrow restarts the 5 seconds.
let sliderTimer = null;
function startSlider() {
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => {if (currentPath() === "/" && !document.hidden) setSlide(state.slide + 1, true);}, 5000);
}
startSlider();

// "Skip to main content" link: a hash link would be read as a page route, so focus the content directly.
document.addEventListener("click", e => {
  const skip = e.target.closest(".skip");
  if (!skip) return;
  e.preventDefault();
  const main = document.getElementById("main");
  if (main) {main.focus(); main.scrollIntoView();}
});

try {const s = localStorage.getItem("surgiciss-theme"); if (s === "dark" || s === "light") document.documentElement.dataset.theme = s;} catch (e) {}
if (window.installCustomer) installCustomer();

// With the API on, pages that depend on the account wait to learn whether the visitor is signed in. Every other page is drawn
// straight away, and the header is refreshed afterwards if the visitor turns out to be signed in.
if (window.Accounts && Accounts.pending()) {
  if (/^\/(account|login|sign-up|forgot-password|reset-password|generate-quote|request-quote)(\/|$)/.test(currentPath())) Accounts.ready.then(route);
  else {
    route();
    Accounts.ready.then(() => {
      const bar = document.getElementById("hdr");
      if (bar && Accounts.current()) bar.outerHTML = header();
    });
  }
} else route();
