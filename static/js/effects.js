// ========================================================================================================
// EnlaceVRC docs — visual effects layer
// ========================================================================================================
// Optional polish layered on top of the static page: smooth scrolling (Lenis), scroll-reveal animations
// (AOS), an animated film-grain canvas, and an image lightbox (GLightbox). Everything here is presentation
// only — the page is fully usable if these libraries fail to load, if the user prefers reduced motion, or
// if they turn the "Effects" switch off in the top bar.
//
// The lightbox always runs (it's an affordance, not motion). Motion effects (AOS, Lenis, grain) only run
// when effects are enabled AND reduced-motion is not requested. Turning the switch back ON reloads the page,
// which is the simplest reliable way to re-initialize the libraries from a clean state.
// ========================================================================================================

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // i18n.js sets this before us; default to enabled if it didn't run.
  const effectsOn = window.__effectsEnabled !== false;
  const motionAllowed = effectsOn && !reduceMotion;

  let grainRaf = 0;

  // ------------------------------------------------------------------------------------------------------
  // Image lightbox (GLightbox) — always available, regardless of motion preference
  // ------------------------------------------------------------------------------------------------------

  if (window.GLightbox) {
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
  // Scroll-reveal (AOS) — applied via JS so the HTML stays clean of presentation attributes
  // ------------------------------------------------------------------------------------------------------

  if (motionAllowed && window.AOS) {
    const tag = (selector, opts) => {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.setAttribute("data-aos", opts.effect || "fade-up");
        el.setAttribute("data-aos-delay", String((opts.base || 0) + i * (opts.step || 0)));
      });
    };

    tag(".section > .section__eyebrow", { effect: "fade-up" });
    tag(".section > h2, .section > .hero__top", { effect: "fade-up", base: 40 });
    tag(".section > .lead", { effect: "fade-up", base: 80 });
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
    tag(".cmd", { effect: "fade-up" });
    tag(".note", { effect: "fade-up" });
    tag(".table-wrap", { effect: "fade-up" });

    window.AOS.init({ once: true, duration: 600, easing: "ease-out-cubic", offset: 64 });
    // Re-measure after a language switch reflows text blocks.
    window.addEventListener("i18n:changed", () => window.AOS.refresh());
  }

  // ------------------------------------------------------------------------------------------------------
  // Smooth scrolling (Lenis)
  // ------------------------------------------------------------------------------------------------------

  // Exposed so app.js can route in-page anchor clicks through Lenis instead of native jumps.
  window.__lenis = null;

  if (motionAllowed && window.Lenis) {
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
    if (window.AOS) lenis.on("scroll", () => window.AOS.refresh());
  }

  // ------------------------------------------------------------------------------------------------------
  // Animated film grain — faint moving noise overlay, reinforcing the cyanotype texture
  // ------------------------------------------------------------------------------------------------------

  const canvas = document.getElementById("grain");
  if (canvas && motionAllowed) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const TILE = 128;
    const tile = document.createElement("canvas");
    tile.width = tile.height = TILE;
    const tctx = tile.getContext("2d");

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
      grainRaf = requestAnimationFrame(frame);
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
    grainRaf = requestAnimationFrame(frame);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(grainRaf);
      } else {
        grainRaf = requestAnimationFrame(frame);
      }
    });
  }

  // ------------------------------------------------------------------------------------------------------
  // React to the effects switch being toggled at runtime
  // ------------------------------------------------------------------------------------------------------

  window.addEventListener("effects:toggled", (event) => {
    const enabled = event.detail && event.detail.enabled;
    if (enabled) {
      // Turning effects back on: reload to re-initialize everything cleanly.
      location.reload();
      return;
    }
    // Turning effects off: stop motion immediately without a reload.
    if (window.__lenis) {
      window.__lenis.destroy();
      window.__lenis = null;
    }
    if (grainRaf) {
      cancelAnimationFrame(grainRaf);
      grainRaf = 0;
    }
    const grain = document.getElementById("grain");
    if (grain) grain.style.display = "none";
    // Reveal anything AOS was holding hidden.
    document.querySelectorAll("[data-aos]").forEach((el) => {
      el.classList.add("aos-animate");
      el.removeAttribute("data-aos");
    });
  });
})();
