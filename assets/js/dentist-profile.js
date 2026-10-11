document.addEventListener('DOMContentLoaded', function () {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
  }

  /* ------------------------------------------------------------------ *
   * Phase 2: Dentist Profile Avatar Staging & Storage Lifecycle
   * ------------------------------------------------------------------ */
  const AVATAR_STORAGE_KEY = 'dentist_avatar';
  const DEFAULT_AVATAR = 'assets/images/default-profile.jpg';

  const profileImage = document.getElementById('profileImageBorder');
  const imageUpload = document.getElementById('profileImageUpload');
  const uploadOverlay = document.getElementById('profileImageUploadLabel');
  const deleteBadgeBtn = document.getElementById('deleteAvatarBadgeBtn');
  const editBtn = document.getElementById('editProfileBtn');
  const cancelBtn = document.getElementById('cancelEditProfileBtn');

  // Internal staging flag: null = untouched, 'default' = staged delete, or base64Data = staged upload
  let pendingAvatar = null;
  let isEditing = false;
  let initialFormValues = [];
  let initialAvatarSrc = DEFAULT_AVATAR;

  // Helper: Show toast notification using Clinic toast system
  function notify(title, message, type) {
    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      window.Clinic.app.showToast(title, message, type);
    }
  }

  // 1. On Page Load: Reads localStorage.getItem('dentist_avatar'). If null, display default-profile.jpg
  function loadAvatar() {
    if (!profileImage) return;

    try {
      const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedAvatar) {
        profileImage.src = savedAvatar;
      } else {
        profileImage.src = DEFAULT_AVATAR;
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
      profileImage.src = DEFAULT_AVATAR;
    }

    // Safety fallback if image file fails to load
    profileImage.onerror = function () {
      if (!this.src.includes('default-profile.jpg')) {
        this.src = DEFAULT_AVATAR;
      }
    };
  }

  // Initialize avatar on page load
  loadAvatar();

  // 2. Picture Upload Preview (Temporary staging - does not commit to localStorage yet)
  if (imageUpload && profileImage) {
    imageUpload.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Ensure file is an image
        if (!file.type.startsWith('image/')) {
          notify('Invalid file', 'Please select a valid image file (JPG, PNG, WebP).', 'error');
          return;
        }

        // Limit size to 4MB for localStorage safety
        if (file.size > 4 * 1024 * 1024) {
          notify('File too large', 'Please select an image smaller than 4MB.', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const base64Data = event.target.result;
          // Staging only: preview immediately and set flag
          profileImage.src = base64Data;
          pendingAvatar = base64Data;
          notify('Photo Selected', 'Preview updated. Click "Save Profile" to commit changes.', 'info');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 3. Remove / Delete Photo Action (Temporary staging - resets preview to default)
  if (deleteBadgeBtn) {
    deleteBadgeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Profile picture immediately previews as default-profile.jpg
      if (profileImage) {
        profileImage.src = DEFAULT_AVATAR;
      }

      // Sets internal flag pendingAvatar = 'default'
      pendingAvatar = 'default';

      if (imageUpload) {
        imageUpload.value = '';
      }

      notify('Photo Reset', 'Preview reset to default. Click "Save Profile" to apply.', 'info');
    });
  }

  // 4. Cancel Editing: Revert preview and form inputs to previously saved state
  function cancelEditing() {
    if (!isEditing) return;

    // Revert avatar preview to previously saved state
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (profileImage) {
      profileImage.src = savedAvatar || DEFAULT_AVATAR;
    }

    // Reset staging variables
    pendingAvatar = null;
    if (imageUpload) {
      imageUpload.value = '';
    }

    // Revert form input values
    const inputs = document.querySelectorAll('.profile-form-grid .form-input');
    inputs.forEach((input, index) => {
      if (initialFormValues[index] !== undefined) {
        input.value = initialFormValues[index];
      }
      input.setAttribute('disabled', 'disabled');
      input.classList.remove('editing');
    });

    // Hide edit overlays and cancel button
    if (uploadOverlay) uploadOverlay.classList.add('d-none');
    if (deleteBadgeBtn) deleteBadgeBtn.classList.add('d-none');
    if (cancelBtn) cancelBtn.classList.add('d-none');

    // Revert edit button UI
    if (editBtn) {
      const btnIcon = editBtn.querySelector('i');
      const btnText = editBtn.querySelector('span');
      btnIcon.className = 'fa-solid fa-pen text-slate-400';
      btnText.textContent = 'Edit Profile';
      editBtn.classList.remove('btn-save-profile');
    }

    isEditing = false;
    notify('Cancelled', 'Changes were discarded.', 'cancel');
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      cancelEditing();
    });
  }

  // 5. Edit Profile & Save Profile Handler
  if (editBtn) {
    editBtn.addEventListener('click', function () {
      const inputs = document.querySelectorAll('.profile-form-grid .form-input');
      const btnIcon = this.querySelector('i');
      const btnText = this.querySelector('span');

      if (!isEditing) {
        // --- ENTER EDIT MODE ---
        isEditing = true;

        // Snapshot current form values & avatar for rollback on cancel
        initialFormValues = Array.from(inputs).map(input => input.value);
        initialAvatarSrc = profileImage ? profileImage.src : DEFAULT_AVATAR;
        pendingAvatar = null;

        // Enable inputs
        inputs.forEach(input => {
          input.removeAttribute('disabled');
          input.classList.add('editing');
        });

        // Show camera upload overlay & delete badge button
        if (uploadOverlay) uploadOverlay.classList.remove('d-none');
        if (deleteBadgeBtn) deleteBadgeBtn.classList.remove('d-none');
        if (cancelBtn) cancelBtn.classList.remove('d-none');

        // Update button UI to Save
        btnIcon.className = 'fa-solid fa-floppy-disk text-white';
        btnText.textContent = 'Save Profile';
        this.classList.add('btn-save-profile');

        // Focus first input
        if (inputs[0]) inputs[0].focus();

      } else {
        // --- COMMIT CHANGES ON "SAVE PROFILE" ---

        // Commit avatar changes based on pendingAvatar flag
        if (pendingAvatar === 'default') {
          // Reset to default: remove key from localStorage
          try {
            localStorage.removeItem(AVATAR_STORAGE_KEY);
          } catch (e) {
            console.warn('Could not remove from localStorage:', e);
          }
        } else if (typeof pendingAvatar === 'string' && pendingAvatar.startsWith('data:')) {
          // New image uploaded: commit Base64 data to localStorage
          try {
            localStorage.setItem(AVATAR_STORAGE_KEY, pendingAvatar);
          } catch (e) {
            console.error('Storage quota exceeded:', e);
            notify('Storage Error', 'Could not save image to browser storage.', 'error');
          }
        }

        // Reset staging flag
        pendingAvatar = null;
        if (imageUpload) {
          imageUpload.value = '';
        }

        // Lock form inputs
        inputs.forEach(input => {
          input.setAttribute('disabled', 'disabled');
          input.classList.remove('editing');
        });

        // Hide upload overlay, delete badge button, and cancel button
        if (uploadOverlay) uploadOverlay.classList.add('d-none');
        if (deleteBadgeBtn) deleteBadgeBtn.classList.add('d-none');
        if (cancelBtn) cancelBtn.classList.add('d-none');

        // Update button UI back to Edit
        btnIcon.className = 'fa-solid fa-pen text-slate-400';
        btnText.textContent = 'Edit Profile';
        this.classList.remove('btn-save-profile');

        isEditing = false;

        // Success toast message: "Profile updated successfully!"
        notify('Profile updated successfully!', 'success');
      }
    });
  }
});