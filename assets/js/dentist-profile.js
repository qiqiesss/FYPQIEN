function toggleLicense(checkbox) {
  const label = document.getElementById("licenseLabelText");
  const badge = document.getElementById("profileLicenseBadge");
  const imgBorder = document.getElementById("profileImageBorder");
  
  if(checkbox.checked) {
    label.textContent = "Active";
    label.classList.replace("text-rose-500", "text-emerald-600");
    badge.classList.replace("bg-rose-500", "bg-emerald-500");
    imgBorder.classList.replace("border-rose-500", "border-emerald-500");
  } else {
    label.textContent = "Inactive";
    label.classList.replace("text-emerald-600", "text-rose-500");
    badge.classList.replace("bg-emerald-500", "bg-rose-500");
    imgBorder.classList.replace("border-emerald-500", "border-rose-500");
  }
}


document.addEventListener('DOMContentLoaded', function () {
  if (window.Clinic && window.Clinic.app) {
    if (window.Clinic.app.initRoleBadge) window.Clinic.app.initRoleBadge();
    if (window.Clinic.app.initLogout) window.Clinic.app.initLogout();
  }

  // Edit Profile Logic
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    let isEditing = false;
    
    editBtn.addEventListener('click', function() {
      isEditing = !isEditing;
      const inputs = document.querySelectorAll('.profile-form-grid .form-input');
      const uploadLabel = document.getElementById('profileImageUploadLabel');
      const btnIcon = this.querySelector('i');
      const btnText = this.querySelector('span');

      if (isEditing) {
        // Enable inputs
        inputs.forEach(input => {
          input.removeAttribute('disabled');
          input.classList.add('editing');
        });
        
        // Show upload overlay
        if(uploadLabel) uploadLabel.classList.remove('d-none');
        
        // Update button UI to Save
        btnIcon.className = 'fa-solid fa-floppy-disk text-white';
        btnText.textContent = 'Save Profile';
        this.classList.add('btn-save-profile');
        
        // Focus first input
        inputs[0].focus();
        
      } else {
        // Disable inputs
        inputs.forEach(input => {
          input.setAttribute('disabled', 'disabled');
          input.classList.remove('editing');
        });
        
        // Hide upload overlay
        if(uploadLabel) uploadLabel.classList.add('d-none');
        
        // Update button UI back to Edit
        btnIcon.className = 'fa-solid fa-pen text-slate-400';
        btnText.textContent = 'Edit Profile';
        this.classList.remove('btn-save-profile');
        
        // Optional: Show a toast that profile is saved
        if (window.Clinic && window.Clinic.app && window.Clinic.app.showToast) {
          window.Clinic.app.showToast('Profile saved successfully!', 'success');
        }
      }
    });
  }

  // Picture Upload Preview
  const imageUpload = document.getElementById('profileImageUpload');
  const profileImage = document.getElementById('profileImageBorder');
  if (imageUpload && profileImage) {
    imageUpload.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          profileImage.src = e.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }
});
