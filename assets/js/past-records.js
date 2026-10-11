document.addEventListener('DOMContentLoaded', () => {
      // Mock past records data
      const mockRecords = [
        { date: '2023-10-24', time: '09:00 AM', name: 'Ahmad bin Abu', phone: '012-345 6789', treatment: 'Scaling', notes: 'Routine checkup, mild plaque', status: 'completed' },
        { date: '2023-10-24', time: '10:30 AM', name: 'Siti Nurhaliza', phone: '019-876 5432', treatment: 'Braces Adjustment', notes: 'Changed power chain to blue', status: 'completed' },
        { date: '2023-10-23', time: '02:00 PM', name: 'Chong Wei', phone: '016-111 2222', treatment: 'Extraction', notes: 'Upper left wisdom tooth', status: 'completed' },
        { date: '2023-10-23', time: '04:00 PM', name: 'Muthu Kumar', phone: '017-333 4444', treatment: 'Scaling', notes: 'Patient no-show', status: 'cancelled' },
        { date: '2023-10-20', time: '11:00 AM', name: 'Nur Aisyah', phone: '013-555 6666', treatment: 'Braces Adjustment', notes: 'Requested delay by 1 week', status: 'cancelled' },
        { date: '2023-10-18', time: '03:30 PM', name: 'Farid Kamil', phone: '018-999 0000', treatment: 'Filling', notes: 'Composite filling lower right', status: 'completed' }
      ];

      const tbody = document.getElementById('recordsTableBody');

      function renderRecords(records) {
        tbody.innerHTML = '';
        records.forEach(rec => {
          const statusBadge = rec.status === 'completed'
            ? '<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-check"></i> COMPLETED</span>'
            : '<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark"></i> CANCELLED</span>';

          const tr = document.createElement('tr');
          tr.className = 'hover:bg-slate-50/50 transition cursor-default';
          tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">${rec.date}</td>
            <td class="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">${rec.time}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-xs font-bold text-slate-800 uppercase tracking-wide">${rec.name}</div>
              <div class="text-[11px] text-slate-500 mt-0.5"><i class="fa-solid fa-phone text-[9px] mr-1"></i>${rec.phone}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-xs font-bold text-slate-700">${rec.treatment}</span>
            </td>
            <td class="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate" title="${rec.notes || '-'}">
              ${rec.notes || '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              ${statusBadge}
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      renderRecords(mockRecords);

      // Centralized filter function
      function applyFilters() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const statusVal = document.getElementById('statusFilter').value;
        const dateVal = document.getElementById('dateFilter').value; // 'YYYY-MM-DD'

        const filtered = mockRecords.filter(r => {
          const matchQuery = r.name.toLowerCase().includes(query) ||
            r.phone.includes(query) ||
            r.treatment.toLowerCase().includes(query);
          const matchStatus = statusVal === 'all' || r.status === statusVal;
          const matchDate = !dateVal || r.date === dateVal;

          return matchQuery && matchStatus && matchDate;
        });

        renderRecords(filtered);
      }

      document.getElementById('searchInput').addEventListener('input', applyFilters);
      document.getElementById('statusFilter').addEventListener('change', applyFilters);
      document.getElementById('dateFilter').addEventListener('change', applyFilters);

      // Simple auth check similar to dentist.js
      if (Clinic.app && Clinic.app.getCurrentRole) {
        const role = Clinic.app.getCurrentRole();
        if (role !== 'dentist' && role !== 'admin') {
          document.getElementById('dentistView').classList.add('hidden');
          document.getElementById('accessDenied').classList.remove('hidden');
        }
      }
    });

    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const hamburgerContainer = document.getElementById('hamburger-container');
      const hamburgerBtn = document.getElementById('hamburger-btn');

      if (sidebar) {
        sidebar.classList.toggle('-ml-14');
        sidebar.classList.toggle('opacity-0');

        if (hamburgerContainer && hamburgerBtn) {
          hamburgerContainer.classList.toggle('bg-slate-900');
          hamburgerContainer.classList.toggle('bg-white');
          hamburgerContainer.classList.toggle('border-transparent');
          hamburgerContainer.classList.toggle('border-slate-200');

          hamburgerBtn.classList.toggle('text-slate-400');
          hamburgerBtn.classList.toggle('hover:text-white');

          hamburgerBtn.classList.toggle('text-slate-600');
          hamburgerBtn.classList.toggle('hover:text-slate-900');
        }
      }
    }