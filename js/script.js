/* =====================================================================
   Brothers Interactive — site scripts
   Portfolio data, filtering, lightbox, games trailers, blog, nav, forms
   ===================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     DATA lives in data.js (window.BI). Edit content there, not here.
     ------------------------------------------------------------------ */
  var BI = window.BI || {};
  var CFG = BI.CONFIG || {};
  var CAT = {
    "realistic-humans": "Realistic Humans",
    "realistic-creatures": "Realistic Creatures",
    "realistic-hairs": "Realistic Hairs",
    "stylized-human": "Stylized Human",
    "stylized-creature": "Stylized Creature",
    "props": "Props",
    "mid-night-walk": "Mid Night Walk",
    "lost-in-random": "Lost In Random"
  };
  var BASE = "https://brothersinteractive.com/projects/";
  var BLOG_URL = "https://brothersinteractive.com/blog";

  /* All editable content lives in data/*.json (not data.js) so the /admin
     CMS can change it without touching any code. Loaded synchronously here
     so the rest of this file can keep assuming the data is ready. A file
     with no CMS-made changes yet just 404s and the data.js fallback (if any)
     is used instead — nothing breaks either way. */
  function loadJSON(name) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "../data/" + name + ".json", false);
      xhr.send(null);
      if (xhr.status === 200) return JSON.parse(xhr.responseText);
    } catch (e) {}
    return null;
  }
  function loadList(name, fallback) {
    var loaded = loadJSON(name);
    var list = Array.isArray(loaded) ? loaded : (loaded && loaded.items) || null;
    return list && list.length ? list : (fallback || []);
  }

  var PROJECTS = loadList("portfolio", BI.PROJECTS);
  var GAMES = loadList("games", BI.GAMES);
  var CASES = loadList("cases", BI.CASES);
  var POSTS = loadList("posts", BI.POSTS);
  var TESTIMONIALS = loadList("testimonials", BI.TESTIMONIALS);
  var ROLES = loadList("roles", BI.ROLES);
  var PAIRS = loadList("pairs", BI.PAIRS);
  var CLIENTS = loadList("clients", BI.CLIENTS);
  var PRESS = loadList("press", BI.PRESS);
  var TEAM = loadList("team", []);
  (function () {
    var loadedCfg = loadJSON("config");
    if (loadedCfg && typeof loadedCfg === "object") {
      for (var k in loadedCfg) { if (loadedCfg[k] !== "" && loadedCfg[k] != null) CFG[k] = loadedCfg[k]; }
    }
  })();
  var EMAIL = CFG.email || "business@brothersinteractive.com";

  /* Analytics hook: no-op until CONFIG.plausibleDomain is set */
  function track(name, props) {
    try { if (window.plausible) window.plausible(name, props ? { props: props } : undefined); } catch (err) {}
  }

  /* Shared form sender: Formspree when configured, email client otherwise */
  function sendForm(formEl, noteEl, payload, eventName, mailtoHref) {
    if (CFG.formspreeId) {
      noteEl.className = "form-note"; noteEl.textContent = "Sending...";
      fetch("https://formspree.io/f/" + CFG.formspreeId, {
        method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        noteEl.className = "form-note ok"; noteEl.textContent = "Sent! Thank you, we'll be in touch shortly.";
        formEl.reset(); track(eventName);
      }).catch(function () {
        noteEl.className = "form-note err"; noteEl.textContent = "Could not send online. Opening your email client instead...";
        window.location.href = mailtoHref;
      });
    } else {
      window.location.href = mailtoHref;
      noteEl.className = "form-note ok"; noteEl.textContent = "Opening your email client... Thank you! We'll be in touch shortly.";
      formEl.reset(); track(eventName);
    }
  }

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Accepts a bare YouTube ID (what the CMS asks for) or a pasted-in-by-mistake
     full URL (watch?v=, youtu.be/, embed/) and always returns just the ID. */
  function ytId(v) {
    if (!v) return "";
    var m = String(v).match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : v;
  }
  /* A link typed without http(s):// (e.g. "www.linkedin.com/...") would
     otherwise resolve as a relative path on the current page and 404.
     Leaves mailto:, tel:, #anchors and already-absolute URLs untouched. */
  function normalizeUrl(u) {
    u = String(u || "").trim();
    if (!u || /^(https?:|mailto:|tel:|#)/i.test(u)) return u;
    return "https://" + u;
  }

  /* ==================================================================
     HOME PAGE ONLY — everything inside this block needs the portfolio,
     games, case study and blog containers that exist on index.html.
     ================================================================== */
  if ($("#portfolioGrid")) {

  /* ------------------------------------------------------------------
     Portfolio grid + filters + load more
     ------------------------------------------------------------------ */
  var grid = $("#portfolioGrid");
  var loadMoreBtn = $("#loadMoreBtn");
  var PAGE = 12; // still used for the staggered fade-in animation, not for hiding items
  // category.html links here as ?cat=<key> to land already filtered to one style
  var qCat = (location.search.match(/[?&]cat=([^&]+)/) || [])[1];
  var activeFilter = qCat ? decodeURIComponent(qCat) : "all";
  var shown = Infinity; // show the whole portfolio at once, no "Load More" needed
  var visibleList = [];

  // category.html: fill in the page title/heading from the ?cat= key
  var catTitleEl = $("#categoryTitle");
  if (catTitleEl) {
    var catLabel = CAT[activeFilter] || "Portfolio";
    catTitleEl.textContent = catLabel;
    document.title = catLabel + " | Brothers Interactive";
  }

  /* A fresh random order on every page load, so the portfolio never looks the same twice */
  var SHUFFLED = PROJECTS.slice();
  for (var si = SHUFFLED.length - 1; si > 0; si--) {
    var sj = Math.floor(Math.random() * (si + 1));
    var tmp = SHUFFLED[si]; SHUFFLED[si] = SHUFFLED[sj]; SHUFFLED[sj] = tmp;
  }
  function filtered() {
    return activeFilter === "all" ? SHUFFLED : SHUFFLED.filter(function (p) { return p.c === activeFilter; });
  }

  function renderGrid() {
    visibleList = filtered();
    var slice = visibleList.slice(0, shown);
    if (!slice.length) {
      grid.innerHTML = '<p class="portfolio-empty">No pieces in this category yet.</p>';
    } else {
      grid.innerHTML = slice.map(function (p, idx) {
        var ar = p.w && p.h ? 'aspect-ratio:' + p.w + '/' + p.h + ';' : '';
        return (
          '<article class="work-card ripple-host" data-index="' + PROJECTS.indexOf(p) + '" style="' + ar + '--i:' + idx + ';animation-delay:' + (idx % PAGE) * 40 + 'ms" tabindex="0" role="button" aria-label="Open ' + esc(p.t) + '">' +
            '<img src="' + p.i + '" alt="' + esc(p.t) + '" loading="lazy"' + (p.w ? ' width="' + p.w + '" height="' + p.h + '"' : '') + ' />' +
            '<span class="work-zoom" aria-hidden="true">&#x2922;</span>' +
            '<div class="work-info"><span class="work-cat">' + esc(CAT[p.c]) + '</span><span class="work-title">' + esc(p.t) + '</span></div>' +
          '</article>'
        );
      }).join("");
    }
    loadMoreBtn.style.display = shown >= visibleList.length ? "none" : "";
  }

  var filterBarEl = $("#filterBar");
  if (filterBarEl) filterBarEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter-btn");
    if (!btn) return;
    // reset the lightbox list to the grid selection
    visibleList = [];
    $$(".filter-btn").forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    activeFilter = btn.dataset.filter;
    shown = Infinity;
    // animate old cards out, then render the new set (cards animate in with a stagger)
    grid.classList.add("leaving");
    setTimeout(function () { renderGrid(); grid.classList.remove("leaving"); }, 220);
  });

  loadMoreBtn.addEventListener("click", function () {
    shown += PAGE;
    renderGrid();
  });

  renderGrid();

  /* ------------------------------------------------------------------
     Category grid ("browse by art style" tiles) -- each tile links to
     category.html?cat=<key>, which reuses this same portfolio-grid +
     lightbox code path pre-filtered to that one category.
     ------------------------------------------------------------------ */
  var categoryGridEl = $("#categoryGrid");
  if (categoryGridEl) {
    categoryGridEl.innerHTML = Object.keys(CAT).map(function (key, i) {
      var pieces = PROJECTS.filter(function (p) { return p.c === key; });
      var thumb = pieces[0];
      return (
        '<a class="style-tile reveal" href="category.html?cat=' + encodeURIComponent(key) + '" style="transition-delay:' + (i % 4) * 70 + 'ms" aria-label="Browse ' + esc(CAT[key]) + '">' +
          (thumb ? '<img src="' + thumb.i + '" alt="" loading="lazy" />' : '') +
          '<span class="style-tile-label">' + esc(CAT[key]) + '</span>' +
        '</a>'
      );
    }).join("");
  }

  /* ------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------ */
  var lb = $("#lightbox");
  var lbImg = $("#lightboxImg");
  var lbCat = $("#lightboxCat");
  var lbTitle = $("#lightboxTitle");
  var lbLink = $("#lightboxLink");
  var lbThumbs = $("#lightboxThumbs");
  var lbPos = 0; // position within visibleList
  var lbFigure = $(".lightbox-figure", lb);
  var lbOrigin = null; // element the lightbox was opened from (for the zoom animation)
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Zoom-from-thumbnail: a clone of the clicked image flies to where the lightbox image will sit.
     Cleanup runs on transitionend, with a timer as fallback, so a throttled tab never leaves a clone behind. */
  function clearClones() { $$(".flip-clone").forEach(function (c) { c.remove(); }); lbFigure.classList.remove("hidden-for-flip", "settle"); }
  function afterMove(clone, ms, fn) {
    var fired = false;
    var go = function () { if (fired) return; fired = true; fn(); };
    clone.addEventListener("transitionend", function (e) { if (e.propertyName === "width" || e.propertyName === "top") go(); });
    setTimeout(go, ms + 80);
  }
  function makeClone(srcImg, rect, fit) {
    var clone = srcImg.cloneNode(false);
    clone.className = "flip-clone loaded";
    clone.style.cssText = "top:" + rect.top + "px;left:" + rect.left + "px;width:" + rect.width + "px;height:" + rect.height + "px;object-fit:" + fit + ";";
    document.body.appendChild(clone);
    return clone;
  }
  function flipTo(fromEl, done) {
    clearClones();
    var srcImg = fromEl && fromEl.querySelector("img");
    if (!srcImg || reduceMotion) { done(); return; }
    var from = srcImg.getBoundingClientRect();
    if (!from.width) { done(); return; }
    var clone = makeClone(srcImg, from, "cover");
    lbFigure.classList.add("hidden-for-flip");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var to = lbImg.getBoundingClientRect();
        if (!to.width) { to = { top: window.innerHeight * 0.06, left: window.innerWidth * 0.2, width: window.innerWidth * 0.6, height: window.innerHeight * 0.78 }; }
        clone.style.top = to.top + "px"; clone.style.left = to.left + "px"; clone.style.width = to.width + "px"; clone.style.height = to.height + "px";
        clone.style.objectFit = "contain";
        afterMove(clone, 450, function () {
          lbFigure.classList.remove("hidden-for-flip"); lbFigure.classList.add("settle");
          clone.style.opacity = "0";
          setTimeout(function () { clone.remove(); lbFigure.classList.remove("settle"); done(); }, 300);
        });
      });
    });
  }
  function flipBack(toEl, done) {
    clearClones();
    var dstImg = toEl && toEl.querySelector("img");
    if (!dstImg || reduceMotion || !lb.classList.contains("open")) { done(); return; }
    var from = lbImg.getBoundingClientRect(); var to = dstImg.getBoundingClientRect();
    if (!from.width || !to.width || to.bottom < 0 || to.top > window.innerHeight) { done(); return; }
    var clone = makeClone(lbImg, from, "contain");
    lbFigure.classList.add("hidden-for-flip");
    requestAnimationFrame(function () {
      clone.style.top = to.top + "px"; clone.style.left = to.left + "px"; clone.style.width = to.width + "px"; clone.style.height = to.height + "px"; clone.style.objectFit = "cover";
      afterMove(clone, 450, function () {
        clone.style.opacity = "0";
        setTimeout(function () { clone.remove(); lbFigure.classList.remove("hidden-for-flip"); done(); }, 200);
      });
    });
  }

  function openLightbox(projectIndex, fromEl) {
    var p = PROJECTS[projectIndex];
    if (visibleList.indexOf(p) === -1) visibleList = [p];
    lbPos = visibleList.indexOf(p);
    lbOrigin = fromEl || null;
    showLightbox(p);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    flipTo(fromEl, function () {});
  }
  function showLightbox(p, dir) {
    var swap = function () {
      lbImg.src = p.i;
      lbImg.alt = p.t;
      lbImg.classList.add("loaded");
      lbCat.textContent = CAT[p.c];
      lbTitle.textContent = p.t;
      lbLink.href = "asset.html?id=" + p.id;
      lbLink.textContent = "Asset details & breakdown \u2192";
      var variants = [p.i].concat(p.imgs || []);
      lbThumbs.innerHTML = variants.length > 1 ? variants.map(function (u, i) {
        return '<button class="asset-thumb' + (i === 0 ? ' active' : '') + '" data-src="' + u + '" aria-label="View ' + (i + 1) + '"><img src="' + u + '" alt="" loading="lazy" /></button>';
      }).join("") : "";
    };
    if (!dir || reduceMotion) { swap(); return; }
    lbImg.className = "loaded " + (dir > 0 ? "slide-out-left" : "slide-out-right");
    setTimeout(function () {
      swap();
      lbImg.className = "loaded " + (dir > 0 ? "slide-in-right" : "slide-in-left");
      setTimeout(function () { lbImg.className = "loaded"; }, 340);
    }, 200);
  }
  function closeLightbox() {
    if (!lb.classList.contains("open")) return;
    var origin = lbOrigin; lbOrigin = null;
    flipBack(origin, function () {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      clearClones();
    });
  }
  function stepLightbox(dir) {
    if (!visibleList.length) return;
    lbPos = (lbPos + dir + visibleList.length) % visibleList.length;
    lbOrigin = $('.work-card[data-index="' + PROJECTS.indexOf(visibleList[lbPos]) + '"]') || lbOrigin;
    showLightbox(visibleList[lbPos], dir);
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".work-card");
    if (card) { visibleList = filtered(); openLightbox(+card.dataset.index, card); }
  });
  grid.addEventListener("keydown", function (e) {
    var card = e.target.closest(".work-card");
    if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); visibleList = filtered(); openLightbox(+card.dataset.index); }
  });
  lbThumbs.addEventListener("click", function (e) {
    var btn = e.target.closest(".asset-thumb");
    if (!btn || btn.classList.contains("active")) return;
    $$(".asset-thumb", lbThumbs).forEach(function (b) { b.classList.toggle("active", b === btn); });
    lbImg.classList.add("fading");
    setTimeout(function () {
      lbImg.src = btn.dataset.src;
      lbImg.classList.remove("fading");
    }, 160);
  });
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightboxPrev").addEventListener("click", function () { stepLightbox(-1); });
  $("#lightboxNext").addEventListener("click", function () { stepLightbox(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  /* ------------------------------------------------------------------
     Games grid + trailer modal
     ------------------------------------------------------------------ */
  var gamesGrid = $("#gamesGrid");
  if (gamesGrid) gamesGrid.innerHTML = GAMES.map(function (g, i) {
    return (
      '<article class="game-card reveal" data-yt="' + esc(ytId(g.yt)) + '" tabindex="0" role="button" aria-label="Play trailer: ' + esc(g.t) + '" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
        '<img src="' + g.i + '" alt="' + esc(g.t) + ' key art" loading="lazy" />' +
        '<span class="game-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<div class="game-info"><div><span class="game-studio">' + esc(g.s || "") + '</span><span class="game-title">' + esc(g.t) + '</span></div><span class="game-tag">Watch trailer</span></div>' +
      '</article>'
    );
  }).join("");

  var vm = $("#videoModal");
  var vmFrame = $("#videoIframe");
  function openVideo(id) {
    if (!vm) return;
    id = ytId(id);
    track("trailer_played", { video: id });
    vmFrame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    vm.classList.add("open");
    vm.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeVideo() {
    if (!vm) return;
    vm.classList.remove("open");
    vm.setAttribute("aria-hidden", "true");
    vmFrame.src = "";
    document.body.classList.remove("no-scroll");
  }
  if (gamesGrid) {
    gamesGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".game-card");
      if (card) openVideo(card.dataset.yt);
    });
    gamesGrid.addEventListener("keydown", function (e) {
      var card = e.target.closest(".game-card");
      if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(card.dataset.yt); }
    });
  }
  if (vm) {
    $("#videoClose").addEventListener("click", closeVideo);
    vm.addEventListener("click", function (e) { if (e.target === vm) closeVideo(); });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeLightbox(); closeVideo(); closeNav(); }
    if (lb.classList.contains("open")) {
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  /* ------------------------------------------------------------------
     Case studies
     ------------------------------------------------------------------ */
  var caseList = $("#caseList");
  function casePieces(c) {
    return c.cat ? PROJECTS.filter(function (p) { return p.c === c.cat; }) : [];
  }
  if (caseList) caseList.innerHTML = CASES.map(function (c, i) {
    var pieces = casePieces(c);
    var thumbs = pieces.slice(0, 6).map(function (p) {
      return '<button class="case-thumb" data-index="' + PROJECTS.indexOf(p) + '" data-case="' + i + '" aria-label="Open ' + esc(p.t) + '"><img src="' + p.i + '" alt="' + esc(p.t) + '" loading="lazy" /></button>';
    }).join("");
    var piecesHtml = pieces.length
      ? '<div class="case-pieces"><span class="case-pieces-label">' + pieces.length + ' published asset' + (pieces.length > 1 ? 's' : '') + ' from this project</span><div class="case-thumbs">' + thumbs + '</div></div>'
      : '<div class="case-pieces case-pieces--nda"><span class="case-pieces-label">Asset breakdowns available on request</span></div>';
    return (
      '<article class="case-card reveal' + (i % 2 ? ' case-card--flip' : '') + '">' +
        '<div class="case-media" data-yt="' + esc(ytId(c.yt)) + '" role="button" tabindex="0" aria-label="Play trailer: ' + esc(c.t) + '">' +
          '<img src="' + c.img + '" alt="' + esc(c.t) + ' key art" loading="lazy" />' +
          '<span class="game-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '</div>' +
        '<div class="case-body">' +
          '<span class="case-num">Case ' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
          '<h3 class="case-title">' + esc(c.t) + '</h3>' +
          '<ul class="case-meta">' +
            '<li><span>Client</span>' + esc(c.client) + '</li>' +
            '<li><span>Year</span>' + esc(c.year) + '</li>' +
            '<li><span>Style</span>' + esc(c.style) + '</li>' +
            '<li><span>Engine</span>' + esc(c.engine) + '</li>' +
          '</ul>' +
          '<p class="case-summary">' + esc(c.summary) + '</p>' +
          (c.stats ? '<ul class="case-stats">' + c.stats.map(function (st) { return '<li><strong>' + esc(st[1]) + '</strong><span>' + esc(st[0]) + '</span></li>'; }).join("") + '</ul>' : '') +
          '<ul class="case-scope">' + c.scope.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>' +
          piecesHtml +
        '</div>' +
      '</article>'
    );
  }).join("");

  if (caseList) caseList.addEventListener("click", function (e) {
    var media = e.target.closest(".case-media");
    if (media) { openVideo(media.dataset.yt); return; }
    var thumb = e.target.closest(".case-thumb");
    if (thumb) {
      visibleList = casePieces(CASES[+thumb.dataset.case]);
      openLightbox(+thumb.dataset.index, thumb);
    }
  });
  if (caseList) caseList.addEventListener("keydown", function (e) {
    var media = e.target.closest(".case-media");
    if (media && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(media.dataset.yt); }
  });

  /* ------------------------------------------------------------------
     Blog
     ------------------------------------------------------------------ */
  var blogGridEl = $("#blogGrid");
  if (blogGridEl) blogGridEl.innerHTML = POSTS.map(function (p, i) {
    return (
      '<a class="blog-card reveal" href="' + BLOG_URL + '" target="_blank" rel="noopener" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
        '<span class="blog-date">' + esc(p.d) + '</span>' +
        '<h3>' + esc(p.t) + '</h3>' +
      '</a>'
    );
  }).join("");

  } /* ---- end HOME PAGE ONLY block ---- */

  /* ------------------------------------------------------------------
     Testimonials + open roles (data-driven, used on several pages)
     ------------------------------------------------------------------ */
  var tGrid = $("#testimonialGrid");
  if (tGrid) {
    var initials = function (n) { return String(n || "").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "BI"; };
    tGrid.innerHTML = TESTIMONIALS.length
      ? TESTIMONIALS.map(function (t, i) {
          return '<blockquote class="testimonial reveal" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
            (t.sample ? '<span class="sample-badge" title="Replace in data.js">Sample</span>' : '') +
            '<span class="quote-mark" aria-hidden="true">&ldquo;</span>' +
            '<p>' + esc(t.q) + '</p>' +
            '<footer>' +
              (t.img ? '<img class="t-avatar" src="' + t.img + '" alt="' + esc(t.n) + '" loading="lazy" />' : '<span class="t-avatar t-avatar--initials">' + esc(initials(t.n)) + '</span>') +
              '<div><strong>' + esc(t.n) + '</strong><span>' + esc(t.r) + (t.project ? ' &middot; ' + esc(t.project) : '') + '</span></div>' +
            '</footer>' +
          '</blockquote>';
        }).join("")
      : '<p class="portfolio-empty">Client quotes are being collected. Ask us for references directly.</p>';
  }
  $$("[data-roles]").forEach(function (list) {
    var applyHref = list.dataset.roles === "full" ? "careers.html#apply" : null;
    list.innerHTML = ROLES.length
      ? ROLES.map(function (r) {
          var href = applyHref || ("mailto:" + EMAIL + "?subject=" + encodeURIComponent("Application: " + r.t));
          return '<li class="role"><div><strong>' + esc(r.t) + '</strong><span>' + esc(r.type) + '</span></div><p>' + esc(r.d) + '</p><a href="' + href + '">Apply &rarr;</a></li>';
        }).join("")
      : '<li class="role role--empty">No open roles right now. Check back soon or send a speculative portfolio below.</li>';
  });
  if ($("#rolesCount")) $("#rolesCount").textContent = ROLES.length ? ROLES.length + " open role" + (ROLES.length > 1 ? "s" : "") : "No open roles at the moment";

  /* ------------------------------------------------------------------
     Header, mobile nav, active link, scroll progress, back to top
     ------------------------------------------------------------------ */
  var header = $("#siteHeader");
  var nav = $("#mainNav");
  var toggle = $("#navToggle");
  var progress = $("#scrollProgress");
  var backToTop = $("#backToTop");
  var navLinks = $$(".nav-link");
  var sections = navLinks.map(function (a) {
    var href = a.getAttribute("href") || "";
    return href.charAt(0) === "#" && href.length > 1 ? $(href) : null;
  }).filter(Boolean);

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach(function (a) { a.addEventListener("click", closeNav); });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (backToTop) backToTop.classList.toggle("show", y > 600);

    if (!sections.length) return; // sub-pages highlight their own link via the markup
    var current = sections[0];
    var probe = y + window.innerHeight * 0.35;
    sections.forEach(function (s) { if (s.offsetTop <= probe) current = s; });
    navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + current.id); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (backToTop) backToTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ------------------------------------------------------------------
     Reveal on scroll + counters
     ------------------------------------------------------------------ */
  function animateCount(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || "";
    var start = null;
    var dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$(".stat-num[data-count]", en.target).forEach(function (n) { if (!n.dataset.done) { n.dataset.done = "1"; animateCount(n); } });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  }
  /* Watches every .reveal element not yet watched. Called again at the end so elements
     rendered later in this script (comparison sliders, credits) are picked up too. */
  function watchReveals() {
    $$(".reveal").forEach(function (el) {
      if (el.dataset.watched) return;
      el.dataset.watched = "1";
      if (io) io.observe(el);
      else { el.classList.add("in"); $$(".stat-num[data-count]", el).forEach(animateCount); }
    });
    revealVisible();
  }
  /* Belt-and-braces: anything already inside the viewport is revealed straight away,
     independent of IntersectionObserver timing. Also runs on every scroll. */
  function revealVisible() {
    var h = window.innerHeight;
    $$(".reveal:not(.in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h - 40 && r.bottom > 0) {
        el.classList.add("in");
        $$(".stat-num[data-count]", el).forEach(function (n) { if (!n.dataset.done) { n.dataset.done = "1"; animateCount(n); } });
      }
    });
  }
  watchReveals();
  window.addEventListener("scroll", revealVisible, { passive: true });
  window.addEventListener("load", revealVisible);

  /* ------------------------------------------------------------------
     Contact form (mailto fallback, no backend required)
     ------------------------------------------------------------------ */
  var form = $("#contactForm");
  var note = $("#formNote");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#cfName"), email = $("#cfEmail"), msg = $("#cfMessage");
    var ok = true;
    [name, email, msg].forEach(function (f) {
      var valid = f.value.trim() !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.parentElement.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      note.className = "form-note err";
      note.textContent = "Please fill in every field with a valid email address.";
      return;
    }
    var extra = [
      ["Studio", $("#cfStudio").value], ["Asset type", $("#cfType").value], ["Art style", $("#cfStyle").value],
      ["Asset count", $("#cfCount").value], ["Deadline", $("#cfDeadline").value]
    ].filter(function (f) { return f[1].trim(); }).map(function (f) { return f[0] + ": " + f[1].trim(); }).join("\n");
    var subjectText = "Project brief from " + name.value.trim() + ($("#cfStudio").value.trim() ? " (" + $("#cfStudio").value.trim() + ")" : "");
    var bodyText = (extra ? extra + "\n\n" : "") + msg.value.trim() + "\n\n— " + name.value.trim() + " (" + email.value.trim() + ")";
    var payload = {
      _subject: subjectText, name: name.value.trim(), email: email.value.trim(), studio: $("#cfStudio").value.trim(),
      assetType: $("#cfType").value, artStyle: $("#cfStyle").value, assetCount: $("#cfCount").value.trim(),
      deadline: $("#cfDeadline").value.trim(), message: msg.value.trim()
    };
    sendForm(form, note, payload, "brief_sent", "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subjectText) + "&body=" + encodeURIComponent(bodyText));
  });

  /* ------------------------------------------------------------------
     Site settings: analytics, availability pill, booking + deck buttons
     ------------------------------------------------------------------ */
  if (CFG.plausibleDomain) {
    var pa = document.createElement("script"); pa.defer = true; pa.setAttribute("data-domain", CFG.plausibleDomain);
    pa.src = "https://plausible.io/js/script.js"; document.head.appendChild(pa);
  }
  var pill = $("#availability");
  if (pill) {
    if (CFG.availability) { pill.hidden = false; $(".avail-text", pill).textContent = CFG.availability; if (CFG.availabilityNote) pill.title = CFG.availabilityNote; }
    else pill.hidden = true;
  }
  $$("[data-booking]").forEach(function (a) { if (CFG.bookingUrl) { a.href = normalizeUrl(CFG.bookingUrl); a.hidden = false; } else { a.hidden = true; } });
  $$("[data-deck]").forEach(function (a) {
    if (CFG.deckPdf) { a.href = CFG.deckPdf; a.addEventListener("click", function () { track("deck_downloaded"); }); } else { a.hidden = true; }
  });

  /* ------------------------------------------------------------------
     Client logo wall (text wordmarks until logos are supplied)
     ------------------------------------------------------------------ */
  var wall = $("#logoWall");
  if (wall) wall.innerHTML = CLIENTS.map(function (c) {
    return '<li>' + (c.logo ? '<img src="' + c.logo + '" alt="' + esc(c.n) + '" loading="lazy" />' : '<span class="wordmark">' + esc(c.n) + '</span>') + '</li>';
  }).join("");

  /* ------------------------------------------------------------------
     Sculpt-to-final comparison sliders
     ------------------------------------------------------------------ */
  var cmp = $("#compareGrid");
  if (cmp) {
    cmp.innerHTML = PAIRS.map(function (pr, i) {
      return '<figure class="compare reveal" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
        '<div class="compare-stage">' +
          '<img class="compare-after" src="' + pr.after + '" alt="' + esc(pr.t) + ' final" loading="lazy" />' +
          '<img class="compare-before" src="' + pr.before + '" alt="' + esc(pr.t) + ' sculpt" loading="lazy" style="clip-path: inset(0 50% 0 0)" />' +
          '<span class="compare-handle" style="left:50%" aria-hidden="true"></span>' +
          '<span class="compare-label compare-label--a">Sculpt</span><span class="compare-label compare-label--b">Final</span>' +
          '<input type="range" class="compare-range" min="0" max="100" value="50" aria-label="Compare sculpt and final for ' + esc(pr.t) + '" />' +
        '</div>' +
        '<figcaption><span>' + esc(pr.t) + '</span><a href="asset.html?id=' + pr.id + '">Details &rarr;</a></figcaption>' +
      '</figure>';
    }).join("");
    cmp.addEventListener("input", function (e) {
      var r = e.target.closest(".compare-range"); if (!r) return;
      var st = r.parentElement, v = +r.value;
      $(".compare-before", st).style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
      $(".compare-handle", st).style.left = v + "%";
    });
  }

  /* ------------------------------------------------------------------
     Quote estimator (artist-days, from ESTIMATOR ranges in data.js)
     ------------------------------------------------------------------ */
  var est = $("#estimator");
  if (est && BI.ESTIMATOR) {
    var E = BI.ESTIMATOR;
    var typeSel = $("#estType");
    typeSel.innerHTML = Object.keys(E.types).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join("");
    var runEstimate = function () {
      var t = E.types[typeSel.value] || {}; var style = $("#estStyle").value; var n = Math.max(1, +$("#estCount").value || 1);
      var rig = $("#estRig").checked; var variants = Math.max(0, +$("#estVariants").value || 0);
      var r = t[style] || t.realistic || [1, 2];
      var lo = r[0] * n, hi = r[1] * n;
      var isChar = /character|creature/i.test(typeSel.value);
      if (rig && isChar) { lo += E.rigging[0] * n; hi += E.rigging[1] * n; }
      if (variants) { lo += E.outfitVariant[0] * variants; hi += E.outfitVariant[1] * variants; }
      var par = Math.max(1, Math.min(E.parallelArtists || 1, n));
      var wlo = Math.max(1, Math.round(lo / par / 5)), whi = Math.max(wlo, Math.round(hi / par / 5));
      $("#estDays").textContent = lo + "–" + hi;
      $("#estWeeks").textContent = wlo + "–" + whi;
      $("#estPar").textContent = par;
      $("#estRigRow").style.display = isChar ? "" : "none";
    };
    est.addEventListener("input", runEstimate);
    est.addEventListener("submit", function (e) { e.preventDefault(); runEstimate(); track("estimate_run"); });
    runEstimate();
    var useBtn = $("#estUse");
    if (useBtn) useBtn.addEventListener("click", function () {
      var map = { realistic: "Realistic", stylized: "Stylized", handpainted: "Hand-painted" };
      if ($("#cfType")) $("#cfType").value = /prop/i.test(typeSel.value) ? "Props & weapons" : /creature/i.test(typeSel.value) ? "Creatures" : /hair/i.test(typeSel.value) ? "Hair & grooming" : "Characters";
      if ($("#cfStyle")) $("#cfStyle").value = map[$("#estStyle").value] || "";
      if ($("#cfCount")) $("#cfCount").value = $("#estCount").value + " × " + typeSel.value + ($("#estRig").checked ? ", rigged" : "");
      if ($("#cfMessage")) $("#cfMessage").value = "Estimator result: about " + $("#estDays").textContent + " artist-days (" + $("#estWeeks").textContent + " weeks with " + $("#estPar").textContent + " artists in parallel).\n\n";
      track("estimate_used");
      location.hash = "#contact";
    });
  }

  /* ------------------------------------------------------------------
     Showreel: YouTube id when configured, otherwise a portfolio image reel
     ------------------------------------------------------------------ */
  var reelBtn = $("#showreelBtn");
  var reel = $("#reelModal");
  var reelTimer = null;
  function openReel() {
    if (CFG.showreelYouTubeId && $("#videoModal")) {
      track("trailer_played", { video: "showreel" });
      $("#videoIframe").src = "https://www.youtube-nocookie.com/embed/" + CFG.showreelYouTubeId + "?autoplay=1&rel=0";
      $("#videoModal").classList.add("open"); $("#videoModal").setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
      return;
    }
    if (!reel) return;
    var pool = PROJECTS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 12);
    var idx = 0, img = $("#reelImg"), cap = $("#reelCap");
    var show = function () {
      var p = pool[idx % pool.length];
      img.classList.remove("kb"); void img.offsetWidth;
      img.src = p.i; img.alt = p.t; img.classList.add("kb");
      cap.textContent = p.t + " · " + CAT[p.c]; idx++;
    };
    show(); reelTimer = setInterval(show, 2800);
    reel.classList.add("open"); reel.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
    track("trailer_played", { video: "image-reel" });
  }
  function closeReel() {
    if (!reel) return;
    clearInterval(reelTimer); reel.classList.remove("open"); reel.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll");
  }
  if (reelBtn) reelBtn.addEventListener("click", openReel);
  if (reel) {
    $("#reelClose").addEventListener("click", closeReel);
    reel.addEventListener("click", function (e) { if (e.target === reel) closeReel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReel(); });
  }

  /* ------------------------------------------------------------------
     Asset detail page (asset.html?id=XXXX)
     ------------------------------------------------------------------ */
  var ap = $("#assetPage");
  if (ap && PROJECTS.length) {
    var aid = (location.search.match(/[?&]id=([A-Za-z0-9]+)/) || [])[1];
    var aidx = -1; PROJECTS.forEach(function (x, i) { if (x.id === aid) aidx = i; });
    if (aidx === -1) aidx = 0;
    var P = PROJECTS[aidx];
    document.title = P.t + " | Brothers Interactive";
    $("#assetTitle").textContent = P.t; $("#assetCat").textContent = CAT[P.c] || "";
    var paras = (P.desc || "").split(/\n\n+/).filter(Boolean);
    $("#assetDesc").innerHTML = paras.length ? paras.map(function (t) { return '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; }).join("") : '<p>Breakdown and technical details available on request.</p>';
    var all = [P.i].concat(P.imgs || []);
    $("#assetMain").src = all[0]; $("#assetMain").alt = P.t;
    $("#assetThumbs").innerHTML = all.map(function (u, i) { return '<button class="asset-thumb' + (i ? '' : ' active') + '" data-src="' + u + '" aria-label="View ' + (i + 1) + '"><img src="' + u + '" alt="' + esc(P.t) + ' view ' + (i + 1) + '" loading="lazy" /></button>'; }).join("");
    $("#assetThumbs").addEventListener("click", function (e) {
      var b = e.target.closest(".asset-thumb"); if (!b) return;
      $("#assetMain").src = b.dataset.src; $$(".asset-thumb").forEach(function (x) { x.classList.toggle("active", x === b); });
    });
    $("#assetTags").innerHTML = (P.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");
    $("#assetSrc").href = normalizeUrl(P.src) || BASE + P.id;
    var view3d = $("#asset3d");
    if (view3d) {
      if (P.sketchfab) { view3d.hidden = false; $("iframe", view3d).src = "https://sketchfab.com/models/" + P.sketchfab + "/embed?autostart=0&ui_theme=dark"; }
      else view3d.hidden = true;
    }
    var projName = P.project || (P.c === "lost-in-random" ? "Lost in Random" : P.c === "mid-night-walk" ? "The Midnight Walk" : /fanart/i.test(P.t) ? "Fan art / studio piece" : "Studio work");
    var specs = [["Category", CAT[P.c] || ""], ["Project", projName], ["Software", P.software && P.software.length ? P.software.join(", ") : "On request"], ["Poly count", P.polys || "On request"], ["Textures", P.textures || "On request"]];
    $("#assetSpecs").innerHTML = specs.map(function (s) { return '<li><span>' + esc(s[0]) + '</span><strong>' + esc(s[1]) + '</strong></li>'; }).join("");
    var prevP = PROJECTS[(aidx - 1 + PROJECTS.length) % PROJECTS.length], nextP = PROJECTS[(aidx + 1) % PROJECTS.length];
    $("#assetPrev").href = "asset.html?id=" + prevP.id; $("#assetPrev").textContent = "← " + prevP.t;
    $("#assetNext").href = "asset.html?id=" + nextP.id; $("#assetNext").textContent = nextP.t + " →";
    var rel = PROJECTS.filter(function (x) { return x.c === P.c && x.id !== P.id; }).slice(0, 4);
    $("#assetRelated").innerHTML = rel.map(function (x) {
      var ar = x.w && x.h ? ' style="aspect-ratio:' + x.w + '/' + x.h + '"' : '';
      return '<a class="work-card ripple-host" href="asset.html?id=' + x.id + '"' + ar + '><img src="' + x.i + '" alt="' + esc(x.t) + '" loading="lazy" /><div class="work-info"><span class="work-cat">' + esc(CAT[x.c]) + '</span><span class="work-title">' + esc(x.t) + '</span></div></a>';
    }).join("");
  }

  /* ------------------------------------------------------------------
     Credits + press page
     ------------------------------------------------------------------ */
  var creditsList = $("#creditsList");
  if (creditsList) {
    creditsList.innerHTML = GAMES.map(function (g) {
      return '<li class="credit-card reveal"><img src="' + g.i + '" alt="' + esc(g.t) + ' key art" loading="lazy" />' +
        '<div><span class="game-studio">' + esc(g.s || "") + '</span><h3>' + esc(g.t) + '</h3>' +
        '<p>Character and asset production support.</p>' +
        '<a href="https://www.youtube.com/watch?v=' + esc(ytId(g.yt)) + '" target="_blank" rel="noopener">Watch trailer &rarr;</a></div></li>';
    }).join("");
    var pl = $("#pressList");
    if (pl) pl.innerHTML = PRESS.length
      ? PRESS.map(function (p) { return '<li class="role"><div><strong>' + esc(p.t) + '</strong><span>' + esc(p.d || "") + '</span></div><p>' + esc(p.src || "") + '</p>' + (p.url ? '<a href="' + esc(normalizeUrl(p.url)) + '" target="_blank" rel="noopener">Read &rarr;</a>' : '') + '</li>'; }).join("")
      : '<li class="role role--empty">Press mentions, ArtStation features and awards will appear here once added via /admin.</li>';
  }

  /* ------------------------------------------------------------------
     Motion: image fade-in, ripples, 3D tilt, hero parallax, cursor glow
     ------------------------------------------------------------------ */
  var motionOK = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  // images fade in as they finish loading (works for images added later too)
  function markLoaded(img) { img.classList.add("loaded"); }
  document.addEventListener("load", function (e) { if (e.target.tagName === "IMG") markLoaded(e.target); }, true);
  document.addEventListener("error", function (e) { if (e.target.tagName === "IMG") markLoaded(e.target); }, true);
  $$("img").forEach(function (img) { if (img.complete) markLoaded(img); });

  // ripple on click for buttons, chips and cards
  document.addEventListener("pointerdown", function (e) {
    if (!motionOK || !(e.target instanceof Element)) return;
    var host = e.target.closest(".btn, .filter-btn, .work-card, .game-card, .case-media, .theme-opt, .team-card, .value-card, .service-card, .blog-card, .credit-card");
    if (!host) return;
    host.classList.add("ripple-host");
    var r = host.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2;
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = "left:" + (e.clientX - r.left) + "px;top:" + (e.clientY - r.top) + "px;width:" + size + "px;height:" + size + "px;";
    host.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  // 3D tilt following the cursor
  if (motionOK && finePointer) {
    var tiltSel = ".work-card, .game-card, .service-card, .team-card, .value-card, .blog-card, .process-step, .credit-card";
    document.addEventListener("pointermove", function (e) {
      if (!(e.target instanceof Element)) return;
      var el = e.target.closest(tiltSel);
      if (!el || document.body.classList.contains("no-scroll")) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("tilt");
      el.style.transform = "perspective(900px) rotateX(" + (-py * 8).toFixed(2) + "deg) rotateY(" + (px * 10).toFixed(2) + "deg) translateY(-4px)";
    });
    document.addEventListener("pointerout", function (e) {
      if (!(e.target instanceof Element)) return;
      var el = e.target.closest(tiltSel);
      if (el && !el.contains(e.relatedTarget)) { el.style.transform = ""; el.classList.remove("tilt"); }
    });
  }

  // hero cards drift with the cursor
  var heroVisual = $(".hero-visual");
  if (heroVisual && motionOK && finePointer) {
    var heroCards = $$(".hero-card", heroVisual);
    document.addEventListener("pointermove", function (e) {
      var r = heroVisual.getBoundingClientRect();
      if (r.bottom < 0) return;
      var px = (e.clientX / window.innerWidth - 0.5), py = (e.clientY / window.innerHeight - 0.5);
      heroCards.forEach(function (c, i) {
        var depth = (i + 1) * 8;
        c.style.transform = "translate(" + (px * depth).toFixed(1) + "px," + (py * depth).toFixed(1) + "px)";
      });
    });
  }

  // soft cursor glow
  if (motionOK && finePointer) {
    var glow = document.createElement("div"); glow.className = "cursor-glow"; document.body.appendChild(glow);
    document.addEventListener("pointermove", function (e) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; glow.classList.add("on"); });
    document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
  }

  // artist cursor: a paintbrush that follows the pointer, with a lagging ring and hover states
  if (motionOK && finePointer) {
    var cur = document.createElement("div");
    cur.className = "art-cursor";
    cur.innerHTML =
      '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
        '<path d="M2 2c4 .4 8.5 3 10.5 7.5L8 14C3.5 12 1.2 7 2 2z" class="c-tip"/>' +
        '<path d="M11 11.5 27 27.5c1.4 1.4 1.4 3.2 0 4.4-1.2 1.2-3 1.2-4.4 0L6.8 16z" class="c-handle"/>' +
        '<path d="M11 11.5 14.5 15" class="c-band"/>' +
        '<circle cx="27.5" cy="28" r="1.6" class="c-dot"/>' +
      '</svg><span class="label"></span>';
    var ring = document.createElement("div");
    ring.className = "art-cursor-ring";
    document.body.appendChild(ring); document.body.appendChild(cur);
    document.body.classList.add("art-cursor-on");
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    document.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = "translate(" + (mx - 2) + "px," + (my - 2) + "px)";
      if (!shown) { shown = true; rx = mx; ry = my; cur.classList.add("on"); ring.classList.add("on"); }
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(ringLoop);
    })();
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("input:not([type=range]):not([type=checkbox]), textarea, select")) { cur.classList.add("hidden"); ring.classList.add("hidden"); return; }
      var state = "", label = "";
      if (t.closest(".compare-stage")) { state = "zoom"; label = "Drag"; }
      else if (t.closest(".work-card, .case-thumb, .asset-thumb, .style-samples a, .lightbox-figure img")) { state = "zoom"; label = "View"; }
      else if (t.closest(".game-card, .case-media, #showreelBtn")) { state = "zoom"; label = "Play"; }
      else if (t.closest("a, button, [role=button], label, summary, .theme-opt")) { state = "hover"; }
      cur.className = "art-cursor on" + (state ? " " + state : "");
      ring.className = "art-cursor-ring on" + (state ? " " + state : "");
      cur.querySelector(".label").textContent = label;
    });
    document.addEventListener("pointerdown", function () { cur.classList.add("down"); });
    document.addEventListener("pointerup", function () { cur.classList.remove("down"); });
    document.documentElement.addEventListener("mouseleave", function () { cur.classList.remove("on"); ring.classList.remove("on"); });
    document.documentElement.addEventListener("mouseenter", function () { cur.classList.add("on"); ring.classList.add("on"); });
  }

  /* ------------------------------------------------------------------
     Theme switcher — sets data-theme on <html>, remembers the choice
     ------------------------------------------------------------------ */
  var THEMES = ["neon", "crimson", "matrix", "synthwave", "ember", "arctic", "ocean", "royal", "rose", "copper", "steel", "forest", "midnight", "cotton", "vampire", "sakura", "citrus", "aurora", "desert", "blueprint"];
  var switcher = $("#themeSwitcher");
  var themeToggle = $("#themeToggle");
  var themeOpts = $$(".theme-opt");

  function applyTheme(name, persist) {
    if (THEMES.indexOf(name) === -1) name = "neon";
    if (name === "neon") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", name);
    themeOpts.forEach(function (b) {
      var on = b.dataset.theme === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-checked", String(on));
    });
    if (persist) { try { localStorage.setItem("bi-theme", name); } catch (err) {} track("theme_changed", { theme: name }); }
  }
  function closeThemePanel() {
    switcher.classList.remove("open");
    themeToggle.setAttribute("aria-expanded", "false");
  }

  var saved = null;
  try { saved = localStorage.getItem("bi-theme"); } catch (err) {}
  // ?theme=crimson in the URL overrides the saved choice (handy for sharing a specific look)
  var fromUrl = (window.location.search.match(/[?&]theme=([a-z]+)/) || [])[1];
  if (fromUrl && THEMES.indexOf(fromUrl) !== -1) applyTheme(fromUrl, true);
  else applyTheme(saved || "neon", false);

  themeToggle.addEventListener("click", function () {
    var open = switcher.classList.toggle("open");
    themeToggle.setAttribute("aria-expanded", String(open));
  });
  themeOpts.forEach(function (b) {
    b.addEventListener("click", function () { applyTheme(b.dataset.theme, true); closeThemePanel(); });
  });
  document.addEventListener("click", function (e) { if (!switcher.contains(e.target)) closeThemePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeThemePanel(); });

  /* ------------------------------------------------------------------
     Job application form (careers.html) — mailto, no backend needed
     ------------------------------------------------------------------ */
  var jobForm = $("#applyForm");
  if (jobForm) jobForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var jn = $("#apName"), je = $("#apEmail"), jr = $("#apRole"), jp = $("#apPortfolio"), jm = $("#apMessage"), jnote = $("#applyNote");
    var ok = true;
    [jn, je, jr, jp].forEach(function (f) {
      var v = f.value.trim();
      var valid = v !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) && (f.type !== "url" || /^https?:\/\//i.test(v));
      f.parentElement.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) { jnote.className = "form-note err"; jnote.textContent = "Please fill in name, email, role and a portfolio link starting with http."; return; }
    var subjectText = "Application: " + jr.value.trim() + " - " + jn.value.trim();
    var bodyText = "Role: " + jr.value.trim() + "\nPortfolio: " + jp.value.trim() + "\nExperience: " + ($("#apExp").value || "-") + "\nSoftware: " + ($("#apTools").value.trim() || "-") + "\n\n" + jm.value.trim() + "\n\n— " + jn.value.trim() + " (" + je.value.trim() + ")";
    var payload = { _subject: subjectText, name: jn.value.trim(), email: je.value.trim(), role: jr.value.trim(), portfolio: jp.value.trim(), experience: $("#apExp").value, software: $("#apTools").value.trim(), message: jm.value.trim() };
    sendForm(jobForm, jnote, payload, "application_sent", "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subjectText) + "&body=" + encodeURIComponent(bodyText));
  });

  /* ------------------------------------------------------------------
     Hero visual — random portfolio pieces on every load, each card
     framed to that image's real aspect ratio (no cropping/cutting)
     ------------------------------------------------------------------ */
  var heroVisual = $(".hero-visual");
  if (heroVisual && PROJECTS.length) {
    var heroSlots = [
      { el: $(".hero-card--main", heroVisual), eager: true },
      { el: $(".hero-card--a", heroVisual), eager: false },
      { el: $(".hero-card--b", heroVisual), eager: false }
    ].filter(function (s) { return s.el; });

    var heroPool = PROJECTS.filter(function (p) { return p.i && p.w && p.h; })
      .sort(function () { return Math.random() - 0.5; });

    heroSlots.forEach(function (slot, i) {
      var p = heroPool[i % heroPool.length];
      if (!p) return;
      var img = $("img", slot.el), tag = $(".hero-card-tag", slot.el);
      if (img) { img.src = p.i; img.alt = p.t; img.loading = slot.eager ? "eager" : "lazy"; }
      if (tag) tag.textContent = CAT[p.c] || p.t;
      slot.el.style.aspectRatio = p.w + " / " + p.h;
    });

    /* Cluster the cards tightly regardless of each image's height: chain
       card A off the main card's real bottom, and card B off card A's,
       instead of relying on fixed percentages tuned for one aspect ratio.
       Desktop layout only — the mobile breakpoint uses its own square grid. */
    if (window.innerWidth > 900) {
      var mainEl = heroSlots[0] && heroSlots[0].el;
      var aEl = heroSlots[1] && heroSlots[1].el;
      var bEl = heroSlots[2] && heroSlots[2].el;
      if (mainEl) {
        var vTop = heroVisual.getBoundingClientRect().top;
        var mTop = mainEl.getBoundingClientRect().top - vTop;
        var mHeight = mainEl.getBoundingClientRect().height;
        var bottomMost = mTop + mHeight;

        if (aEl) {
          var aTop = mTop + mHeight * 0.4;
          aEl.style.top = aTop + "px";
          aEl.style.bottom = "auto";
          var aHeight = aEl.getBoundingClientRect().height;
          bottomMost = Math.max(bottomMost, aTop + aHeight);

          if (bEl) {
            var bTop = aTop + aHeight * 0.5;
            bEl.style.top = bTop + "px";
            bEl.style.bottom = "auto";
            bottomMost = Math.max(bottomMost, bTop + bEl.getBoundingClientRect().height);
          }
        } else if (bEl) {
          var bTopAlt = mTop + mHeight * 0.5;
          bEl.style.top = bTopAlt + "px";
          bEl.style.bottom = "auto";
          bottomMost = Math.max(bottomMost, bTopAlt + bEl.getBoundingClientRect().height);
        }

        heroVisual.style.minHeight = Math.ceil(bottomMost + 24) + "px";
      }
    }
  }

  /* ------------------------------------------------------------------
     Team grid (team.html only) — rendered from data/team.json
     ------------------------------------------------------------------ */
  var teamGrid = $("#teamGrid");
  if (teamGrid && TEAM.length) {
    teamGrid.innerHTML = TEAM.map(function (m) {
      var photo = m.photo ? '<img src="' + m.photo + '" alt="' + esc(m.name) + '" loading="lazy" />' : "";
      var tags = (m.tags || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      var links = (m.links || []).map(function (l) {
        var href = normalizeUrl(l.url);
        var external = /^https?:\/\//i.test(href);
        return '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + esc(l.label) + "</a>";
      }).join("");
      return (
        '<article class="team-card reveal">' +
          '<div class="team-photo" data-initials="' + esc(m.initials || "") + '">' + photo + '</div>' +
          '<div class="team-body">' +
            "<h3>" + esc(m.name) + "</h3>" +
            '<span class="team-role">' + esc(m.role || "") + "</span>" +
            "<p>" + esc(m.bio || "") + "</p>" +
            (tags ? '<ul class="team-tags">' + tags + "</ul>" : "") +
            (links ? '<div class="team-links">' + links + "</div>" : "") +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  /* ------------------------------------------------------------------
     Footer year + late reveal pass for elements rendered above
     ------------------------------------------------------------------ */
  $$("#year, .year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  watchReveals();
})();
