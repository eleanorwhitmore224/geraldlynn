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
 *
 * HOW TO CONNECT FORMSPREE:
 *   1. Go to https://formspree.io and create a free account.
 *   2. Create a new form and copy the endpoint URL it gives you.
 *   3. Paste that URL into formEndpoint below, between the quotes.
 *   4. Save and upload. The contact and newsletter forms will start working.
 *
 * HOW TO ADD YOUTUBE:
 *   1. Upload a video to YouTube (or use an existing one).
 *   2. Copy the video ID (the part after "v=" in the URL).
 *   3. Paste it into youtubeId below.
 *   4. Any element with data-config="youtube" will become a lazy iframe.
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
  tiktokUrl: "",
  threadsUrl: "",
  xUrl: "",

  // --- Podcasts ---
  podcastPart1Url: "https://podcasts.apple.com/us/podcast/part-1-close-up-radio-spotlights-author-and/id1785721253?i=1000750425249",
  podcastPart2Url: "https://podcasts.apple.com/us/podcast/part-2-close-up-radio-welcomes-back-author-and/id1785721253?i=1000751740658",
  spotifyUrl: "",

  // --- Media embeds ---
  youtubeId: "",
  audioSampleUrl: "",

  // --- Author pages ---
  amazonAuthorUrl: "",

  // --- Forms ---
  // Paste your Formspree endpoint URL here, e.g. "https://formspree.io/f/xBbCcC"
  formEndpoint: "",

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

/**
 * Shorthand querySelector. Returns the first matching element or null.
 * @param {string} selector - CSS selector
 * @param {Element|Document} [ctx=document] - Context to search within
 * @returns {Element|null}
 */
function qs(selector, ctx) {
  const root = ctx || document;
  return root.querySelector(selector);
}

/**
 * Shorthand querySelectorAll. Returns a real Array (not NodeList).
 * @param {string} selector - CSS selector
 * @param {Element|Document} [ctx=document] - Context to search within
 * @returns {Element[]}
 */
function qsa(selector, ctx) {
  const root = ctx || document;
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Add an event listener with optional options.
 * @param {Element|Window|Document} el - Target element
 * @param {string} event - Event name
 * @param {Function} fn - Handler
 * @param {Object} [opts] - addEventListener options
 */
function on(el, event, fn, opts) {
  if (!el) return;
  el.addEventListener(event, fn, opts || false);
}

/**
 * Remove an event listener.
 * @param {Element|Window|Document} el - Target element
 * @param {string} event - Event name
 * @param {Function} fn - Handler
 */
function off(el, event, fn) {
  if (!el) return;
  el.removeEventListener(event, fn);
}

/**
 * Throttle a function so it fires at most once every `limit` ms.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum interval in milliseconds
 * @returns {Function}
 */
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

/**
 * Debounce a function so it only fires after `delay` ms of inactivity.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
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

/**
 * Check if the user prefers reduced motion.
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Generate a unique ID string.
 * @param {string} [prefix="gl"] - Prefix for the ID
 * @returns {string}
 */
function uid(prefix) {
  const p = prefix || "gl";
  return p + "-" + Math.random().toString(36).substring(2, 9);
}

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Linear interpolation between two values.
 * @param {number} a - Start
 * @param {number} b - End
 * @param {number} t - Progress (0 to 1)
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Check if an element is in the viewport.
 * @param {Element} el
 * @param {number} [offset=0] - Extra pixels of tolerance
 * @returns {boolean}
 */
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

/**
 * Get the current scroll position, cross-browser.
 * @returns {{ x: number, y: number }}
 */
function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || 0
  };
}

/**
 * Get the document height.
 * @returns {number}
 */
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

/**
 * Determine which page we are on based on the URL path.
 * Returns a slug like "home", "about", "author", etc.
 * @returns {string}
 */
function getCurrentPage() {
  const path = window.location.pathname;
  if (path === "/" || path === "/index.html" || path === "") {
    return "home";
  }
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "home";
  return segments[0];
}

/**
 * Build a full URL from a relative path using the canonical base.
 * @param {string} relativePath
 * @returns {string}
 */
function buildCanonicalUrl(relativePath) {
  const base = SITE_CONFIG.canonicalBase.replace(/\/$/, "");
  const clean = relativePath.replace(/^\//, "");
  return base + "/" + clean;
}

/* --------------------------------------------------------------------------
   3. RUNTIME EMAIL ASSEMBLY
   -------------------------------------------------------------------------- */

/**
 * Assemble the contact email from its parts. The email is never written as a
 * single string in the HTML source, which makes it harder for spam bots to
 * harvest. This function reconstructs it at runtime.
 *
 * @returns {string} The full email address
 */
function assembleEmail() {
  const user = SITE_CONFIG._emailUser;
  const domain = SITE_CONFIG._emailDomain;
  if (!user || !domain) return "";
  return user + "@" + domain;
}

/**
 * Find every element with data-email="true" and populate it with the
 * assembled email address. This includes both the visible text and the
 * href attribute (for mailto links).
 */
function injectEmailAddresses() {
  const email = assembleEmail();
  if (!email) return;

  // Text nodes: <span data-email="true"></span>
  const textTargets = qsa("[data-email]");
  textTargets.forEach(function (el) {
    el.textContent = email;
  });

  // Mailto links: <a data-mailto="true" href="#"></a>
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

/**
 * Walk the DOM for elements with data-config attributes and populate their
 * href, src, or text content from SITE_CONFIG. If the config value is empty,
 * hide the element gracefully instead of linking to a dead URL.
 *
 * Supported data-config values map directly to SITE_CONFIG keys:
 *   data-config="kindleUrl"
 *   data-config="youtubeId"
 *   etc.
 *
 * Special behaviors:
 *   - On <a> tags: sets href. Hides if value is empty.
 *   - On <iframe> or [data-youtube]: handled separately by the YouTube loader.
 *   - On any other element: sets textContent. Hides if value is empty.
 */
function applyConfigLinks() {
  const configElements = qsa("[data-config]");

  configElements.forEach(function (el) {
    const key = el.getAttribute("data-config");
    if (!key || !(key in SITE_CONFIG)) return;

    const value = SITE_CONFIG[key];
    const tagName = el.tagName.toLowerCase();

    // If the value is empty, hide the element and its nearest .config-group
    if (!value || value === "") {
      el.setAttribute("hidden", "");
      el.style.display = "none";

      // Also hide parent wrapper if it exists
      const group = el.closest(".config-group");
      if (group) {
        group.setAttribute("hidden", "");
        group.style.display = "none";
      }
      return;
    }

    // Apply the value based on element type
    if (tagName === "a") {
      el.setAttribute("href", value);
    } else if (tagName === "img") {
      el.setAttribute("src", value);
    } else if (tagName === "source") {
      el.setAttribute("srcset", value);
    } else {
      el.textContent = value;
    }

    // Make sure the element is visible
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

/**
 * Find elements marked with data-youtube and replace them with a lazy-loaded
 * YouTube iframe using the privacy-enhanced domain (youtube-nocookie.com).
 *
 * The element should look like:
 *   <div data-youtube="true" data-video-id="XXXXXXX">
 *     <img src="thumbnail.jpg" alt="Video thumbnail" loading="lazy">
 *     <button class="video-play-btn" aria-label="Play video">Play</button>
 *   </div>
 *
 * If SITE_CONFIG.youtubeId is set, it overrides data-video-id.
 * If youtubeId is empty, the entire container is hidden.
 */
function initYouTubeLazy() {
  const containers = qsa("[data-youtube]");
  if (containers.length === 0) return;

  const configVideoId = SITE_CONFIG.youtubeId;

  containers.forEach(function (container) {
    const videoId = configVideoId || container.getAttribute("data-video-id");

    // No video ID available: hide the container
    if (!videoId) {
      container.style.display = "none";
      const fallback = container.querySelector(".video-fallback");
      if (fallback) {
        fallback.style.display = "";
        fallback.removeAttribute("hidden");
      }
      return;
    }

    // Set the thumbnail if not already set
    const thumb = container.querySelector("img");
    if (thumb && !thumb.getAttribute("src")) {
      thumb.setAttribute("src",
        "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"
      );
      thumb.setAttribute("alt", "Video thumbnail");
    }

    // Listen for click on the play button or the container itself
    const playBtn = container.querySelector(".video-play-btn") || container;

    on(playBtn, "click", function handlePlay() {
      // Build the iframe
      const iframe = document.createElement("iframe");
      iframe.setAttribute("width", "100%");
      iframe.setAttribute("height", "100%");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.setAttribute("src",
        "https://www.youtube-nocookie.com/embed/" +
          videoId +
          "?autoplay=1&rel=0&modestbranding=1"
      );
      iframe.setAttribute("title", "YouTube video player");

      // Replace container contents with the iframe
      container.innerHTML = "";
      container.appendChild(iframe);
      container.classList.add("video-active");

      // Remove the click listener
      off(playBtn, "click", handlePlay);
    });
  });
}

/* --------------------------------------------------------------------------
   6. FOOTER YEAR INJECTION
   -------------------------------------------------------------------------- */

/**
 * Find every element with class "js-year" and set its text to the current
 * year. This keeps the copyright notice up to date automatically.
 */
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

/**
 * Intercept clicks on same-page anchor links (href="#section") and scroll
 * smoothly to the target, accounting for the fixed header height.
 */
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

    // Calculate offset for fixed header
    const header = qs(".site-header");
    const headerHeight = header ? header.offsetHeight : 0;
    const extraGap = 20;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const scrollTarget = targetTop - headerHeight - extraGap;

    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth"
    });

    // Update URL hash without jumping
    if (history.pushState) {
      history.pushState(null, null, hash);
    }

    // Move focus to the target for accessibility
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}

/* --------------------------------------------------------------------------
   8. ACTIVE NAV HIGHLIGHTING
   -------------------------------------------------------------------------- */

/**
 * Highlight the current page in the main navigation by comparing the URL
 * path to each nav link's href.
 */
function highlightActiveNav() {
  const currentPage = getCurrentPage();
  const navLinks = qsa(".nav__link, .nav-link");

  navLinks.forEach(function (link) {
    const href = link.getAttribute("href") || "";
    let linkPage = "";

    // Parse the page slug from the href
    if (href === "/" || href === "/index.html" || href === "index.html" || href === "../index.html") {
      linkPage = "home";
    } else {
      const segments = href.split("/").filter(Boolean);
      // If path ends in index.html, the page is the parent folder
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

/**
 * Show a "Back to top" button when the user scrolls past a threshold.
 * The button element should exist in the HTML with class "back-to-top".
 */
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

    // Move focus to skip link or top of page
    const skipLink = qs(".skip-link");
    if (skipLink) {
      skipLink.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   10. READING PROGRESS BAR
   -------------------------------------------------------------------------- */

/**
 * Display a thin progress bar at the top of the viewport that fills as the
 * user scrolls down long pages (chapters, about, etc.).
 * The bar element should exist in the HTML with class "reading-progress".
 */
function initReadingProgress() {
  if (!SITE_CONFIG.enableReadingProgress) return;

  const bar = qs(".reading-progress");
  if (!bar) return;

  // Only show on long pages
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

/**
 * Automatically add rel="noopener noreferrer" to all external links for
 * security. Also adds target="_blank" if not already present.
 */
function secureExternalLinks() {
  if (!SITE_CONFIG.enableExternalLinkSecurity) return;

  const allLinks = qsa("a[href]");
  const currentHost = window.location.hostname;

  allLinks.forEach(function (link) {
    const href = link.getAttribute("href");
    if (!href) return;

    // Skip internal links, anchors, mailto, tel, javascript
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

/**
 * Enhance native lazy loading with a JS fallback for older browsers and
 * add a fade-in effect when images finish loading.
 */
function initLazyImages() {
  if (!SITE_CONFIG.enableLazyImages) return;

  const images = qsa("img[loading='lazy']");
  if (images.length === 0) return;

  // Check if native lazy loading is supported
  const nativeLazy = "loading" in HTMLImageElement.prototype;

  if (nativeLazy) {
    // Just add fade-in on load
    images.forEach(function (img) {
      if (img.complete) {
        img.classList.add("img-loaded");
      } else {
        on(img, "load", function () {
          img.classList.add("img-loaded");
        });
        on(img, "error", function () {
          img.classList.add("img-error");
        });
      }
    });
  } else {
    // Fallback: use IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      // No IO support: load everything immediately
      images.forEach(function (img) {
        img.classList.add("img-loaded");
      });
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
            on(img, "load", function () {
              img.classList.add("img-loaded");
            });
            imgObserver.unobserve(img);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    images.forEach(function (img) {
      imgObserver.observe(img);
    });
  }
}

/* --------------------------------------------------------------------------
   13. FOCUS MANAGEMENT & SKIP LINK
   -------------------------------------------------------------------------- */

/**
 * Ensure the skip-to-content link works properly and manage focus when
 * navigating between pages or sections.
 */
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

  // Remove tabindex on blur to avoid focus ring on click
  on(document, "blur", function (e) {
    if (e.target && e.target.getAttribute("tabindex") === "-1") {
      // Delay removal so screen readers can still find it
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

/**
 * Print a friendly message in the browser console. Harmless, but a nice
 * touch for developers who inspect the site.
 */
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
  console.log(
    "Built with plain HTML, CSS, and vanilla JavaScript. No frameworks."
  );
}

/* --------------------------------------------------------------------------
   15. CANONICAL URL MANAGEMENT
   -------------------------------------------------------------------------- */

/**
 * Ensure the canonical link tag points to the correct full URL for the
 * current page. This helps with SEO.
 */
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

/**
 * Detect the user's preferred color scheme and add a class to the body.
 * This is a hook for future dark mode support. Currently the site is
 * light-only, but the infrastructure is in place.
 */
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

/**
 * Set a CSS custom property --vh that represents 1% of the real viewport
 * height. This fixes the 100vh issue on mobile browsers where the address
 * bar inflates the viewport.
 */
function fixViewportHeight() {
  const setVH = function () {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", vh + "px");
  };

  setVH();
  on(window, "resize", debounce(setVH, 100));
  on(window, "orientationchange", function () {
    setTimeout(setVH, 200);
  });
}

/* --------------------------------------------------------------------------
   18. TOUCH DEVICE DETECTION
   -------------------------------------------------------------------------- */

/**
 * Add a class to the body if the device supports touch. This allows CSS
 * to adjust hover effects that don't work well on touch screens.
 */
function detectTouchDevice() {
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  if (isTouch) {
    document.body.classList.add("is-touch");
  } else {
    document.body.classList.add("is-no-touch");
  }
}

/* --------------------------------------------------------------------------
   19. PAGE LOAD CLASS
   -------------------------------------------------------------------------- */

/**
 * Add a "page-loaded" class to the body after the initial render. This
 * allows CSS transitions to fire only after the page is ready, preventing
 * a flash of unstyled content.
 */
function markPageLoaded() {
  // Small delay to ensure paint has happened
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.body.classList.add("page-loaded");
    });
  });
}

/* --------------------------------------------------------------------------
   20. PRINT HELPERS
   -------------------------------------------------------------------------- */

/**
 * Add a print button if one exists in the DOM, and handle before/after
 * print events to clean up the page for printing.
 */
function initPrintHelpers() {
  const printBtn = qs(".js-print");
  if (printBtn) {
    on(printBtn, "click", function (e) {
      e.preventDefault();
      window.print();
    });
  }

  on(window, "beforeprint", function () {
    document.body.classList.add("is-printing");
  });

  on(window, "afterprint", function () {
    document.body.classList.remove("is-printing");
  });
}

/* --------------------------------------------------------------------------
   21. PERFORMANCE MARKS
   -------------------------------------------------------------------------- */

/**
 * Record basic performance marks for debugging. These are invisible to
 * users but visible in DevTools Performance tab.
 */
function recordPerformanceMarks() {
  if (!window.performance || !performance.mark) return;

  try {
    performance.mark("gl-main-init-start");
  } catch (e) {
    // Silently fail in older browsers
  }
}

function recordPerformanceEnd() {
  if (!window.performance || !performance.mark) return;

  try {
    performance.mark("gl-main-init-end");
    performance.measure("gl-main-init", "gl-main-init-start", "gl-main-init-end");
  } catch (e) {
    // Silently fail
  }
}

/* --------------------------------------------------------------------------
   22. ERROR BOUNDARY
   -------------------------------------------------------------------------- */

/**
 * Wrap a function call in a try/catch so that one failing module doesn't
 * break the entire site. Logs the error to the console for debugging.
 *
 * @param {string} name - Module name for logging
 * @param {Function} fn - Function to execute
 */
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

/**
 * The master init function. Runs all setup modules in the correct order
 * once the DOM is fully parsed.
 */
function initSite() {
  recordPerformanceMarks();

  // Phase 1: Critical (runs immediately)
  safeInit("viewport-height", fixViewportHeight);
  safeInit("touch-detection", detectTouchDevice);
  safeInit("color-scheme", detectColorScheme);
  safeInit("footer-year", injectFooterYear);
  safeInit("email-assembly", injectEmailAddresses);

  // Phase 2: Config-driven content
  safeInit("config-links", applyConfigLinks);
  safeInit("canonical", updateCanonical);

  // Phase 3: Navigation & scrolling
  safeInit("active-nav", highlightActiveNav);
  safeInit("smooth-scroll", initSmoothScroll);
  safeInit("back-to-top", initBackToTop);
  safeInit("reading-progress", initReadingProgress);

  // Phase 4: Content enhancement
  safeInit("youtube-lazy", initYouTubeLazy);
  safeInit("lazy-images", initLazyImages);
  safeInit("external-links", secureExternalLinks);

  // Phase 5: Accessibility
  safeInit("focus-management", initFocusManagement);

  // Phase 6: Utilities
  safeInit("print-helpers", initPrintHelpers);

  // Phase 7: Polish
  safeInit("page-loaded", markPageLoaded);
  safeInit("console-branding", printConsoleBranding);

  recordPerformanceEnd();
}

/* --------------------------------------------------------------------------
   24. BOOT
   -------------------------------------------------------------------------- */

// Wait for the DOM to be ready, then initialize everything.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  // DOM already loaded (script at bottom of body or deferred)
  initSite();
}

// Re-run certain modules on page show (back/forward cache)
on(window, "pageshow", function (e) {
  if (e.persisted) {
    safeInit("active-nav-resume", highlightActiveNav);
    safeInit("footer-year-resume", injectFooterYear);
  }
});

const SITE_CONFIG = {
  youtubeId: "ryNH-6sWdOk",
  spotifyUrl: "https://open.spotify.com/show/4fDHQi94ECA6DVtHlfaV9l",
  formEndpoint: "https://formspree.io/f/PASTE_YOUR_ID_HERE", // We will fix this in Step 7
  logoReady: false
};
