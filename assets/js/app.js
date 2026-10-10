(function (window) {
  'use strict';

  const Clinic = window.Clinic || {};
  const utils = Clinic.utils || {};

  /* ------------------------------------------------------------------ *
   * Storage helpers (localStorage → sessionStorage → in-memory fallback)
   * ------------------------------------------------------------------ */
  var KEYS = {
    appointments: 'kpst.v1.appointments',
    reminders: 'kpst.v1.reminders'
  };
  var memoryStore = {};

  function storageGet(key) {
    try {
      var v = window.localStorage.getItem(key);
      if (v !== null && v !== undefined) return v;
    } catch (e) { /* ignore */ }
    try {
      var v2 = window.sessionStorage.getItem(key);
      if (v2 !== null && v2 !== undefined) return v2;
    } catch (e) { /* ignore */ }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  }

  function storageSet(key, value) {
    memoryStore[key] = value;
    try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    try { window.sessionStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  function storageRemove(key) {
    delete memoryStore[key];
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    try { window.sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function storageGetJSON(key) {
    var raw = storageGet(key);
    if (raw === null || raw === undefined || raw === '') return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function storageSetJSON(key, obj) {
    try { storageSet(key, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  Clinic.storage = {
    KEYS: KEYS,
    get: storageGet,
    set: storageSet,
    remove: storageRemove,
    getJSON: storageGetJSON,
    setJSON: storageSetJSON
  };

  /* ------------------------------------------------------------------ *
   * Inline SVG icon set (stroke = currentColor, no external assets)
   * ------------------------------------------------------------------ */
  function svgMark(paths, fill) {
    if (fill) {
      return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + paths + '</svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  var ICONS = {
    tooth: svgMark('<path d="M12 3.4c-3.7 0-6.6 2.3-6.6 5.3 0 1.8.7 3.2 1.6 4.7.6 1.1 1.1 2.7 1.7 3.7.5.9 1 1.6 1.8 1.6s1.6-.6 2-1.6c.3-.7.6-1.4 1-1.4s.7.7 1 1.4c.4 1 .7 1.6 2 1.6s1.3-.7 1.8-1.6c.6-1 1.1-2.6 1.7-3.7.9-1.5 1.6-2.9 1.6-4.7 0-3-2.9-5.3-7.6-5.3z" />', true),
    phone: svgMark('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />'),
    note: svgMark('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8"'),
    edit: svgMark('<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"'),
    trash: svgMark('<path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6"'),
    check: svgMark('<path d="M20 6 9 17l-5-5"'),
    alert: svgMark('<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01"'),
    info: svgMark('<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01"'),
    bell: svgMark('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0"'),
    lock: svgMark('<rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4"'),
    close: svgMark('<path d="M18 6 6 18" /><path d="M6 6l12 12"'),
    clock: svgMark('<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2"'),
    plus: svgMark('<path d="M12 5v14" /><path d="M5 12h14"'),
    chevronLeft: svgMark('<path d="M15 18l-6-6 6-6"'),
    chevronRight: svgMark('<path d="M9 18l6-6-6-6"'),
    calendar: svgMark('<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18"'),
    clipboard: svgMark('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />'),
    stethoscope: svgMark('<path d="M5 3v5a5 5 0 0 0 10 0V3" /><path d="M10 13v4" /><path d="M10 17a4 4 0 0 0 8 0v-1.5" /><circle cx="6" cy="5" r="1.4" /><circle cx="14" cy="5" r="1.4"'),
    send: svgMark('<path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z"'),
    refresh: svgMark('<path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"'),
    inbox: svgMark('<path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"')
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getTreatmentById(id) {
    var list = Clinic.TREATMENTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return { id: id, name: 'Treatment', color: 'var(--treatment-default)' };
  }

  /* ------------------------------------------------------------------ *
   * Role handling
   * ------------------------------------------------------------------ */
  function getRole() {
    try { return window.sessionStorage.getItem('clinicRole'); } catch (e) { return null; }
  }

  function setRole(role) {
    try {
      if (role === 'admin' || role === 'dentist') {
        window.sessionStorage.setItem('clinicRole', role);
      }
    } catch (e) { /* ignore */ }
  }

  function clearRole() {
    try { window.sessionStorage.removeItem('clinicRole'); } catch (e) { /* ignore */ }
  }

  function enforceRole(requiredRoles) {
    var role = getRole();
    if (!role) {
      window.location.href = 'index.html';
      return false;
    }
    if (requiredRoles.indexOf(role) === -1) {
      showAccessDenied();
      return false;
    }
    return true;
  }

  function showAccessDenied() {
    var denied = document.getElementById('accessDenied');
    var content = document.getElementById('dashboard') ||
      document.getElementById('dentistView') ||
      document.getElementById('remindersView');
    if (denied) denied.classList.remove('hidden');
    if (content) content.classList.add('hidden');
    initRoleBadge();
    initLogout();
    initBackToIndex();
  }

  function initRoleBadge() {
    var badge = document.querySelector('[data-role-badge]');
    if (!badge) return;
    var role = getRole();
    var label = 'Guest';
    var cls = 'guest';
    if (role === 'admin') { label = 'Admin Staff'; cls = 'admin'; }
    else if (role === 'dentist') { label = 'Dentist (Read-only)'; cls = 'dentist'; }
    badge.className = 'role-badge role-' + cls;
    badge.setAttribute('aria-label', label);
    badge.innerHTML = '<span class="role-dot" aria-hidden="true"></span><span class="role-label">' + escapeHtml(label) + '</span>';
  }

  function initLogout() {
    var btn = document.getElementById('logoutBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        clearRole();
        window.location.href = 'index.html';
      });
    }
  }

  function initBackToIndex() {
    var btn = document.getElementById('backToIndex');
    if (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'index.html';
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Appointment hydration / persistence
   * ------------------------------------------------------------------ */
  function persistAppointments() {
    if (Array.isArray(Clinic.APPOINTMENTS)) {
      storageSetJSON(KEYS.appointments, Clinic.APPOINTMENTS);
    }
  }

  function hydrate() {
    // Version check to clear old stale data from previous sessions
    var version = storageGet('kpst.v1.version');
    if (version !== '1.1') {
      storageRemove(KEYS.appointments);
      storageSet('kpst.v1.version', '1.1');
    }

    var stored = storageGetJSON(KEYS.appointments);
    if (stored && Array.isArray(stored)) {
      Clinic.APPOINTMENTS = stored;
      return true;
    }
    // Fresh session: keep the seed array (loaded by mock-data.js) and
    // persist it so all pages in this origin share the same state.
    if (Array.isArray(Clinic.APPOINTMENTS)) {
      persistAppointments();
    }
    return false;
  }

  /* ------------------------------------------------------------------ *
   * Toast system (icon + title + message + progress bar)
   * ------------------------------------------------------------------ */
  var TOAST_DURATION = 3500;

  function showToast(title, message, type) {
    // Backwards-compatible single-argument usage: (message, type)
    if (typeof message !== 'string') {
      type = message;
      message = '';
    }
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var icon = ICONS.info;
    if (type === 'success') icon = ICONS.check;
    else if (type === 'error') icon = ICONS.alert;
    else if (type === 'cancel') icon = ICONS.close;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'status');

    toast.innerHTML =
      '<span class="toast-icon">' + icon + '</span>' +
      '<span class="toast-content">' +
      '<span class="toast-title">' + escapeHtml(title) + '</span>' +
      (message ? '<span class="toast-message">' + escapeHtml(message) + '</span>' : '') +
      '</span>' +
      '<button type="button" class="toast-close" aria-label="Dismiss">' + ICONS.close + '</button>' +
      '<span class="toast-progress" aria-hidden="true"></span>';

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', function () {
      removeToast(toast);
    });

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      removeToast(toast);
    }, TOAST_DURATION);
  }

  function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.remove('show');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 180);
  }

  /* ------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------ */
  function resetData() {
    storageRemove(KEYS.appointments);
    storageRemove(KEYS.reminders);
    window.location.reload();
  }

  Clinic.app = {
    getRole: getRole,
    setRole: setRole,
    clearRole: clearRole,
    enforceRole: enforceRole,
    showAccessDenied: showAccessDenied,
    initRoleBadge: initRoleBadge,
    initLogout: initLogout,
    initBackToIndex: initBackToIndex,
    hydrate: hydrate,
    persistAppointments: persistAppointments,
    showToast: showToast,
    escapeHtml: escapeHtml,
    getTreatmentById: getTreatmentById,
    resetData: resetData,
    icons: ICONS
  };

  window.Clinic = Clinic;

  // Hydrate from storage before any page script renders.
  hydrate();
})(window);