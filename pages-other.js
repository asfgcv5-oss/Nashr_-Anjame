/* BOOKORA — cart, checkout, order result, tracking, account, wishlist, compare, news, static pages */
(function () {
  "use strict";
  const B = window.B; B.pages = B.pages || {};
  const S = () => B.data;
  B.STATUS = { pending: "در انتظار", awaiting_payment: "در انتظار پرداخت", paid: "پرداخت‌شده", processing: "در حال پردازش", ready: "آماده ارسال", shipped: "ارسال‌شده", delivered: "تحویل داده شد", cancelled: "لغو شده", refunded: "مسترد شده" };
  const FLOW = ["paid", "processing", "ready", "shipped", "delivered"];
  const grid = (l) => `<div class="grid">${l.map(B.card).join("")}</div>`;
  const empty = (ic, t, p, a) => `<div class="empty">${B.icon(ic)}<h3>${t}</h3><p>${p || ""}</p>${a || ""}</div>`;
  const head = (title, sub, crumb) => `<div class="page-head"><div class="container">${B.crumbs([["", crumb || title]])}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
  const orders = () => B.ls.get("bk_orders", []);
  const saveOrder = (o) => { const a = orders().filter((x) => x.code !== o.code); a.unshift(o); B.ls.set("bk_orders", a.slice(0, 50)); };
  const timeline = (st) => { const i = FLOW.indexOf(st); return `<div class="timeline">${FLOW.map((k, n) => `<div class="tl ${i >= n ? "done" : ""}"><i>${i >= n ? "✓" : n + 1}</i>${B.STATUS[k]}</div>`).join("")}</div>`; };
  const orderView = (o) => `<div class="panel"><div class="flex between items-c wrap gap"><div><span class="text-muted">کد سفارش</span><h3 class="ltr">${B.esc(o.code)}</h3></div><span class="status ${o.status}">${B.STATUS[o.status] || o.status}</span></div>
    ${["cancelled", "refunded", "pending", "awaiting_payment"].includes(o.status) ? "" : timeline(o.status)}
    ${o.trackingCode ? `<div class="notice info">کد رهگیری مرسوله: <b class="ltr">${B.esc(o.trackingCode)}</b></div>` : ""}
    <table class="specs mt">${(o.items || []).map((i) => `<tr><td>${B.esc(i.title)}</td><td>${B.fa(i.qty)} × ${B.moneyText(i.price)}</td></tr>`).join("")}<tr><td>هزینه ارسال</td><td>${B.moneyText(o.shipping || 0)}</td></tr><tr><td>مبلغ کل</td><td><b>${B.moneyText(o.total)}</b></td></tr></table>
    ${o.status === "awaiting_payment" && o.payment === "zarinpal" ? `<button class="btn btn-primary mt" data-repay="${B.esc(o.code)}" data-phone="${B.esc(o.phone || "")}">پرداخت آنلاین سفارش</button>` : ""}</div>`;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-repay]"); if (!b) return; b.disabled = true;
    const r = await B.api("/api/pay.php", { code: b.dataset.repay, phone: b.dataset.phone });
    if (r.ok && r.url) location.href = r.url; else { B.toast(r.error || "خطا در اتصال به درگاه", "err"); b.disabled = false; }
  });

  /* ===================== CART ===================== */
  B.pages.cart = async (app) => {
    B.seo({ title: "سبد خرید" });
    const draw = () => {
      const t = B.cart.totals(); const cp = B.cart.st().coupon; const thr = S().settings.freeShippingThreshold;
      if (!t.lines.length) { app.innerHTML = head("سبد خرید", "", "سبد خرید") + `<div class="container section">${empty("cart", "سبد خرید شما خالی است", "کتاب‌های مورد علاقه‌تان را به سبد اضافه کنید.", '<a class="btn btn-primary" href="/shop.html">رفتن به فروشگاه</a>')}</div>`; return; }
      app.innerHTML = head("سبد خرید", `${B.fa(B.cart.count())} کتاب در سبد شما`, "سبد خرید") + `<div class="container cart-layout"><div>
        ${thr ? `<div class="notice ${t.subtotal >= thr ? "ok" : "info"}">${t.subtotal >= thr ? "ارسال پست برای این سفارش رایگان است 🎉" : `با ${B.moneyText(thr - t.subtotal)} خرید بیشتر، ارسال پست رایگان می‌شود.`}</div>` : ""}
        ${t.lines.map((l) => `<div class="cart-item"><a href="${B.url.book(l.p)}">${B.cover(l.p)}</a><div><h4><a href="${B.url.book(l.p)}">${B.esc(l.p.title)}</a></h4><small>${B.esc((B.author(l.p.author) || {}).name || "")}</small><div class="price" style="margin-top:6px">${l.p.discount > 0 ? `<del>${B.num(l.p.price)}</del>` : ""}<b>${B.money(B.final(l.p))}</b></div></div>
          <div class="flex gap items-c"><div class="qty"><button data-q="${l.id}" data-d="-1" aria-label="کاهش">−</button><input value="${B.fa(l.qty)}" readonly aria-label="تعداد"><button data-q="${l.id}" data-d="1" aria-label="افزایش">+</button></div><button class="icon-btn" data-rm="${l.id}" aria-label="حذف" style="color:var(--red)">${B.icon("trash")}</button></div></div>`).join("")}
        <a class="btn btn-light" href="/shop.html">${B.icon("right")} ادامه خرید</a></div>
        <aside class="summary"><h3>خلاصه سفارش</h3>
          <div class="sum-row"><span>قیمت کالاها (${B.fa(B.cart.count())})</span><span>${B.moneyText(t.original)}</span></div>
          ${t.bookDisc > 0 ? `<div class="sum-row disc"><span>تخفیف کتاب‌ها</span><span>− ${B.moneyText(t.bookDisc)}</span></div>` : ""}
          ${t.coupon > 0 ? `<div class="sum-row disc"><span>کد تخفیف (${B.esc(cp.code)}) <button data-rmc style="color:var(--red);font-size:12px">حذف</button></span><span>− ${B.moneyText(t.coupon)}</span></div>` : ""}
          <div class="sum-row"><span>هزینه ارسال</span><span class="text-muted">در مرحله بعد</span></div>
          <div class="sum-row total"><span>جمع</span><span>${B.moneyText(t.subtotal - t.coupon)}</span></div>
          ${cp ? "" : `<form class="coupon" id="cpForm"><input class="input sm" id="cpCode" placeholder="کد تخفیف" dir="ltr" style="text-align:right"><button class="btn btn-light btn-sm" type="submit">اعمال</button></form>`}
          <a class="btn btn-primary btn-block btn-lg" href="/checkout.html">ادامه و پرداخت</a></aside></div>`;
    };
    draw(); document.addEventListener("cart:change", draw);
    app.addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]"), c = e.target.closest("[data-rmc]");
      if (q) { const l = B.cart.st().items.find((i) => i.id === q.dataset.q); const p = B.product(q.dataset.q); const n = l.qty + +q.dataset.d; if (n > p.stock) return B.toast("موجودی کافی نیست", "err"); B.cart.set(q.dataset.q, n); }
      if (r) B.cart.remove(r.dataset.rm); if (c) B.cart.setCoupon(null);
    });
    app.addEventListener("submit", async (e) => {
      if (e.target.id !== "cpForm") return; e.preventDefault(); const code = B.$("#cpCode").value.trim(); if (!code) return;
      const r = await B.api("/api/coupon.php?code=" + encodeURIComponent(code));
      if (r.ok) { B.cart.setCoupon(r.coupon); B.toast("کد تخفیف اعمال شد", "ok"); } else B.toast(r.error || "کد نامعتبر است", "err");
    });
  };

  /* ===================== CHECKOUT ===================== */
  B.pages.checkout = async (app) => {
    B.seo({ title: "تکمیل سفارش" });
    if (!B.cart.lines().length) { app.innerHTML = head("تکمیل سفارش", "", "پرداخت") + `<div class="container section">${empty("cart", "سبد خرید خالی است", "", '<a class="btn btn-primary" href="/shop.html">رفتن به فروشگاه</a>')}</div>`; return; }
    const prof = B.ls.get("bk_profile", {}); const s = S().settings;
    const ships = (s.shippingMethods || []).filter((m) => m.enabled !== false);
    const pays = [s.payment && s.payment.zarinpal ? ["zarinpal", "پرداخت آنلاین (زرین‌پال)", "پرداخت امن با کارت‌های عضو شتاب"] : null, s.payment && s.payment.card ? ["card", "کارت به کارت", "پس از ثبت سفارش، مبلغ را واریز و رسید را اعلام کنید"] : null].filter(Boolean);
    const D = { name: prof.name || "", phone: prof.phone || "", email: prof.email || "", province: (prof.addresses && prof.addresses[0] && prof.addresses[0].province) || "", city: (prof.addresses && prof.addresses[0] && prof.addresses[0].city) || "", address: (prof.addresses && prof.addresses[0] && prof.addresses[0].address) || "", postal: (prof.addresses && prof.addresses[0] && prof.addresses[0].postal) || "", note: "", ship: ships[0] ? ships[0].id : "", pay: pays[0] ? pays[0][0] : "" };
    let step = 1, placed = null;
    const names = ["اطلاعات مشتری", "آدرس ارسال", "روش ارسال", "روش پرداخت", "تأیید نهایی"];
    const fld = (id, label, type = "text", extra = "", cls = "") => `<div class="field ${cls}" id="f-${id}"><label for="${id}">${label}</label>${type === "textarea" ? `<textarea class="textarea" id="${id}">${B.esc(D[id])}</textarea>` : `<input class="input" id="${id}" type="${type}" value="${B.esc(D[id])}" ${extra}>`}<div class="err"></div></div>`;
    const sum = () => { const t = B.cart.totals(D.ship); return `<aside class="summary"><h3>سفارش شما</h3>${t.lines.map((l) => `<div class="sum-row"><span>${B.esc(l.p.title)} × ${B.fa(l.qty)}</span><span>${B.num(B.final(l.p) * l.qty)}</span></div>`).join("")}<div class="sum-row"><span>جمع کالاها</span><span>${B.moneyText(t.subtotal)}</span></div>${t.coupon ? `<div class="sum-row disc"><span>کد تخفیف</span><span>− ${B.moneyText(t.coupon)}</span></div>` : ""}<div class="sum-row"><span>ارسال</span><span>${t.method ? (t.shipping ? B.moneyText(t.shipping) : "رایگان") : "—"}</span></div><div class="sum-row total"><span>قابل پرداخت</span><span>${B.moneyText(t.total)}</span></div></aside>`; };
    const bad = (id, msg) => { const f = B.$("#f-" + id); f.classList.add("bad"); f.querySelector(".err").textContent = msg; return false; };
    const clearBad = () => B.$$(".field.bad").forEach((f) => f.classList.remove("bad"));
    const read = () => { B.$$("#stepBody input.input,#stepBody textarea,#stepBody select").forEach((i) => { if (i.id in D) D[i.id] = B.norm(i.value).length && ["phone", "postal"].includes(i.id) ? B.norm(i.value) : i.value.trim(); }); };
    function validate() {
      clearBad(); read(); let ok = true;
      if (step === 1) { if (D.name.length < 3) ok = bad("name", "نام و نام خانوادگی را وارد کنید"); if (!/^09\d{9}$/.test(D.phone)) ok = bad("phone", "شماره موبایل معتبر نیست (مثال: 09123456789)"); if (D.email && !/^\S+@\S+\.\S+$/.test(D.email)) ok = bad("email", "ایمیل معتبر نیست"); }
      if (step === 2) { if (!D.province) ok = bad("province", "استان را وارد کنید"); if (!D.city) ok = bad("city", "شهر را وارد کنید"); if (D.address.length < 10) ok = bad("address", "آدرس کامل را وارد کنید"); if (!/^\d{10}$/.test(D.postal)) ok = bad("postal", "کد پستی ۱۰ رقمی را وارد کنید"); }
      if (step === 3 && !D.ship) { B.toast("روش ارسال را انتخاب کنید", "err"); ok = false; }
      if (step === 4) { if (!D.pay) { B.toast("روش پرداخت را انتخاب کنید", "err"); ok = false; } else if (!B.$("#agree").checked) { B.toast("پذیرش قوانین الزامی است", "err"); ok = false; } }
      return ok;
    }
    function body() {
      if (step === 1) return `<h3 class="mb">اطلاعات مشتری</h3><div class="form-grid">${fld("name", "نام و نام خانوادگی", "text", 'autocomplete="name"')}${fld("phone", "شماره موبایل", "tel", 'dir="ltr" inputmode="numeric" autocomplete="tel" placeholder="09123456789"')}${fld("email", "ایمیل (اختیاری)", "email", 'dir="ltr" autocomplete="email"', "full")}</div>`;
      if (step === 2) return `<h3 class="mb">آدرس ارسال</h3><div class="form-grid">${fld("province", "استان")}${fld("city", "شهر")}${fld("address", "نشانی کامل", "textarea", "", "full")}${fld("postal", "کد پستی", "text", 'dir="ltr" inputmode="numeric" maxlength="10"')}${fld("note", "توضیحات سفارش (اختیاری)", "text")}</div>`;
      if (step === 3) return `<h3 class="mb">روش ارسال</h3>${ships.map((m) => { const t = B.cart.totals(m.id); return `<label class="opt ${D.ship === m.id ? "on" : ""}"><input type="radio" name="ship" value="${m.id}" ${D.ship === m.id ? "checked" : ""}><div class="grow"><b>${B.esc(m.name)}</b><small>${B.esc(m.eta || "")}</small></div><b>${t.shipping ? B.moneyText(t.shipping) : "رایگان"}</b></label>`; }).join("") || '<div class="notice err">روش ارسالی تنظیم نشده است.</div>'}`;
      if (step === 4) return `<h3 class="mb">روش پرداخت</h3>${pays.map((m) => `<label class="opt ${D.pay === m[0] ? "on" : ""}"><input type="radio" name="pay" value="${m[0]}" ${D.pay === m[0] ? "checked" : ""}><div class="grow"><b>${m[1]}</b><small>${m[2]}</small></div>${B.icon("shield")}</label>`).join("") || '<div class="notice err">هیچ روش پرداختی فعال نیست. از پنل مدیریت فعال کنید.</div>'}<div class="notice info">${B.icon("lock")} اطلاعات کارت بانکی شما هرگز در سایت ما ثبت یا ذخیره نمی‌شود؛ پرداخت در صفحه امن بانک انجام می‌شود.</div><label class="check"><input type="checkbox" id="agree"> <span><a href="/page.html?p=terms" target="_blank" style="color:var(--blue)">قوانین و مقررات</a> و <a href="/page.html?p=privacy" target="_blank" style="color:var(--blue)">حریم خصوصی</a> را می‌پذیرم.</span></label>`;
      if (step === 5) return confirmHtml();
    }
    function confirmHtml() {
      if (!placed) return "";
      if (placed.pay === "card") return `<div class="center"><div class="big result" style="all:unset"></div><h2>سفارش شما ثبت شد</h2><p class="text-muted">کد سفارش: <b class="ltr">${B.esc(placed.code)}</b></p><div class="notice info" style="text-align:start">مبلغ <b>${B.moneyText(placed.total)}</b> را به کارت <b class="ltr">${B.esc(s.payment.cardNumber || "—")}</b> به نام ${B.esc(s.payment.cardOwner || "")} واریز کنید و رسید را از بخش تماس با ما یا پشتیبانی اعلام کنید. سفارش پس از تأیید پرداخت پردازش می‌شود.</div><a class="btn btn-primary" href="/track.html?code=${encodeURIComponent(placed.code)}">پیگیری سفارش</a></div>`;
      return `<div class="center"><h2>سفارش ثبت شد — در انتظار پرداخت</h2><p class="text-muted">کد سفارش: <b class="ltr">${B.esc(placed.code)}</b></p>${placed.err ? `<div class="notice err">${B.esc(placed.err)}</div>` : ""}<p>برای نهایی شدن سفارش، پرداخت را انجام دهید.</p><button class="btn btn-primary btn-lg" data-repay="${B.esc(placed.code)}" data-phone="${B.esc(D.phone)}">پرداخت آنلاین</button></div>`;
    }
    function draw() {
      app.innerHTML = head("تکمیل سفارش", "", "پرداخت") + `<div class="container section"><div class="steps">${names.map((n, i) => `<div class="step ${step === i + 1 ? "on" : step > i + 1 ? "done" : ""}"><i>${step > i + 1 ? "✓" : B.fa(i + 1)}</i>${n}</div>`).join("")}</div><div class="cart-layout" style="padding:0"><div class="panel"><div id="stepBody">${body()}</div>${step < 5 ? `<div class="nav-btns">${step > 1 ? '<button class="btn btn-outline" id="back">قبلی</button>' : '<a class="btn btn-outline" href="/cart.html">بازگشت به سبد</a>'}<button class="btn btn-primary" id="next">${step === 4 ? "ثبت سفارش و پرداخت" : "مرحله بعد"}</button></div>` : ""}</div>${sum()}</div></div>`;
      B.$$("input[name=ship],input[name=pay]").forEach((r) => r.addEventListener("change", () => { D[r.name === "ship" ? "ship" : "pay"] = r.value; B.$$(".opt").forEach((o) => o.classList.toggle("on", o.querySelector("input").checked)); B.$(".summary").outerHTML = sum(); }));
      if (B.$("#next")) B.$("#next").onclick = next; if (B.$("#back")) B.$("#back").onclick = () => { read(); step--; draw(); };
    }
    async function next() {
      if (!validate()) return; if (step < 4) { step++; draw(); scrollTo({ top: 0 }); return; }
      const btn = B.$("#next"); btn.disabled = true; btn.textContent = "در حال ثبت سفارش…";
      const st = B.cart.st();
      const r = await B.api("/api/order.php", { items: st.items, coupon: st.coupon ? st.coupon.code : "", customer: { name: D.name, phone: D.phone, email: D.email }, address: { province: D.province, city: D.city, address: D.address, postal: D.postal }, note: D.note, shipping: D.ship, payment: D.pay });
      if (!r.ok) { B.toast(r.error || "ثبت سفارش ناموفق بود", "err"); btn.disabled = false; btn.textContent = "ثبت سفارش و پرداخت"; return; }
      placed = { code: r.order.code, total: r.order.total, pay: D.pay };
      saveOrder({ code: r.order.code, phone: D.phone, total: r.order.total, date: new Date().toISOString(), payment: D.pay });
      const prev = B.ls.get("bk_profile", {}); B.ls.set("bk_profile", { ...prev, name: D.name, phone: D.phone, email: D.email, addresses: prev.addresses && prev.addresses.length ? prev.addresses : [{ province: D.province, city: D.city, address: D.address, postal: D.postal }] });
      if (D.pay === "zarinpal") {
        const g = await B.api("/api/pay.php", { code: r.order.code, phone: D.phone });
        if (g.ok && g.url) { location.href = g.url; return; }
        placed.err = g.error || "اتصال به درگاه برقرار نشد."; step = 5; draw();
      } else { B.cart.clear(); step = 5; draw(); }
    }
    draw();
  };

  /* ===================== ORDER RESULT ===================== */
  B.pages["order-result"] = async (app) => {
    B.seo({ title: "نتیجه پرداخت" }); const q = B.qs(); const code = q.get("code") || ""; const param = q.get("status") || "";
    const local = orders().find((o) => o.code === code); let o = null;
    if (local) { const r = await B.api("/api/track.php", { code, phone: local.phone }); if (r.ok) o = r.order; }
    const status = o ? o.status : null; const paid = o && ["paid", "processing", "ready", "shipped", "delivered"].includes(o.status);
    if (paid) B.cart.clear();
    const state = paid ? "ok" : param === "failed" || (o && o.status === "awaiting_payment" && param !== "pending") ? "bad" : "wait";
    app.innerHTML = `<div class="container"><div class="result"><div class="big ${state}">${state === "ok" ? "✓" : state === "bad" ? "✕" : "…"}</div>
      <h2>${state === "ok" ? "پرداخت با موفقیت تأیید شد" : state === "bad" ? "پرداخت انجام نشد" : "در حال بررسی وضعیت سفارش"}</h2>
      <p class="text-muted mt">${state === "ok" ? "سفارش شما ثبت شد و در صف پردازش قرار گرفت." : state === "bad" ? "مبلغی از حساب شما کسر نشده است؛ اگر کسر شده، حداکثر تا ۷۲ ساعت به حساب شما بازمی‌گردد. می‌توانید دوباره پرداخت کنید." : "نتیجه نهایی را در بخش پیگیری سفارش ببینید."}</p>
      ${code ? `<p class="mt">کد سفارش: <b class="ltr">${B.esc(code)}</b></p>` : ""}${q.get("ref") && paid ? `<p>شماره تراکنش بانکی: <b class="ltr">${B.esc(q.get("ref"))}</b></p>` : ""}
      <div class="flex gap wrap mt" style="justify-content:center">${state === "bad" && local ? `<button class="btn btn-primary" data-repay="${B.esc(code)}" data-phone="${B.esc(local.phone)}">تلاش مجدد برای پرداخت</button>` : ""}<a class="btn btn-light" href="/track.html?code=${encodeURIComponent(code)}">پیگیری سفارش</a><a class="btn btn-outline" href="/shop.html">ادامه خرید</a></div></div></div>`;
  };

  /* ===================== TRACK ===================== */
  B.pages.track = async (app) => {
    B.seo({ title: "پیگیری سفارش" }); const q = B.qs();
    app.innerHTML = head("پیگیری سفارش", "کد سفارش و شماره موبایل خود را وارد کنید.") + `<div class="container section" style="max-width:760px"><form class="panel" id="tf"><div class="form-grid"><div class="field"><label>کد سفارش</label><input class="input" id="tc" dir="ltr" placeholder="BK-XXXXXX" value="${B.esc(q.get("code") || "")}" required></div><div class="field"><label>شماره موبایل</label><input class="input" id="tp" dir="ltr" inputmode="numeric" placeholder="09123456789" required></div></div><button class="btn btn-primary mt" type="submit">پیگیری</button></form><div id="tr" class="mt"></div></div>`;
    const known = orders(); const cur = known.find((o) => o.code === q.get("code")); if (cur) B.$("#tp").value = cur.phone;
    const run = async () => { const out = B.$("#tr"); out.innerHTML = '<div class="skeleton"></div>'; const r = await B.api("/api/track.php", { code: B.$("#tc").value.trim().toUpperCase(), phone: B.norm(B.$("#tp").value) }); out.innerHTML = r.ok ? orderView(r.order) : `<div class="notice err">${B.esc(r.error || "سفارشی پیدا نشد")}</div>`; };
    B.$("#tf").onsubmit = (e) => { e.preventDefault(); run(); }; if (cur) run();
  };

  /* ===================== WISHLIST / COMPARE ===================== */
  B.pages.wishlist = async (app) => {
    B.seo({ title: "علاقه‌مندی‌ها" });
    const draw = () => { const l = B.wish.all().map(B.product).filter(Boolean); app.innerHTML = head("علاقه‌مندی‌ها", `${B.fa(l.length)} کتاب`) + `<div class="container section">${l.length ? grid(l) : empty("heart", "فهرست علاقه‌مندی‌ها خالی است", "با زدن آیکن قلب روی هر کتاب، آن را اینجا ذخیره کنید.", '<a class="btn btn-primary" href="/shop.html">مشاهده کتاب‌ها</a>')}</div>`; B.refreshBadges(); };
    draw(); document.addEventListener("wish:change", draw);
  };
  B.pages.compare = async (app) => {
    B.seo({ title: "مقایسه کتاب‌ها" });
    const draw = () => {
      const l = B.cmp.all().map(B.product).filter(Boolean);
      if (!l.length) { app.innerHTML = head("مقایسه کتاب‌ها", "") + `<div class="container section">${empty("compare", "کتابی برای مقایسه انتخاب نشده", "با آیکن مقایسه روی کارت کتاب‌ها، تا ۴ کتاب را کنار هم ببینید.", '<a class="btn btn-primary" href="/shop.html">مشاهده کتاب‌ها</a>')}</div>`; return; }
      const rows = [["قیمت", (p) => B.moneyText(B.final(p))], ["تخفیف", (p) => (p.discount ? B.fa(p.discount) + "٪" : "—")], ["نویسنده", (p) => (B.author(p.author) || {}).name || "—"], ["ناشر", (p) => (B.publisher(p.publisher) || {}).name || "—"], ["دسته‌بندی", (p) => (B.category(p.category) || {}).name || "—"], ["سال انتشار", (p) => (p.year ? B.fa(p.year) : "—")], ["تعداد صفحات", (p) => (p.pages ? B.fa(p.pages) : "—")], ["نوع جلد", (p) => p.binding || "—"], ["زبان", (p) => p.language || "—"], ["شابک", (p) => (p.isbn ? `<span class="ltr">${B.esc(p.isbn)}</span>` : "—")], ["موجودی", (p) => (B.inStock(p) ? "موجود" : "ناموجود")]];
      app.innerHTML = head("مقایسه کتاب‌ها", `${B.fa(l.length)} کتاب`) + `<div class="container section"><div class="compare-wrap"><table class="compare"><tr><th></th>${l.map((p) => `<th><a href="${B.url.book(p)}">${B.cover(p)}<div>${B.esc(p.title)}</div></a><button class="btn btn-danger btn-sm mt" data-act="cmp" data-id="${p.id}">حذف</button> <button class="btn btn-primary btn-sm mt" data-act="add" data-id="${p.id}">افزودن به سبد</button></th>`).join("")}</tr>${rows.map((r) => `<tr><td>${r[0]}</td>${l.map((p) => `<td>${r[1](p)}</td>`).join("")}</tr>`).join("")}</table></div></div>`;
    };
    draw(); document.addEventListener("click", (e) => { if (e.target.closest('[data-act="cmp"]')) setTimeout(draw, 30); });
  };

  /* ===================== ACCOUNT ===================== */
  B.pages.account = async (app) => {
    B.seo({ title: "حساب من" }); let tab = B.qs().get("tab") || "profile";
    const tabs = [["profile", "user", "اطلاعات من"], ["addresses", "pin", "آدرس‌ها"], ["orders", "package", "سفارش‌ها"], ["wish", "heart", "علاقه‌مندی‌ها"], ["fav", "star", "نویسندگان و دسته‌های محبوب"], ["recent", "eye", "اخیراً دیده‌شده"], ["notif", "bell", "اعلان‌ها"], ["support", "headset", "پشتیبانی"]];
    const prof = () => B.ls.get("bk_profile", { addresses: [], favAuthors: [], favCats: [] });
    const seenKey = "bk_notif_seen";
    const views = {
      profile() { const p = prof(); return `<h3 class="mb">اطلاعات شخصی</h3><div class="notice info">اطلاعات حساب فقط روی همین مرورگر ذخیره می‌شود و برای تکمیل سریع سفارش‌ها استفاده می‌شود.</div><form id="pf" class="form-grid"><div class="field"><label>نام</label><input class="input" name="name" value="${B.esc(p.name || "")}"></div><div class="field"><label>موبایل</label><input class="input" name="phone" dir="ltr" value="${B.esc(p.phone || "")}"></div><div class="field full"><label>ایمیل</label><input class="input" name="email" dir="ltr" value="${B.esc(p.email || "")}"></div><div class="full"><button class="btn btn-primary" type="submit">ذخیره</button></div></form>`; },
      addresses() { const p = prof(); return `<h3 class="mb">آدرس‌های من</h3>${(p.addresses || []).map((a, i) => `<div class="opt"><div class="grow"><b>${B.esc(a.province)}، ${B.esc(a.city)}</b><small>${B.esc(a.address)} — کد پستی ${B.fa(a.postal || "")}</small></div><button class="btn btn-danger btn-sm" data-deladdr="${i}">حذف</button></div>`).join("") || '<p class="text-muted">آدرسی ذخیره نشده.</p>'}<form id="af" class="form-grid mt"><div class="field"><label>استان</label><input class="input" name="province" required></div><div class="field"><label>شهر</label><input class="input" name="city" required></div><div class="field full"><label>نشانی</label><input class="input" name="address" required minlength="10"></div><div class="field"><label>کد پستی</label><input class="input" name="postal" dir="ltr" pattern="[0-9۰-۹]{10}" required></div><div class="full"><button class="btn btn-primary" type="submit">افزودن آدرس</button></div></form>`; },
      orders() { const o = orders(); return `<h3 class="mb">سفارش‌های من</h3>${o.length ? o.map((x) => `<div class="opt"><div class="grow"><b class="ltr">${B.esc(x.code)}</b><small>${B.date(x.date)} · ${B.moneyText(x.total)}</small></div><a class="btn btn-light btn-sm" href="/track.html?code=${encodeURIComponent(x.code)}">پیگیری</a></div>`).join("") : empty("package", "هنوز سفارشی ثبت نکرده‌اید", "", '<a class="btn btn-primary" href="/shop.html">شروع خرید</a>')}<p class="text-muted">برای سفارش‌های دیگر از <a href="/track.html" style="color:var(--blue)">پیگیری سفارش</a> استفاده کنید.</p>`; },
      wish() { const l = B.wish.all().map(B.product).filter(Boolean); return `<h3 class="mb">علاقه‌مندی‌ها</h3>${l.length ? grid(l) : empty("heart", "فهرست خالی است")}`; },
      fav() { const p = prof(); const fa = p.favAuthors || [], fc = p.favCats || []; return `<h3 class="mb">دسته‌های محبوب</h3><div class="filters-bar">${S().categories.map((c) => `<button class="chip ${fc.includes(c.id) ? "on" : ""}" data-favc="${c.id}">${c.icon || ""} ${B.esc(c.name)}</button>`).join("")}</div><h3 class="mb">نویسندگان محبوب</h3><div class="filters-bar">${S().authors.map((a) => `<button class="chip ${fa.includes(a.id) ? "on" : ""}" data-fava="${a.id}">${B.esc(a.name)}</button>`).join("")}</div>`; },
      recent() { const l = B.recent.all().map(B.product).filter(Boolean); return `<h3 class="mb">اخیراً دیده‌اید</h3>${l.length ? grid(l) : empty("eye", "هنوز کتابی ندیده‌اید")}`; },
      notif() { const seen = B.ls.get(seenKey, 0); const l = B.liveArticles().slice(0, 12); B.ls.set(seenKey, Date.now()); return `<h3 class="mb">اعلان‌ها</h3>${l.length ? l.map((a) => `<a class="opt" href="${B.url.article(a)}">${new Date(a.date).getTime() > seen ? '<span class="tag-pill hot">جدید</span>' : ""}<div class="grow"><b>${B.esc(a.title)}</b><small>${B.esc(a.category)} · ${B.date(a.date)}</small></div></a>`).join("") : empty("bell", "اعلانی وجود ندارد")}`; },
      support() { const p = prof(); return `<h3 class="mb">ارسال درخواست پشتیبانی</h3><form id="sf" class="form-grid"><div class="field"><label>نام</label><input class="input" name="name" value="${B.esc(p.name || "")}" required></div><div class="field"><label>موبایل یا ایمیل</label><input class="input" name="contact" dir="ltr" value="${B.esc(p.phone || p.email || "")}" required></div><div class="field full"><label>موضوع</label><input class="input" name="subject" required></div><div class="field full"><label>پیام</label><textarea class="textarea" name="message" required minlength="10"></textarea></div><div class="full"><button class="btn btn-primary" type="submit">ارسال تیکت</button></div></form>`; },
    };
    const draw = () => { app.innerHTML = head("پیشخوان مشتری", "مدیریت اطلاعات، آدرس‌ها و سفارش‌ها") + `<div class="container dash"><nav class="dash-nav">${tabs.map((t) => `<button class="${tab === t[0] ? "on" : ""}" data-tab="${t[0]}">${B.icon(t[1])}${t[2]}</button>`).join("")}</nav><div class="panel">${views[tab]()}</div></div>`; B.refreshBadges(); };
    draw();
    app.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab],[data-deladdr],[data-favc],[data-fava]"); if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; draw(); } else { const p = prof(); p.addresses = p.addresses || []; p.favAuthors = p.favAuthors || []; p.favCats = p.favCats || [];
        if (t.dataset.deladdr) p.addresses.splice(+t.dataset.deladdr, 1);
        if (t.dataset.favc) p.favCats = p.favCats.includes(t.dataset.favc) ? p.favCats.filter((x) => x !== t.dataset.favc) : [...p.favCats, t.dataset.favc];
        if (t.dataset.fava) p.favAuthors = p.favAuthors.includes(t.dataset.fava) ? p.favAuthors.filter((x) => x !== t.dataset.fava) : [...p.favAuthors, t.dataset.fava];
        B.ls.set("bk_profile", p); draw(); }
    });
    app.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target).entries()); const p = prof();
      if (e.target.id === "pf") { if (f.phone && !/^09\d{9}$/.test(B.norm(f.phone))) return B.toast("شماره موبایل معتبر نیست", "err"); B.ls.set("bk_profile", { ...p, ...f, phone: B.norm(f.phone) }); B.toast("ذخیره شد", "ok"); }
      if (e.target.id === "af") { f.postal = B.norm(f.postal); p.addresses = [...(p.addresses || []), f]; B.ls.set("bk_profile", p); draw(); B.toast("آدرس اضافه شد", "ok"); }
      if (e.target.id === "sf") { const r = await B.api("/api/contact.php", { ...f, type: "ticket" }); if (r.ok) { B.toast("درخواست شما ثبت شد", "ok"); e.target.reset(); } else B.toast(r.error || "خطا", "err"); }
    });
  };

  /* ===================== NEWS ===================== */
  B.pages.news = async (app) => {
    const slug = B.qs().get("slug"); const arts = B.liveArticles();
    if (slug) {
      const a = arts.find((x) => x.slug === slug);
      if (!a) { app.innerHTML = `<div class="container section">${empty("news", "مطلب پیدا نشد", "ممکن است منتشر نشده یا حذف شده باشد.", '<a class="btn btn-primary" href="/news.html">بازگشت به اعلانات</a>')}</div>`; return; }
      const rel = arts.filter((x) => x.id !== a.id && x.category === a.category).concat(arts.filter((x) => x.id !== a.id && x.category !== a.category)).slice(0, 3);
      const url = B.url.article(a);
      B.seo({ title: a.seoTitle || a.title, desc: a.seoDesc || a.excerpt, image: a.cover, type: "article", canonical: url, jsonld: [B.crumbsLd([["/news.html", "اعلانات و مجله"], [url, a.title]]), { "@context": "https://schema.org", "@type": "NewsArticle", headline: a.title, image: a.cover ? [B.abs(a.cover)] : undefined, datePublished: a.date, author: { "@type": "Person", name: a.author || S().settings.siteName }, publisher: { "@type": "Organization", name: S().settings.siteName } }] });
      app.innerHTML = `<div class="container section"><article class="article">${B.crumbs([["/news.html", "اعلانات و مجله"], ["", a.title]])}<span class="tag-pill ${B.ANN_CATS.includes(a.category) ? "hot" : ""}">${B.esc(a.category)}</span><h1 style="font-size:clamp(26px,4vw,40px);margin:12px 0">${B.esc(a.title)}</h1><div class="art-meta mb"><span>${B.date(a.date)}</span><span>${B.esc(a.author || "")}</span></div>${a.cover ? `<div class="article-cover"><img src="${B.esc(a.cover)}" alt="${B.esc(a.title)}"></div>` : ""}<div class="prose" id="artBody"></div>
        <div class="flex gap wrap mt"><button class="btn btn-light btn-sm" id="share">${B.icon("send")} اشتراک‌گذاری</button><a class="btn btn-light btn-sm" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(B.abs(url))}&text=${encodeURIComponent(a.title)}">تلگرام</a></div></article>
        ${rel.length ? `<h2 class="mt" style="margin-top:50px;margin-bottom:20px">مطالب مرتبط</h2><div class="art-grid">${rel.map(B.artCard).join("")}</div>` : ""}</div>`;
      B.$("#artBody").innerHTML = sanitize(a.content || "");
      B.$("#share").onclick = async () => { try { if (navigator.share) await navigator.share({ title: a.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); B.toast("پیوند کپی شد", "ok"); } } catch (e) { /* cancelled */ } };
      return;
    }
    B.seo({ title: "اعلانات و مجله", desc: "اطلاعیه‌ها، رویدادها، مصاحبه‌ها و اخبار دنیای نشر", jsonld: [B.crumbsLd([["/news.html", "اعلانات و مجله"]])] });
    let cat = B.qs().get("cat") || ""; const cats = [...new Set(arts.map((a) => a.category).filter(Boolean))];
    const draw = () => {
      const l = arts.filter((a) => !cat || a.category === cat); const feats = l.filter((a) => a.featured); const f = feats[0] || l[0]; const rest = l.filter((a) => a !== f);
      app.innerHTML = head("اعلانات و مجله", "اطلاعیه‌ها، رویدادها، مصاحبه‌ها و اخبار دنیای نشر", "اعلانات") + `<div class="container section"><div class="filters-bar"><button class="chip ${cat ? "" : "on"}" data-cat="">همه</button>${cats.map((c) => `<button class="chip ${cat === c ? "on" : ""}" data-cat="${B.esc(c)}">${B.esc(c)}</button>`).join("")}</div>
      ${f ? `<div class="news-hero mb"><a class="news-feat" href="${B.url.article(f)}">${f.cover ? `<img src="${B.esc(f.cover)}" alt="">` : ""}<div><span class="tag-pill hot">${B.esc(f.category)}</span><h2>${B.esc(f.title)}</h2><p>${B.esc(f.excerpt || "")}</p></div></a><div class="news-side">${rest.slice(0, 3).map((a) => `<a class="news-mini" href="${B.url.article(a)}"><div class="th">${a.cover ? `<img src="${B.esc(a.cover)}" alt="" loading="lazy">` : ""}</div><div><span class="tag-pill">${B.esc(a.category)}</span><strong>${B.esc(a.title)}</strong><small class="text-muted">${B.date(a.date)}</small></div></a>`).join("")}</div></div>` : empty("news", "هنوز مطلبی منتشر نشده است")}
      ${rest.length > 3 ? `<div class="art-grid">${rest.slice(3).map(B.artCard).join("")}</div>` : ""}</div>`;
    };
    draw(); app.addEventListener("click", (e) => { const c = e.target.closest("[data-cat]"); if (c) { cat = c.dataset.cat; draw(); } });
  };
  // minimal HTML sanitizer for admin-authored article HTML (defence in depth)
  function sanitize(html) {
    const t = document.createElement("template"); t.innerHTML = html;
    t.content.querySelectorAll("script,iframe,object,embed,style,link,meta,form").forEach((n) => n.remove());
    t.content.querySelectorAll("*").forEach((n) => Array.from(n.attributes).forEach((a) => { if (/^on/i.test(a.name) || (/^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name); }));
    return t.innerHTML;
  }

  /* ===================== STATIC PAGES ===================== */
  B.pages.page = async (app) => {
    const key = B.qs().get("p") || "about"; const s = S().settings;
    const T = {
      about: ["درباره ما", s.about ? `<p>${B.esc(s.about)}</p>` : `<p>${B.esc(s.siteName)} فروشگاه آنلاین کتاب و مرجع اعلانات نشر است. هدف ما ساده‌تر کردن دسترسی به کتاب‌های خوب، با تجربه خریدی روان و مطمئن است.</p><h2>ارزش‌های ما</h2><ul><li>اصالت و کیفیت کتاب‌ها</li><li>قیمت شفاف و منصفانه</li><li>ارسال سریع و بسته‌بندی ایمن</li><li>پشتیبانی پاسخگو</li></ul>`],
      shipping: ["ارسال و بازگشت", `<h2>ارسال</h2><p>سفارش‌ها پس از تأیید پرداخت، در ۱ تا ۲ روز کاری پردازش می‌شوند. روش‌های ارسال و هزینه آن‌ها در مرحله پرداخت نمایش داده می‌شود. برای سفارش‌های بالای ${B.moneyText(s.freeShippingThreshold)} ارسال پست رایگان است.</p><h2>مرجوعی</h2><p>در صورت آسیب‌دیدگی، مغایرت یا ایراد چاپی، تا ۷ روز پس از تحویل با پشتیبانی تماس بگیرید. کتاب باید دست‌نخورده و در بسته‌بندی اصلی باشد. هزینه بازگشت وجه پس از بررسی به همان روش پرداخت برگردانده می‌شود.</p><h2>لغو سفارش</h2><p>تا قبل از ارسال می‌توانید لغو سفارش را از طریق پشتیبانی درخواست دهید.</p>`],
      privacy: ["حریم خصوصی", `<p>${B.esc(s.siteName)} به حریم خصوصی شما احترام می‌گذارد. اطلاعاتی مانند نام، شماره تماس و آدرس تنها برای پردازش و ارسال سفارش استفاده می‌شود و بدون رضایت شما در اختیار شخص ثالث قرار نمی‌گیرد، مگر برای ارسال کالا یا الزامات قانونی.</p><h2>اطلاعات پرداخت</h2><p>اطلاعات کارت بانکی (شماره کارت، CVV2 و رمز) هرگز در سایت ما دریافت یا ذخیره نمی‌شود؛ پرداخت در درگاه امن بانکی انجام می‌شود.</p><h2>کوکی و حافظه مرورگر</h2><p>سبد خرید، علاقه‌مندی‌ها و تاریخچه جستجو روی مرورگر شما ذخیره می‌شود و می‌توانید هر زمان آن را پاک کنید.</p>`],
      terms: ["قوانین و مقررات", `<h2>۱. ثبت سفارش</h2><p>ثبت سفارش به معنی پذیرش قوانین این فروشگاه است. قیمت‌ها به تومان و موجودی‌ها لحظه‌ای هستند.</p><h2>۲. پرداخت</h2><p>سفارش تنها پس از تأیید پرداخت از سوی درگاه بانکی نهایی می‌شود.</p><h2>۳. مسئولیت‌ها</h2><p>فروشگاه در قبال اطلاعات نادرست واردشده توسط مشتری (مانند آدرس) مسئولیتی ندارد.</p><h2>۴. تغییر قوانین</h2><p>فروشگاه می‌تواند قوانین را به‌روزرسانی کند؛ نسخه جاری همیشه در همین صفحه است.</p>`],
    };
    if (key === "faq") {
      B.seo({ title: "سؤالات متداول", jsonld: [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: (s.faq || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] });
      app.innerHTML = head("سؤالات متداول", "پاسخ پرسش‌های رایج مشتریان") + `<div class="container section" style="max-width:820px">${(s.faq || []).map((f) => `<div class="faq-item"><button class="faq-q">${B.esc(f.q)}${B.icon("down")}</button><div class="faq-a">${B.esc(f.a)}</div></div>`).join("") || empty("info", "هنوز سؤالی ثبت نشده")}</div>`;
      app.addEventListener("click", (e) => { const q = e.target.closest(".faq-q"); if (q) q.parentElement.classList.toggle("open"); }); return;
    }
    if (key === "contact") {
      B.seo({ title: "تماس با ما" });
      app.innerHTML = head("تماس با ما", "پیام خود را برای ما بفرستید.") + `<div class="container section"><div class="cols-2"><form class="panel" id="cf"><div class="form-grid"><div class="field"><label>نام</label><input class="input" name="name" required></div><div class="field"><label>موبایل یا ایمیل</label><input class="input" name="contact" dir="ltr" required></div><div class="field full"><label>موضوع</label><input class="input" name="subject" required></div><div class="field full"><label>پیام</label><textarea class="textarea" name="message" required minlength="10"></textarea></div></div><button class="btn btn-primary mt" type="submit">ارسال پیام</button></form>
      <div class="cards-3" style="grid-template-columns:1fr">${s.phone ? `<div class="info-card">${B.icon("phone")}<h4>تلفن</h4><p class="ltr">${B.fa(s.phone)}</p></div>` : ""}${s.email ? `<div class="info-card">${B.icon("mail")}<h4>ایمیل</h4><p>${B.esc(s.email)}</p></div>` : ""}${s.address ? `<div class="info-card">${B.icon("pin")}<h4>نشانی</h4><p>${B.esc(s.address)}</p></div>` : ""}<div class="info-card">${B.icon("clock")}<h4>ساعات پاسخگویی</h4><p>${B.esc(s.workHours || "")}</p></div></div></div></div>`;
      B.$("#cf").onsubmit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target).entries()); const r = await B.api("/api/contact.php", f); if (r.ok) { B.toast("پیام شما ارسال شد", "ok"); e.target.reset(); } else B.toast(r.error || "خطا در ارسال", "err"); }; return;
    }
    const t = T[key] || T.about; B.seo({ title: t[0], jsonld: [B.crumbsLd([["/page.html?p=" + key, t[0]]])] });
    app.innerHTML = head(t[0], "") + `<div class="container section"><div class="panel prose" style="max-width:860px;margin:auto">${t[1]}</div></div>`;
  };

  B.pages.notfound = async (app) => {
    B.seo({ title: "صفحه پیدا نشد" });
    app.innerHTML = `<div class="container section">${empty("search", "صفحه‌ای که دنبالش بودید پیدا نشد", "ممکن است نشانی تغییر کرده یا حذف شده باشد.", '<a class="btn btn-primary" href="/">بازگشت به صفحه اصلی</a>')}</div>`;
  };

  /* ---------- Boot the current page ---------- */
  const pg = document.body.dataset.page; if (B.pages[pg]) B.boot(B.pages[pg]);
})();
