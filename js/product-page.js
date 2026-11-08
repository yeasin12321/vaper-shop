(async function () {
  const C = window.BOHURUP_CONFIG, q = f => document.querySelector("[data-f=" + f + "]");
  const slug = new URLSearchParams(location.search).get("slug");
  let data;
  try { data = await BH.load(); } catch (e) { console.error(e); }
  const p = data && data.bySlug[slug];
  if (!p) {
    document.querySelector("main").innerHTML = '<div class="container" style="padding:5rem 1rem;text-align:center"><h1 style="font-size:1.75rem;font-weight:700">Product not found</h1><p style="margin:1rem 0">This product is not in the list.</p><a href="products.html" style="color:hsl(var(--primary))">Back to all products</a></div>';
    return;
  }
  document.title = p.name + " | Yeaxmi";
  q("crumb-cat").textContent = p.category; q("crumb-cat").href = "products.html?category=" + BH.slugify(p.category);
  document.querySelectorAll("[data-f=crumb-name]").forEach(x => x.textContent = p.name);
  q("category").textContent = p.category; q("name").textContent = p.name; q("subtitle").textContent = p.subtitle || "";
  const dl = q("desc-long"); if (dl) dl.textContent = p.description || p.subtitle || "";
  const hp = q("description"); hp.textContent = p.description || p.subtitle || "";

  // gallery
  const imgs = p.images.length ? p.images : [BH.placeholder(p.name)];
  let cur = 0; const main = q("main-img"), thumbs = q("thumbs"), counter = q("counter");
  const thumbTpl = thumbs.querySelector("button").cloneNode(true); thumbs.innerHTML = "";
  function showImg(i) {
    cur = (i + imgs.length) % imgs.length; main.src = imgs[cur]; main.alt = p.name; counter.textContent = (cur + 1) + " / " + imgs.length;
    [...thumbs.children].forEach((t, k) => t.style.outline = k === cur ? "2px solid hsl(var(--primary))" : "none");
  }
  imgs.forEach((src, i) => { const t = thumbTpl.cloneNode(true); t.querySelector("img").src = src; t.onclick = () => showImg(i); thumbs.appendChild(t); });
  thumbs.style.display = imgs.length > 1 ? "" : "none";
  [q("prev"), q("next")].forEach(b => { if (b) b.style.display = imgs.length > 1 ? "" : "none"; });
  if (q("prev")) q("prev").onclick = () => showImg(cur - 1); if (q("next")) q("next").onclick = () => showImg(cur + 1);
  counter.style.display = imgs.length > 1 ? "" : "none"; showImg(0);

  // stats
  const st = q("stats").querySelectorAll("span");
  st[0].textContent = p.rating ? "\u2605 " + p.rating : "No reviews yet";
  if (p.sold) st[2].textContent = p.sold + " sold"; else { st[1].remove(); st[2].remove(); }

  // plans
  const list = q("plan-list"), act = list.children[0].cloneNode(true), idle = (list.children[1] || list.children[0]).cloneNode(true);
  let sel = 0; const plans = p.plans.length ? p.plans : [{ plan: "Standard", price: 0, stock: null, about: p.subtitle || "" }];
  function renderPlans() {
    list.innerHTML = "";
    plans.forEach((pl, i) => {
      const b = (i === sel ? act : idle).cloneNode(true);
      b.querySelector("span.line-clamp-2").textContent = pl.plan;
      const spans = b.querySelectorAll("span"); spans[spans.length - 1].textContent = BH.taka(pl.price);
      b.onclick = () => { sel = i; renderPlans(); }; list.appendChild(b);
    });
    const pl = plans[sel];
    q("plan-count").textContent = plans.length + (plans.length > 1 ? " options" : " option");
    q("plans-section").style.display = plans.length > 1 ? "" : "none";
    q("price").textContent = BH.taka(pl.price); q("plan-label").textContent = pl.plan;
    q("about").textContent = pl.about || p.description || ""; q("about-section").style.display = (pl.about || p.description) ? "" : "none";
    const rm = q("readmore"); if (rm) rm.style.display = "none";
    const out = pl.stock === 0, stock = q("stock");
    stock.textContent = pl.stock == null ? "In stock" : out ? "Out of stock" : "In stock: " + pl.stock + " available";
    [q("add-cart"), q("buy-now")].forEach(b => { b.disabled = out; b.style.opacity = out ? ".5" : ""; });
  }
  renderPlans();
  q("add-cart").onclick = () => { BH.cart.add(p.slug, plans[sel].plan); BH.toast("Added to cart"); };
  q("buy-now").onclick = () => { BH.cart.add(p.slug, plans[sel].plan); location.href = C.CHECKOUT_URL + "?product=" + encodeURIComponent(p.slug) + "&plan=" + encodeURIComponent(plans[sel].plan); };

  // accordion
  const acc = q("accordion"), tpl = document.getElementById("acc-tpl"); acc.innerHTML = "";
  const secs = [["What you get", p.what_you_get], ["How you get it", p.how_you_get_it], ["Delivery time", p.delivery_time], ["Rules of use", p.rules_of_use], ["Support", p.support]].filter(s => s[1]);
  secs.forEach(([title, text], i) => {
    const li = document.importNode(tpl.content, true).querySelector("li");
    li.querySelector("span").textContent = title;
    const body = document.createElement("div"); body.className = "acc-body"; body.hidden = i !== 0;
    if (title === "What you get") { const ul = document.createElement("ul"); text.split("|").forEach(t => { const x = document.createElement("li"); x.textContent = t.trim(); ul.appendChild(x); }); body.appendChild(ul); }
    else body.textContent = text;
    li.appendChild(body);
    li.querySelector("button").onclick = () => { body.hidden = !body.hidden; };
    acc.appendChild(li);
  });
  BH.updateCartCount();
})();
