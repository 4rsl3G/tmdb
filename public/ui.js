(() => {
  const root = document.getElementById("pjax-root");
  const overlay = document.getElementById("overlay"); // optional
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isAdminPage =
    location.pathname.includes("/admin") ||
    document.body.classList.contains("is-admin");

  // ===== Overlay optional =====
  function showOverlay(){
    if (!overlay) return;
    overlay.classList.remove("d-none");
  }
  function hideOverlay(){
    if (!overlay) return;
    overlay.classList.add("d-none");
  }

  // ===== Mobile menu =====
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
  }

  // ===== HARD FIX AOS (anti blank) =====
  function ensureAOS(){
    // IMPORTANT: do not remove failsafe if AOS not ready
    try {
      if (window.AOS && typeof window.AOS.init === "function") {
        window.AOS.init({
          once: false,
          mirror: true,
          duration: 650,
          easing: "ease-out-cubic"
        });

        // mark ok so html:not(.aos-ok) failsafe stops
        document.documentElement.classList.add("aos-ok");

        // refresh for dynamic DOM
        try { window.AOS.refreshHard(); } catch(e) {}
      } else {
        // AOS missing -> keep failsafe (do NOT add aos-ok)
        document.documentElement.classList.remove("aos-ok");
      }
    } catch (e) {
      document.documentElement.classList.remove("aos-ok");
    }
  }

  // ===== Tilt (public only) =====
  function initTilt(){
    if (isAdminPage || reduceMotion) return;

    document.querySelectorAll("[data-tilt]").forEach(el => {
      let raf = null;
      const onMove = (ev) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform =
            `translateY(-3px) rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg)`;
        });
      };
      const onLeave = () => { el.style.transform = ""; };
      el.addEventListener("mousemove", onMove, { passive:true });
      el.addEventListener("mouseleave", onLeave, { passive:true });
    });
  }

  // ===== Rail drag (mouse + touch) =====
  function initRailDrag(){
    if (isAdminPage) return;

    const rail = document.getElementById("posterRail");
    if (!rail) return;

    let down=false, startX=0, startScroll=0;
    rail.addEventListener("mousedown", (e) => {
      down=true; startX=e.pageX; startScroll=rail.scrollLeft;
      rail.style.cursor="grabbing";
      rail.classList.add("is-dragging");
    });
    window.addEventListener("mouseup", () => {
      down=false; rail.style.cursor=""; rail.classList.remove("is-dragging");
    });
    rail.addEventListener("mousemove", (e) => {
      if (!down) return;
      e.preventDefault();
      rail.scrollLeft = startScroll - (e.pageX - startX);
    }, { passive:false });

    // touch
    rail.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches[0]) return;
      down=true; startX=e.touches[0].pageX; startScroll=rail.scrollLeft;
    }, { passive:true });

    rail.addEventListener("touchmove", (e) => {
      if (!down || !e.touches || !e.touches[0]) return;
      rail.scrollLeft = startScroll - (e.touches[0].pageX - startX);
    }, { passive:true });

    rail.addEventListener("touchend", () => { down=false; }, { passive:true });
  }

  // ===== Update head from PJAX =====
  function updateHeadFromPjax(){
    const page = document.getElementById("pjax-page");
    if (!page) return;

    const title = page.getAttribute("data-title") || document.title;
    const desc = page.getAttribute("data-desc") || "";
    const canonical = page.getAttribute("data-canonical") || location.href;

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name","description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", desc);

    let linkCanon = document.querySelector('link[rel="canonical"]');
    if (!linkCanon) {
      linkCanon = document.createElement("link");
      linkCanon.setAttribute("rel","canonical");
      document.head.appendChild(linkCanon);
    }
    linkCanon.setAttribute("href", canonical);
  }

  function reinitAll(){
    ensureAOS();
    initTilt();
    initRailDrag();
  }

  // Always hide overlay on load
  window.addEventListener("load", () => hideOverlay());
  window.addEventListener("pageshow", () => hideOverlay());

  // initial init
  reinitAll();

  // ===== PJAX only on PUBLIC =====
  if (!root || !window.jQuery || isAdminPage) return;

  function load(url, push=true){
    showOverlay();

    $.ajax({
      url,
      headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .done((html) => {
      root.innerHTML = html;

      if (push) history.pushState({ url }, "", url);

      updateHeadFromPjax();

      // reinit effects for new DOM
      reinitAll();

      // extra AOS refresh safety
      try { window.AOS && window.AOS.refreshHard(); } catch(e){}

      try { window.scrollTo({ top: 0, behavior: "smooth" }); }
      catch { window.scrollTo(0,0); }
    })
    .fail(() => {
      window.location.href = url;
    })
    .always(() => {
      setTimeout(hideOverlay, 120);
    });
  }

  $(document).on("click", "a[data-pjax]", function(e){
    const href = $(this).attr("href");
    if (!href) return;

    if (href.startsWith("http")) return;
    if (href.includes("/admin")) return;

    e.preventDefault();
    load(href, true);
  });

  window.addEventListener("popstate", (e) => {
    const url = (e.state && e.state.url) ? e.state.url : window.location.pathname;
    load(url, false);
  });
})();
