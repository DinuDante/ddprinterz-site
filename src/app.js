/* DDPrinterZ site behaviour.
   Inlined into every page by build.js, so there is no separate request that can
   404 and silently disable navigation. Every feature degrades to working HTML
   if this script never runs. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme */
  var THEME_KEY = "ddprinterz-theme";
  var toggle = document.querySelector(".theme-toggle");
  var metaTheme = document.querySelector('meta[name="theme-color"]');

  function store(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) {
      /* private mode or blocked storage: the choice simply does not persist */
    }
  }

  function syncTheme() {
    var isDay = root.dataset.theme === "day";
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDay));
      toggle.setAttribute(
        "aria-label",
        isDay ? "Switch to dark theme" : "Switch to light theme",
      );
    }
    if (metaTheme) metaTheme.setAttribute("content", isDay ? "#fbfbf9" : "#0f1311");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.dataset.theme === "day" ? "night" : "day";
      root.dataset.theme = next;
      store(next);
      syncTheme();
    });
  }
  syncTheme();

  /* ----------------------------------------------------------------- menu */
  var menuBtn = document.querySelector(".menu-btn");
  var navLinks = document.getElementById("nav-links");
  var MENU_QUERY = window.matchMedia("(max-width: 900px)");

  function setMenu(open) {
    if (!menuBtn || !navLinks) return;
    navLinks.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      setMenu(!navLinks.classList.contains("is-open"));
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });

    /* Leaving the narrow layout must never strand the page in menu state. */
    var onChange = function (event) {
      if (!event.matches) setMenu(false);
    };
    if (MENU_QUERY.addEventListener) MENU_QUERY.addEventListener("change", onChange);
    else if (MENU_QUERY.addListener) MENU_QUERY.addListener(onChange);
  }

  /* ---------------------------------------------------------------- video
     Poster-first: the YouTube player is only requested when someone asks to
     watch, which also means no third-party request on page load. */
  document.querySelectorAll(".video-play").forEach(function (button) {
    button.addEventListener("click", function () {
      var frame = button.closest(".video-frame");
      var id = button.getAttribute("data-video-id");
      var title = button.getAttribute("data-video-title") || "DDPrinterZ video";
      if (!frame || !id) return;
      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0&playsinline=1";
      iframe.title = title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "eager");
      frame.innerHTML = "";
      frame.appendChild(iframe);
      iframe.focus();
    });
  });

  /* ------------------------------------------------------------- lightbox */
  var lightbox = document.getElementById("lightbox");
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile[data-full]"));

  if (lightbox && tiles.length && typeof lightbox.showModal === "function") {
    var lbImg = document.getElementById("lb-img");
    var lbTitle = document.getElementById("lb-title");
    var lbCaption = document.getElementById("lb-caption");
    var lbCount = document.getElementById("lb-count");
    var lbEnquire = document.getElementById("lb-enquire");
    var lbOpenFull = document.getElementById("lb-open-full");
    var lbPrev = lightbox.querySelector(".lightbox__nav--prev");
    var lbNext = lightbox.querySelector(".lightbox__nav--next");
    var lbClose = lightbox.querySelector(".lightbox__close");
    var index = 0;
    var opener = null;
    var lockedY = 0;

    function show(i) {
      index = (i + tiles.length) % tiles.length;
      var tile = tiles[index];
      lbImg.src = tile.getAttribute("data-full");
      lbImg.alt = tile.getAttribute("data-alt") || "";
      lbTitle.textContent = tile.getAttribute("data-title") || "";
      lbCaption.textContent = tile.getAttribute("data-caption") || "";
      lbCount.textContent = index + 1 + " of " + tiles.length;
      lbEnquire.href = tile.getAttribute("data-enquiry") || lbEnquire.href;
      lbOpenFull.href = tile.getAttribute("data-full");
    }

    function lockScroll() {
      lockedY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = "fixed";
      document.body.style.top = -lockedY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
    }

    function unlockScroll() {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      /* 'instant' overrides the page's smooth scroll-behavior, so the visitor
       * lands exactly where they were instead of watching the page fly back. */
      window.scrollTo({ top: lockedY, left: 0, behavior: 'instant' });
    }

    function open(i, trigger) {
      opener = trigger || null;
      show(i);
      lockScroll();
      lightbox.showModal();
      if (lbClose) lbClose.focus();
    }

    tiles.forEach(function (tile, i) {
      tile.addEventListener("click", function (event) {
        /* Let modified clicks open the raw image the way the user asked. */
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        open(i, tile);
      });
    });

    if (lbPrev)
      lbPrev.addEventListener("click", function () {
        show(index - 1);
      });
    if (lbNext)
      lbNext.addEventListener("click", function () {
        show(index + 1);
      });
    if (lbClose)
      lbClose.addEventListener("click", function () {
        lightbox.close();
      });

    lightbox.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
      }
    });

    /* Clicking the backdrop closes, without swallowing clicks on the dialog. */
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) lightbox.close();
    });

    /* Fires for the close button, the backdrop and Escape alike. */
    lightbox.addEventListener("close", function () {
      unlockScroll();
      lbImg.src = "";
      if (opener) {
        /* preventScroll matters: focusing the trigger would otherwise scroll it
         * into view and undo the scroll position we just restored. */
        opener.focus({ preventScroll: true });
        opener = null;
      }
    });

    /* Touch is an addition to the buttons, never the only way to navigate. */
    var touchX = null;
    var touchY = null;
    var stage = lightbox.querySelector(".lightbox__stage");
    if (stage) {
      stage.addEventListener(
        "touchstart",
        function (event) {
          touchX = event.changedTouches[0].clientX;
          touchY = event.changedTouches[0].clientY;
        },
        { passive: true },
      );
      stage.addEventListener(
        "touchend",
        function (event) {
          if (touchX === null) return;
          var dx = event.changedTouches[0].clientX - touchX;
          var dy = event.changedTouches[0].clientY - touchY;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
          touchX = null;
          touchY = null;
        },
        { passive: true },
      );
    }
  }

  /* ------------------------------------------------------------ hash targets
     Safety net for browsers that restore a fragment before the sticky header
     is laid out. Only corrects a target actually hidden under the header. */
  function correctHash() {
    if (!location.hash || location.hash.length < 2) return;
    var target;
    try {
      target = document.querySelector(location.hash);
    } catch (e) {
      return;
    }
    if (!target) return;
    var nav = document.querySelector(".site-nav");
    var offset = (nav ? nav.getBoundingClientRect().height : 0) + 24;
    if (target.getBoundingClientRect().top < offset) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: "auto",
      });
    }
  }

  window.addEventListener("load", function () {
    window.setTimeout(correctHash, 0);
  });
  window.addEventListener("hashchange", correctHash);
})();
