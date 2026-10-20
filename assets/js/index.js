document.addEventListener('DOMContentLoaded', function () {
  let selectedRole = sessionStorage.getItem('selectedRole') || 'admin';

  const roleBtns = document.querySelectorAll('.role-btn');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');

  function applyRoleUI(role) {
    selectedRole = role;
    sessionStorage.setItem('selectedRole', role);

    roleBtns.forEach(b => {
      if (b.getAttribute('data-role') === role) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (role === 'admin') {
      usernameInput.value = 'admin';
      passwordInput.value = 'admin123';
    } else {
      usernameInput.value = 'drzar';
      passwordInput.value = 'doctor123';
    }

    if (loginError) loginError.classList.add('d-none');
  }

  // Set initial role state
  applyRoleUI(selectedRole);

  roleBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const role = this.getAttribute('data-role');
      applyRoleUI(role);
    });
  });

  // Form submission logic with strict credential validation
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (loginError) loginError.classList.add('d-none');

    if (selectedRole === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        if (window.Clinic && window.Clinic.app && window.Clinic.app.setRole) {
          window.Clinic.app.setRole('admin');
        }
        window.location.href = 'front-desk.html';
      } else {
        showError('Invalid Admin credentials. Please check your username and password.');
      }
    } else if (selectedRole === 'dentist') {
      if ((username === 'drzar' || username === 'doctor') && password === 'doctor123') {
        if (window.Clinic && window.Clinic.app && window.Clinic.app.setRole) {
          window.Clinic.app.setRole('dentist');
        }
        window.location.href = 'home-dentist.html';
      } else {
        showError('Invalid Dentist credentials. Please check your username and password.');
      }
    }
  });

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.classList.remove('d-none');
    }
  }
});
