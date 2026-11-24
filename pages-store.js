/* BOOKORA — storefront pages: home, shop, book, categories, authors, publishers, collections */
(function () {
  "use strict";
  const B = window.B; B.pages = B.pages || {};
  const S = () => B.data;
  B.ANN_CATS = ["اطلاعیه مهم", "کتاب جدید", "تخفیف و پروموشن", "رویداد ادبی", "نمایشگاه کتاب", "اطلاعیه ارسال", "به‌روزرسانی فروشگاه", "کمپین فصلی"];
  B.EDIT_CATS = ["مصاحبه با نویسنده", "توصیه مطالعه", "اخبار نشر"];
  const sold = (p) => p.sold || 0;
  const pop = (p) => sold(p) * 3 + (p.popularity || 0);
  const newest = (a) => [...a].sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
  const grid = (list) => `<div class="grid">${list.map(B.card).join("")}</div>`;
  const row = (list) => B.carousel(list.map(B.card).join(""));
  B.artCard = (a) => `<a class="art" href="${B.url.article(a)}"><div class="art-cover">${a.cover ? `<img src="${B.esc(a.cover)}" alt="${B.esc(a.title)}" loading="lazy">` : B.icon("news")}</div><div class="art-body"><div><span class="tag-pill ${B.ANN_CATS.includes(a.category) ? "hot" : ""}">${B.esc(a.category || "مقاله")}</span></div><h3>${B.esc(a.title)}</h3><p>${B.esc(a.excerpt || "")}</p><div class="art-meta"><span>${B.date(a.date)}</span><span>${B.esc(a.author || "")}</span></div></div></a>`;
  const sectionEmpty = () => `<div class="container section"><div class="empty">${B.icon("book")}<h3>هنوز کتابی ثبت نشده است</h3><p>از پنل مدیریت (/admin) اولین کتاب‌های فروشگاه را اضافه کنید.</p></div></div>`;
  const productsOf = (key, id) => S().products.filter((p) => p[key] === id);

  /* ===================== HOME ===================== */
  B.pages.home = async (app) => {
    const s = S().settings, P = S().products;
    B.seo({ title: null, desc: s.tagline, canonical: "/", jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: s.siteName, url: B.abs("/"), potentialAction: { "@type": "SearchAction", target: B.abs("/shop.html?q={q}"), "query-input": "required name=q" } }, { "@context": "https://schema.org", "@type": "Organization", name: s.siteName, url: B.abs("/") }] });
    const heroBooks = (P.filter((p) => p.featured).length >= 3 ? P.filter((p) => p.featured) : newest(P)).slice(0, 3);
    const hb = heroBooks.map((p, i) => `<a class="hero-book b${i + 1}" href="${B.url.book(p)}" data-depth="${(i + 1) * 12}">${B.cover(p, { eager: true })}</a>`).join("");
    const first = heroBooks[0];
    let h = `<section class="hero"><div class="container hero-in"><div class="reveal in">
      <span class="hero-tag"><i></i> ${B.esc(s.tagline)}</span>
      <h1>${s.heroTitle || "دنیای کتاب"}</h1><p class="lead">${B.esc(s.heroText || "")}</p>
      <div class="hero-cta"><a class="btn btn-white btn-lg" href="/shop.html">${B.icon("book")} ورود به فروشگاه</a><a class="btn btn-ghost btn-lg" href="/shop.html?list=new">${B.icon("star")} کشف تازه‌ها</a></div>
      <div class="hero-feats"><div>${B.icon("truck")}ارسال به سراسر ایران</div><div>${B.icon("shield")}پرداخت امن بانکی</div><div>${B.icon("headset")}پشتیبانی کاربران</div></div></div>
      <div class="hero-stage" id="stage"><span class="hero-orb o1"></span><span class="hero-orb o2"></span><span class="hero-orb o3"></span>${hb}
      ${first ? `<a class="hero-glass" href="${B.url.book(first)}">${B.cover(first)}<div><small>کتاب ویژه</small><strong>${B.esc(first.title)}</strong><small>${B.moneyText(B.final(first))}</small></div></a>` : ""}</div></div><div class="hero-wave"></div></section>`;
    if (!P.length) { app.innerHTML = h + sectionEmpty() + B.newsletterHTML(); return; }

    // 1 — popular categories
    const cats = S().categories.filter((c) => !c.parent).map((c) => ({ c, n: P.filter((p) => p.category === c.id || (B.category(p.category) || {}).parent === c.id).length }));
    h += `<section class="section container reveal">${B.secHead("دسته‌بندی‌ها", "دسته‌بندی‌های محبوب", "هر موضوعی که دوست دارید، اینجا پیدا می‌شود", "/categories.html")}<div class="cat-grid">${cats.slice(0, 10).map(({ c, n }) => `<a class="cat-tile" href="${B.url.cat(c)}"><i>${c.icon || "📚"}</i><strong>${B.esc(c.name)}</strong><small>${B.fa(n)} کتاب</small></a>`).join("")}</div></section>`;

    // 2 — best sellers
    let best = P.filter((p) => sold(p) > 0).sort((a, b) => sold(b) - sold(a)); if (!best.length) best = P.filter((p) => p.bestseller);
    if (best.length) h += `<section class="section sec-white"><div class="container reveal">${B.secHead("پرفروش‌ها", "پرفروش‌ترین کتاب‌ها", "انتخاب خوانندگان بوکورا", "/shop.html?list=best")}${row(best.slice(0, 12))}</div></section>`;

    // 3 — new arrivals
    h += `<section class="section container reveal">${B.secHead("تازه‌ها", "جدیدترین کتاب‌ها", "تازه‌های رسیده به فروشگاه", "/shop.html?list=new")}${row(newest(P).slice(0, 12))}</section>`;

    // 4 — offers
    const off = P.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
    if (off.length) {
      const end = s.offerEndsAt ? new Date(s.offerEndsAt).getTime() : 0;
      h += `<section class="section sec-dark"><div class="container reveal">${B.secHead("پیشنهاد ویژه", "تخفیف‌های شگفت‌انگیز", "فرصت‌های محدود برای خرید کتاب با قیمت کمتر", "/shop.html?list=offers")}
      ${end > Date.now() ? `<div class="offer-banner"><div><strong style="font-size:18px">پایان طرح تخفیف</strong><div style="color:#bcd3ff;font-size:13px">قبل از تمام شدن زمان سفارش دهید</div></div><div class="countdown" id="cd"></div></div>` : ""}
      ${row(off.slice(0, 12))}</div></section>`;
    }

    // 5 — editor picks
    const ed = P.filter((p) => p.editorPick);
    if (ed.length) {
      const f = ed[0], fa = B.author(f.author);
      h += `<section class="section sec-light"><div class="container reveal">${B.secHead("انتخاب سردبیر", "پیشنهاد سردبیر", "کتاب‌هایی که تیم بوکورا برایتان برگزیده است")}<div class="editor"><div class="editor-feat"><a href="${B.url.book(f)}">${B.cover(f)}</a><div><span class="tag-pill">برگزیده</span><h3 style="margin-top:8px">${B.esc(f.title)}</h3><p>${B.esc(fa ? fa.name : "")}<br>${B.esc((f.description || "").slice(0, 90))}…</p><a class="btn btn-primary btn-sm" href="${B.url.book(f)}">مشاهده کتاب</a></div></div><div>${row(ed.slice(1).length ? ed.slice(1) : ed)}</div></div></div></section>`;
    }

    // 6 — authors
    const au = S().authors.map((a) => ({ a, n: productsOf("author", a.id).length })).filter((x) => x.n).sort((x, y) => y.n - x.n).slice(0, 12);
    if (au.length) h += `<section class="section container reveal">${B.secHead("نویسندگان", "نویسندگان منتخب", "با صاحبان قلم آشنا شوید", "/authors.html")}${B.carousel(au.map(({ a, n }) => `<a class="person" href="${B.url.author(a)}"><div class="avatar">${a.image ? `<img src="${B.esc(a.image)}" alt="${B.esc(a.name)}" loading="lazy">` : B.esc(a.name[0])}</div><strong>${B.esc(a.name)}</strong><small>${B.fa(n)} کتاب</small></a>`).join(""))}</section>`;

    // 7 — publishers
    const pb = S().publishers.map((a) => ({ a, n: productsOf("publisher", a.id).length })).filter((x) => x.n).sort((x, y) => y.n - x.n).slice(0, 12);
    if (pb.length) h += `<section class="section sec-white"><div class="container reveal">${B.secHead("ناشران", "ناشران برگزیده", "همکاری با ناشران معتبر", "/publishers.html")}${B.carousel(pb.map(({ a, n }) => `<a class="person" href="${B.url.publisher(a)}"><div class="avatar sq">${a.logo ? `<img src="${B.esc(a.logo)}" alt="${B.esc(a.name)}" loading="lazy">` : B.esc(a.name[0])}</div><strong>${B.esc(a.name)}</strong><small>${B.fa(n)} کتاب</small></a>`).join(""))}</div></section>`;

    // 8 — educational collections
    const ks = S().collections.filter((k) => k.productIds && k.productIds.some((id) => B.product(id)));
    if (ks.length) h += `<section class="section container reveal">${B.secHead("مجموعه‌ها", "مجموعه‌های آموزشی و موضوعی", "بسته‌های منتخب برای مسیر یادگیری شما", "/collections.html")}${B.carousel(ks.map((k, i) => `<a class="coll-card ${k.color || "c" + ((i % 4) + 1)}" href="${B.url.coll(k)}"><span class="tag">${k.type === "educational" ? "آموزشی" : k.type === "discount" ? "تخفیفی" : "مجموعه"}</span><h3>${B.esc(k.title)}</h3><p>${B.esc(k.desc || "")}</p><span class="btn btn-white btn-sm" style="align-self:flex-start">${B.fa(k.productIds.filter((id) => B.product(id)).length)} کتاب ${B.icon("left")}</span></a>`).join(""))}</section>`;

    // 9 — trending
    const tr = P.filter((p) => p.trending || p.popularity > 0 || sold(p) > 0).sort((a, b) => pop(b) - pop(a)).slice(0, 6);
    if (tr.length) h += `<section class="section sec-white"><div class="container reveal">${B.secHead("ترند", "کتاب‌های داغ این روزها", "آنچه این روزها بیشتر دیده می‌شود")}<div class="rank-list">${tr.map((p, i) => `<a class="rank" href="${B.url.book(p)}"><span class="n">${B.fa(i + 1)}</span>${B.cover(p)}<div><strong>${B.esc(p.title)}</strong><small>${B.esc((B.author(p.author) || {}).name || "")}</small><div class="price"><b style="font-size:14px">${B.money(B.final(p))}</b></div></div></a>`).join("")}</div></div></section>`;

    // 10 — recently added
    h += `<section class="section container reveal">${B.secHead("تازه اضافه‌شده‌ها", "به‌تازگی اضافه شد", "", "/shop.html?sort=newest")}${grid(newest(P).slice(0, 8))}</section>`;

    // 11 — personalized
    const seen = [...B.recent.all(), ...B.wish.all()]; const seenCats = new Set(seen.map((id) => (B.product(id) || {}).category).filter(Boolean));
    let rec = P.filter((p) => seenCats.has(p.category) && !seen.includes(p.id)); const personal = rec.length > 0;
    if (!rec.length) rec = [...P].sort((a, b) => pop(b) - pop(a));
    h += `<section class="section sec-light"><div class="container reveal">${B.secHead("برای شما", personal ? "پیشنهاد شخصی برای شما" : "پیشنهادهای بوکورا", personal ? "بر اساس کتاب‌هایی که دیده‌اید یا پسندیده‌اید" : "با گشتن در فروشگاه، پیشنهادها شخصی‌تر می‌شوند")}${row(rec.slice(0, 12))}</div></section>`;

    // 12 — announcements
    const arts = B.liveArticles();
    const ann = arts.filter((a) => a.featured || B.ANN_CATS.includes(a.category));
    if (ann.length) {
      const [f, ...rest] = ann;
      h += `<section class="section container reveal">${B.secHead("اعلانات", "آخرین اعلانات", "اطلاعیه‌ها، رویدادها و خبرهای فروشگاه", "/news.html")}<div class="news-hero"><a class="news-feat" href="${B.url.article(f)}">${f.cover ? `<img src="${B.esc(f.cover)}" alt="" loading="lazy">` : ""}<div><span class="tag-pill hot">${B.esc(f.category)}</span><h2>${B.esc(f.title)}</h2><p>${B.esc(f.excerpt || "")}</p></div></a><div class="news-side">${rest.slice(0, 3).map((a) => `<a class="news-mini" href="${B.url.article(a)}"><div class="th">${a.cover ? `<img src="${B.esc(a.cover)}" alt="" loading="lazy">` : ""}</div><div><span class="tag-pill">${B.esc(a.category)}</span><strong>${B.esc(a.title)}</strong><small class="text-muted">${B.date(a.date)}</small></div></a>`).join("") || `<div class="info-card">${B.icon("megaphone")}<p class="text-muted">اعلان دیگری منتشر نشده است.</p></div>`}</div></div></section>`;
    }
    // 13 — editorial articles
    const ed2 = arts.filter((a) => !ann.includes(a)); const edl = (ed2.length ? ed2 : arts).slice(0, 3);
    if (edl.length) h += `<section class="section sec-white"><div class="container reveal">${B.secHead("مجله", "مقالات و یادداشت‌ها", "از دنیای کتاب و نشر", "/news.html")}<div class="art-grid">${edl.map(B.artCard).join("")}</div></div></section>`;

    h += B.newsletterHTML();
    app.innerHTML = h;

    // countdown
    const cd = B.$("#cd"); const end = s.offerEndsAt ? new Date(s.offerEndsAt).getTime() : 0;
    if (cd && end) { const tick = () => { let t = Math.max(0, end - Date.now()); const dd = Math.floor(t / 864e5), hh = Math.floor(t / 36e5) % 24, mm = Math.floor(t / 6e4) % 60, ss = Math.floor(t / 1e3) % 60; cd.innerHTML = [[ss, "ثانیه"], [mm, "دقیقه"], [hh, "ساعت"], [dd, "روز"]].map(([v, l]) => `<span>${B.fa(String(v).padStart(2, "0"))}<small>${l}</small></span>`).join(""); if (t <= 0) clearInterval(iv); }; tick(); var iv = setInterval(tick, 1000); }
    // hero parallax
    const stage = B.$("#stage"); if (stage && matchMedia("(pointer:fine)").matches) {
      stage.addEventListener("mousemove", (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; B.$$(".hero-book", stage).forEach((b) => { const k = +b.dataset.depth; b.style.translate = `${x * -k * 2}px ${y * -k * 2}px`; }); });
      stage.addEventListener("mouseleave", () => B.$$(".hero-book", stage).forEach((b) => (b.style.translate = "0 0")));
    }
  };

  /* ===================== SHOP ===================== */
  const LISTS = { new: ["تازه‌ها", "جدیدترین کتاب‌های فروشگاه", "newest"], best: ["پرفروش‌ها", "پرفروش‌ترین کتاب‌های بوکورا", "best"], popular: ["محبوب‌ترین‌ها", "کتاب‌هایی که بیشترین توجه را داشته‌اند", "popular"], recommended: ["پیشنهاد سردبیر", "کتاب‌های برگزیده تیم بوکورا", "newest"], offers: ["پیشنهادهای ویژه", "کتاب‌های تخفیف‌دار", "discount"] };
  const SORTS = [["newest", "جدیدترین"], ["best", "پرفروش‌ترین"], ["popular", "محبوب‌ترین"], ["price-asc", "ارزان‌ترین"], ["price-desc", "گران‌ترین"], ["rating", "بالاترین امتیاز"], ["discount", "بیشترین تخفیف"]];
  B.pages.shop = async (app) => {
    const P = S().products; const per = 12;
    const st = Object.fromEntries(B.qs().entries()); st.page = +st.page || 1;
    const list = st.list && LISTS[st.list]; if (list && !st.sort) st.sort = list[2]; st.sort = st.sort || "newest";
    const cat = st.cat ? S().categories.find((c) => c.slug === st.cat) : null;
    const hasRatings = P.some((p) => p.ratingCount > 0);
    const years = [...new Set(P.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);
    const langs = [...new Set(P.map((p) => p.language).filter(Boolean))];
    const used = (key) => new Set(P.map((p) => p[key]));
    const catIds = (c) => [c.id, ...S().categories.filter((x) => x.parent === c.id).map((x) => x.id)];

    const title = cat ? cat.name : st.q ? `نتایج جستجوی «${st.q}»` : list ? list[0] : "فروشگاه کتاب";
    const sub = cat ? (cat.seoDesc || `کتاب‌های دسته ${cat.name}`) : st.q ? "" : list ? list[1] : "همه کتاب‌های بوکورا با فیلترهای پیشرفته";
    const crumbArr = cat ? [["/shop.html", "فروشگاه"], [location.pathname + location.search, cat.name]] : [[location.pathname + location.search, title]];
    B.seo({ title: cat ? cat.seoTitle || cat.name : title, desc: sub, jsonld: [B.crumbsLd(crumbArr)] });
    if (st.q) { /* noindex for search pages */ const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex,follow"; document.head.appendChild(m); }

    const filtersHtml = () => `<aside class="filters" id="filters"><div class="flex between items-c"><h3 style="font-size:17px">فیلترها</h3><button class="icon-btn filter-toggle" data-fclose aria-label="بستن">${B.icon("x")}</button></div>
      <div class="f-group"><h5>محدوده قیمت (تومان)</h5><div class="f-row"><input class="input sm" id="fmin" inputmode="numeric" placeholder="از" value="${B.esc(st.min || "")}"><input class="input sm" id="fmax" inputmode="numeric" placeholder="تا" value="${B.esc(st.max || "")}"></div></div>
      <div class="f-group"><h5>دسته‌بندی</h5><select class="select sm" id="fcat"><option value="">همه دسته‌ها</option>${S().categories.map((c) => `<option value="${c.slug}" ${st.cat === c.slug ? "selected" : ""}>${c.parent ? "— " : ""}${B.esc(c.name)}</option>`).join("")}</select></div>
      <div class="f-group"><h5>نویسنده</h5><select class="select sm" id="fauthor"><option value="">همه</option>${S().authors.filter((a) => used("author").has(a.id)).map((a) => `<option value="${a.slug}" ${st.author === a.slug ? "selected" : ""}>${B.esc(a.name)}</option>`).join("")}</select></div>
      <div class="f-group"><h5>ناشر</h5><select class="select sm" id="fpub"><option value="">همه</option>${S().publishers.filter((a) => used("publisher").has(a.id)).map((a) => `<option value="${a.slug}" ${st.pub === a.slug ? "selected" : ""}>${B.esc(a.name)}</option>`).join("")}</select></div>
      <div class="f-group"><h5>سال انتشار</h5><select class="select sm" id="fyear"><option value="">همه</option>${years.map((y) => `<option ${+st.year === y ? "selected" : ""} value="${y}">${B.fa(y)}</option>`).join("")}</select></div>
      <div class="f-group"><h5>زبان</h5><select class="select sm" id="flang"><option value="">همه</option>${langs.map((l) => `<option ${st.lang === l ? "selected" : ""}>${B.esc(l)}</option>`).join("")}</select></div>
      <div class="f-group"><h5>شابک (ISBN)</h5><input class="input sm" id="fisbn" dir="ltr" placeholder="978…" value="${B.esc(st.isbn || "")}"></div>
      <div class="f-group"><h5>حداقل تخفیف</h5><select class="select sm" id="fdisc"><option value="">بدون محدودیت</option>${[10, 20, 30, 50].map((v) => `<option value="${v}" ${+st.disc === v ? "selected" : ""}>${B.fa(v)}٪ به بالا</option>`).join("")}</select></div>
      ${hasRatings ? `<div class="f-group"><h5>حداقل امتیاز</h5><select class="select sm" id="frating"><option value="">همه</option>${[3, 4, 4.5].map((v) => `<option value="${v}" ${+st.rating === v ? "selected" : ""}>${B.fa(v)} به بالا</option>`).join("")}</select></div>` : ""}
      <div class="f-group"><label class="check"><input type="checkbox" id="favail" ${st.avail ? "checked" : ""}> فقط کالاهای موجود</label></div>
      <div class="flex gap"><button class="btn btn-primary btn-sm btn-block" id="fapply">اعمال فیلتر</button><a class="btn btn-light btn-sm" href="/shop.html">پاک‌سازی</a></div></aside>`;

    function apply() {
      let r = st.q ? B.search(st.q) : [...P];
      if (cat) { const ids = catIds(cat); r = r.filter((p) => ids.includes(p.category)); }
      if (st.author) { const a = S().authors.find((x) => x.slug === st.author); r = r.filter((p) => a && p.author === a.id); }
      if (st.pub) { const a = S().publishers.find((x) => x.slug === st.pub); r = r.filter((p) => a && p.publisher === a.id); }
      if (st.min) r = r.filter((p) => B.final(p) >= +B.norm(st.min)); if (st.max) r = r.filter((p) => B.final(p) <= +B.norm(st.max));
      if (st.year) r = r.filter((p) => p.year === +st.year); if (st.lang) r = r.filter((p) => p.language === st.lang);
      if (st.isbn) { const d = B.norm(st.isbn).replace(/[^0-9x]/g, ""); r = r.filter((p) => p._isbn.includes(d)); }
      if (st.avail) r = r.filter(B.inStock); if (st.disc) r = r.filter((p) => p.discount >= +st.disc); if (st.rating) r = r.filter((p) => p.ratingCount > 0 && p.rating >= +st.rating);
      if (st.list === "offers") r = r.filter((p) => p.discount > 0); if (st.list === "recommended") r = r.filter((p) => p.editorPick);
      if (st.list === "best") { const hasSold = P.some((p) => sold(p) > 0); if (!hasSold) r = r.filter((p) => p.bestseller); }
      const sorters = { newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt), best: (a, b) => sold(b) - sold(a), popular: (a, b) => pop(b) - pop(a), "price-asc": (a, b) => B.final(a) - B.final(b), "price-desc": (a, b) => B.final(b) - B.final(a), rating: (a, b) => b.rating - a.rating, discount: (a, b) => b.discount - a.discount };
      if (!(st.q && !B.qs().get("sort"))) r.sort(sorters[st.sort] || sorters.newest);
      return r;
    }
    function go(patch) { Object.assign(st, patch); Object.keys(st).forEach((k) => (st[k] === "" || st[k] == null || st[k] === false) && delete st[k]); const u = new URLSearchParams(st); u.delete("page", 1); if (st.page > 1) u.set("page", st.page); history.replaceState(null, "", "/shop.html" + (u.toString() ? "?" + u : "")); st.page = +st.page || 1; draw(); }
    function draw() {
      const r = apply(); const pages = Math.max(1, Math.ceil(r.length / per)); st.page = Math.min(st.page, pages); const slice = r.slice((st.page - 1) * per, st.page * per);
      B.$("#result").innerHTML = `<div class="shop-top"><div class="count">${B.fa(r.length)} کتاب پیدا شد</div><div class="sort-chips"><button class="btn btn-outline btn-sm filter-toggle" data-fopen>${B.icon("filter")} فیلترها</button>${SORTS.map(([k, l]) => `<button class="chip ${st.sort === k ? "on" : ""}" data-sort="${k}">${l}</button>`).join("")}</div></div>
      ${slice.length ? grid(slice) : `<div class="empty">${B.icon("search")}<h3>کتابی با این مشخصات پیدا نشد</h3><p>فیلترها را تغییر دهید یا عبارت دیگری را جستجو کنید.</p><a class="btn btn-primary" href="/shop.html">نمایش همه کتاب‌ها</a></div>`}
      ${pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === st.page ? "on" : ""}" data-pg="${i + 1}">${B.fa(i + 1)}</button>`).join("")}</div>` : ""}`;
      B.refreshBadges();
    }
    app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs(crumbArr.map((c, i) => (i === crumbArr.length - 1 ? ["", c[1]] : c)))}<h1>${cat ? `<span>${cat.icon || ""}</span> ` : ""}${B.esc(title)}</h1>${sub ? `<p>${B.esc(sub)}</p>` : ""}</div></div>
      <div class="container shop">${filtersHtml()}<div id="result"></div></div>`;
    draw();
    app.addEventListener("click", (e) => {
      const t = e.target; const c = t.closest("[data-sort],[data-pg],[data-fopen],[data-fclose],#fapply"); if (!c) return;
      if (c.dataset.sort) go({ sort: c.dataset.sort, page: 1 });
      else if (c.dataset.pg) { go({ page: +c.dataset.pg }); scrollTo({ top: 0, behavior: "smooth" }); }
      else if (c.hasAttribute("data-fopen")) B.$("#filters").classList.add("open");
      else if (c.hasAttribute("data-fclose")) B.$("#filters").classList.remove("open");
      else if (c.id === "fapply") { const v = (id) => B.$("#" + id) ? B.$("#" + id).value : ""; go({ min: v("fmin"), max: v("fmax"), cat: v("fcat"), author: v("fauthor"), pub: v("fpub"), year: v("fyear"), lang: v("flang"), isbn: v("fisbn"), disc: v("fdisc"), rating: v("frating"), avail: B.$("#favail").checked ? "1" : "", page: 1 }); B.$("#filters").classList.remove("open"); if ((st.cat || "") !== (cat ? cat.slug : "")) location.href = "/shop.html?" + new URLSearchParams(st); }
    });
  };

  /* ===================== BOOK ===================== */
  B.pages.book = async (app) => {
    const slug = B.qs().get("slug") || decodeURIComponent((location.pathname.match(/\/book\/([^/?]+)/) || [])[1] || "");
    const p = S().products.find((x) => x.slug === slug);
    if (!p) { B.seo({ title: "کتاب پیدا نشد" }); app.innerHTML = `<div class="container section"><div class="empty">${B.icon("search")}<h3>این کتاب پیدا نشد</h3><p>ممکن است حذف یا ناموجود شده باشد.</p><a class="btn btn-primary" href="/shop.html">بازگشت به فروشگاه</a></div></div>`; return; }
    const a = B.author(p.author), pu = B.publisher(p.publisher), c = B.category(p.category), fin = B.final(p);
    const crumbArr = [["/shop.html", "فروشگاه"], ...(c ? [[B.url.cat(c), c.name]] : []), [B.url.book(p), p.title]];
    const url = B.url.book(p);
    const imgs = p.images && p.images.length ? p.images : [];
    const ld = [B.crumbsLd(crumbArr), { "@context": "https://schema.org", "@type": ["Product", "Book"], name: p.title, description: (p.description || "").slice(0, 300), sku: p.sku || p.id, isbn: p.isbn || undefined, image: imgs.map((i) => B.abs(i)), inLanguage: "fa", numberOfPages: p.pages || undefined, bookEdition: p.edition || undefined, bookFormat: p.binding || undefined, datePublished: p.year ? String(p.year) : undefined, author: a ? { "@type": "Person", name: a.name } : undefined, publisher: pu ? { "@type": "Organization", name: pu.name } : undefined, brand: pu ? { "@type": "Brand", name: pu.name } : undefined, offers: { "@type": "Offer", url: B.abs(url), priceCurrency: "IRR", price: String(fin * 10), availability: B.inStock(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" }, ...(p.ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.ratingCount } } : {}) }];
    B.seo({ title: p.seoTitle || `${p.title}${a ? " — " + a.name : ""}`, desc: p.seoDesc || p.description, image: imgs[0], type: "book", canonical: url, jsonld: ld });
    B.recent.push(p.id);

    const specs = [["نویسنده", a && `<a href="${B.url.author(a)}">${B.esc(a.name)}</a>`], ["ناشر", pu && `<a href="${B.url.publisher(pu)}">${B.esc(pu.name)}</a>`], ["دسته‌بندی", c && `<a href="${B.url.cat(c)}">${B.esc(c.name)}</a>`], ["شابک (ISBN)", p.isbn && `<span class="ltr">${B.esc(p.isbn)}</span>`], ["کد کالا (SKU)", p.sku && `<span class="ltr">${B.esc(p.sku)}</span>`], ["سال انتشار", p.year && B.fa(p.year)], ["تعداد صفحات", p.pages && B.fa(p.pages)], ["زبان", p.language], ["نوبت چاپ", p.edition], ["نوع جلد", p.binding], ["ابعاد", p.size], ["وزن", p.weight && `${B.fa(p.weight)} گرم`]].filter((x) => x[1]);
    const sameCat = S().products.filter((x) => x.id !== p.id && x.category === p.category);
    const byAuthor = S().products.filter((x) => x.id !== p.id && x.author === p.author);
    const byPub = S().products.filter((x) => x.id !== p.id && x.publisher === p.publisher);
    const fbt = [p, ...[...byAuthor, ...sameCat].filter((x, i, arr) => arr.indexOf(x) === i && B.inStock(x)).slice(0, 2)];
    const rec = B.recent.all().filter((id) => id !== p.id).map(B.product).filter(Boolean);
    const sec = (t, list) => (list.length ? `<section class="section container reveal" style="padding-top:20px">${B.secHead("", t)}${row(list.slice(0, 12))}</section>` : "");
    const thumbs = imgs.length > 1 ? `<div class="g-thumbs">${imgs.map((im, i) => `<button class="g-thumb ${i === 0 ? "on" : ""}" data-img="${i}" aria-label="تصویر ${B.fa(i + 1)}"><img src="${B.esc(im)}" alt="${B.esc(p.title)} - تصویر ${B.fa(i + 1)}" loading="lazy"></button>`).join("")}</div>` : "";

    app.innerHTML = `<div class="container" style="padding-top:22px">${B.crumbs(crumbArr.map((x, i) => (i === crumbArr.length - 1 ? ["", x[1]] : x)))}</div>
    <div class="container pdp"><div class="gallery"><div class="g-main" id="gmain">${imgs[0] ? `<img class="zoomable" id="gimg" src="${B.esc(imgs[0])}" alt="${B.esc(p.title)}" fetchpriority="high">` : B.cover(p, { eager: true })}<span class="hint">${imgs[0] ? "برای بزرگ‌نمایی کلیک کنید" : "ماوس را حرکت دهید"}</span></div>${thumbs}</div>
      <div class="pdp-info"><span class="tag-pill">${c ? B.esc(c.name) : "کتاب"}</span><h1 style="margin-top:8px">${B.esc(p.title)}</h1>${p.subtitle ? `<div class="sub">${B.esc(p.subtitle)}</div>` : ""}
      <div class="pdp-meta">${a ? `<span>نویسنده: <a href="${B.url.author(a)}">${B.esc(a.name)}</a></span>` : ""}${pu ? `<span>ناشر: <a href="${B.url.publisher(pu)}">${B.esc(pu.name)}</a></span>` : ""}${p.ratingCount > 0 ? `<span class="rating">${B.icon("star")} ${B.fa(p.rating)} (${B.fa(p.ratingCount)} نظر)</span>` : ""}</div>
      <div class="buy-box"><div class="pdp-price"><b>${B.money(fin)}</b>${p.discount > 0 ? `<del>${B.num(p.price)}</del><span class="off">${B.fa(p.discount)}٪ تخفیف</span>` : ""}</div>
        <div style="margin-top:8px">${!B.inStock(p) ? '<span class="stock out">ناموجود</span>' : p.stock <= 3 ? `<span class="stock low">تنها ${B.fa(p.stock)} عدد در انبار</span>` : '<span class="stock ok">موجود در انبار</span>'}</div>
        <div class="buy-row">${B.inStock(p) ? `<div class="qty"><button type="button" id="qm" aria-label="کاهش">−</button><input id="qv" value="1" inputmode="numeric" aria-label="تعداد"><button type="button" id="qp" aria-label="افزایش">+</button></div><button class="btn btn-primary btn-lg" id="addMain">${B.icon("cart")} افزودن به سبد خرید</button>` : `<button class="btn btn-light btn-lg" id="notify">${B.icon("bell")} موجود شد خبرم کن</button>`}
        <button class="icon-btn btn-outline" style="border:1.5px solid var(--line)" data-act="wish" data-id="${p.id}" aria-label="علاقه‌مندی">${B.icon("heart")}</button><button class="icon-btn" style="border:1.5px solid var(--line)" data-act="cmp" data-id="${p.id}" aria-label="مقایسه">${B.icon("compare")}</button></div>
        <div class="ship-info"><div>${B.icon("truck")} ارسال به سراسر ایران</div><div>${B.icon("shield")} پرداخت امن بانکی</div><div>${B.icon("refresh")} امکان مرجوعی ۷ روزه</div><div>${B.icon("package")} بسته‌بندی ایمن</div></div></div></div></div>
    <div class="container section" style="padding-top:10px"><div class="tabs"><button class="tab on" data-tab="desc">معرفی کتاب</button><button class="tab" data-tab="spec">مشخصات</button><button class="tab" data-tab="ship">ارسال و بازگشت</button></div>
      <div id="tab-desc" class="prose">${(p.description || "").split(/\n+/).map((x) => `<p>${B.esc(x)}</p>`).join("") || "<p>توضیحاتی ثبت نشده است.</p>"}</div>
      <div id="tab-spec" class="hide"><table class="specs">${specs.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table></div>
      <div id="tab-ship" class="hide prose"><p>سفارش‌ها پس از پرداخت و تأیید، در مدت ۱ تا ۲ روز کاری پردازش و ارسال می‌شوند. هزینه ارسال در مرحله پرداخت محاسبه می‌شود و برای سفارش‌های بالای ${B.moneyText(S().settings.freeShippingThreshold)} ارسال پست رایگان است.</p><p>در صورت آسیب‌دیدگی یا مغایرت کتاب، تا ۷ روز پس از تحویل می‌توانید درخواست مرجوعی ثبت کنید. <a href="/page.html?p=shipping">جزئیات بیشتر</a></p></div></div>
    ${a ? `<section class="container reveal" style="padding-bottom:20px"><div class="about-box"><div class="avatar">${a.image ? `<img src="${B.esc(a.image)}" alt="${B.esc(a.name)}">` : B.esc(a.name[0])}</div><div><span class="tag-pill">درباره نویسنده</span><h3 style="margin:6px 0">${B.esc(a.name)}</h3><p class="text-muted">${B.esc((a.bio || "").slice(0, 240)) || "اطلاعاتی ثبت نشده است."}</p><a class="sec-link mt" style="margin-top:10px" href="${B.url.author(a)}">همه کتاب‌های نویسنده ${B.icon("left")}</a></div></div></section>` : ""}
    ${fbt.length > 1 ? `<section class="container reveal" style="padding:20px 0"><h2 style="margin-bottom:16px">اغلب با هم خریداری می‌شوند</h2><div class="fbt">${fbt.map((x, i) => `${i ? '<span class="plus">+</span>' : ""}<a href="${B.url.book(x)}" style="width:100px;text-align:center;font-size:12px">${B.cover(x)}<div style="margin-top:6px">${B.esc(x.title)}</div></a>`).join("")}<div style="margin-inline-start:auto"><div class="text-muted">مجموع</div><b style="font-size:22px;color:var(--navy)">${B.moneyText(fbt.reduce((s, x) => s + B.final(x), 0))}</b><br><button class="btn btn-primary btn-sm mt" id="fbtAdd">افزودن همه به سبد</button></div></div></section>` : ""}
    ${sec("کتاب‌های مشابه", sameCat)}${sec(`دیگر کتاب‌های ${a ? a.name : "نویسنده"}`, byAuthor)}${sec(`کتاب‌های بیشتر از ${pu ? pu.name : "ناشر"}`, byPub.filter((x) => !byAuthor.includes(x)))}${sec("اخیراً دیده‌اید", rec)}
    <div class="sticky-buy"><div><b>${B.moneyText(fin)}</b></div>${B.inStock(p) ? `<button class="btn btn-primary" id="addSticky">${B.icon("cart")} افزودن به سبد</button>` : '<span class="stock out">ناموجود</span>'}</div>`;

    const qv = () => Math.max(1, Math.min(p.stock, parseInt(B.norm(B.$("#qv").value)) || 1));
    if (B.$("#qv")) { B.$("#qp").onclick = () => (B.$("#qv").value = B.fa(Math.min(p.stock, qv() + 1))); B.$("#qm").onclick = () => (B.$("#qv").value = B.fa(Math.max(1, qv() - 1))); B.$("#addMain").onclick = () => B.cart.add(p.id, qv()); }
    if (B.$("#addSticky")) B.$("#addSticky").onclick = () => B.cart.add(p.id, 1);
    if (B.$("#fbtAdd")) B.$("#fbtAdd").onclick = () => fbt.forEach((x) => B.cart.add(x.id, 1));
    if (B.$("#notify")) B.$("#notify").onclick = async () => { const em = prompt("ایمیل یا شماره موبایل خود را برای اطلاع‌رسانی وارد کنید:"); if (!em) return; const r = await B.api("/api/notify.php", { productId: p.id, contact: em }); B.toast(r.ok ? "هنگام موجود شدن به شما اطلاع می‌دهیم" : r.error, r.ok ? "ok" : "err"); };
    B.$$(".tab").forEach((t) => (t.onclick = () => { B.$$(".tab").forEach((x) => x.classList.toggle("on", x === t)); ["desc", "spec", "ship"].forEach((k) => B.$("#tab-" + k).classList.toggle("hide", k !== t.dataset.tab)); }));
    // gallery
    const gm = B.$("#gmain"), gi = B.$("#gimg");
    if (gi) {
      B.$$(".g-thumb").forEach((t) => (t.onclick = () => { gi.src = imgs[+t.dataset.img]; B.$$(".g-thumb").forEach((x) => x.classList.toggle("on", x === t)); }));
      gm.onclick = () => gm.classList.toggle("zoom");
      gm.onmousemove = (e) => { if (!gm.classList.contains("zoom")) return; const r = gm.getBoundingClientRect(); gi.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; };
      gm.onmouseleave = () => gm.classList.remove("zoom");
    } else {
      const cv = B.$(".cover", gm); gm.onmousemove = (e) => { const r = gm.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; cv.style.transform = `rotateY(${x * -28}deg) rotateX(${y * 20}deg)`; }; gm.onmouseleave = () => (cv.style.transform = "");
    }
  };

  /* ===================== CATEGORIES ===================== */
  B.pages.categories = async (app) => {
    B.seo({ title: "دسته‌بندی کتاب‌ها", desc: "همه دسته‌بندی‌های کتاب در بوکورا", jsonld: [B.crumbsLd([["/categories.html", "دسته‌بندی‌ها"]])] });
    const cnt = (c) => S().products.filter((p) => p.category === c.id || (B.category(p.category) || {}).parent === c.id).length;
    const top = S().categories.filter((c) => !c.parent);
    app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs([["", "دسته‌بندی‌ها"]])}<h1>دسته‌بندی کتاب‌ها</h1><p>موضوع مورد علاقه‌تان را انتخاب کنید.</p></div></div><div class="container section"><div class="cat-grid">${top.map((c) => `<a class="cat-tile" href="${B.url.cat(c)}"><i>${c.icon || "📚"}</i><strong>${B.esc(c.name)}</strong><small>${B.fa(cnt(c))} کتاب</small></a>`).join("")}</div>
    ${top.filter((c) => S().categories.some((x) => x.parent === c.id)).map((c) => `<h3 style="margin:34px 0 12px">${B.esc(c.name)}</h3><div class="filters-bar">${S().categories.filter((x) => x.parent === c.id).map((x) => `<a class="chip" href="${B.url.cat(x)}">${B.esc(x.name)}</a>`).join("")}</div>`).join("")}</div>`;
  };

  /* ===================== AUTHORS & PUBLISHERS ===================== */
  function people(kind) {
    const isA = kind === "author"; const label = isA ? "نویسنده" : "ناشر"; const page = isA ? "/authors.html" : "/publishers.html"; const urlf = (i) => (isA ? B.url.author(i) : B.url.publisher(i));
    return async (app) => {
      const list = isA ? S().authors : S().publishers;
      const slug = B.qs().get("slug");
      if (slug) {
        const x = list.find((i) => i.slug === slug);
        if (!x) { app.innerHTML = `<div class="container section"><div class="empty">${B.icon("search")}<h3>${label} پیدا نشد</h3><a class="btn btn-primary" href="${page}">بازگشت</a></div></div>`; return; }
        const books = productsOf(kind, x.id);
        B.seo({ title: x.seoTitle || x.name, desc: x.seoDesc || x.bio || x.about || `کتاب‌های ${x.name} در بوکورا`, image: x.image || x.logo, jsonld: [B.crumbsLd([[page, isA ? "نویسندگان" : "ناشران"], [urlf(x), x.name]]), { "@context": "https://schema.org", "@type": isA ? "Person" : "Organization", name: x.name, description: x.bio || x.about || undefined }] });
        app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs([[page, isA ? "نویسندگان" : "ناشران"], ["", x.name]])}<div class="flex gap items-c wrap"><div class="avatar ${isA ? "" : "sq"}" style="width:110px;height:110px;font-size:40px">${(x.image || x.logo) ? `<img src="${B.esc(x.image || x.logo)}" alt="${B.esc(x.name)}">` : B.esc(x.name[0])}</div><div><span class="tag-pill">${label}</span><h1 style="margin-top:6px">${B.esc(x.name)}</h1><p>${B.esc(x.bio || x.about || "")}</p></div></div></div></div><div class="container section"><h2 class="mb">کتاب‌ها (${B.fa(books.length)})</h2>${books.length ? grid(books) : `<div class="empty">${B.icon("book")}<h3>کتابی ثبت نشده</h3></div>`}</div>`;
        return;
      }
      B.seo({ title: isA ? "نویسندگان" : "ناشران", desc: `فهرست ${isA ? "نویسندگان" : "ناشران"} بوکورا`, jsonld: [B.crumbsLd([[page, isA ? "نویسندگان" : "ناشران"]])] });
      const draw = (q) => { const n = B.norm(q || ""); const r = list.filter((i) => B.norm(i.name).includes(n)).sort((a, b) => a.name.localeCompare(b.name, "fa")); B.$("#plist").innerHTML = r.length ? `<div class="cat-grid">${r.map((i) => `<a class="person" style="width:auto" href="${urlf(i)}"><div class="avatar ${isA ? "" : "sq"}">${(i.image || i.logo) ? `<img src="${B.esc(i.image || i.logo)}" alt="${B.esc(i.name)}" loading="lazy">` : B.esc(i.name[0])}</div><strong>${B.esc(i.name)}</strong><small>${B.fa(productsOf(kind, i.id).length)} کتاب</small></a>`).join("")}</div>` : `<div class="empty">${B.icon("search")}<h3>موردی پیدا نشد</h3></div>`; };
      app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs([["", isA ? "نویسندگان" : "ناشران"]])}<h1>${isA ? "نویسندگان" : "ناشران"}</h1><p>${isA ? "با نویسندگان مورد علاقه‌تان آشنا شوید." : "ناشران همکار بوکورا."}</p></div></div><div class="container section"><input class="input mb" style="max-width:420px" id="pq" placeholder="جستجو در ${isA ? "نویسندگان" : "ناشران"}…"><div id="plist"></div></div>`;
      draw(); B.$("#pq").oninput = B.debounce((e) => draw(e.target.value), 100);
    };
  }
  B.pages.authors = people("author"); B.pages.publishers = people("publisher");

  /* ===================== COLLECTIONS ===================== */
  B.pages.collections = async (app) => {
    const slug = B.qs().get("slug");
    if (slug) {
      const k = S().collections.find((x) => x.slug === slug); const books = k ? k.productIds.map(B.product).filter(Boolean) : [];
      if (!k) { app.innerHTML = `<div class="container section"><div class="empty">${B.icon("search")}<h3>مجموعه پیدا نشد</h3><a class="btn btn-primary" href="/collections.html">بازگشت</a></div></div>`; return; }
      B.seo({ title: k.title, desc: k.desc, jsonld: [B.crumbsLd([["/collections.html", "مجموعه‌ها"], [B.url.coll(k), k.title]])] });
      app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs([["/collections.html", "مجموعه‌ها"], ["", k.title]])}<h1>${B.esc(k.title)}</h1><p>${B.esc(k.desc || "")}</p></div></div><div class="container section">${books.length ? grid(books) : `<div class="empty">${B.icon("book")}<h3>کتابی در این مجموعه نیست</h3></div>`}</div>`; return;
    }
    B.seo({ title: "مجموعه‌های کتاب", desc: "مجموعه‌های موضوعی، آموزشی و تخفیفی بوکورا", jsonld: [B.crumbsLd([["/collections.html", "مجموعه‌ها"]])] });
    app.innerHTML = `<div class="page-head"><div class="container">${B.crumbs([["", "مجموعه‌ها"]])}<h1>مجموعه‌های کتاب</h1><p>بسته‌های منتخب آموزشی، موضوعی و تخفیفی</p></div></div><div class="container section">${S().collections.length ? `<div class="flex wrap gap">${S().collections.map((k, i) => `<a class="coll-card ${k.color || "c" + ((i % 4) + 1)}" href="${B.url.coll(k)}"><span class="tag">${k.type === "educational" ? "آموزشی" : k.type === "discount" ? "تخفیفی" : "مجموعه"}</span><h3>${B.esc(k.title)}</h3><p>${B.esc(k.desc || "")}</p><span class="btn btn-white btn-sm" style="align-self:flex-start">${B.fa(k.productIds.length)} کتاب</span></a>`).join("")}</div>` : `<div class="empty">${B.icon("cube")}<h3>مجموعه‌ای ثبت نشده</h3></div>`}</div>`;
  };
})();
