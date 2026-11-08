// js/animations.js
// ==========================================================================
// Gerald Lynn Author Website — Animation Engine (FULL RESTORED)
// ==========================================================================

"use strict";

// Tell CSS that JS is running so it can enable the reveal animations.
document.documentElement.classList.add("js");

/* --------------------------------------------------------------------------
   SAFETY FALLBACKS
   These ensure the file doesn't crash if main.js fails to load its helpers.
   -------------------------------------------------------------------------- */
const qsa = window.qsa || ((sel, ctx) => (ctx || document).querySelectorAll(sel));
const on = window.on || ((el, ev, fn, opts) => el.addEventListener(ev, fn, opts));
const debounce = window.debounce || ((fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; });
const throttle = window.throttle || ((fn, ms) => { let wait = false; return () => { if (wait) return; fn(); wait = true; setTimeout(() => wait = false, ms); }; });
const clamp = window.clamp || ((val, min, max) => Math.min(Math.max(val, min), max));
const lerp = window.lerp || ((start, end, amt) => (1 - amt) * start + amt * end);

/* --------------------------------------------------------------------------
   1. REDUCED MOTION GATE
   -------------------------------------------------------------------------- */
function shouldReduceMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function watchReducedMotion() {
  if (!window.matchMedia) return;
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

  function handleChange(e) {
    if (e.matches) {
      document.body.classList.add("reduce-motion");
      document.body.classList.remove("allow-motion");
      revealAllImmediately();
    } else {
      document.body.classList.remove("reduce-motion");
      document.body.classList.add("allow-motion");
    }
  }

  handleChange(mql);

  if (mql.addEventListener) {
    mql.addEventListener("change", handleChange);
  } else if (mql.addListener) {
    mql.addListener(handleChange);
  }
}

/* --------------------------------------------------------------------------
   2. REVEAL-ON-SCROLL SYSTEM
   -------------------------------------------------------------------------- */
function initRevealObserver() {
  if (shouldReduceMotion()) {
    revealAllImmediately();
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealAllImmediately();
    return;
  }

  const revealSelectors = [
    ".reveal",
    ".reveal-left",
    ".reveal-right",
    ".reveal-scale"
  ];

  const allRevealElements = qsa(revealSelectors.join(","));
  if (allRevealElements.length === 0) return;

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;

          const staggerIndex = el.getAttribute("data-stagger");
          if (staggerIndex) {
            const delay = parseInt(staggerIndex, 10) * 100;
            el.style.transitionDelay = delay + "ms";
          }

          const customDelay = el.getAttribute("data-delay");
          if (customDelay) {
            el.style.transitionDelay = customDelay + "ms";
          }

          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -60px 0px",
      threshold: 0.1
    }
  );

  allRevealElements.forEach(function (el) {
    revealObserver.observe(el);
  });

  // SAFETY NET: If the observer fails to fire, force everything visible after 3s.
  setTimeout(revealAllImmediately, 3000);

  window.__glRevealObserver = revealObserver;
}

function revealAllImmediately() {
  const revealSelectors = [
    ".reveal",
    ".reveal-left",
    ".reveal-right",
    ".reveal-scale"
  ];

  const allRevealElements = qsa(revealSelectors.join(","));
  allRevealElements.forEach(function (el) {
    el.classList.add("is-visible");
    el.style.transitionDelay = "0ms";
  });
}

/* --------------------------------------------------------------------------
   3. STAGGERED CHILDREN
   -------------------------------------------------------------------------- */
function initStaggeredChildren() {
  if (shouldReduceMotion()) return;

  const containers = qsa("[data-stagger-children]");
  containers.forEach(function (container) {
    const children = qsa(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale",
      container
    );
    children.forEach(function (child, index) {
      if (!child.getAttribute("data-stagger")) {
        child.setAttribute("data-stagger", index);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. COUNT-UP ANIMATION (WITH FAIL-SAFE)
   -------------------------------------------------------------------------- */
function initCountUp() {
  const counters = Array.from(qsa(".count-up"));
  if (counters.length === 0) return;

  // FAIL-SAFE: If the scroll animation fails for any reason, force the final 
  // numbers after 2 seconds.
  setTimeout(function() {
    counters.forEach(function(el) {
      if (el.textContent === "0" || el.textContent === "0.0") {
        const target = parseFloat(el.getAttribute("data-target"));
        const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        const suffix = el.getAttribute("data-suffix") || "";
        const prefix = el.getAttribute("data-prefix") || "";
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    });
  }, 2000);

  if (shouldReduceMotion() || !("IntersectionObserver" in window)) {
    setCountUpFinalValues();
    return;
  }

  const countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  counters.forEach(function (counter) {
    countObserver.observe(counter);
  });
}

function animateCount(el) {
  const target = parseFloat(el.getAttribute("data-target"));
  if (isNaN(target)) return;

  const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
  const suffix = el.getAttribute("data-suffix") || "";
  const prefix = el.getAttribute("data-prefix") || "";
  const duration = parseInt(el.getAttribute("data-duration") || "1500", 10);

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    el.textContent = prefix + current.toFixed(decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
  }

  requestAnimationFrame(update);
}

function setCountUpFinalValues() {
  const counters = qsa(".count-up");
  counters.forEach(function (el) {
    const target = parseFloat(el.getAttribute("data-target"));
    if (isNaN(target)) return;

    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const prefix = el.getAttribute("data-prefix") || "";

    el.textContent = prefix + target.toFixed(decimals) + suffix;
  });
}

/* --------------------------------------------------------------------------
   5. SUBTLE PARALLAX FOR HERO SECTIONS
   -------------------------------------------------------------------------- */
function initParallax() {
  if (shouldReduceMotion()) return;
  if (window.innerWidth < 768) return;

  const parallaxElements = qsa("[data-parallax]");
  if (parallaxElements.length === 0) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.pageYOffset;

    parallaxElements.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.getAttribute("data-parallax-speed") || "0.2");

      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

      const yOffset = (scrollY - el.offsetTop) * speed;
      const img = el.querySelector("img") || el;

      img.style.transform = "translate3d(0, " + yOffset + "px, 0)";
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", debounce(updateParallax, 200));
}

/* --------------------------------------------------------------------------
   6. SCROLL-TRIGGERED SECTION CLASSES
   -------------------------------------------------------------------------- */
function initSectionObserver() {
  if (shouldReduceMotion()) return;
  if (!("IntersectionObserver" in window)) return;

  const sections = qsa("section[id]");
  if (sections.length === 0) return;

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    {
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0
    }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });
}

/* --------------------------------------------------------------------------
   7. PAGE LOAD SEQUENCE
   -------------------------------------------------------------------------- */
function initPageLoadSequence() {
  if (shouldReduceMotion()) {
    showAllLoadElements();
    return;
  }

  const loadElements = qsa("[data-load-order]");
  if (loadElements.length === 0) return;

  loadElements.sort(function (a, b) {
    const orderA = parseInt(a.getAttribute("data-load-order") || "0", 10);
    const orderB = parseInt(b.getAttribute("data-load-order") || "0", 10);
    return orderA - orderB;
  });

  loadElements.forEach(function (el) {
    const order = parseInt(el.getAttribute("data-load-order") || "0", 10);
    const delay = order * 150 + 200;

    setTimeout(function () {
      el.classList.add("load-visible");
    }, delay);
  });
}

function showAllLoadElements() {
  const loadElements = qsa("[data-load-order]");
  loadElements.forEach(function (el) {
    el.classList.add("load-visible");
  });
}

/* --------------------------------------------------------------------------
   8. ANIMATED UNDERLINE FOR LINKS
   -------------------------------------------------------------------------- */
function initLinkUnderlines() {
  if (shouldReduceMotion()) return;

  const links = qsa(".link-underline");
  links.forEach(function (link) {
    on(link, "mouseenter", function () {
      link.classList.add("link-underline--active");
    });
    on(link, "mouseleave", function () {
      link.classList.remove("link-underline--active");
    });
  });
}

/* --------------------------------------------------------------------------
   9. CARD HOVER LIFT
   -------------------------------------------------------------------------- */
function initCardHover() {
  const cards = qsa(".card, .review-card, .chapter-card");
  if (cards.length === 0) return;

  const isTouch = document.body.classList.contains("is-touch");

  if (isTouch) {
    cards.forEach(function (card) {
      on(card, "touchstart", function () {
        cards.forEach(function (c) {
          if (c !== card) c.classList.remove("card--hover");
        });
        card.classList.toggle("card--hover");
      }, { passive: true });
    });
  }
}

/* --------------------------------------------------------------------------
   10. IMAGE REVEAL ON SCROLL
   -------------------------------------------------------------------------- */
function initImageReveal() {
  if (shouldReduceMotion()) {
    qsa(".img-reveal").forEach(function (img) {
      img.classList.add("img-reveal--done");
    });
    return;
  }

  if (!("IntersectionObserver" in window)) {
    qsa(".img-reveal").forEach(function (img) {
      img.classList.add("img-reveal--done");
    });
    return;
  }

  const images = qsa(".img-reveal");
  if (images.length === 0) return;

  const imgRevealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("img-reveal--done");
          imgRevealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  images.forEach(function (img) {
    imgRevealObserver.observe(img);
  });
}

/* --------------------------------------------------------------------------
   11. TAB RAIL SCROLL SPY (ENHANCEMENT)
   -------------------------------------------------------------------------- */
function initTabRailSpy() {
  if (shouldReduceMotion()) return;
  if (!("IntersectionObserver" in window)) return;

  const chapterSections = qsa("[data-chapter]");
  if (chapterSections.length === 0) return;

  const tabMarkers = qsa("[data-tab-marker]");
  if (tabMarkers.length === 0) return;

  let activeChapter = null;

  const spyObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const chapterNum = entry.target.getAttribute("data-chapter");
          if (chapterNum === activeChapter) return;

          activeChapter = chapterNum;

          tabMarkers.forEach(function (marker) {
            const markerNum = marker.getAttribute("data-tab-marker");
            if (markerNum === chapterNum) {
              marker.classList.add("tab-marker--active");
            } else {
              marker.classList.remove("tab-marker--active");
            }
          });
        }
      });
    },
    {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0
    }
  );

  chapterSections.forEach(function (section) {
    spyObserver.observe(section);
  });
}

/* --------------------------------------------------------------------------
   12. TEXT SPLIT ANIMATION HELPERS
   -------------------------------------------------------------------------- */
function initTextSplit() {
  if (shouldReduceMotion()) return;

  const splitTargets = qsa("[data-split='chars']");
  if (splitTargets.length === 0) return;

  splitTargets.forEach(function (el) {
    const text = el.textContent;
    if (!text || text.trim().length === 0) return;

    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    const chars = text.split("");
    chars.forEach(function (char, index) {
      const span = document.createElement("span");
      span.className = "split-char";
      span.style.transitionDelay = (index * 30) + "ms";
      span.textContent = char === " " ? "\u00A0" : char;
      span.setAttribute("aria-hidden", "true");
      el.appendChild(span);
    });

    requestAnimationFrame(function () {
      el.classList.add("split-active");
    });
  });
}

/* --------------------------------------------------------------------------
   13. SCROLL VELOCITY DETECTION
   -------------------------------------------------------------------------- */
function initScrollVelocity() {
  if (shouldReduceMotion()) return;

  let lastScrollY = window.pageYOffset;
  let lastTime = performance.now();
  let velocity = 0;
  const fastThreshold = 30;

  const checkVelocity = throttle(function () {
    const currentY = window.pageYOffset;
    const currentTime = performance.now();
    const dt = currentTime - lastTime;

    if (dt > 0) {
      velocity = Math.abs(currentY - lastScrollY) / (dt / 16.67);
    }

    if (velocity > fastThreshold) {
      document.body.classList.add("is-scrolling-fast");
    } else {
      document.body.classList.remove("is-scrolling-fast");
    }

    lastScrollY = currentY;
    lastTime = currentTime;
  }, 100);

  window.addEventListener("scroll", checkVelocity, { passive: true });
}

/* --------------------------------------------------------------------------
   14. SECTION PROGRESS INDICATORS
   -------------------------------------------------------------------------- */
function initSectionProgress() {
  if (shouldReduceMotion()) return;

  const progressSections = qsa("[data-section-progress]");
  if (progressSections.length === 0) return;

  let ticking = false;

  function updateProgress() {
    const scrollY = window.pageYOffset;
    const viewH = window.innerHeight;

    progressSections.forEach(function (section) {
      const rect = section.getBoundingClientRect();
      const bar = section.querySelector(".section-progress-bar");
      if (!bar) return;

      const sectionTop = rect.top + scrollY;
      const sectionHeight = rect.height;
      const scrolledPast = scrollY + viewH * 0.5 - sectionTop;
      const progress = clamp(scrolledPast / sectionHeight, 0, 1);

      bar.style.transform = "scaleY(" + progress + ")";
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   15. HERO TAGLINE TYPEWRITER (OPTIONAL)
   -------------------------------------------------------------------------- */
function initTypewriter() {
  if (shouldReduceMotion()) {
    qsa(".typewriter").forEach(function (el) {
      el.textContent = el.getAttribute("data-text") || "";
    });
    return;
  }

  const typewriters = qsa(".typewriter");
  if (typewriters.length === 0) return;

  typewriters.forEach(function (el) {
    const fullText = el.getAttribute("data-text");
    if (!fullText) return;

    const speed = parseInt(el.getAttribute("data-speed") || "60", 10);
    let charIndex = 0;

    el.textContent = "";
    el.setAttribute("aria-label", fullText);

    function typeNext() {
      if (charIndex < fullText.length) {
        el.textContent += fullText.charAt(charIndex);
        charIndex++;
        setTimeout(typeNext, speed);
      }
    }

    setTimeout(typeNext, 800);
  });
}

/* --------------------------------------------------------------------------
   16. MAGNETIC BUTTON EFFECT (DESKTOP ONLY)
   -------------------------------------------------------------------------- */
function initMagneticButtons() {
  if (shouldReduceMotion()) return;
  if (document.body.classList.contains("is-touch")) return;
  if (window.innerWidth < 1024) return;

  const buttons = qsa(".btn-magnetic");
  if (buttons.length === 0) return;

  const maxShift = 8;

  buttons.forEach(function (btn) {
    on(btn, "mousemove", function (e) {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      const shiftX = clamp(deltaX * maxShift, -maxShift, maxShift);
      const shiftY = clamp(deltaY * maxShift, -maxShift, maxShift);

      btn.style.transform = "translate(" + shiftX + "px, " + shiftY + "px)";
    });

    on(btn, "mouseleave", function () {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

/* --------------------------------------------------------------------------
   17. SMOOTH NUMBER TRANSITIONS
   -------------------------------------------------------------------------- */
function animateNumberChange(el, newValue, duration) {
  if (shouldReduceMotion()) {
    el.textContent = newValue;
    return;
  }

  const startValue = parseFloat(el.textContent) || 0;
  const endValue = parseFloat(newValue);
  if (isNaN(endValue)) return;

  const dur = duration || 600;
  const startTime = performance.now();
  const decimals = (String(endValue).split(".")[1] || "").length;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / dur, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = lerp(startValue, endValue, eased);

    el.textContent = current.toFixed(decimals);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/* --------------------------------------------------------------------------
   18. RAF LOOP MANAGER
   -------------------------------------------------------------------------- */
const RAFManager = (function () {
  let callbacks = [];
  let rafId = null;
  let running = false;

  function loop(timestamp) {
    if (!running) return;

    callbacks.forEach(function (cb) {
      try {
        cb(timestamp);
      } catch (err) {
        console.error("[RAFManager] Callback error:", err);
      }
    });

    rafId = requestAnimationFrame(loop);
  }

  return {
    add: function (fn) {
      const id = callbacks.length;
      callbacks.push(fn);
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
      return id;
    },
    remove: function (id) {
      if (callbacks[id]) {
        callbacks[id] = null;
      }
    },
    stop: function () {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      callbacks = [];
    }
  };
})();

/* --------------------------------------------------------------------------
   19. CLEANUP & DISCONNECT
   -------------------------------------------------------------------------- */
function cleanupAnimations() {
  if (window.__glRevealObserver) {
    window.__glRevealObserver.disconnect();
  }
  RAFManager.stop();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", cleanupAnimations);
}

/* --------------------------------------------------------------------------
   20. ANIMATION INITIALIZATION
   -------------------------------------------------------------------------- */
function initAnimations() {
  watchReducedMotion();

  if (shouldReduceMotion()) {
    revealAllImmediately();
    setCountUpFinalValues();
    showAllLoadElements();
    return;
  }

  try { initStaggeredChildren(); } catch (e) { console.error("[Animations] stagger:", e); }
  try { initRevealObserver(); } catch (e) { console.error("[Animations] reveal:", e); }
  try { initCountUp(); } catch (e) { console.error("[Animations] count-up:", e); }
  try { initParallax(); } catch (e) { console.error("[Animations] parallax:", e); }
  try { initSectionObserver(); } catch (e) { console.error("[Animations] sections:", e); }
  try { initPageLoadSequence(); } catch (e) { console.error("[Animations] load:", e); }
  try { initLinkUnderlines(); } catch (e) { console.error("[Animations] underlines:", e); }
  try { initCardHover(); } catch (e) { console.error("[Animations] cards:", e); }
  try { initImageReveal(); } catch (e) { console.error("[Animations] images:", e); }
  try { initTabRailSpy(); } catch (e) { console.error("[Animations] tab-rail:", e); }
  try { initTextSplit(); } catch (e) { console.error("[Animations] text-split:", e); }
  try { initScrollVelocity(); } catch (e) { console.error("[Animations] velocity:", e); }
  try { initSectionProgress(); } catch (e) { console.error("[Animations] progress:", e); }
  try { initTypewriter(); } catch (e) { console.error("[Animations] typewriter:", e); }
  try { initMagneticButtons(); } catch (e) { console.error("[Animations] magnetic:", e); }
}

/* --------------------------------------------------------------------------
   21. BOOT
   -------------------------------------------------------------------------- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations);
} else {
  initAnimations();
}

// Force visibility on Back button (bfcache)
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    revealAllImmediately();
    setCountUpFinalValues();
    showAllLoadElements();
  }
});
