// Home and About pages
// Part of the site scripts. Loaded in order by index.html; they share one global scope.


/* ---------- pages ---------- */
const featuredSlugs = ["quality-assurance-card", "surgical-instrument-master-wrap", "universal-surgical-count-sheet-holder"];
Object.assign(pages, {
  home() {
    const s = slides[state.slide];
    const featured = featuredSlugs.map(x => products.find(p => p.slug === x)).filter(Boolean);
    return `<section class="hero" id="hero" aria-label="Featured products, software and services"><h1 class="sr">SURGICISS LTD — Sterile Instrument Systems</h1>
      <div class="slides">${slides.map((sl, i) => `<div class="slide${i === state.slide ? " on" : ""}${/^(software|product)/.test(sl.image) ? " lt" : ""}" aria-hidden="${i !== state.slide}"><img ${i < 2 ? `src="${imageUrl(sl.image)}"` : `data-src="${imageUrl(sl.image)}"`} alt="" width="1600" height="900"${i === 0 ? ' fetchpriority="high"' : ' decoding="async"'}><div class="in"><h2 class="st">${escapeHtml(sl.title)}</h2><p class="sb">${escapeHtml(sl.body)}</p><a class="btn hb" href="${href(sl.cta[1])}">${sl.cta[0]}${icons.arrow}</a></div></div>`).join("")}</div>
      <button type="button" class="nav" style="left:0" aria-label="Previous slide" data-slide="-1">${icons.left}</button><button type="button" class="nav" style="right:0" aria-label="Next slide" data-slide="1">${icons.right}</button>
        </section>
    <section class="sec tint" style="padding-block:0" aria-label="Software"><div class="wrap quick">${software.map(x => `<a href="${href("/software/" + x.slug)}"><span class="q-ico">${icons.layers}</span><span class="q-text"><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.summary)}</small></span><span class="q-go">${icons.arrow}</span></a>`).join("")}</div></section>
    <section class="wrap sec intro"><h2>${company.name}</h2><h3>${company.tagline}</h3>
      <p>The problem with healthcare today is not the lack of advanced technologies and skilled hands, but the absence of simple innovations that help each pair of hands get the basics done right the first time. These seemingly trivial steps have led to failure, time and again, in even the most sophisticated operating rooms. For patient safety, SURGICISS LTD provides simple innovations that prevent error, minimise delay, reduce unnecessary cost and support real-time compliance in sterile processing departments and operating rooms.</p>
      </section>
    <section class="wrap" style="padding-bottom:48px"><div class="grid g3" style="gap:32px">${services.map(x => `<article class="feat"><a href="${href("/services/" + x.slug)}" style="display:block;overflow:hidden;background:var(--tint)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/services/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${href("/services/" + x.slug)}">Read more${icons.arrow}</a></article>`).join("")}</div>
      </section>
    <section class="sec tint"><div class="wrap intro"><h2>Products</h2>
      <p>Through research, development and the steady use of instrument processing products, software and methods in real departments, we work to support patient safety and the viability of the services that deliver it.</p>
      <div class="grid g3" style="gap:32px;margin-top:32px;text-align:left">${featured.map(x => `<article class="feat"><a href="${href("/products/" + x.slug)}" style="display:block;overflow:hidden;background:var(--card)"><img src="${imageUrl(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy" width="800" height="520"></a><h3 class="h-card"><a class="stretch" href="${href("/products/" + x.slug)}">${escapeHtml(x.name)}</a></h3><p>${escapeHtml(x.summary)}</p><a class="tlink" href="${quoteHref(x.name)}">Request a quote${icons.arrow}</a></article>`).join("")}</div>
      <div class="center" style="margin-top:40px"><a class="btn lg" href="#/products">All Products${icons.arrow}</a></div>
        </div>
        </section>`;
  },
  about() {
    return banner("About us", [{label: "About"}]) + `<section class="wrap sec" style="padding-block:56px"><div class="two about"><div class="rich"><h2 class="section-title">Dedicated to best surgical outcomes</h2>
      <p style="margin-top:16px">${escapeHtml(company.intro)}</p>
      <p>Our work sits in the space between the operating theatre and the sterile services department, where most instrument problems are either created or prevented. We supply products that protect the sterile barrier, software that records what happened to a set, and support for the teams responsible for both.</p>
      <p>We would rather solve a problem in a department's own routine than sell it something it does not need, which is why most of our conversations begin with a walk through the department rather than a catalogue.</p>
      <h3>How we work</h3>
      <p>Every recommendation we make should be defensible: traceable to the department's own records, achievable with the staff and equipment available, and measurable once it is in place. Where we do not yet hold information — a specification, a certification, a lead time — we say so rather than fill the gap.</p>
      <h3>Company details</h3>
      <dl class="kv cols"><div><dt>Registered name</dt><dd>${company.name}</dd></div><div><dt>Company registration</dt><dd>${escapeHtml(detail(company.registration))}</dd></div><div><dt>Registered address</dt><dd>${escapeHtml(company.address)}</dd></div><div><dt>Office hours</dt><dd>${escapeHtml(detail(company.hours))}</dd></div></dl></div>
      <div><img class="wideimg" style="aspect-ratio:1920/1000" src="${imageUrl("heroSterileProcessing")}" alt="Sterile services technicians at work" width="1349" height="403" loading="lazy" decoding="async"></div></div></section>`
      + callToAction("Considering a change in your department?", "Send us the detail and we will tell you honestly whether we can help.");
  }
});
