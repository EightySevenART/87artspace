/* Artspace87 – logo scroll motion + reveal on scroll */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var logo = document.querySelector(".logo");
  var dock = document.querySelector(".logo-dock");
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Logo: big in the middle -> small, docked top centre ---------- */
  if (logo && dock) {
    var geo = null;
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
