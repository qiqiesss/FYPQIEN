(function (window) {
  'use strict';

  const Clinic = window.Clinic || {};
  const app = Clinic.app || {};
  const utils = Clinic.utils || {};

  const CLINIC_START = '09:00';
  const CLINIC_END = '17:00';
  const SLOT_INTERVAL_MIN = 30;
  const BUFFER_MIN = 5;

  let currentDate = utils.todayDate ? new Date(utils.todayDate()) : new Date();
  let selectedSlotTime = null;
  let editingAppointmentId = null;

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
    while (t <= endT - SLOT_INTERVAL_MIN) {
      slots.push(formatTimeHHMM(t));
      t += SLOT_INTERVAL_MIN;
    }
    // include last 16:30? end is 17:00 so up to 16:30 gives 16 slots total (09:00,09:30,...,16:30)
    return slots;
  }

  function isSlotPast(slotTime, dateISO) {
    const todayISO = utils.toDateISO ? utils.toDateISO(new Date()) : '';
    if (dateISO !== todayISO) return false;
    const now = new Date();
    const [sh, sm] = slotTime.split(':').map((x) => parseInt(x, 10));
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0, 0);
    return slotDate < now;
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

  function hasConflictAtSubmit(dateISO, slotTime, phone) {
    // (a) slot now occupied
    const existingAppt = findAppointmentAt(dateISO, slotTime);
    if (existingAppt) return { has: true, reason: 'Slot is already booked.' };
    // (b) slot start within buffer following any booking
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    for (let i = 0; i < appts.length; i++) {
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
  }

  function cancelAppointmentById(id) {
    if (!Clinic.APPOINTMENTS) return;
    for (let i = Clinic.APPOINTMENTS.length - 1; i >= 0; i--) {
      if (Clinic.APPOINTMENTS[i].id === id) {
        Clinic.APPOINTMENTS.splice(i, 1);
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
    slots.forEach(function (slotTime) {
      const row = document.createElement('div');
      row.className = 'time-slot-row';
      row.dataset.hour = slotTime.split(':')[0];

      const timeEl = document.createElement('div');
      timeEl.className = 'time-label';
      timeEl.textContent = slotTime;

      const cell = document.createElement('div');
      cell.className = 'time-slot-content';
      cell.dataset.slot = slotTime;

      const past = isSlotPast(slotTime, dateISO);
      const bufferInfo = getBufferInfoForSlot(dateISO, slotTime);
      const appt = findAppointmentAt(dateISO, slotTime);

      if (past) {
        cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center');
        cell.innerHTML = '<span class="small fst-italic">Past slot</span>';
        cell.title = 'Time before now — not clickable';
      } else if (bufferInfo.active) {
        cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center', 'justify-content-center');
        cell.innerHTML = '<span class="fst-italic" style="font-size: 0.85rem;"><i class="bi bi-cup-hot me-1"></i> Cleaning buffer ' + bufferInfo.range + '</span>';
        cell.title = 'Cleaning buffer ' + bufferInfo.range;
      } else if (appt) {
        const treatment = app.getTreatmentById ? app.getTreatmentById(appt.treatmentId) : { name: appt.treatmentId, color: 'var(--primary-teal)' };
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.style.borderLeftColor = treatment.color || 'var(--primary-teal)';
        
        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="badge-status mb-1 d-inline-block" style="background: ${treatment.color}22; color: ${treatment.color}; border: 1px solid ${treatment.color}55;">${treatment.name}</span>
              <h6 class="mb-1 fw-bold">${appt.patientName} <span class="text-muted fw-normal fs-7">(${appt.phone})</span></h6>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="text-muted" style="font-size: 0.8rem;"><i class="bi bi-clock me-1"></i>${appt.time}</span>
              <div class="dentist-avatar" style="background: ${treatment.color};" title="Assigned Dentist">D</div>
            </div>
          </div>
        `;
        
        card.addEventListener('click', function (e) {
          e.stopPropagation();
          openDetailPopover(appt);
        });
        cell.appendChild(card);
      } else {
        cell.innerHTML = '<div style="opacity:0.3; height:100%; display:flex; align-items:center;">Free slot — click to book</div>';
        cell.addEventListener('click', function () {
          openBookingModal(slotTime);
        });
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

  function hideModal() {
    if (window.bootstrap) {
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

    if (window.bootstrap) {
      const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
      modal.show();
    }
  }

  function openDetailPopover(appt) {
    // Admin only; show confirm/cancel option
    if (app.getRole && app.getRole() !== 'admin') return;
    const treatment = app.getTreatmentById ? app.getTreatmentById(appt.treatmentId) : { name: appt.treatmentId };
    const lines = [
      'Cancel appointment?',
      '',
      appt.patientName + ' — ' + appt.time,
      treatment.name + ' · ' + appt.phone
    ];
    if (appt.notes) lines.push('Notes: ' + appt.notes);
    lines.push('', 'This removes the booking and its cleaning buffer.');
    const confirmed = window.confirm(lines.join('\n'));
    if (confirmed) {
      cancelAppointmentById(appt.id);
      renderGrid();
      if (app.showToast) {
        app.showToast('Appointment cancelled — ' + appt.time, 'success');
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
    clearFieldErrors();
    const panel = document.getElementById('formErrorPanel');
    if (panel) {
      panel.classList.add('hidden');
      panel.textContent = '';
    }
    let valid = true;
    if (!formData.patientName || formData.patientName.trim().length === 0) {
      showFieldError('patientName', 'Patient Name is required.');
      valid = false;
    }
    if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0) {
      showFieldError('phoneNumber', 'Phone Number is required.');
      valid = false;
    } else if (!validatePhone(formData.phoneNumber)) {
      showFieldError('phoneNumber', 'Please enter a valid phone number in format +60 1x-xxx xxxx or 01x-xxx xxxx.');
      valid = false;
    }
    if (!formData.treatmentType) {
      showFieldError('treatmentType', 'Treatment Type is required.');
      valid = false;
    }
    if (!valid) return false;
    const dateISO = utils.toDateISO(currentDate);
    const slotTime = selectedSlotTime;
    const conflict = hasConflictAtSubmit(dateISO, slotTime, formData.phoneNumber);
    if (conflict.has) {
      showFormError(conflict.reason);
      return false;
    }
    // Book
    const newAppt = {
      id: generateId(),
      dateISO: dateISO,
      time: slotTime,
      patientName: formData.patientName.trim(),
      phone: formData.phoneNumber.trim(),
      treatmentId: formData.treatmentType,
      notes: formData.notes ? formData.notes.trim() : '',
      status: 'scheduled'
    };
    addAppointment(newAppt);
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
    const form = document.getElementById('appointmentForm');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // Make 'New Appointment' button mock function open modal properly
    const mockNewBtn = document.getElementById('mockNewBtn');
    if (mockNewBtn) {
      mockNewBtn.onclick = function() {
        const slots = getSlotList();
        openBookingModal(slots[0]); // Default to first available slot
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
