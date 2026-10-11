(function (window) {
  'use strict';

  const Clinic = window.Clinic || {};
  const app = Clinic.app || {};
  const utils = Clinic.utils || {};

  const CLINIC_START = '09:00';
  const CLINIC_END = '18:00';
  const SLOT_INTERVAL_MIN = 30;
  const BUFFER_MIN = 5;

  let currentDate = utils.todayDate ? new Date(utils.todayDate()) : new Date();
  let selectedSlotTime = null;
  let editingAppointmentId = null;
  let currentStatusFilter = 'All';
  let currentSearchQuery = '';

  function parseTimeHHMM(t) {
    const parts = t.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  function formatTimeHHMM(minsTotal) {
    const h = Math.floor(minsTotal / 60) % 24;
    const m = minsTotal % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function getSlotList() {
    const slots = [];
    let t = parseTimeHHMM(CLINIC_START);
    const endT = parseTimeHHMM(CLINIC_END);
    while (t <= endT) {
      slots.push(formatTimeHHMM(t));
      t += SLOT_INTERVAL_MIN;
    }
    return slots;
  }

  function isSlotPast(slotTime, dateISO) {
    const todayISO = utils.toDateISO ? utils.toDateISO(new Date()) : '';
    if (dateISO !== todayISO) return false;
    const now = new Date();
    const [sh, sm] = slotTime.split(':').map((x) => parseInt(x, 10));
    // A slot is only considered past when its 30-minute duration is over
    const slotEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm + SLOT_INTERVAL_MIN, 0, 0);
    return slotEndDate <= now;
  }

  function getAppointmentsForDate(dateISO) {
    const list = Clinic.APPOINTMENTS || [];
    const result = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].dateISO === dateISO) {
        result.push(list[i]);
      }
    }
    return result;
  }

  function findAppointmentAt(dateISO, slotTime) {
    const appts = getAppointmentsForDate(dateISO);
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].time === slotTime) return appts[i];
    }
    return null;
  }

  function isBufferSlot(dateISO, slotTime) {
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    for (let i = 0; i < appts.length; i++) {
      const apptStart = parseTimeHHMM(appts[i].time);
      const apptEnd = apptStart + SLOT_INTERVAL_MIN;
      const bufStart = apptEnd;
      const bufEnd = apptEnd + BUFFER_MIN;
      if (slotStart >= bufStart && slotStart < bufEnd) {
        return true;
      }
    }
    return false;
  }

  function getBufferInfoForSlot(dateISO, slotTime) {
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    for (let i = 0; i < appts.length; i++) {
      const apptStart = parseTimeHHMM(appts[i].time);
      const apptEnd = apptStart + SLOT_INTERVAL_MIN;
      const bufStart = apptEnd;
      const bufEnd = apptEnd + BUFFER_MIN;
      if (slotStart >= bufStart && slotStart < bufEnd) {
        return {
          active: true,
          range: formatTimeHHMM(bufStart) + '–' + formatTimeHHMM(bufEnd)
        };
      }
    }
    return { active: false };
  }

  function updateAppointmentById(id, updatedData) {
    if (!Clinic.APPOINTMENTS) return;
    for (let i = 0; i < Clinic.APPOINTMENTS.length; i++) {
      if (Clinic.APPOINTMENTS[i].id === id) {
        Object.assign(Clinic.APPOINTMENTS[i], updatedData);
        Clinic.APPOINTMENTS[i].id = id; // Preserve original ID
        if (app.persistAppointments) app.persistAppointments();
        break;
      }
    }
  }

  function hasConflictAtSubmit(dateISO, slotTime, phone, ignoreId = null) {
    // (a) slot now occupied
    const existingAppt = findAppointmentAt(dateISO, slotTime);
    if (existingAppt && existingAppt.id !== ignoreId) return { has: true, reason: 'Slot is already booked.' };
    // (b) slot start within buffer following any booking
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].id === ignoreId) continue;
      const apptStart = parseTimeHHMM(appts[i].time);
      const bufStart = apptStart + SLOT_INTERVAL_MIN;
      const bufEnd = bufStart + BUFFER_MIN;
      if (slotStart >= bufStart && slotStart < bufEnd) {
        return {
          has: true,
          reason: 'Slot falls within the 5-minute cleaning buffer following another booking (' + formatTimeHHMM(bufStart) + '–' + formatTimeHHMM(bufEnd) + ').'
        };
      }
    }
    // (c) same phone within ±60 min
    if (phone) {
      const normalizedPhone = phone.trim();
      for (let i = 0; i < appts.length; i++) {
        if (appts[i].phone && appts[i].phone.replace(/\s+/g, '') === normalizedPhone.replace(/\s+/g, '')) {
          const diff = Math.abs(slotStart - parseTimeHHMM(appts[i].time));
          if (diff <= 60) {
            return {
              has: true,
              reason: 'Same patient phone already booked that day within ±60 minutes of this time.'
            };
          }
        }
      }
    }
    return { has: false };
  }

  function addAppointment(newAppt) {
    if (!Clinic.APPOINTMENTS) Clinic.APPOINTMENTS = [];
    Clinic.APPOINTMENTS.push(newAppt);
    if (app.persistAppointments) app.persistAppointments();
  }

  function cancelAppointmentById(id) {
    if (!Clinic.APPOINTMENTS) return;
    for (let i = Clinic.APPOINTMENTS.length - 1; i >= 0; i--) {
      if (Clinic.APPOINTMENTS[i].id === id) {
        Clinic.APPOINTMENTS.splice(i, 1);
        if (app.persistAppointments) app.persistAppointments();
        break;
      }
    }
  }

  function generateId() {
    return 'appt-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  function renderDateLabel() {
    const label = document.getElementById('dateLabel');
    if (label && utils.formatReadableDate) {
      label.textContent = utils.formatReadableDate(currentDate);
    }
  }

  function renderTreatmentLegend() {
    const list = document.getElementById('treatmentLegend');
    if (!list) return;
    list.innerHTML = '';
    const treatments = Clinic.TREATMENTS || [];
    treatments.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'legend-item';
      const chip = document.createElement('span');
      chip.className = 'legend-chip';
      chip.style.background = t.color;
      const name = document.createElement('span');
      name.textContent = t.name;
      li.appendChild(chip);
      li.appendChild(name);
      list.appendChild(li);
    });
  }

  function renderSummary() {
    const list = document.getElementById('summaryList');
    const badge = document.getElementById('appointmentCountBadge');

    const dateISO = utils.toDateISO(currentDate);
    const appts = getAppointmentsForDate(dateISO);
    const todayISO = utils.toDateISO(new Date());
    let total = appts.length;

    if (badge) {
      let dayWord = 'Today';
      if (dateISO !== todayISO) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateISO === utils.toDateISO(tomorrow)) dayWord = 'Tomorrow';
        else if (dateISO === utils.toDateISO(yesterday)) dayWord = 'Yesterday';
        else dayWord = 'on ' + utils.formatReadableDate(currentDate);
      }
      badge.textContent = total + ' Appointments ' + dayWord;
    }

    if (!list) return;

    let pastCompleted = 0;
    let remaining = 0;
    if (dateISO === todayISO) {
      const now = new Date();
      appts.forEach(function (a) {
        const [h, m] = a.time.split(':').map((x) => parseInt(x, 10));
        const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
        if (slotDate < now) {
          pastCompleted++;
        } else {
          remaining++;
        }
      });
    } else {
      remaining = total;
      pastCompleted = 0;
    }
    list.innerHTML = '';
    const items = [
      { label: 'Total appointments', value: total },
      { label: 'Past/completed', value: pastCompleted },
      { label: 'Remaining', value: remaining }
    ];
    items.forEach(function (it) {
      const li = document.createElement('li');
      li.className = 'summary-item';
      const lbl = document.createElement('span');
      lbl.textContent = it.label;
      const val = document.createElement('strong');
      val.textContent = it.value;
      li.appendChild(lbl);
      li.appendChild(val);
      list.appendChild(li);
    });
  }

  function renderGrid() {
    const table = document.getElementById('slotTable');
    if (!table) return;
    table.innerHTML = '';
    const dateISO = utils.toDateISO(currentDate);
    const slots = getSlotList();

    // Identify the "next" appointment for today
    let nextApptId = null;
    if (dateISO === utils.toDateISO(new Date())) {
      const now = new Date();

      const currentMins = now.getHours() * 60 + now.getMinutes();
      const appts = getAppointmentsForDate(dateISO);

      let minDiff = Infinity;
      appts.forEach(a => {
        const [h, m] = a.time.split(':');
        const apptMins = parseInt(h, 10) * 60 + parseInt(m, 10);
        if (apptMins >= currentMins && (apptMins - currentMins) < minDiff) {
          minDiff = apptMins - currentMins;
          nextApptId = a.id;
        }
      });
    }

    slots.forEach(function (slotTime) {
      const row = document.createElement('div');
      row.className = 'time-slot-row position-relative';
      row.dataset.hour = slotTime.split(':')[0];

      const timeEl = document.createElement('div');
      timeEl.className = 'time-label text-center text-muted fw-medium';
      timeEl.style.fontSize = '0.85rem';

      const [sh, sm] = slotTime.split(':');
      const hour = parseInt(sh, 10);
      const min = parseInt(sm, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;

      let isOngoingSlot = false;
      if (dateISO === utils.toDateISO(new Date())) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const startMins = hour * 60 + min;
        const endMins = startMins + 30;
        if (currentMins >= startMins && currentMins < endMins) {
          isOngoingSlot = true;
        }
      }

      if (isOngoingSlot) {
        timeEl.classList.remove('text-muted');
        timeEl.classList.add('bg-primary', 'text-white', 'shadow-sm', 'rounded');
        timeEl.style.padding = '0.5rem 0.25rem';
        timeEl.innerHTML = `<strong style="font-size: 1rem;">${String(hour12).padStart(2, '0')}:${sm}</strong><br><span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Current</span>`;
      } else {
        timeEl.innerHTML = `${String(hour12).padStart(2, '0')}:${sm}<br><span style="font-size: 0.75rem;">${ampm}</span>`;
      }

      const cell = document.createElement('div');
      cell.className = 'time-slot-content';
      cell.dataset.slot = slotTime;

      // Handle the Clinic Break at 12:00
      if (slotTime === '12:00') {
        cell.classList.add('d-flex', 'align-items-center', 'justify-content-center');
        cell.innerHTML = '<span class="text-secondary" style="font-size: 0.85rem; font-style: italic;"><i class="bi bi-cup-hot me-1"></i> Clinic Break / Open for Emergency Slot</span>';
      } else {
        const past = isSlotPast(slotTime, dateISO);
        let appt = findAppointmentAt(dateISO, slotTime);

        if (appt) {
          // Smart Canceled Logic
          if (appt.statusPill === 'Canceled') {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const startMins = hour * 60 + min;
            if (currentMins < startMins) {
              appt = null; // Hide future canceled appointments
            }
          }
        }

        if (appt) {
          let c = { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' }; // Default
          if (appt.statusPill === 'Waiting') {
            c = { bg: '#fff7ed', text: '#c2410c', border: '#fb923c' }; // Orange
          } else if (appt.statusPill === 'Completed') {
            c = { bg: '#f8fafc', text: '#475569', border: '#94a3b8' }; // Slate
          } else if (appt.statusPill === 'Canceled') {
            c = { bg: '#fef2f2', text: '#991b1b', border: '#f87171' }; // Red
          }

          const card = document.createElement('div');
          card.className = 'appointment-card';
          // Set data-styled so observer ignores it
          card.setAttribute('data-styled', 'true');
          card.style.backgroundColor = c.bg;
          card.style.color = c.text;
          card.style.borderLeftColor = c.border;

          let isOpaque = false;
          let isHighlighted = false;

          if (currentStatusFilter !== 'All' && appt.statusPill !== currentStatusFilter) {
            isOpaque = true;
          }

          if (currentSearchQuery && currentSearchQuery.trim() !== '') {
            const query = currentSearchQuery.toLowerCase().trim();
            const patientName = (appt.patientName || '').toLowerCase();
            if (!patientName.includes(query)) {
              isOpaque = true;
            } else {
              isHighlighted = true;
            }
          }

          if (isOpaque) {
            card.style.opacity = '0.3';
          } else if (isHighlighted) {
            card.style.boxShadow = '0 0 12px rgba(13, 148, 136, 0.6)';
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'all 0.2s ease-in-out';
            card.style.zIndex = '10';
            card.style.position = 'relative';
            card.style.border = '2px solid #0d9488';
          }

          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start h-100">
              <div class="d-flex flex-column justify-content-center h-100">
                <div>
                  <span class="badge-status mb-1 d-inline-block" style="background: ${c.text}22; color: ${c.text}; border: 1px solid ${c.text}44; width: fit-content; font-size: 0.7rem; padding: 2px 8px;">${appt.statusPill || appt.treatmentId}</span>
                  ${appt.id === nextApptId ? '<span class="badge ms-2" style="background-color: var(--primary-teal); font-size: 0.65rem; padding: 3px 6px;">Up Next</span>' : ''}
                </div>
                <h6 class="mb-0" style="color: ${c.text}; font-weight: 600;">${appt.patientName} <span style="font-weight: 400; color: #6b7280; font-size: 0.9rem;">(${appt.details || appt.phone})</span></h6>
                ${appt.notes ? `<div class="text-muted small mt-1"><i class="bi bi-card-text me-1"></i>${appt.notes}</div>` : ''}
              </div>
              <div class="d-flex align-items-center gap-2 h-100">
                <span class="text-muted" style="font-size: 0.8rem; color: #6b7280 !important;"><i class="bi bi-clock me-1"></i>${appt.time} - ${appt.endTime || 'XX:XX'}</span>
                <div class="dentist-avatar text-white fw-bold d-flex align-items-center justify-content-center" style="background: ${c.border}; width: 28px; height: 28px; border-radius: 50%; font-size: 0.8rem;" title="Assigned Dentist">${appt.dentistInitials || 'D'}</div>
              </div>
            </div>
          `;

          card.addEventListener('click', function (e) {
            e.stopPropagation();
            openDetailPopover(appt);
          });
          cell.appendChild(card);
        } else if (past) {
          cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center');
          cell.innerHTML = '<span class="small fst-italic">Past slot</span>';
          cell.title = 'Time before now — not clickable';
        } else {
          const bufferInfo = getBufferInfoForSlot(dateISO, slotTime);
          if (bufferInfo.active) {
            cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center', 'justify-content-center');
            cell.innerHTML = '<span class="fst-italic" style="font-size: 0.85rem;"><i class="bi bi-cup-hot me-1"></i> Cleaning buffer ' + bufferInfo.range + '</span>';
            cell.title = 'Cleaning buffer ' + bufferInfo.range;
          } else {
            cell.innerHTML = '<div style="opacity:0.3; height:100%; display:flex; align-items:center;">Free slot — click to book</div>';
            cell.addEventListener('click', function () {
              openBookingModal(slotTime);
            });
          }
        }
      }

      row.appendChild(timeEl);
      row.appendChild(cell);
      table.appendChild(row);
    });

    renderSummary();
  }

  function populateTreatmentSelect() {
    const select = document.getElementById('treatmentType');
    if (!select) return;
    // keep placeholder
    select.innerHTML = '<option value="">Select treatment</option>';
    const treatments = Clinic.TREATMENTS || [];
    treatments.forEach(function (t) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  }

  function resetForm() {
    const form = document.getElementById('appointmentForm');
    if (form) form.reset();
    clearFieldErrors();
    const panel = document.getElementById('formErrorPanel');
    if (panel) {
      panel.classList.add('hidden');
      panel.textContent = '';
    }
    selectedSlotTime = null;
    editingAppointmentId = null;
  }

  function clearFieldErrors() {
    const errs = document.querySelectorAll('.field-error');
    errs.forEach(function (el) {
      el.textContent = '';
    });
  }

  function showFieldError(field, msg) {
    const el = document.querySelector('[data-error-for="' + field + '"]');
    if (el) el.textContent = msg || '';
  }

  function showFormError(msg) {
    const panel = document.getElementById('formErrorPanel');
    if (panel) {
      panel.textContent = msg;
      panel.classList.remove('hidden');
    }
  }

  function populateTimeSlots(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    const slots = getSlotList();
    slots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = slot;
      select.appendChild(opt);
    });
  }

  let appointmentModalInstance = null;

  function hideModal() {
    if (appointmentModalInstance) {
      appointmentModalInstance.hide();
    } else if (window.bootstrap) {
      const modalEl = document.getElementById('appointmentModal');
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
    }
    resetForm();
  }

  function openBookingModal(slotTime) {
    selectedSlotTime = slotTime;
    editingAppointmentId = null;
    populateTreatmentSelect();
    populateTimeSlots('modalTimeSlot');

    const timeSelect = document.getElementById('modalTimeSlot');
    if (timeSelect) timeSelect.value = slotTime;

    const modalTitle = document.querySelector('#appointmentModal .modal-title');
    if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-calendar-plus text-teal me-2"></i> Book New Appointment';

    const confirmBtn = document.querySelector('#appointmentModal button[type="submit"]');
    if (confirmBtn) confirmBtn.textContent = 'Confirm Booking';

    if (window.bootstrap) {
      const el = document.getElementById('appointmentModal');
      appointmentModalInstance = bootstrap.Modal.getOrCreateInstance(el);
      appointmentModalInstance.show();
    }
  }

  let currentDetailModal = null;

  function openDetailPopover(appt) {
    // Admin only; show confirm/cancel option
    if (app.getRole && app.getRole() !== 'admin') return;
    const treatment = app.getTreatmentById ? app.getTreatmentById(appt.treatmentId) : { name: appt.treatmentId };

    // Set text contents
    document.getElementById('detailPatientName').textContent = appt.patientName || 'Unknown Patient';
    document.getElementById('detailTreatment').textContent = treatment.name || appt.details || 'General Checkup';
    document.getElementById('detailTime').textContent = `${appt.time} - ${appt.endTime || 'XX:XX'}`;
    document.getElementById('detailDentist').textContent = 'Dr. ' + (appt.dentistInitials === 'DZ' ? 'Zarina' : appt.dentistInitials || 'Zarina');
    document.getElementById('detailLocation').textContent = 'Room 2 - KPSTS Taman Tas'; // Default location

    const statusEl = document.getElementById('detailStatusPill');
    const headerBg = document.getElementById('detailHeaderBg');

    // Default style
    let bgCol = '#f0fdf4';
    let pillBg = '#166534';
    let pillText = '#ffffff';
    let statusText = appt.statusPill || appt.treatmentId || 'Booked';

    if (appt.statusPill === 'Waiting') {
      bgCol = '#fff7ed'; pillBg = '#c2410c'; pillText = '#ffffff';
    } else if (appt.statusPill === 'Completed') {
      bgCol = '#f8fafc'; pillBg = '#475569'; pillText = '#ffffff';
    } else if (appt.statusPill === 'Canceled') {
      bgCol = '#fef2f2'; pillBg = '#991b1b'; pillText = '#ffffff';
    }

    statusEl.textContent = statusText;
    statusEl.style.backgroundColor = pillBg;
    statusEl.style.color = pillText;
    headerBg.style.backgroundColor = bgCol;

    // Show modal
    if (!currentDetailModal && window.bootstrap) {
      currentDetailModal = new bootstrap.Modal(document.getElementById('appointmentDetailModal'));
    }
    if (currentDetailModal) currentDetailModal.show();

    // Wire up cancel button
    const btnCancel = document.getElementById('btnCancelAppt');
    if (btnCancel) {
      if (appt.statusPill === 'Canceled' || appt.statusPill === 'Completed') {
        btnCancel.disabled = true;
      } else {
        btnCancel.disabled = false;
        btnCancel.onclick = function () {
          if (confirm('Are you sure you want to cancel this appointment?')) {
            cancelAppointmentById(appt.id);
            renderGrid();
            if (app.showToast) {
              app.showToast('Appointment cancelled — ' + appt.time, 'success');
            }
            if (currentDetailModal) currentDetailModal.hide();
          }
        };
      }
    }

    // Wire up reschedule button
    const btnReschedule = document.querySelector('.btn-reschedule');
    if (btnReschedule) {
      const newBtnReschedule = btnReschedule.cloneNode(true);
      btnReschedule.parentNode.replaceChild(newBtnReschedule, btnReschedule);

      if (appt.statusPill === 'Canceled' || appt.statusPill === 'Completed') {
        newBtnReschedule.disabled = true;
      } else {
        newBtnReschedule.disabled = false;
        newBtnReschedule.onclick = function () {
          if (currentDetailModal) currentDetailModal.hide();
          openBookingModal(appt.time);

          editingAppointmentId = appt.id;

          const form = document.getElementById('appointmentForm');
          if (form) {
            form.patientName.value = appt.patientName || '';
            form.phoneNumber.value = appt.phone || '';
            form.treatmentType.value = appt.treatmentId || '';
            if (form.notes) form.notes.value = appt.notes || '';
          }

          const modalTitle = document.querySelector('#appointmentModal .modal-title');
          if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-calendar-event text-teal me-2"></i> Reschedule Appointment';

          const confirmBtn = document.querySelector('#appointmentModal button[type="submit"]');
          if (confirmBtn) confirmBtn.textContent = 'Save Changes';
        };
      }
    }

    // Wire up complete button
    const btnComplete = document.getElementById('btnCompleteAppt');
    if (btnComplete) {
      // Need to clear old events first to prevent multiple firings when opening different appointments
      const newBtnComplete = btnComplete.cloneNode(true);
      btnComplete.parentNode.replaceChild(newBtnComplete, btnComplete);

      if (appt.statusPill === 'Canceled' || appt.statusPill === 'Completed') {
        newBtnComplete.disabled = true;
      } else {
        newBtnComplete.disabled = false;
        newBtnComplete.onclick = function () {
          updateAppointmentById(appt.id, { statusPill: 'Completed' });
          renderGrid();
          if (app.showToast) {
            app.showToast('Appointment marked as Completed', 'success');
          }
          if (currentDetailModal) currentDetailModal.hide();
        };
      }
    }
  }

  function validatePhone(phone) {
    if (!phone) return false;
    const v = phone.trim();
    // Accept +60 1x-xxx xxxx or 01x-xxx xxxx
    const re1 = /^\+60\s?\d{1,2}-\d{3,4}\s?\d{4}$/;
    const re2 = /^0\d{1,2}-\d{3,4}\s?\d{4}$/;
    return re1.test(v) || re2.test(v);
  }

  function validateAndBook(formData) {
    const panel = document.getElementById('formErrorPanel');
    if (panel) {
      panel.classList.add('hidden');
      panel.textContent = '';
    }

    if (!formData.patientName || formData.patientName.trim().length === 0) {
      showFormError('Patient Name is required.');
      return false;
    }
    if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0) {
      showFormError('Phone Number is required.');
      return false;
    }
    if (!formData.treatmentType) {
      showFormError('Treatment Type is required.');
      return false;
    }

    const dateISO = utils.toDateISO(currentDate);
    const slotTime = selectedSlotTime;
    const conflict = hasConflictAtSubmit(dateISO, slotTime, null, editingAppointmentId); // Ignore phone conflict for demo
    if (conflict.has) {
      showFormError(conflict.reason);
      return false;
    }

    const endTime = formatTimeHHMM(parseTimeHHMM(slotTime) + SLOT_INTERVAL_MIN);

    // Book or Update
    const newAppt = {
      id: editingAppointmentId || generateId(),
      dateISO: dateISO,
      time: slotTime,
      endTime: endTime,
      patientName: formData.patientName.trim(),
      phone: formData.phoneNumber.trim(),
      treatmentId: formData.treatmentType,
      notes: formData.notes ? formData.notes.trim() : '',
      statusPill: 'Waiting'
    };

    if (editingAppointmentId) {
      updateAppointmentById(editingAppointmentId, newAppt);
    } else {
      addAppointment(newAppt);
    }

    return true;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Update selectedSlotTime based on dropdown selection
    const timeSelect = document.getElementById('modalTimeSlot');
    if (timeSelect && timeSelect.value) {
      selectedSlotTime = timeSelect.value;
    }
    const lastChangedSlot = selectedSlotTime;

    const formData = {
      patientName: form.patientName.value,
      phoneNumber: form.phoneNumber.value,
      treatmentType: form.treatmentType.value,
      notes: form.notes ? form.notes.value : ''
    };
    if (validateAndBook(formData)) {
      const bookedSlot = lastChangedSlot;
      hideModal();
      renderGrid();
      if (app.showToast) {
        app.showToast('Appointment booked — ' + bookedSlot, 'success');
      }
    }
  }

  function bindEvents() {
    const prev = document.getElementById('prevDay');
    const next = document.getElementById('nextDay');
    const todayBtn = document.getElementById('todayBtn');
    if (prev) {
      prev.addEventListener('click', function () {
        currentDate = utils.addDays(currentDate, -1);
        renderDateLabel();
        renderGrid();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        currentDate = utils.addDays(currentDate, 1);
        renderDateLabel();
        renderGrid();
      });
    }
    if (todayBtn) {
      todayBtn.addEventListener('click', function () {
        currentDate = utils.todayDate ? new Date(utils.todayDate()) : new Date();
        renderDateLabel();
        renderGrid();
      });
    }

    const filterOpts = document.querySelectorAll('.filter-opt');
    filterOpts.forEach(opt => {
      opt.addEventListener('click', function (e) {
        e.preventDefault();
        currentStatusFilter = this.dataset.status;
        document.getElementById('currentFilterText').textContent = this.textContent;
        renderGrid();
      });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        currentSearchQuery = e.target.value;
        renderGrid();
      });
    }

    const form = document.getElementById('appointmentForm');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // Make 'New Appointment' button mock function open modal properly
    const mockNewBtn = document.getElementById('mockNewBtn');
    if (mockNewBtn) {
      mockNewBtn.onclick = function () {
        const slots = getSlotList();
        const dateISO = utils.toDateISO(currentDate);
        let firstFree = slots[0];
        for (let i = 0; i < slots.length; i++) {
          const bufferInfo = getBufferInfoForSlot(dateISO, slots[i]);
          if (!findAppointmentAt(dateISO, slots[i]) && !isSlotPast(slots[i], dateISO) && !bufferInfo.active) {
            firstFree = slots[i];
            break;
          }
        }
        openBookingModal(firstFree);
      };
    }
  }

  function showTodayStats() {
    const summaryList = document.getElementById('summaryList');
    if (!summaryList) return;

    // Attempt to parse standard format: label span, value strong
    let items = summaryList.querySelectorAll('li');
    let total = 0, completed = 0, remaining = 0;

    items.forEach(li => {
      const label = li.querySelector('span').textContent;
      const val = parseInt(li.querySelector('strong').textContent, 10) || 0;
      if (label.includes('Total')) total = val;
      if (label.includes('Past/completed')) completed = val;
      if (label.includes('Remaining')) remaining = val;
    });

    const statTotalEl = document.getElementById('statTotalCount');
    const statCompEl = document.getElementById('statCompletedCount');
    const statPendEl = document.getElementById('statPendingCount');

    if (statTotalEl) statTotalEl.textContent = total;
    if (statCompEl) statCompEl.textContent = completed;
    if (statPendEl) statPendEl.textContent = remaining;

    if (window.bootstrap) {
      const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
      modal.show();
    }
  }

  window.showTodayStats = showTodayStats;

  function init() {
    const allowed = app.enforceRole ? app.enforceRole(['admin'], function () {
      const denied = document.getElementById('accessDenied');
      const dashboard = document.getElementById('dashboard');
      if (denied) denied.classList.remove('hidden');
      if (dashboard) dashboard.classList.add('hidden');
      if (app.initRoleBadge) app.initRoleBadge();
      if (app.initLogout) app.initLogout();
      if (app.initBackToIndex) app.initBackToIndex();
    }) : true;
    if (!allowed) return;
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.remove('hidden');
    if (app.initRoleBadge) app.initRoleBadge();
    if (app.initLogout) app.initLogout();
    if (app.initBackToIndex) app.initBackToIndex();
    renderDateLabel();
    renderTreatmentLegend();
    renderGrid();
    bindEvents();
    populateTreatmentSelect();

    // Add aesthetic observer
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.appointment-card').forEach((card, index) => {
        if (!card.hasAttribute('data-styled')) {
          const colors = [
            { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' },
            { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
            { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
            { bg: '#e0f2fe', text: '#075985', border: '#38bdf8' }
          ];
          const c = colors[index % colors.length];
          card.style.backgroundColor = c.bg;
          card.style.color = c.text;
          card.style.borderLeftColor = c.border;
          const pill = card.querySelector('.treatment-pill');
          if (pill) {
            pill.style.color = c.text;
          }
          card.setAttribute('data-styled', 'true');
        }
      });
    });
    const slotTable = document.getElementById('slotTable');
    if (slotTable) observer.observe(slotTable, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
