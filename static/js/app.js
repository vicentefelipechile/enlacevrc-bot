// ========================================================================================================
// EnlaceVRC docs — client behaviour
// ========================================================================================================
// Three small, dependency-free behaviours: a scrollspy that highlights the current section in the wiki
// sidebar, a mobile drawer toggle, and a quick-filter over the sidebar links. No framework, no build step.
// ========================================================================================================

(function () {
  "use strict";

  // ------------------------------------------------------------------------------------------------------
  // Mobile drawer
  // ------------------------------------------------------------------------------------------------------

  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const toggle = document.getElementById("menu-toggle");

  function setDrawer(open) {
    if (!sidebar || !scrim || !toggle) return;
    sidebar.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      setDrawer(!sidebar.classList.contains("is-open"));
    });
  }

  if (scrim) {
    scrim.addEventListener("click", () => setDrawer(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setDrawer(false);
  });

  // ------------------------------------------------------------------------------------------------------
  // Scrollspy — highlight the sidebar link for whichever section is in view
  // ------------------------------------------------------------------------------------------------------

  const navLinks = Array.from(document.querySelectorAll(".sidebar__link[href^='#']"));
  const linkById = new Map();
  navLinks.forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    if (id) linkById.set(id, link);
  });

  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  let activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach((link) => link.classList.remove("is-active"));
    const link = linkById.get(id);
    if (link) link.classList.add("is-active");
  }

  if ("IntersectionObserver" in window && sections.length) {
    // Track which sections currently intersect; the topmost visible one wins.
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        if (!visible.size) return;
        const topmost = sections
          .filter((section) => visible.has(section.id))
          .sort((a, b) => a.offsetTop - b.offsetTop)[0];
        if (topmost) setActive(topmost.id);
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActive(link.getAttribute("href").slice(1));
      setDrawer(false);
    });
  });

  // ------------------------------------------------------------------------------------------------------
  // Sidebar quick-filter — type to narrow the list of links
  // ------------------------------------------------------------------------------------------------------

  const filter = document.getElementById("sidebar-filter");
  const groups = Array.from(document.querySelectorAll(".sidebar__group"));
  const empty = document.getElementById("sidebar-empty");

  if (filter) {
    filter.addEventListener("input", () => {
      const term = filter.value.trim().toLowerCase();
      let anyMatch = false;

      groups.forEach((group) => {
        const links = Array.from(group.querySelectorAll(".sidebar__link"));
        let groupMatch = false;
        links.forEach((link) => {
          const text = (link.textContent || "").toLowerCase();
          const match = term === "" || text.includes(term);
          link.hidden = !match;
          if (match) groupMatch = true;
        });
        group.hidden = !groupMatch;
        if (groupMatch) anyMatch = true;
      });

      if (empty) empty.hidden = anyMatch;
    });
  }
})();
