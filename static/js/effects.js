// ========================================================================================================
// EnlaceVRC docs — visual effects layer
// ========================================================================================================
// Optional polish layered on top of the static page: smooth scrolling (Lenis), scroll-reveal animations
// (AOS), an animated film-grain canvas, and an image lightbox (GLightbox). Everything here is presentation
// only — the page is fully usable if these libraries fail to load or if the user prefers reduced motion.
// ========================================================================================================

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------------------------------------------
  // Scroll-reveal (AOS) — applied via JS so the HTML stays clean of presentation attributes
  // ------------------------------------------------------------------------------------------------------

  if (!reduceMotion && window.AOS) {
    // Reveal each section and its meaningful blocks, with a light stagger inside groups.
    const tag = (selector, opts) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.setAttribute("data-aos", opts.effect || "fade-up");
        el.setAttribute("data-aos-delay", String((opts.base || 0) + i * (opts.step || 0)));
      });
    };

    tag(".section > .section__eyebrow", { effect: "fade-up" });
    tag(".section > h2, .section > .hero__top", { effect: "fade-up", base: 40 });
    tag(".section > .lead", { effect: "fade-up", base: 80 });
    // Staggered children inside grids and lists.
    document.querySelectorAll(".grid-2").forEach((grid) => {
      grid.querySelectorAll(".feature").forEach((el, i) => {
        el.setAttribute("data-aos", "fade-up");
        el.setAttribute("data-aos-delay", String(i * 60));
      });
    });
    document.querySelectorAll(".steps > li").forEach((el, i) => {
      el.setAttribute("data-aos", "fade-up");
      el.setAttribute("data-aos-delay", String(i * 70));
    });
    tag(".cmd", { effect: "fade-up", step: 0 });
    tag(".note", { effect: "fade-up" });
    tag(".table-wrap", { effect: "fade-up" });

    window.AOS.init({
      once: true,
      duration: 600,
      easing: "ease-out-cubic",
      offset: 64,
    });
  }

  // ------------------------------------------------------------------------------------------------------
  // Smooth scrolling (Lenis)
  // ------------------------------------------------------------------------------------------------------

  // Exposed so app.js can route sidebar anchor clicks through Lenis instead of native jumps.
  window.__lenis = null;

  if (!reduceMotion && window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Keep AOS in sync with Lenis-driven scrolling.
    if (window.AOS) lenis.on("scroll", () => window.AOS.refresh());
  }

  // ------------------------------------------------------------------------------------------------------
  // Image lightbox (GLightbox)
  // ------------------------------------------------------------------------------------------------------

  if (window.GLightbox) {
    // Mark the larger bot icons as zoomable (skip the tiny sidebar SVGs — there are none as <img>).
    document.querySelectorAll(".hero__icon, .h-icon img, .note img").forEach((img) => {
      const link = document.createElement("a");
      link.href = img.getAttribute("src");
      link.className = "glightbox";
      link.setAttribute("aria-label", "Ver imagen ampliada");
      img.replaceWith(link);
      link.appendChild(img);
    });
    window.GLightbox({ selector: ".glightbox", loop: true, touchNavigation: true });
  }

  // ------------------------------------------------------------------------------------------------------
  // Animated film grain — a faint moving noise overlay, reinforcing the cyanotype texture
  // ------------------------------------------------------------------------------------------------------

  const canvas = document.getElementById("grain");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d", { alpha: true });
    // Small offscreen noise tile, re-randomized and tiled each frame at low opacity.
    const TILE = 128;
    const tile = document.createElement("canvas");
    tile.width = tile.height = TILE;
    const tctx = tile.getContext("2d");

    let raf = 0;
    let lastDraw = 0;
    const FPS = 12; // Slow, filmic — not a fast shimmer.

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function makeNoise() {
      const img = tctx.createImageData(TILE, TILE);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      tctx.putImageData(img, 0, 0);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - lastDraw < 1000 / FPS) return;
      lastDraw = now;
      makeNoise();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pattern = ctx.createPattern(tile, "repeat");
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = requestAnimationFrame(frame);

    // Pause the grain when the tab is hidden to save CPU/battery.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(frame);
      }
    });
  }
})();
