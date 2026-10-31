/* js/nav.js
 * Gerald Lynn Author Website — Navigation Controller
 * ====================================================
 * Handles: mobile menu open/close with focus trap and Escape key,
 * active-link detection, scroll shadow on header, tab rail scroll-spy.
 * No dependencies. Vanilla JS.
 */

(function () {
  'use strict';

  /* ======================================================================
     SECTION 1: DOM REFERENCES
     ====================================================================== */

  const header        = document.querySelector('.site-header');
  const hamburger     = document.querySelector('.nav__toggle');
  const mobileMenu    = document.querySelector('.nav__list');
  const mobileOverlay = null;
  const mobileClose   = null;
  const body          = document.body;

  /* Tab rail (desktop) */
  const tabRail       = document.querySelector('.tab-rail');
  const tabRailItems  = tabRail ? tabRail.querySelectorAll('.tab-rail__item') : [];

  /* All nav links (desktop + mobile) for active detection */
  const allNavLinks   = document.querySelectorAll('.nav-link, .mobile-nav-link');


  /* ======================================================================
     SECTION 2: SCROLL SHADOW ON HEADER
     Adds .is-scrolled class when the user scrolls past a threshold.
     ====================================================================== */

  const SCROLL_THRESHOLD = 10;
  let lastKnownScroll = 0;
  let ticking = false;

  function updateHeaderShadow() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  function onScroll() {
    lastKnownScroll = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderShadow);
      ticking = true;
    }
  }

  if (header) {
    window.addEventListener('scroll', onScroll, { passive: true });
    /* Run once on load in case page is already scrolled */
    updateHeaderShadow();
  }


  /* ======================================================================
     SECTION 3: ACTIVE LINK DETECTION
     Matches the current page URL against nav link href values.
     ====================================================================== */

  function setActiveLinks() {
    /* Get the current path, normalized */
    const currentPath = window.location.pathname
      .replace(/\/index\.html$/, '/')
      .replace(/\/$/, '') || '/';

    allNavLinks.forEach(function (link) {
      let linkPath = link.getAttribute('href') || '';

      /* Normalize the link path */
      linkPath = linkPath
        .replace(/\/index\.html$/, '/')
        .replace(/\/$/, '') || '/';

      /* Resolve relative paths */
      if (linkPath.startsWith('../')) {
        try {
          const resolved = new URL(linkPath, window.location.href);
          linkPath = resolved.pathname
            .replace(/\/index\.html$/, '/')
            .replace(/\/$/, '') || '/';
        } catch (e) {
          /* If URL constructor fails, skip */
        }
      }

      if (linkPath === currentPath) {
        link.classList.add('is-active');
        if (link.getAttribute('aria-current') === null) {
          link.setAttribute('aria-current', 'page');
        }
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  setActiveLinks();


  /* ======================================================================
     SECTION 4: MOBILE MENU — OPEN / CLOSE
     ====================================================================== */

  let menuOpen = false;
  let previousFocusElement = null;

  function openMenu() {
    if (!mobileMenu || !hamburger) return;

    menuOpen = true;
    previousFocusElement = document.activeElement;

    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    if (mobileOverlay) mobileOverlay.classList.add('is-open');
    body.classList.add('no-scroll');

    /* Focus the first focusable element inside the mobile menu */
    const firstFocusable = mobileMenu.querySelector(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      setTimeout(function () {
        firstFocusable.focus();
      }, 100);
    }

    /* Announce to screen readers */
    mobileMenu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    if (!mobileMenu || !hamburger) return;

    menuOpen = false;

    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    if (mobileOverlay) mobileOverlay.classList.remove('is-open');
    body.classList.remove('no-scroll');
    mobileMenu.setAttribute('aria-hidden', 'true');

    /* Return focus to the hamburger button */
    if (previousFocusElement) {
      previousFocusElement.focus();
      previousFocusElement = null;
    }
  }

  function toggleMenu() {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /* Event listeners */
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  if (mobileClose) {
    mobileClose.addEventListener('click', closeMenu);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMenu);
  }

  /* Close menu on link click (navigate) */
  if (mobileMenu) {
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });
  }


  /* ======================================================================
     SECTION 5: FOCUS TRAP (mobile menu)
     Traps Tab and Shift+Tab inside the open mobile menu.
     ====================================================================== */

  function handleFocusTrap(e) {
    if (!menuOpen || !mobileMenu) return;

    const focusableElements = mobileMenu.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        /* Shift + Tab: if on first element, wrap to last */
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        /* Tab: if on last element, wrap to first */
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  }


  /* ======================================================================
     SECTION 6: ESCAPE KEY — CLOSE MOBILE MENU
     ====================================================================== */

  function handleKeyDown(e) {
    if (e.key === 'Escape' && menuOpen) {
      closeMenu();
    }

    /* Focus trap */
    if (e.key === 'Tab' && menuOpen) {
      handleFocusTrap(e);
    }
  }

  document.addEventListener('keydown', handleKeyDown);


  /* ======================================================================
     SECTION 7: CLOSE MOBILE MENU ON RESIZE TO DESKTOP
     If the viewport grows past the mobile breakpoint while the menu
     is open, close it to prevent a stuck overlay.
     ====================================================================== */

  const DESKTOP_BREAKPOINT = 1024;
  let resizeTimer;

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth >= DESKTOP_BREAKPOINT && menuOpen) {
        closeMenu();
      }
    }, 150);
  }

  window.addEventListener('resize', handleResize, { passive: true });


  /* ======================================================================
     SECTION 8: TAB RAIL SCROLL-SPY (desktop)
     Highlights the tab rail item corresponding to the section
     currently in view. Uses IntersectionObserver.
     ====================================================================== */

  function initTabRailScrollSpy() {
    if (!tabRail || tabRailItems.length === 0) return;

    /* Build a map of section IDs to tab rail items */
    const sectionMap = new Map();

    tabRailItems.forEach(function (item) {
      const href = item.getAttribute('href');
      if (href && href.startsWith('#')) {
        const sectionId = href.substring(1);
        const section = document.getElementById(sectionId);
        if (section) {
          sectionMap.set(section, item);
        }
      }
    });

    if (sectionMap.size === 0) return;

    /* Determine the header offset for rootMargin */
    const headerHeight = header ? header.offsetHeight : 72;
    const rootMarginTop = -headerHeight - 20;
    const rootMarginBottom = -(window.innerHeight * 0.4);

    const observerOptions = {
      root: null,
      rootMargin: rootMarginTop + 'px 0px ' + rootMarginBottom + 'px 0px',
      threshold: 0
    };

    let currentActive = null;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const tabItem = sectionMap.get(entry.target);
        if (!tabItem) return;

        if (entry.isIntersecting) {
          /* Deactivate previous */
          if (currentActive && currentActive !== tabItem) {
            currentActive.classList.remove('is-active');
          }
          tabItem.classList.add('is-active');
          currentActive = tabItem;
        }
      });
    }, observerOptions);

    sectionMap.forEach(function (tabItem, section) {
      observer.observe(section);
    });
  }

  initTabRailScrollSpy();


  /* ======================================================================
     SECTION 9: SMOOTH SCROLL FOR ANCHOR LINKS
     Adds smooth scrolling behavior for same-page anchor links
     that accounts for the sticky header height.
     ====================================================================== */

  function handleAnchorClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').substring(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const headerOffset = header ? header.offsetHeight : 72;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset - 20;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    /* Update URL without jumping */
    if (history.pushState) {
      history.pushState(null, null, '#' + targetId);
    }

    /* Set focus to target for accessibility */
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', function () {
      target.removeAttribute('tabindex');
    }, { once: true });
  }

  document.addEventListener('click', handleAnchorClick);


  /* ======================================================================
     SECTION 10: ANNOUNCEMENT BAR DISMISS
     ====================================================================== */

  const announcementClose = document.querySelector('.announcement-bar__close');
  const announcementBar   = document.querySelector('.announcement-bar');

  if (announcementClose && announcementBar) {
    announcementClose.addEventListener('click', function () {
      announcementBar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease';
      announcementBar.style.maxHeight = '0';
      announcementBar.style.opacity = '0';
      announcementBar.style.padding = '0';
      announcementBar.style.overflow = 'hidden';

      setTimeout(function () {
        announcementBar.remove();
      }, 350);

      /* Remember dismissal for this session */
      try {
        sessionStorage.setItem('gl-announcement-dismissed', 'true');
      } catch (e) {
        /* sessionStorage not available, ignore */
      }
    });

    /* Check if already dismissed this session */
    try {
      if (sessionStorage.getItem('gl-announcement-dismissed') === 'true') {
        announcementBar.remove();
      }
    } catch (e) {
      /* Ignore */
    }
  }

})();