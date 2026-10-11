/**
 * Dentist Monthly Calendar Grid & Interactive Details Panel
 * Klinik Pergigian Sofea Taman Tas
 * 
 * Fetches data dynamically from mock-data.js (window.Clinic.APPOINTMENTS)
 * to simulate real frontend/backend data flow.
 */

// Color Styling Map matching the reference screenshot exactly
const COLOR_CLASSES = {
  orange: {
    bg: 'bg-[#fff3eb]',
    bar: 'bg-[#ea580c]',
    text: 'text-[#ea580c]',
    time: 'text-[#f97316]',
    hover: 'hover:bg-[#ffe7d6]'
  },
  purple: {
    bg: 'bg-[#f4f2ff]',
    bar: 'bg-[#8b5cf6]',
    text: 'text-[#7c3aed]',
    time: 'text-[#8b5cf6]',
    hover: 'hover:bg-[#eae5fe]'
  },
  yellow: {
    bg: 'bg-[#fffbeb]',
    bar: 'bg-[#eab308]',
    text: 'text-[#ca8a04]',
    time: 'text-[#d97706]',
    hover: 'hover:bg-[#fef3c7]'
  },
  blue: {
    bg: 'bg-[#f0f8ff]',
    bar: 'bg-[#0284c7]',
    text: 'text-[#0369a1]',
    time: 'text-[#0284c7]',
    hover: 'hover:bg-[#e0f2fe]'
  },
  green: {
    bg: 'bg-[#f0fdf4]',
    bar: 'bg-[#16a34a]',
    text: 'text-[#15803d]',
    time: 'text-[#16a34a]',
    hover: 'hover:bg-[#dcfce7]'
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Application state for calendar and selection
let state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedAppointment: null,
  searchQuery: '',
  appointments: []
};

/**
 * Maps raw backend appointment item to rich UI model
 */
function normalizeAppointment(raw) {
  const dateParts = (raw.dateISO || '').split('-');
  const year = parseInt(dateParts[0], 10) || new Date().getFullYear();
  const month = (parseInt(dateParts[1], 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10) || 1;

  // Derive time range format (e.g. "12:00 - 12:30 PM")
  const startTime = raw.time || '10:00';
  const endTime = raw.endTime || calculateEndTime(startTime);
  const timeFormatted = `${formatTime12(startTime)} - ${formatTime12(endTime)}`;

  // Determine color matching reference design
  const color = deriveColor(raw);

  // Generate procedure-specific clinical tasks
  const tasks = raw.tasks || generateTasksForTreatment(raw.treatmentId, raw.details);

  return {
    id: raw.id,
    patientId: raw.patientId || `BRIEF-${String(raw.id).replace(/\D/g, '').padStart(6, '0') || '414305'}`,
    patientName: raw.patientName,
    phone: raw.phone || '+60 12-345 6789',
    date: raw.dateISO,
    year: year,
    month: month,
    day: day,
    time: timeFormatted,
    timeSlot: formatTime12(startTime),
    color: color,
    treatment: raw.details || getTreatmentTitle(raw.treatmentId),
    status: raw.statusPill || raw.status || 'Scheduled',
    notes: raw.notes || 'Routine consultation and oral inspection.',
    tasks: tasks
  };
}

/**
 * 12-hour time formatter helper (e.g. 10:00 -> 10:00 AM, 14:30 -> 02:30 PM)
 */
function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

function calculateEndTime(startHhmm) {
  const [hStr, mStr] = startHhmm.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10) + 30;
  if (m >= 60) {
    h += 1;
    m -= 60;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Derives color palette theme matching reference visual design
 */
function deriveColor(raw) {
  const name = (raw.patientName || '').toLowerCase();
  const treat = (raw.treatmentId || '').toLowerCase();
  const details = (raw.details || '').toLowerCase();

  if (name.includes("doctor's meeting") || treat === 'mos' || details.includes('review') || details.includes('audit')) {
    return 'purple';
  }
  if (name.includes('call') || details.includes('phone') || details.includes('sync')) {
    return 'yellow';
  }
  if (name.includes('symposium') || name.includes('web conference') || details.includes('congress') || details.includes('webinar')) {
    return 'blue';
  }
  if (treat === 'scaling' && name.includes('hannah')) {
    return 'orange';
  }
  if (treat === 'scaling') {
    return 'green';
  }
  if (treat === 'checkup') {
    return 'green';
  }
  if (treat === 'filling') {
    return 'orange';
  }
  if (treat === 'braces' || treat === 'extraction') {
    return 'orange';
  }

  // Consistent color distribution fallback based on id
  const colors = ['orange', 'blue', 'green', 'yellow', 'purple'];
  const hash = String(raw.id).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getTreatmentTitle(treatmentId) {
  if (window.Clinic && Array.isArray(window.Clinic.TREATMENTS)) {
    const found = window.Clinic.TREATMENTS.find(t => t.id === treatmentId);
    if (found) return found.name;
  }
  return 'Dental Consultation';
}

/**
 * Generates clinical procedure tasks for the aside checklist
 */
function generateTasksForTreatment(treatmentId, details) {
  const text = (details || treatmentId || '').toLowerCase();

  if (text.includes('scaling')) {
    return [
      { text: 'Vital signs & BP check', done: true },
      { text: 'Dental scaling & plaque removal', done: true },
      { text: 'Prescribe Amoxicillin 500mg', done: false },
      { text: 'Fluoride treatment applied', done: true },
      { text: 'Schedule 6-month recall visit', done: false }
    ];
  }
  if (text.includes('filling') || text.includes('composite')) {
    return [
      { text: 'Caries excavation done', done: true },
      { text: 'Matrix band & wedge positioned', done: true },
      { text: 'Composite filling cured', done: false },
      { text: 'Bite articulation checked', done: false }
    ];
  }
  if (text.includes('checkup') || text.includes('consultation')) {
    return [
      { text: 'Intraoral clinical examination', done: true },
      { text: 'Bitewing radiograph check', done: true },
      { text: 'Periodontal probing depth recorded', done: false },
      { text: 'Oral hygiene instructions', done: false }
    ];
  }
  if (text.includes('meeting') || text.includes('review')) {
    return [
      { text: 'Clinical case discussion', done: true },
      { text: 'Sterilization protocol audit', done: true },
      { text: 'Action plan logged', done: false }
    ];
  }
  if (text.includes('call') || text.includes('follow-up')) {
    return [
      { text: 'Verify post-op recovery', done: true },
      { text: 'Check medication compliance', done: true },
      { text: 'Schedule follow-up review', done: false }
    ];
  }

  return [
    { text: 'Clinical assessment complete', done: true },
    { text: 'Procedure documentation updated', done: true },
    { text: 'Next visit scheduled', done: false }
  ];
}

/**
 * Fetches appointments dynamically from mock-data.js (via window.Clinic.APPOINTMENTS or Clinic.storage)
 */
function fetchAppointmentsFromBackend() {
  let rawList = [];

  // Check persistent storage first (if user created/saved appointments)
  if (window.Clinic && window.Clinic.storage && window.Clinic.storage.KEYS) {
    const stored = window.Clinic.storage.getJSON(window.Clinic.storage.KEYS.appointments);
    if (Array.isArray(stored) && stored.length > 0) {
      rawList = stored;
    }
  }

  // Primary source: window.Clinic.APPOINTMENTS populated by mock-data.js
  if ((!rawList || rawList.length === 0) && window.Clinic && Array.isArray(window.Clinic.APPOINTMENTS)) {
    rawList = window.Clinic.APPOINTMENTS;
  }

  return rawList.map(item => normalizeAppointment(item));
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Load dynamic data from mock backend
  state.appointments = fetchAppointmentsFromBackend();

  // If mock data has items for a specific month, align calendar to that month or current date
  if (state.appointments.length > 0) {
    // Select Hannah Fatheehah or first available appointment
    state.selectedAppointment = state.appointments.find(a =>
      a.patientName.toLowerCase().includes('hannah')
    ) || state.appointments[0];

    // If appointments have a dominant month/year, set to active date
    if (state.selectedAppointment) {
      state.year = state.selectedAppointment.year;
      state.month = state.selectedAppointment.month;
    }
  }

  renderCalendar();
  bindCalendarControls();
  renderSideDetails(state.selectedAppointment);
});

/**
 * Renders the Monthly Grid (Sunday - Saturday)
 */
function renderCalendar() {
  const gridContainer = document.getElementById('calendar-grid');
  const titleEl = document.getElementById('monthYearTitle');
  if (!gridContainer) return;

  if (titleEl) {
    titleEl.textContent = `${MONTH_NAMES[state.month]} ${state.year}`;
  }

  gridContainer.innerHTML = '';

  const firstDayIndex = new Date(state.year, state.month, 1).getDay(); // 0 is Sunday
  const daysInCurrentMonth = new Date(state.year, state.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(state.year, state.month, 0).getDate();

  // Total grid cells: 5 rows (35) or 6 rows (42)
  const totalCells = (firstDayIndex + daysInCurrentMonth > 35) ? 42 : 35;

  let currentDay = 1;
  let nextMonthDay = 1;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    // Compact min-height (112px) to prevent vertical over-stretching while giving large horizontal room
    cell.className = 'bg-white border border-slate-200/80 rounded-xl min-h-[112px] flex flex-col justify-start transition hover:border-slate-300 hover:shadow-xs group relative overflow-hidden pt-1.5 pb-1';

    // Day from Previous Month
    if (i < firstDayIndex) {
      const prevDate = daysInPrevMonth - (firstDayIndex - i - 1);
      cell.classList.add('bg-slate-50/50', 'opacity-50');
      cell.innerHTML = `
        <div class="flex justify-end text-[11px] font-semibold text-slate-300 px-2 mb-1">
          ${prevDate}
        </div>
      `;
    }
    // Day in Current Month
    else if (currentDay <= daysInCurrentMonth) {
      const thisDayNum = currentDay;
      const today = new Date();
      const isToday = (state.year === today.getFullYear() && state.month === today.getMonth() && thisDayNum === today.getDate())
        || (thisDayNum === 23); // Highlight 23 as active clinic day

      const dayHeader = `
        <div class="flex justify-end items-center px-2 mb-1 shrink-0">
          <span class="text-xs font-bold ${isToday ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs' : 'text-slate-700'}">
            ${thisDayNum}
          </span>
        </div>
      `;

      // Filter appointments for this date from the fetched mock dataset
      const dateString = `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(thisDayNum).padStart(2, '0')}`;
      let dayAppts = state.appointments.filter(a => a.date === dateString || (a.year === state.year && a.month === state.month && a.day === thisDayNum));

      if (state.searchQuery) {
        dayAppts = dayAppts.filter(a =>
          a.patientName.toLowerCase().includes(state.searchQuery) ||
          a.patientId.toLowerCase().includes(state.searchQuery) ||
          a.treatment.toLowerCase().includes(state.searchQuery)
        );
      }

      let apptsHtml = '<div class="flex flex-col gap-1 w-full px-1">';
      dayAppts.forEach(appt => {
        const style = COLOR_CLASSES[appt.color] || COLOR_CLASSES.orange;
        const isSelected = state.selectedAppointment && state.selectedAppointment.id === appt.id;

        apptsHtml += `
          <div
            class="appointment-chip w-full px-2 py-1 rounded-md ${style.bg} ${style.hover} cursor-pointer transition select-none flex items-center gap-1.5 ${isSelected ? 'ring-1.5 ring-blue-500 font-bold' : ''}"
            data-id="${appt.id}"
          >
            <span class="w-1.5 h-5 rounded-full ${style.bar} shrink-0"></span>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold ${style.time} leading-tight truncate">${appt.timeSlot}</div>
              <div class="text-[11px] font-bold ${style.text} leading-tight truncate mt-0.5">${appt.patientName}</div>
            </div>
          </div>
        `;
      });
      apptsHtml += '</div>';

      cell.innerHTML = dayHeader + apptsHtml;
      currentDay++;
    }
    // Day in Next Month
    else {
      cell.classList.add('bg-slate-50/50', 'opacity-50');
      cell.innerHTML = `
        <div class="flex justify-end text-[11px] font-semibold text-slate-300 px-2 mb-1">
          ${nextMonthDay}
        </div>
      `;
      nextMonthDay++;
    }

    gridContainer.appendChild(cell);
  }

  attachAppointmentChipEvents();
}

/**
 * Attach Hover & Click listeners to all appointment chips
 */
function attachAppointmentChipEvents() {
  const popover = document.getElementById('calendar-hover-popover');
  const chips = document.querySelectorAll('.appointment-chip');

  chips.forEach(chip => {
    const apptId = chip.getAttribute('data-id');
    const appt = state.appointments.find(a => a.id === apptId);
    if (!appt) return;

    // Click event -> Updates Details Information Aside
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      state.selectedAppointment = appt;
      renderSideDetails(appt);

      // Highlight selected chip
      document.querySelectorAll('.appointment-chip').forEach(c => c.classList.remove('ring-1.5', 'ring-blue-500'));
      chip.classList.add('ring-1.5', 'ring-blue-500');
    });

    // Double click -> Opens full details modal
    chip.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openPatientModal(appt.patientName, appt.patientId, appt.phone, appt.time, appt.status);
    });

    // Mouse Enter -> Show Hover Popover
    chip.addEventListener('mouseenter', () => {
      if (!popover) return;
      populatePopover(appt);

      popover.classList.remove('hidden');
      requestAnimationFrame(() => {
        positionPopover(chip, popover);
        popover.classList.remove('opacity-0');
      });
    });

    // Mouse Leave -> Hide Hover Popover
    chip.addEventListener('mouseleave', () => {
      if (!popover) return;
      popover.classList.add('opacity-0');
      setTimeout(() => {
        if (popover.classList.contains('opacity-0')) {
          popover.classList.add('hidden');
        }
      }, 150);
    });
  });
}

/**
 * Calculates position for floating popover directly above the hovered chip
 */
function positionPopover(chipEl, popoverEl) {
  const rect = chipEl.getBoundingClientRect();
  const popoverRect = popoverEl.getBoundingClientRect();

  // Position above the chip, horizontally centered
  let top = rect.top - 12;
  let left = rect.left + (rect.width / 2);

  // Screen overflow adjustments
  if (top - popoverRect.height < 10) {
    top = rect.bottom + popoverRect.height + 12;
    popoverEl.classList.add('translate-y-0');
    popoverEl.classList.remove('-translate-y-full');
  } else {
    popoverEl.classList.add('-translate-y-full');
    popoverEl.classList.remove('translate-y-0');
  }

  // Prevent horizontal overflow
  if (left - (popoverRect.width / 2) < 10) {
    left = (popoverRect.width / 2) + 10;
  } else if (left + (popoverRect.width / 2) > window.innerWidth - 10) {
    left = window.innerWidth - (popoverRect.width / 2) - 10;
  }

  popoverEl.style.top = `${top}px`;
  popoverEl.style.left = `${left}px`;
}

/**
 * Populates data into Hover Popover
 */
function populatePopover(appt) {
  const popover = document.getElementById('calendar-hover-popover');
  if (!popover) return;

  const nameEl = document.getElementById('popover-name');
  const treatEl = document.getElementById('popover-treatment');
  const timeEl = document.getElementById('popover-time');
  const phoneEl = document.getElementById('popover-phone');
  const idEl = document.getElementById('popover-id');
  const statusBadge = document.getElementById('popover-status');

  if (nameEl) nameEl.textContent = appt.patientName;
  if (treatEl) treatEl.textContent = appt.treatment;
  if (timeEl) timeEl.textContent = appt.time;
  if (phoneEl) phoneEl.textContent = appt.phone;
  if (idEl) idEl.textContent = appt.patientId;

  if (statusBadge) {
    statusBadge.textContent = appt.status;
    if (appt.status === 'In Consultation') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs';
    } else if (appt.status === 'Completed') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else if (appt.status === 'Waiting') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
    } else {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200';
    }
  }
}

/**
 * Updates the Right Aside Details Information (Box style matching reference)
 */
function renderSideDetails(appt) {
  if (!appt) return;

  const nameEl = document.getElementById('side-patient-name');
  const timeEl = document.getElementById('side-appt-time');
  const notesEl = document.getElementById('side-clinical-notes');
  const badgeEl = document.getElementById('side-status-badge');
  const tasksContainer = document.getElementById('sideTasksList');
  const tasksCountEl = document.getElementById('tasksCount');

  if (nameEl) nameEl.textContent = appt.patientName;
  if (timeEl) timeEl.textContent = `${appt.date || 'Active Session'} • ${appt.time}`;
  if (notesEl) notesEl.textContent = appt.notes || 'No specific clinical remarks registered for this session.';

  if (badgeEl) {
    badgeEl.textContent = appt.status;
    if (appt.status === 'In Consultation') {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs';
    } else if (appt.status === 'Completed') {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else if (appt.status === 'Waiting') {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
    } else {
      badgeEl.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200';
    }
  }

  // Render Tasks Checklist
  if (tasksContainer && appt.tasks) {
    tasksContainer.innerHTML = '';
    let doneCount = 0;

    appt.tasks.forEach((task, idx) => {
      if (task.done) doneCount++;
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none';
      label.innerHTML = `
        <input type="checkbox" ${task.done ? 'checked' : ''} class="hidden peer" onchange="toggleTaskDone('${appt.id}', ${idx}, this.checked)">
        <span class="w-4 h-4 rounded bg-slate-300 peer-checked:bg-blue-600 text-transparent peer-checked:text-white flex items-center justify-center text-[10px] transition-colors shrink-0">
          <i class="fa-solid fa-check"></i>
        </span>
        <span class="peer-checked:line-through peer-checked:text-slate-400">${task.text}</span>
      `;
      tasksContainer.appendChild(label);
    });

    if (tasksCountEl) {
      tasksCountEl.textContent = `${doneCount}/${appt.tasks.length} done`;
    }
  }
}

/**
 * Toggles a task in the active appointment
 */
function toggleTaskDone(apptId, taskIndex, isChecked) {
  const appt = state.appointments.find(a => a.id === apptId);
  if (appt && appt.tasks && appt.tasks[taskIndex]) {
    appt.tasks[taskIndex].done = isChecked;
    updateTaskProgress();
  }
}

function updateTaskProgress() {
  const appt = state.selectedAppointment;
  if (!appt || !appt.tasks) return;

  const checkboxes = document.querySelectorAll('#sideTasksList input[type="checkbox"]');
  let doneCount = 0;
  checkboxes.forEach(cb => {
    if (cb.checked) doneCount++;
  });

  const tasksCountEl = document.getElementById('tasksCount');
  if (tasksCountEl) {
    tasksCountEl.textContent = `${doneCount}/${checkboxes.length} done`;
  }
}

/**
 * Month Navigation Controls
 */
function bindCalendarControls() {
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const todayBtn = document.getElementById('todayBtn');
  const searchInput = document.querySelector('input[placeholder="Search patient or ID..."]');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      state.month--;
      if (state.month < 0) {
        state.month = 11;
        state.year--;
      }
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      state.month++;
      if (state.month > 11) {
        state.month = 0;
        state.year++;
      }
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      // Return to active mock data month/year
      if (state.selectedAppointment) {
        state.year = state.selectedAppointment.year;
        state.month = state.selectedAppointment.month;
      } else {
        state.year = new Date().getFullYear();
        state.month = new Date().getMonth();
      }
      renderCalendar();
      showAlertAction(`Returned to ${MONTH_NAMES[state.month]} ${state.year} schedule`);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderCalendar();
    });
  }
}

/**
 * Open Modal from Aside "View Full" button
 */
function openDetailedModalFromSide() {
  const appt = state.selectedAppointment;
  if (appt) {
    openPatientModal(appt.patientName, appt.patientId, appt.phone, appt.time, appt.status);
  }
}

/**
 * Patient Modal Logic
 */
function openPatientModal(name, id, phone, time, status) {
  const nameEl = document.getElementById('modal-patient-name');
  const idEl = document.getElementById('modal-patient-id');
  const phoneEl = document.getElementById('modal-phone');
  const timeEl = document.getElementById('modal-time');
  const badgeEl = document.getElementById('modal-status-badge');

  if (nameEl) nameEl.innerText = name;
  if (idEl) idEl.innerText = id;
  if (phoneEl) phoneEl.innerText = phone;
  if (timeEl) timeEl.innerText = `${MONTH_NAMES[state.month]} ${state.year}, ${time}`;

  if (badgeEl) {
    badgeEl.innerText = status;
    if (status === 'In Consultation') {
      badgeEl.className = 'bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold text-[10px]';
    } else if (status === 'Completed') {
      badgeEl.className = 'bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
    } else if (status === 'Waiting') {
      badgeEl.className = 'bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
    } else {
      badgeEl.className = 'bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
    }
  }

  const modal = document.getElementById('patient-modal');
  if (modal) modal.classList.remove('hidden');
}

function closePatientModal() {
  const modal = document.getElementById('patient-modal');
  if (modal) modal.classList.add('hidden');
}

function printPrescription() {
  showAlertAction('Preparing prescription document for printing...');
  setTimeout(() => window.print(), 600);
}

function saveSideChanges() {
  showAlertAction('Clinical record & procedure checklist saved successfully!');
}

function showAlertAction(msg) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs z-50 transition-all duration-300 border border-slate-700 flex items-center gap-2';
  notification.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i><span>' + msg + '</span>';
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

window.onclick = function (event) {
  const modal = document.getElementById('patient-modal');
  if (event.target === modal) {
    closePatientModal();
  }
};
