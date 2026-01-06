(() => {
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile menu
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
  }

  function initAOS(){
    const targets = document.querySelectorAll(".aos, .grid.stagger");
    if (prefersReduce) {
      targets.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  }

  function initTilt(){
    if (prefersReduce) return;
    const tiltEls = document.querySelectorAll("[data-tilt]");
    tiltEls.forEach((el) => {
      let raf = null;
      function onMove(ev){
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translateY(-3px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`;
        });
      }
      function onLeave(){ el.style.transform = ""; }
      el.addEventListener("mousemove", onMove, { passive: true });
      el.addEventListener("mouseleave", onLeave, { passive: true });
    });
  }

  function initRailDrag(){
    const rail = document.getElementById("posterRail");
    if (!rail) return;
    let down = false, startX = 0, startScroll = 0;
    rail.addEventListener("mousedown", (e) => {
      down = true; startX = e.pageX; startScroll = rail.scrollLeft; rail.style.cursor = "grabbing";
    });
    window.addEventListener("mouseup", () => { down = false; rail.style.cursor = ""; });
    rail.addEventListener("mousemove", (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      rail.scrollLeft = startScroll - dx;
    }, { passive: true });
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

    // OG update (optional minimal)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonical);
  }

  function reinit(){
    // clear old .in to replay reveals
    document.querySelectorAll(".aos, .grid.stagger").forEach(el => el.classList.remove("in"));
    initAOS();
    initTilt();
    initRailDrag();
  }

  // initial
  reinit();

  // === PJAX with jQuery ===
  const root = document.getElementById("pjax-root");
  if (root && window.jQuery) {
    function load(url, push=true){
      $.ajax({
        url,
        headers: { "X-Requested-With": "XMLHttpRequest" }
      }).done((html) => {
        root.innerHTML = html;
        if (push) history.pushState({ url }, "", url);
        updateHeadFromPjax();
        reinit();
        window.scrollTo({ top: 0, behavior: prefersReduce ? "auto" : "smooth" });
      }).fail(() => {
        window.location.href = url;
      });
    }

    $(document).on("click", "a[data-pjax]", function(e){
      const href = $(this).attr("href");
      if (!href || href.startsWith("http")) return;
      e.preventDefault();
      load(href, true);
    });

    window.addEventListener("popstate", (e) => {
      const url = (e.state && e.state.url) ? e.state.url : window.location.pathname;
      load(url, false);
    });
  }
})();
