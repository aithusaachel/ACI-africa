/**
 * AbleCares Initiative Africa (ACI Africa)
 * Core Interaction, Motion & Form Feedback Controller
 *
 * Implements:
 * 1. Motion Language & Scroll Reveals (Respecting prefers-reduced-motion & Progressive Enhancement)
 * 2. Mobile Navigation Drawer with accessible state transitions
 * 3. Complete Form Lifecycle (Validation, Submitting, Success, Retry with Data Preservation, 12s Network Guard)
 * 4. Video Controller (Lazy load on window 'load', respects Save-Data, 2G/3G, and reduced motion)
 * 5. Verified Stat Counters (only 3 divisions and 1,500 young people)
 * 6. Contact Page Chat Assistant ("Ask a question" quiet link)
 */

(function(window, document) {
  'use strict';

  // ─── 1. Motion Engine & Scroll Reveal Observer ─────────────────────────────
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMotionSystem() {
    // Progressive enhancement marker
    document.documentElement.classList.add('js-enabled');

    if (prefersReducedMotion) {
      // User requested reduced motion: ensure all elements are immediately visible
      var reveals = document.querySelectorAll('.aci-reveal, [data-reveal]');
      for (var i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('is-revealed');
      }
      return;
    }

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
        var rect = el.getBoundingClientRect();
        // Only elements below the fold animate
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
        } else {
          revealObserver.observe(el);
        }
      });
    } else {
      // Fallback
      revealTargets.forEach(function(el) {
        el.classList.add('is-revealed');
      });
    }
  }

  // ─── 2. Responsive Navigation & Mobile Drawer ──────────────────────────────
  function initNavigation() {
    var toggle = document.querySelector('.aci-mobile-toggle, .aci-nav-toggle');
    var drawer = document.getElementById('mobile-drawer') || document.querySelector('.aci-mobile-drawer');

    if (!toggle || !drawer) return;

    var masthead = document.querySelector('.aci-masthead');

    function openDrawer() {
      drawer.classList.add('open');
      drawer.classList.add('is-open');
      if (masthead) masthead.classList.add('is-drawer-open');
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      var firstLink = drawer.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      drawer.classList.remove('is-open');
      if (masthead) masthead.classList.remove('is-drawer-open');
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

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var isOpen = drawer.classList.contains('open') || drawer.classList.contains('is-open');
        if (isOpen) closeDrawer();
      }
    });

    document.addEventListener('click', function(e) {
      var isOpen = drawer.classList.contains('open') || drawer.classList.contains('is-open');
      if (isOpen && !drawer.contains(e.target) && !toggle.contains(e.target)) {
        closeDrawer();
      }
    });

    var drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeDrawer();
      });
    });
  }

  // ─── 3. Masthead Scroll Controller ─────────────────────────────────────────
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

  // ─── 4. Hero Video Controller (Respects Save-Data & Network Type) ───────────
  function initHeroVideo() {
    var videoWrap = document.querySelector('.aci-hero-video-wrap, .aci-hero-bg, .aci-hero');
    if (!videoWrap) return;

    var video = videoWrap.querySelector('video');
    if (!video) return;

    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var isSaveData = conn && conn.saveData === true;
    var isSlowNet = conn && (conn.effectiveType === '2g' || conn.effectiveType === '3g');
    var isMobile = window.innerWidth < 768;

    // If user requested reduced motion, Save-Data, slow network, or mobile: keep poster only, do not stream video
    if (prefersReducedMotion || isSaveData || isSlowNet || isMobile) {
      video.pause();
      video.style.display = 'none';
      return;
    }

    video.addEventListener('playing', function() {
      video.classList.add('is-playing');
    });

    // On capable desktop, attach video sources and play
    if (!video.querySelector('source')) {
      var mp4Src = video.getAttribute('data-src-mp4') || 'assets/hero.mp4';
      var webmSrc = video.getAttribute('data-src-webm') || 'assets/hero-1080p.webm';

      var sourceWebm = document.createElement('source');
      sourceWebm.src = webmSrc;
      sourceWebm.type = 'video/webm';
      video.appendChild(sourceWebm);

      var sourceMp4 = document.createElement('source');
      sourceMp4.src = mp4Src;
      sourceMp4.type = 'video/mp4';
      video.appendChild(sourceMp4);

      video.load();
    }

    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function() {
        video.muted = true;
        video.play().catch(function() {});
      });
    }
  }

  // ─── 5. Verified Stat Counters (Only 3 and 1,500) ───────────────────────────
  function initStatCounters() {
    var counters = document.querySelectorAll('[data-counter-target]');
    if (!counters.length) return;

    counters.forEach(function(el) {
      var targetStr = el.getAttribute('data-counter-target');
      // Strictly restrict animation to the two verified stats
      if (targetStr !== '3' && targetStr !== '1500') {
        el.textContent = targetStr;
        return;
      }

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        el.textContent = targetStr === '1500' ? '1,500' : targetStr;
        return;
      }

      var observer = new IntersectionObserver(function(entries, obs) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var targetVal = parseInt(targetStr, 10);
            var duration = 1200;
            var startTime = null;

            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = Math.min((timestamp - startTime) / duration, 1);
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
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      observer.observe(el);
    });
  }

  // ─── 6. Division Tabs Coordinator ──────────────────────────────────────────
  function initDivisionTabs() {
    var tabContainers = document.querySelectorAll('.aci-tabs, .aci-stage');
    tabContainers.forEach(function(container) {
      var tabs = container.querySelectorAll('.aci-tab, .aci-stage-tab');
      var panels = container.querySelectorAll('.aci-panel, .aci-stage-panel');

      tabs.forEach(function(tab, index) {
        tab.addEventListener('click', function() {
          var targetId = tab.getAttribute('data-target') || tab.getAttribute('data-stage-target');

          tabs.forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          panels.forEach(function(p) {
            p.classList.remove('active');
          });

          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          var targetPanel = targetId ? document.getElementById(targetId) : panels[index];
          if (targetPanel) {
            targetPanel.classList.add('active');
          }
        });
      });
    });
  }

  // ─── 7. Form Lifecycle Coordinator (12s Network Guard & Preservation) ──────
  window.initAciForm = function(formId, submitBtnId, feedbackId, endpoint, successMsg, customValidate) {
    var form = document.getElementById(formId);
    var btn = document.getElementById(submitBtnId);
    var fb = document.getElementById(feedbackId);

    if (!form || !btn || !fb) return;

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

      var errorEl = document.createElement('div');
      errorEl.className = 'aci-field-error';
      errorEl.setAttribute('role', 'alert');
      errorEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>' + message + '</span>';

      if (input.nextSibling) {
        input.parentNode.insertBefore(errorEl, input.nextSibling);
      } else {
        input.parentNode.appendChild(errorEl);
      }

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

      var requiredElements = form.querySelectorAll('[required]');
      requiredElements.forEach(function(input) {
        var val = (input.value || '').trim();

        if (!val) {
          isValid = false;
          showFieldError(input, 'Please fill in this required field.');
          if (!firstInvalidInput) firstInvalidInput = input;
          return;
        }

        if (input.type === 'email') {
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            isValid = false;
            showFieldError(input, 'Please enter a valid email address.');
            if (!firstInvalidInput) firstInvalidInput = input;
            return;
          }
        }
      });

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

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (!validateForm()) {
        fb.className = 'aci-feedback error';
        fb.setAttribute('role', 'alert');
        fb.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>Please review the highlighted fields above and correct any errors.</span>';
        fb.style.display = 'flex';
        return;
      }

      var origHTML = btn.innerHTML;
      btn.disabled = true;
      form.setAttribute('aria-busy', 'true');
      btn.innerHTML = '<span>Submitting…</span>';

      fb.style.display = 'none';
      fb.className = 'aci-feedback';

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

      var controller = new AbortController();
      var timeoutId = setTimeout(function() {
        controller.abort();
      }, 12000); // 12-second network timeout guard

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
        } catch (jsonErr) {}

        if (res.ok && (data.success || data.data || res.status === 200 || res.status === 201)) {
          fb.className = 'aci-feedback success';
          fb.setAttribute('role', 'status');
          fb.setAttribute('aria-live', 'polite');
          fb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> <span>' + (successMsg || 'Your message has been sent.') + '</span>';
          fb.style.display = 'flex';

          form.reset();
          btn.innerHTML = origHTML;
          btn.disabled = false;
          form.removeAttribute('aria-busy');
          return;
        }

        var serverMsg = data.error || 'The server could not process your submission.';
        throw new Error(serverMsg);

      } catch (err) {
        clearTimeout(timeoutId);

        fb.className = 'aci-feedback error';
        fb.setAttribute('role', 'alert');
        fb.setAttribute('aria-live', 'assertive');

        var errorNote = "That didn't send. Your answers are still here. Try again, or email info@aciafrica.org.";
        if (err.name === 'AbortError') {
          errorNote = 'The request took longer than expected. Your answers are still here. Try again, or email info@aciafrica.org.';
        } else if (err.message && err.message !== 'Failed to fetch') {
          errorNote = err.message;
        }

        fb.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <span>' + errorNote + '</span>';
        fb.style.display = 'flex';

        // INPUT PRESERVATION ON FAILURE
        btn.innerHTML = origHTML;
        btn.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  };

  // ─── 8. Contact Page Assistant Link ("Ask a question") ─────────────────────
  function initContactChatLink() {
    var askLink = document.getElementById('open-chat-link');
    var chatWindow = document.getElementById('aciChatWindow');
    var chatClose = document.getElementById('aciChatClose');
    var chatSend = document.getElementById('aciChatSend');
    var chatInput = document.getElementById('aciChatInput');
    var chatMessages = document.getElementById('aciChatMessages');

    if (!askLink || !chatWindow) return;

    askLink.addEventListener('click', function(e) {
      e.preventDefault();
      var isOpen = chatWindow.classList.toggle('open');
      askLink.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen && chatInput) {
        chatInput.focus();
      }
    });

    if (chatClose) {
      chatClose.addEventListener('click', function() {
        chatWindow.classList.remove('open');
        askLink.setAttribute('aria-expanded', 'false');
        askLink.focus();
      });
    }

    var chatHistory = [];
    var systemPrompt = "You are the institutional assistant for AbleCares Initiatives Africa (ACI Africa), headquartered in Accra, Ghana. " +
      "Tagline: Education, Mental Health, Social Impact. " +
      "We run school, mental health, and community programs for young people and families. " +
      "Divisions: Education & Youth, Mental Health (PAMHO: pamhoafrica.org), Climate & Community. " +
      "Contact: info@aciafrica.org. Maintain a warm, direct, dignified tone. Keep responses to 1-2 short sentences.";

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
      typing.textContent = 'Thinking…';
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

        var reply = data.reply || 'Thank you for contacting ACI Africa. You can also write directly to info@aciafrica.org.';
        appendMsg(reply, 'bot');

        chatHistory.push({
          role: "model",
          parts: [{ text: reply }]
        });
      } catch(err) {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        appendMsg('Thank you for reaching out to ACI Africa. Our team in Accra is available at info@aciafrica.org.', 'bot');
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

  // ─── 9. Document Lifecycle Initialization ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    initMotionSystem();
    initStickyMasthead();
    initNavigation();
    initHeroVideo();
    initDivisionTabs();
    initStatCounters();
    initContactChatLink();
  });

})(window, document);
