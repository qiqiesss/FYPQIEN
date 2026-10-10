// Polish up any dynamically generated buttons to match Bootstrap
    document.addEventListener('DOMContentLoaded', () => {
      const observer = new MutationObserver(() => {
        document.querySelectorAll('#remindersBody button.ghost').forEach(btn => {
          if (!btn.classList.contains('btn-sm')) {
            btn.className = 'btn btn-sm btn-outline-primary fw-bold';
            btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Retry';
          }
        });
      });
      const tableBody = document.getElementById('remindersBody');
      if (tableBody) observer.observe(tableBody, { childList: true, subtree: true });
      
      if (window.Clinic && window.Clinic.app) {
        if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
        if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
      }

      renderRemindersTable();
    });

    function renderRemindersTable() {
      const tbody = document.getElementById('remindersBody');
      if (!tbody) return;
      tbody.innerHTML = '';
      
      if (!window.Clinic || !window.Clinic.APPOINTMENTS) return;
      
      const tomorrowISO = window.Clinic.utils.toDateISO(window.Clinic.utils.tomorrowDate());
      const tomorrowsAppts = window.Clinic.APPOINTMENTS.filter(a => a.dateISO === tomorrowISO);
      
      if (tomorrowsAppts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No reminders scheduled for tomorrow.</td></tr>';
        return;
      }
      
      tomorrowsAppts.forEach(appt => {
        const reminder = window.Clinic.reminders.buildReminderForAppt(appt, window.Clinic.utils.tomorrowDate());
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="d-flex align-items-center">
              <div class="bg-light rounded-circle p-2 me-3 text-secondary d-flex justify-content-center align-items-center" style="width:36px;height:36px;">
                <i class="bi bi-person"></i>
              </div>
              <span class="fw-bold text-dark">${reminder.patientName}</span>
            </div>
          </td>
          <td class="text-muted align-middle">${reminder.phone}</td>
          <td class="align-middle fw-medium">${window.Clinic.utils.formatTime12h(reminder.appointmentTime)}</td>
          <td class="align-middle">
            <div class="d-inline-flex gap-1">
              <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 preview-msg-btn" data-msg="${encodeURIComponent(reminder.message)}">
                <i class="bi bi-eye text-primary"></i> Preview
              </button>
              <button class="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 edit-msg-btn" data-msg="${encodeURIComponent(reminder.message)}">
                <i class="bi bi-pencil text-secondary"></i>
              </button>
            </div>
          </td>
          <td class="align-middle">
            <span class="badge rounded-pill bg-warning-subtle text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-hourglass-split me-1"></i> Queued</span>
          </td>
          <td class="align-middle">
            <button class="btn btn-sm btn-outline-success fw-bold d-inline-flex align-items-center gap-1">
              <i class="bi bi-send"></i> Send Now
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Bind preview/edit buttons
      document.querySelectorAll('.preview-msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const msg = decodeURIComponent(e.currentTarget.getAttribute('data-msg'));
          const patientName = e.currentTarget.closest('tr').querySelector('.fw-bold').innerText;
          const patientPhone = e.currentTarget.closest('tr').querySelectorAll('td')[1].innerText;
          
          document.getElementById('previewMessageContent').innerText = msg;
          document.getElementById('previewPatientName').innerText = patientName;
          document.getElementById('previewPatientPhone').innerText = patientPhone;
          
          const now = new Date();
          document.getElementById('previewTimestamp').innerText = window.Clinic.utils.formatTime12h(now.getHours() + ':' + now.getMinutes());
          
          const modal = new bootstrap.Modal(document.getElementById('messagePreviewModal'));
          modal.show();
        });
      });
      
      document.querySelectorAll('.edit-msg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const msg = decodeURIComponent(e.currentTarget.getAttribute('data-msg'));
          document.getElementById('editMessageContent').value = msg;
          const modal = new bootstrap.Modal(document.getElementById('editMessageModal'));
          modal.show();
        });
      });
    }