/**
 * AbleCares Initiative Africa (ACI Africa)
 * Unified API Configuration & Environment Resolver
 */
(function(window) {
  'use strict';

  var hostname = window.location.hostname;
  var port = window.location.port;
  var isLocal = (hostname === 'localhost' || hostname === '127.0.0.1');

  var apiBase = '';
  if (isLocal) {
    if (port === '3000' || !port) {
      apiBase = '/api';
    } else {
      // Local development server on a different port (e.g. 5173, 5500)
      apiBase = 'http://localhost:3000/api';
    }
  } else {
    // Production deployment (GitHub Pages, Render, custom domain)
    apiBase = 'https://aci-africa.onrender.com/api';
  }

  window.ACI_API_BASE = apiBase;
  window.ACI_CONFIG = {
    apiBase: apiBase,
    /* [VERIFY: Canonical entity name is AbleCares Initiative Africa (singular Initiative)] */
    org: {
      name: 'AbleCares Initiative Africa',
      shortName: 'ACI Africa',
      legalStatus: 'Registered Continental Non-Governmental Organization',
      headquarters: 'Accra, Ghana',
      email: 'info@aciafrica.org',
      supportEmail: 'info@aciafrica.org',
      website: 'https://aithusaachel.github.io/ACI-africa'
    },
    divisions: {
      pamho: 'Pan-African Mental Health Organization (PAMHO)',
      ableKids: 'AbleKids Neurodiversity & Special Education Support',
      empoweredTalks: 'EmpoweredTalks Africa Youth Mentorship',
      digitalFutures: 'Digital Futures Ghana',
      schoolSupport: 'Support a Schoolchild Rural Infrastructure'
    }
  };
})(window);
