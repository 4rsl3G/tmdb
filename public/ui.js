(() => {
  const overlay = document.getElementById("overlay");
  const root = document.getElementById("pjax-root");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ✅ Admin detection MUST rely on body class (works with hidden adminPath)
  const isAdminPage = document.body.classList.contains("is-admin");

  // Optional: detect admin prefix from body data attr (if you add it)
  // <body class="is-admin" data-admin-base="/hiddenpath">
  const adminBase = document.body.getAttribute("data-admin-base") || "/admin";

  // ===== Overlay (optional) =====
  function showOverlay(){
    if (!overlay) return;
    overlay.classList.remove("d-none");
  }
  function hideOverlay(){
    if (!overlay) return;
    overlay.classList.add("d-none");
  }

  // ===== PUBLIC mobile menu =====
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
  }

  // ===== ADMIN sidebar drawer (works with new admin layout) =====
  (function initAdminDrawer(){
    if (!isAdminPage) return;

    const burger = document.getElementById("admBurger");
    const backdrop = document.getElementById("admBackdrop");

    function openSide(){
      document.body.classList.add("adm-side-open");
      if (backdrop) backdrop.hidden = false;
      if (burger) burger.setAttribute("aria-expanded","true");
    }
    function closeSide(){
      document.body.classList.remove("adm-side-open");
      if (backdrop) backdrop.hidden = true;
      if (burger) burger.setAttribute("aria-expanded","false");
    }

    if (burger) burger.addEventListener("click", () => {
      document.body.classList.contains("adm-side-open") ? closeSide() : openSide();
    });

    if (backdrop) backdrop.addEventListener("click", closeSide);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSide();
    });
  })();

  // ===== AOS Safe Init (public only) =====
  function safeInitAOS(){
    if (isAdminPage) return;
    try {
      if (window.AOS && typeof window.AOS.init === "function") {
        window.AOS.init({
          once: false,
          mirror: true,
          duration: 650,
          easing: "ease-out-cubic"
        });

        document.documentElement.classList.add("aos-ok");

        setTimeout(() => {
          try { window.AOS.refreshHard(); } catch(e) {}
        }, 50);
      } else {
        // keep failsafe if AOS not loaded
        document.documentElement.classList.remove("aos-ok");
      }
    } catch (e) {
      document.documentElement.classList.remove("aos-ok");
    }
  }

  // ===== Micro Parallax =====
  function initBgParallax(){
    if (isAdminPage || reduceMotion) return;
    const noise = document.querySelector(".bg-noise");
    if (!noise) return;

    let raf = null;
    let tx = 0, ty = 0;

    const onMove = (e) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const nx = (e.clientX / vw - 0.5);
      const ny = (e.clientY / vh - 0.5);
      tx = nx * 12;
      ty = ny * 10;

      if (raf) return;
      raf = requestAnimationFrame(() => {
        noise.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        raf = null;
      });
    };

    window.addEventListener("mousemove", onMove, { passive:true });
  }

  // ===== Spotlight =====
  function initSpotlight(){
    if (isAdminPage || reduceMotion) return;
    const targets = document.querySelectorAll(".poster-card, .cardx, .heroPanel, .postHero");
    targets.forEach(el => {
      let raf = null;
      const move = (ev) => {
        const r = el.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * 100;
        const y = ((ev.clientY - r.top) / r.height) * 100;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--mx", x.toFixed(2) + "%");
          el.style.setProperty("--my", y.toFixed(2) + "%");
        });
      };
      el.addEventListener("mousemove", move, { passive:true });
      el.addEventListener("mouseleave", () => {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      }, { passive:true });
    });
  }

  // ===== Ripple =====
  function initRipple(){
    if (isAdminPage || reduceMotion) return;
    const selector = ".btnx, .poster-card, .cardx";
    document.addEventListener("click", (e) => {
      const el = e.target.closest(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }, { passive:true });
  }

  // ===== Tilt =====
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

  // ===== Magnetic buttons =====
  function initMagneticButtons(){
    if (isAdminPage || reduceMotion) return;
    document.querySelectorAll(".btnx").forEach(b => {
      let raf = null;
      const strength = 10;

      const move = (ev) => {
        const r = b.getBoundingClientRect();
        const x = ev.clientX - (r.left + r.width / 2);
        const y = ev.clientY - (r.top + r.height / 2);
        const mx = (x / r.width) * strength;
        const my = (y / r.height) * strength;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          b.style.transform = `translate3d(${mx.toFixed(2)}px, ${my.toFixed(2)}px, 0)`;
        });
      };

      const leave = () => { b.style.transform = ""; };
      b.addEventListener("mousemove", move, { passive:true });
      b.addEventListener("mouseleave", leave, { passive:true });
    });
  }

  // ===== Rail drag =====
  function initRailDrag(){
    if (isAdminPage) return;
    const rail = document.getElementById("posterRail");
    if (!rail) return;

    let down = false;
    let startX = 0, startScroll = 0;
    let lastX = 0, lastT = 0;
    let v = 0;
    let inertiaRAF = null;

    const stopInertia = () => {
      if (inertiaRAF) cancelAnimationFrame(inertiaRAF);
      inertiaRAF = null;
    };

    const runInertia = () => {
      stopInertia();
      if (reduceMotion) return;

      const step = () => {
        v *= 0.92;
        rail.scrollLeft -= v * 16;
        if (Math.abs(v) > 0.02) inertiaRAF = requestAnimationFrame(step);
        else stopInertia();
      };
      inertiaRAF = requestAnimationFrame(step);
    };

    rail.addEventListener("mousedown", (e) => {
      down = true;
      startX = e.pageX;
      startScroll = rail.scrollLeft;
      rail.style.cursor = "grabbing";
      rail.classList.add("is-dragging");

      lastX = e.pageX;
      lastT = performance.now();
      v = 0;
      stopInertia();
    });

    window.addEventListener("mouseup", () => {
      if (!down) return;
      down = false;
      rail.style.cursor = "";
      rail.classList.remove("is-dragging");
      runInertia();
    });

    rail.addEventListener("mousemove", (e) => {
      if (!down) return;
      e.preventDefault();

      const dx = e.pageX - startX;
      rail.scrollLeft = startScroll - dx;

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      v = (e.pageX - lastX) / dt;
      lastX = e.pageX;
      lastT = now;
    }, { passive:false });

    rail.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches[0]) return;
      down = true;
      const x = e.touches[0].pageX;
      startX = x;
      startScroll = rail.scrollLeft;
      lastX = x;
      lastT = performance.now();
      v = 0;
      stopInertia();
    }, { passive:true });

    rail.addEventListener("touchmove", (e) => {
      if (!down || !e.touches || !e.touches[0]) return;
      const x = e.touches[0].pageX;
      const dx = x - startX;
      rail.scrollLeft = startScroll - dx;

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      v = (x - lastX) / dt;
      lastX = x;
      lastT = now;
    }, { passive:true });

    rail.addEventListener("touchend", () => {
      if (!down) return;
      down = false;
      runInertia();
    }, { passive:true });
  }

  // ===== Update head for PJAX =====
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

  // ===== re-init =====
  function reinit(){
    safeInitAOS();
    initBgParallax();
    initSpotlight();
    initRipple();
    initMagneticButtons();
    initTilt();
    initRailDrag();
  }

  window.addEventListener("load", () => hideOverlay());
  window.addEventListener("pageshow", () => hideOverlay());

  reinit();

  // ===== PJAX ONLY PUBLIC =====
  if (!root || !window.jQuery || isAdminPage) return;

  function load(url, push=true){
    showOverlay();
    $.ajax({ url, headers: { "X-Requested-With": "XMLHttpRequest" } })
      .done((html) => {
        root.innerHTML = html;
        if (push) history.pushState({ url }, "", url);
        updateHeadFromPjax();
        reinit();
        try { window.AOS && window.AOS.refreshHard(); } catch(e){}
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { window.scrollTo(0,0); }
      })
      .fail(() => { window.location.href = url; })
      .always(() => { setTimeout(hideOverlay, 120); });
  }

  $(document).on("click", "a[data-pjax]", function(e){
    const href = $(this).attr("href");
    if (!href) return;

    if (href.startsWith("http")) return;

    // ✅ block any admin base path (hidden too)
    if (href.startsWith(adminBase)) return;

    e.preventDefault();
    load(href, true);
  });

  window.addEventListener("popstate", (e) => {
    const url = (e.state && e.state.url) ? e.state.url : window.location.pathname;
    load(url, false);
  });
})();
