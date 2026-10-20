// Reminders Management with Persistent Status, Failed State Handling, Multi-Select, and wa.me Integration
document.addEventListener('DOMContentLoaded', () => {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
    if (window.Clinic.app.enforceRole && !window.Clinic.app.enforceRole(['admin'])) return;
  }

  initReminders();
});

let currentLang = localStorage.getItem('kpst.v1.reminder_lang') || 'bm';

function escapeHtml(str) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.escapeHtml) {
    return window.Clinic.app.escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function cleanPhoneForWa(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  // If starts with 0 (e.g. 0123456789), prepend 6 for Malaysia
  if (digits.startsWith('0')) return '6' + digits;
  // If starts with 60..., keep it
  if (digits.startsWith('60')) return digits;
  // Fallback
  return '60' + digits;
}

function getStoredReminders() {
  if (!window.Clinic || !window.Clinic.storage) return {};
  return window.Clinic.storage.getJSON(window.Clinic.storage.KEYS.reminders) || {};
}

function setStoredReminders(data) {
  if (!window.Clinic || !window.Clinic.storage) return;
  window.Clinic.storage.setJSON(window.Clinic.storage.KEYS.reminders, data);
}

function getTomorrowRemindersList() {
  if (!window.Clinic || !window.Clinic.APPOINTMENTS) return [];

  const tomorrowDate = window.Clinic.utils.tomorrowDate();
  const tomorrowISO = window.Clinic.utils.toDateISO(tomorrowDate);
  const tomorrowsAppts = window.Clinic.APPOINTMENTS.filter(a => a.dateISO === tomorrowISO);
  const stored = getStoredReminders();

  return tomorrowsAppts.map((appt, idx) => {
    const base = window.Clinic.reminders.buildReminderForAppt(appt, tomorrowDate, 'Queued', currentLang);
    const saved = stored[base.id] || {};

    // Seed the second appointment as "Failed" if uninitialized, for realistic demo testing of Retry button
    let defaultStatus = 'Queued';
    let defaultFailureReason = '';
    if (idx === 1 && !saved.status) {
      defaultStatus = 'Failed';
      defaultFailureReason = 'Gateway timeout (Telco 504)';
    }

    return {
      ...base,
      message: saved.message || base.message,
      status: saved.status || defaultStatus,
      failureReason: saved.failureReason || defaultFailureReason,
      sentAt: saved.sentAt || null,
      appointment: appt
    };
  });
}

function updateStatChips(reminders) {
  const container = document.getElementById('statChips');
  if (!container) return;

  const total = reminders.length;
  const queued = reminders.filter(r => r.status === 'Queued').length;
  const sent = reminders.filter(r => r.status === 'Sent').length;
  const failed = reminders.filter(r => r.status === 'Failed').length;

  container.innerHTML = `
    <span class="stat-chip queued" title="Awaiting dispatch">
      <i class="bi bi-hourglass-split me-1"></i> Queued: ${queued}
    </span>
    <span class="stat-chip sent" title="Successfully delivered">
      <i class="bi bi-check-circle-fill me-1"></i> Sent: ${sent}
    </span>
    ${failed > 0 ? `
    <span class="stat-chip failed" title="Dispatch failed - click Retry">
      <i class="bi bi-exclamation-triangle-fill me-1"></i> Failed: ${failed}
    </span>` : ''}
    <span class="stat-chip" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;">
      <i class="bi bi-people me-1"></i> Total: ${total}
    </span>
  `;

  // Update Dispatch Queued button
  const dispatchAllBtn = document.getElementById('simulateSendAll');
  if (dispatchAllBtn) {
    if (queued === 0 && total > 0) {
      dispatchAllBtn.innerHTML = '<i class="bi bi-check2-all"></i> All Dispatched';
      dispatchAllBtn.classList.replace('btn-dark', 'btn-outline-secondary');
      dispatchAllBtn.disabled = true;
    } else {
      dispatchAllBtn.innerHTML = '<i class="bi bi-send-fill"></i> Dispatch Queued';
      dispatchAllBtn.classList.replace('btn-outline-secondary', 'btn-dark');
      dispatchAllBtn.disabled = false;
    }
  }
}

function updateSelectedCount() {
  const checkedBoxes = document.querySelectorAll('.reminder-select:checked');
  const count = checkedBoxes.length;
  const countEl = document.getElementById('selectedCount');
  const btn = document.getElementById('dispatchSelectedBtn');
  if (countEl) countEl.innerText = count;
  if (btn) btn.disabled = count === 0;

  const allBoxes = document.querySelectorAll('.reminder-select');
  const selectAll = document.getElementById('selectAllReminders');
  if (selectAll && allBoxes.length > 0) {
    selectAll.checked = (count === allBoxes.length);
    selectAll.indeterminate = (count > 0 && count < allBoxes.length);
  }
}

function renderRemindersTable() {
  const tbody = document.getElementById('remindersBody');
  if (!tbody) return;

  const reminders = getTomorrowRemindersList();
  tbody.innerHTML = '';

  updateStatChips(reminders);

  if (reminders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No reminders scheduled for tomorrow.</td></tr>';
    return;
  }

  reminders.forEach(reminder => {
    const isSent = reminder.status === 'Sent';
    const isFailed = reminder.status === 'Failed';
    const tr = document.createElement('tr');
    tr.id = `row-${reminder.id}`;

    let statusBadge = '';
    let actionHtml = '';

    if (isSent) {
      statusBadge = `<span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i> Sent</span>`;
      actionHtml = `
        <button class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 resend-btn" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}" title="Resend reminder">
          <i class="bi bi-arrow-clockwise"></i> Resend
        </button>
      `;
    } else if (isFailed) {
      statusBadge = `<span class="badge rounded-pill bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1" title="${escapeHtml(reminder.failureReason || 'Delivery failed')}"><i class="bi bi-exclamation-triangle-fill me-1"></i> Failed</span>`;
      actionHtml = `
        <button class="btn btn-sm btn-outline-danger fw-bold d-inline-flex align-items-center gap-1 retry-btn" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}" title="Retry failed delivery">
          <i class="bi bi-arrow-repeat"></i> Retry
        </button>
      `;
    } else {
      statusBadge = `<span class="badge rounded-pill bg-warning-subtle text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-hourglass-split me-1"></i> Queued</span>`;
      actionHtml = `
        <button class="btn btn-sm btn-outline-success fw-bold d-inline-flex align-items-center gap-1 send-now-btn" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}">
          <i class="bi bi-send"></i> Send Now
        </button>
      `;
    }

    const cleanPhone = cleanPhoneForWa(reminder.phone);
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminder.message)}`;
    const timeFormatted = window.Clinic.utils.formatTime12h(reminder.appointmentTime);

    tr.innerHTML = `
      <td class="text-center align-middle">
        <input type="checkbox" class="form-check-input reminder-select" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}" aria-label="Select reminder for ${escapeHtml(reminder.patientName)}">
      </td>
      <td>
        <div class="d-flex align-items-center">
          <div class="bg-light rounded-circle p-2 me-3 text-secondary d-flex justify-content-center align-items-center" style="width:36px;height:36px;">
            <i class="bi bi-person"></i>
          </div>
          <div>
            <span class="fw-bold text-dark d-block">${escapeHtml(reminder.patientName)}</span>
            ${isFailed ? `<small class="text-danger" style="font-size:0.75rem;"><i class="bi bi-x-circle me-1"></i>${escapeHtml(reminder.failureReason)}</small>` : ''}
          </div>
        </div>
      </td>
      <td class="text-muted align-middle font-monospace" style="font-size: 0.85rem;">${escapeHtml(reminder.phone)}</td>
      <td class="align-middle fw-semibold text-dark">${timeFormatted}</td>
      <td class="align-middle">
        <div class="d-inline-flex align-items-center gap-1">
          <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 preview-msg-btn" data-msg="${encodeURIComponent(reminder.message)}" data-id="${reminder.id}" data-phone="${cleanPhone}">
            <i class="bi bi-eye text-primary"></i> Preview
          </button>
          <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 edit-msg-btn" data-msg="${encodeURIComponent(reminder.message)}" data-id="${reminder.id}" data-apptid="${reminder.appointmentId}">
            <i class="bi bi-pencil text-secondary"></i>
          </button>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1" title="Open chat in WhatsApp">
            <i class="bi bi-whatsapp"></i> Chat
          </a>
        </div>
      </td>
      <td class="align-middle status-cell">
        ${statusBadge}
      </td>
      <td class="align-middle action-cell">
        ${actionHtml}
      </td>
    `;

    tbody.appendChild(tr);
  });

  bindTableEvents();
  updateSelectedCount();
}

function bindTableEvents() {
  // Bind Checkboxes
  document.querySelectorAll('.reminder-select').forEach(cb => {
    cb.addEventListener('change', updateSelectedCount);
  });

  // Bind Preview buttons
  document.querySelectorAll('.preview-msg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msg = decodeURIComponent(e.currentTarget.getAttribute('data-msg'));
      const cleanPhone = e.currentTarget.getAttribute('data-phone');
      const tr = e.currentTarget.closest('tr');
      const patientName = tr.querySelector('.fw-bold').innerText;
      const patientPhone = tr.querySelectorAll('td')[2].innerText;

      document.getElementById('previewMessageContent').innerText = msg;
      document.getElementById('previewPatientName').innerText = patientName;
      document.getElementById('previewPatientPhone').innerText = patientPhone;

      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      document.getElementById('previewTimestamp').innerText = window.Clinic.utils.formatTime12h(timeStr);

      const waBtn = document.getElementById('previewWaLink');
      if (waBtn) {
        waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      }

      const modalEl = document.getElementById('messagePreviewModal');
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.show();
    });
  });

  // Bind Edit buttons
  document.querySelectorAll('.edit-msg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msg = decodeURIComponent(e.currentTarget.getAttribute('data-msg'));
      const id = e.currentTarget.getAttribute('data-id');
      const apptId = e.currentTarget.getAttribute('data-apptid');

      document.getElementById('editMessageContent').value = msg;
      document.getElementById('editMessageId').value = id;
      document.getElementById('editApptId').value = apptId;

      const modalEl = document.getElementById('editMessageModal');
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.show();
    });
  });

  // Bind Send Now buttons
  document.querySelectorAll('.send-now-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const patientName = e.currentTarget.getAttribute('data-patient');
      dispatchReminder(id, patientName, e.currentTarget, 'sent');
    });
  });

  // Bind Retry buttons
  document.querySelectorAll('.retry-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const patientName = e.currentTarget.getAttribute('data-patient');
      dispatchReminder(id, patientName, e.currentTarget, 'retry');
    });
  });

  // Bind Resend buttons
  document.querySelectorAll('.resend-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const patientName = e.currentTarget.getAttribute('data-patient');
      dispatchReminder(id, patientName, e.currentTarget, 'resend');
    });
  });
}

function dispatchReminder(id, patientName, btnEl, actionType) {
  if (btnEl) {
    btnEl.disabled = true;
    const label = actionType === 'retry' ? 'Retrying...' : (actionType === 'resend' ? 'Resending...' : 'Sending...');
    btnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> ${label}`;
  }

  setTimeout(() => {
    const stored = getStoredReminders();
    stored[id] = {
      ...(stored[id] || {}),
      status: 'Sent',
      failureReason: '',
      sentAt: new Date().toISOString()
    };
    setStoredReminders(stored);

    renderRemindersTable();

    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      const title = actionType === 'retry' ? 'Delivery Recovered' : (actionType === 'resend' ? 'Reminder Resent' : 'Reminder Dispatched');
      window.Clinic.app.showToast(title, `WhatsApp reminder successfully dispatched to ${patientName}.`, 'success');
    }
  }, 450);
}

function initReminders() {
  // Sync Language Toggle buttons
  const langBM = document.getElementById('langBM');
  const langEN = document.getElementById('langEN');

  function updateLangUI() {
    if (langBM && langEN) {
      if (currentLang === 'en') {
        langEN.classList.add('active');
        langBM.classList.remove('active');
      } else {
        langBM.classList.add('active');
        langEN.classList.remove('active');
      }
    }
  }

  if (langBM) {
    langBM.addEventListener('click', () => {
      if (currentLang === 'bm') return;
      currentLang = 'bm';
      localStorage.setItem('kpst.v1.reminder_lang', 'bm');
      updateLangUI();
      // Re-generate default templates for non-customized reminders
      const stored = getStoredReminders();
      const tomorrowDate = window.Clinic.utils.tomorrowDate();
      const tomorrowsAppts = (window.Clinic.APPOINTMENTS || []).filter(a => a.dateISO === window.Clinic.utils.toDateISO(tomorrowDate));
      tomorrowsAppts.forEach(appt => {
        const remId = 'rem-' + appt.id;
        const fresh = window.Clinic.reminders.buildReminderForAppt(appt, tomorrowDate, 'Queued', 'bm');
        if (!stored[remId] || !stored[remId].isCustomized) {
          stored[remId] = { ...(stored[remId] || {}), message: fresh.message };
        }
      });
      setStoredReminders(stored);
      renderRemindersTable();
      if (window.Clinic.app && window.Clinic.app.showToast) {
        window.Clinic.app.showToast('Language Updated', 'Reminder templates switched to Bahasa Melayu.', 'info');
      }
    });
  }

  if (langEN) {
    langEN.addEventListener('click', () => {
      if (currentLang === 'en') return;
      currentLang = 'en';
      localStorage.setItem('kpst.v1.reminder_lang', 'en');
      updateLangUI();
      const stored = getStoredReminders();
      const tomorrowDate = window.Clinic.utils.tomorrowDate();
      const tomorrowsAppts = (window.Clinic.APPOINTMENTS || []).filter(a => a.dateISO === window.Clinic.utils.toDateISO(tomorrowDate));
      tomorrowsAppts.forEach(appt => {
        const remId = 'rem-' + appt.id;
        const fresh = window.Clinic.reminders.buildReminderForAppt(appt, tomorrowDate, 'Queued', 'en');
        if (!stored[remId] || !stored[remId].isCustomized) {
          stored[remId] = { ...(stored[remId] || {}), message: fresh.message };
        }
      });
      setStoredReminders(stored);
      renderRemindersTable();
      if (window.Clinic.app && window.Clinic.app.showToast) {
        window.Clinic.app.showToast('Language Updated', 'Reminder templates switched to English.', 'info');
      }
    });
  }

  updateLangUI();

  // Select All Checkbox
  const selectAll = document.getElementById('selectAllReminders');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      document.querySelectorAll('.reminder-select').forEach(cb => {
        cb.checked = isChecked;
      });
      updateSelectedCount();
    });
  }

  // Dispatch Selected (Batch) Button
  const dispatchSelectedBtn = document.getElementById('dispatchSelectedBtn');
  if (dispatchSelectedBtn) {
    dispatchSelectedBtn.addEventListener('click', () => {
      const checkedBoxes = Array.from(document.querySelectorAll('.reminder-select:checked'));
      if (checkedBoxes.length === 0) return;

      const confirmCountEl = document.getElementById('batchConfirmCount');
      if (confirmCountEl) confirmCountEl.innerText = checkedBoxes.length;

      const modalEl = document.getElementById('batchConfirmModal');
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.show();
    });
  }

  // Batch Confirm Submit Button
  const batchConfirmSubmitBtn = document.getElementById('batchConfirmSubmitBtn');
  if (batchConfirmSubmitBtn) {
    batchConfirmSubmitBtn.addEventListener('click', () => {
      const checkedBoxes = Array.from(document.querySelectorAll('.reminder-select:checked'));
      if (checkedBoxes.length === 0) return;

      batchConfirmSubmitBtn.disabled = true;
      batchConfirmSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Dispatching...`;

      setTimeout(() => {
        const stored = getStoredReminders();
        checkedBoxes.forEach(cb => {
          const id = cb.getAttribute('data-id');
          stored[id] = {
            ...(stored[id] || {}),
            status: 'Sent',
            failureReason: '',
            sentAt: new Date().toISOString()
          };
        });
        setStoredReminders(stored);

        batchConfirmSubmitBtn.disabled = false;
        batchConfirmSubmitBtn.innerText = 'Dispatch Now';

        const modalEl = document.getElementById('batchConfirmModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        renderRemindersTable();

        if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
          window.Clinic.app.showToast('Batch Dispatch Complete', `Successfully dispatched ${checkedBoxes.length} WhatsApp reminders.`, 'success');
        }
      }, 500);
    });
  }

  // Dispatch Queued (Send All Queued) Button with Confirmation Step
  const dispatchAllBtn = document.getElementById('simulateSendAll');
  if (dispatchAllBtn) {
    dispatchAllBtn.addEventListener('click', () => {
      const reminders = getTomorrowRemindersList();
      const queuedList = reminders.filter(r => r.status === 'Queued');

      if (queuedList.length === 0) {
        if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
          window.Clinic.app.showToast('Queue Empty', 'All reminders have already been dispatched.', 'info');
        }
        return;
      }

      // Check all queued reminder checkboxes
      document.querySelectorAll('.reminder-select').forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = queuedList.some(q => q.id === id);
      });
      updateSelectedCount();

      // Open batch confirmation modal
      const confirmCountEl = document.getElementById('batchConfirmCount');
      if (confirmCountEl) confirmCountEl.innerText = queuedList.length;

      const modalEl = document.getElementById('batchConfirmModal');
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.show();
    });
  }

  // Edit Message Quick Template Reset Buttons
  const resetBM = document.getElementById('resetTemplateBM');
  const resetEN = document.getElementById('resetTemplateEN');
  const editApptId = document.getElementById('editApptId');
  const editContent = document.getElementById('editMessageContent');

  if (resetBM && editApptId && editContent) {
    resetBM.addEventListener('click', () => {
      const apptId = editApptId.value;
      const appt = (window.Clinic.APPOINTMENTS || []).find(a => a.id === apptId);
      if (appt) {
        const fresh = window.Clinic.reminders.buildReminderForAppt(appt, window.Clinic.utils.tomorrowDate(), 'Queued', 'bm');
        editContent.value = fresh.message;
      }
    });
  }

  if (resetEN && editApptId && editContent) {
    resetEN.addEventListener('click', () => {
      const apptId = editApptId.value;
      const appt = (window.Clinic.APPOINTMENTS || []).find(a => a.id === apptId);
      if (appt) {
        const fresh = window.Clinic.reminders.buildReminderForAppt(appt, window.Clinic.utils.tomorrowDate(), 'Queued', 'en');
        editContent.value = fresh.message;
      }
    });
  }

  // Edit Message Form Submission
  const editForm = document.getElementById('editMessageForm');
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editMessageId').value;
      const newMsg = document.getElementById('editMessageContent').value.trim();

      if (id && newMsg) {
        const stored = getStoredReminders();
        stored[id] = {
          ...(stored[id] || {}),
          message: newMsg,
          isCustomized: true
        };
        setStoredReminders(stored);

        const modalEl = document.getElementById('editMessageModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        renderRemindersTable();

        if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
          window.Clinic.app.showToast('Message Updated', 'WhatsApp template updated for this appointment.', 'success');
        }
      }
    });
  }

  renderRemindersTable();
}
