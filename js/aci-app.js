/**
 * AbleCares Initiative Africa (ACI Africa)
 * Core Interaction, Motion & Form Feedback Controller
 *
 * Implements:
 * 1. Motion Language & Scroll Reveals (Respecting prefers-reduced-motion & Progressive Enhancement)
 * 2. Mobile Navigation Drawer with accessible state transitions
 * 3. Complete Form Lifecycle (Idle, Validation, Submitting, Success, Failure, Retry with Data Preservation)
 * 4. Ultra-Responsive Screen Scaling & Focus Ring Management
 * 5. Authentic Gemini Field Assistant Client
 */

(function(window, document) {
  'use strict';

  // ─── 1. Motion Engine & Scroll Reveal Observer ─────────────────────────────
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMotionSystem() {
    // Progressive enhancement markers
    document.documentElement.classList.add('js-enabled');

    if (prefersReducedMotion) {
      // User requested reduced motion: ensure all elements are immediately visible
      var reveals = document.querySelectorAll('.aci-reveal, [data-reveal]');
      for (var i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('is-revealed');
      }
      return;
    }

    // Signal CSS that JS is active and scroll animations are enabled
    document.documentElement.classList.add('js-motion-ready');

    var revealTargets = document.querySelectorAll('.aci-reveal, [data-reveal]');
    if (!revealTargets.length) return;

    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08
      });

      revealTargets.forEach(function(el) {
        // If element is already in the initial viewport upon load, reveal immediately
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
        } else {
          revealObserver.observe(el);
        }
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      revealTargets.forEach(function(el) {
        el.classList.add('is-revealed');
      });
    }
  }

  // ─── 2. Responsive Navigation & Mobile Drawer ──────────────────────────────
  function initNavigation() {
    var toggle = document.querySelector('.aci-nav-toggle, .aci-mobile-toggle');
    var drawer = document.getElementById('mobile-drawer') || document.querySelector('.aci-mobile-drawer, .aci-nav');

    if (!toggle || !drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      drawer.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // prevent background scrolling

      // Focus first link in drawer
      var firstLink = drawer.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      toggle.focus();
    }

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = drawer.classList.contains('open') || drawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var isOpen = drawer.classList.contains('open') || drawer.classList.contains('is-open');
        if (isOpen) {
          closeDrawer();
        }
      }
    });

    // Close on clicking outside drawer
    document.addEventListener('click', function(e) {
      var isOpen = drawer.classList.contains('open') || drawer.classList.contains('is-open');
      if (isOpen && !drawer.contains(e.target) && !toggle.contains(e.target)) {
        closeDrawer();
      }
    });

    // Close when navigating via drawer link
    var drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeDrawer();
      });
    });
  }

  // ─── 3. Complete Form Lifecycle Coordinator ────────────────────────────────
  /**
   * Universal Form Handler supporting:
   * - Idle State
   * - Field-level Validation Error (accessible error messages, input focus)
   * - Submitting State (spinner, button locked, aria-busy, prevents double-submits)
   * - Success State (calm tailored confirmation, announced via live region)
   * - Failure State (handles 400/500, network failures, timeouts)
   * - Retry State (user data PRESERVED, button re-enabled)
   */
  window.initAciForm = function(formId, submitBtnId, feedbackId, endpoint, successMsg, customValidate) {
    var form = document.getElementById(formId);
    var btn = document.getElementById(submitBtnId);
    var fb = document.getElementById(feedbackId);

    if (!form || !btn || !fb) return;

    // Remove browser default tooltips in favor of bespoke accessible field errors
    form.setAttribute('novalidate', 'true');

    function clearFieldErrors() {
      var invalidFields = form.querySelectorAll('.is-invalid');
      invalidFields.forEach(function(field) {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
      });
      var errorNotes = form.querySelectorAll('.aci-field-error');
      errorNotes.forEach(function(note) {
        if (note.parentNode) note.parentNode.removeChild(note);
      });
    }

    function showFieldError(input, message) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');

      // Create or reuse error message element
      var errorEl = document.createElement('div');
      errorEl.className = 'aci-field-error';
      errorEl.setAttribute('role', 'alert');
      errorEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>' + message + '</span>';

      // Insert after input element
      if (input.nextSibling) {
        input.parentNode.insertBefore(errorEl, input.nextSibling);
      } else {
        input.parentNode.appendChild(errorEl);
      }

      // Clear error as soon as user types or modifies field
      function clearOnInput() {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        if (errorEl.parentNode) errorEl.parentNode.removeChild(errorEl);
        input.removeEventListener('input', clearOnInput);
        input.removeEventListener('change', clearOnInput);
      }
      input.addEventListener('input', clearOnInput);
      input.addEventListener('change', clearOnInput);
    }

    function validateForm() {
      clearFieldErrors();
      var isValid = true;
      var firstInvalidInput = null;

      // Check required text, email, tel, number, select, textarea
      var requiredElements = form.querySelectorAll('[required]');
      requiredElements.forEach(function(input) {
        var val = (input.value || '').trim();

        if (!val) {
          isValid = false;
          var fieldLabel = input.getAttribute('name') || 'This field';
          showFieldError(input, 'Please fill in this required field.');
          if (!firstInvalidInput) firstInvalidInput = input;
          return;
        }

        // Email validation
        if (input.type === 'email') {
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            isValid = false;
            showFieldError(input, 'Please enter a valid email address.');
            if (!firstInvalidInput) firstInvalidInput = input;
            return;
          }
        }

        // Number validation
        if (input.type === 'number') {
          var num = parseFloat(val);
          var min = parseFloat(input.getAttribute('min'));
          if (isNaN(num)) {
            isValid = false;
            showFieldError(input, 'Please enter a valid number.');
            if (!firstInvalidInput) firstInvalidInput = input;
            return;
          }
          if (!isNaN(min) && num < min) {
            isValid = false;
            showFieldError(input, 'Amount must be at least ' + min + '.');
            if (!firstInvalidInput) firstInvalidInput = input;
            return;
          }
        }
      });

      // Optional custom validation hook
      if (isValid && typeof customValidate === 'function') {
        var customResult = customValidate(form);
        if (customResult !== true) {
          isValid = false;
          if (customResult.input && customResult.message) {
            showFieldError(customResult.input, customResult.message);
            if (!firstInvalidInput) firstInvalidInput = customResult.input;
          }
        }
      }

      if (!isValid && firstInvalidInput) {
        firstInvalidInput.focus();
      }

      return isValid;
    }

    // Submit Listener
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // 1. Validation Step
      if (!validateForm()) {
        fb.className = 'aci-feedback error';
        fb.setAttribute('role', 'alert');
        fb.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>Please review the highlighted fields above and correct any errors.</span>';
        fb.style.display = 'flex';
        return;
      }

      // 2. Submitting Step
      var origHTML = btn.innerHTML;
      btn.disabled = true;
      form.setAttribute('aria-busy', 'true');
      btn.classList.add('is-submitting');

      // Preserve button dimensions and render accessible loading state
      btn.innerHTML = '<svg class="aci-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> <span>Submitting\u2026</span>';

      fb.style.display = 'none';
      fb.className = 'aci-feedback';

      // Gather payload
      var formData = new FormData(form);
      var payload = {};
      formData.forEach(function(val, key) {
        if (payload[key]) {
          payload[key] = [].concat(payload[key], val);
        } else {
          payload[key] = val;
        }
      });

      var apiBase = window.ACI_API_BASE || (window.ACI_CONFIG ? window.ACI_CONFIG.apiBase : '/api');
      var apiUrl = apiBase + '/' + endpoint;

      // AbortController to prevent indefinite hangs (12 second timeout)
      var controller = new AbortController();
      var timeoutId = setTimeout(function() {
        controller.abort();
      }, 12000);

      try {
        var res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        var data = {};
        try {
          data = await res.json();
        } catch (jsonErr) {
          // Non-JSON response
        }

        // 3. Success Verification
        if (res.ok && (data.success || data.data || res.status === 200 || res.status === 201)) {
          fb.className = 'aci-feedback success';
          fb.setAttribute('role', 'status');
          fb.setAttribute('aria-live', 'polite');
          fb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> <span>' + (successMsg || 'Your submission has been accepted successfully.') + '</span>';
          fb.style.display = 'flex';

          // For newsletters and contacts, clean form fields after confirmed submission
          form.reset();

          // Restore button to original text
          btn.innerHTML = origHTML;
          btn.disabled = false;
          btn.classList.remove('is-submitting');
          form.removeAttribute('aria-busy');
          return;
        }

        // Server returned an explicit validation or business error
        var serverMsg = data.error || 'The server could not process your submission.';
        throw new Error(serverMsg);

      } catch (err) {
        clearTimeout(timeoutId);

        // 4. Failure & Retry Handling
        fb.className = 'aci-feedback error';
        fb.setAttribute('role', 'alert');
        fb.setAttribute('aria-live', 'assertive');

        var errorNote = 'We couldn\'t submit your message. Please check your connection and try again.';
        if (err.name === 'AbortError') {
          errorNote = 'The request took longer than expected. Please check your internet connection and try again.';
        } else if (err.message && err.message !== 'Failed to fetch') {
          errorNote = err.message;
        }

        fb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>' + errorNote + '</span>';
        fb.style.display = 'flex';

        // CRITICAL: DO NOT RESET FORM! User inputs are preserved for retry
        btn.innerHTML = origHTML;
        btn.disabled = false;
        btn.classList.remove('is-submitting');
        form.removeAttribute('aria-busy');
      }
    });
  };

  // ─── 4. Authentic Gemini AI Assistant ──────────────────────────────────────
  function initChatAssistant() {
    var chatBtn = document.getElementById('aciChatBtn');
    var chatWindow = document.getElementById('aciChatWindow');
    var chatClose = document.getElementById('aciChatClose');
    var chatSend = document.getElementById('aciChatSend');
    var chatInput = document.getElementById('aciChatInput');
    var chatMessages = document.getElementById('aciChatMessages');

    if (!chatBtn || !chatWindow) return;

    chatBtn.addEventListener('click', function() {
      var isOpen = chatWindow.classList.toggle('open');
      chatBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen && chatInput) {
        chatInput.focus();
      }
    });

    if (chatClose) {
      chatClose.addEventListener('click', function() {
        chatWindow.classList.remove('open');
        chatBtn.setAttribute('aria-expanded', 'false');
        chatBtn.focus();
      });
    }

    var chatHistory = [];
    var systemPrompt = "You are the official institutional virtual assistant for AbleCares Initiatives Africa (ACI Africa), a continental non-profit organization headquartered in Accra, Ghana. " +
      "Tagline: Education • Mental Health • Social Impact. " +
      "Vision: To build a world-class, youth-centered African organization that empowers young people, strengthens mental health systems, promotes quality education, and advances sustainable development across the continent. " +
      "Mission: To improve the lives of children, youth, families, and communities through education, mental health support, digital empowerment, and social impact initiatives. " +
      "Three Core Divisions: " +
      "1. Education & Youth Development: Support a Schoolchild Project, The Entrepreneurial Mindset Program (EMP), Digital Futures Ghana (AI literacy, tech skills), Pan-African Leadership Blueprint Summit, and foundational EmpowerTalks Africa. " +
      "2. Mental Health & Social Psychology: PAMHO (Pan-African Mental Health Organization: https://pamhoafrica.org), The Man-to-Man Mental Health Summit, Mental Health Conversations Series, AbleKids Mental Health Program (autism & neurodiversity), and caregiver/teacher training. " +
      "3. Climate, Sanitation & Social Impact: Reaching the Unreached Project, Environmental & Sanitation Campaigns, and Community Development Projects (water & livelihoods). " +
      "Contact Info: Website: www.aciafrica.org | Email: info@aciafrica.org | Social Media: Instagram @aci.africa, Facebook 'ACI Africa', Twitter/X @aciafrica. " +
      "Guidelines: Maintain a warm, dignified, professional tone. Keep responses concise (1-3 sentences). Never invent unverified certifications or bank details. Direct institutional inquiries to info@aciafrica.org.";

    async function sendChatMessage() {
      var text = (chatInput ? chatInput.value : '').trim();
      if (!text) return;

      appendMsg(text, 'user');
      chatInput.value = '';

      var fullPrompt = text;
      if (chatHistory.length === 0) {
        fullPrompt = "System Instructions:\n" + systemPrompt + "\n\nVisitor Inquiry:\n" + text;
      }

      chatHistory.push({
        role: "user",
        parts: [{ text: fullPrompt }]
      });

      var typing = document.createElement('div');
      typing.className = 'aci-chat-msg bot typing';
      typing.innerHTML = '<span class="aci-typing-dots"><span>.</span><span>.</span><span>.</span></span>';
      chatMessages.appendChild(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      var apiBase = window.ACI_API_BASE || (window.ACI_CONFIG ? window.ACI_CONFIG.apiBase : '/api');
      var chatUrl = apiBase + '/chat';

      try {
        var res = await fetch(chatUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chatHistory })
        });

        var data = await res.json();
        if (typing.parentNode) typing.parentNode.removeChild(typing);

        var reply = data.reply || 'Thank you for contacting ACI Africa! How can we assist you with our Education & Youth programs, PAMHO Mental Health (<a href="https://pamhoafrica.org" target="_blank" rel="noopener noreferrer" style="color:var(--aci-terracotta);text-decoration:underline;">pamhoafrica.org</a>), or Climate & Social Impact initiatives today?';
        appendMsg(reply, 'bot');

        chatHistory.push({
          role: "model",
          parts: [{ text: reply }]
        });
      } catch(e) {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        appendMsg("Thank you for reaching out to ACI Africa. Our secretariat in Accra is available at info@aciafrica.org.", 'bot');
      }
    }

    function appendMsg(text, sender) {
      var el = document.createElement('div');
      el.className = 'aci-chat-msg ' + sender;
      el.textContent = text;
      chatMessages.appendChild(el);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatSend && chatInput) {
      chatSend.addEventListener('click', sendChatMessage);
      chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendChatMessage();
      });
    }
  }

  // ─── 4B. Interactive Living Division Stage ─────────────────────────────────
  function initDivisionStage() {
    var stage = document.querySelector('.aci-stage');
    if (!stage) return;

    var tabs = stage.querySelectorAll('.aci-stage-tab');
    var panels = stage.querySelectorAll('.aci-stage-panel');

    tabs.forEach(function(tab, index) {
      tab.addEventListener('click', function() {
        var targetId = tab.getAttribute('data-stage-target');
        
        tabs.forEach(function(t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(function(p) {
          p.classList.remove('active');
        });

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        var targetPanel = document.getElementById(targetId) || panels[index];
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // ─── 4C. High-Fidelity Animated Stat Counters ──────────────────────────────
  function initStatCounters() {
    var counters = document.querySelectorAll('[data-counter-target]');
    if (!counters.length) return;

    if (prefersReducedMotion) {
      counters.forEach(function(c) {
        c.textContent = c.getAttribute('data-counter-target');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function(c) {
        c.textContent = c.getAttribute('data-counter-target');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var targetVal = parseInt(el.getAttribute('data-counter-target'), 10);
          if (isNaN(targetVal)) return;

          var duration = 1500;
          var startTime = null;

          function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out cubic curve
            var easeProgress = 1 - Math.pow(1 - progress, 3);
            var currentVal = Math.floor(easeProgress * targetVal);
            el.textContent = currentVal.toLocaleString();

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              el.textContent = targetVal.toLocaleString();
            }
          }

          window.requestAnimationFrame(step);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.25 });

    counters.forEach(function(c) {
      observer.observe(c);
    });
  }

  // ─── 4F. Hero Video Controller ─────────────────────────────────────────────
  function initHeroVideo() {
    var heroVideo = document.querySelector('.aci-hero-video');
    if (!heroVideo) return;
    if (prefersReducedMotion) {
      heroVideo.pause();
    } else {
      var playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function(err) {
          // In some browsers, play() may require user gesture or is handled natively
          console.log('Hero video autoplay handled natively or delayed:', err);
        });
      }
    }
  }

  // ─── 4G. Sticky Masthead Controller ────────────────────────────────────────
  function initStickyMasthead() {
    var masthead = document.querySelector('.aci-masthead');
    if (!masthead) return;

    var ticking = false;
    function updateMasthead() {
      if (window.scrollY > 30) {
        masthead.classList.add('is-scrolled');
      } else {
        masthead.classList.remove('is-scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateMasthead);
        ticking = true;
      }
    }, { passive: true });

    updateMasthead();
  }

  // ─── 4H. Signature Moment: Hero Interactive Spotlight ──────────────────────
  function initHeroSpotlight() {
    var hero = document.querySelector('.aci-hero');
    if (!hero || prefersReducedMotion) return;

    hero.addEventListener('mousemove', function(e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      hero.style.setProperty('--mouse-x', x + 'px');
      hero.style.setProperty('--mouse-y', y + 'px');
    }, { passive: true });
  }

  // ─── 5. Document Lifecycle Initialization ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    initMotionSystem();
    initStickyMasthead();
    initHeroSpotlight();
    initNavigation();
    initHeroVideo();
    initChatAssistant();
    initDivisionStage();
    initStatCounters();
  });

})(window, document);

