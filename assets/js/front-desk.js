(function (window) {
  'use strict';

  const Clinic = window.Clinic || {};
  const app = Clinic.app || {};
  const utils = Clinic.utils || {};

  const CLINIC_START = '09:00';
  const CLINIC_END = '18:00';
  const SLOT_INTERVAL_MIN = 30;
  const BUFFER_MIN = 5;

  // Single source of truth for treatment color themes matching legend
  const TREATMENT_THEMES = {
    braces: {
      id: 'braces',
      name: 'Braces',
      color: '#0d9488', // Teal
      bg: '#f0fdfa',
      text: '#0f766e',
      border: '#0d9488',
      lightBg: '#ccfbf1'
    },
    extraction: {
      id: 'extraction',
      name: 'Extraction',
      color: '#ef4444', // Red
      bg: '#fef2f2',
      text: '#b91c1c',
      border: '#ef4444',
      lightBg: '#fee2e2'
    },
    scaling: {
      id: 'scaling',
      name: 'Scaling',
      color: '#3b82f6', // Blue
      bg: '#eff6ff',
      text: '#1e40af',
      border: '#3b82f6',
      lightBg: '#dbeafe'
    },
    filling: {
      id: 'filling',
      name: 'Filling',
      color: '#f59e0b', // Orange/Amber
      bg: '#fffbeb',
      text: '#b45309',
      border: '#f59e0b',
      lightBg: '#fef3c7'
    },
    checkup: {
      id: 'checkup',
      name: 'Check-up',
      color: '#22c55e', // Green
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#22c55e',
      lightBg: '#dcfce7'
    },
    mos: {
      id: 'mos',
      name: 'Minor Oral Surgery',
      color: '#a855f7', // Purple
      bg: '#faf5ff',
      text: '#6b21a8',
      border: '#a855f7',
      lightBg: '#f3e8ff'
    }
  };

  function getTreatmentTheme(treatmentId, details) {
    let key = (treatmentId || '').toLowerCase().trim();
    if (!TREATMENT_THEMES[key]) {
      const det = (details || '').toLowerCase();
      if (det.includes('brace')) key = 'braces';
      else if (det.includes('extract')) key = 'extraction';
      else if (det.includes('scali') || det.includes('whiten') || det.includes('polish')) key = 'scaling';
      else if (det.includes('fill') || det.includes('inlay') || det.includes('veneer')) key = 'filling';
      else if (det.includes('check') || det.includes('consult')) key = 'checkup';
      else if (det.includes('surg') || det.includes('mos') || det.includes('implant') || det.includes('excision') || det.includes('root') || det.includes('operculectomy')) key = 'mos';
    }
    return TREATMENT_THEMES[key] || {
      id: 'checkup',
      name: 'Check-up',
      color: '#22c55e',
      bg: '#f0fdf4',
      text: '#15803d',
      border: '#22c55e',
      lightBg: '#dcfce7'
    };
  }

  let currentDate = utils.todayDate ? new Date(utils.todayDate()) : new Date();
  let currentView = 'day'; // 'day' | 'week'
  let selectedSlotTime = null;
  let editingAppointmentId = null;
  let currentStatusFilter = 'All';
  let currentSearchQuery = '';

  function parseTimeHHMM(t) {
    if (!t) return 0;
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
    // Slots run up to 30 mins before closing time so appointments end by CLINIC_END
    while (t < endT) {
      slots.push(formatTimeHHMM(t));
      t += SLOT_INTERVAL_MIN;
    }
    return slots;
  }

  function getApptRange(appt) {
    const start = parseTimeHHMM(appt.time);
    let end;
    if (appt.endTime) {
      end = parseTimeHHMM(appt.endTime);
    } else {
      let dur = SLOT_INTERVAL_MIN;
      if (Clinic.TREATMENTS) {
        const tr = Clinic.TREATMENTS.find(t => t.id === appt.treatmentId);
        if (tr && tr.duration) dur = tr.duration;
      }
      end = start + dur;
    }
    return { start, end };
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

  function findAppointmentCovering(dateISO, slotTime) {
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    const slotEnd = slotStart + SLOT_INTERVAL_MIN;
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].statusPill === 'Canceled') continue;
      const range = getApptRange(appts[i]);
      if (range.start < slotEnd && range.end > slotStart) {
        return appts[i];
      }
    }
    return null;
  }

  function isBufferSlot(dateISO, slotTime) {
    const appts = getAppointmentsForDate(dateISO);
    const slotStart = parseTimeHHMM(slotTime);
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].statusPill === 'Canceled') continue;
      const range = getApptRange(appts[i]);
      const bufStart = range.end;
      const bufEnd = range.end + BUFFER_MIN;
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
      if (appts[i].statusPill === 'Canceled') continue;
      const range = getApptRange(appts[i]);
      const bufStart = range.end;
      const bufEnd = range.end + BUFFER_MIN;
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

  function hasConflictAtSubmit(dateISO, slotTime, phone, ignoreId = null, durationMin = 30) {
    const reqStart = parseTimeHHMM(slotTime);
    const reqEnd = reqStart + durationMin;
    const clinicClose = parseTimeHHMM(CLINIC_END);

    // 0. Check Dentist Scheduled Leave
    try {
      const rawLeave = localStorage.getItem('kpst.v1.dentist_leave');
      if (rawLeave) {
        const leaveList = JSON.parse(rawLeave);
        const matchLeave = leaveList.find(l => l.date === dateISO);
        if (matchLeave) {
          return {
            has: true,
            reason: `Dr. Zarith Sofia is on scheduled leave on ${dateISO} (${matchLeave.reason}). Bookings cannot be accepted on this date.`
          };
        }
      }
    } catch (e) { /* ignore */ }

    // 1. Clinic closing boundary
    if (reqEnd > clinicClose) {
      return { has: true, reason: 'Appointment duration extends beyond clinic closing time (18:00).' };
    }

    // 2. Clinic lunch break (12:00 - 13:00)
    const breakStart = parseTimeHHMM('12:00');
    const breakEnd = parseTimeHHMM('13:00');
    if (reqStart < breakEnd && reqEnd > breakStart) {
      return { has: true, reason: 'Appointment time conflicts with clinic lunch break (12:00 PM – 01:00 PM).' };
    }

    // 3. Overlap check with active bookings on this date
    const appts = getAppointmentsForDate(dateISO);
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].id === ignoreId || appts[i].statusPill === 'Canceled') continue;
      const range = getApptRange(appts[i]);
      if (range.start < reqEnd && range.end > reqStart) {
        return {
          has: true,
          reason: 'Slot overlaps with existing booking for ' + (appts[i].patientName || 'another patient') + ' (' + formatTimeHHMM(range.start) + '–' + formatTimeHHMM(range.end) + ').'
        };
      }
    }

    // 4. Cleaning buffer check
    for (let i = 0; i < appts.length; i++) {
      if (appts[i].id === ignoreId || appts[i].statusPill === 'Canceled') continue;
      const range = getApptRange(appts[i]);
      const bufStart = range.end;
      const bufEnd = range.end + BUFFER_MIN;
      if (reqStart >= bufStart && reqStart < bufEnd) {
        return {
          has: true,
          reason: 'Slot falls within the 5-minute cleaning buffer following another booking (' + formatTimeHHMM(bufStart) + '–' + formatTimeHHMM(bufEnd) + ').'
        };
      }
    }

    // 5. Same phone within ±60 min
    if (phone) {
      const normalizedPhone = phone.trim().replace(/\s+/g, '');
      for (let i = 0; i < appts.length; i++) {
        if (appts[i].id === ignoreId || appts[i].statusPill === 'Canceled') continue;
        if (appts[i].phone && appts[i].phone.replace(/\s+/g, '') === normalizedPhone) {
          const range = getApptRange(appts[i]);
          const diff = Math.abs(reqStart - range.start);
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
    for (let i = 0; i < Clinic.APPOINTMENTS.length; i++) {
      if (Clinic.APPOINTMENTS[i].id === id) {
        // Non-destructive cancellation: preserves entry for past records and auditing
        Clinic.APPOINTMENTS[i].statusPill = 'Canceled';
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
      li.className = 'd-inline-flex align-items-center gap-1.5 small';
      const chip = document.createElement('span');
      chip.style.display = 'inline-block';
      chip.style.width = '10px';
      chip.style.height = '10px';
      chip.style.borderRadius = '50%';
      chip.style.background = t.color;
      const name = document.createElement('span');
      name.className = 'fw-medium text-dark';
      name.textContent = t.name + (t.duration ? ` (${t.duration}m)` : '');
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

  function getWeekDays(d) {
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ...
    const distToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(d);
    monday.setDate(d.getDate() + distToMon);

    const days = [];
    for (let i = 0; i < 6; i++) { // Mon to Sat
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  }

  function renderGrid() {
    const table = document.getElementById('slotTable');
    if (!table) return;
    table.innerHTML = '';

    // Keep datePicker in sync
    const datePicker = document.getElementById('datePickerInput');
    if (datePicker && utils.toDateISO) {
      datePicker.value = utils.toDateISO(currentDate);
    }

    if (currentView === 'week') {
      renderWeekGrid(table);
    } else {
      renderDayGrid(table);
    }
    renderSummary();
  }

  function renderWeekGrid(table) {
    const weekDays = getWeekDays(currentDate);
    const container = document.createElement('div');
    container.className = 'week-view-grid p-3';

    // Week header row
    const headerRow = document.createElement('div');
    headerRow.className = 'row g-2 mb-3 text-center';

    weekDays.forEach(day => {
      const col = document.createElement('div');
      col.className = 'col';
      const isSelectedDay = utils.toDateISO(day) === utils.toDateISO(currentDate);
      const isToday = utils.toDateISO(day) === utils.toDateISO(new Date());

      const dayName = day.toLocaleDateString('en-MY', { weekday: 'short' });
      const dayNum = day.getDate();
      const monthName = day.toLocaleDateString('en-MY', { month: 'short' });

      col.innerHTML = `
        <div class="p-2 rounded-3 border ${isSelectedDay ? 'border-teal bg-teal text-white shadow-sm' : 'bg-light text-dark'} ${isToday ? 'fw-bold' : ''}" style="cursor: pointer; ${isSelectedDay ? 'background-color: var(--primary-teal); color: #fff;' : ''}">
          <div style="font-size: 0.75rem; text-transform: uppercase;">${dayName}</div>
          <div style="font-size: 1.1rem;">${dayNum} ${monthName}</div>
        </div>
      `;
      col.addEventListener('click', () => {
        currentDate = new Date(day);
        currentView = 'day';
        const dayBtn = document.getElementById('dayViewBtn');
        const weekBtn = document.getElementById('weekViewBtn');
        if (dayBtn) dayBtn.classList.add('active');
        if (weekBtn) weekBtn.classList.remove('active');
        renderDateLabel();
        renderGrid();
      });
      headerRow.appendChild(col);
    });
    container.appendChild(headerRow);

    // Week columns content row
    const columnsRow = document.createElement('div');
    columnsRow.className = 'row g-2';

    weekDays.forEach(day => {
      const col = document.createElement('div');
      col.className = 'col';
      const dateISO = utils.toDateISO(day);
      const appts = getAppointmentsForDate(dateISO).filter(a => a.statusPill !== 'Canceled');

      const colCard = document.createElement('div');
      colCard.className = 'bg-light rounded-3 p-2 border min-vh-50 d-flex flex-column gap-2';
      colCard.style.minHeight = '420px';

      if (appts.length === 0) {
        colCard.innerHTML = `
          <div class="text-center text-muted small py-4 my-auto">
            <i class="bi bi-calendar-check d-block fs-3 mb-1 opacity-50"></i>
            No bookings
            <button type="button" class="btn btn-xs btn-outline-secondary mt-2 d-block mx-auto" style="font-size: 0.75rem;">+ Book</button>
          </div>
        `;
        const addBtn = colCard.querySelector('button');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            currentDate = new Date(day);
            openBookingModal('09:00');
          });
        }
      } else {
        appts.sort((a, b) => parseTimeHHMM(a.time) - parseTimeHHMM(b.time));
        appts.forEach(appt => {
          const treatTheme = getTreatmentTheme(appt.treatmentId, appt.details);
          const card = document.createElement('div');
          card.className = 'p-2 rounded border shadow-xs';
          card.style.backgroundColor = treatTheme.bg;
          card.style.borderLeft = `3px solid ${treatTheme.border}`;
          card.style.cursor = 'pointer';
          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="badge bg-white text-dark border" style="font-size: 0.65rem;">${appt.time}</span>
              <span class="badge text-white" style="background: ${treatTheme.border}; font-size: 0.6rem;">${appt.dentistInitials || 'DZ'}</span>
            </div>
            <div class="fw-bold text-dark text-truncate" style="font-size: 0.8rem;">${app.escapeHtml(appt.patientName)}</div>
            <div class="text-truncate" style="font-size: 0.7rem; color: ${treatTheme.text}; font-weight: 600;">${app.escapeHtml(treatTheme.name)}: ${app.escapeHtml(appt.details || '')}</div>
          `;
          card.addEventListener('click', (e) => {
            e.stopPropagation();
            openDetailPopover(appt);
          });
          colCard.appendChild(card);
        });

        const quickAdd = document.createElement('button');
        quickAdd.className = 'btn btn-sm btn-link text-decoration-none text-teal mt-auto pt-2';
        quickAdd.style.color = 'var(--primary-teal)';
        quickAdd.style.fontSize = '0.75rem';
        quickAdd.innerHTML = '+ Add slot';
        quickAdd.addEventListener('click', () => {
          currentDate = new Date(day);
          openBookingModal('09:00');
        });
        colCard.appendChild(quickAdd);
      }

      col.appendChild(colCard);
      columnsRow.appendChild(col);
    });

    container.appendChild(columnsRow);
    table.appendChild(container);
  }

  function renderDayGrid(table) {
    const dateISO = utils.toDateISO(currentDate);
    const slots = getSlotList();
    const todayISO = utils.toDateISO(new Date());
    const isToday = (dateISO === todayISO);

    // Check if dentist is on scheduled leave for this date
    let scheduledLeaveReason = null;
    try {
      const rawLeave = localStorage.getItem('kpst.v1.dentist_leave');
      if (rawLeave) {
        const leaveList = JSON.parse(rawLeave);
        const matchLeave = leaveList.find(l => l.date === dateISO);
        if (matchLeave) scheduledLeaveReason = matchLeave.reason;
      }
    } catch (e) { /* ignore */ }

    if (scheduledLeaveReason) {
      const leaveBanner = document.createElement('div');
      leaveBanner.className = 'alert alert-warning d-flex align-items-center gap-2 m-3 mb-2 rounded-3';
      leaveBanner.innerHTML = `<i class="bi bi-calendar-x fs-5 text-danger"></i><div><strong>Dr. Zarith Sofia is on scheduled leave:</strong> ${app.escapeHtml(scheduledLeaveReason)}. Regular booking slots are blocked for this date.</div>`;
      table.appendChild(leaveBanner);
    }

    // Identify next appointment for today
    let nextApptId = null;
    if (isToday) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const appts = getAppointmentsForDate(dateISO);

      let minDiff = Infinity;
      appts.forEach(a => {
        if (a.statusPill === 'Canceled') return;
        const [h, m] = a.time.split(':');
        const apptMins = parseInt(h, 10) * 60 + parseInt(m, 10);
        if (apptMins >= currentMins && (apptMins - currentMins) < minDiff) {
          minDiff = apptMins - currentMins;
          nextApptId = a.id;
        }
      });
    }

    let scrollTargetElement = null;

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
      if (isToday) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const startMins = hour * 60 + min;
        const endMins = startMins + SLOT_INTERVAL_MIN;
        if (currentMins >= startMins && currentMins < endMins) {
          isOngoingSlot = true;
        }
      }

      if (isOngoingSlot) {
        timeEl.classList.remove('text-muted');
        timeEl.classList.add('bg-primary', 'text-white', 'shadow-sm', 'rounded');
        timeEl.style.padding = '0.5rem 0.25rem';
        timeEl.innerHTML = `<strong style="font-size: 1rem;">${String(hour12).padStart(2, '0')}:${sm}</strong><br><span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Current</span>`;
        scrollTargetElement = row;
      } else {
        timeEl.innerHTML = `${String(hour12).padStart(2, '0')}:${sm}<br><span style="font-size: 0.75rem;">${ampm}</span>`;
      }

      const cell = document.createElement('div');
      cell.className = 'time-slot-content position-relative';
      cell.dataset.slot = slotTime;

      // Draw "Now" indicator line if ongoing
      if (isOngoingSlot) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const slotFraction = (currentMins - (hour * 60 + min)) / SLOT_INTERVAL_MIN;
        const topPct = Math.max(5, Math.min(95, Math.round(slotFraction * 100)));

        const nowLine = document.createElement('div');
        nowLine.className = 'timeline-now-line';
        nowLine.style.cssText = `position: absolute; left: 0; right: 0; top: ${topPct}%; height: 2px; background: #ef4444; z-index: 15; pointer-events: none;`;
        nowLine.innerHTML = '<span class="badge bg-danger position-absolute" style="top: -9px; left: 10px; font-size: 0.6rem; padding: 2px 5px; letter-spacing: 0.5px;">NOW</span>';
        cell.appendChild(nowLine);
      }

      // Handle Clinic Break at 12:00 and 12:30
      if (slotTime === '12:00' || slotTime === '12:30') {
        cell.classList.add('d-flex', 'align-items-center', 'justify-content-center', 'bg-light-subtle');
        cell.innerHTML += '<span class="text-secondary" style="font-size: 0.85rem; font-style: italic;"><i class="bi bi-cup-hot text-warning me-1"></i> Clinic Lunch Break (12:00 PM – 01:00 PM)</span>';
      } else {
        const past = isSlotPast(slotTime, dateISO);
        let appt = findAppointmentAt(dateISO, slotTime);

        // Smart Canceled Logic
        if (appt && appt.statusPill === 'Canceled') {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const startMins = hour * 60 + min;
          if (currentMins < startMins) {
            appt = null; // Hide future canceled appointments from taking slot
          }
        }

        // Check if slot is covered by an ongoing appointment that started earlier
        const coveringAppt = !appt ? findAppointmentCovering(dateISO, slotTime) : null;

        if (appt) {
          const treatTheme = getTreatmentTheme(appt.treatmentId, appt.details);

          const card = document.createElement('div');
          card.className = 'appointment-card';
          card.setAttribute('data-styled', 'true');
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          card.setAttribute('aria-label', `Appointment for ${appt.patientName}`);
          
          // Match treatment legend color
          card.style.backgroundColor = treatTheme.bg;
          card.style.borderLeft = `4px solid ${treatTheme.border}`;

          // Status badge colors
          let statusBadgeStyle = 'background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;'; // Scheduled (sky)
          if (appt.statusPill === 'Waiting') {
            statusBadgeStyle = 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'; // Waiting (amber)
          } else if (appt.statusPill === 'Completed') {
            statusBadgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'; // Completed (green)
          } else if (appt.statusPill === 'Canceled') {
            statusBadgeStyle = 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;'; // Canceled (red)
            card.style.opacity = '0.65';
          }

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
            card.style.boxShadow = `0 0 12px ${treatTheme.border}88`;
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'all 0.2s ease-in-out';
            card.style.zIndex = '10';
            card.style.position = 'relative';
            card.style.border = `2px solid ${treatTheme.border}`;
          }

          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start h-100">
              <div class="d-flex flex-column justify-content-center h-100">
                <div class="d-flex align-items-center gap-1 mb-1">
                  <span class="badge-status d-inline-block" style="${statusBadgeStyle} font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${app.escapeHtml(appt.statusPill || 'Booked')}</span>
                  <span class="badge d-inline-block text-white" style="background: ${treatTheme.border}; font-size: 0.65rem; padding: 2px 7px; border-radius: 4px; font-weight: 600;">${app.escapeHtml(treatTheme.name)}</span>
                  ${appt.id === nextApptId ? '<span class="badge ms-1" style="background-color: var(--primary-teal); font-size: 0.65rem; padding: 3px 6px;">Up Next</span>' : ''}
                </div>
                <h6 class="mb-0" style="color: #0f172a; font-weight: 700; font-size: 0.95rem;">${app.escapeHtml(appt.patientName)} <span style="font-weight: 400; color: #64748b; font-size: 0.85rem;">(${app.escapeHtml(appt.details || appt.phone)})</span></h6>
                ${appt.notes ? `<div class="text-muted small mt-1"><i class="bi bi-card-text me-1"></i>${app.escapeHtml(appt.notes)}</div>` : ''}
              </div>
              <div class="d-flex align-items-center gap-2 h-100">
                <span class="text-muted" style="font-size: 0.8rem; color: #64748b !important; font-weight: 500;"><i class="bi bi-clock me-1"></i>${appt.time} - ${appt.endTime || 'XX:XX'}</span>
                <div class="dentist-avatar text-white fw-bold d-flex align-items-center justify-content-center" style="background: ${treatTheme.border}; width: 28px; height: 28px; border-radius: 50%; font-size: 0.8rem;" title="${app.escapeHtml(appt.dentistName || 'Assigned Dentist')}">${appt.dentistInitials || 'DZ'}</div>
              </div>
            </div>
          `;

          card.addEventListener('click', function (e) {
            e.stopPropagation();
            openDetailPopover(appt);
          });
          card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDetailPopover(appt);
            }
          });
          cell.appendChild(card);

        } else if (coveringAppt) {
          // Continuation of an ongoing multi-slot appointment (e.g. 15:30-16:30 covering 16:00)
          const covTheme = getTreatmentTheme(coveringAppt.treatmentId, coveringAppt.details);
          const continuationCard = document.createElement('div');
          continuationCard.className = 'appointment-card continuation p-2 rounded-3 border-start d-flex justify-content-between align-items-center';
          continuationCard.style.cssText = `background: ${covTheme.bg}; border-left: 4px dashed ${covTheme.border} !important; cursor: pointer; height: 100%;`;
          continuationCard.setAttribute('tabindex', '0');
          continuationCard.setAttribute('role', 'button');
          continuationCard.setAttribute('aria-label', `Ongoing appointment for ${coveringAppt.patientName}`);
          continuationCard.innerHTML = `
            <span class="small fw-semibold" style="color: ${covTheme.text};"><i class="bi bi-arrow-return-right me-1" style="color: ${covTheme.border};"></i> (Ongoing) ${app.escapeHtml(coveringAppt.patientName)} — ${coveringAppt.time} to ${coveringAppt.endTime}</span>
            <span class="badge text-white" style="background: ${covTheme.border}; font-size: 0.65rem;">${app.escapeHtml(covTheme.name)}</span>
          `;
          continuationCard.addEventListener('click', function (e) {
            e.stopPropagation();
            openDetailPopover(coveringAppt);
          });
          continuationCard.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openDetailPopover(coveringAppt);
            }
          });
          cell.appendChild(continuationCard);

        } else if (scheduledLeaveReason) {
          cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center');
          cell.innerHTML += `<span class="small fst-italic text-danger"><i class="bi bi-calendar-x me-1"></i> Dentist on Leave</span>`;
          cell.title = 'Dentist on scheduled leave: ' + scheduledLeaveReason;
        } else if (past) {
          cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center');
          cell.innerHTML += '<span class="small fst-italic">Past slot</span>';
          cell.title = 'Time before now — not clickable';
        } else {
          const bufferInfo = getBufferInfoForSlot(dateISO, slotTime);
          if (bufferInfo.active) {
            cell.classList.add('bg-light', 'text-muted', 'd-flex', 'align-items-center', 'justify-content-center');
            cell.innerHTML += '<span class="fst-italic" style="font-size: 0.85rem;"><i class="bi bi-cup-hot me-1"></i> Cleaning buffer ' + bufferInfo.range + '</span>';
            cell.title = 'Cleaning buffer ' + bufferInfo.range;
          } else {
            const freeEl = document.createElement('div');
            freeEl.setAttribute('tabindex', '0');
            freeEl.setAttribute('role', 'button');
            freeEl.setAttribute('aria-label', `Free slot at ${slotTime} — click or press Enter to book`);
            freeEl.style.cssText = 'opacity:0.4; height:100%; display:flex; align-items:center; cursor:pointer; font-size:0.85rem;';
            freeEl.className = 'text-muted hover:text-dark';
            freeEl.textContent = 'Free slot — click to book';
            freeEl.addEventListener('click', function () {
              openBookingModal(slotTime);
            });
            freeEl.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBookingModal(slotTime);
              }
            });
            cell.appendChild(freeEl);
          }
        }
      }

      row.appendChild(timeEl);
      row.appendChild(cell);
      table.appendChild(row);
    });

    // Auto-scroll to current time once per session/day
    if (scrollTargetElement && !window.__hasScrolledToNow) {
      window.__hasScrolledToNow = true;
      setTimeout(() => {
        scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
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
    if (app.getRole && app.getRole() !== 'admin') return;
    const treatment = app.getTreatmentById ? app.getTreatmentById(appt.treatmentId) : { name: appt.treatmentId };

    // Format display dentist name consistently
    let dentistDisplayName = 'Dr. Zarith Sofia';

    // Set text contents
    document.getElementById('detailPatientName').textContent = appt.patientName || 'Unknown Patient';
    document.getElementById('detailTreatment').textContent = treatment.name || appt.details || 'General Checkup';
    document.getElementById('detailTime').textContent = `${appt.time} - ${appt.endTime || 'XX:XX'}`;
    document.getElementById('detailDentist').textContent = dentistDisplayName;
    document.getElementById('detailLocation').textContent = 'Room 2 - KPSTS Taman Tas';

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

    // Wire up cancel button using customized confirmation modal instead of confirm()
    const btnCancel = document.getElementById('btnCancelAppt');
    if (btnCancel) {
      if (appt.statusPill === 'Canceled' || appt.statusPill === 'Completed') {
        btnCancel.disabled = true;
      } else {
        btnCancel.disabled = false;
        btnCancel.onclick = function () {
          const cancelModalEl = document.getElementById('cancelConfirmModal');
          const cancelMsg = document.getElementById('cancelConfirmMsg');
          const confirmBtn = document.getElementById('confirmCancelBtn');

          if (cancelMsg) {
            cancelMsg.textContent = `Are you sure you want to cancel the appointment for ${appt.patientName} at ${appt.time}? The slot will be freed, and the record will be archived.`;
          }

          if (cancelModalEl && window.bootstrap) {
            const cancelModal = new bootstrap.Modal(cancelModalEl);
            confirmBtn.onclick = function () {
              cancelAppointmentById(appt.id);
              renderGrid();
              if (app.showToast) {
                app.showToast('Appointment canceled — ' + appt.time, 'success');
              }
              cancelModal.hide();
              if (currentDetailModal) currentDetailModal.hide();
            };
            cancelModal.show();
          } else {
            cancelAppointmentById(appt.id);
            renderGrid();
            if (app.showToast) app.showToast('Appointment canceled — ' + appt.time, 'success');
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
            if (form.modalDate) form.modalDate.value = appt.dateISO || utils.toDateISO(currentDate);
            if (form.modalDentist) {
              form.modalDentist.value = 'Dr. Zarith Sofia';
            }
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

    const dateISO = formData.dateISO || utils.toDateISO(currentDate);
    const slotTime = selectedSlotTime;

    // Calculate duration from treatment type
    let durationMin = SLOT_INTERVAL_MIN;
    if (Clinic.TREATMENTS) {
      const tr = Clinic.TREATMENTS.find(t => t.id === formData.treatmentType);
      if (tr && tr.duration) durationMin = tr.duration;
    }

    const conflict = hasConflictAtSubmit(dateISO, slotTime, null, editingAppointmentId, durationMin);
    if (conflict.has) {
      showFormError(conflict.reason);
      return false;
    }

    const endTime = formatTimeHHMM(parseTimeHHMM(slotTime) + durationMin);

    // Book or Update
    const newAppt = {
      id: editingAppointmentId || generateId(),
      dateISO: dateISO,
      time: slotTime,
      endTime: endTime,
      patientName: formData.patientName.trim(),
      phone: formData.phoneNumber.trim(),
      treatmentId: formData.treatmentType,
      dentistName: formData.dentistName || 'Dr. Zarith Sofia',
      dentistInitials: formData.dentistInitials || 'DZ',
      notes: formData.notes ? formData.notes.trim() : '',
      statusPill: 'Waiting'
    };

    if (editingAppointmentId) {
      updateAppointmentById(editingAppointmentId, newAppt);
    } else {
      addAppointment(newAppt);
    }

    // If date changed to another day, navigate view to that day
    if (dateISO !== utils.toDateISO(currentDate)) {
      const parts = dateISO.split('-');
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      renderDateLabel();
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

    // Capture assigned dentist (Sole dentist: Dr. Zar / DZ)
    const assignedDentist = 'Dr. Zarith Sofia';
    const initials = 'DZ';

    const dateVal = (form.modalDate && form.modalDate.value) ? form.modalDate.value : utils.toDateISO(currentDate);

    const formData = {
      patientName: form.patientName.value,
      phoneNumber: form.phoneNumber.value,
      treatmentType: form.treatmentType.value,
      dateISO: dateVal,
      dentistName: assignedDentist,
      dentistInitials: initials,
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

    // Date picker input
    const datePicker = document.getElementById('datePickerInput');
    if (datePicker) {
      datePicker.addEventListener('change', function () {
        if (this.value) {
          const parts = this.value.split('-');
          currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          renderDateLabel();
          renderGrid();
        }
      });
    }

    // Day / Week View Switcher
    const dayBtn = document.getElementById('dayViewBtn');
    const weekBtn = document.getElementById('weekViewBtn');
    if (dayBtn && weekBtn) {
      dayBtn.addEventListener('click', function () {
        currentView = 'day';
        dayBtn.classList.add('active');
        weekBtn.classList.remove('active');
        renderGrid();
      });
      weekBtn.addEventListener('click', function () {
        currentView = 'week';
        weekBtn.classList.add('active');
        dayBtn.classList.remove('active');
        renderGrid();
      });
    }

    // Patient Autocomplete from PATIENTS array
    const patientInput = document.getElementById('patientName');
    const phoneInput = document.getElementById('phoneNumber');
    if (patientInput && Clinic.PATIENTS) {
      const datalist = document.getElementById('patientDatalist');
      if (datalist) {
        datalist.innerHTML = '';
        Clinic.PATIENTS.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.name;
          datalist.appendChild(opt);
        });
      }
      patientInput.addEventListener('input', function () {
        const val = this.value.trim().toLowerCase();
        const matched = Clinic.PATIENTS.find(p => p.name.toLowerCase() === val);
        if (matched && phoneInput) {
          phoneInput.value = matched.phone;
        }
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

    // Make 'New Appointment' button open modal properly
    const mockNewBtn = document.getElementById('mockNewBtn');
    if (mockNewBtn) {
      mockNewBtn.onclick = function () {
        const slots = getSlotList();
        const dateISO = utils.toDateISO(currentDate);
        let firstFree = slots[0];
        for (let i = 0; i < slots.length; i++) {
          const bufferInfo = getBufferInfoForSlot(dateISO, slots[i]);
          if (!findAppointmentAt(dateISO, slots[i]) && !isSlotPast(slots[i], dateISO) && !bufferInfo.active && slots[i] !== '12:00' && slots[i] !== '12:30') {
            firstFree = slots[i];
            break;
          }
        }
        openBookingModal(firstFree);
      };
    }
  }

  function showTodayStats() {
    const dateISO = utils.toDateISO(currentDate);
    const dayAppts = getAppointmentsForDate(dateISO);

    const total = dayAppts.filter(a => a.statusPill !== 'Canceled').length;
    const completed = dayAppts.filter(a => a.statusPill === 'Completed').length;
    const pending = dayAppts.filter(a => a.statusPill === 'Waiting' || a.statusPill === 'In Consultation' || a.statusPill === 'Scheduled').length;

    // Available clinic slots = 17 slots (excluding 12:00-13:00 lunch = 15 working slots * 30 min = 450 min)
    let bookedMinutes = 0;
    dayAppts.forEach(a => {
      if (a.statusPill !== 'Canceled') {
        const range = getApptRange(a);
        bookedMinutes += Math.max(30, range.end - range.start);
      }
    });
    const totalWorkingMinutes = 450;
    const utilPct = Math.min(100, Math.round((bookedMinutes / totalWorkingMinutes) * 100));

    const statTotalEl = document.getElementById('statTotalCount');
    const statCompEl = document.getElementById('statCompletedCount');
    const statPendEl = document.getElementById('statPendingCount');
    const progressEl = document.querySelector('#analyticsModal .progress-bar');
    const utilLabelEl = document.getElementById('utilizationRateLabel');

    if (statTotalEl) statTotalEl.textContent = total;
    if (statCompEl) statCompEl.textContent = completed;
    if (statPendEl) statPendEl.textContent = pending;
    if (progressEl) {
      progressEl.style.width = utilPct + '%';
      progressEl.textContent = utilPct + '%';
    }
    if (utilLabelEl) {
      utilLabelEl.textContent = `${utilPct}% (${bookedMinutes} / ${totalWorkingMinutes} mins)`;
    }

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
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
