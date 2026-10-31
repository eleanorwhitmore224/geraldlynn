// js/animations.js
// ==========================================================================
// Gerald Lynn Author Website — Animation Engine
// ==========================================================================
// Purposeful, performance-conscious animations. Every motion serves a
// function: guiding attention, confirming interaction, or revealing content
// as the user scrolls. No gratuitous floating blobs or random parallax.
//
// Respects prefers-reduced-motion at every level.
// ==========================================================================

"use strict";

/* --------------------------------------------------------------------------
   1. REDUCED MOTION GATE
   -------------------------------------------------------------------------- */

/**
 * Central check for reduced motion preference. All animation modules
 * consult this before doing anything. If the user prefers reduced motion,
 * we skip animations entirely and just show content in its final state.
 *
 * @returns {boolean} True if animations should be suppressed
 */
function shouldReduceMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Listen for changes to the reduced motion preference (the user can toggle
 * this in their OS settings at any time).
 */
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

/**
 * The core reveal system. Elements with .reveal, .reveal-left, .reveal-right,
 * or .reveal-scale classes start invisible (via CSS) and animate into view
 * when they enter the viewport.
 *
 * CSS handles the actual transition; JS just toggles the .is-visible class.
 *
 * Classes and their motion:
 *   .reveal        — fade up (translateY 30px to 0, opacity 0 to 1)
 *   .reveal-left   — slide in from left
 *   .reveal-right  — slide in from right
 *   .reveal-scale  — scale up from 0.9 to 1
 */
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

          // Check for stagger delay
          const staggerIndex = el.getAttribute("data-stagger");
          if (staggerIndex) {
            const delay = parseInt(staggerIndex, 10) * 100;
            el.style.transitionDelay = delay + "ms";
          }

          // Custom delay override
          const customDelay = el.getAttribute("data-delay");
          if (customDelay) {
            el.style.transitionDelay = customDelay + "ms";
          }

          el.classList.add("is-visible");

          // Stop observing once revealed (one-shot animation)
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

  // Store reference for cleanup if needed
  window.__glRevealObserver = revealObserver;
}

/**
 * Immediately show all reveal elements without animation. Used when
 * reduced motion is active or IO is not supported.
 */
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

/**
 * For containers with data-stagger-children="true", automatically assign
 * stagger indices to each direct child that has a reveal class. This avoids
 * manually adding data-stagger="0", data-stagger="1", etc. to every card.
 */
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
   4. COUNT-UP ANIMATION
   -------------------------------------------------------------------------- */

/**
 * Animate numbers counting up from 0 to their target value when they scroll
 * into view. Only used for real, verified numbers:
 *   - 27 (years in pharma)
 *   - 4.8 (star rating)
 *   - 9 (chapters)
 *   - 4 (star breakdown)
 *
 * Elements should have:
 *   <span class="count-up" data-target="27" data-suffix="+">0</span>
 *   <span class="count-up" data-target="4.8" data-decimals="1">0</span>
 *
 * Attributes:
 *   data-target   — The final number (required)
 *   data-decimals — Number of decimal places (default 0)
 *   data-suffix   — Text after the number, e.g. "+" or "%"
 *   data-prefix   — Text before the number, e.g. "$"
 *   data-duration — Animation duration in ms (default 1500)
 */
function initCountUp() {
  if (shouldReduceMotion()) {
    setCountUpFinalValues();
    return;
  }

  if (!("IntersectionObserver" in window)) {
    setCountUpFinalValues();
    return;
  }

  const counters = qsa(".count-up");
  if (counters.length === 0) return;

  const countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach(function (counter) {
    countObserver.observe(counter);
  });
}

/**
 * Animate a single counter element from 0 to its target.
 * @param {Element} el - The counter element
 */
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

    // Ease-out cubic for a natural deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    el.textContent = prefix + current.toFixed(decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // Ensure exact final value
      el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Set all counters to their final values immediately (no animation).
 */
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

/**
 * A lightweight parallax effect for hero background images. The image moves
 * at a fraction of the scroll speed, creating depth without being distracting.
 *
 * Only applies to elements with data-parallax="true" and a background image.
 * The intensity is controlled by data-parallax-speed (0.1 to 0.5, default 0.2).
 *
 * Disabled on mobile and when reduced motion is active.
 */
function initParallax() {
  if (shouldReduceMotion()) return;

  // Disable on small screens where parallax is janky
  if (window.innerWidth < 768) return;

  const parallaxElements = qsa("[data-parallax]");
  if (parallaxElements.length === 0) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.pageYOffset;

    parallaxElements.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.getAttribute("data-parallax-speed") || "0.2");

      // Only animate when the element is near the viewport
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

/**
 * Add an "in-view" class to sections as they enter the viewport. This allows
 * CSS to trigger section-level animations (like background color transitions
 * or border reveals) without needing per-element observers.
 */
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
        } else {
          // Optionally remove when out of view for re-triggering
          // entry.target.classList.remove("in-view");
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

/**
 * Orchestrate the initial page load animation sequence. Elements with
 * data-load-order="1", data-load-order="2", etc. fade in sequentially
 * when the page first loads.
 *
 * This runs once on page load and does not re-trigger on scroll.
 */
function initPageLoadSequence() {
  if (shouldReduceMotion()) {
    showAllLoadElements();
    return;
  }

  const loadElements = qsa("[data-load-order]");
  if (loadElements.length === 0) return;

  // Sort by load order
  loadElements.sort(function (a, b) {
    const orderA = parseInt(a.getAttribute("data-load-order") || "0", 10);
    const orderB = parseInt(b.getAttribute("data-load-order") || "0", 10);
    return orderA - orderB;
  });

  loadElements.forEach(function (el) {
    const order = parseInt(el.getAttribute("data-load-order") || "0", 10);
    const delay = order * 150 + 200; // Base delay + stagger

    setTimeout(function () {
      el.classList.add("load-visible");
    }, delay);
  });
}

/**
 * Show all load-sequence elements immediately.
 */
function showAllLoadElements() {
  const loadElements = qsa("[data-load-order]");
  loadElements.forEach(function (el) {
    el.classList.add("load-visible");
  });
}

/* --------------------------------------------------------------------------
   8. ANIMATED UNDERLINE FOR LINKS
   -------------------------------------------------------------------------- */

/**
 * Add a subtle underline animation to specific links on hover. The underline
 * grows from left to right using a CSS pseudo-element, triggered by a JS
 * class for more control.
 *
 * Applies to links with class .link-underline within the main content area.
 */
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

/**
 * Enhance card hover effects with a subtle lift and shadow change.
 * CSS handles the transition; JS adds the class for touch devices where
 * :hover doesn't work reliably.
 */
function initCardHover() {
  const cards = qsa(".card, .review-card, .chapter-card");
  if (cards.length === 0) return;

  const isTouch = document.body.classList.contains("is-touch");

  if (isTouch) {
    // On touch, toggle on tap
    cards.forEach(function (card) {
      on(card, "touchstart", function () {
        // Remove active from all other cards
        cards.forEach(function (c) {
          if (c !== card) c.classList.remove("card--hover");
        });
        card.classList.toggle("card--hover");
      }, { passive: true });
    });
  }
  // On non-touch, CSS :hover handles it
}

/* --------------------------------------------------------------------------
   10. IMAGE REVEAL ON SCROLL
   -------------------------------------------------------------------------- */

/**
 * Reveal images with a clip-path or mask animation as they scroll into view.
 * Images with class .img-reveal start with a clip-path that hides them,
 * then animate to full visibility.
 */
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

/**
 * Enhance the chapter tab rail (the colored sidebar on desktop) by
 * highlighting the current chapter as the user scrolls through the
 * chapters page. This complements the nav.js scroll spy.
 *
 * Looks for sections with data-chapter="N" and corresponding tab markers
 * with data-tab-marker="N".
 */
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

          // Update tab markers
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

/**
 * Split text content into individual character spans for letter-by-letter
 * animation. Used sparingly on hero headings only.
 *
 * Elements with data-split="chars" will have their text wrapped in spans.
 * The actual animation is handled by CSS with staggered delays.
 */
function initTextSplit() {
  if (shouldReduceMotion()) return;

  const splitTargets = qsa("[data-split='chars']");
  if (splitTargets.length === 0) return;

  splitTargets.forEach(function (el) {
    const text = el.textContent;
    if (!text || text.trim().length === 0) return;

    // Preserve accessible text
    el.setAttribute("aria-label", text);

    // Clear and rebuild with spans
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

    // Trigger animation after a brief delay
    requestAnimationFrame(function () {
      el.classList.add("split-active");
    });
  });
}

/* --------------------------------------------------------------------------
   13. SCROLL VELOCITY DETECTION
   -------------------------------------------------------------------------- */

/**
 * Track scroll velocity and add a class to the body when the user is
 * scrolling fast. This can be used to disable expensive animations during
 * rapid scrolling to maintain performance.
 */
function initScrollVelocity() {
  if (shouldReduceMotion()) return;

  let lastScrollY = window.pageYOffset;
  let lastTime = performance.now();
  let velocity = 0;

  const fastThreshold = 30; // pixels per frame

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

/**
 * For long-form pages, show a small progress indicator on the side that
 * fills as the user reads through each section.
 *
 * Elements with data-section-progress="true" get a child bar that grows
 * based on how much of the section is visible.
 */
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
      const sectionBottom = sectionTop + sectionHeight;

      // Calculate how much of the section has been scrolled past
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

/**
 * A subtle typewriter effect for the hero tagline. Types out the text
 * character by character, then stops. Only runs once on page load.
 *
 * Element: <span class="typewriter" data-text="Your tagline here"></span>
 *
 * This is intentionally conservative: slow speed, no blinking cursor,
 * no looping. It runs once and stays.
 */
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

    // Start after a delay to let the page settle
    setTimeout(typeNext, 800);
  });
}

/* --------------------------------------------------------------------------
   16. MAGNETIC BUTTON EFFECT (DESKTOP ONLY)
   -------------------------------------------------------------------------- */

/**
 * On desktop, CTA buttons with class .btn-magnetic subtly shift toward
 * the cursor when hovered. The effect is small (max 8px) and purposeful:
 * it draws the eye and makes the button feel tactile.
 *
 * Disabled on touch devices and when reduced motion is active.
 */
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

      btn.style.transform =
        "translate(" + shiftX + "px, " + shiftY + "px)";
    });

    on(btn, "mouseleave", function () {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

/* --------------------------------------------------------------------------
   17. SMOOTH NUMBER TRANSITIONS
   -------------------------------------------------------------------------- */

/**
 * When a number in the DOM changes (e.g., a filter updates a count),
 * animate the transition smoothly rather than jumping.
 *
 * Usage: call animateNumberChange(element, newValue, duration)
 */
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

/**
 * A centralized requestAnimationFrame loop manager. Instead of each module
 * running its own RAF loop (which wastes CPU), they register callbacks
 * here and share a single loop.
 */
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
    /**
     * Register a callback to run every frame.
     * @param {Function} fn - Callback receiving timestamp
     * @returns {number} ID for removal
     */
    add: function (fn) {
      const id = callbacks.length;
      callbacks.push(fn);
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
      return id;
    },

    /**
     * Remove a callback by its ID.
     * @param {number} id
     */
    remove: function (id) {
      if (callbacks[id]) {
        callbacks[id] = null;
      }
    },

    /**
     * Stop the entire loop and clear all callbacks.
     */
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

/**
 * Disconnect all observers and stop all animation loops. Called during
 * page transitions or when the page is being unloaded.
 */
function cleanupAnimations() {
  if (window.__glRevealObserver) {
    window.__glRevealObserver.disconnect();
  }
  RAFManager.stop();
}

// Clean up on page hide (back/forward cache)
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", cleanupAnimations);
}

/* --------------------------------------------------------------------------
   20. ANIMATION INITIALIZATION
   -------------------------------------------------------------------------- */

/**
 * Master init for all animation modules. Called from main.js or directly
 * on DOMContentLoaded.
 */
function initAnimations() {
  // Gate: check reduced motion first
  watchReducedMotion();

  if (shouldReduceMotion()) {
    // Show everything immediately, no animations
    revealAllImmediately();
    setCountUpFinalValues();
    showAllLoadElements();
    return;
  }

  // Run all animation modules
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

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAnimations);
} else {
  initAnimations();
}