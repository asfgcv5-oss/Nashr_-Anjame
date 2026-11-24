/* ==========================================================
   BOOKORA — Core (data layer, cart, wishlist, search, layout)
   Plain JavaScript, no build step.
   ========================================================== */
(function () {
  "use strict";
  const B = (window.B = {});
  const d = document;

  /* ---------- tiny helpers ---------- */
  B.$ = (s, r = d) => r.querySelector(s);
  B.$$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  B.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  B.fa = (n) => String(n).replace(/\d/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[x]);
  B.num = (n) => B.fa(Math.round(+n || 0).toLocaleString("en-US").replace(/,/g, "٬"));
  B.money = (n) => `${B.num(n)} <small>تومان</small>`;
  B.moneyText = (n) => `${B.num(n)} تومان`;
  B.debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  B.qs = () => new URLSearchParams(location.search);
  B.ls = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full / private mode */ } },
  };
  B.date = (iso) => { try { return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso)); } catch (e) { return ""; } };
  B.norm = (s) => String(s ?? "")
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[ةۀ]/g, "ه").replace(/[ؤ]/g, "و").replace(/[أإآ]/g, "ا")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/\u200c/g, " ")
    .replace(/[۰-۹]/g, (c) => c.charCodeAt(0) - 1776).replace(/[٠-٩]/g, (c) => c.charCodeAt(0) - 1632)
    .toLowerCase().replace(/\s+/g, " ").trim();

  /* ---------- icons ---------- */
  const IC = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5V4.5M8 7h8M8 11h6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    heart: '<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 0 0 0-7.4z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', down: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    truck: '<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>',
    tag: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 9H3c0-1 3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    compare: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    news: '<path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M19 9h2v9a2 2 0 0 1-2 2M8 8h7M8 12h7M8 16h4"/>',
    megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1zM19 8a5 5 0 0 1 0 8"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    cube: '<path d="M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7"/>',
  };
  B.icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ""}</svg>`;

  /* ---------- API helper (PHP backend) ---------- */
  B.api = async (path, data, method) => {
    try {
      const opt = { method: method || (data ? "POST" : "GET"), headers: { "X-Requested-With": "bookora", Accept: "application/json" }, credentials: "same-origin" };
      if (data) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(data); }
      const r = await fetch(path, opt);
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch (e) { j = null; }
      if (!j) return { ok: false, error: /^\s*<\?php/.test(t) || r.status === 404 || r.status === 405 || r.status === 501 ? "سرور PHP در دسترس نیست. این قابلیت پس از آپلود روی هاست فعال می‌شود." : "پاسخ نامعتبر از سرور (" + r.status + ")" };
      return j;
    } catch (e) { return { ok: false, error: "اتصال به سرور برقرار نشد." }; }
  };

  /* ---------- Store data ---------- */
  B.data = null;
  B.load = async () => {
    if (B.data) return B.data;
    const r = await fetch("/data/store.json", { cache: "no-cache" });
    const s = await r.json();
    const idx = (a) => Object.fromEntries((a || []).map((x) => [x.id, x]));
    s._a = idx(s.authors); s._p = idx(s.publishers); s._c = idx(s.categories); s._b = idx(s.products); s._k = idx(s.collections);
    s.products = s.products.filter((p) => p.published !== false);
    s.products.forEach((p) => {
      const a = s._a[p.author], pu = s._p[p.publisher], c = s._c[p.category];
      p._s = B.norm([p.title, p.subtitle, a && a.name, pu && pu.name, c && c.name, p.isbn, p.sku].join(" "));
      p._isbn = String(p.isbn || "").replace(/[^0-9xX]/g, "");
    });
    B.data = s; return s;
  };
  const S = () => B.data;
  B.settings = () => S().settings;
  B.author = (id) => S()._a[id]; B.publisher = (id) => S()._p[id]; B.category = (id) => S()._c[id];
  B.product = (id) => S().products.find((p) => p.id === id);
  B.final = (p) => Math.round(p.price * (1 - (p.discount || 0) / 100));
  B.inStock = (p) => (p.stock || 0) > 0;
  B.liveArticles = () => {
    const now = Date.now();
    return S().articles.filter((a) => a.status === "published" && (!a.publishAt || new Date(a.publishAt).getTime() <= now) && new Date(a.date).getTime() <= now + 86400000)
      .sort((x, y) => new Date(y.date) - new Date(x.date));
  };
  const clean = () => !!(S() && S().settings.cleanUrls);
  B.url = {
    book: (p) => (clean() ? "/book/" + encodeURIComponent(p.slug) : "/book.html?slug=" + encodeURIComponent(p.slug)),
    cat: (c) => "/shop.html?cat=" + encodeURIComponent(c.slug),
    author: (a) => "/authors.html?slug=" + encodeURIComponent(a.slug),
    publisher: (p) => "/publishers.html?slug=" + encodeURIComponent(p.slug),
    article: (a) => "/news.html?slug=" + encodeURIComponent(a.slug),
    coll: (k) => "/collections.html?slug=" + encodeURIComponent(k.slug),
  };
  B.abs = (path) => ((S() && S().settings.baseUrl) || location.origin).replace(/\/$/, "") + path;

  /* ---------- Cover (generated cover if no image) ---------- */
  const PAL = [["#1769E8", "#318CF5"], ["#101D35", "#2456B8"], ["#0F3B8C", "#4DA3FF"], ["#1E3A8A", "#60A5FA"], ["#134E9E", "#38BDF8"], ["#0B2A66", "#2F80ED"], ["#3730A3", "#6AA8FF"], ["#0E7490", "#5BC0F8"]];
  B.cover = (p, o = {}) => {
    const img = p.images && p.images[0];
    const alt = B.esc(`جلد کتاب ${p.title}`);
    if (img) return `<div class="cover has-img"><img src="${B.esc(img)}" alt="${alt}" ${o.eager ? "" : 'loading="lazy"'} decoding="async"></div>`;
    let h = 0; for (const ch of p.id + p.title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [c1, c2] = PAL[h % PAL.length];
    const a = B.author(p.author);
    return `<div class="cover" role="img" aria-label="${alt}" style="--c1:${c1};--c2:${c2}"><i class="cv-shape s1"></i><i class="cv-shape s2"></i><div class="cv-t">${B.esc(p.title)}</div><div><div class="cv-line"></div><div class="cv-a">${B.esc(a ? a.name : "")}</div></div></div>`;
  };

  /* ---------- Cart ---------- */
  const CK = "bk_cart_v1";
  B.cart = {
    st() { const c = B.ls.get(CK, { items: [], coupon: null }); c.items = c.items || []; return c; },
    save(c) { B.ls.set(CK, c); B.refreshBadges(); d.dispatchEvent(new CustomEvent("cart:change")); },
    add(id, qty = 1) {
      const p = B.product(id); if (!p) return false;
      if (!B.inStock(p)) { B.toast("این کتاب موجود نیست", "err"); return false; }
      const c = this.st(); const it = c.items.find((i) => i.id === id);
      const next = (it ? it.qty : 0) + qty;
      if (next > p.stock) { B.toast(`حداکثر موجودی این کتاب ${B.fa(p.stock)} عدد است`, "err"); return false; }
      if (it) it.qty = next; else c.items.push({ id, qty });
      this.save(c); B.toast(`«${p.title}» به سبد خرید اضافه شد`, "ok"); return true;
    },
    set(id, qty) { const c = this.st(); const p = B.product(id); const it = c.items.find((i) => i.id === id); if (!it) return;
      qty = Math.max(0, Math.min(qty, p ? p.stock : qty)); if (qty === 0) c.items = c.items.filter((i) => i.id !== id); else it.qty = qty; this.save(c); },
    remove(id) { const c = this.st(); c.items = c.items.filter((i) => i.id !== id); this.save(c); },
    clear() { this.save({ items: [], coupon: null }); },
    count() { return this.st().items.reduce((s, i) => s + i.qty, 0); },
    lines() { return this.st().items.map((i) => ({ ...i, p: B.product(i.id) })).filter((l) => l.p); },
    setCoupon(cp) { const c = this.st(); c.coupon = cp; this.save(c); },
    totals(shipId) {
      const lines = this.lines(); const st = this.st();
      const original = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
      const subtotal = lines.reduce((s, l) => s + B.final(l.p) * l.qty, 0);
      const bookDisc = original - subtotal;
      const cp = st.coupon; let coupon = 0;
      if (cp) {
        let base = 0;
        lines.forEach((l) => {
          const okP = !cp.productIds || !cp.productIds.length || cp.productIds.includes(l.p.id);
          const okC = !cp.categoryIds || !cp.categoryIds.length || cp.categoryIds.includes(l.p.category);
          if (okP && okC) base += B.final(l.p) * l.qty;
        });
        if (cp.minOrder && subtotal < cp.minOrder) base = 0;
        coupon = cp.type === "percent" ? Math.floor((base * cp.value) / 100) : Math.min(cp.value, base);
        if (cp.maxDiscount) coupon = Math.min(coupon, cp.maxDiscount);
      }
      const ms = (B.settings().shippingMethods || []).filter((m) => m.enabled !== false);
      const m = ms.find((x) => x.id === shipId) || null;
      const free = subtotal - coupon >= (B.settings().freeShippingThreshold || Infinity);
      const shipping = m ? (free && m.freeEligible ? 0 : m.price) : 0;
      return { lines, original, subtotal, bookDisc, coupon, shipping, free, method: m, total: Math.max(0, subtotal - coupon + shipping) };
    },
  };

  /* ---------- Wishlist / compare / recent / history ---------- */
  const listStore = (key, max) => ({
    all: () => B.ls.get(key, []),
    has(id) { return this.all().includes(id); },
    toggle(id) { let a = this.all(); const had = a.includes(id); a = had ? a.filter((x) => x !== id) : [id, ...a].slice(0, max); B.ls.set(key, a); B.refreshBadges(); return !had; },
    push(id) { const a = [id, ...this.all().filter((x) => x !== id)].slice(0, max); B.ls.set(key, a); },
    clear() { B.ls.set(key, []); B.refreshBadges(); },
  });
  B.wish = listStore("bk_wish", 200); B.cmp = listStore("bk_cmp", 4); B.recent = listStore("bk_recent", 14); B.history = listStore("bk_hist", 8);

  B.refreshBadges = () => {
    const set = (sel, n) => B.$$(sel).forEach((e) => { e.textContent = n ? B.fa(n) : ""; e.dataset.n = n; });
    set("[data-badge=cart]", B.cart.count()); set("[data-badge=wish]", B.wish.all().length); set("[data-badge=cmp]", B.cmp.all().length);
    B.$$("[data-act=wish]").forEach((b) => b.classList.toggle("on", B.wish.has(b.dataset.id)));
    B.$$("[data-act=cmp]").forEach((b) => b.classList.toggle("on", B.cmp.has(b.dataset.id)));
  };

  /* ---------- Toast / modal ---------- */
  B.toast = (msg, type = "") => {
    let box = B.$(".toasts"); if (!box) { box = d.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); d.body.appendChild(box); }
    const t = d.createElement("div"); t.className = "toast " + type; t.innerHTML = B.icon(type === "err" ? "info" : "check") + `<span>${B.esc(msg)}</span>`;
    box.appendChild(t); setTimeout(() => { t.style.opacity = 0; t.style.transition = ".3s"; setTimeout(() => t.remove(), 300); }, 3200);
  };
  B.modal = (html) => {
    let m = B.$("#modal"); if (!m) { m = d.createElement("div"); m.id = "modal"; m.className = "modal-bg"; d.body.appendChild(m); m.addEventListener("click", (e) => { if (e.target === m) B.closeModal(); }); }
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="modal-x" aria-label="بستن" data-close>${B.icon("x")}</button>${html}</div>`;
    m.classList.add("open"); d.body.style.overflow = "hidden";
  };
  B.closeModal = () => { const m = B.$("#modal"); if (m) m.classList.remove("open"); d.body.style.overflow = ""; };
  d.addEventListener("keydown", (e) => { if (e.key === "Escape") { B.closeModal(); closeDrawer(); closeSuggest(); } });

  /* ---------- Product card & carousels ---------- */
  B.card = (p, o = {}) => {
    const a = B.author(p.author), pu = B.publisher(p.publisher), fin = B.final(p), out = !B.inStock(p);
    const isNew = Date.now() - new Date(p.createdAt).getTime() < 21 * 864e5;
    const stock = out ? '<span class="stock out">ناموجود</span>' : p.stock <= 3 ? `<span class="stock low">تنها ${B.fa(p.stock)} عدد</span>` : '<span class="stock ok">موجود</span>';
    const extra = [p.pages ? `${B.fa(p.pages)} صفحه` : "", p.year ? `سال ${B.fa(p.year)}` : "", p.binding || ""].filter(Boolean).join(" · ");
    return `<article class="card" data-id="${p.id}">
      <div class="card-img">
        ${p.discount > 0 ? `<span class="card-badge">${B.fa(p.discount)}٪</span>` : isNew ? '<span class="card-badge new">جدید</span>' : ""}
        <div class="card-acts">
          <button data-act="wish" data-id="${p.id}" class="wish" aria-label="افزودن به علاقه‌مندی‌ها" title="علاقه‌مندی">${B.icon("heart")}</button>
          <button data-act="cmp" data-id="${p.id}" aria-label="مقایسه" title="مقایسه">${B.icon("compare")}</button>
          <button data-act="qv" data-id="${p.id}" class="qv-b" aria-label="نمایش سریع" title="نمایش سریع">${B.icon("eye")}</button>
        </div>
        <a href="${B.url.book(p)}" aria-label="${B.esc(p.title)}">${B.cover(p)}</a>
      </div>
      <div class="card-body">
        <a class="card-title" href="${B.url.book(p)}">${B.esc(p.title)}</a>
        <div class="card-meta">${a ? `<a href="${B.url.author(a)}">${B.esc(a.name)}</a>` : ""}</div>
        <div class="card-meta">${pu ? `<a href="${B.url.publisher(pu)}">${B.esc(pu.name)}</a>` : ""}</div>
        ${p.ratingCount > 0 ? `<span class="rating">${B.icon("star")} ${B.fa(p.rating)} <small class="text-muted">(${B.fa(p.ratingCount)})</small></span>` : ""}
        <div>${stock}</div>
        ${extra ? `<div class="card-extra">${B.esc(extra)}</div>` : ""}
      </div>
      <div class="card-foot">
        <div class="price">${p.discount > 0 ? `<del>${B.num(p.price)}</del>` : ""}<b>${B.money(fin)}</b></div>
        <button class="add-btn" data-act="add" data-id="${p.id}" ${out ? "disabled" : ""} aria-label="افزودن به سبد خرید">${B.icon("cart")}</button>
      </div>
    </article>`;
  };
  B.carousel = (html) => `<div class="car-wrap"><button class="car-btn prev" data-car="-1" aria-label="قبلی">${B.icon("right")}</button><div class="car">${html}</div><button class="car-btn next" data-car="1" aria-label="بعدی">${B.icon("left")}</button></div>`;
  B.secHead = (eyebrow, title, sub, link, linkText = "مشاهده همه") => `<div class="sec-head"><div>${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${link ? `<a class="sec-link" href="${link}">${linkText} ${B.icon("left")}</a>` : ""}</div>`;
  B.crumbs = (arr) => `<nav class="crumbs" aria-label="breadcrumb">${[["/", "خانه"], ...arr].map((c, i, a) => (i < a.length - 1 ? `<a href="${c[0]}">${B.esc(c[1])}</a><span class="sep">‹</span>` : `<span>${B.esc(c[1])}</span>`)).join("")}</nav>`;
  B.crumbsLd = (arr) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [["/", "خانه"], ...arr].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[1], item: B.abs(c[0] || "/") })) });

  B.quickView = (id) => {
    const p = B.product(id); if (!p) return; const a = B.author(p.author), fin = B.final(p);
    B.modal(`<div class="qv"><div class="qv-img">${B.cover(p, { eager: true })}</div><div>
      <h2 style="font-size:24px">${B.esc(p.title)}</h2>
      <p class="text-muted">${a ? `نویسنده: ${B.esc(a.name)}` : ""}</p>
      <div class="pdp-price mt"><b>${B.money(fin)}</b>${p.discount > 0 ? `<del>${B.num(p.price)}</del><span class="off">${B.fa(p.discount)}٪</span>` : ""}</div>
      <p class="mt text-muted" style="font-size:14px">${B.esc((p.description || "").slice(0, 220))}${(p.description || "").length > 220 ? "…" : ""}</p>
      <div class="buy-row"><button class="btn btn-primary" data-act="add" data-id="${p.id}" ${B.inStock(p) ? "" : "disabled"}>${B.icon("cart")} افزودن به سبد</button><a class="btn btn-light" href="${B.url.book(p)}">مشاهده صفحه کتاب</a></div></div></div>`);
  };

  /* ---------- SEO ---------- */
  B.seo = ({ title, desc, image, canonical, type = "website", jsonld = [] } = {}) => {
    const name = S() ? S().settings.siteName : "بوکورا";
    const full = title ? `${title} | ${name}` : `${name} | ${S() ? S().settings.tagline : ""}`;
    d.title = full;
    const meta = (attr, key, val) => { if (!val) return; let m = d.head.querySelector(`meta[${attr}="${key}"]`); if (!m) { m = d.createElement("meta"); m.setAttribute(attr, key); d.head.appendChild(m); } m.setAttribute("content", val); };
    desc = (desc || (S() && S().settings.tagline) || "").replace(/<[^>]+>/g, "").slice(0, 160);
    meta("name", "description", desc); meta("property", "og:title", full); meta("property", "og:description", desc); meta("property", "og:type", type);
    meta("property", "og:locale", "fa_IR"); meta("property", "og:site_name", name); meta("name", "twitter:card", image ? "summary_large_image" : "summary");
    if (image) { const abs = image.startsWith("http") ? image : B.abs(image); meta("property", "og:image", abs); meta("name", "twitter:image", abs); }
    const url = B.abs(canonical || location.pathname + (canonical === undefined ? location.search : ""));
    let l = d.head.querySelector('link[rel="canonical"]'); if (!l) { l = d.createElement("link"); l.rel = "canonical"; d.head.appendChild(l); } l.href = url; meta("property", "og:url", url);
    d.head.querySelectorAll("script[data-ld]").forEach((s) => s.remove());
    jsonld.forEach((j) => { const s = d.createElement("script"); s.type = "application/ld+json"; s.dataset.ld = 1; s.textContent = JSON.stringify(j); d.head.appendChild(s); });
  };

  /* ---------- Search ---------- */
  B.search = (q, opt = {}) => {
    const n = B.norm(q); if (!n) return [];
    const digits = n.replace(/[^0-9x]/g, ""); const isIsbn = /^[0-9\- x]+$/.test(n) && digits.length >= 4;
    const toks = n.split(" ");
    return S().products.map((p) => {
      let sc = 0;
      if (isIsbn && (p._isbn.includes(digits) || String(p.sku).toLowerCase().includes(n))) sc += 100;
      const t = B.norm(p.title);
      if (toks.every((k) => p._s.includes(k))) { sc += 10; if (t.startsWith(n)) sc += 30; else if (t.includes(n)) sc += 15; }
      return { p, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, opt.limit || 200).map((x) => x.p);
  };
  let sgIdx = -1;
  function closeSuggest() { const s = B.$("#suggest"); if (s) s.classList.remove("open"); }
  function renderSuggest(q) {
    const box = B.$("#suggest"); if (!box) return; const n = B.norm(q); let h = "";
    if (!n) {
      const hist = B.history.all();
      const pop = (S().settings.popularSearches && S().settings.popularSearches.length ? S().settings.popularSearches : S().categories.slice(0, 6).map((c) => c.name));
      if (hist.length) h += `<div class="sg-title">جستجوهای اخیر <button data-clear-hist>پاک کردن</button></div><div>${hist.map((x) => `<a class="sg-chip" href="/shop.html?q=${encodeURIComponent(x)}">${B.icon("clock")}${B.esc(x)}</a>`).join("")}</div>`;
      h += `<div class="sg-title">جستجوهای پرطرفدار</div><div>${pop.map((x) => `<a class="sg-chip" href="/shop.html?q=${encodeURIComponent(x)}">${B.esc(x)}</a>`).join("")}</div>`;
    } else {
      const books = B.search(q, { limit: 5 });
      const au = S().authors.filter((a) => B.norm(a.name).includes(n)).slice(0, 3);
      const pu = S().publishers.filter((a) => B.norm(a.name).includes(n)).slice(0, 3);
      const ct = S().categories.filter((a) => B.norm(a.name).includes(n)).slice(0, 3);
      if (books.length) h += `<div class="sg-title">کتاب‌ها</div>` + books.map((p) => `<a class="sg-item" href="${B.url.book(p)}"><div style="width:38px">${B.cover(p)}</div><div><strong>${B.esc(p.title)}</strong><small>${B.esc((B.author(p.author) || {}).name || "")} · ${B.moneyText(B.final(p))}</small></div></a>`).join("");
      if (au.length) h += `<div class="sg-title">نویسندگان</div>` + au.map((a) => `<a class="sg-item" href="${B.url.author(a)}"><span class="sg-av">${B.esc(a.name[0])}</span><div><strong>${B.esc(a.name)}</strong><small>نویسنده</small></div></a>`).join("");
      if (pu.length) h += `<div class="sg-title">ناشران</div>` + pu.map((a) => `<a class="sg-item" href="${B.url.publisher(a)}"><span class="sg-av" style="border-radius:12px">${B.esc(a.name[0])}</span><div><strong>${B.esc(a.name)}</strong><small>ناشر</small></div></a>`).join("");
      if (ct.length) h += `<div class="sg-title">دسته‌بندی‌ها</div>` + ct.map((a) => `<a class="sg-item" href="${B.url.cat(a)}"><span class="sg-av" style="border-radius:12px;background:var(--light)">${a.icon || "📚"}</span><div><strong>${B.esc(a.name)}</strong></div></a>`).join("");
      h += books.length || au.length || pu.length || ct.length ? `<a class="sg-item" href="/shop.html?q=${encodeURIComponent(q)}" style="color:var(--blue);font-weight:700;justify-content:center">مشاهده همه نتایج «${B.esc(q)}»</a>` : `<div class="sg-empty">نتیجه‌ای برای «${B.esc(q)}» پیدا نشد.</div>`;
    }
    box.innerHTML = h; box.classList.add("open"); sgIdx = -1;
  }

  /* ---------- Layout: header / footer / nav ---------- */
  function closeDrawer() { const a = B.$(".drawer"), b = B.$(".drawer-bg"); if (a) a.classList.remove("open"); if (b) b.classList.remove("open"); }
  const page = () => d.body.dataset.page || "";
  B.layout = () => {
    const s = S().settings; const pg = page();
    const cats = S().categories.filter((c) => !c.parent);
    const feat = S().collections.find((k) => k.type === "discount") || S().collections[0];
    const nav = [["/", "خانه", "home"], ["/shop.html", "فروشگاه", "shop"], ["MEGA"], ["/authors.html", "نویسندگان", "authors"], ["/publishers.html", "ناشران", "publishers"], ["/shop.html?list=new", "تازه‌ها", "new"], ["/shop.html?list=best", "پرفروش‌ها", "best"], ["/shop.html?list=offers", "پیشنهاد ویژه", "offers"], ["/news.html", "اعلانات", "news"]];
    const navHtml = nav.map((n) => n[0] === "MEGA"
      ? `<div class="has-mega"><a href="/categories.html" class="${pg === "categories" ? "active" : ""}">دسته‌بندی‌ها ${B.icon("down")}</a><div class="mega"><div class="container mega-in"><div class="mega-cats">${cats.map((c) => `<a class="mega-cat" href="${B.url.cat(c)}"><i>${c.icon || "📚"}</i>${B.esc(c.name)}</a>`).join("")}</div><div class="mega-feat"><span class="tag-pill" style="align-self:flex-start;margin-bottom:10px">مجموعه ویژه</span><h4>${B.esc(feat ? feat.title : "جدیدترین کتاب‌ها")}</h4><p>${B.esc(feat ? feat.desc : "تازه‌های فروشگاه را ببینید")}</p><a class="btn btn-white btn-sm" style="align-self:flex-start" href="${feat ? B.url.coll(feat) : "/shop.html?list=new"}">مشاهده ${B.icon("left")}</a></div></div></div></div>`
      : `<a href="${n[0]}" class="${pg === n[2] ? "active" : ""}">${n[1]}</a>`).join("");
    const hdr = `${s.announceBar ? `<div class="topbar">${B.esc(s.announceBar)}${s.announceLink ? `<a href="${B.esc(s.announceLink)}">اطلاعات بیشتر</a>` : ""}</div>` : ""}
    <header class="header" id="header"><div class="container header-in">
      <button class="icon-btn menu-btn" data-drawer aria-label="منو">${B.icon("menu")}</button>
      <a class="logo" href="/" aria-label="${B.esc(s.siteName)}"><span class="logo-mark">${B.icon("book")}</span><span class="txt">${B.esc(s.siteNameEn || "BOOKORA").replace(/(.)$/, "<b>$1</b>")}</span></a>
      <nav class="nav" aria-label="منوی اصلی">${navHtml}</nav>
      <div class="search-wrap" id="searchWrap"><form class="search-box" action="/shop.html" role="search" autocomplete="off">${B.icon("search")}<input id="q" name="q" type="search" placeholder="جستجوی کتاب، نویسنده، ناشر یا ISBN…" aria-label="جستجو" autocomplete="off"></form><div class="suggest" id="suggest"></div></div>
      <div class="header-tools">
        <button class="icon-btn mobile-search-btn" data-search-toggle aria-label="جستجو">${B.icon("search")}</button>
        <a class="icon-btn hide-m" href="/wishlist.html" aria-label="علاقه‌مندی‌ها" title="علاقه‌مندی‌ها">${B.icon("heart")}<span class="badge-dot" data-badge="wish"></span></a>
        <a class="icon-btn hide-m" href="/account.html" aria-label="حساب کاربری" title="حساب من">${B.icon("user")}</a>
        <a class="icon-btn" href="/cart.html" aria-label="سبد خرید" title="سبد خرید">${B.icon("cart")}<span class="badge-dot" data-badge="cart"></span></a>
      </div></div></header>`;
    const drawerLinks = [["/", "home", "خانه"], ["/shop.html", "book", "فروشگاه"], ["/categories.html", "grid", "دسته‌بندی‌ها"], ["/authors.html", "user", "نویسندگان"], ["/publishers.html", "package", "ناشران"], ["/shop.html?list=new", "star", "تازه‌ها"], ["/shop.html?list=best", "tag", "پرفروش‌ها"], ["/shop.html?list=offers", "gift", "پیشنهادهای ویژه"], ["/collections.html", "cube", "مجموعه‌ها"], ["/news.html", "megaphone", "اعلانات و مجله"]];
    const drawer = `<div class="drawer-bg" data-drawer-close></div><aside class="drawer" aria-label="منو"><div class="flex between items-c mb"><a class="logo" href="/"><span class="logo-mark">${B.icon("book")}</span><span>BOOKOR<b>A</b></span></a><button class="icon-btn" data-drawer-close aria-label="بستن">${B.icon("x")}</button></div>
      ${drawerLinks.map((l) => `<a href="${l[0]}">${B.icon(l[1])} ${l[2]}</a>`).join("")}<h5>حساب من</h5>
      <a href="/account.html">${B.icon("user")} پیشخوان مشتری</a><a href="/track.html">${B.icon("truck")} پیگیری سفارش</a><a href="/wishlist.html">${B.icon("heart")} علاقه‌مندی‌ها</a><a href="/compare.html">${B.icon("compare")} مقایسه کتاب‌ها</a>
      <h5>راهنما</h5><a href="/page.html?p=about">${B.icon("info")} درباره ما</a><a href="/page.html?p=contact">${B.icon("phone")} تماس با ما</a><a href="/page.html?p=faq">${B.icon("headset")} سؤالات متداول</a></aside>`;
    const bn = [["/", "home", "خانه", "home"], ["/categories.html", "grid", "دسته‌ها", "categories"], ["/news.html", "megaphone", "اعلانات", "news"], ["/cart.html", "cart", "سبد", "cart"], ["/account.html", "user", "حساب", "account"]];
    const bottom = `<nav class="bottom-nav" aria-label="ناوبری موبایل">${bn.map((l) => `<a href="${l[0]}" class="${pg === l[3] ? "active" : ""}">${B.icon(l[1])}${l[2]}${l[3] === "cart" ? '<span class="badge-dot" data-badge="cart"></span>' : ""}</a>`).join("")}</nav>`;
    const soc = [["instagram", s.instagram, "instagram"], ["send", s.telegram, "telegram"], ["phone", s.whatsapp, "whatsapp"]].filter((x) => x[1]).map((x) => `<a href="${B.esc(x[1])}" target="_blank" rel="noopener" aria-label="${x[2]}">${B.icon(x[0])}</a>`).join("");
    const ftr = `<footer class="footer"><div class="container"><div class="footer-grid">
      <div><a class="logo" href="/"><span class="logo-mark">${B.icon("book")}</span><span>BOOKOR<b>A</b></span></a><p style="max-width:340px;font-size:14px">${B.esc(s.tagline)}. ${B.esc(s.address || "")}</p><div class="socials">${soc}</div><div class="trust"><span>${B.icon("shield")} پرداخت امن</span><span>${B.icon("truck")} ارسال به سراسر ایران</span></div></div>
      <div><h4>فروشگاه</h4><ul><li><a href="/shop.html">همه کتاب‌ها</a></li><li><a href="/shop.html?list=new">تازه‌ها</a></li><li><a href="/shop.html?list=best">پرفروش‌ها</a></li><li><a href="/shop.html?list=offers">تخفیف‌ها</a></li><li><a href="/collections.html">مجموعه‌ها</a></li></ul></div>
      <div><h4>راهنمای مشتری</h4><ul><li><a href="/track.html">پیگیری سفارش</a></li><li><a href="/page.html?p=faq">سؤالات متداول</a></li><li><a href="/page.html?p=shipping">ارسال و بازگشت</a></li><li><a href="/page.html?p=privacy">حریم خصوصی</a></li><li><a href="/page.html?p=terms">قوانین و مقررات</a></li></ul></div>
      <div><h4>بوکورا</h4><ul><li><a href="/page.html?p=about">درباره ما</a></li><li><a href="/page.html?p=contact">تماس با ما</a></li><li><a href="/news.html">اعلانات و مجله</a></li>${s.phone ? `<li class="ltr">${B.fa(s.phone)}</li>` : ""}${s.email ? `<li>${B.esc(s.email)}</li>` : ""}</ul></div>
      </div><div class="footer-bot"><span>© ${B.fa(new Date().getFullYear())} ${B.esc(s.siteName)} — همه حقوق محفوظ است.</span><span>${B.esc(s.workHours || "")}</span></div></div></footer>`;
    B.$("#site-header").innerHTML = hdr + drawer; B.$("#site-footer").innerHTML = ftr + bottom;
    B.refreshBadges();
    const hd = B.$("#header"); const onS = () => hd.classList.toggle("scrolled", scrollY > 8); onS(); addEventListener("scroll", onS, { passive: true });
    // search wiring
    const q = B.$("#q"), form = B.$(".search-box");
    q.addEventListener("focus", () => renderSuggest(q.value));
    q.addEventListener("input", B.debounce(() => renderSuggest(q.value), 90));
    q.addEventListener("keydown", (e) => {
      const items = B.$$("#suggest .sg-item"); if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sgIdx = (sgIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((i, k) => i.classList.toggle("on", k === sgIdx)); }
      if (e.key === "Enter" && sgIdx >= 0) { e.preventDefault(); items[sgIdx].click(); }
    });
    form.addEventListener("submit", () => { if (q.value.trim()) B.history.push(q.value.trim()); });
    d.addEventListener("click", (e) => { if (!e.target.closest("#searchWrap")) closeSuggest(); });
    const pre = B.qs().get("q"); if (pre && pg === "shop") q.value = pre;
  };
  B.reveal = () => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08 });
    B.$$(".reveal:not(.in)").forEach((e) => io.observe(e));
  };

  /* ---------- Global click delegation ---------- */
  d.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act],[data-car],[data-drawer],[data-drawer-close],[data-close],[data-search-toggle],[data-clear-hist]"); if (!t) return;
    if (t.dataset.act === "add") { e.preventDefault(); B.cart.add(t.dataset.id, +t.dataset.qty || 1); }
    else if (t.dataset.act === "wish") { e.preventDefault(); const on = B.wish.toggle(t.dataset.id); B.toast(on ? "به علاقه‌مندی‌ها اضافه شد" : "از علاقه‌مندی‌ها حذف شد", on ? "ok" : ""); d.dispatchEvent(new CustomEvent("wish:change")); }
    else if (t.dataset.act === "cmp") { e.preventDefault(); if (B.cmp.has(t.dataset.id)) { B.cmp.toggle(t.dataset.id); B.toast("از مقایسه حذف شد"); } else if (B.cmp.all().length >= 4) B.toast("حداکثر ۴ کتاب را می‌توانید مقایسه کنید", "err"); else { B.cmp.toggle(t.dataset.id); B.toast("به مقایسه اضافه شد", "ok"); } }
    else if (t.dataset.act === "qv") { e.preventDefault(); B.quickView(t.dataset.id); }
    else if (t.dataset.car) { const c = t.closest(".car-wrap").querySelector(".car"); c.scrollBy({ left: -(+t.dataset.car) * c.clientWidth * 0.85, behavior: "smooth" }); }
    else if (t.hasAttribute("data-drawer")) { B.$(".drawer").classList.add("open"); B.$(".drawer-bg").classList.add("open"); }
    else if (t.hasAttribute("data-drawer-close")) closeDrawer();
    else if (t.hasAttribute("data-close")) B.closeModal();
    else if (t.hasAttribute("data-search-toggle")) { B.$("#searchWrap").classList.toggle("open"); B.$("#q").focus(); }
    else if (t.hasAttribute("data-clear-hist")) { B.history.clear(); renderSuggest(""); }
  });

  /* ---------- Newsletter ---------- */
  B.newsletterHTML = () => `<section class="container section"><div class="newsletter reveal"><div style="position:relative"><h2>از تازه‌های کتاب و اعلانات جا نمانید</h2><p>ایمیل خود را ثبت کنید تا کتاب‌های جدید، تخفیف‌ها و اطلاعیه‌های مهم را برایتان بفرستیم.</p></div><form class="nl-form" id="nlForm"><input type="email" required placeholder="ایمیل شما" aria-label="ایمیل" dir="ltr" style="text-align:right"><button class="btn btn-primary" type="submit">عضویت</button></form></div></section>`;
  d.addEventListener("submit", async (e) => {
    if (e.target.id !== "nlForm") return; e.preventDefault();
    const inp = e.target.querySelector("input"); const r = await B.api("/api/newsletter.php", { email: inp.value });
    if (r.ok) { B.toast("عضویت شما ثبت شد. سپاسگزاریم!", "ok"); inp.value = ""; } else B.toast(r.error || "خطا در ثبت", "err");
  });

  /* ---------- Boot ---------- */
  B.boot = async (render) => {
    try {
      await B.load(); B.layout();
      await render(B.$("#app"));
      B.refreshBadges(); B.reveal();
    } catch (err) {
      console.error(err);
      const app = B.$("#app"); if (app) app.innerHTML = `<div class="container section"><div class="empty">${B.icon("info")}<h3>خطا در بارگذاری اطلاعات فروشگاه</h3><p>لطفاً صفحه را دوباره بارگذاری کنید.</p><button class="btn btn-primary" onclick="location.reload()">تلاش مجدد</button></div></div>`;
    }
  };
  addEventListener("storage", () => B.data && B.refreshBadges());
  addEventListener("pageshow", (e) => { if (e.persisted && B.data) B.refreshBadges(); });
})();
