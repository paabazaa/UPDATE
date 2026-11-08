// Software pages
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

Object.assign(pages, {
  softwareIndex() {
    return banner("Software", [{label: "Software"}], "Four systems built around the way a sterile services department actually runs: sets in motion, trolleys due for checking, and records that have to stand up afterwards.")
      + `<section class="wrap sec"><h2 class="sr">Software</h2><div class="grid g2 swgrid">${software.map(swCard).join("")}</div></section>` + callToAction("Ask for a walkthrough", "We will show the system against your own workflow, not a demonstration dataset.");
  },
  softwareItem(slug) {
    const s = software.find(x => x.slug === slug); if (!s) return null;
    const others = software.filter(x => x.slug !== slug);
    return imageBanner(s.name, [{label: "Software", to: "/software"}, {label: s.name}], s.summary, s.image, "Software")
      + `<section class="wrap sec"><div class="two side sw-page"><div>
      <div class="browser"><div class="bar"><i></i><i></i><i></i><span>${escapeHtml(s.name)}</span></div><img src="${imageUrl(s.image)}" alt="${escapeHtml(s.name)} screens" width="1600" height="900" loading="lazy" decoding="async"></div>
      <div class="glance"><div><b>${s.modules.length}</b><span>Modules</span></div><div><b>${s.benefits.length}</b><span>Department benefits</span></div><div><b>1</b><span>Walkthrough on your own workflow</span></div></div>
      <section class="pd-sec">${secHead("What it does")}<div class="rich">${paras(s.body)}</div></section>
      <section class="pd-sec">${secHead("Modules", "What the system is made of.")}<ol class="steps">${s.modules.map((m, i) => `<li><span class="n">${i + 1}</span><span>${escapeHtml(m)}</span></li>`).join("")}</ol></section>
      <section class="pd-sec">${secHead("What departments get from it")}${tickList(s.benefits)}</section></div>
      <aside class="sw-aside"><div class="box tint"><h2 class="h-sec">Enquire about ${escapeHtml(s.name)}</h2>
        <p>Tell us how many sets, trolleys or scopes you handle and we will scope the work against that.</p>
        <a class="btn" href="${quoteHref(s.name)}">Request a quote${icons.arrow}</a><a class="btn line" href="#/contact-us" style="margin-left:8px">Ask a question</a></div>
      <div class="box"><h2 class="h-sec">Other software</h2><ul class="links">${others.map(o => `<li><a href="${href("/software/" + o.slug)}">${escapeHtml(o.name)}</a></li>`).join("")}</ul></div></aside></div></section>`
      + callToAction("Considering " + s.name + "?", "We will talk you through what it does and what it does not do.");
  }
});
