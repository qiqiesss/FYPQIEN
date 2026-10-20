(function (window) {
  'use strict';

  const TREATMENTS = [
    { id: 'braces', name: 'Braces', color: '#0d9488', duration: 45 },
    { id: 'extraction', name: 'Extraction', color: '#ef4444', duration: 45 },
    { id: 'scaling', name: 'Scaling', color: '#3b82f6', duration: 30 },
    { id: 'filling', name: 'Filling', color: '#f59e0b', duration: 30 },
    { id: 'checkup', name: 'Check-up', color: '#22c55e', duration: 30 },
    { id: 'mos', name: 'Minor Oral Surgery', color: '#a855f7', duration: 60 }
  ];

  const DENTISTS = [
    { id: 'DZ', name: 'Dr. Zarith Sofia', shortName: 'Dr. Zar', room: 'Room 2', color: '#0d9488' }
  ];

  const PATIENTS = [
    { name: 'Aina Sofea Abdullah', phone: '+60 12-345 6789' },
    { name: 'Tan Wei Ming', phone: '+60 16-789 0123' },
    { name: 'Priya a/p Mohan', phone: '+60 17-345 6789' },
    { name: 'Muhammad Faiz bin Harun', phone: '+60 13-456 7890' },
    { name: 'Lee Siew Lan', phone: '+60 19-331 4482' },
    { name: 'Suresh a/l Krishnan', phone: '+60 14-567 8901' },
    { name: 'Siti Khadijah binti Rahman', phone: '+60 18-901 2345' },
    { name: 'Chong Wei Lun', phone: '+60 12-881 2938' },
    { name: 'Kavitha a/p Subramaniam', phone: '+60 11-234 5678' },
    { name: 'Nurul Hidayah binti Ahmad', phone: '+60 19-012 3456' }
  ];

  function toDateISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function addDays(d, n) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + n);
    return copy;
  }

  function todayDate() {
    return new Date();
  }

  function tomorrowDate() {
    return addDays(todayDate(), 1);
  }

  function formatTime12h(hhmm) {
    if (!hhmm) return hhmm;
    const parts = hhmm.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  function formatReadableDate(d) {
    const opts = { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' };
    return d.toLocaleDateString('en-MY', opts);
  }

  function buildSeedAppointments() {
    const today = todayDate();
    const tomorrow = tomorrowDate();
    const dayAfterTomorrow = addDays(todayDate(), 2);
    const todayISO = toDateISO(today);
    const tomorrowISO = toDateISO(tomorrow);
    const dayAfterISO = toDateISO(dayAfterTomorrow);

    const appointments = [];

    appointments.push({
      id: 'appt-today-1',
      dateISO: todayISO,
      time: '09:00',
      endTime: '10:00',
      patientName: 'Ahmad Zulkarnain',
      phone: '+60 12-345 6789',
      treatmentId: 'scaling',
      details: 'Scaling & Polishing',
      statusPill: 'Completed',
      dentistInitials: 'DZ',
      notes: ''
    });
    appointments.push({
      id: 'appt-today-2',
      dateISO: todayISO,
      time: '10:00',
      endTime: '11:00',
      patientName: 'Siti Nurhaliza',
      phone: '+60 13-456 7890',
      treatmentId: 'checkup',
      details: 'Initial Checkup',
      statusPill: 'Canceled',
      dentistInitials: 'DZ',
      notes: 'Patient no-show'
    });
    appointments.push({
      id: 'appt-today-3',
      dateISO: todayISO,
      time: '11:00',
      endTime: '11:30',
      patientName: 'Mohd Faizal',
      phone: '+60 14-567 8901',
      treatmentId: 'filling',
      details: 'Tooth Filling',
      statusPill: 'Completed',
      dentistInitials: 'DZ',
      notes: ''
    });
    appointments.push({
      id: 'appt-today-4',
      dateISO: todayISO,
      time: '13:00',
      endTime: '14:00',
      patientName: 'Tan Mei Ling',
      phone: '+60 16-789 0123',
      treatmentId: 'scaling',
      details: 'Teeth Whitening',
      statusPill: 'Waiting',
      dentistInitials: 'DZ',
      notes: ''
    });
    appointments.push({
      id: 'appt-today-5',
      dateISO: todayISO,
      time: '14:30',
      endTime: '15:30',
      patientName: 'Nurul Huda',
      phone: '+60 19-333 4444',
      treatmentId: 'extraction',
      details: 'Tooth Extraction',
      statusPill: 'Canceled',
      dentistInitials: 'DZ',
      notes: 'Patient called to cancel'
    });
    appointments.push({
      id: 'appt-today-6',
      dateISO: todayISO,
      time: '15:30',
      endTime: '16:30',
      patientName: 'Ramesh a/l Ravindran',
      phone: '+60 12-555 6666',
      treatmentId: 'braces',
      details: 'Braces Adjustment',
      statusPill: 'Waiting',
      dentistInitials: 'DZ',
      notes: ''
    });

    // Dummy data for Tomorrow (used by Reminders view)
    appointments.push({
      id: 'appt-tom-1',
      dateISO: tomorrowISO,
      time: '09:00',
      endTime: '10:00',
      patientName: 'Aina Sofea Abdullah',
      phone: '+60 12-345 6789',
      treatmentId: 'scaling',
      details: 'Scaling & Polishing',
      statusPill: 'Scheduled',
      dentistInitials: 'DZ',
      notes: ''
    });
    appointments.push({
      id: 'appt-tom-2',
      dateISO: tomorrowISO,
      time: '11:00',
      endTime: '11:30',
      patientName: 'Muhammad Faiz bin Harun',
      phone: '+60 13-456 7890',
      treatmentId: 'checkup',
      details: 'Routine Checkup',
      statusPill: 'Scheduled',
      dentistInitials: 'DZ',
      notes: ''
    });
    appointments.push({
      id: 'appt-tom-3',
      dateISO: tomorrowISO,
      time: '14:30',
      endTime: '15:30',
      patientName: 'Siti Khadijah binti Rahman',
      phone: '+60 16-789 0123',
      treatmentId: 'filling',
      details: 'Tooth Filling',
      statusPill: 'Scheduled',
      dentistInitials: 'DZ',
      notes: ''
    });

    appointments.push({
      id: 'appt-tom-4',
      dateISO: tomorrowISO,
      time: '16:00',
      endTime: '16:30',
      patientName: 'Ibrahim bin Mahmud',
      phone: '+60 12-345 6789',
      treatmentId: 'scaling',
      details: 'Scaling & Polishing',
      statusPill: 'Scheduled',
      dentistInitials: 'DZ',
      notes: 'Routine scaling session.'
    });

    // Day after tomorrow appointment
    appointments.push({
      id: 'appt-day-after-1',
      dateISO: dayAfterISO,
      time: '09:00',
      endTime: '09:30',
      patientName: 'Ali bin Abu',
      phone: '+60 12-999 8888',
      treatmentId: 'checkup',
      details: 'Routine Checkup',
      statusPill: 'Scheduled',
      dentistInitials: 'DZ',
      notes: 'New patient'
    });

    // Month-wide appointments so calendar displays full active month
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    const monthSamples = [
      { day: 1, time: '10:00', endTime: '11:00', name: 'Farah Nadia binti Rosli', phone: '+60 12-881 2938', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Routine maintenance. Light calculus on lower anteriors.' },
      { day: 1, time: '14:00', endTime: '15:00', name: 'Chong Wei Lun', phone: '+60 16-789 0123', treatmentId: 'filling', details: 'Composite Resin Filling', status: 'Completed', dentist: 'DZ', notes: 'Restoration on tooth #25 disto-occlusal caries.' },

      { day: 2, time: '10:30', endTime: '11:00', name: 'Tan Wei Ming', phone: '+60 19-331 4482', treatmentId: 'filling', details: 'Tooth Filling (Composite)', status: 'Completed', dentist: 'DZ', notes: 'Restoration on tooth #14 mesial.' },
      { day: 2, time: '14:00', endTime: '14:30', name: 'Kavitha a/p Subramaniam', phone: '+60 13-992 0019', treatmentId: 'checkup', details: 'Post-op Sensitivity Check', status: 'Completed', dentist: 'DZ', notes: 'Marginal seal intact. Bite comfortable.' },

      { day: 3, time: '10:30', endTime: '11:00', name: 'Logeswaran a/l Maniam', phone: '+60 17-345 6789', treatmentId: 'checkup', details: 'Consultation & X-Ray', status: 'Completed', dentist: 'DZ', notes: 'Bite refinement on #25. Marginal seal intact.' },
      { day: 3, time: '14:30', endTime: '15:30', name: 'Ahmad Faiz bin Zulkifli', phone: '+60 18-901 2345', treatmentId: 'mos', details: 'Surgical Root Excision', status: 'Completed', dentist: 'DZ', notes: 'Surgical root removal under local anesthesia.' },

      { day: 4, time: '11:00', endTime: '12:00', name: 'Goh Seng Huat', phone: '+60 14-772 1049', treatmentId: 'braces', details: 'Orthodontic Assessment', status: 'Completed', dentist: 'DZ', notes: 'Initial braces study models and OPG analysis.' },
      { day: 4, time: '14:00', endTime: '15:00', name: 'Nurul Hidayah binti Ahmad', phone: '+60 19-012 3456', treatmentId: 'extraction', details: 'Wisdom Tooth Operculectomy', status: 'Completed', dentist: 'DZ', notes: 'Suture removal post wisdom tooth extraction.' },

      { day: 7, time: '10:30', endTime: '11:00', name: 'Anand a/l Murugan', phone: '+60 14-772 1049', treatmentId: 'scaling', details: 'Pre-ortho Deep Scaling', status: 'Completed', dentist: 'DZ', notes: 'Scaling prior to bracket bonding.' },
      { day: 7, time: '14:30', endTime: '15:30', name: 'Siti Sarah binti Idris', phone: '+60 18-990 1234', treatmentId: 'filling', details: 'Anterior Composite Veneer', status: 'Completed', dentist: 'DZ', notes: 'Direct composite veneer on #11 and #21.' },

      { day: 8, time: '09:00', endTime: '10:00', name: 'Ahmad Zulkarnain', phone: '+60 12-345 6789', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Scaling & Polishing procedure completed. Healthy gingiva.' },
      { day: 8, time: '11:00', endTime: '12:00', name: 'Lim Yee Chen', phone: '+60 12-881 2938', treatmentId: 'filling', details: 'Crown Cementation', status: 'Completed', dentist: 'DZ', notes: 'Tooth #16 zirconia crown try-in and cementation.' },
      { day: 8, time: '14:30', endTime: '15:30', name: 'Priya a/p Mohan', phone: '+60 11-234 5678', treatmentId: 'checkup', details: 'Consultation & X-Ray', status: 'Completed', dentist: 'DZ', notes: 'Bitewings taken. Incipient caries on tooth #46.' },

      { day: 9, time: '09:00', endTime: '10:00', name: 'Aina Sofea Abdullah', phone: '+60 12-345 6789', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Routine scaling & polishing performed. Gums healthy.' },
      { day: 9, time: '11:00', endTime: '12:00', name: 'Muhammad Harith bin Roslan', phone: '+60 19-331 4482', treatmentId: 'scaling', details: 'Teeth Whitening Assessment', status: 'Completed', dentist: 'DZ', notes: 'Custom bleaching tray impressions taken.' },
      { day: 9, time: '14:30', endTime: '15:30', name: 'Ravi a/l Chandran', phone: '+60 16-778 9901', treatmentId: 'mos', details: 'Implant Stage 1 Placement', status: 'Completed', dentist: 'DZ', notes: 'Implant fixture placed on #36.' },

      { day: 10, time: '10:00', endTime: '11:00', name: 'Chin Mei Wah', phone: '+60 17-665 4433', treatmentId: 'mos', details: 'Crown Lengthening', status: 'Completed', dentist: 'DZ', notes: 'Surgical crown lengthening on #24.' },

      { day: 11, time: '10:30', endTime: '11:00', name: 'Devi a/p Rajan', phone: '+60 11-234 5678', treatmentId: 'filling', details: 'Preventive Sealant #46', status: 'Completed', dentist: 'DZ', notes: 'Pit and fissure sealant applied on #46.' },
      { day: 11, time: '14:00', endTime: '15:00', name: 'Mohd Shahril bin Yusof', phone: '+60 12-445 6677', treatmentId: 'checkup', details: 'Full Mouth Periodontal Assessment', status: 'Completed', dentist: 'DZ', notes: 'Probing depths recorded. Plaque score 18%.' },

      { day: 14, time: '10:00', endTime: '11:00', name: 'Zulhilmi bin Osman', phone: '+60 13-221 4455', treatmentId: 'braces', details: 'Braces Wire Replacement', status: 'Completed', dentist: 'DZ', notes: 'NiTi wire progression.' },

      { day: 15, time: '10:30', endTime: '11:30', name: 'Amanda Lee Mei Xin', phone: '+60 17-889 2210', treatmentId: 'scaling', details: 'In-Office Teeth Whitening', status: 'Completed', dentist: 'DZ', notes: '3 cycles of PolaOffice whitening. Shade A3 to A1.' },
      { day: 15, time: '14:30', endTime: '15:30', name: 'Fatin Nadiah binti Zulkifli', phone: '+60 11-234 5678', treatmentId: 'filling', details: 'Fluoride Application & Filling', status: 'Completed', dentist: 'DZ', notes: 'Composite restoration on #35.' },

      { day: 16, time: '10:30', endTime: '11:00', name: 'Lee Siew Lan', phone: '+60 19-331 4482', treatmentId: 'checkup', details: 'Gingival Review', status: 'Completed', dentist: 'DZ', notes: 'Tissue healing around margins confirmed.' },
      { day: 16, time: '14:00', endTime: '15:00', name: 'Karthik a/l Gunasegaran', phone: '+60 14-555 7788', treatmentId: 'extraction', details: 'Molar Extraction #26', status: 'Completed', dentist: 'DZ', notes: 'Simple extraction under local anesthesia.' },

      { day: 17, time: '10:30', endTime: '11:00', name: 'Nur Farzana binti Halim', phone: '+60 17-889 2210', treatmentId: 'checkup', details: 'Post-Whitening Review', status: 'Completed', dentist: 'DZ', notes: 'Shade stable at A1. Patient very pleased.' },
      { day: 17, time: '14:00', endTime: '14:30', name: 'Wong Kah Seng', phone: '+60 13-900 1122', treatmentId: 'braces', details: 'Bracket Rebonding', status: 'Completed', dentist: 'DZ', notes: 'Upper central incisor bracket rebonded.' },

      { day: 18, time: '10:00', endTime: '11:00', name: 'Thanaletchumy a/p Ramasamy', phone: '+60 16-887 2233', treatmentId: 'extraction', details: 'Simple Extraction #38', status: 'Completed', dentist: 'DZ', notes: 'Tooth #38 simple extraction under LA.' },
      { day: 18, time: '14:30', endTime: '15:30', name: 'Noraini binti Kassim', phone: '+60 19-332 9900', treatmentId: 'checkup', details: 'Bite Analysis & Consultation', status: 'Completed', dentist: 'DZ', notes: 'Occlusal analysis completed.' },

      { day: 22, time: '10:00', endTime: '11:00', name: 'Iskandar bin Dzulkifli', phone: '+60 18-334 1928', treatmentId: 'extraction', details: 'Wisdom Tooth Consultation', status: 'Completed', dentist: 'DZ', notes: 'Impacted wisdom tooth #48. Referred for surgery.' },
      { day: 22, time: '14:00', endTime: '14:30', name: 'Kok Wai Leong', phone: '+60 14-889 0011', treatmentId: 'filling', details: 'Emergency Pulpitis Triage', status: 'Completed', dentist: 'DZ', notes: 'Acute pulpitis #11. Pulpectomy done.' },

      { day: 23, time: '09:00', endTime: '09:30', name: 'Ms. Zahrah binti Abdullah', phone: '+60 12-345 6781', treatmentId: 'checkup', details: 'Follow-up Consultation & Vital Check', status: 'Completed', dentist: 'DZ', notes: 'Allergic to Penicillin. Monitor blood pressure closely.' },
      { day: 23, time: '10:00', endTime: '10:30', name: 'Mr. Li Wei Tan', phone: '+60 16-789 1234', treatmentId: 'checkup', details: 'Routine Checkup & X-Ray', status: 'Completed', dentist: 'DZ', notes: 'No active caries detected. Plaque index recorded.' },
      { day: 23, time: '11:00', endTime: '11:30', name: 'Ms. Hannah Fatheehah', phone: '+60 14-264 8460', treatmentId: 'scaling', details: 'Scaling & Consultation', status: 'Completed', dentist: 'DZ', notes: 'Allergic to Penicillin. Routine scaling.' },
      { day: 23, time: '14:00', endTime: '14:30', name: 'Mr. Abdul Rahman', phone: '+60 17-746 8024', treatmentId: 'filling', details: 'Tooth Filling (Composite)', status: 'Waiting', dentist: 'DZ', notes: 'Complains of food trap at upper right premolar #14.' },
      { day: 23, time: '15:00', endTime: '15:30', name: 'Ms. Maria Chua', phone: '+60 15-135 7908', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Scheduled', dentist: 'DZ', notes: 'Afternoon scaling session.' },

      { day: 24, time: '11:00', endTime: '11:30', name: 'Nurul Ashikin binti Razali', phone: '+60 18-334 1928', treatmentId: 'checkup', details: 'Pre-surgery Blood Pressure Check', status: 'Scheduled', dentist: 'DZ', notes: 'Pre-op medical history review.' },
      { day: 24, time: '14:00', endTime: '14:30', name: 'Siti Aminah binti Wahid', phone: '+60 19-331 4482', treatmentId: 'scaling', details: 'Teeth Whitening Delivery', status: 'Scheduled', dentist: 'DZ', notes: 'Deliver bleaching trays and Carbamide Peroxide.' },

      { day: 25, time: '14:00', endTime: '15:00', name: 'Farhan bin Ridzuan', phone: '+60 17-223 3445', treatmentId: 'mos', details: 'Surgical Root Excision', status: 'Scheduled', dentist: 'DZ', notes: 'Planned excision of retained root tip #47.' },

      { day: 28, time: '11:00', endTime: '12:00', name: 'Suresh a/l Krishnan', phone: '+60 14-567 8901', treatmentId: 'filling', details: 'Composite Inlay Cementation', status: 'Scheduled', dentist: 'DZ', notes: 'Lab composite inlay check and try-in.' },
      { day: 28, time: '14:30', endTime: '15:00', name: 'Ramesh a/l Ravindran', phone: '+60 12-555 6666', treatmentId: 'checkup', details: 'Routine 6-Month Check', status: 'Scheduled', dentist: 'DZ', notes: 'Semi-annual routine dental inspection.' },

      { day: 29, time: '11:30', endTime: '12:30', name: 'Aina Sofea Abdullah', phone: '+60 12-345 6789', treatmentId: 'checkup', details: 'Periodontal Splinting Check', status: 'Scheduled', dentist: 'DZ', notes: 'Evaluation of mandibular anterior splint.' },

      { day: 30, time: '10:00', endTime: '11:00', name: 'Tan Wei Ming', phone: '+60 16-789 0123', treatmentId: 'braces', details: 'Braces Wire Adjustment', status: 'Scheduled', dentist: 'DZ', notes: 'Lower arch wire adjustment.' }
    ];

    monthSamples.forEach((item, index) => {
      const d = new Date(curYear, curMonth, item.day);
      const iso = toDateISO(d);
      // Skip if this date matches today or tomorrow to avoid overlapping with appt-today-* and appt-tom-*!
      if (iso === todayISO || iso === tomorrowISO) return;

      appointments.push({
        id: 'seed-month-' + (index + 1),
        dateISO: iso,
        time: item.time,
        endTime: item.endTime,
        patientName: item.name,
        phone: item.phone,
        treatmentId: item.treatmentId,
        details: item.details,
        statusPill: item.status,
        dentistInitials: item.dentist,
        notes: item.notes
      });
    });

    return appointments;
  }

  /**
   * Builds a reminder object for a single appointment (BM or EN WhatsApp template).
   * Kept here so the reminder queue derives from live appointments.
   */
  function buildReminderForAppt(appt, dateObj, status, lang) {
    const first = String(appt.patientName || '').split(' ')[0] || 'Patient';
    const dateLabel = formatReadableDate(dateObj);
    const timeFormatted = formatTime12h(appt.time);
    let message = '';
    if (lang === 'en') {
      message =
        'Hello ' + first +
        ', this is a reminder for your dental appointment at Klinik Pergigian Sofea Taman Tas on ' +
        dateLabel + ' at ' + timeFormatted +
        '. Please arrive 10 minutes early. Thank you.';
    } else {
      message =
        'Assalamualaikum ' + first +
        ', ini peringatan temujanji anda di Klinik Pergigian Sofea Taman Tas pada ' +
        dateLabel + ', jam ' + timeFormatted +
        '. Sila hadir 10 minit awal. Terima kasih.';
    }
    return {
      id: 'rem-' + appt.id,
      appointmentId: appt.id,
      patientName: appt.patientName,
      phone: appt.phone,
      appointmentTime: appt.time,
      dateISO: appt.dateISO,
      message: message,
      status: status || 'Queued',
      lang: lang || 'bm'
    };
  }

  const SEED_APPOINTMENTS = buildSeedAppointments();

  window.Clinic = window.Clinic || {};
  window.Clinic.TREATMENTS = TREATMENTS;
  window.Clinic.PATIENTS = PATIENTS;
  window.Clinic.DENTISTS = DENTISTS;
  window.Clinic.APPOINTMENTS = SEED_APPOINTMENTS;
  window.Clinic.mockData = {
    buildSeedAppointments: buildSeedAppointments
  };
  window.Clinic.reminders = {
    buildReminderForAppt: buildReminderForAppt
  };
  window.Clinic.utils = {
    toDateISO: toDateISO,
    addDays: addDays,
    formatReadableDate: formatReadableDate,
    formatTime12h: formatTime12h,
    todayDate: todayDate,
    tomorrowDate: tomorrowDate
  };
})(window);