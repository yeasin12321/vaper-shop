(async function () {
  const C = window.Yeaxmi_CONFIG, $ = s => document.querySelector(s);
  const ICONS = {"AI Tools": "<svg aria-hidden=\"true\" class=\"lucide lucide-sparkles h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"></path><path d=\"M20 3v4\"></path><path d=\"M22 5h-4\"></path><path d=\"M4 17v2\"></path><path d=\"M5 18H3\"></path></svg>", "Adobe Creative Cloud": "<svg aria-hidden=\"true\" class=\"lucide lucide-palette h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"13.5\" cy=\"6.5\" fill=\"currentColor\" r=\".5\"></circle><circle cx=\"17.5\" cy=\"10.5\" fill=\"currentColor\" r=\".5\"></circle><circle cx=\"8.5\" cy=\"7.5\" fill=\"currentColor\" r=\".5\"></circle><circle cx=\"6.5\" cy=\"12.5\" fill=\"currentColor\" r=\".5\"></circle><path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\"></path></svg>", "Digital Key": "<svg aria-hidden=\"true\" class=\"lucide lucide-layout-grid h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"14\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"14\"></rect></svg>", "Editing Tools": "<svg aria-hidden=\"true\" class=\"lucide lucide-layout-grid h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"14\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"14\"></rect></svg>", "Gift Card": "<svg aria-hidden=\"true\" class=\"lucide lucide-layout-grid h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"3\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"14\" y=\"14\"></rect><rect height=\"7\" rx=\"1\" width=\"7\" x=\"3\" y=\"14\"></rect></svg>", "Streaming Tools": "<svg aria-hidden=\"true\" class=\"lucide lucide-tv h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><rect height=\"15\" rx=\"2\" ry=\"2\" width=\"20\" x=\"2\" y=\"7\"></rect><polyline points=\"17 2 12 7 7 2\"></polyline></svg>", "Subscriptions": "<svg aria-hidden=\"true\" class=\"lucide lucide-repeat h-4 w-4 shrink-0\" fill=\"none\" height=\"24\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" viewbox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m17 2 4 4-4 4\"></path><path d=\"M3 11v-1a4 4 0 0 1 4-4h14\"></path><path d=\"m7 22-4-4 4-4\"></path><path d=\"M21 13v1a4 4 0 0 1-4 4H3\"></path></svg>"};
  const grid = $("#product-grid"), cardTpl = $("#card-tpl"), pager = $("#pager"), count = $("#result-count");
  const search = $("#search-input"), sortSel = $("#sort-select"), catList = $("#cat-list");
  const params = new URLSearchParams(location.search);
  let data;
  try { data = await BH.load(); } catch (e) { grid.innerHTML = "<li style='grid-column:1/-1;padding:2rem'>Could not load products.</li>"; console.error(e); return; }
  const all = data.products;
  const cats = [...new Set(all.map(p => p.category))].sort();
  const fromParam = v => { if (!v) return ""; const n = C.CATEGORY_IDS[v] || v; return cats.find(c => BH.slugify(c) === BH.slugify(n)) || ""; };
  const st = { cat: fromParam(params.get("category")), q: params.get("q") || "", sort: params.get("sort") || "recommended", page: +params.get("page") || 1 };
  search.value = st.q; sortSel.value = st.sort;

  function renderCats() {
    catList.innerHTML = "";
    const mk = (label, active, icon, onclick) => {
      const b = document.importNode((active ? $("#cat-active") : $("#cat-idle")).content, true).querySelector("button");
      b.querySelector("[data-f=label]").textContent = label;
      if (icon) { const sv = b.querySelector("svg"); sv.outerHTML = icon; }
      b.addEventListener("click", onclick); catList.appendChild(b);
    };
    mk("All categories", !st.cat, null, () => { st.cat = ""; st.page = 1; update(); });
    cats.forEach(c => mk(c, st.cat === c, ICONS[c] || ICONS["Digital Key"], () => { st.cat = c; st.page = 1; update(); }));
  }

  function fill(li, p) {
    const q = f => li.querySelector("[data-f=" + f + "]"), url = "product.html?slug=" + encodeURIComponent(p.slug);
    const img = q("img"); img.src = p.images[0] || BH.placeholder(p.name); img.alt = p.name;
    li.querySelectorAll("[data-f=link]").forEach(a => { a.href = url; });
    li.querySelector("a[title='Buy Now']").setAttribute("aria-label", "Buy Now: " + p.name);
    q("title").title = p.name + (p.subtitle ? ", " + p.subtitle : ""); q("name").textContent = p.name;
    q("category").textContent = p.category; q("subtitle").textContent = p.subtitle || "";
    const rt = q("rating"), sd = q("sold");
    if (p.rating && rt) { [...rt.childNodes].filter(n => n.nodeType === 3).forEach(n => n.remove()); rt.append(p.rating); } else if (rt) rt.remove();
    if (p.sold && sd) sd.textContent = p.sold + " sold"; else if (sd) sd.remove();
    const price = q("price"), from = q("from");
    if (p.min != null) { price.textContent = BH.money(p.min); if (!(p.max > p.min || /^(yes|true|1)$/i.test(p.price_from || "")) && from) from.remove(); }
    else { price.textContent = "Contact us"; if (from) from.remove(); }
    let disc = p.badge; const pl = p.plans.find(x => x.old_price && x.old_price > x.price);
    if (!disc && pl) disc = "Save " + Math.round((1 - pl.price / pl.old_price) * 100) + "%";
    const b = q("badge"), n = q("plans");
    if (disc && b) b.textContent = disc; else if (b) b.remove();
    if (p.plans.length > 1 && n) n.textContent = p.plans.length + " plans"; else if (n) n.remove();
    const cart = q("cart"); cart.setAttribute("aria-label", "Add to Cart: " + p.name);
    cart.addEventListener("click", () => { BH.cart.add(p.slug, (p.plans[0] || {}).plan || "Standard"); BH.toast("Added to cart"); });
  }

  function view() {
    const t = st.q.trim().toLowerCase();
    let l = all.filter(p => (!st.cat || p.category === st.cat) && (!t || (p.name + " " + (p.subtitle || "") + " " + p.category).toLowerCase().includes(t)));
    const s = { recommended: (a, b) => a.order - b.order, newest: (a, b) => b.order - a.order,
      "price-asc": (a, b) => (a.min ?? 1e12) - (b.min ?? 1e12), "price-desc": (a, b) => (b.min ?? -1) - (a.min ?? -1),
      name: (a, b) => a.name.localeCompare(b.name) }[st.sort] || ((a, b) => a.order - b.order);
    return l.sort(s);
  }

  function update() {
    const l = view(), per = C.PER_PAGE, pages = Math.max(1, Math.ceil(l.length / per));
    st.page = Math.min(Math.max(1, st.page), pages);
    const slice = l.slice((st.page - 1) * per, st.page * per);
    grid.innerHTML = "";
    slice.forEach(p => { const li = document.importNode(cardTpl.content, true).querySelector("li"); fill(li, p); grid.appendChild(li); });
    if (!slice.length) grid.innerHTML = "<li style='grid-column:1/-1;padding:3rem 0;text-align:center;opacity:.7'>No products found.</li>";
    count.textContent = l.length ? (st.page - 1) * per + 1 + "-" + ((st.page - 1) * per + slice.length) + " of " + l.length + " products" : "0 products";
    pager.innerHTML = "";
    if (pages > 1) for (let i = 1; i <= pages; i++) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = i; if (i === st.page) b.className = "on";
      b.onclick = () => { st.page = i; update(); window.scrollTo({ top: 0, behavior: "smooth" }); }; pager.appendChild(b);
    }
    renderCats();
    const u = new URLSearchParams(); if (st.cat) u.set("category", BH.slugify(st.cat)); if (st.q) u.set("q", st.q);
    if (st.sort !== "recommended") u.set("sort", st.sort); if (st.page > 1) u.set("page", st.page);
    history.replaceState(null, "", u.toString() ? "?" + u : location.pathname);
  }
  search.addEventListener("input", () => { st.q = search.value; st.page = 1; update(); });
  sortSel.addEventListener("change", () => { st.sort = sortSel.value; st.page = 1; update(); });
  update(); BH.updateCartCount();
})();
