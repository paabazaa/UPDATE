// Shared page pieces: links, banners, cards, lists
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

/* ---------- shared pieces ---------- */
const href = p => "#" + p;
const quoteHref = item => "#/generate-quote" + (item ? "?item=" + encodeURIComponent(item) : "");
const crumbs = list => {
  const items = [`<li style="display:flex;align-items:center;gap:4px"><a href="#/">Home</a>${icons.chev}</li>`].concat(list.map((c, i) => {
    const last = i === list.length - 1;
    return `<li style="display:flex;align-items:center;gap:4px">${c.to && !last ? `<a href="${href(c.to)}">${escapeHtml(c.label)}</a>` : `<span class="cur">${escapeHtml(c.label)}</span>`}${last ? "" : icons.chev}</li>`;
  }));
  return `<nav aria-label="Breadcrumb" class="crumbs" style="margin-top:16px"><ol class="crumbs" style="margin:0">${items.join("")}</ol></nav>`;
};
const banner = (title, cr = [], lead = "") => `<div class="banner"><div class="wrap"><h1>${escapeHtml(title)}</h1>${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ""}${crumbs(cr)}</div></div>`;

// Banner with a wide product or software picture behind the title.
const imageBanner = (title, cr, lead, img, kind) => `<div class="banner imgbanner"><img class="ib-pic" src="${imageUrl(img)}" alt="" aria-hidden="true" width="1600" height="700" fetchpriority="high"><div class="wrap"><figure class="ib-fig"><img src="${imageUrl(img)}" alt="${escapeHtml(title)}" width="1000" height="800" decoding="async"></figure><span class="ib-kind">${escapeHtml(kind)}</span><h1>${escapeHtml(title)}</h1>${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ""}${crumbs(cr)}</div></div>`;

// Closing banner with the two main actions.
const callToAction = (h, b) => `<section class="cta"><div class="wrap"><div><h2>${escapeHtml(h)}</h2><p>${escapeHtml(b)}</p>
  </div>
  <div class="row"><a class="btn" href="#/generate-quote">Generate quote</a><a class="btn ghost" href="#/contact-us">Ask a question</a></div>
  </div>
  </section>`;
const productCard = p => `<article class="card pcard"><a class="img" href="${href("/products/" + p.slug)}" tabindex="-1" aria-hidden="true"><img src="${imageUrl(p.image)}" alt="" loading="lazy" width="900" height="700"><span class="badge">${escapeHtml(catName(p.category))}</span></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/products/" + p.slug)}">${escapeHtml(p.name)}</a></h3><p>${escapeHtml(p.summary)}</p>${tickList(p.features.slice(0, 2))}<div class="acts"><a class="btn" href="${quoteHref(p.name)}">Request a quote</a><a class="btn line" href="${href("/products/" + p.slug)}">Details${icons.arrow}</a></div></div></article>`;
const serviceCard = s => `<article class="card"><a class="img" href="${href("/services/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/services/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/services/" + s.slug)}">Read more</a></div></div></article>`;
const progCard = s => `<article class="card"><a class="img" href="${href("/programmes/" + s.slug)}"><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="900" height="640"></a><div class="body"><h3 class="h-card"><a class="stretch" href="${href("/programmes/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p><div class="acts"><a class="tlink" href="${href("/programmes/" + s.slug)}">Read more</a></div></div></article>`;
const swCard = s => `<article class="swcard2"><a class="sw-shot" href="${href("/software/" + s.slug)}" tabindex="-1" aria-hidden="true"><img src="${imageUrl(s.image)}" alt="" loading="lazy" width="1600" height="900"></a><div class="sw-body"><span class="sw-tag">${s.modules.length} modules</span><h3><a class="stretch" href="${href("/software/" + s.slug)}">${escapeHtml(s.name)}</a></h3><p>${escapeHtml(s.summary)}</p>${chips(s.modules.slice(0, 3))}<div class="acts"><a class="btn" href="${href("/software/" + s.slug)}">Explore${icons.arrow}</a><a class="btn line" href="${quoteHref(s.name)}">Request a quote</a></div></div></article>`;
const realValue = v => !/available on request|request for a quote/i.test(v || "");
const tickList = a => `<ul class="ticks">${a.map(x => `<li><span class="tk">${icons.tick}</span><span>${escapeHtml(x)}</span></li>`).join("")}</ul>`;
const chips = a => `<ul class="chips">${a.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
const ifuSection = u => `<section class="pd-sec ifu">${secHead("Instructions for use", u.audience)}
        <p class="rich">${escapeHtml(u.intro)}</p>
        <p class="ifu-dl"><a class="btn" href="${u.pdf}" target="_blank" rel="noopener">Download instructions (PDF)${icons.arrow}</a></p>
        <h3 class="ifu-h">Application instructions</h3><p class="muted">${escapeHtml(u.applyNote)}</p>
        <ol class="ifu-steps">${u.steps.map((st, i) => `<li><img src="${imageUrl(st.image)}" alt="${escapeHtml(st.title)}" loading="lazy" width="840" height="473"><div><span class="ifu-n">${i + 1}</span><b>${escapeHtml(st.title)}</b><p>${escapeHtml(st.text)}</p></div></li>`).join("")}</ol>
        <h3 class="ifu-h">${escapeHtml(u.viewsTitle)}</h3>
        <div class="ifu-views">${u.views.map(v => `<figure><img src="${imageUrl(v.image)}" alt="${escapeHtml(v.label)}" loading="lazy" width="1100" height="620"><figcaption>${escapeHtml(v.label)}</figcaption></figure>`).join("")}</div>
        <p class="rich">${escapeHtml(u.materials)}</p>
        <h3 class="ifu-h">${escapeHtml(u.closureTitle)}</h3>${tickList(u.closure)}
        <p class="muted">Manufacturer support: SURGICISS LTD</p></section>`;
const secHead = (title, note) => `<div class="pg-head"><h2>${escapeHtml(title)}</h2>${note ? `<p>${escapeHtml(note)}</p>` : ""}</div>`;

const barList = a => `<ul class="bar-list">${a.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
const paras = a => a.map(p => `<p>${escapeHtml(p)}</p>`).join("");
