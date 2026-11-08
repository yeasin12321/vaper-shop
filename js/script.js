// Shared behaviour for every page: theme toggle, cart count, header search.
(function () {
  const root = document.documentElement;
  try { const t = localStorage.getItem("bh-theme"); if (t) root.classList.toggle("dark", t === "dark"); } catch (e) {}
  document.addEventListener("click", function (e) {
    const b = e.target.closest('button[aria-label^="Switch to"]'); if (!b) return;
    const dark = !root.classList.contains("dark"); root.classList.toggle("dark", dark);
    b.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    try { localStorage.setItem("bh-theme", dark ? "dark" : "light"); } catch (err) {}
  });
  const hs = document.querySelector('header input[placeholder^="Search"]');
  if (hs && !document.getElementById("search-input")) hs.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && hs.value.trim()) location.href = (location.pathname.includes("/") && /\/(blog|affiliate)\//.test(location.pathname) ? "../" : "") + "products.html?q=" + encodeURIComponent(hs.value.trim());
  });
  if (window.BH && BH.updateCartCount) BH.updateCartCount();
})();

// Home page offer slider
(function () {
  const sec = document.querySelector("section[aria-roledescription=carousel]"); if (!sec) return;
  const track = sec.querySelector(".touch-pan-y"); if (!track) return;
  const slides = [...track.children], n = slides.length; if (n < 2) return;
  const dots = [...sec.querySelectorAll('button[aria-label^="Show offer"]')];
  const prev = sec.querySelector('button[aria-label="Previous offer"]'), next = sec.querySelector('button[aria-label="Next offer"]');
  const act = dots.find(d => d.getAttribute("aria-current") === "true"), idl = dots.find(d => d !== act);
  const actCls = act && act.querySelector("span").className, idlCls = idl && idl.querySelector("span").className;
  slides.forEach(s => { s.style.transform = ""; });
  track.style.transition = "transform .6s ease"; let i = 0, timer;
  function go(k) {
    i = (k + n) % n; track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
    slides.forEach((s, j) => s.setAttribute("aria-hidden", j === i ? "false" : "true"));
    dots.forEach((d, j) => { d.setAttribute("aria-current", j === i ? "true" : "false"); if (actCls) d.querySelector("span").className = j === i ? actCls : idlCls; });
  }
  function play() { clearInterval(timer); timer = setInterval(() => go(i + 1), 5000); }
  if (prev) prev.onclick = () => { go(i - 1); play(); };
  if (next) next.onclick = () => { go(i + 1); play(); };
  dots.forEach((d, j) => d.onclick = () => { go(j); play(); });
  let x0 = null; sec.addEventListener("pointerdown", e => { x0 = e.clientX; });
  sec.addEventListener("pointerup", e => { if (x0 != null && Math.abs(e.clientX - x0) > 40) { go(i + (e.clientX < x0 ? 1 : -1)); play(); } x0 = null; });
  sec.addEventListener("mouseenter", () => clearInterval(timer)); sec.addEventListener("mouseleave", play);
  go(0); play();
})();
