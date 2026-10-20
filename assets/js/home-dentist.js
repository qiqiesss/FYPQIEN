/**
 * Dentist Dashboard - Dynamic Real-time Queue & Consultation Progression
 * Klinik Pergigian Sofea Taman Tas
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
    if (window.Clinic.app.enforceRole && !window.Clinic.app.enforceRole(['dentist'])) return;
  }

  initDentistDashboard();
});

let searchQuery = '';

function escapeHtml(str) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.escapeHtml) {
    return window.Clinic.app.escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function getTodayAppointmentsForDoctor() {
  if (!window.Clinic || !window.Clinic.APPOINTMENTS) return [];

  const today = window.Clinic.utils ? window.Clinic.utils.todayDate() : new Date();
  const todayISO = window.Clinic.utils ? window.Clinic.utils.toDateISO(today) : today.toISOString().split('T')[0];

  // Primary doctor view: Dr. Zar ('DZ')
  // We include appointments assigned to DZ for today
  return window.Clinic.APPOINTMENTS.filter(a => {
    return a.dateISO === todayISO && (a.dentistInitials === 'DZ' || !a.dentistInitials);
  });
}

function renderDashboard() {
  const allToday = getTodayAppointmentsForDoctor();

  // Filter by search query if typed
  const appts = allToday.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (a.patientName || '').toLowerCase();
    const details = (a.details || a.treatmentId || '').toLowerCase();
    const phone = (a.phone || '').toLowerCase();
    return name.includes(q) || details.includes(q) || phone.includes(q);
  });

  const completed = allToday.filter(a => a.statusPill === 'Completed');
  const pending = allToday.filter(a => a.statusPill !== 'Completed' && a.statusPill !== 'Canceled');
  const inConsult = allToday.find(a => a.statusPill === 'In Consultation');

  // Update Stat Counters
  const statTotal = document.getElementById('statTotalPatients');
  const statCompleted = document.getElementById('statCompletedPatients');
  const statPending = document.getElementById('statPendingPatients');

  if (statTotal) statTotal.textContent = allToday.length;
  if (statCompleted) statCompleted.textContent = completed.length;
  if (statPending) statPending.textContent = pending.length;

  // Update Active Consultation Banner
  const activeCard = document.getElementById('activeConsultationCard');
  const activeName = document.getElementById('activePatientName');
  const activeDetail = document.getElementById('activePatientDetail');
  const activeBtnFinish = document.getElementById('btnFinishActiveConsultation');

  if (activeCard) {
    if (inConsult) {
      activeCard.classList.remove('hidden');
      if (activeName) activeName.textContent = inConsult.patientName;
      if (activeDetail) activeDetail.textContent = `${inConsult.details || inConsult.treatmentId} • Room 2 • ${window.Clinic.utils ? window.Clinic.utils.formatTime12h(inConsult.time) : inConsult.time}`;
      if (activeBtnFinish) {
        activeBtnFinish.onclick = () => updatePatientStatus(inConsult.id, 'Completed');
      }
    } else {
      activeCard.classList.add('hidden');
    }
  }

  // Update Pending Queue
  const pendingList = document.getElementById('pendingQueueList');
  const pendingBadge = document.getElementById('pendingBadge');
  const visiblePending = appts.filter(a => a.statusPill !== 'Completed' && a.statusPill !== 'Canceled');

  if (pendingBadge) {
    pendingBadge.textContent = `${pending.length} WAITING`;
  }

  if (pendingList) {
    pendingList.innerHTML = '';
    if (visiblePending.length === 0) {
      pendingList.innerHTML = `<li class="p-6 text-center text-xs text-slate-400">No pending patients in queue</li>`;
    } else {
      visiblePending.forEach(appt => {
        const isInConsult = appt.statusPill === 'In Consultation';
        const timeDisplay = window.Clinic.utils ? window.Clinic.utils.formatTime12h(appt.time) : appt.time;
        const treatmentName = appt.details || (window.Clinic.TREATMENTS && window.Clinic.TREATMENTS[appt.treatmentId]?.name) || appt.treatmentId || 'Consultation';

        const li = document.createElement('li');
        li.className = 'p-4 hover:bg-slate-50 transition cursor-default flex items-center justify-between';
        li.innerHTML = `
          <div class="flex-1 min-w-0 pr-3">
            <div class="flex items-center gap-2">
              <p class="font-bold text-sm text-slate-800 uppercase tracking-wide truncate mb-0">${escapeHtml(appt.patientName)}</p>
              ${isInConsult ? `<span class="inline-flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> IN ROOM</span>` : ''}
            </div>
            <p class="text-xs font-medium text-slate-500 mt-0.5 truncate">${escapeHtml(treatmentName)}</p>
          </div>
          <div class="text-right shrink-0 flex items-center gap-3">
            <div class="text-right">
              <span class="text-xs font-bold text-slate-700 block">${timeDisplay}</span>
              <span class="text-[10px] ${isInConsult ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'} font-bold px-2 py-0.5 rounded border mt-1 inline-block">${isInConsult ? 'IN SESSION' : 'WAITING'}</span>
            </div>
            <div class="flex items-center gap-1.5">
              ${isInConsult ? `
                <button class="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs flex items-center gap-1 btn-complete-appt" data-id="${appt.id}" title="Mark procedure completed">
                  <i class="fa-solid fa-check"></i> Done
                </button>
              ` : `
                <button class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1 btn-call-appt" data-id="${appt.id}" title="Call patient into consultation room">
                  <i class="fa-solid fa-bell"></i> Call In
                </button>
              `}
              <a href="dentist.html" class="p-1.5 text-slate-400 hover:text-blue-600 transition" title="Open patient chart & calendar">
                <i class="fa-solid fa-calendar-check"></i>
              </a>
            </div>
          </div>
        `;
        pendingList.appendChild(li);
      });
    }
  }

  // Update Completed Queue
  const completedList = document.getElementById('completedQueueList');
  const completedBadge = document.getElementById('completedBadge');
  const visibleCompleted = appts.filter(a => a.statusPill === 'Completed');

  if (completedBadge) {
    completedBadge.textContent = `${completed.length} DONE`;
  }

  if (completedList) {
    completedList.innerHTML = '';
    if (visibleCompleted.length === 0) {
      completedList.innerHTML = `<li class="p-6 text-center text-xs text-slate-400">No completed procedures recorded yet today</li>`;
    } else {
      visibleCompleted.forEach(appt => {
        const timeDisplay = window.Clinic.utils ? window.Clinic.utils.formatTime12h(appt.time) : appt.time;
        const treatmentName = appt.details || (window.Clinic.TREATMENTS && window.Clinic.TREATMENTS[appt.treatmentId]?.name) || appt.treatmentId || 'Consultation';

        const li = document.createElement('li');
        li.className = 'p-4 hover:bg-slate-50 transition cursor-default flex items-center justify-between';
        li.innerHTML = `
          <div class="flex-1 min-w-0 pr-3">
            <p class="font-bold text-sm text-slate-800 uppercase tracking-wide truncate mb-0">${escapeHtml(appt.patientName)}</p>
            <p class="text-xs font-medium text-slate-500 mt-0.5 truncate">${escapeHtml(treatmentName)}</p>
            ${appt.notes ? `<p class="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-sm"><i class="fa-regular fa-note-sticky me-1"></i>${escapeHtml(appt.notes)}</p>` : ''}
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-bold text-slate-700 block">${timeDisplay}</span>
            <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">COMPLETED</span>
          </div>
        `;
        completedList.appendChild(li);
      });
    }
  }

  bindActionButtons();
}

function bindActionButtons() {
  document.querySelectorAll('.btn-call-appt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updatePatientStatus(id, 'In Consultation');
    });
  });

  document.querySelectorAll('.btn-complete-appt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updatePatientStatus(id, 'Completed');
    });
  });
}

function updatePatientStatus(apptId, newStatus) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.updateAppointment) {
    window.Clinic.app.updateAppointment(apptId, { statusPill: newStatus });
  } else if (window.Clinic && window.Clinic.APPOINTMENTS) {
    const appt = window.Clinic.APPOINTMENTS.find(a => a.id === apptId);
    if (appt) appt.statusPill = newStatus;
  }

  renderDashboard();

  if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
    const title = newStatus === 'In Consultation' ? 'Patient Called In' : 'Consultation Completed';
    const msg = newStatus === 'In Consultation' ? 'Patient status updated to In Consultation (Room 2).' : 'Appointment marked as Completed. Clinical records synced.';
    window.Clinic.app.showToast(title, msg, 'success');
  }
}

function initDentistDashboard() {
  // Set readable date in header
  const headerDateText = document.getElementById('headerDateText');
  if (headerDateText) {
    const today = window.Clinic.utils ? window.Clinic.utils.todayDate() : new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    headerDateText.textContent = `Here is your daily clinical overview for ${today.toLocaleDateString('en-US', options)}.`;
  }

  // Search Input Handler
  const searchInput = document.getElementById('patientSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderDashboard();
    });
  }

  renderDashboard();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}
