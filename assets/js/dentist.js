function openPatientModal(name, id, phone, time, status) {
      document.getElementById('modal-patient-name').innerText = name;
      document.getElementById('modal-patient-id').innerText = id;
      document.getElementById('modal-phone').innerText = phone;
      document.getElementById('modal-time').innerText = '23 SEP 2024, ' + time;

      const badge = document.getElementById('modal-status-badge');
      badge.innerText = status;
      if (status === 'In Consultation') {
        badge.className = 'bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold text-[10px]';
      } else if (status === 'Completed') {
        badge.className = 'bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
      } else if (status === 'Waiting') {
        badge.className = 'bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
      } else {
        badge.className = 'bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-[10px]';
      }

      document.getElementById('patient-modal').classList.remove('hidden');
    }

    function closePatientModal() {
      document.getElementById('patient-modal').classList.add('hidden');
    }

    function addNewAppointment() {
      showAlertAction('Opening New Appointment wizard for Dr. Zar...');
    }

    function showAlertAction(msg) {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs z-50 transition-all duration-300 border border-slate-700';
      notification.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>' + msg;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    window.onclick = function (event) {
      const modal = document.getElementById('patient-modal');
      if (event.target === modal) {
        closePatientModal();
      }
    }

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