// js/forms.js
// ==========================================================================
// Gerald Lynn Author Website — Forms, Accordions, Tabs & Lightbox
// ==========================================================================
// Handles all interactive UI components that are not navigation or animation:
//   - Contact form (Formspree)
//   - Newsletter signup form (Formspree)
//   - Speaking inquiry form (Formspree)
//   - Client-side validation with accessible error messages
//   - Honeypot spam protection
//   - Accordion (FAQ page)
//   - Tabs (Chapters page, Buy page)
//   - Lightbox (gallery images)
//   - Toast notification system
//   - Character counters
//   - Form state persistence
// ==========================================================================

"use strict";

/* --------------------------------------------------------------------------
   1. TOAST NOTIFICATION SYSTEM
   -------------------------------------------------------------------------- */

/**
 * Show a temporary notification message at the bottom of the screen.
 * Used for form success/error feedback and general announcements.
 *
 * @param {string} message - The message to display
 * @param {string} [type="info"] - "info", "success", "error", or "warning"
 * @param {number} [duration=5000] - How long to show in ms (0 = persistent)
 */
function showToast(message, type, duration) {
  const toastType = type || "info";
  const toastDuration = duration || 5000;

  // Create or reuse the toast container
  let container = qs(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.appendChild(container);
  }

  // Create the toast element
  const toast = document.createElement("div");
  toast.className = "toast toast--" + toastType;
  toast.setAttribute("role", "status");

  // Icon based on type
  const icons = {
    success: "&#10003;",
    error: "&#10007;",
    warning: "&#9888;",
    info: "&#8505;"
  };

  toast.innerHTML =
    '<span class="toast__icon" aria-hidden="true">' +
    (icons[toastType] || icons.info) +
    "</span>" +
    '<span class="toast__message">' +
    escapeHtml(message) +
    "</span>" +
    '<button class="toast__close" aria-label="Dismiss notification" type="button">&times;</button>';

  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(function () {
    toast.classList.add("toast--visible");
  });

  // Close button
  const closeBtn = toast.querySelector(".toast__close");
  if (closeBtn) {
    on(closeBtn, "click", function () {
      dismissToast(toast);
    });
  }

  // Auto-dismiss
  if (toastDuration > 0) {
    setTimeout(function () {
      dismissToast(toast);
    }, toastDuration);
  }
}

/**
 * Dismiss a toast with an exit animation.
 * @param {Element} toast
 */
function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.remove("toast--visible");
  toast.classList.add("toast--exiting");
  setTimeout(function () {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Escape HTML to prevent XSS in toast messages.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
   2. FORM VALIDATION UTILITIES
   -------------------------------------------------------------------------- */

/**
 * Validation rules for form fields. Each rule is a function that receives
 * the field value and returns an error message string (empty = valid).
 */
const VALIDATORS = {
  required: function (value) {
    if (!value || value.trim() === "") {
      return "This field is required.";
    }
    return "";
  },
  email: function (value) {
    if (!value || value.trim() === "") return "";
    // RFC 5322 simplified pattern
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) {
      return "Please enter a valid email address.";
    }
    return "";
  },

  minLength: function (value, min) {
    if (!value || value.trim() === "") return "";
    if (value.trim().length < min) {
      return "Must be at least " + min + " characters.";
    }
    return "";
  },

  maxLength: function (value, max) {
    if (!value) return "";
    if (value.length > max) {
      return "Must be no more than " + max + " characters.";
    }
    return "";
  },

  phone: function (value) {
    if (!value || value.trim() === "") return "";
    // Allow digits, spaces, dashes, parens, plus
    var pattern = /^[\d\s\-+()]{7,20}$/;
    if (!pattern.test(value.trim())) {
      return "Please enter a valid phone number.";
    }
    return "";
  },

  name: function (value) {
    if (!value || value.trim() === "") return "";
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }
    return "";
  }
};

/**
 * Validate a single form field based on its data-validate attribute.
 * The attribute can contain multiple rules separated by pipes:
 * data-validate="required|email"
 * data-validate="required|minLength:10"
 * @param {Element} field - The input/textarea/select element
 * @returns {string} Error message, or empty string if valid
 */
function validateField(field) {
  const rules = field.getAttribute("data-validate");
  if (!rules) return "";
  const value = field.value;
  const ruleList = rules.split("|");

  for (var i = 0; i < ruleList.length; i++) {
    var rule = ruleList[i].trim();
    var ruleName = rule;
    var ruleParam = null;

    // Parse parameter if present (e.g., "minLength:10")
    if (rule.indexOf(":") !== -1) {
      var parts = rule.split(":");
      ruleName = parts[0];
      ruleParam = parts[1];
    }

    var validator = VALIDATORS[ruleName];
    if (!validator) continue;

    var error = ruleParam ? validator(value, parseInt(ruleParam, 10)) : validator(value);
    if (error) return error;
  }

  return "";
}

/**
 * Show or clear an error message for a specific field.
 * @param {Element} field - The form field
 * @param {string} message - Error message (empty to clear)
 */
function setFieldError(field, message) {
  const fieldId = field.getAttribute("id") || uid("field");
  if (!field.getAttribute("id")) field.setAttribute("id", fieldId);
  const errorId = fieldId + "-error";
  let errorEl = qs("#" + errorId);

  if (message) {
    // Show error
    field.classList.add("field--error");
    field.classList.remove("field--valid");
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", errorId);

    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.id = errorId;
      errorEl.className = "field-error";
      errorEl.setAttribute("role", "alert");
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
    errorEl.textContent = message;
    errorEl.style.display = "";
  } else {
    // Clear error
    field.classList.remove("field--error");
    field.classList.add("field--valid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");

    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  }
}

/**
 * Validate an entire form and return whether it is valid.
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateForm(form) {
  const fields = qsa("[data-validate]", form);
  let isValid = true;
  let firstError = null;
  fields.forEach(function (field) {
    const error = validateField(field);
    setFieldError(field, error);

    if (error && !firstError) {
      firstError = field;
      isValid = false;
    } else if (error) {
      isValid = false;
    }
  });

  // Focus the first invalid field for accessibility
  if (firstError) {
    firstError.focus();
  }

  return isValid;
}

/* --------------------------------------------------------------------------
   3. HONEYPOT SPAM PROTECTION
   -------------------------------------------------------------------------- */

/**
 * Check the honeypot field. If it has been filled in, the submission is
 * from a bot and should be silently rejected.
 *
 * The honeypot field should be:
 * <input type="text" name="_gotcha" class="hp-field" tabindex="-1"
 *        autocomplete="off" aria-hidden="true">
 * CSS hides it: .hp-field { position: absolute; left: -9999px; opacity: 0; }
 * @param {HTMLFormElement} form
 * @returns {boolean} True if the form passes (honeypot is empty)
 */
function checkHoneypot(form) {
  const honeypot = qs('input[name="_gotcha"]', form);
  if (!honeypot) return true; // No honeypot field, allow submission
  if (honeypot.value && honeypot.value.trim() !== "") {
    // Bot detected. Log it but don't alert the bot.
    console.log("[Forms] Honeypot triggered. Submission rejected silently.");
    return false;
  }

  return true;
}

/* --------------------------------------------------------------------------
   4. FORMSPREE SUBMISSION HANDLER
   -------------------------------------------------------------------------- */

/**
 * Submit a form to Formspree via fetch. Handles loading states, success
 * messages, and error handling.
 * @param {HTMLFormElement} form - The form element
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.successMessage] - Custom success message
 * @param {string} [options.errorMessage] - Custom error message
 * @param {Function} [options.onSuccess] - Callback on success
 * @param {Function} [options.onError] - Callback on error
 */
function submitToFormspree(form, options) {
  const opts = options || {};
  const endpoint = SITE_CONFIG.formEndpoint;
  
  // Check if Formspree is configured
  if (!endpoint || endpoint === "") {
    console.log(
      "[Forms] Formspree endpoint not configured. " +
      "To connect this form, paste your Formspree URL into " +
      "SITE_CONFIG.formEndpoint in js/main.js"
    );

    // Show a graceful fallback message to the user
    showFormMessage(
      form,
      "This form is not yet connected. Please use the email address on this page to reach Gerald directly.",
      "warning"
    );
    showToast(
      "Form not connected yet. Please email Gerald directly.",
      "warning"
    );
    return;
  }

  // Check honeypot
  if (!checkHoneypot(form)) {
    // Silently pretend success to fool the bot
    showFormMessage(form, "Thank you! Your message has been sent.", "success");
    form.reset();
    return;
  }

  // Validate
  if (!validateForm(form)) {
    showToast("Please fix the errors in the form.", "error");
    return;
  }

  // Set loading state
  setFormLoading(form, true);

  // Build form data
  const formData = new FormData(form);

  // Add a hidden field for the page URL (useful for Formspree dashboard)
  formData.append("_page", window.location.href);

  // Submit via fetch
  fetch(endpoint, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json"
    }
  })
  .then(function (response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error("Server returned " + response.status);
  })
  .then(function (data) {
    setFormLoading(form, false);

    const successMsg =
      opts.successMessage ||
      "Thank you! Your message has been sent successfully. Gerald will get back to you soon.";

    showFormMessage(form, successMsg, "success");
    showToast("Message sent successfully!", "success");
    form.reset();
    clearFormValidation(form);

    if (opts.onSuccess) opts.onSuccess(data);
  })
  .catch(function (err) {
    setFormLoading(form, false);
    console.error("[Forms] Submission error:", err);

    const errorMsg =
      opts.errorMessage ||
      "Something went wrong. Please try again or email Gerald directly.";

    showFormMessage(form, errorMsg, "error");
    showToast("Could not send message. Please try again.", "error");

    if (opts.onError) opts.onError(err);
  });
}

/**
 * Show a message below the form (success, error, or warning).
 * @param {HTMLFormElement} form
 * @param {string} message
 * @param {string} type - "success", "error", or "warning"
 */
function showFormMessage(form, message, type) {
  let msgEl = qs(".form-message", form) || qs(".form-message", form.parentNode);
  if (!msgEl) {
    msgEl = document.createElement("div");
    msgEl.className = "form-message";
    msgEl.setAttribute("role", "status");
    msgEl.setAttribute("aria-live", "polite");
    form.parentNode.insertBefore(msgEl, form.nextSibling);
  }

  msgEl.className = "form-message form-message--" + type;
  msgEl.textContent = message;
  msgEl.style.display = "";

  // Auto-hide success messages after 10 seconds
  if (type === "success") {
    setTimeout(function () {
      msgEl.style.display = "none";
    }, 10000);
  }
}

/**
 * Toggle the loading state of a form.
 * @param {HTMLFormElement} form
 * @param {boolean} isLoading
 */
function setFormLoading(form, isLoading) {
  const submitBtn = qs('[type="submit"]', form);
  const allFields = qsa("input, textarea, select, button", form);
  
  if (isLoading) {
    form.classList.add("form--loading");
    form.setAttribute("aria-busy", "true");

    if (submitBtn) {
      submitBtn.setAttribute("data-original-text", submitBtn.textContent);
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;
    }

    allFields.forEach(function (field) {
      field.disabled = true;
    });
  } else {
    form.classList.remove("form--loading");
    form.removeAttribute("aria-busy");

    if (submitBtn) {
      const originalText = submitBtn.getAttribute("data-original-text");
      if (originalText) {
        submitBtn.textContent = originalText;
      }
      submitBtn.disabled = false;
    }

    allFields.forEach(function (field) {
      field.disabled = false;
    });
  }
}

/**
 * Clear all validation states from a form.
 * @param {HTMLFormElement} form
 */
function clearFormValidation(form) {
  const fields = qsa("[data-validate]", form);
  fields.forEach(function (field) {
    field.classList.remove("field--error", "field--valid");
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  });
  const errors = qsa(".field-error", form);
  errors.forEach(function (err) {
    err.textContent = "";
    err.style.display = "none";
  });
}

/* --------------------------------------------------------------------------
   5. CONTACT FORM INITIALIZATION
   -------------------------------------------------------------------------- */

/**
 * Wire up the main contact form. The form should have:
 * <form data-form="contact" action="#" method="POST">
 * Fields should have data-validate attributes for client-side validation.
 */
function initContactForm() {
  const contactForm = qs('[data-form="contact"]');
  if (!contactForm) return;

  // Prevent default submission
  on(contactForm, "submit", function (e) {
    e.preventDefault();
    submitToFormspree(contactForm, {
      successMessage:
        "Thank you for reaching out! Gerald will review your message and respond as soon as possible.",
      errorMessage:
        "We could not send your message right now. Please try emailing Gerald directly."
    });
  });

  // Real-time validation on blur
  const fields = qsa("[data-validate]", contactForm);
  fields.forEach(function (field) {
    on(field, "blur", function () {
      if (field.value.trim() !== "") {
        const error = validateField(field);
        setFieldError(field, error);
      }
    });

    // Clear error on input
    on(field, "input", function () {
      if (field.classList.contains("field--error")) {
        const error = validateField(field);
        if (!error) {
          setFieldError(field, "");
        }
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. NEWSLETTER FORM INITIALIZATION
   -------------------------------------------------------------------------- */

/**
 * Wire up the newsletter signup form. The form should have:
 * <form data-form="newsletter" action="#" method="POST">
 * This is a simpler form (usually just email + honeypot) that can use
 * the same Formspree endpoint or a different one.
 */
function initNewsletterForm() {
  const newsletterForms = qsa('[data-form="newsletter"]');
  if (newsletterForms.length === 0) return;

  newsletterForms.forEach(function (form) {
    on(form, "submit", function (e) {
      e.preventDefault();

      // Check honeypot
      if (!checkHoneypot(form)) {
        showFormMessage(form, "Thank you for subscribing!", "success");
        form.reset();
        return;
      }

      // Validate email
      const emailField = qs('input[type="email"]', form);
      if (emailField) {
        const error = validateField(emailField);
        if (error) {
          setFieldError(emailField, error);
          emailField.focus();
          return;
        }
      }

      submitToFormspree(form, {
        successMessage:
          "You are subscribed! Watch your inbox for updates from Gerald.",
        errorMessage:
          "Could not subscribe you right now. Please try again later."
      });
    });
  });
}

/* --------------------------------------------------------------------------
   7. SPEAKING INQUIRY FORM INITIALIZATION
   -------------------------------------------------------------------------- */

/**
 * Wire up the speaking inquiry form on the speaking page.
 * <form data-form="speaking" action="#" method="POST">
 */
function initSpeakingForm() {
  const speakingForm = qs('[data-form="speaking"]');
  if (!speakingForm) return;

  on(speakingForm, "submit", function (e) {
    e.preventDefault();
    submitToFormspree(speakingForm, {
      successMessage:
        "Thank you for your interest in having Gerald speak at your event! He will review your inquiry and respond within a few business days.",
      errorMessage:
        "Could not send your inquiry right now. Please try again or email Gerald directly."
    });
  });

  // Real-time validation
  const fields = qsa("[data-validate]", speakingForm);
  fields.forEach(function (field) {
    on(field, "blur", function () {
      if (field.value.trim() !== "") {
        const error = validateField(field);
        setFieldError(field, error);
      }
    });

    on(field, "input", function () {
      if (field.classList.contains("field--error")) {
        const error = validateField(field);
        if (!error) setFieldError(field, "");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   8. CHARACTER COUNTER
   -------------------------------------------------------------------------- */

/**
 * For textareas with a maxlength attribute, show a live character counter.
 * The counter element should be a sibling with class .char-counter.
 * <textarea maxlength="1000" data-char-count="true"></textarea>
 * <span class="char-counter" aria-live="polite">0 / 1000</span>
 */
function initCharCounters() {
  const textareas = qsa("[data-char-count]");
  if (textareas.length === 0) return;

  textareas.forEach(function (textarea) {
    const maxLength = parseInt(textarea.getAttribute("maxlength") || "0", 10);
    if (!maxLength) return;

    let counter = qs(".char-counter", textarea.parentNode);
    if (!counter) {
      counter = document.createElement("span");
      counter.className = "char-counter";
      counter.setAttribute("aria-live", "polite");
      textarea.parentNode.insertBefore(counter, textarea.nextSibling);
    }

    function updateCount() {
      const current = textarea.value.length;
      const remaining = maxLength - current;

      counter.textContent = current + " / " + maxLength;

      if (remaining < 50) {
        counter.classList.add("char-counter--warning");
        counter.classList.remove("char-counter--danger");
      } else if (remaining < 10) {
        counter.classList.add("char-counter--danger");
        counter.classList.remove("char-counter--warning");
      } else {
        counter.classList.remove("char-counter--warning", "char-counter--danger");
      }
    }

    on(textarea, "input", updateCount);
    updateCount();
  });
}

/* --------------------------------------------------------------------------
   9. ACCORDION (FAQ PAGE)
   -------------------------------------------------------------------------- */

/**
 * Initialize accordion behavior for FAQ items and any other expandable
 * content sections.
 *
 * HTML structure:
 * <div class="acc">
 *   <button class="acc-btn" aria-expanded="false" aria-controls="panel-1">
 *     Question text
 *     <span class="acc-icon" aria-hidden="true">+</span>
 *   </button>
 *   <div class="acc-panel" id="panel-1" role="region" hidden>
 *     <div class="acc-panel__inner">
 *       Answer content
 *     </div>
 *   </div>
 * </div>
 *
 * Features:
 * - Keyboard accessible (Enter, Space to toggle)
 * - ARIA attributes managed automatically
 * - Smooth height animation via CSS max-height transition
 * - Optional single-open mode (data-accordion="single")
 */
function initAccordions() {
  const accordions = qsa(".acc");
  if (accordions.length === 0) return;

  // Group by parent container for single-open mode
  const groups = {};

  accordions.forEach(function (acc) {
    const btn = qs(".acc-btn", acc);
    const panel = qs(".acc-panel", acc);
    if (!btn || !panel) return;

    // Ensure unique IDs
    const panelId = panel.getAttribute("id") || uid("acc-panel");
    panel.setAttribute("id", panelId);
    btn.setAttribute("aria-controls", panelId);

    // Determine if this accordion group is single-open
    const parent = acc.closest("[data-accordion]");
    const mode = parent ? parent.getAttribute("data-accordion") : "multi";
    const groupKey = parent ? parent.id || "default" : "default";

    if (!groups[groupKey]) {
      groups[groupKey] = { mode: mode, items: [] };
    }
    groups[groupKey].items.push({ acc: acc, btn: btn, panel: panel });

    // Click handler
    on(btn, "click", function () {
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      // In single-open mode, close all others in the group first
      if (mode === "single" && !isExpanded) {
        groups[groupKey].items.forEach(function (item) {
          if (item.btn !== btn) {
            closeAccordionItem(item.btn, item.panel);
          }
        });
      }

      if (isExpanded) {
        closeAccordionItem(btn, panel);
      } else {
        openAccordionItem(btn, panel);
      }
    });

    // Keyboard handler (Enter and Space are handled natively by <button>)
    // But we add arrow key navigation for accessibility
    on(btn, "keydown", function (e) {
      const groupItems = groups[groupKey].items;
      const currentIndex = groupItems.findIndex(function (item) {
        return item.btn === btn;
      });

      let targetIndex = -1;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          targetIndex = (currentIndex + 1) % groupItems.length;
          break;
        case "ArrowUp":
          e.preventDefault();
          targetIndex = (currentIndex - 1 + groupItems.length) % groupItems.length;
          break;
        case "Home":
          e.preventDefault();
          targetIndex = 0;
          break;
        case "End":
          e.preventDefault();
          targetIndex = groupItems.length - 1;
          break;
      }

      if (targetIndex >= 0) {
        groupItems[targetIndex].btn.focus();
      }
    });
  });

  // Open any accordion items that have data-open="true" by default
  accordions.forEach(function (acc) {
    if (acc.getAttribute("data-open") === "true") {
      const btn = qs(".acc-btn", acc);
      const panel = qs(".acc-panel", acc);
      if (btn && panel) {
        openAccordionItem(btn, panel);
      }
    }
  });
}

/**
 * Open a single accordion item with animation.
 * @param {Element} btn
 * @param {Element} panel
 */
function openAccordionItem(btn, panel) {
  btn.setAttribute("aria-expanded", "true");
  panel.removeAttribute("hidden");
  panel.classList.add("acc-panel--open");

  // Animate height
  const inner = qs(".acc-panel__inner", panel);
  if (inner) {
    const height = inner.scrollHeight;
    panel.style.maxHeight = height + "px";
  }

  // Update icon
  const icon = qs(".acc-icon", btn) || qs(".acc-btn__icon", btn);
  if (icon) {
    icon.textContent = "\u2212"; // minus sign
  }

  btn.closest(".acc").classList.add("acc--open");
}

/**
 * Close a single accordion item with animation.
 * @param {Element} btn
 * @param {Element} panel
 */
function closeAccordionItem(btn, panel) {
  btn.setAttribute("aria-expanded", "false");
  panel.classList.remove("acc-panel--open");
  panel.style.maxHeight = "0";

  // Update icon
  const icon = qs(".acc-icon", btn) || qs(".acc-btn__icon", btn);
  if (icon) {
    icon.textContent = "+";
  }

  btn.closest(".acc").classList.remove("acc--open");

  // Hide after transition
  setTimeout(function () {
    if (btn.getAttribute("aria-expanded") === "false") {
      panel.setAttribute("hidden", "");
    }
  }, 400);
}

/* --------------------------------------------------------------------------
   10. TABS COMPONENT
   -------------------------------------------------------------------------- */

/**
 * Initialize tabbed interfaces. Used on the Chapters page and Buy page.
 *
 * HTML structure:
 * <div class="tabs" data-tabs="true">
 *   <div class="tabs__list" role="tablist">
 *     <button class="tabs__btn" role="tab" aria-selected="true"
 *             aria-controls="tab-panel-1" id="tab-1">Tab 1</button>
 *     <button class="tabs__btn" role="tab" aria-selected="false"
 *             aria-controls="tab-panel-2" id="tab-2">Tab 2</button>
 *   </div>
 *   <div class="tabs__panel" role="tabpanel" id="tab-panel-1"
 *        aria-labelledby="tab-1">Content 1</div>
 *   <div class="tabs__panel" role="tabpanel" id="tab-panel-2"
 *        aria-labelledby="tab-2" hidden>Content 2</div>
 * </div>
 */
function initTabs() {
  const tabContainers = qsa("[data-tabs]");
  if (tabContainers.length === 0) return;

  tabContainers.forEach(function (container) {
    const tabBtns = qsa(".tabs__btn, .tab-btn", container);
    const tabPanels = qsa(".tabs__panel, .tab-panel", container);

    if (tabBtns.length === 0 || tabPanels.length === 0) return;

    tabBtns.forEach(function (btn) {
      on(btn, "click", function () {
        activateTab(btn, tabBtns, tabPanels);
      });

      // Keyboard navigation
      on(btn, "keydown", function (e) {
        const currentIndex = tabBtns.indexOf(btn);
        let targetIndex = -1;

        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            targetIndex = (currentIndex + 1) % tabBtns.length;
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            targetIndex = (currentIndex - 1 + tabBtns.length) % tabBtns.length;
            break;
          case "Home":
            e.preventDefault();
            targetIndex = 0;
            break;
          case "End":
            e.preventDefault();
            targetIndex = tabBtns.length - 1;
            break;
        }

        if (targetIndex >= 0) {
          activateTab(tabBtns[targetIndex], tabBtns, tabPanels);
          tabBtns[targetIndex].focus();
        }
      });
    });

    // Ensure first tab is active by default
    const activeBtn = qs('.tabs__btn[aria-selected="true"], .tab-btn[aria-selected="true"]', container);
    if (!activeBtn && tabBtns.length > 0) {
      activateTab(tabBtns[0], tabBtns, tabPanels);
    }
  });
}

/**
 * Activate a specific tab and its corresponding panel.
 * @param {Element} activeBtn
 * @param {Element[]} allBtns
 * @param {Element[]} allPanels
 */
function activateTab(activeBtn, allBtns, allPanels) {
  const targetPanelId = activeBtn.getAttribute("aria-controls");

  // Deactivate all tabs
  allBtns.forEach(function (btn) {
    btn.setAttribute("aria-selected", "false");
    btn.setAttribute("tabindex", "-1");
    btn.classList.remove("tabs__btn--active", "tab-btn--active");
  });

  // Hide all panels
  allPanels.forEach(function (panel) {
    panel.setAttribute("hidden", "");
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("tabs__panel--active", "tab-panel--active");
  });

  // Activate the selected tab
  activeBtn.setAttribute("aria-selected", "true");
  activeBtn.setAttribute("tabindex", "0");
  activeBtn.classList.add("tabs__btn--active", "tab-btn--active");

  // Show the corresponding panel
  const targetPanel = qs("#" + targetPanelId);
  if (targetPanel) {
    targetPanel.removeAttribute("hidden");
    targetPanel.setAttribute("aria-hidden", "false");
    targetPanel.classList.add("tabs__panel--active", "tab-panel--active");
  }
}

/* --------------------------------------------------------------------------
   11. LIGHTBOX
   -------------------------------------------------------------------------- */

/**
 * Initialize a simple, accessible lightbox for gallery images.
 *
 * HTML structure:
 * <a class="gallery__item" href="full-size.jpg" data-lightbox="true">
 *   <img src="thumbnail.jpg" alt="Description">
 * </a>
 *
 * The lightbox overlay is created dynamically on first use.
 */
function initLightbox() {
  const galleryItems = qsa("[data-lightbox]");
  if (galleryItems.length === 0) return;

  let overlay = null;
  let currentImage = null;
  let currentIndex = 0;
  const images = [];

  // Collect all gallery images
  galleryItems.forEach(function (item, index) {
    const fullSrc = item.getAttribute("href");
    const thumb = qs("img", item);
    const alt = thumb ? thumb.getAttribute("alt") : "";

    images.push({ src: fullSrc, alt: alt, index: index });

    on(item, "click", function (e) {
      e.preventDefault();
      currentIndex = index;
      openLightbox(images[currentIndex]);
    });
  });

  /**
   * Create and show the lightbox overlay.
   * @param {Object} imageData - { src, alt, index }
   */
  function openLightbox(imageData) {
    if (!overlay) {
      createOverlay();
    }

    currentImage = imageData;

    const img = qs(".lightbox__img", overlay);
    const caption = qs(".lightbox__caption", overlay);
    const counter = qs(".lightbox__counter", overlay);

    img.setAttribute("src", imageData.src);
    img.setAttribute("alt", imageData.alt);
    caption.textContent = imageData.alt;
    if (counter) {
      counter.textContent = (imageData.index + 1) + " / " + images.length;
    }

    overlay.classList.add("lightbox--open", "is-open");
    overlay.removeAttribute("hidden");
    document.body.classList.add("lightbox-active");

    // Trap focus inside lightbox
    trapFocus(overlay);

    // Focus the close button
    const closeBtn = qs(".lightbox__close", overlay);
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Close the lightbox.
   */
  function closeLightbox() {
    if (!overlay) return;

    overlay.classList.remove("lightbox--open", "is-open");
    document.body.classList.remove("lightbox-active");

    setTimeout(function () {
      overlay.setAttribute("hidden", "");
      const img = qs(".lightbox__img", overlay);
      if (img) img.setAttribute("src", "");
    }, 300);

    // Return focus to the gallery item that opened the lightbox
    const trigger = galleryItems[currentIndex];
    if (trigger) trigger.focus();

    releaseFocusTrap();
  }

  /**
   * Navigate to the next or previous image.
   * @param {number} direction - 1 for next, -1 for previous
   */
  function navigateLightbox(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    openLightbox(images[currentIndex]);
  }

  /**
   * Create the lightbox overlay DOM structure.
   */
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.setAttribute("hidden", "");

    overlay.innerHTML =
      '<div class="lightbox__backdrop"></div>' +
      '<div class="lightbox__content">' +
        '<button class="lightbox__close" aria-label="Close image viewer" type="button">&times;</button>' +
        '<button class="lightbox__prev" aria-label="Previous image" type="button">&#8249;</button>' +
        '<button class="lightbox__next" aria-label="Next image" type="button">&#8250;</button>' +
        '<figure class="lightbox__figure">' +
          '<img class="lightbox__img" src="" alt="">' +
          '<figcaption class="lightbox__caption"></figcaption>' +
        '</figure>' +
        '<div class="lightbox__counter" aria-live="polite"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Event listeners
    on(qs(".lightbox__close", overlay), "click", closeLightbox);
    on(qs(".lightbox__backdrop", overlay), "click", closeLightbox);
    on(qs(".lightbox__prev", overlay), "click", function () {
      navigateLightbox(-1);
    });
    on(qs(".lightbox__next", overlay), "click", function () {
      navigateLightbox(1);
    });

    // Keyboard navigation
    on(overlay, "keydown", function (e) {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          navigateLightbox(-1);
          break;
        case "ArrowRight":
          navigateLightbox(1);
          break;
      }
    });
  }
}

/* --------------------------------------------------------------------------
   12. FOCUS TRAP UTILITY
   -------------------------------------------------------------------------- */

let focusTrapHandler = null;

/**
 * Trap keyboard focus within a container element (used for modals/lightbox).
 * @param {Element} container
 */
function trapFocus(container) {
  const focusableSelectors =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  
  focusTrapHandler = function (e) {
    if (e.key !== "Tab") return;

    const focusable = qsa(focusableSelectors, container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", focusTrapHandler);
}

/**
 * Release the focus trap.
 */
function releaseFocusTrap() {
  if (focusTrapHandler) {
    document.removeEventListener("keydown", focusTrapHandler);
    focusTrapHandler = null;
  }
}

/* --------------------------------------------------------------------------
   13. FORM STATE PERSISTENCE
   -------------------------------------------------------------------------- */

/**
 * Save form field values to sessionStorage so they survive accidental page
 * refreshes. Only applies to forms with data-persist="true".
 *
 * This is especially useful for the longer contact and speaking forms.
 */
function initFormPersistence() {
  const persistentForms = qsa('[data-persist="true"]');
  if (persistentForms.length === 0) return;

  // Check if sessionStorage is available
  try {
    sessionStorage.setItem("__test", "1");
    sessionStorage.removeItem("__test");
  } catch (e) {
    return; // sessionStorage not available
  }

  persistentForms.forEach(function (form) {
    const formId = form.getAttribute("id") || uid("persist-form");
    if (!form.getAttribute("id")) form.setAttribute("id", formId);

    const storageKey = "gl-form-" + formId;

    // Restore saved values
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const fields = qsa("input, textarea, select", form);

        fields.forEach(function (field) {
          const name = field.getAttribute("name");
          if (name && data[name] !== undefined) {
            if (field.type === "checkbox" || field.type === "radio") {
              field.checked = data[name];
            } else {
              field.value = data[name];
            }
          }
        });
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Save on input (debounced)
    const saveHandler = debounce(function () {
      const data = {};
      const fields = qsa("input, textarea, select", form);

      fields.forEach(function (field) {
        const name = field.getAttribute("name");
        if (!name) return;
        if (field.type === "file") return; // Don't persist file inputs
        if (field.type === "password") return; // Don't persist passwords
        if (field.name === "_gotcha") return; // Don't persist honeypot

        if (field.type === "checkbox") {
          data[name] = field.checked;
        } else if (field.type === "radio") {
          if (field.checked) data[name] = field.value;
        } else {
          data[name] = field.value;
        }
      });

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        // Storage full or unavailable
      }
    }, 500);

    on(form, "input", saveHandler);
    on(form, "change", saveHandler);

    // Clear on successful submission
    on(form, "submit", function () {
      setTimeout(function () {
        try {
          sessionStorage.removeItem(storageKey);
        } catch (e) {
          // Ignore
        }
      }, 1000);
    });
  });
}

/* --------------------------------------------------------------------------
   14. COPY-TO-CLIPBOARD HELPER
   -------------------------------------------------------------------------- */

/**
 * Initialize copy-to-clipboard buttons. Useful for sharing links or
 * copying the book's ISBN.
 *
 * HTML: <button data-copy="Text to copy" class="btn-copy">Copy</button>
 */
function initCopyButtons() {
  const copyBtns = qsa("[data-copy]");
  if (copyBtns.length === 0) return;

  copyBtns.forEach(function (btn) {
    on(btn, "click", function () {
      const text = btn.getAttribute("data-copy");
      if (!text) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showCopyFeedback(btn);
        }).catch(function () {
          fallbackCopy(text, btn);
        });
      } else {
        fallbackCopy(text, btn);
      }
    });
  });
}

/**
 * Fallback copy method for older browsers.
 * @param {string} text
 * @param {Element} btn
 */
function fallbackCopy(text, btn) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand("copy");
    showCopyFeedback(btn);
  } catch (e) {
    showToast("Could not copy to clipboard.", "error");
  }

  document.body.removeChild(textarea);
}

/**
 * Show visual feedback after a successful copy.
 * @param {Element} btn
 */
function showCopyFeedback(btn) {
  const originalText = btn.textContent;
  btn.textContent = "Copied!";
  btn.classList.add("btn-copy--copied");
  showToast("Copied to clipboard!", "success", 2000);
  
  setTimeout(function () {
    btn.textContent = originalText;
    btn.classList.remove("btn-copy--copied");
  }, 2000);
}

/* --------------------------------------------------------------------------
   15. SCROLL-TO-FORM HELPER
   -------------------------------------------------------------------------- */

/**
 * If the URL contains a hash like #contact-form, scroll to and focus the
 * form after the page loads. Useful when linking from other pages.
 */
function initScrollToForm() {
  const hash = window.location.hash;
  if (!hash) return;

  const target = qs(hash);
  if (!target) return;

  // Only auto-focus forms, not arbitrary elements
  if (target.tagName === "FORM" || target.querySelector("form")) {
    setTimeout(function () {
      const form = target.tagName === "FORM" ? target : qs("form", target);
      if (form) {
        const firstField = qs("input, textarea, select", form);
        if (firstField) {
          form.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(function () {
            firstField.focus();
          }, 600);
        }
      }
    }, 300);
  }
}

/* --------------------------------------------------------------------------
   16. AUTO-RESIZE TEXTAREAS
   -------------------------------------------------------------------------- */

/**
 * Make textareas automatically grow as the user types, up to a max height.
 * Applies to textareas with data-autoresize="true".
 */
function initAutoResizeTextareas() {
  const textareas = qsa("[data-autoresize]");
  if (textareas.length === 0) return;

  textareas.forEach(function (textarea) {
    // Set initial height
    textarea.style.overflow = "hidden";
    textarea.style.resize = "none";

    function resize() {
      textarea.style.height = "auto";
      const maxHeight = parseInt(
        textarea.getAttribute("data-max-height") || "400",
        10
      );
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + "px";

      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflow = "auto";
      } else {
        textarea.style.overflow = "hidden";
      }
    }

    on(textarea, "input", resize);
    on(textarea, "change", resize);

    // Resize on load in case there is pre-filled content
    resize();
  });
}

/* --------------------------------------------------------------------------
   17. FORM ACCESSIBILITY ENHANCEMENTS
   -------------------------------------------------------------------------- */

/**
 * Ensure all form fields have proper labels, even if the visual design
 * uses floating labels or placeholder-only patterns.
 */
function enhanceFormAccessibility() {
  const allInputs = qsa("input, textarea, select");

  allInputs.forEach(function (input) {
    const id = input.getAttribute("id");
    if (!id) return;

    // Check if there is a label for this input
    const label = qs('label[for="' + id + '"]');
    if (!label) {
      // Check if the input is inside a label
      const parentLabel = input.closest("label");
      if (!parentLabel) {
        // Check for aria-label or aria-labelledby
        const ariaLabel = input.getAttribute("aria-label");
        const ariaLabelledBy = input.getAttribute("aria-labelledby");
        const placeholder = input.getAttribute("placeholder");

        if (!ariaLabel && !ariaLabelledBy) {
          // Use placeholder as aria-label as a last resort
          if (placeholder) {
            input.setAttribute("aria-label", placeholder);
          }
        }
      }
    }
  });
}

/* --------------------------------------------------------------------------
   18. INITIALIZE ALL FORM MODULES
   -------------------------------------------------------------------------- */

/**
 * Master initialization function for all form-related modules.
 * Called from main.js or directly on DOMContentLoaded.
 */
function initForms() {
  try { initContactForm(); } catch (e) { console.error("[Forms] contact:", e); }
  try { initNewsletterForm(); } catch (e) { console.error("[Forms] newsletter:", e); }
  try { initSpeakingForm(); } catch (e) { console.error("[Forms] speaking:", e); }
  try { initCharCounters(); } catch (e) { console.error("[Forms] char-count:", e); }
  try { initAccordions(); } catch (e) { console.error("[Forms] accordion:", e); }
  try { initTabs(); } catch (e) { console.error("[Forms] tabs:", e); }
  try { initLightbox(); } catch (e) { console.error("[Forms] lightbox:", e); }
  try { initFormPersistence(); } catch (e) { console.error("[Forms] persistence:", e); }
  try { initCopyButtons(); } catch (e) { console.error("[Forms] copy:", e); }
  try { initScrollToForm(); } catch (e) { console.error("[Forms] scroll-to:", e); }
  try { initAutoResizeTextareas(); } catch (e) { console.error("[Forms] autoresize:", e); }
  try { enhanceFormAccessibility(); } catch (e) { console.error("[Forms] a11y:", e); }
}

/* --------------------------------------------------------------------------
   19. BOOT
   -------------------------------------------------------------------------- */

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForms);
} else {
  initForms();
}

// Re-initialize certain modules on pageshow (back/forward cache)
if (typeof window !== "undefined") {
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      try { initScrollToForm(); } catch (err) { /* ignore */ }
    }
  });
}