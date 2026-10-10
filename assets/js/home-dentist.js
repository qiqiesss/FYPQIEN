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