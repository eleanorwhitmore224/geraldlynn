// js/main.js
// ==========================================================================
// Gerald Lynn Author Website — Core Initialization & Utilities
// ==========================================================================
// This file bootstraps the entire site. It reads SITE_CONFIG, wires up
// config-driven links, assembles the contact email at runtime (never in HTML),
// lazy-loads YouTube iframes, injects the footer year, and provides a shared
// utility belt used by animations.js and forms.js.
// ==========================================================================

"use strict";

/* --------------------------------------------------------------------------
   1. SITE CONFIGURATION
   -------------------------------------------------------------------------- */

/**
 * SITE_CONFIG is the single source of truth for every external URL, embed ID,
 * and third-party endpoint on the site. Gerald (or his webmaster) edits only
 * this object when links change.
 */
const SITE_CONFIG = {
  // --- Book purchase links ---
  kindleUrl: "https://www.amazon.com/dp/B0FXCZVW2J",
  paperbackUrl: "https://www.amazon.com/dp/B0FXDBZVSS",
  hardcoverUrl: "",
  audibleUrl: "https://www.audible.com/pd/Surviving-the-US-Healthcare-System-Audiobook/B0GWP8TRR7",
  barnesAndNobleUrl: "https://www.barnesandnoble.com/w/surviving-the-us-healthcare-system-gerald-lynn-c-m-r/1148602416?ean=9798349539831",
  goodreadsUrl: "https://www.goodreads.com/author/show/60993565.Gerald_Lynn_C_M_R_",

  // --- Social media ---
  instagramUrl: "https://www.instagram.com/geraldlynn.author/",
  facebookUrl: "https://www.facebook.com/p/Gerald-Lynn-61577333356109/",
  linkedinUrl: "https://www.linkedin.com/in/gerald-lynn-c-m-r-1866a930",
  youtubeChannelUrl: "",
  tiktokUrl: "https://www.tiktok.com/@glynnauthor",
  threadsUrl: "",
  xUrl: "",

  // --- Podcasts ---
  podcastPart1Url: "https://podcasts.apple.com/us/podcast/part-1-close-up-radio-spotlights-author-and/id1785721253?i=1000750425249",
  podcastPart2Url: "https://podcasts.apple.com/us/podcast/part-2-close-up-radio-welcomes-back-author-and/id1785721253?i=1000751740658",
  spotifyUrl: "https://open.spotify.com/show/4fDHQi94ECA6DVtHlfaV9l",

  // --- Media embeds ---
  youtubeId: "ryNH-6sWdOk",
  audioSampleUrl: "",

  // --- Author pages ---
  amazonAuthorUrl: "",

  // --- Forms ---
  formEndpoint: "https://formspree.io/f/mdeejpdq",

  // --- Branding ---
  logoReady: false,
  siteName: "Gerald Lynn, C.M.R.",
  bookTitle: "Surviving the U.S. Healthcare System: the Patient's Playbook",
  canonicalBase: "https://authorgeraldlynn.com/",

  // --- Contact (assembled at runtime, never exposed in HTML) ---
  _emailUser: "geraldlynnauthor44",
  _emailDomain: "gmail.com",

  // --- Feature flags ---
  enableReadingProgress: true,
  enableBackToTop: true,
  enableSmoothScroll: true,
  enableExternalLinkSecurity: true,
  enableLazyImages: true,
  enableConsoleBranding: true
};

/* --------------------------------------------------------------------------
   2. UTILITY BELT
   -------------------------------------------------------------------------- */

function qs(selector, ctx) {
  const root = ctx || document;
  return root.querySelector(selector);
}

function qsa(selector, ctx) {
  const root = ctx || document;
  return Array.from(root.querySelectorAll(selector));
}

function on(el, event, fn, opts) {
  if (!el) return;
  el.addEventListener(event, fn, opts || false);
}

function off(el, event, fn) {
  if (!el) return;
  el.removeEventListener(event, fn);
}

function throttle(fn, limit) {
  let waiting = false;
  let lastArgs = null;
  let lastThis = null;

  return function throttled() {
    if (!waiting) {
      fn.apply(this, arguments);
      waiting = true;
      setTimeout(function () {
        waiting = false;
        if (lastArgs) {
          throttled.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else {
      lastArgs = arguments;
      lastThis = this;
    }
  };
}

function debounce(fn, delay) {
  let timer = null;
  return function debounced() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function uid(prefix) {
  const p = prefix || "gl";
  return p + "-" + Math.random().toString(36).substring(2, 9);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function isInViewport(el, offset) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const o = offset || 0;
  return (
    rect.top >= -o &&
    rect.left >= -o &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + o &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + o
  );
}

function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || 0
  };
}

function getDocHeight() {
  return Math.max(
    document.body.scrollHeight || 0,
    document.documentElement.scrollHeight || 0,
    document.body.offsetHeight || 0,
    document.documentElement.offsetHeight || 0,
    document.body.clientHeight || 0,
    document.documentElement.clientHeight || 0
  );
}

function getCurrentPage() {
  const path = window.location.pathname;
  if (path === "/" || path === "/index.html" || path === "") {
    return "home";
  }
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "home";
  return segments[0];
}

function buildCanonicalUrl(relativePath) {
  const base = SITE_CONFIG.canonicalBase.replace(/\/$/, "");
  const clean = relativePath.replace(/^\//, "");
  return base + "/" + clean;
}

/* --------------------------------------------------------------------------
   3. RUNTIME EMAIL ASSEMBLY
   -------------------------------------------------------------------------- */

function assembleEmail() {
  const user = SITE_CONFIG._emailUser;
  const domain = SITE_CONFIG._emailDomain;
  if (!user || !domain) return "";
  return user + "@" + domain;
}

function injectEmailAddresses() {
  const email = assembleEmail();
  if (!email) return;

  const textTargets = qsa("[data-email]");
  textTargets.forEach(function (el) {
    el.textContent = email;
  });

  const mailtoTargets = qsa("[data-mailto]");
  mailtoTargets.forEach(function (el) {
    const subject = el.getAttribute("data-subject") || "";
    let href = "mailto:" + email;
    if (subject) {
      href += "?subject=" + encodeURIComponent(subject);
    }
    el.setAttribute("href", href);
  });
}

/* --------------------------------------------------------------------------
   4. CONFIG-DRIVEN LINK MANAGEMENT
   -------------------------------------------------------------------------- */

function applyConfigLinks() {
  const configElements = qsa("[data-config]");

  configElements.forEach(function (el) {
    const key = el.getAttribute("data-config");
    if (!key || !(key in SITE_CONFIG)) return;

    const value = SITE_CONFIG[key];
    const tagName = el.tagName.toLowerCase();

    if (!value || value === "") {
      el.setAttribute("hidden", "");
      el.style.display = "none";
      const group = el.closest(".config-group");
      if (group) {
        group.setAttribute("hidden", "");
        group.style.display = "none";
      }
      return;
    }

    if (tagName === "a") {
      el.setAttribute("href", value);
    } else if (tagName === "img") {
      el.setAttribute("src", value);
    } else if (tagName === "source") {
      el.setAttribute("srcset", value);
    } else {
      el.textContent = value;
    }

    el.removeAttribute("hidden");
    el.style.display = "";
    const group = el.closest(".config-group");
    if (group) {
      group.removeAttribute("hidden");
      group.style.display = "";
    }
  });
}

/* --------------------------------------------------------------------------
   5. YOUTUBE LAZY IFRAME LOADER
   -------------------------------------------------------------------------- */

function initYouTubeLazy() {
  const containers = qsa("[data-youtube]");
  if (containers.length === 0) return;

  const configVideoId = SITE_CONFIG.youtubeId;

  containers.forEach(function (container) {
    const videoId = configVideoId || container.getAttribute("data-video-id");

    if (!videoId) {
      container.style.display = "none";
      const fallback = container.querySelector(".video-fallback");
      if (fallback) {
        fallback.style.display = "";
        fallback.removeAttribute("hidden");
      }
      return;
    }

    const thumb = container.querySelector("img");
    if (thumb && !thumb.getAttribute("src")) {
      thumb.setAttribute("src", "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg");
      thumb.setAttribute("alt", "Video thumbnail");
    }

    const playBtn = container.querySelector(".video-play-btn") || container;

    on(playBtn, "click", function handlePlay() {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("width", "100%");
      iframe.setAttribute("height", "100%");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.setAttribute("src", "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0&modestbranding=1");
      iframe.setAttribute("title", "YouTube video player");

      container.innerHTML = "";
      container.appendChild(iframe);
      container.classList.add("video-active");

      off(playBtn, "click", handlePlay);
    });
  });
}

/* --------------------------------------------------------------------------
   6. FOOTER YEAR INJECTION
   -------------------------------------------------------------------------- */

function injectFooterYear() {
  const year = new Date().getFullYear();
  const yearSpans = qsa(".js-year");
  yearSpans.forEach(function (el) {
    el.textContent = year;
  });
}

/* --------------------------------------------------------------------------
   7. SMOOTH SCROLL FOR ANCHOR LINKS
   -------------------------------------------------------------------------- */

function initSmoothScroll() {
  if (!SITE_CONFIG.enableSmoothScroll) return;
  if (prefersReducedMotion()) return;

  on(document, "click", function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = qs(hash);
    if (!target) return;

    e.preventDefault();

    const header = qs(".site-header");
    const headerHeight = header ? header.offsetHeight : 0;
    const extraGap = 20;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const scrollTarget = targetTop - headerHeight - extraGap;

    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth"
    });

    if (history.pushState) {
      history.pushState(null, null, hash);
    }

    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

/* --------------------------------------------------------------------------
   8. ACTIVE NAV HIGHLIGHTING
   -------------------------------------------------------------------------- */

function highlightActiveNav() {
  const currentPage = getCurrentPage();
  const navLinks = qsa(".nav__link, .nav-link");

  navLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    let linkPage = "";

    if (href === "/" || href === "/index.html" || href === "index.html" || href === "../index.html") {
      linkPage = "home";
    } else {
      const segments = href.split("/").filter(Boolean);
      if (segments[segments.length - 1] === "index.html") {
        linkPage = segments.length > 1 ? segments[segments.length - 2] : "home";
      } else {
        linkPage = segments[0] || "home";
      }
      if (linkPage === "..") linkPage = "home";
    }

    if (linkPage === currentPage) {
      link.classList.add("nav__link--active", "is-active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("nav__link--active", "is-active");
      link.removeAttribute("aria-current");
    }
  });
}

/* --------------------------------------------------------------------------
   9. BACK-TO-TOP BUTTON
   -------------------------------------------------------------------------- */

function initBackToTop() {
  if (!SITE_CONFIG.enableBackToTop) return;

  const btn = qs(".back-to-top");
  if (!btn) return;

  const showThreshold = 600;

  const handleScroll = throttle(function () {
    const scrollY = getScrollPosition().y;
    if (scrollY > showThreshold) {
      btn.classList.add("back-to-top--visible");
      btn.removeAttribute("hidden");
    } else {
      btn.classList.remove("back-to-top--visible");
      btn.setAttribute("hidden", "");
    }
  }, 150);

  on(window, "scroll", handleScroll, { passive: true });

  on(btn, "click", function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
    const skipLink = qs(".skip-link");
    if (skipLink) skipLink.focus();
  });
}

/* --------------------------------------------------------------------------
   10. READING PROGRESS BAR
   -------------------------------------------------------------------------- */

function initReadingProgress() {
  if (!SITE_CONFIG.enableReadingProgress) return;

  const bar = qs(".reading-progress");
  if (!bar) return;

  const docHeight = getDocHeight();
  const viewportHeight = window.innerHeight;
  if (docHeight < viewportHeight * 2) {
    bar.style.display = "none";
    return;
  }

  const handleScroll = throttle(function () {
    const scrollY = getScrollPosition().y;
    const maxScroll = docHeight - viewportHeight;
    if (maxScroll <= 0) return;

    const progress = clamp((scrollY / maxScroll) * 100, 0, 100);
    bar.style.width = progress + "%";
  }, 50);

  on(window, "scroll", handleScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   11. EXTERNAL LINK SECURITY
   -------------------------------------------------------------------------- */

function secureExternalLinks() {
  if (!SITE_CONFIG.enableExternalLinkSecurity) return;

  const allLinks = qsa("a[href]");
  const currentHost = window.location.hostname;

  allLinks.forEach(function (link) {
    const href = link.getAttribute("href");
    if (!href) return;

    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      href.startsWith("/")
    ) {
      return;
    }

    try {
      const url = new URL(href, window.location.origin);
      if (url.hostname !== currentHost) {
        link.setAttribute("target", "_blank");
        const existingRel = link.getAttribute("rel") || "";
        const relParts = existingRel.split(/\s+/).filter(Boolean);

        if (!relParts.includes("noopener")) relParts.push("noopener");
        if (!relParts.includes("noreferrer")) relParts.push("noreferrer");

        link.setAttribute("rel", relParts.join(" "));
      }
    } catch (err) {
      // Invalid URL, skip
    }
  });
}

/* --------------------------------------------------------------------------
   12. LAZY IMAGE ENHANCEMENT
   -------------------------------------------------------------------------- */

function initLazyImages() {
  if (!SITE_CONFIG.enableLazyImages) return;

  const images = qsa("img[loading='lazy']");
  if (images.length === 0) return;

  const nativeLazy = "loading" in HTMLImageElement.prototype;

  if (nativeLazy) {
    images.forEach(function (img) {
      if (img.complete) {
        img.classList.add("img-loaded");
      } else {
        on(img, "load", function () { img.classList.add("img-loaded"); });
        on(img, "error", function () { img.classList.add("img-error"); });
      }
    });
  } else {
    if (!("IntersectionObserver" in window)) {
      images.forEach(function (img) { img.classList.add("img-loaded"); });
      return;
    }

    const imgObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute("data-src");
            if (dataSrc) {
              img.setAttribute("src", dataSrc);
              img.removeAttribute("data-src");
            }
            on(img, "load", function () { img.classList.add("img-loaded"); });
            imgObserver.unobserve(img);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    images.forEach(function (img) { imgObserver.observe(img); });
  }
}

/* --------------------------------------------------------------------------
   13. FOCUS MANAGEMENT & SKIP LINK
   -------------------------------------------------------------------------- */

function initFocusManagement() {
  const skipLink = qs(".skip-link");
  if (!skipLink) return;

  on(skipLink, "click", function (e) {
    const targetId = skipLink.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = qs(targetId);
    if (!target) return;

    e.preventDefault();
    target.setAttribute("tabindex", "-1");
    target.focus();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  on(document, "blur", function (e) {
    if (e.target && e.target.getAttribute("tabindex") === "-1") {
      setTimeout(function () {
        if (e.target !== document.activeElement) {
          e.target.removeAttribute("tabindex");
        }
      }, 100);
    }
  }, true);
}

/* --------------------------------------------------------------------------
   14. CONSOLE BRANDING
   -------------------------------------------------------------------------- */

function printConsoleBranding() {
  if (!SITE_CONFIG.enableConsoleBranding) return;
  if (typeof console === "undefined") return;

  const styles = [
    "color: #D9892B",
    "font-size: 14px",
    "font-weight: bold",
    "font-family: Georgia, serif"
  ].join(";");

  console.log(
    "%c Gerald Lynn, C.M.R. %c Author Website ",
    styles,
    "color: #0B1A33; font-size: 12px;"
  );
  console.log("Built with plain HTML, CSS, and vanilla JavaScript. No frameworks.");
}

/* --------------------------------------------------------------------------
   15. CANONICAL URL MANAGEMENT
   -------------------------------------------------------------------------- */

function updateCanonical() {
  const canonical = qs('link[rel="canonical"]');
  if (!canonical) return;

  const path = window.location.pathname;
  const fullUrl = buildCanonicalUrl(path);
  canonical.setAttribute("href", fullUrl);
}

/* --------------------------------------------------------------------------
   16. PREFERS-COLOR-SCHEME DETECTION
   -------------------------------------------------------------------------- */

function detectColorScheme() {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  function applyScheme(e) {
    if (e.matches) {
      document.body.classList.add("prefers-dark");
    } else {
      document.body.classList.remove("prefers-dark");
    }
  }

  applyScheme(mql);

  if (mql.addEventListener) {
    mql.addEventListener("change", applyScheme);
  } else if (mql.addListener) {
    mql.addListener(applyScheme);
  }
}

/* --------------------------------------------------------------------------
   17. VIEWPORT HEIGHT FIX (MOBILE)
   -------------------------------------------------------------------------- */

function fixViewportHeight() {
  const setVH = function () {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  };

  setVH();
  on(window, "resize", debounce(setVH, 100));
  on(window, "orientationchange", function () { setTimeout(setVH, 200); });
}

/* --------------------------------------------------------------------------
   18. TOUCH DEVICE DETECTION
   -------------------------------------------------------------------------- */

function detectTouchDevice() {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  if (isTouch) {
    document.body.classList.add("is-touch");
  } else {
    document.body.classList.add("is-no-touch");
  }
}

/* --------------------------------------------------------------------------
   19. PAGE LOAD CLASS
   -------------------------------------------------------------------------- */

function markPageLoaded() {
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("page-loaded");
    });
  });
}

/* --------------------------------------------------------------------------
   20. PRINT HELPERS
   -------------------------------------------------------------------------- */

function initPrintHelpers() {
  const printBtn = qs(".js-print");
  if (printBtn) {
    on(printBtn, "click", function (e) {
      e.preventDefault();
      window.print();
    });
  }

  on(window, "beforeprint", function () { document.body.classList.add("is-printing"); });
  on(window, "afterprint", function () { document.body.classList.remove("is-printing"); });
}

/* --------------------------------------------------------------------------
   21. PERFORMANCE MARKS
   -------------------------------------------------------------------------- */

function recordPerformanceMarks() {
  if (!window.performance || !performance.mark) return;
  try { performance.mark("gl-main-init-start"); } catch (e) {}
}

function recordPerformanceEnd() {
  if (!window.performance || !performance.mark) return;
  try {
    performance.mark("gl-main-init-end");
    performance.measure("gl-main-init", "gl-main-init-start", "gl-main-init-end");
  } catch (e) {}
}

/* --------------------------------------------------------------------------
   22. ERROR BOUNDARY
   -------------------------------------------------------------------------- */

function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error("[Gerald Lynn Site] Error in " + name + ":", err);
  }
}

/* --------------------------------------------------------------------------
   23. MAIN INITIALIZATION
   -------------------------------------------------------------------------- */

function initSite() {
  recordPerformanceMarks();

  safeInit("viewport-height", fixViewportHeight);
  safeInit("touch-detection", detectTouchDevice);
  safeInit("color-scheme", detectColorScheme);
  safeInit("footer-year", injectFooterYear);
  safeInit("email-assembly", injectEmailAddresses);

  safeInit("config-links", applyConfigLinks);
  safeInit("canonical", updateCanonical);

  safeInit("active-nav", highlightActiveNav);
  safeInit("smooth-scroll", initSmoothScroll);
  safeInit("back-to-top", initBackToTop);
  safeInit("reading-progress", initReadingProgress);

  safeInit("youtube-lazy", initYouTubeLazy);
  safeInit("lazy-images", initLazyImages);
  safeInit("external-links", secureExternalLinks);

  safeInit("focus-management", initFocusManagement);
  safeInit("print-helpers", initPrintHelpers);
  safeInit("page-loaded", markPageLoaded);
  safeInit("console-branding", printConsoleBranding);

  recordPerformanceEnd();
}

/* --------------------------------------------------------------------------
   24. BOOT
   -------------------------------------------------------------------------- */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}

on(window, "pageshow", function (e) {
  if (e.persisted) {
    safeInit("active-nav-resume", highlightActiveNav);
    safeInit("footer-year-resume", injectFooterYear);
  }
});
