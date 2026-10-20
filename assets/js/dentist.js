/**
 * Dentist Monthly Calendar Grid & Interactive Details Panel
 * Klinik Pergigian Sofea Taman Tas
 * 
 * Fetches data dynamically from mock-data.js (window.Clinic.APPOINTMENTS)
 * to simulate real frontend/backend data flow.
 */

// Color Styling Map matching the reference screenshot exactly
const COLOR_CLASSES = {
  teal: {
    bg: 'bg-[#f0fdfa]',
    bar: 'bg-[#0d9488]',
    text: 'text-[#0f766e]',
    time: 'text-[#0d9488]',
    hover: 'hover:bg-[#ccfbf1]'
  },
  red: {
    bg: 'bg-[#fef2f2]',
    bar: 'bg-[#ef4444]',
    text: 'text-[#b91c1c]',
    time: 'text-[#ef4444]',
    hover: 'hover:bg-[#fee2e2]'
  },
  blue: {
    bg: 'bg-[#eff6ff]',
    bar: 'bg-[#3b82f6]',
    text: 'text-[#1e40af]',
    time: 'text-[#2563eb]',
    hover: 'hover:bg-[#dbeafe]'
  },
  orange: {
    bg: 'bg-[#fffbeb]',
    bar: 'bg-[#f59e0b]',
    text: 'text-[#b45309]',
    time: 'text-[#d97706]',
    hover: 'hover:bg-[#fef3c7]'
  },
  green: {
    bg: 'bg-[#f0fdf4]',
    bar: 'bg-[#22c55e]',
    text: 'text-[#15803d]',
    time: 'text-[#16a34a]',
    hover: 'hover:bg-[#dcfce7]'
  },
  purple: {
    bg: 'bg-[#faf5ff]',
    bar: 'bg-[#a855f7]',
    text: 'text-[#6b21a8]',
    time: 'text-[#7c3aed]',
    hover: 'hover:bg-[#f3e8ff]'
  },
  yellow: {
    bg: 'bg-[#fffbeb]',
    bar: 'bg-[#eab308]',
    text: 'text-[#ca8a04]',
    time: 'text-[#d97706]',
    hover: 'hover:bg-[#fef3c7]'
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function escapeHtml(str) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.escapeHtml) {
    return window.Clinic.app.escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// Application state for calendar and selection
let state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selectedAppointment: null,
  searchQuery: '',
  appointments: []
};

/**
 * Clinical Profile Helper to ensure data matches mock dataset & reference design
 */
function getPatientClinicalProfile(patientName, rawId, explicitPatientId, explicitApptId) {
  const name = (patientName || '').trim();
  const lower = name.toLowerCase();

  // Known patient profiles matching user reference screenshots exactly
  if (lower.includes('zahrah')) {
    return {
      patientId: explicitPatientId || 'BRIEF-414301',
      appointmentId: explicitApptId || 'APT-783421',
      dob: '18 MAY 1988 (36 Years)',
      gender: 'Female',
      email: 'hannah.salsabila@email.com',
      defaultNotes: 'Allergic to Penicillin. Monitor blood pressure closely. Previous check-up: 20 AUG 2024.',
      lastUpdated: 'Last updated: 23 Sep 2024, 11:45 AM'
    };
  }

  if (lower.includes('zulkarnain')) {
    return {
      patientId: explicitPatientId || 'BRIEF-000001',
      appointmentId: explicitApptId || 'APT-100234',
      dob: '05 MAR 1991 (33 Years)',
      gender: 'Male',
      email: 'ahmad.zulkarnain@email.com',
      defaultNotes: 'Scaling & Polishing procedure completed. Healthy gingiva. Advised on soft-bristle toothbrush.',
      lastUpdated: 'Last updated: 08 Sep 2024, 10:15 AM'
    };
  }

  if (lower.includes('hannah')) {
    return {
      patientId: explicitPatientId || 'BRIEF-414305',
      appointmentId: explicitApptId || 'APT-783425',
      dob: '18 MAY 1988 (36 Years)',
      gender: 'Female',
      email: 'hannah.salsabila@email.com',
      defaultNotes: 'Allergic to Penicillin. Routine dental scaling and consultation. Patient requested advice on teeth sensitivity and home care.',
      lastUpdated: 'Last updated: 23 Sep 2024, 11:45 AM'
    };
  }

  if (lower.includes('aina')) {
    return {
      patientId: explicitPatientId || 'BRIEF-000002',
      appointmentId: explicitApptId || 'APT-100235',
      dob: '14 NOV 1996 (28 Years)',
      gender: 'Female',
      email: 'aina.sofea@email.com',
      defaultNotes: 'Routine cleaning and scaling completed. Good oral hygiene maintenance.',
      lastUpdated: 'Last updated: 09 Sep 2024, 10:00 AM'
    };
  }

  // Deterministic calculation for any other patient in mock dataset
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  hash = Math.abs(hash);

  const isFemale = lower.includes('binti') || lower.includes('ms.') || lower.includes('mrs.') || lower.includes('puan') || lower.includes('nur') || lower.includes('siti') || lower.includes('farah') || lower.includes('amanda') || lower.includes('sophia') || lower.includes('lynda') || lower.includes('maria') || lower.includes('tory');
  const gender = isFemale ? 'Female' : 'Male';

  const birthYear = 1970 + (hash % 32);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const birthDay = 1 + (hash % 28);
  const birthMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const birthMonth = birthMonths[(hash >> 3) % 12];
  const dob = `${String(birthDay).padStart(2, '0')} ${birthMonth} ${birthYear} (${age} Years)`;

  const numericId = String(hash % 900000 + 100000);
  const patientId = explicitPatientId || `BRIEF-${numericId}`;
  const appointmentId = explicitApptId || `APT-${String(hash % 800000 + 100000)}`;

  const cleanNameForEmail = lower.replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  const email = `${cleanNameForEmail || 'patient'}@email.com`;

  return {
    patientId: patientId,
    appointmentId: appointmentId,
    dob: dob,
    gender: gender,
    email: email,
    defaultNotes: 'Routine consultation recorded. Oral tissues healthy, regular oral hygiene regimen advised.',
    lastUpdated: 'Last updated: Today, 11:45 AM'
  };
}

function deriveDoctor(initials) {
  return 'DR. ZAR (Room 2)';
}

/**
 * Maps raw backend appointment item to rich UI model
 */
function normalizeAppointment(raw) {
  const dateParts = (raw.dateISO || '').split('-');
  const year = parseInt(dateParts[0], 10) || new Date().getFullYear();
  const month = (parseInt(dateParts[1], 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10) || 1;

  // Derive time range format (e.g. "09:00 AM - 09:30 AM")
  const startTime = raw.time || '10:00';
  const endTime = raw.endTime || calculateEndTime(startTime);
  const timeFormatted = `${formatTime12(startTime)} - ${formatTime12(endTime)}`;
  const timeSlot = formatTime12(startTime);

  // Month short name & full formatted DateTime matching screenshot
  const monthShort = MONTH_NAMES[month] ? MONTH_NAMES[month].substring(0, 3).toUpperCase() : 'SEP';
  const fullDateTime = `${String(day).padStart(2, '0')} ${monthShort} ${year}, ${timeFormatted}`;

  // Clinical notes store check
  let savedNotes = null;
  let savedTasks = null;
  let savedPhone = null;
  let savedEmail = null;
  if (window.Clinic && window.Clinic.storage) {
    const notesKey = 'kpst.v1.clinical_notes';
    const notesStore = window.Clinic.storage.getJSON(notesKey) || {};
    if (notesStore[raw.id]) {
      savedNotes = notesStore[raw.id].notes;
      savedTasks = notesStore[raw.id].tasks;
      savedPhone = notesStore[raw.id].phone;
      savedEmail = notesStore[raw.id].email;
    }
  }

  // Determine color matching reference design
  const color = deriveColor(raw);

  // Generate procedure-specific clinical tasks
  const tasks = savedTasks || raw.tasks || generateTasksForTreatment(raw.treatmentId, raw.details);

  // Clinical profile
  const profile = getPatientClinicalProfile(raw.patientName, raw.id, raw.patientId, raw.appointmentId);

  // Doctor assignment
  const doctor = deriveDoctor(raw.dentistInitials || raw.dentist);

  // Status
  const status = raw.statusPill || raw.status || 'Scheduled';

  // Notes
  const notes = savedNotes !== null ? savedNotes : ((raw.notes && raw.notes.trim()) ? raw.notes : profile.defaultNotes);

  // Treatment / Reason
  const reason = raw.details || getTreatmentTitle(raw.treatmentId) || 'Follow-up Consultation & Vital Check';

  return {
    id: raw.id,
    dateISO: raw.dateISO,
    rawTime: raw.time,
    endTime: raw.endTime,
    treatmentId: raw.treatmentId,
    dentistInitials: raw.dentistInitials || raw.dentist || 'DZ',
    appointmentId: profile.appointmentId,
    patientId: profile.patientId,
    patientName: raw.patientName,
    fullNameUpper: (raw.patientName || '').toUpperCase(),
    dob: profile.dob,
    gender: profile.gender,
    phone: savedPhone || raw.phone || '+60 12-345 6789',
    email: savedEmail || raw.email || profile.email,
    date: raw.dateISO,
    year: year,
    month: month,
    day: day,
    time: timeFormatted,
    timeSlot: timeSlot,
    fullDateTime: fullDateTime,
    assignedTo: doctor,
    reason: reason,
    color: color,
    treatment: reason,
    status: status,
    notes: notes,
    lastUpdated: profile.lastUpdated,
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
  const treat = (raw.treatmentId || '').toLowerCase();
  const details = (raw.details || '').toLowerCase();

  if (treat === 'braces' || details.includes('brace')) {
    return 'teal';
  }
  if (treat === 'extraction' || details.includes('extract') || details.includes('suture')) {
    return 'red';
  }
  if (treat === 'scaling' || details.includes('scali') || details.includes('whiten') || details.includes('polish')) {
    return 'blue';
  }
  if (treat === 'filling' || details.includes('fill') || details.includes('inlay') || details.includes('veneer') || details.includes('crown')) {
    return 'orange';
  }
  if (treat === 'checkup' || details.includes('check') || details.includes('consult')) {
    return 'green';
  }
  if (treat === 'mos' || details.includes('surg') || details.includes('implant') || details.includes('excision') || details.includes('operculectomy')) {
    return 'purple';
  }

  return 'teal';
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
      { text: 'Dental scaling & calculus removal', done: true },
      { text: 'Chlorhexidine 0.12% oral rinse administered', done: true },
      { text: 'Fluoride varnish application', done: true },
      { text: 'Oral hygiene & sensitivity instructions', done: false },
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
  // Enforce dentist role
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
    if (window.Clinic.app.enforceRole && !window.Clinic.app.enforceRole(['dentist'])) return;
  }

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
      const maxVisible = 2;
      const visibleAppts = dayAppts.slice(0, maxVisible);
      const excessCount = dayAppts.length - maxVisible;

      visibleAppts.forEach(appt => {
        const style = COLOR_CLASSES[appt.color] || COLOR_CLASSES.orange;
        const isSelected = state.selectedAppointment && state.selectedAppointment.id === appt.id;

        apptsHtml += `
          <div
            tabindex="0"
            role="button"
            aria-label="Appointment for ${escapeHtml(appt.patientName)} at ${escapeHtml(appt.timeSlot)}"
            class="appointment-chip w-full px-2 py-1 rounded-md ${style.bg} ${style.hover} cursor-pointer transition select-none flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelected ? 'ring-1.5 ring-blue-500 font-bold' : ''}"
            data-id="${appt.id}"
          >
            <span class="w-1.5 h-5 rounded-full ${style.bar} shrink-0"></span>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] font-bold ${style.time} leading-tight truncate">${escapeHtml(appt.timeSlot)}</div>
              <div class="text-[11px] font-bold ${style.text} leading-tight truncate mt-0.5">${escapeHtml(appt.patientName)}</div>
            </div>
          </div>
        `;
      });

      if (excessCount > 0) {
        apptsHtml += `
          <button type="button" class="w-full text-left text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/90 px-1.5 py-0.5 rounded border border-blue-200/60 transition day-overflow-btn" data-date="${dateString}">
            +${excessCount} more
          </button>
        `;
      }

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
  attachDayOverflowEvents();
}

/**
 * Attach Hover, Click, Touch, and Keyboard listeners to all appointment chips
 */
function attachAppointmentChipEvents() {
  const popover = document.getElementById('calendar-hover-popover');
  const chips = document.querySelectorAll('.appointment-chip');

  chips.forEach(chip => {
    const apptId = chip.getAttribute('data-id');
    const appt = state.appointments.find(a => a.id === apptId);
    if (!appt) return;

    const selectAndOpen = (e) => {
      if (e) e.stopPropagation();
      state.selectedAppointment = appt;
      renderSideDetails(appt);

      document.querySelectorAll('.appointment-chip').forEach(c => c.classList.remove('ring-1.5', 'ring-blue-500'));
      chip.classList.add('ring-1.5', 'ring-blue-500');

      openPatientModal(appt);
    };

    // Click event -> Updates details panel AND displays the details modal
    chip.addEventListener('click', selectAndOpen);

    // Keyboard Accessibility (Enter or Space)
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectAndOpen(e);
      }
    });

    // Touch support
    chip.addEventListener('touchstart', (e) => {
      state.hoveredAppointment = appt;
      populatePopover(appt);
      if (popover) {
        popover.classList.remove('hidden', 'opacity-0');
        positionPopover(chip, popover);
      }
    }, { passive: true });

    // Double click -> Opens full details modal as well
    chip.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openPatientModal(appt);
    });

    // Mouse Enter -> Show Hover Popover
    chip.addEventListener('mouseenter', () => {
      if (!popover) return;
      state.hoveredAppointment = appt;
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

  // Clicking directly on floating popover card also opens the details modal
  if (popover && !popover.dataset.hasClickListener) {
    popover.dataset.hasClickListener = 'true';
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetAppt = state.hoveredAppointment || state.selectedAppointment;
      if (targetAppt) {
        state.selectedAppointment = targetAppt;
        renderSideDetails(targetAppt);
        openPatientModal(targetAppt);
      }
    });
  }
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
  if (treatEl) treatEl.textContent = appt.treatment || appt.reason;
  if (timeEl) timeEl.textContent = appt.time;
  if (phoneEl) phoneEl.textContent = appt.phone;
  if (idEl) idEl.textContent = appt.patientId;

  if (statusBadge) {
    statusBadge.textContent = appt.status;
    if (appt.status === 'In Consultation') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
    } else if (appt.status === 'Completed') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
    } else if (appt.status === 'Waiting') {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200';
    } else {
      statusBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200';
    }
  }
}

/**
 * Helper to detect documented medication allergies from appointment notes and patient history
 */
function getPatientAllergy(appt) {
  if (!appt) return null;
  const notes = (appt.notes || '').toLowerCase();
  const reason = (appt.reason || appt.treatment || '').toLowerCase();
  const name = (appt.patientName || '').toLowerCase();
  if (notes.includes('penicillin') || reason.includes('penicillin') || name.includes('zahrah') || name.includes('hannah')) {
    return 'Penicillin (Severe Risk / Contraindicated: Beta-lactams & Amoxicillin)';
  }
  if (notes.includes('allergy') || notes.includes('allergic')) {
    const match = appt.notes.match(/allergic to [^.]+/i) || appt.notes.match(/allergy:? [^.]+/i);
    return match ? match[0] : 'Documented Medication Allergy';
  }
  return null;
}

/**
 * Updates the Right Aside Details Information (Box style matching reference)
 */
function renderSideDetails(appt) {
  if (!appt) return;

  const nameEl = document.getElementById('side-patient-name');
  const timeEl = document.getElementById('side-appt-time');
  const notesEl = document.getElementById('side-edit-notes');
  const badgeEl = document.getElementById('side-status-badge');
  const tasksContainer = document.getElementById('sideTasksList');
  const tasksCountEl = document.getElementById('tasksCount');

  if (nameEl) nameEl.textContent = appt.patientName;
  if (timeEl) timeEl.textContent = `${appt.date || 'Active Session'} • ${appt.time}`;
  if (notesEl) notesEl.value = appt.notes || '';

  // Update allergy alert in sidebar
  const allergy = getPatientAllergy(appt);
  const sideAllergyAlert = document.getElementById('side-allergy-alert');
  const sideAllergyText = document.getElementById('side-allergy-text');
  if (sideAllergyAlert && sideAllergyText) {
    if (allergy) {
      sideAllergyText.textContent = `Allergic to ${allergy}`;
      sideAllergyAlert.classList.remove('hidden');
    } else {
      sideAllergyAlert.classList.add('hidden');
    }
  }

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
 * Real-time sync for side panel notes textarea
 */
function syncSideNotesToState(val) {
  if (state.selectedAppointment) {
    state.selectedAppointment.notes = val;
    state.selectedAppointment.lastUpdated = `Last updated: Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    persistAppointmentsToStorage();
  }
}

/**
 * Persists current appointments to isolated clinical notes and patches canonical appointments
 */
function persistAppointmentsToStorage() {
  if (!state.selectedAppointment) return;
  const appt = state.selectedAppointment;

  // 1. Persist isolated clinical notes & task states
  if (window.Clinic && window.Clinic.storage) {
    const notesKey = 'kpst.v1.clinical_notes';
    const notesStore = window.Clinic.storage.getJSON(notesKey) || {};
    notesStore[appt.id] = {
      notes: appt.notes,
      tasks: appt.tasks,
      phone: appt.phone,
      email: appt.email,
      lastUpdated: appt.lastUpdated
    };
    window.Clinic.storage.setJSON(notesKey, notesStore);
  }

  // 2. Safely patch the canonical appointment in Clinic.APPOINTMENTS (preserves dateISO & 24h time!)
  if (window.Clinic && window.Clinic.app && window.Clinic.app.updateAppointment) {
    window.Clinic.app.updateAppointment(appt.id, {
      notes: appt.notes,
      phone: appt.phone,
      email: appt.email,
      tasks: appt.tasks
    });
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
    persistAppointmentsToStorage();
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
      const now = new Date();
      state.year = now.getFullYear();
      state.month = now.getMonth();
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
 * Open Modal from Aside "View Full" button or Selected Event card
 */
function openDetailedModalFromSide() {
  const appt = state.selectedAppointment || (state.appointments && state.appointments[0]);
  if (appt) {
    openPatientModal(appt);
  }
}

/**
 * Patient Modal Logic - Dynamically populates and displays patient appointment details
 */
function openPatientModal(apptInput) {
  let appt = apptInput;
  if (!appt && state.selectedAppointment) {
    appt = state.selectedAppointment;
  }

  if (!appt) return;

  // 1. Patient Information
  const nameEl = document.getElementById('modal-patient-name');
  const dobEl = document.getElementById('modal-patient-dob');
  const genderEl = document.getElementById('modal-patient-gender');
  const idEl = document.getElementById('modal-patient-id');

  if (nameEl) nameEl.textContent = (appt.fullNameUpper || appt.patientName || '').toUpperCase();
  if (dobEl) dobEl.textContent = appt.dob || '18 MAY 1988 (36 Years)';
  if (genderEl) genderEl.textContent = appt.gender || 'Female';
  if (idEl) idEl.textContent = appt.patientId || 'BRIEF-414301';

  // 2. Appointment Specs
  const apptIdEl = document.getElementById('modal-appt-id');
  const statusBadge = document.getElementById('modal-status-badge');
  const timeEl = document.getElementById('modal-time');
  const assignedEl = document.getElementById('modal-assigned-to');
  const reasonEl = document.getElementById('modal-reason');

  if (apptIdEl) apptIdEl.textContent = appt.appointmentId || 'APT-783421';
  if (timeEl) timeEl.textContent = appt.fullDateTime || `${appt.day || 23} ${MONTH_NAMES[appt.month || state.month]?.substring(0, 3).toUpperCase() || 'SEP'} ${appt.year || state.year}, ${appt.time}`;
  if (assignedEl) assignedEl.textContent = appt.assignedTo || 'DR. ZAR (Room 2)';
  if (reasonEl) reasonEl.textContent = appt.reason || appt.treatment || 'Follow-up Consultation & Vital Check';

  if (statusBadge) {
    const st = appt.status || 'Completed';
    statusBadge.textContent = st;
    if (st === 'In Consultation') {
      statusBadge.className = 'bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block';
    } else if (st === 'Completed') {
      statusBadge.className = 'bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block';
    } else if (st === 'Waiting') {
      statusBadge.className = 'bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block';
    } else if (st === 'Canceled') {
      statusBadge.className = 'bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block';
    } else {
      statusBadge.className = 'bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-block';
    }
  }

  // 3. Contact & Editable Clinical Notes Inputs
  const phoneInput = document.getElementById('modal-edit-phone');
  const emailInput = document.getElementById('modal-edit-email');
  const notesInput = document.getElementById('modal-edit-notes');
  const updatedEl = document.getElementById('modal-last-updated');

  if (phoneInput) phoneInput.value = appt.phone || '';
  if (emailInput) emailInput.value = appt.email || '';
  if (notesInput) notesInput.value = appt.notes || '';
  if (updatedEl) updatedEl.textContent = appt.lastUpdated || `Last updated: Today, 11:45 AM`;

  // Update modal allergy alert banner
  const allergy = getPatientAllergy(appt);
  const modalAllergyAlert = document.getElementById('modal-allergy-alert');
  const modalAllergyText = document.getElementById('modal-allergy-text');
  if (modalAllergyAlert && modalAllergyText) {
    if (allergy) {
      modalAllergyText.textContent = `Patient has documented allergy: ${allergy}`;
      modalAllergyAlert.classList.remove('hidden');
    } else {
      modalAllergyAlert.classList.add('hidden');
    }
  }

  // Display modal
  const modal = document.getElementById('patient-modal');
  if (modal) {
    modal.classList.remove('hidden');
    // Hide popover if open
    const popover = document.getElementById('calendar-hover-popover');
    if (popover) {
      popover.classList.add('opacity-0', 'hidden');
    }
  }
}

function closePatientModal() {
  const modal = document.getElementById('patient-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Overflow Day Modal for cells with >2 appointments
 */
function attachDayOverflowEvents() {
  document.querySelectorAll('.day-overflow-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateStr = btn.getAttribute('data-date');
      openDayOverflowModal(dateStr);
    });
  });
}

function openDayOverflowModal(dateStr) {
  const modal = document.getElementById('day-overflow-modal');
  const title = document.getElementById('day-overflow-title');
  const list = document.getElementById('day-overflow-list');
  if (!modal || !list) return;

  const appts = state.appointments.filter(a => a.date === dateStr);
  if (title) {
    title.textContent = `Appointments on ${dateStr} (${appts.length} patients)`;
  }

  list.innerHTML = '';
  if (appts.length === 0) {
    list.innerHTML = '<div class="text-xs text-slate-400 text-center py-4">No appointments scheduled</div>';
  } else {
    appts.forEach(appt => {
      const item = document.createElement('div');
      item.className = 'p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex items-center justify-between';
      item.innerHTML = `
        <div>
          <div class="font-bold text-xs text-slate-900">${escapeHtml(appt.patientName)}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(appt.treatment || appt.reason)} • <span class="font-semibold text-slate-700">${escapeHtml(appt.timeSlot || appt.time)}</span></div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">${escapeHtml(appt.status)}</span>
      `;
      item.addEventListener('click', () => {
        closeDayOverflowModal();
        state.selectedAppointment = appt;
        renderSideDetails(appt);
        openPatientModal(appt);
      });
      list.appendChild(item);
    });
  }

  modal.classList.remove('hidden');
}

function closeDayOverflowModal() {
  const modal = document.getElementById('day-overflow-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Dedicated Prescription Pad Modal Logic
 */
function printPrescription() {
  const appt = state.selectedAppointment || (state.appointments && state.appointments[0]);
  if (!appt) return;

  const rxModal = document.getElementById('prescriptionModal');
  if (!rxModal) {
    showAlertAction('Preparing prescription document...');
    setTimeout(() => window.print(), 600);
    return;
  }

  const rxNum = document.getElementById('rx-number');
  const rxDate = document.getElementById('rx-date');
  const rxPatient = document.getElementById('rx-patient-name');
  const rxInfo = document.getElementById('rx-patient-info');
  const rxPhone = document.getElementById('rx-patient-phone');
  const rxAllergyBox = document.getElementById('rx-allergy-box');
  const rxAllergyName = document.getElementById('rx-allergy-name');

  const now = new Date();
  if (rxNum) rxNum.textContent = `RX-${appt.year || now.getFullYear()}-${String(appt.id).replace(/\D/g, '').padStart(4, '0') || '0923'}`;
  if (rxDate) rxDate.textContent = `Date: ${appt.date || now.toLocaleDateString('en-GB')}`;
  if (rxPatient) rxPatient.textContent = appt.patientName;
  if (rxInfo) rxInfo.textContent = `DOB: ${appt.dob || '18 MAY 1988 (36y)'} • ${appt.gender || 'Female'}`;
  if (rxPhone) rxPhone.textContent = `Tel: ${appt.phone || '+60 14-264 8460'}`;

  const allergy = getPatientAllergy(appt);
  if (rxAllergyBox && rxAllergyName) {
    if (allergy) {
      rxAllergyName.textContent = allergy;
      rxAllergyBox.classList.remove('hidden');
    } else {
      rxAllergyBox.classList.add('hidden');
    }
  }

  rxModal.classList.remove('hidden');
}

function closePrescriptionModal() {
  const modal = document.getElementById('prescriptionModal');
  if (modal) modal.classList.add('hidden');
}

function savePatientModalChanges() {
  if (state.selectedAppointment) {
    const phoneInput = document.getElementById('modal-edit-phone');
    const emailInput = document.getElementById('modal-edit-email');
    const notesInput = document.getElementById('modal-edit-notes');

    if (phoneInput) state.selectedAppointment.phone = phoneInput.value;
    if (emailInput) state.selectedAppointment.email = emailInput.value;
    if (notesInput) state.selectedAppointment.notes = notesInput.value;

    state.selectedAppointment.lastUpdated = `Last updated: Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    renderSideDetails(state.selectedAppointment);
    persistAppointmentsToStorage();
  }

  showAlertAction('Patient record & post-treatment notes updated successfully!');
  closePatientModal();
}

function saveSideChanges() {
  persistAppointmentsToStorage();
  showAlertAction('Clinical record & post-treatment notes saved successfully!');
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

// Close modal when clicking backdrop or pressing Escape
window.onclick = function (event) {
  const pModal = document.getElementById('patient-modal');
  const dModal = document.getElementById('day-overflow-modal');
  const rxModal = document.getElementById('prescriptionModal');

  if (event.target === pModal) closePatientModal();
  if (event.target === dModal) closeDayOverflowModal();
  if (event.target === rxModal) closePrescriptionModal();
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePatientModal();
    closeDayOverflowModal();
    closePrescriptionModal();
  }
});