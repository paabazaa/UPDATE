// Contact, quote, FAQ, resources, search, privacy, terms and not-found pages
// Part of the site scripts. Loaded in order by index.html; they share one global scope.

Object.assign(pages, {
  contact() {
    return banner("Contact us", [{label: "Contact us"}], "Tell us what your department is dealing with. We answer enquiries ourselves rather than routing them through a call centre.")
      + `<section class="wrap sec"><div class="two contact"><aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">SURGICISS LTD</h2>
        <dl class="kv">
        <div><dt>Address</dt><dd>${escapeHtml(company.address)}</dd></div>
        <div><dt>Phone number</dt><dd>${phoneLink()}</dd></div>
        <div><dt>Email</dt><dd>${emailLink()}</dd></div>
        <div><dt>WhatsApp</dt><dd>${whatsappLink()}</dd></div>
        <div><dt>Office hours</dt><dd>${escapeHtml(detail(company.hours))}</dd></div>
        <div><dt>Company registration</dt><dd>${escapeHtml(detail(company.registration))}</dd></div>
        </dl></div>
        <div class="box"><h2 class="h-sec">Who we work with</h2><p>${escapeHtml(company.intro)}</p>
          </div>
          </aside>
        <div><h2 class="section-title">Send us an enquiry</h2>
          <p class="muted" style="margin-top:12px;font-size:14px">Fields marked with an asterisk are required. You can ask a question without creating an account. The confirmation will tell you whether the message was actually sent.</p>
          <div style="margin-top:24px">${enquiryForm("contact")}</div></div></div></section>`;
  },
  quote() {
    const item = state.quoteItem;
    return banner("Request a quote", [{label: "Request a quote"}], "The more you can tell us about the sets, volumes and timescales, the more useful our quotation will be.")
      + `<section class="wrap sec"><div class="two quote"><div>${item ? `<p class="callout">Enquiry about: <strong>${escapeHtml(item)}</strong></p>` : ""}${enquiryForm("quote", item)}</div>
      <aside style="display:grid;gap:24px;align-content:start"><div class="box tint"><h2 class="h-sec">What happens next</h2>
        <ol class="muted" style="margin-top:12px;display:grid;gap:8px;font-size:14px"><li>1. We read the enquiry and check what we need to clarify.</li>
        <li>2. We come back with questions or a written quotation.</li>
        <li>3. If it is a fit, we agree delivery or a start date.</li>
        </ol>
        </div>
      <div class="box"><h2 class="h-sec">Prefer to speak to us?</h2>
        <p>${phoneLink()}</p>
        <p style="margin-top:0">${emailLink()}</p>
        <p style="margin-top:0">${whatsappLink()}</p>
        <p style="margin-top:8px">${escapeHtml(detail(company.hours, "Opening hours available on request"))}</p>
      </div></aside></div></section>`;
  },
  faq() {
    const faqs = [
      ["How do you prepare a quotation?", "We ask for the products or modules you are considering, the quantities involved and where the goods or work are going. We then quote against that rather than publishing a single list price, because volume and delivery change the figure."],
      ["What are your lead times?", "Lead times depend on the item and the quantity ordered. We confirm a date in writing with every quotation."],
      ["Can we trial a product before committing?", "For most physical products we can arrange an evaluation quantity so your technicians can judge it in their own workflow. Terms for evaluations are agreed case by case."],
      ["Is your software hosted by you or by us?", "Both arrangements are possible and the choice usually depends on your IT policy. The specific hosting, interface and data-retention options we support are confirmed during scoping."],
      ["Do you deliver training on site?", "Yes. Technician training and morale sessions are normally delivered in the department, because the point is to work with the equipment and pressures your team actually faces."],
      ["What regulatory information can you supply?", "We provide the documentation relevant to each product on request. Classifications and certifications differ by item and market."]
    ];
    return banner("Frequently asked questions", [{label: "FAQ"}], "The questions departments ask us most often. If yours is not here, send it to us.")
      + `<section class="wrap narrow sec"><dl class="faq">${faqs.map(f => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join("")}</dl></section>` + callToAction("Still have a question?", "Ask us directly and we will answer plainly.");
  },
  resources() {
    const r = [
      ["Protecting the sterile barrier in transit", "Where wrapped trays are most often damaged between the sterilizer and the theatre, and the handling changes that reduce it.", "/product-category/sterile-barrier", "See sterile barrier products"],
      ["Making a count sheet usable", "Practical points on layout, protection and placement so a count sheet survives assembly and theatre use intact.", "/count-sheet-holders", "See count sheet holders"],
      ["Receiving loaner instrument sets", "A receipt-to-return sequence for loaners, including what to record when a set arrives late or incomplete.", "/programmes/loaner-instrument-processing", "See loaner instrument processing"],
      ["Endoscope traceability basics", "The minimum record set that lets a department reconstruct which scope was used, on whom, and after which reprocessing cycle.", "/software/endoscope-matrix", "See Endoscope Matrix"]
    ];
    return banner("Resources", [{label: "Resources"}], "Short pieces written for the people doing the work. Downloadable versions are being prepared.")
      + `<section class="wrap sec"><div class="grid g2">${r.map(x => `<article class="box rcard" style="background:var(--card)"><h2 style="font-size:16px;color:var(--heading)"><a class="stretch" href="${href(x[2])}">${x[0]}</a></h2><p>${x[1]}</p><p style="margin-top:14px"><a class="tlink" href="${href(x[2])}">${x[3]}</a></p></article>`).join("")}</div>
        <p class="muted" style="margin-top:40px;font-size:14px">Looking for something specific? <a style="color:var(--link)" href="/contact-us">Ask us</a> and we will point you to it or write it.</p>
        </section>`
      + callToAction("Want these as handouts for your team?", "Tell us how many you need and in what format.");
  },
  search() {
    const idx = [].concat(products.map(p => ({k: "Product", n: p.name, s: p.summary, to: "/products/" + p.slug})), software.map(p => ({k: "Software", n: p.name, s: p.summary, to: "/software/" + p.slug})), services.map(p => ({k: "Service", n: p.name, s: p.summary, to: "/services/" + p.slug})), programmes.map(p => ({k: "Programme", n: p.name, s: p.summary, to: "/programmes/" + p.slug})));
    return banner("Search", [{label: "Search"}], "Search our products, software, services and programmes.")
      + `<section class="wrap narrow sec"><label for="site-search" style="font-size:14px;font-weight:500">What are you looking for?</label>
        <input class="search-in" style="padding:12px 16px" id="site-search" type="search" value="${escapeHtml(state.q)}" placeholder="e.g. master wrap, endoscope, training" maxlength="80"><div id="results" style="margin-top:32px">${searchResults(idx)}</div></section>`;
  },
  privacy() {
    return banner("Privacy notice", [{label: "Privacy notice"}]) + `<section class="wrap narrow sec"><div class="rich">
      <h2 class="lt">What we collect</h2>
      <p>If you create an account, ask a question or prepare a quote request, the details you type (name, organisation, email, phone number, location and message) are sent to SURGICISS and held in its database.</p>
      <h2 class="lt">Why we use it</h2>
      <p>Those details are used so the team can answer the enquiry, prepare a quotation and keep a record of the correspondence. They are not for sale, and this site does not add you to a marketing list on its own.</p>
      <h2 class="lt">Accounts</h2>
      <p>An account is optional and is not required to read any public page. Passwords are stored only as a one-way hash, never as plain text. Do not put clinical records or a password you use elsewhere into any form.</p>
      <h2 class="lt">How long we keep it</h2>
      <p>We keep your details for as long as they are needed to deal with your enquiry and any resulting supply, or while your account exists. You can delete your account from Account settings, which removes the account and the quotes and enquiries filed under it.</p>
      <h2 class="lt">Your rights</h2>
      <p>To ask for a copy of the information SURGICISS holds about you, or for it to be corrected or deleted, send a message through the enquiry form.</p>
      <h2 class="lt">Cookies</h2>
      <p>This site does not use advertising or tracking cookies. When you sign in, a single cookie keeps you signed in until you log out or it expires. Any measurement we add in future will be described here first.</p>
      <p class="muted" style="margin-top:32px;font-size:12px">This notice is provided in good faith and is not legal advice. Have it reviewed before publication.</p>
      </div>
      </section>`;
  },
  terms() {
    return banner("Terms of use", [{label: "Terms of use"}]) + `<section class="wrap narrow sec"><div class="rich">
      <h2 class="lt">About this site</h2>
      <p>This website is operated by ${company.name}, company registration ${escapeHtml(detail(company.registration))}, registered at ${escapeHtml(company.address)}. By using the site you accept these terms.</p>
      <h2 class="lt">Product information</h2>
        <p>Descriptions, specifications and images are provided as a guide. Where a specification is marked as pending it has not yet been confirmed and must not be relied on. Always confirm the current specification with us before ordering or writing a device into a local procedure.</p>
      <h2 class="lt">Not clinical advice</h2>
        <p>Nothing on this site replaces manufacturer instructions for use, national guidance or your own local policy. Decisions about reprocessing, sterilisation and instrument handling remain with the responsible clinician or department manager.</p>
      <h2 class="lt">Quotations and orders</h2>
        <p>A quote request prepared on this website is not an order and does not confirm a price, tax or delivery charge. Quotations are valid for the period stated on them once they are issued. Conditions of sale are available on request.</p>
      <h2 class="lt">Intellectual property</h2>
        <p>The SURGICISS name, site text, images and software interfaces are our property or used with permission. Please ask before reproducing them.</p>
      <h2 class="lt">Governing law</h2>
        <p>The governing law is stated on each quotation.</p>
      <p class="muted" style="margin-top:32px;font-size:12px">Provided in good faith and not legal advice. Have these terms reviewed before publication.</p>
        </div>
        </section>`;
  },
  notFound() {
    return `<section class="wrap nf"><h1>404</h1>
      <h2>We can't find that page</h2>
      <p class="muted" style="margin-top:8px;font-size:14px">The page you are looking for does not exist or may have moved.</p>
      <div class="row"><a class="btn lg" href="/">Go home</a><a class="btn line lg" href="/contact-us">Contact us</a></div>
      </section>`;
  }
});
