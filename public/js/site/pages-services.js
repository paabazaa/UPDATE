// Services and programmes pages
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

Object.assign(pages, {
  servicesIndex() {
    return banner("Services", [{label: "Services"}], "Departments are held together by people. These services are aimed at the supervisors, managers and technicians who carry the work.")
      + `<section class="wrap sec"><h2 class="sr">Services</h2><div class="grid g3">${services.map(serviceCard).join("")}</div></section>` + callToAction("Talk to us about your department", "A short conversation is usually enough to see whether we can help.");
  },
  serviceItem(slug) {
    const s = services.find(x => x.slug === slug); if (!s) return null;
    return banner(s.name, [{label: "Services", to: "/services"}, {label: s.name}], s.summary)
      + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="1349" height="481" loading="lazy" decoding="async"><div class="rich" style="margin-top:32px">${paras(s.body)}</div><h2 class="h-sec" style="margin-top:40px">What is included</h2>${barList(s.includes)}</div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">Enquire</h2>
        <p>Tell us the size of the team and the problem you want addressed first.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request a proposal</a></div>
      <div class="box"><h2 class="h-sec">Other services</h2>
        <ul class="links">${services.filter(o => o.slug !== slug).map(o => `<li><a href="${href("/services/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Ready to start?", "We will set out scope, timings and cost before any work begins.");
  },
  programmesIndex() {
    return banner("Programmes", [{label: "Programmes"}], "Longer pieces of work, run with the department rather than around it, each with an agreed measure of success.")
      + `<section class="wrap sec"><h2 class="sr">Programmes</h2><div class="grid g3">${programmes.map(progCard).join("")}</div></section>` + callToAction("Which programme fits your position?", "Tell us the pressure you are under and we will suggest a starting point.");
  },
  programmeItem(slug) {
    const s = programmes.find(x => x.slug === slug); if (!s) return null;
    return banner(s.name, [{label: "Programmes", to: "/programmes"}, {label: s.name}], s.summary)
      + `<section class="wrap sec"><div class="two side"><div><img class="wideimg" src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)}" width="1349" height="481" loading="lazy" decoding="async"><div class="rich" style="margin-top:32px">${paras(s.body)}</div>
        </div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">Enquire</h2>
        <p>Tell us where the pressure is and we will outline how this programme would run.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request an outline</a></div>
      <div class="box"><h2 class="h-sec">Other programmes</h2>
        <ul class="links">${programmes.filter(o => o.slug !== slug).map(o => `<li><a href="${href("/programmes/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Interested in this programme?", "We will send the outline, timescales and what we need from you.");
  }
});
