// Products, product categories and count sheet holders
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

Object.assign(pages, {
  products() {
    return banner("Products", [{label: "Products"}], "Practical devices for the parts of the process that most often go wrong: protecting wrapped trays, keeping brushes and count sheets where they belong, and proving that checks were carried out.")
      + `<section class="wrap sec"><div class="filterbar"><a class="chip on" href="#/products" aria-current="page">All products <b>${products.length}</b></a>${productCategories.map(c => `<a class="chip" href="${href("/product-category/" + c.slug)}">${escapeHtml(c.name)} <b>${products.filter(p => p.category === c.slug).length}</b></a>`).join("")}</div><h2 class="sr">All products</h2><div class="grid g3" style="margin-top:32px">${products.map(productCard).join("")}</div></section>`
      + callToAction("Need a quotation for several lines?", "Send one enquiry with the products and quantities and we will price it together.");
  },
  category(slug) {
    const c = productCategories.find(x => x.slug === slug); if (!c) return null;
    const list = products.filter(p => p.category === slug);
    return banner(c.name, [{label: "Products", to: "/products"}, {label: c.name}], c.description)
      + `<section class="wrap sec"><div class="filterbar"><a class="chip" href="#/products">All products <b>${products.length}</b></a>${productCategories.map(x => `<a class="chip${x.slug === slug ? " on" : ""}" href="${href("/product-category/" + x.slug)}"${x.slug === slug ? ' aria-current="page"' : ""}>${escapeHtml(x.name)} <b>${products.filter(p => p.category === x.slug).length}</b></a>`).join("")}</div>${list.length ? `<h2 class="sr">Products in this category</h2><div class="grid g3" style="margin-top:32px">${list.map(productCard).join("")}</div>` : `<p class="muted" style="font-size:14px;margin-top:24px">No products are listed in this category yet. <a style="color:var(--link)" href="#/contact-us">Contact us</a> for the current range.</p>`}</section>`
      + callToAction("Not sure which option suits your sets?", "Describe the trays and we will recommend a fit.");
  },
  product(slug) {
    const p = products.find(x => x.slug === slug); if (!p) return null;
    const related = products.filter(x => x.slug !== p.slug && x.category === p.category).slice(0, 3);
    const facts = p.specifications.filter(x => realValue(x.value)).slice(0, 3);
    return imageBanner(p.name, [{label: "Products", to: "/products"}, {label: p.name}], "", p.image, catName(p.category))
      + `<section class="wrap sec"><div class="pd">
      <aside class="pd-media"><div class="pd-photo"><img class="pimg" src="${imageUrl(p.image)}" alt="${escapeHtml(p.name)}" width="1024" height="1024"><span class="badge"><a href="${href("/product-category/" + p.category)}">${escapeHtml(catName(p.category))}</a></span></div>
        <div class="pd-buy"><a class="btn lg" href="${quoteHref(p.name)}">Request a quote${icons.arrow}</a><a class="btn line lg" href="#/contact-us">Ask a question</a>${p.ifu ? `<a class="btn line lg" href="${p.ifu.pdf}" target="_blank" rel="noopener">Instructions for use (PDF)</a>` : ""}<p>Prices are given by quotation, not shown on the page.</p></div></aside>
      <div class="pd-main">
        <p class="pd-lead">${escapeHtml(p.summary)}</p>
        ${facts.length ? `<dl class="facts">${facts.map(f => `<div><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`).join("")}</dl>` : ""}
        <section class="pd-sec">${secHead("Overview")}<div class="rich">${paras(p.body)}</div></section>
        <section class="pd-sec">${secHead("Features")}${tickList(p.features)}</section>
        ${p.ifu ? ifuSection(p.ifu) : ""}
        <section class="pd-sec">${secHead("Where it is used")}${chips(p.applications)}</section>
        ${p.application ? `<section class="pd-sec">${secHead("Application")}<p class="rich">${escapeHtml(p.application)}</p></section>` : ""}
        <section class="pd-sec">${secHead("Specification")}<div class="tbl-wrap"><table class="spec"><tbody>${p.specifications.map(x => `<tr><th scope="row">${escapeHtml(x.label)}</th><td>${escapeHtml(x.value)}</td></tr>`).join("")}</tbody></table></div></section>
        ${p.faq ? `<section class="pd-sec">${secHead("Frequently asked questions")}<dl class="faq">${p.faq.map(f => `<div><dt>${escapeHtml(f[0])}</dt><dd>${escapeHtml(f[1])}</dd></div>`).join("")}</dl></section>` : ""}
      </div></div>
      ${related.length ? `<div style="margin-top:72px"><h2 class="section-title">Related products</h2><div class="grid g3" style="margin-top:28px">${related.map(productCard).join("")}</div></div>` : ""}</section>`
      + callToAction("Quotation for " + p.name, "Tell us quantities and delivery point and we will price it.");
  },
  countSheets() {
    const holders = products.filter(p => p.category === "count-sheet-holders");
    return banner("Instrument count sheet holders", [{label: "Instrument count sheet holders"}], "A count sheet only helps if the technician can read it, reach it and trust that it belongs to the tray in front of them.")
      + `<section class="wrap sec"><div class="rich" style="max-width:768px"><h2 class="section-title">Why holders matter</h2>
        <p style="margin-top:16px">Count sheets get wet, torn, filed in the wrong tray or left on a bench. Each of those small failures turns into a recount, a delayed set or a discrepancy that nobody can resolve afterwards.</p>
        <p>A holder fixes the sheet in one predictable place, keeps it legible during assembly and inspection, and travels with the tray so the record and the instruments never separate.</p>
        </div>
      <h2 class="sr">Count sheet holders</h2><div class="grid g3" style="margin-top:40px">${holders.map(productCard).join("")}</div>
        <div style="margin-top:40px"><a class="btn outline lg" href="#/products">All products</a></div>
        </section>`
      + callToAction("Sizing a holder to your sheets?", "Send us the sheet dimensions and tray type and we will confirm the fit.");
  }
});
