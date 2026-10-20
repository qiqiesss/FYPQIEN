document.addEventListener('DOMContentLoaded', function () {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.enforceRole && !window.Clinic.app.enforceRole(['dentist', 'admin'])) return;
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
  }

  const AVATAR_STORAGE_KEY = 'dentist_avatar';
  const PROFILE_STORAGE_KEY = 'kpst.v1.dentist_profile';
  const DEFAULT_AVATAR = 'assets/images/default-profile.jpg';

  const profileImage = document.getElementById('profileImageBorder');
  const imageUpload = document.getElementById('profileImageUpload');
  const uploadOverlay = document.getElementById('profileImageUploadLabel');
  const deleteBadgeBtn = document.getElementById('deleteAvatarBadgeBtn');
  const editBtn = document.getElementById('editProfileBtn');
  const cancelBtn = document.getElementById('cancelEditProfileBtn');

  // Profile text & inputs
  const profileNameEl = document.getElementById('profileName');
  const profileRoleEl = document.getElementById('profileRole');
  const profileDescEl = document.getElementById('profileDescription');

  const inputFullName = document.getElementById('inputFullName');
  const inputAge = document.getElementById('inputAge');
  const inputEmail = document.getElementById('inputEmail');
  const inputPhone = document.getElementById('inputPhone');
  const inputLicense = document.getElementById('inputLicense');
  const inputJoinDate = document.getElementById('inputJoinDate');

  let pendingAvatar = null;
  let isEditing = false;
  let snapshotData = {};

  // Helper: Show toast notification using Clinic toast system
  function notify(title, message, type) {
    if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
      window.Clinic.app.showToast(title, message, type);
    }
  }

  // Downsample image using HTML5 Canvas to max 300x300 JPEG
  function downsampleImage(file, maxSize = 300, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image into canvas'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // 1. Load Profile & Avatar from storage
  function loadProfile() {
    // Avatar
    try {
      const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (profileImage) {
        profileImage.src = savedAvatar || DEFAULT_AVATAR;
      }
    } catch (e) {
      console.warn('Could not read avatar:', e);
      if (profileImage) profileImage.src = DEFAULT_AVATAR;
    }

    if (profileImage) {
      profileImage.onerror = function () {
        if (!this.src.includes('default-profile.jpg')) {
          this.src = DEFAULT_AVATAR;
        }
      };
    }

    // Form fields
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.fullName && inputFullName) inputFullName.value = data.fullName;
        if (data.age && inputAge) inputAge.value = data.age;
        if (data.email && inputEmail) inputEmail.value = data.email;
        if (data.phone && inputPhone) inputPhone.value = data.phone;
        if (data.license && inputLicense) inputLicense.value = data.license;
        if (data.joinDate && inputJoinDate) inputJoinDate.value = data.joinDate;

        if (profileNameEl && (data.displayName || data.fullName)) {
          profileNameEl.textContent = data.displayName || data.fullName;
        }
        if (profileRoleEl && data.role) profileRoleEl.textContent = data.role;
        if (profileDescEl && data.description) profileDescEl.textContent = data.description;
      }
    } catch (e) {
      console.warn('Could not load profile fields:', e);
    }
  }

  loadProfile();

  // 2. Picture Upload Preview with Canvas Downsampling
  if (imageUpload && profileImage) {
    imageUpload.addEventListener('change', async function (e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        if (!file.type.startsWith('image/')) {
          notify('Invalid File', 'Please select an image file (JPG, PNG, WebP).', 'error');
          return;
        }

        try {
          const downscaledBase64 = await downsampleImage(file, 300, 0.85);
          profileImage.src = downscaledBase64;
          pendingAvatar = downscaledBase64;
          notify('Photo Selected', 'Preview updated and optimized (300px). Click "Save Profile" to commit.', 'info');
        } catch (err) {
          console.error('Image compression error:', err);
          notify('Upload Error', 'Could not process the selected image.', 'error');
        }
      }
    });
  }

  // 3. Remove Photo Action
  if (deleteBadgeBtn) {
    deleteBadgeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (profileImage) {
        profileImage.src = DEFAULT_AVATAR;
      }
      pendingAvatar = 'default';

      if (imageUpload) {
        imageUpload.value = '';
      }

      notify('Photo Reset', 'Preview reset to default. Click "Save Profile" to apply.', 'info');
    });
  }

  // 4. Cancel Editing: Revert inputs and avatar
  function cancelEditing() {
    if (!isEditing) return;

    // Revert avatar preview
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (profileImage) {
      profileImage.src = savedAvatar || DEFAULT_AVATAR;
    }
    pendingAvatar = null;
    if (imageUpload) imageUpload.value = '';

    // Revert form fields
    if (snapshotData) {
      if (inputFullName) inputFullName.value = snapshotData.fullName || 'Dr. Zarith Sofia';
      if (inputAge) inputAge.value = snapshotData.age || '34 Years';
      if (inputEmail) inputEmail.value = snapshotData.email || 'dr.zar@kliniksofea.com';
      if (inputPhone) inputPhone.value = snapshotData.phone || '+60 12-345 6789';
      if (inputLicense) inputLicense.value = snapshotData.license || 'MDC-2018-4921';
      if (inputJoinDate) inputJoinDate.value = snapshotData.joinDate || 'October 15, 2019';
    }

    const inputs = document.querySelectorAll('.profile-form-grid .form-input');
    inputs.forEach(input => {
      input.setAttribute('disabled', 'disabled');
      input.classList.remove('editing');
    });

    if (uploadOverlay) uploadOverlay.classList.add('d-none');
    if (deleteBadgeBtn) deleteBadgeBtn.classList.add('d-none');
    if (cancelBtn) cancelBtn.classList.add('d-none');

    if (editBtn) {
      editBtn.innerHTML = '<i class="fa-solid fa-pen text-slate-400"></i> <span>Edit Profile</span>';
      editBtn.classList.remove('btn-save-profile');
    }

    isEditing = false;
    notify('Changes Discarded', 'Profile modifications were cancelled.', 'info');
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

      if (!isEditing) {
        // --- ENTER EDIT MODE ---
        isEditing = true;

        // Snapshot current form values
        snapshotData = {
          fullName: inputFullName ? inputFullName.value : '',
          age: inputAge ? inputAge.value : '',
          email: inputEmail ? inputEmail.value : '',
          phone: inputPhone ? inputPhone.value : '',
          license: inputLicense ? inputLicense.value : '',
          joinDate: inputJoinDate ? inputJoinDate.value : '',
          displayName: profileNameEl ? profileNameEl.textContent : 'Dr. Zar'
        };

        pendingAvatar = null;

        inputs.forEach(input => {
          input.removeAttribute('disabled');
          input.classList.add('editing');
        });

        if (uploadOverlay) uploadOverlay.classList.remove('d-none');
        if (deleteBadgeBtn) deleteBadgeBtn.classList.remove('d-none');
        if (cancelBtn) cancelBtn.classList.remove('d-none');

        editBtn.innerHTML = '<i class="fa-solid fa-floppy-disk text-white"></i> <span>Save Profile</span>';
        editBtn.classList.add('btn-save-profile');

        if (inputFullName) {
          inputFullName.focus();
          inputFullName.select();
        }

      } else {
        // --- COMMIT CHANGES ON "SAVE PROFILE" ---

        // 1. Validate Email and Phone Inputs
        const emailVal = inputEmail ? inputEmail.value.trim() : '';
        const phoneVal = inputPhone ? inputPhone.value.trim() : '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
          notify('Invalid Email', 'Please provide a valid email address (e.g. doctor@kliniksofea.com).', 'error');
          if (inputEmail) inputEmail.focus();
          return;
        }

        const phoneRegex = /^(\+?60|0)[0-9\s-]{8,14}$/;
        if (!phoneVal || !phoneRegex.test(phoneVal)) {
          notify('Invalid Phone', 'Please provide a valid Malaysian phone number (e.g. +60 12-345 6789).', 'error');
          if (inputPhone) inputPhone.focus();
          return;
        }

        // 2. Commit Avatar
        if (pendingAvatar === 'default') {
          try {
            localStorage.removeItem(AVATAR_STORAGE_KEY);
          } catch (e) {
            console.warn(e);
          }
        } else if (typeof pendingAvatar === 'string' && pendingAvatar.startsWith('data:')) {
          try {
            localStorage.setItem(AVATAR_STORAGE_KEY, pendingAvatar);
          } catch (e) {
            console.error('Storage quota exceeded:', e);
            notify('Storage Warning', 'Could not persist avatar image.', 'error');
          }
        }

        // 3. Commit Profile Form Data
        const updatedFullName = inputFullName ? inputFullName.value.trim() : 'Dr. Zarith Sofia';
        const updatedData = {
          fullName: updatedFullName,
          age: inputAge ? inputAge.value.trim() : '34 Years',
          email: emailVal,
          phone: phoneVal,
          license: inputLicense ? inputLicense.value.trim() : 'MDC-2018-4921',
          joinDate: inputJoinDate ? inputJoinDate.value.trim() : 'October 15, 2019',
          displayName: updatedFullName || 'Dr. Zarith Sofia',
          role: profileRoleEl ? profileRoleEl.textContent : 'Dental Specialist',
          description: profileDescEl ? profileDescEl.textContent : ''
        };

        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedData));
        } catch (e) {
          console.error('Failed to save profile:', e);
        }

        if (profileNameEl && updatedData.displayName) {
          profileNameEl.textContent = updatedData.displayName;
        }

        pendingAvatar = null;
        if (imageUpload) imageUpload.value = '';

        // Lock form inputs
        inputs.forEach(input => {
          input.setAttribute('disabled', 'disabled');
          input.classList.remove('editing');
        });

        if (uploadOverlay) uploadOverlay.classList.add('d-none');
        if (deleteBadgeBtn) deleteBadgeBtn.classList.add('d-none');
        if (cancelBtn) cancelBtn.classList.add('d-none');

        editBtn.innerHTML = '<i class="fa-solid fa-pen text-slate-400"></i> <span>Edit Profile</span>';
        editBtn.classList.remove('btn-save-profile');

        isEditing = false;

        notify('Profile Saved', 'Profile details updated and stored successfully.', 'success');
      }
    });
  }
});
