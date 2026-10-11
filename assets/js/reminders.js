// Reminders Management with Persistent Status and Dispatch Workflows
document.addEventListener('DOMContentLoaded', () => {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
  }

  initReminders();
});

function escapeHtml(str) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.escapeHtml) {
    return window.Clinic.app.escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
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

  const tomorrowISO = window.Clinic.utils.toDateISO(window.Clinic.utils.tomorrowDate());
  const tomorrowsAppts = window.Clinic.APPOINTMENTS.filter(a => a.dateISO === tomorrowISO);
  const stored = getStoredReminders();

  return tomorrowsAppts.map(appt => {
    const base = window.Clinic.reminders.buildReminderForAppt(appt, window.Clinic.utils.tomorrowDate());
    const saved = stored[base.id] || {};
    return {
      ...base,
      message: saved.message || base.message,
      status: saved.status || 'Queued',
      sentAt: saved.sentAt || null
    };
  });
}

function updateStatChips(reminders) {
  const container = document.getElementById('statChips');
  if (!container) return;

  const total = reminders.length;
  const queued = reminders.filter(r => r.status === 'Queued').length;
  const sent = reminders.filter(r => r.status === 'Sent').length;

  container.innerHTML = `
    <span class="stat-chip queued">
      <i class="bi bi-hourglass-split me-1"></i> Queued: ${queued}
    </span>
    <span class="stat-chip sent">
      <i class="bi bi-check-circle-fill me-1"></i> Sent: ${sent}
    </span>
    <span class="stat-chip" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;">
      <i class="bi bi-people me-1"></i> Total: ${total}
    </span>
  `;

  // Update Dispatch Queued button badge/disabled state if none queued
  const dispatchAllBtn = document.getElementById('simulateSendAll');
  if (dispatchAllBtn) {
    if (queued === 0 && total > 0) {
      dispatchAllBtn.innerHTML = '<i class="bi bi-check2-all"></i> All Dispatched';
      dispatchAllBtn.classList.replace('btn-dark', 'btn-outline-secondary');
    } else {
      dispatchAllBtn.innerHTML = '<i class="bi bi-send-fill"></i> Dispatch Queued';
      dispatchAllBtn.classList.replace('btn-outline-secondary', 'btn-dark');
    }
  }
}

function renderRemindersTable() {
  const tbody = document.getElementById('remindersBody');
  if (!tbody) return;

  const reminders = getTomorrowRemindersList();
  tbody.innerHTML = '';

  updateStatChips(reminders);

  if (reminders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No reminders scheduled for tomorrow.</td></tr>';
    return;
  }

  reminders.forEach(reminder => {
    const isSent = reminder.status === 'Sent';
    const tr = document.createElement('tr');
    tr.id = `row-${reminder.id}`;

    const statusBadge = isSent
      ? `<span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i> Sent</span>`
      : `<span class="badge rounded-pill bg-warning-subtle text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-hourglass-split me-1"></i> Queued</span>`;

    const actionHtml = isSent
      ? `<div class="d-inline-flex align-items-center gap-1">
           <button class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 resend-btn" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}" title="Resend reminder">
             <i class="bi bi-arrow-clockwise"></i> Resend
           </button>
         </div>`
      : `<button class="btn btn-sm btn-outline-success fw-bold d-inline-flex align-items-center gap-1 send-now-btn" data-id="${reminder.id}" data-patient="${escapeHtml(reminder.patientName)}">
           <i class="bi bi-send"></i> Send Now
         </button>`;

    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <div class="bg-light rounded-circle p-2 me-3 text-secondary d-flex justify-content-center align-items-center" style="width:36px;height:36px;">
            <i class="bi bi-person"></i>
          </div>
          <span class="fw-bold text-dark">${escapeHtml(reminder.patientName)}</span>
        </div>
      </td>
      <td class="text-muted align-middle">${escapeHtml(reminder.phone)}</td>
      <td class="align-middle fw-medium">${window.Clinic.utils.formatTime12h(reminder.appointmentTime)}</td>
      <td class="align-middle">
        <div class="d-inline-flex gap-1">
          <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 preview-msg-btn" data-msg="${encodeURIComponent(reminder.message)}" data-id="${reminder.id}">
            <i class="bi bi-eye text-primary"></i> Preview
          </button>
          <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 edit-msg-btn" data-msg="${encodeURIComponent(reminder.message)}" data-id="${reminder.id}">
            <i class="bi bi-pencil text-secondary"></i>
          </button>
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
}

function bindTableEvents() {
  // Bind Preview buttons
  document.querySelectorAll('.preview-msg-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const msg = decodeURIComponent(e.currentTarget.getAttribute('data-msg'));
      const tr = e.currentTarget.closest('tr');
      const patientName = tr.querySelector('.fw-bold').innerText;
      const patientPhone = tr.querySelectorAll('td')[1].innerText;

      document.getElementById('previewMessageContent').innerText = msg;
      document.getElementById('previewPatientName').innerText = patientName;
      document.getElementById('previewPatientPhone').innerText = patientPhone;

      const now = new Date();
      document.getElementById('previewTimestamp').innerText = window.Clinic.utils.formatTime12h(now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'));

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

      document.getElementById('editMessageContent').value = msg;
      document.getElementById('editMessageId').value = id;

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
      sendSingleReminder(id, patientName, e.currentTarget);
    });
  });

  // Bind Resend buttons
  document.querySelectorAll('.resend-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const patientName = e.currentTarget.getAttribute('data-patient');
      resendSingleReminder(id, patientName, e.currentTarget);
    });
  });
}

function sendSingleReminder(id, patientName, btnEl) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Sending...`;
  }

  setTimeout(() => {
    const stored = getStoredReminders();
    stored[id] = {
      ...(stored[id] || {}),
      status: 'Sent',
      sentAt: new Date().toISOString()
    };
    setStoredReminders(stored);

    // Re-render table and stat chips
    renderRemindersTable();

    // Show toast
    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      window.Clinic.app.showToast('Reminder Sent', `WhatsApp reminder successfully dispatched to ${patientName}.`, 'success');
    }
  }, 400);
}

function resendSingleReminder(id, patientName, btnEl) {
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Resending...`;
  }

  setTimeout(() => {
    const stored = getStoredReminders();
    stored[id] = {
      ...(stored[id] || {}),
      status: 'Sent',
      sentAt: new Date().toISOString()
    };
    setStoredReminders(stored);

    renderRemindersTable();

    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      window.Clinic.app.showToast('Reminder Resent', `WhatsApp reminder resent to ${patientName}.`, 'success');
    }
  }, 400);
}

function initReminders() {
  renderRemindersTable();

  // Dispatch Queued (Batch Send) Button
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

      // Show processing state
      const originalHtml = dispatchAllBtn.innerHTML;
      dispatchAllBtn.disabled = true;
      dispatchAllBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Dispatching (${queuedList.length})...`;

      setTimeout(() => {
        const stored = getStoredReminders();
        queuedList.forEach(item => {
          stored[item.id] = {
            ...(stored[item.id] || {}),
            status: 'Sent',
            sentAt: new Date().toISOString()
          };
        });
        setStoredReminders(stored);

        dispatchAllBtn.disabled = false;
        dispatchAllBtn.innerHTML = originalHtml;

        renderRemindersTable();

        if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
          window.Clinic.app.showToast('Batch Dispatch Complete', `Successfully dispatched ${queuedList.length} queued WhatsApp reminder${queuedList.length > 1 ? 's' : ''}!`, 'success');
        }
      }, 600);
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
          message: newMsg
        };
        setStoredReminders(stored);

        // Hide modal
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
}