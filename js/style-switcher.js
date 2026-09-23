/* =====================================================================
   Brothers Interactive — Visual style switcher
   Additive only. Builds its own floating button + panel at runtime.
   Does not read or modify the existing colour-theme switcher.
   Pairs with css/style-switcher.css and css/variants/*.css.
   ===================================================================== */
(function () {
  "use strict";

  var STYLES = [
    { id: "original", label: "Original", radius: "6px", border: "1px solid rgba(255,255,255,0.35)" },
    { id: "brutalist", label: "Neo-Brutalist", radius: "0px", border: "3px solid rgba(255,255,255,0.9)" },
    { id: "glass", label: "Frosted Glass", radius: "14px", border: "1px solid rgba(255,255,255,0.25)" },
    { id: "minimal", label: "Studio Editorial", radius: "3px", border: "1px solid rgba(255,255,255,0.2)" }
  ];
  var IDS = STYLES.map(function (s) { return s.id; });

  function applyStyle(id, persist) {
    var existing = document.getElementById("bi-style-variant");
    if (existing) existing.parentNode.removeChild(existing);
    if (id !== "original") {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.id = "bi-style-variant";
      link.href = "../css/variants/" + id + ".css";
      document.head.appendChild(link);
    }
    var opts = document.querySelectorAll(".style-opt");
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute("data-style") === id;
      opts[i].classList.toggle("active", on);
      opts[i].setAttribute("aria-checked", String(on));
    }
    if (persist) {
      try { localStorage.setItem("bi-style", id); } catch (e) {}
    }
  }

  function build() {
    var wrap = document.createElement("div");
    wrap.className = "style-switcher";
    wrap.id = "styleSwitcher";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "style-toggle";
    toggle.id = "styleToggle";
    toggle.setAttribute("aria-label", "Change visual style");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "stylePanel");
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="4"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8"/></svg>';

    var panel = document.createElement("div");
    panel.className = "style-panel";
    panel.id = "stylePanel";
    panel.setAttribute("role", "menu");
    panel.setAttribute("aria-label", "Visual styles");

    var title = document.createElement("p");
    title.className = "style-panel-title";
    title.textContent = "Choose a style";
    panel.appendChild(title);

    STYLES.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "style-opt";
      b.setAttribute("data-style", s.id);
      b.setAttribute("role", "menuitemradio");
      var sw = document.createElement("span");
      sw.className = "style-sw";
      sw.style.borderRadius = s.radius;
      sw.style.border = s.border;
      b.appendChild(sw);
      b.appendChild(document.createTextNode(s.label));
      b.addEventListener("click", function () {
        applyStyle(this.getAttribute("data-style"), true);
        closePanel();
      });
      panel.appendChild(b);
    });

    wrap.appendChild(toggle);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    function closePanel() {
      wrap.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
  }

  function init() {
    build();
    var saved = null;
    try { saved = localStorage.getItem("bi-style"); } catch (e) {}
    var fromUrl = (window.location.search.match(/[?&]style=([a-z]+)/) || [])[1];
    if (fromUrl && IDS.indexOf(fromUrl) !== -1) applyStyle(fromUrl, true);
    else applyStyle(saved && IDS.indexOf(saved) !== -1 ? saved : "original", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
