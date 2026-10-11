document.addEventListener('DOMContentLoaded', function () {
      //Retrieve saved role from sessionStorage default to 'admin' if none exists
      let selectedRole = sessionStorage.getItem('selectedRole') || 'admin';

      // Role toggle logic
      const roleBtns = document.querySelectorAll('.role-btn');
      const usernameInput = document.getElementById('usernameInput');

      //Set initial active button and username based on saved session state
      roleBtns.forEach(b => {
        if (b.getAttribute('data-role') === selectedRole) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      if (selectedRole === 'admin') {
        usernameInput.value = 'Admin';
      } else {
        usernameInput.value = 'DrZar';
      }

      roleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
          // Update active state
          roleBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          // Update selected role
          selectedRole = this.getAttribute('data-role');

          //Save choice to session storage so it persists on refresh
          sessionStorage.setItem('selectedRole', selectedRole);

          // Autofill mock credentials based on role
          if (selectedRole === 'admin') {
            usernameInput.value = 'Admin';
          } else {
            usernameInput.value = 'DrZar';
          }
        });
      });

      // Form submission logic
      const loginForm = document.getElementById('loginForm');
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = usernameInput.value;
        const password = document.getElementById('passwordInput').value;

        if (username && password) {
          if (selectedRole === 'admin') {
            Clinic.app.setRole('admin');
            window.location.href = 'front-desk.html';
          } else if (selectedRole === 'dentist') {
            Clinic.app.setRole('dentist');
            window.location.href = 'home-dentist.html';
          }
        }
      });
    });