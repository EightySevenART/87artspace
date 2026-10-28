/* 87artspace – logo scroll motion + reveal on scroll */
(function () {
  var root = document.documentElement;

  /* ---------- Preview-only features: visible under /preview/, hidden on the live site ---------- */
  if (/^\/preview(\/|$)/.test(location.pathname)) {
    root.classList.add("is-preview");
    document.querySelectorAll("[data-preview-only]").forEach(function (el) { el.hidden = false; });
    document.querySelectorAll("[data-live-only]").forEach(function (el) { el.hidden = true; });
  }
  root.classList.add("js");

  var logo = document.querySelector(".logo");
  var dock = document.querySelector(".logo-dock");
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Logo: big in the middle -> small, docked top centre ---------- */
  if (logo && dock) {
    var geo = null;
    var heroWord = document.querySelector(".hero-word");
    var target = hero ? 0 : 1;
    var current = target;
    var ticking = false;

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function measure() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var im = logo.querySelector("img");
      var ratio = (im && im.naturalWidth && im.naturalHeight) ? im.naturalWidth / im.naturalHeight : 1;
      /* start size: big, but always fits the screen */
      var w = Math.min(vw * (vw < 760 ? 0.72 : 0.6), vh * 0.62 * ratio, 620);
      logo.style.left = "0px";
      logo.style.top = "0px";
      logo.style.width = w + "px";
      var h = logo.offsetHeight || w / 5;
      var d = dock.getBoundingClientRect();
      var s = d.width / w;
      geo = {
        sx: (vw - w) / 2,
        sy: (vh - h) / 2,
        ex: d.left,
        ey: d.top + d.height / 2 - (h * s) / 2,
        es: s
      };
    }

    function readTarget() {
      if (!hero) return 1;
      return clamp(window.scrollY / (hero.offsetHeight * 0.75), 0, 1);
    }

    function paint() {
      var t = ease(current);
      var x = geo.sx + (geo.ex - geo.sx) * t;
      var y = geo.sy + (geo.ey - geo.sy) * t;
      var s = 1 + (geo.es - 1) * t;
      logo.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + s + ")";
      var chrome = clamp((current - 0.55) / 0.45, 0, 1);
      header.style.setProperty("--chrome", chrome);
      header.classList.toggle("is-on", chrome > 0.9);
      if (hero) hero.style.setProperty("--p", current);
      if (heroWord) {
        var wo = clamp((current - 0.5) * 4, 0, 1); /* fully bright at 75 % of the logo motion */
        heroWord.style.opacity = wo;
        heroWord.style.visibility = wo > 0.01 ? "visible" : "hidden";
        heroWord.style.transform = "translateY(" + ((1 - wo) * 32) + "px)";
      }
    }

    function frame() {
      var diff = target - current;
      if (reduce || Math.abs(diff) < 0.0005) {
        current = target;
      } else {
        current += diff * 0.12; /* inertia: the logo glides after the scroll */
      }
      paint();
      if (current !== target) {
        window.requestAnimationFrame(frame);
      } else {
        ticking = false;
      }
    }

    function kick() {
      target = readTarget();
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(frame);
      }
    }

    function init() {
      measure();
      target = current = readTarget();
      paint();
      logo.classList.add("is-ready");
    }

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", function () { measure(); paint(); });

    var img = logo.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", init);
    } else {
      init();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { measure(); paint(); });
    }
  }

  /* ---------- Imprint / Privacy: open when linked to (#imprint, #privacy) ---------- */
  function openByHash() {
    var d = location.hash && document.getElementById(location.hash.slice(1));
    if (d && d.tagName === "DETAILS") { d.open = true; d.scrollIntoView({ block: "start" }); }
  }
  openByHash();
  window.addEventListener("hashchange", openByHash);

  /* ---------- Photo carousel ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (c) {
    var track = c.querySelector(".carousel-track");
    var btns = c.querySelectorAll(".carousel-btn");
    function step() {
      var s = track.querySelector(".slide");
      return s ? s.getBoundingClientRect().width + 16 : track.clientWidth;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      btns[0].disabled = track.scrollLeft <= 2;
      btns[1].disabled = track.scrollLeft >= max;
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        track.scrollBy({ left: step() * parseInt(b.getAttribute("data-dir"), 10), behavior: reduce ? "auto" : "smooth" });
      });
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); btns[1].click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); btns[0].click(); }
    });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Lightbox (exhibition pages) ---------- */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var opens = [].slice.call(document.querySelectorAll(".lb-open"));
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + opens.length) % opens.length;
      var src = opens[idx].getAttribute("data-src");
      var alt = opens[idx].querySelector("img").getAttribute("alt") || "";
      lbImg.src = src; lbImg.alt = alt;
    }
    function open(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb-close").focus(); }
    function close() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    opens.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* ---------- Read more (archive pages) ---------- */
  document.querySelectorAll(".readmore-btn").forEach(function (btn) {
    var box = document.getElementById(btn.getAttribute("aria-controls"));
    if (!box) return;
    btn.addEventListener("click", function () {
      var open = !box.classList.contains("is-open");
      box.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open);
      btn.querySelector("span").textContent = open ? "Read less" : "Read more";
      if (!open) {
        var top = box.closest("section").getBoundingClientRect().top;
        if (top < 0) box.closest("section").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      }
    });
  });

  /* ---------- Archive filter (All / Exhibitions / Events) ---------- */
  var filter = document.querySelector(".filter");
  if (filter) {
    var cards = [].slice.call(document.querySelectorAll(".card[data-type]"));
    var empty = document.querySelector(".filter-empty");
    function applyHash() {
      var h = location.hash.replace("#", "");
      var hb = filter.querySelector('button[data-filter="' + (h === "events" ? "event" : h === "exhibitions" ? "exhibition" : "") + '"]');
      if (hb) hb.click();
    }
    filter.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      filter.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      cards.forEach(function (c) {
        c.hidden = f !== "all" && c.getAttribute("data-type") !== f;
        c.classList.add("is-in");
      });
      document.querySelectorAll(".year").forEach(function (y) {
        y.hidden = !y.querySelector(".card[data-type]:not([hidden])");
      });
      if (empty) {
        empty.textContent = "No " + (f === "event" ? "events" : "exhibitions") + " yet. Stay tuned.";
        empty.hidden = cards.some(function (c) { return !c.hidden; });
      }
    });
    applyHash();
    window.addEventListener("hashchange", applyHash);
  }

  /* ---------- About: space photos drift left while scrolling (title stays) ---------- */
  var hs = document.querySelector(".hscroll");
  if (hs && !reduce) {
    var hsSticky = hs.querySelector(".hscroll-sticky");
    var hsStage = hs.querySelector(".hscroll-stage");
    var hsTrack = hs.querySelector(".hscroll-track");
    var hsIntro = hs.querySelector(".hscroll-intro");
    var hsItems = [].slice.call(hs.querySelectorAll(".hs-item"));
    var hsGeo = null, hsCur = 0, hsTarget = 0, hsTick = false;
    hs.classList.add("is-driven");
    function hsMeasure() {
      var vw = document.documentElement.clientWidth, vh = window.innerHeight;
      var head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 84;
      var top = hs.getBoundingClientRect().top + window.scrollY; /* pin right where it sits: no jump */
      top = Math.min(top, head + 72);
      var introH = hsIntro.offsetHeight + parseFloat(getComputedStyle(hsIntro).marginBottom);
      var stageH = Math.max(260, vh - top - introH - 24);       /* photo area fills the rest of the screen */
      hs.style.setProperty("--hs-top", top + "px");
      hs.style.setProperty("--stage-h", stageH + "px");
      hsTrack.style.transform = "none";
      var mob = vw < 760;
      hsItems.forEach(function (it) {
        var cs = getComputedStyle(it);
        var hp = parseFloat(cs.getPropertyValue("--h")) / 100 * (mob ? 0.85 : 1);
        var arS = cs.getPropertyValue("--ar").split("/");
        var ar = parseFloat(arS[0]) / parseFloat(arS[1] || 1);
        var fh = stageH * hp, fw = fh * ar;
        var fr = it.querySelector(".hs-frame");
        fr.style.width = fw + "px"; fr.style.height = fh + "px";
        it.style.width = fw + "px";
      });
      var trackW = hsTrack.scrollWidth;
      var gut = parseFloat(getComputedStyle(hsIntro).paddingLeft) || 24;
      var start = vw * (vw < 760 ? 0.08 : 0.2);                  /* first photo starts right of centre */
      var end = vw - gut - trackW;                                 /* last photo stops at the right edge */
      var travel = Math.max(0, start - end);
      var span = travel * 0.6;                                     /* scroll distance while pinned (less = faster) */
      hs.style.height = (hsSticky.offsetHeight + span) + "px";
      hsGeo = { top: top, start: start, travel: travel, span: span, vw: vw,
                introOut: introH + 40, stageUp: introH };
      /* the photos move up into the title's place, so the following text can
         start right below them: no empty black band when scrolling back up */
      hs.style.marginBottom = (-introH) + "px";
    }
    function hsRead() {
      var r = hs.getBoundingClientRect();
      if (!hsGeo.span) return 0;
      var t = Math.min(1, Math.max(0, (hsGeo.top - r.top) / hsGeo.span));
      return 0.5 - Math.cos(Math.PI * t) / 2; /* soft start, soft landing */
    }
    function hsPaint() {
      var x = hsGeo.start - hsCur * hsGeo.travel;
      hsTrack.style.transform = "translate3d(" + x + "px,0,0)";
      /* the title is slowly pushed up and out while the photos drift */
      var up = Math.min(1, hsCur / 0.85);
      hsIntro.style.transform = "translate3d(0," + (-up * hsGeo.introOut) + "px,0)";
      hsIntro.style.opacity = 1 - Math.max(0, (up - 0.55) / 0.45);
      hsStage.style.transform = "translate3d(0," + (-up * hsGeo.stageUp) + "px,0)";
      for (var i = 0; i < hsItems.length; i++) {
        var it = hsItems[i];
        var sp = parseFloat(it.getAttribute("data-speed")) || 1;
        it.style.transform = "translate3d(" + ((1 - sp) * hsCur * hsGeo.travel * 0.15) + "px,0,0)"; /* depth */
        var r = it.getBoundingClientRect();
        var rel = ((r.left + r.width / 2) - hsGeo.vw / 2) / hsGeo.vw; /* -1 .. 1 across the screen */
        var img = it.querySelector("img");
        if (img) img.style.transform = "translate3d(" + (rel * -5) + "%,0,0)"; /* photo glides inside its frame */
      }
    }
    function hsFrame() {
      var d = hsTarget - hsCur;
      if (Math.abs(d) < 0.0005) { hsCur = hsTarget; } else { hsCur += d * 0.08; }
      hsPaint();
      if (hsCur !== hsTarget) { window.requestAnimationFrame(hsFrame); } else { hsTick = false; }
    }
    function hsKick() {
      hsTarget = hsRead();
      if (!hsTick) { hsTick = true; window.requestAnimationFrame(hsFrame); }
    }
    function hsInit() { hsMeasure(); hsCur = hsTarget = hsRead(); hsPaint(); }
    hsInit();
    window.addEventListener("scroll", hsKick, { passive: true });
    window.addEventListener("resize", hsInit);
    window.addEventListener("load", hsInit);
    /* the strip changes the page height, so jump to #book etc. again once it is measured */
    function toHash() {
      var t = location.hash && document.getElementById(location.hash.slice(1));
      if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0));
    }
    if (location.hash) {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      toHash();
      window.addEventListener("load", function () { hsInit(); toHash(); hsCur = hsTarget = hsRead(); hsPaint(); });
    }
  }

  /* ---------- Archive: remember position, "Back to archive" returns there ---------- */
  var KEY = "a87-archive";
  function store(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  if (document.querySelector(".filter")) {
    /* on the archive: save scroll + filter when opening an entry */
    document.addEventListener("click", function (e) {
      var a = e.target.closest(".card-link");
      if (!a) return;
      var on = document.querySelector(".filter button[aria-pressed='true']");
      store({ y: window.scrollY, f: on ? on.getAttribute("data-filter") : "all", back: false });
    });
    var saved = load();
    if (saved && saved.back) {
      store(null);
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      var fb = document.querySelector('.filter button[data-filter="' + saved.f + '"]');
      if (fb && saved.f !== "all") fb.click();
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      window.requestAnimationFrame(function () { window.scrollTo(0, saved.y); });
    }
    window.addEventListener("pageshow", function (e) { if (e.persisted) store(null); });
  }
  document.querySelectorAll("[data-back]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var st = load();
      if (!st) return; /* came from elsewhere: just open the archive at the top */
      e.preventDefault();
      st.back = true; store(st);
      var ref = document.referrer || "";
      if (/archive\.html/.test(ref) && history.length > 1) { history.back(); } else { location.href = "archive.html"; }
    });
  });

  /* ---------- Newsletter sign-up (Brevo form endpoint in data-endpoint) ---------- */
  document.querySelectorAll(".nl-form").forEach(function (form) {
    var msg = form.parentNode.querySelector(".nl-msg");
    var note = form.parentNode.querySelector(".nl-note");
    function say(t) { msg.textContent = t; msg.hidden = false; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      if (!email.value || !email.checkValidity()) { say("Please enter a valid email address."); email.focus(); return; }
      var url = form.getAttribute("data-endpoint");
      if (!url) { say("Sign-up opens soon. Until then, write to us at info@87artspace.com."); return; }
      var btn = form.querySelector("button"); btn.disabled = true;
      fetch(url, { method: "POST", mode: "no-cors", body: new FormData(form) })
        .then(function () {
          form.hidden = true; if (note) note.hidden = true;
          var steps = form.parentNode.querySelector(".nl-steps"); if (steps) steps.hidden = true;
          var done = form.parentNode.querySelector(".nl-done");
          if (done) { done.hidden = false; } else { say("Almost done: please confirm your sign-up in the email we just sent you."); }
        })
        .catch(function () { btn.disabled = false; say("Something went wrong. Please try again."); });
    });
  });

  /* ---------- Booking form: unfolds on "Book the space" ---------- */
  var bkBtn = document.querySelector(".bk-toggle");
  var bkPanel = document.getElementById("bk-panel");
  if (bkBtn && bkPanel) {
    var setBk = function (open, scroll) {
      bkPanel.classList.toggle("is-open", open);
      bkBtn.setAttribute("aria-expanded", open);
      bkBtn.querySelector("span").textContent = open ? "Close" : "Book the space";
      if (open && scroll) setTimeout(function () { bkPanel.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); }, 120);
    };
    bkBtn.addEventListener("click", function () { setBk(!bkPanel.classList.contains("is-open"), true); });
    if (location.hash === "#book") setBk(true, false); /* coming from "Book the space" on the home page */
  }

  /* ---------- Booking form: dates start with the current year already filled in ---------- */
  var dFrom = document.querySelector('.bk-form input[name="Date from"]');
  var dTo = document.querySelector('.bk-form input[name="Date to"]');
  if (dFrom) {
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var now = new Date();
    var today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    dFrom.min = today;
    if (dTo) dTo.min = today;
    /* when an empty date field is opened, start from today (from) or from the start date (to),
       so only day and month need changing; everything stays editable */
    var prefill = function (el, val) { if (!el.value) { el.value = val; } };
    ["focus", "pointerdown"].forEach(function (ev) {
      dFrom.addEventListener(ev, function () { prefill(dFrom, today); });
      if (dTo) dTo.addEventListener(ev, function () { prefill(dTo, dFrom.value || today); });
    });
    dFrom.addEventListener("change", function () {
      if (!dTo) return;
      dTo.min = dFrom.value || today;
      if (dTo.value && dFrom.value && dTo.value < dFrom.value) dTo.value = dFrom.value;
    });
  }

  /* ---------- Booking form: guests "not plannable" ---------- */
  var gOpen = document.getElementById("bk-guests-open"), gNum = document.getElementById("bk-guests");
  if (gOpen && gNum) {
    var syncG = function () { gNum.disabled = gOpen.checked; if (gOpen.checked) gNum.value = ""; };
    gOpen.addEventListener("change", syncG);
    document.querySelectorAll('.bk-tile input').forEach(function (r) {
      r.addEventListener("change", function () {
        /* exhibitions and pop-ups: pre-tick, as visitor numbers can't be planned */
        if (/Exhibition|Pop-up/.test(r.value) && !gNum.value) gOpen.checked = true;
        else if (!/Exhibition|Pop-up/.test(r.value)) gOpen.checked = false;
        syncG();
      });
    });
  }

  /* ---------- Booking request form (Formcarry endpoint in data-endpoint) ---------- */
  document.querySelectorAll(".bk-form").forEach(function (form) {
    form.addEventListener("input", function (e) { var w = e.target.closest(".is-invalid"); if (w) w.classList.remove("is-invalid"); });
    form.addEventListener("change", function (e) { var w = e.target.closest(".is-invalid"); if (w) w.classList.remove("is-invalid"); });
    var msg = form.querySelector(".bk-msg");
    var done = form.parentNode.querySelector(".bk-done");
    function say(t) { msg.textContent = t; msg.hidden = false; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.querySelector('input[name="Type"]:checked')) { say("Please choose what you are planning."); form.querySelector(".bk-tiles").scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      form.querySelectorAll(".is-invalid").forEach(function (x) { x.classList.remove("is-invalid"); });
      var bads = [].slice.call(form.querySelectorAll("input:invalid, textarea:invalid"));
      if (bads.length) {
        var names = [];
        bads.forEach(function (b) {
          var wrap = b.closest(".bk-field, .bk-consent");
          if (wrap) wrap.classList.add("is-invalid");
          var lab = b.type === "checkbox" ? "privacy note" : ((wrap && wrap.querySelector("span")) ? wrap.querySelector("span").textContent.replace("*", "").trim() : b.name);
          if (names.indexOf(lab) < 0) names.push(lab);
        });
        say("Please complete: " + names.join(", ") + ".");
        bads[0].focus();
        return;
      }
      var url = form.getAttribute("data-endpoint");
      if (!url) { say("Preview: the form is not connected yet. On the live site this request would now be sent to us."); return; }
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true; msg.hidden = true;
      fetch(url, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.hidden = true; done.hidden = false; done.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); })
        .catch(function () { btn.disabled = false; say("Something went wrong. Please try again or write to us at info@87artspace.com."); });
    });
  });

  /* ---------- Email links: also copy the address (fallback when no mail app is set up, e.g. Windows) ---------- */
  var toast = null, toastT = null;
  function showToast(t) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast"; toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = t; toast.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("is-on"); }, 3200);
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, no) {
      var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? ok() : no(); } catch (e) { no(e); }
      document.body.removeChild(ta);
    });
  }
  /* Phones: mailto opens the mail app reliably, so open it and copy as a bonus.
     Desktop: many computers (esp. Windows) have no mail app set up, so offer a small chooser instead. */
  var touch = window.matchMedia("(pointer: coarse)").matches;
  var sheet = null;
  function closeSheet() { if (sheet) { sheet.classList.remove("is-on"); document.removeEventListener("keydown", escSheet); } }
  function escSheet(e) { if (e.key === "Escape") closeSheet(); }
  function openSheet(addr, subject, mailto, opener) {
    var su = subject ? encodeURIComponent(subject) : "";
    var gmail = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(addr) + (su ? "&su=" + su : "");
    var outlook = "https://outlook.office.com/mail/deeplink/compose?to=" + encodeURIComponent(addr) + (su ? "&subject=" + su : "");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.className = "mail-sheet";
      sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "Write us an email");
      sheet.innerHTML =
        '<div class="mail-card">' +
          '<button type="button" class="mail-x" aria-label="Close"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>' +
          '<p class="label">Write us</p>' +
          '<p class="mail-addr"></p>' +
          '<div class="mail-actions">' +
            '<button type="button" class="btn btn--solid mail-copy">Copy address</button>' +
            '<a class="btn mail-gmail" target="_blank" rel="noopener">Open in Gmail</a>' +
            '<a class="btn mail-outlook" target="_blank" rel="noopener">Open in Outlook</a>' +
            '<a class="btn mail-app">Open mail app</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(sheet);
      sheet.addEventListener("click", function (e) { if (e.target === sheet || e.target.closest(".mail-x")) closeSheet(); });
      sheet.querySelectorAll(".mail-gmail, .mail-outlook, .mail-app").forEach(function (l) { l.addEventListener("click", function () { setTimeout(closeSheet, 150); }); });
    }
    sheet.querySelector(".mail-addr").textContent = addr;
    sheet.querySelector(".mail-gmail").href = gmail;
    sheet.querySelector(".mail-outlook").href = outlook;
    sheet.querySelector(".mail-app").href = mailto;
    var cp = sheet.querySelector(".mail-copy");
    cp.textContent = "Copy address";
    cp.onclick = function () { copyText(addr).then(function () { cp.textContent = "Copied ✓"; showToast("Email address copied: " + addr); }, function () {}); };
    sheet.classList.add("is-on");
    document.addEventListener("keydown", escSheet);
    setTimeout(function () { cp.focus(); }, 50);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="mailto:"]');
    if (!a || a.classList.contains("mail-app")) return;
    var href = a.getAttribute("href");
    var addr = decodeURIComponent(href.slice(7).split("?")[0]);
    var m = href.match(/[?&]subject=([^&]*)/);
    var subject = m ? decodeURIComponent(m[1]) : "";
    if (touch) {
      copyText(addr).then(function () { showToast("Email address copied: " + addr); }, function () {});
      return; /* phone: let the mail app open */
    }
    e.preventDefault();
    openSheet(addr, subject, href, a);
  });

  /* ---------- Reveal content as it scrolls into view ---------- */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
