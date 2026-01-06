(() => {
  const overlay = document.getElementById("overlay");
  const root = document.getElementById("pjax-root");

  const isAdminPage = location.pathname.includes("/admin") || document.body.classList.contains("is-admin");

  function showOverlay(){
    if (!overlay) return;
    overlay.classList.remove("d-none");
  }
  function hideOverlay(){
    if (!overlay) return;
    overlay.classList.add("d-none");
  }

  // Mobile menu (works for both)
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
  }

  function safeInitAOS(){
    try {
      if (window.AOS && typeof window.AOS.init === "function") {
        window.AOS.init({
          once: false,
          mirror: true,
          duration: 650,
          easing: "ease-out-cubic"
        });
      }
    } catch (e) {}
  }

  function initTilt(){
    // tilt hanya untuk public cards
    if (isAdminPage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const els = document.querySelectorAll("[data-tilt]");
    els.forEach(el => {
      let raf = null;
      const onMove = (ev) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translateY(-3px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`;
        });
      };
      const onLeave = () => { el.style.transform = ""; };
      el.addEventListener("mousemove", onMove, { passive:true });
      el.addEventListener("mouseleave", onLeave, { passive:true });
    });
  }

  function initRailDrag(){
    if (isAdminPage) return;

    const rail = document.getElementById("posterRail");
    if (!rail) return;
    let down=false, startX=0, startScroll=0;
    rail.addEventListener("mousedown", (e) => {
      down=true; startX=e.pageX; startScroll=rail.scrollLeft; rail.style.cursor="grabbing";
    });
    window.addEventListener("mouseup", () => { down=false; rail.style.cursor=""; });
    rail.addEventListener("mousemove", (e) => {
      if (!down) return;
      rail.scrollLeft = startScroll - (e.pageX - startX);
    }, { passive:true });
  }

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

  function reinit(){
    safeInitAOS();
    initTilt();
    initRailDrag();
  }

  // ALWAYS: hide overlay on load (prevent “stuck overlay”)
  window.addEventListener("load", () => hideOverlay());
  window.addEventListener("pageshow", () => hideOverlay());

  // initial
  reinit();

  // ===== PJAX only on PUBLIC pages =====
  // Admin pages: disable PJAX entirely to avoid replacing admin DOM.
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
      reinit();
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0,0); }
    })
    .fail(() => {
      window.location.href = url;
    })
    .always(() => {
      // overlay pasti ditutup walau ada error render
      setTimeout(hideOverlay, 120);
    });
  }

  $(document).on("click", "a[data-pjax]", function(e){
    const href = $(this).attr("href");
    if (!href) return;

    // block external & admin links
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
