// Country and city pickers shared by the quote, enquiry, sign-up and profile forms.
// Each picker renders visible <select> controls plus hidden inputs named "country"
// and "city", so the existing form code keeps reading plain text values.
const Places = (() => {
  const OTHER = "__other";
  const COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Republic)", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Türkiye", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];
  // Major cities for the countries most likely to enquire. Any other city is entered through "Other city".
  const CITIES = {
    "Ghana": ["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sekondi", "Ho", "Koforidua", "Sunyani", "Tema", "Bolgatanga", "Wa"],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", "Kaduna", "Enugu", "Jos", "Ilorin", "Owerri", "Abeokuta"],
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth (Gqeberha)", "Bloemfontein", "East London", "Polokwane"],
    "Egypt": ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Port Said"],
    "Ethiopia": ["Addis Ababa", "Dire Dawa", "Mekelle", "Bahir Dar", "Hawassa"],
    "Tanzania": ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar City"],
    "Uganda": ["Kampala", "Entebbe", "Gulu", "Mbarara", "Jinja"],
    "Rwanda": ["Kigali", "Butare", "Gisenyi"],
    "Zambia": ["Lusaka", "Ndola", "Kitwe", "Livingstone"],
    "Zimbabwe": ["Harare", "Bulawayo", "Mutare", "Gweru"],
    "Côte d'Ivoire": ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro"],
    "Senegal": ["Dakar", "Thiès", "Saint-Louis", "Touba"],
    "Cameroon": ["Douala", "Yaoundé", "Garoua", "Bamenda"],
    "Morocco": ["Casablanca", "Rabat", "Marrakesh", "Fez", "Tangier"],
    "Algeria": ["Algiers", "Oran", "Constantine", "Annaba"],
    "Tunisia": ["Tunis", "Sfax", "Sousse"],
    "United Kingdom": ["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Edinburgh", "Liverpool", "Bristol", "Sheffield", "Newcastle upon Tyne", "Nottingham", "Cardiff", "Belfast", "Leicester", "Southampton", "Oxford", "Cambridge"],
    "Ireland": ["Dublin", "Cork", "Galway", "Limerick", "Waterford"],
    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Boston", "Atlanta", "Seattle", "Denver", "Miami", "Washington, D.C.", "Minneapolis", "Cleveland", "Nashville"],
    "Canada": ["Toronto", "Montréal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Halifax", "Québec City"],
    "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana"],
    "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Curitiba", "Porto Alegre"],
    "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
    "Chile": ["Santiago", "Valparaíso", "Concepción"],
    "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
    "Jamaica": ["Kingston", "Montego Bay", "Spanish Town"],
    "Trinidad and Tobago": ["Port of Spain", "San Fernando", "Scarborough"],
    "India": ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
    "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar"],
    "Bangladesh": ["Dhaka", "Chattogram", "Khulna", "Sylhet"],
    "Sri Lanka": ["Colombo", "Kandy", "Galle", "Jaffna"],
    "Nepal": ["Kathmandu", "Pokhara", "Lalitpur"],
    "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hong Kong", "Wuhan", "Hangzhou"],
    "Japan": ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kyoto"],
    "South Korea": ["Seoul", "Busan", "Incheon", "Daegu"],
    "Singapore": ["Singapore"],
    "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru", "Kota Kinabalu"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Denpasar"],
    "Philippines": ["Manila", "Quezon City", "Cebu City", "Davao City"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
    "Vietnam": ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin"],
    "New Zealand": ["Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
    "Qatar": ["Doha", "Al Rayyan"],
    "Kuwait": ["Kuwait City", "Hawalli"],
    "Oman": ["Muscat", "Salalah"],
    "Bahrain": ["Manama", "Muharraq"],
    "Jordan": ["Amman", "Irbid", "Zarqa"],
    "Israel": ["Jerusalem", "Tel Aviv", "Haifa", "Beersheba"],
    "Türkiye": ["Istanbul", "Ankara", "İzmir", "Bursa", "Antalya"],
    "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Lille", "Bordeaux"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao", "Málaga"],
    "Portugal": ["Lisbon", "Porto", "Coimbra", "Faro"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Bologna", "Florence", "Genoa"],
    "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
    "Belgium": ["Brussels", "Antwerp", "Ghent", "Liège"],
    "Switzerland": ["Zürich", "Geneva", "Basel", "Bern", "Lausanne"],
    "Austria": ["Vienna", "Graz", "Salzburg", "Innsbruck"],
    "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala"],
    "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger"],
    "Denmark": ["Copenhagen", "Aarhus", "Odense"],
    "Finland": ["Helsinki", "Espoo", "Tampere", "Turku"],
    "Poland": ["Warsaw", "Kraków", "Łódź", "Wrocław", "Gdańsk"],
    "Greece": ["Athens", "Thessaloniki", "Patras"],
    "Romania": ["Bucharest", "Cluj-Napoca", "Timișoara"],
    "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg"],
    "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Lviv"]
  };
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

  function countryOptions(selected) {
    const known = COUNTRIES.includes(selected);
    const extra = selected && !known ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>` : "";
    return `<option value="">Select a country…</option>${extra}${COUNTRIES.map(c => `<option value="${escapeHtml(c)}"${c === selected ? " selected" : ""}>${escapeHtml(c)}</option>`).join("")}`;
  }
  function cityState(country, city) {
    const list = CITIES[country] || [];
    if (!country) return {list, mode: "choose-country", other: ""};
    if (city && list.includes(city)) return {list, mode: "listed", other: ""};
    if (city) return {list, mode: "other", other: city};
    return {list, mode: list.length ? "choose" : "other", other: ""};
  }
  function cityOptions(country, city) {
    const s = cityState(country, city);
    if (s.mode === "choose-country") return `<option value="">Select a country first</option>`;
    const placeholder = `<option value=""${s.mode === "choose" ? " selected" : ""}>Select a city…</option>`;
    const items = s.list.map(c => `<option value="${escapeHtml(c)}"${c === city ? " selected" : ""}>${escapeHtml(c)}</option>`).join("");
    const other = `<option value="${OTHER}"${s.mode === "other" ? " selected" : ""}>Other city…</option>`;
    return placeholder + items + other;
  }

  function countryField(value, {required = false, error = ""} = {}) {
    return `<div class="fld"><label for="country-select">Country${required ? ' <span class="req">*</span>' : ""}</label>` +
      `<select id="country-select" data-place="country">${countryOptions(value)}</select>` +
      `<input type="hidden" id="country" name="country" value="${escapeHtml(value || "")}">${error}</div>`;
  }
  function cityField(country, city, {error = ""} = {}) {
    const s = cityState(country, city);
    return `<div class="fld"><label for="city-select">City</label>` +
      `<select id="city-select" data-place="city"${country ? "" : " disabled"}>${cityOptions(country, city)}</select>` +
      `<input id="city-other" data-place="city-other" type="text" maxlength="255" autocomplete="address-level2" placeholder="Type your city" value="${escapeHtml(s.other)}"${s.mode === "other" ? "" : " hidden"}>` +
      `<input type="hidden" id="city" name="city" value="${escapeHtml(city || "")}">${error}</div>`;
  }

  function setHidden(form, name, value) {
    const input = form.querySelector(`input[type=hidden][name="${name}"]`);
    if (input) input.value = value;
  }
  function syncPlace(event) {
    const el = event.target;
    const kind = el && el.dataset && el.dataset.place;
    const form = el && el.closest && el.closest("form");
    if (!kind || !form) return;
    const citySelect = form.querySelector('[data-place="city"]');
    const cityOther = form.querySelector('[data-place="city-other"]');
    if (kind === "country") {
      setHidden(form, "country", el.value);
      setHidden(form, "city", "");
      if (citySelect) {
        citySelect.innerHTML = cityOptions(el.value, "");
        citySelect.disabled = !el.value;
        if (el.value && !(CITIES[el.value] || []).length) citySelect.value = OTHER;
      }
      if (cityOther) {
        cityOther.value = "";
        cityOther.hidden = !(el.value && citySelect && citySelect.value === OTHER);
      }
    } else if (kind === "city") {
      const other = el.value === OTHER;
      if (cityOther) {cityOther.hidden = !other; if (other) cityOther.focus(); else cityOther.value = "";}
      setHidden(form, "city", other ? (cityOther ? cityOther.value.trim() : "") : el.value);
    }
  }
  // Selects fire "input" before "change"; listen to both so other form handlers see current values.
  document.addEventListener("input", syncPlace);
  document.addEventListener("change", syncPlace);
  document.addEventListener("input", event => {
    const el = event.target;
    if (el && el.dataset && el.dataset.place === "city-other" && el.form) setHidden(el.form, "city", el.value.trim());
  });

  return {countryField, cityField};
})();
