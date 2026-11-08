/* Loads products + plans from Google Sheets (published CSV), falls back to /data/*.csv */
(function () {
  const C = window.Yeaxmi_CONFIG;
  const BH = (window.BH = window.BH || {});

  function parseCSV(text) {
    const rows = []; let row = [], cur = "", q = false;
    text = text.replace(/^\uFEFF/, "");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = ""; if (row.some(c => c.trim() !== "")) rows.push(row); row = [];
      } else cur += ch;
    }
    if (cur !== "" || row.length) { row.push(cur); if (row.some(c => c.trim() !== "")) rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }

  async function getRows(url, fallback, key) {
    const ck = "bh:" + key;
    if (url) {
      try {
        const c = JSON.parse(sessionStorage.getItem(ck) || "null");
        if (c && Date.now() - c.t < C.CACHE_MINUTES * 60000) return c.rows;
      } catch (e) {}
      try {
        const r = await fetch(url); if (!r.ok) throw new Error(r.status);
        const rows = parseCSV(await r.text());
        try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), rows })); } catch (e) {}
        return rows;
      } catch (e) { console.warn("Google Sheet could not be loaded, using local sample data.", e); }
    }
    const r = await fetch(fallback); return parseCSV(await r.text());
  }

  const num = v => { const n = parseFloat(String(v).replace(/[^\d.]/g, "")); return isNaN(n) ? null : n; };
  BH.slugify = t => String(t).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  BH.money = n => "BDT\u00a0" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  BH.taka = n => "\u09F3 " + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  BH.placeholder = name => "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1e293b"/><text x="100" y="125" font-size="80" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">' +
    (name || "?").charAt(0).toUpperCase() + "</text></svg>");

  BH.load = async function () {
    if (BH._p) return BH._p;
    BH._p = (async () => {
      const [prows, lrows] = await Promise.all([
        getRows(C.PRODUCTS_CSV_URL, "data/products.csv", "products"),
        getRows(C.PLANS_CSV_URL, "data/plans.csv", "plans")
      ]);
      const plans = {};
      lrows.forEach(r => { if (!r.slug) return;
        (plans[r.slug] = plans[r.slug] || []).push({ plan: r.plan || "Standard", price: num(r.price) || 0, old_price: num(r.old_price),
          stock: r.stock === "" ? null : num(r.stock), about: r.about || "" }); });
      const products = prows.filter(r => r.slug && r.name && !/^(inactive|hidden|draft|no|false)$/i.test(r.status || ""))
        .map((r, i) => {
          const pl = plans[r.slug] && plans[r.slug].length ? plans[r.slug] : (num(r.price) ? [{ plan: "Standard", price: num(r.price), old_price: null, stock: null, about: r.subtitle }] : []);
          const prices = pl.map(x => x.price);
          return Object.assign({}, r, {
            order: num(r.sort_order) ?? i + 1, plans: pl,
            min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null,
            category: r.category || "Others",
            images: (r.gallery || r.image || "").split("|").map(x => x.trim()).filter(Boolean)
          });
        });
      return { products, bySlug: Object.fromEntries(products.map(p => [p.slug, p])) };
    })();
    return BH._p;
  };

  BH.cart = {
    get() { try { return JSON.parse(localStorage.getItem("bh_cart") || "[]"); } catch (e) { return []; } },
    add(slug, plan) {
      const c = this.get(), f = c.find(x => x.slug === slug && x.plan === plan);
      f ? f.qty++ : c.push({ slug, plan, qty: 1 });
      try { localStorage.setItem("bh_cart", JSON.stringify(c)); } catch (e) {}
      BH.updateCartCount();
    },
    count() { return this.get().reduce((a, x) => a + x.qty, 0); }
  };
  BH.updateCartCount = function () {
    const n = BH.cart.count();
    document.querySelectorAll('a[aria-label^="Cart"]').forEach(a => a.setAttribute("aria-label", "Cart (" + n + ")"));
  };
  BH.toast = function (msg) {
    let t = document.getElementById("bh-toast");
    if (!t) { t = document.createElement("div"); t.id = "bh-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800);
  };
})();
