/**
 * Past Records Management
 * Klinik Pergigian Sofea Taman Tas
 * 
 * Binds directly to Clinic.APPOINTMENTS with sorting, date range filtering,
 * pagination (10/page), and CSV spreadsheet export.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Authentication & Role Check
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
    if (window.Clinic.app.enforceRole && !window.Clinic.app.enforceRole(['dentist', 'admin'])) return;
  }

  const backBtn = document.getElementById('backToIndex');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  initPastRecords();
});

let state = {
  searchQuery: '',
  statusFilter: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'date',
  sortAsc: false, // Default: newest first
  currentPage: 1,
  pageSize: 10
};

function escapeHtml(str) {
  if (window.Clinic && window.Clinic.app && window.Clinic.app.escapeHtml) {
    return window.Clinic.app.escapeHtml(str);
  }
  return String(str || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function getStoredClinicalNotes() {
  if (!window.Clinic || !window.Clinic.storage) return {};
  return window.Clinic.storage.getJSON('kpst.v1.clinical_notes') || {};
}

function loadAllPastRecords() {
  const appts = (window.Clinic && window.Clinic.APPOINTMENTS) ? window.Clinic.APPOINTMENTS : [];
  const storedNotes = getStoredClinicalNotes();
  const today = window.Clinic && window.Clinic.utils ? window.Clinic.utils.todayDate() : new Date();
  const todayISO = window.Clinic && window.Clinic.utils ? window.Clinic.utils.toDateISO(today) : today.toISOString().split('T')[0];

  return appts.filter(a => {
    const st = (a.statusPill || '').toLowerCase();
    // Include completed, canceled, or past appointments
    return st === 'completed' || st === 'canceled' || st === 'cancelled' || (a.dateISO && a.dateISO < todayISO);
  }).map(a => {
    const notePatch = storedNotes[a.id] || {};
    const treatmentName = a.details || (window.Clinic.TREATMENTS && window.Clinic.TREATMENTS[a.treatmentId]?.name) || a.treatmentId || 'Consultation';
    const statusNormalized = (a.statusPill === 'Canceled' || a.statusPill === 'Cancelled') ? 'cancelled' : 'completed';

    return {
      id: a.id,
      date: a.dateISO || '2024-09-23',
      time: a.time ? (window.Clinic.utils ? window.Clinic.utils.formatTime12h(a.time) : a.time) : '09:00 AM',
      rawTime: a.time || '09:00',
      patientName: a.patientName || 'Unknown Patient',
      phone: notePatch.phone || a.phone || '+60 12-345 6789',
      treatment: treatmentName,
      notes: notePatch.notes || a.notes || 'Routine consultation recorded.',
      status: statusNormalized,
      statusDisplay: (statusNormalized === 'cancelled') ? 'Cancelled' : 'Completed'
    };
  });
}

function filterAndSortRecords(allRecords) {
  let records = allRecords.filter(rec => {
    // 1. Text Search
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const match = rec.patientName.toLowerCase().includes(q) ||
                    rec.phone.toLowerCase().includes(q) ||
                    rec.treatment.toLowerCase().includes(q) ||
                    rec.notes.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Status Filter
    if (state.statusFilter !== 'all') {
      if (rec.status !== state.statusFilter) return false;
    }

    // 3. Date Range Filter
    if (state.startDate && rec.date < state.startDate) return false;
    if (state.endDate && rec.date > state.endDate) return false;

    return true;
  });

  // Sorting
  records.sort((a, b) => {
    let valA = a[state.sortBy];
    let valB = b[state.sortBy];

    if (state.sortBy === 'date') {
      valA = a.date + ' ' + (a.rawTime || '');
      valB = b.date + ' ' + (b.rawTime || '');
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return state.sortAsc ? -1 : 1;
    if (valA > valB) return state.sortAsc ? 1 : -1;
    return 0;
  });

  return records;
}

function renderTable() {
  const allRecords = loadAllPastRecords();
  const filtered = filterAndSortRecords(allRecords);
  const tbody = document.getElementById('recordsTableBody');
  const summaryEl = document.getElementById('paginationSummary');
  const paginationControls = document.getElementById('paginationControls');

  if (!tbody) return;

  const total = filtered.length;
  const totalPages = Math.ceil(total / state.pageSize) || 1;
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIdx = (state.currentPage - 1) * state.pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + state.pageSize);

  tbody.innerHTML = '';

  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-xs text-slate-400">
          <i class="fa-solid fa-folder-open text-2xl text-slate-300 mb-2 block"></i>
          No clinical records match your current filter criteria.
        </td>
      </tr>
    `;
  } else {
    pageItems.forEach(rec => {
      const isCompleted = rec.status === 'completed';
      const statusBadge = isCompleted
        ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> COMPLETED</span>`
        : `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark"></i> CANCELLED</span>`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/70 transition cursor-default';
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700 font-mono">${escapeHtml(rec.date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">${escapeHtml(rec.time)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-xs font-bold text-slate-900 uppercase tracking-wide">${escapeHtml(rec.patientName)}</div>
          <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-phone text-[9px] mr-1 text-slate-400"></i>${escapeHtml(rec.phone)}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">${escapeHtml(rec.treatment)}</span>
        </td>
        <td class="px-6 py-4 text-xs text-slate-600 max-w-[260px] truncate" title="${escapeHtml(rec.notes)}">
          ${escapeHtml(rec.notes)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right">
          ${statusBadge}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Update Summary
  if (summaryEl) {
    if (total === 0) {
      summaryEl.textContent = 'Showing 0 of 0 records';
    } else {
      const displayEnd = Math.min(startIdx + state.pageSize, total);
      summaryEl.textContent = `Showing ${startIdx + 1} to ${displayEnd} of ${total} records`;
    }
  }

  // Render Pagination Controls
  if (paginationControls) {
    paginationControls.innerHTML = '';
    if (totalPages > 1) {
      // Prev Button
      const prevBtn = document.createElement('button');
      prevBtn.className = `px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold ${state.currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:bg-slate-50 text-slate-700 bg-white'}`;
      prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      prevBtn.disabled = state.currentPage === 1;
      prevBtn.onclick = () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderTable();
        }
      };
      paginationControls.appendChild(prevBtn);

      // Page numbers (up to 5 buttons)
      for (let p = 1; p <= totalPages; p++) {
        if (totalPages > 5 && Math.abs(p - state.currentPage) > 2 && p !== 1 && p !== totalPages) {
          continue;
        }
        const pBtn = document.createElement('button');
        const isActive = p === state.currentPage;
        pBtn.className = `px-3 py-1 rounded text-xs font-semibold border ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`;
        pBtn.textContent = p;
        pBtn.onclick = () => {
          state.currentPage = p;
          renderTable();
        };
        paginationControls.appendChild(pBtn);
      }

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = `px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold ${state.currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:bg-slate-50 text-slate-700 bg-white'}`;
      nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      nextBtn.disabled = state.currentPage === totalPages;
      nextBtn.onclick = () => {
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderTable();
        }
      };
      paginationControls.appendChild(nextBtn);
    }
  }

  updateSortIcons();
}

function updateSortIcons() {
  const cols = ['date', 'time', 'name', 'treatment', 'status'];
  cols.forEach(col => {
    const icon = document.getElementById(`sortIcon-${col}`);
    if (!icon) return;
    if (state.sortBy === col) {
      icon.className = state.sortAsc ? 'fa-solid fa-sort-up text-blue-600 ml-1' : 'fa-solid fa-sort-down text-blue-600 ml-1';
    } else {
      icon.className = 'fa-solid fa-sort text-slate-300 ml-1';
    }
  });
}

function exportRecordsToCsv() {
  const allRecords = loadAllPastRecords();
  const filtered = filterAndSortRecords(allRecords);

  if (filtered.length === 0) {
    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      window.Clinic.app.showToast('No Records', 'There are no records matching your criteria to export.', 'info');
    }
    return;
  }

  const headers = ['Record ID', 'Date', 'Time', 'Patient Name', 'Phone', 'Treatment', 'Status', 'Clinical Notes'];
  const rows = filtered.map(r => [
    r.id,
    r.date,
    r.time,
    r.patientName,
    r.phone,
    r.treatment,
    r.statusDisplay,
    r.notes.replace(/"/g, '""')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${String(val || '').trim()}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadLink.href = url;
  downloadLink.setAttribute('download', `Klinik_Sofea_Past_Records_${dateStr}.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
    window.Clinic.app.showToast('CSV Export Ready', `Exported ${filtered.length} past records to CSV spreadsheet.`, 'success');
  }
}

function initPastRecords() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      renderTable();
    });
  }

  // Status Filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      renderTable();
    });
  }

  // Date Range Filters
  const startFilter = document.getElementById('startDateFilter');
  const endFilter = document.getElementById('endDateFilter');

  if (startFilter) {
    startFilter.addEventListener('change', (e) => {
      state.startDate = e.target.value;
      state.currentPage = 1;
      renderTable();
    });
  }

  if (endFilter) {
    endFilter.addEventListener('change', (e) => {
      state.endDate = e.target.value;
      state.currentPage = 1;
      renderTable();
    });
  }

  // CSV Export Button
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportRecordsToCsv);
  }

  // Sortable Headers
  document.querySelectorAll('.sort-col').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (state.sortBy === field) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortBy = field;
        state.sortAsc = true;
      }
      renderTable();
    });
  });

  renderTable();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
}
