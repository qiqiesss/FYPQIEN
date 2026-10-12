(function (window) {
  'use strict';

  const TREATMENTS = [
    { id: 'braces', name: 'Braces', color: '#0d9488' },
    { id: 'extraction', name: 'Extraction', color: '#ef4444' },
    { id: 'scaling', name: 'Scaling', color: '#3b82f6' },
    { id: 'filling', name: 'Filling', color: '#f59e0b' },
    { id: 'checkup', name: 'Check-up', color: '#22c55e' },
    { id: 'mos', name: 'Minor Oral Surgery', color: '#a855f7' }
  ];

  const PATIENTS = [
    { name: 'Aina Sofea Abdullah', phone: '+60 12-345 6789' },
    { name: 'Muhammad Faiz bin Harun', phone: '+60 13-456 7890' },
    { name: 'Nurul Hidayah binti Ahmad', phone: '+60 14-567 8901' },
    { name: 'Shahril Azwan bin Mohd Yusof', phone: '+60 11-234 5678' },
    { name: 'Siti Khadijah binti Rahman', phone: '+60 16-789 0123' },
    { name: 'Amirul Hakim bin Nasir', phone: '+60 18-901 2345' },
    { name: 'Farah Alyssa binti Zainal', phone: '+60 19-012 3456' },
    { name: 'Ahmad Danish bin Ismail', phone: '+60 17-345 6789' }
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
    const period = h >= 12 ? 'petang' : 'pagi';
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
      dentistInitials: 'DA',
      notes: 'Patient no-show'
    });
    appointments.push({
      id: 'appt-today-3',
      dateISO: todayISO,
      time: '11:30',
      endTime: '12:30',
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
      dentistInitials: 'DF',
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
      patientName: 'Ramesh Singh',
      phone: '+60 12-555 6666',
      treatmentId: 'braces',
      details: 'Braces Adjustment',
      statusPill: 'Waiting',
      dentistInitials: 'DA',
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
      dentistInitials: 'DA',
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
      dateISO: todayISO,
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
      dentistInitials: 'DA',
      notes: 'New patient'
    });

    // Month-wide appointments so calendar displays full active month
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    const monthSamples = [
      { day: 1, time: '10:00', endTime: '11:00', name: 'Sophia-Rose Weiss', phone: '+60 12-881 2938', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Routine maintenance. Light calculus observed on lower lingual anteriors.' },
      { day: 1, time: '12:00', endTime: '13:30', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Clinical Case Review', status: 'Completed', dentist: 'DZ', notes: 'Monthly doctors review with Dr. Zar on complex cases.' },
      { day: 1, time: '17:00', endTime: '17:30', name: 'Call', phone: '+60 17-293 8810', treatmentId: 'filling', details: 'Teleconsultation Call', status: 'Completed', dentist: 'DZ', notes: 'Post-extraction teleconsultation. Healing normally.' },
      
      { day: 2, time: '10:30', endTime: '11:00', name: 'Tory Lanes', phone: '+60 19-331 4482', treatmentId: 'filling', details: 'Tooth Filling (Composite)', status: 'Completed', dentist: 'DZ', notes: 'Restoration on tooth #25 disto-occlusal caries.' },
      { day: 2, time: '14:00', endTime: '14:30', name: 'Call', phone: '+60 13-992 0019', treatmentId: 'checkup', details: 'Lab Supplier Follow-up', status: 'Completed', dentist: 'DZ', notes: 'Call with dental lab regarding zirconia crown batch.' },

      { day: 3, time: '10:30', endTime: '11:00', name: 'Tory Lanes', phone: '+60 19-331 4482', treatmentId: 'checkup', details: 'Post-op Sensitivity Check', status: 'Completed', dentist: 'DZ', notes: 'Bite refinement on #25. Marginal seal intact.' },
      { day: 3, time: '14:00', endTime: '17:00', name: 'Symposium', phone: 'MDC Official', treatmentId: 'mos', details: 'National Dental Congress', status: 'Completed', dentist: 'DZ', notes: 'Web symposium on minimally invasive dentistry.' },

      { day: 4, time: '12:30', endTime: '14:30', name: 'John Orlando', phone: '+60 14-772 1049', treatmentId: 'braces', details: 'Orthodontic Assessment', status: 'Completed', dentist: 'DZ', notes: 'Initial braces study models and OPG analysis.' },
      { day: 4, time: '15:00', endTime: '16:00', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Infection Control Briefing', status: 'Completed', dentist: 'DZ', notes: 'Autoclave cycle validation audit.' },
      { day: 4, time: '17:00', endTime: '17:30', name: 'Robert Amos', phone: '+60 16-443 8920', treatmentId: 'extraction', details: 'Suture Removal', status: 'Completed', dentist: 'DZ', notes: 'Suture removal post wisdom tooth extraction.' },

      { day: 7, time: '10:30', endTime: '11:00', name: 'John Orlando', phone: '+60 14-772 1049', treatmentId: 'scaling', details: 'Pre-ortho Deep Scaling', status: 'Completed', dentist: 'DZ', notes: 'Scaling prior to bracket bonding.' },
      { day: 7, time: '14:00', endTime: '17:30', name: 'Call', phone: '+60 18-990 1234', treatmentId: 'checkup', details: 'Emergency On-Call Slot', status: 'Completed', dentist: 'DZ', notes: 'Emergency triage standby for clinic referrals.' },

      { day: 8, time: '09:00', endTime: '10:00', name: 'Ahmad Zulkarnain', phone: '+60 12-345 6789', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Scaling & Polishing procedure completed. Healthy gingiva.' },
      { day: 8, time: '10:00', endTime: '11:30', name: 'Sophia-Rose Weiss', phone: '+60 12-881 2938', treatmentId: 'filling', details: 'Crown Cementation', status: 'Completed', dentist: 'DZ', notes: 'Tooth #16 zirconia crown try-in and cementation.' },
      { day: 8, time: '12:00', endTime: '13:30', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Front Desk Sync', status: 'Completed', dentist: 'DZ', notes: 'Sync patient reminder automation with front-desk staff.' },
      { day: 8, time: '17:00', endTime: '17:30', name: 'Frederic Geissmann', phone: '+60 11-234 5678', treatmentId: 'checkup', details: 'Consultation & X-Ray', status: 'Completed', dentist: 'DZ', notes: 'Bitewings taken. Incipient caries on tooth #46.' },

      { day: 9, time: '09:00', endTime: '10:00', name: 'Aina Sofea Abdullah', phone: '+60 12-345 6789', treatmentId: 'scaling', details: 'Scaling & Polishing', status: 'Completed', dentist: 'DZ', notes: 'Routine scaling & polishing performed. Gums healthy.' },
      { day: 9, time: '10:00', endTime: '11:00', name: 'Tory Lanes', phone: '+60 19-331 4482', treatmentId: 'scaling', details: 'Teeth Whitening Assessment', status: 'Completed', dentist: 'DZ', notes: 'Custom bleaching tray impressions taken.' },
      { day: 9, time: '14:00', endTime: '14:30', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Implant Inventory Audit', status: 'Completed', dentist: 'DZ', notes: 'Audit of implant fixtures and surgical calibration.' },
      { day: 9, time: '17:00', endTime: '17:30', name: 'Call', phone: '+60 16-778 9901', treatmentId: 'checkup', details: 'Appointment Confirmation Call', status: 'Completed', dentist: 'DZ', notes: 'Confirming root canal appointment for next week.' },

      { day: 10, time: '10:00', endTime: '11:00', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Clinical SOP Review', status: 'Completed', dentist: 'DZ', notes: 'Review of infection control biomedical protocols.' },

      { day: 11, time: '10:30', endTime: '11:00', name: 'Frederic Geissmann', phone: '+60 11-234 5678', treatmentId: 'filling', details: 'Preventive Sealant #46', status: 'Completed', dentist: 'DZ', notes: 'Pit and fissure sealant applied on #46.' },
      { day: 11, time: '12:00', endTime: '13:30', name: 'Call', phone: '+60 12-445 6677', treatmentId: 'checkup', details: 'Dental Association Sync', status: 'Completed', dentist: 'DZ', notes: 'District health clinic outreach program discussion.' },

      { day: 14, time: '10:00', endTime: '11:00', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Staff Appraisal Briefing', status: 'Completed', dentist: 'DZ', notes: 'Review of triage wait times.' },

      { day: 15, time: '10:30', endTime: '11:30', name: 'Lynda Catcher', phone: '+60 17-889 2210', treatmentId: 'scaling', details: 'In-Office Teeth Whitening', status: 'Completed', dentist: 'DZ', notes: '3 cycles of PolaOffice whitening. Shade A3 to A1.' },
      { day: 15, time: '13:00', endTime: '14:30', name: 'Web Conference', phone: 'Virtual CME', treatmentId: 'checkup', details: 'Aesthetic Dentistry Masterclass', status: 'Completed', dentist: 'DZ', notes: 'Direct anterior composite layering technique seminar.' },
      { day: 15, time: '17:00', endTime: '17:30', name: 'Frederic Geissmann', phone: '+60 11-234 5678', treatmentId: 'filling', details: 'Fluoride Application', status: 'Completed', dentist: 'DZ', notes: 'Duraphat 5% sodium fluoride application.' },

      { day: 16, time: '10:30', endTime: '11:00', name: 'Tory Lanes', phone: '+60 19-331 4482', treatmentId: 'checkup', details: 'Gingival Review', status: 'Completed', dentist: 'DZ', notes: 'Tissue healing around margins confirmed.' },
      { day: 16, time: '13:00', endTime: '14:30', name: 'Symposium', phone: 'Virtual Forum', treatmentId: 'mos', details: 'Southeast Asia Dental Forum', status: 'Completed', dentist: 'DZ', notes: 'Panel on AI-assisted radiovisiography.' },

      { day: 17, time: '10:30', endTime: '11:00', name: 'Lynda Catcher', phone: '+60 17-889 2210', treatmentId: 'checkup', details: 'Whitening Post-Review', status: 'Completed', dentist: 'DZ', notes: 'Shade stable at A1. Patient very pleased.' },
      { day: 17, time: '14:00', endTime: '14:30', name: 'Call', phone: '+60 13-900 1122', treatmentId: 'braces', details: 'Patient Inquiry Follow-up', status: 'Completed', dentist: 'DZ', notes: 'Phone inquiry on dental implant procedure cost.' },

      { day: 18, time: '12:00', endTime: '13:30', name: 'Web Conference', phone: 'Live Streaming', treatmentId: 'checkup', details: 'Endodontic Rotary Workshop', status: 'Completed', dentist: 'DZ', notes: 'Webinar on warm vertical condensation.' },
      { day: 18, time: '17:00', endTime: '17:30', name: 'Frederic Geissmann', phone: '+60 11-234 5678', treatmentId: 'extraction', details: 'Simple Extraction #38', status: 'Completed', dentist: 'DZ', notes: 'Tooth #38 simple extraction under LA.' },
      { day: 18, time: '18:00', endTime: '18:30', name: 'Call', phone: '+60 19-332 9900', treatmentId: 'checkup', details: 'Evening On-Call Check', status: 'Completed', dentist: 'DZ', notes: 'Routine evening nurse handover call.' },

      { day: 21, time: '11:00', endTime: '12:00', name: 'Web Conference', phone: 'Virtual Room', treatmentId: 'checkup', details: 'Pediatric Behavior Guidance', status: 'Completed', dentist: 'DZ', notes: 'Tell-Show-Do techniques for children.' },
      { day: 21, time: '12:00', endTime: '12:30', name: 'Gregory Gray', phone: '+60 18-334 1928', treatmentId: 'extraction', details: 'Wisdom Tooth Consultation', status: 'Completed', dentist: 'DZ', notes: 'Impacted wisdom tooth #48. Referred for surgery.' },
      { day: 21, time: '14:00', endTime: '14:30', name: 'Amanda Lee', phone: '+60 12-990 4455', treatmentId: 'filling', details: 'Emergency Pulpitis Triage', status: 'Completed', dentist: 'DZ', notes: 'Acute pulpitis #11. Pulpectomy done.' },

      { day: 22, time: '10:00', endTime: '11:00', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Weekly Schedule Review', status: 'Completed', dentist: 'DZ', notes: 'Weekly room allocation review.' },
      { day: 22, time: '12:00', endTime: '12:30', name: 'Call', phone: '+60 14-889 0011', treatmentId: 'checkup', details: 'Patient Follow-up', status: 'Completed', dentist: 'DZ', notes: 'Follow up after emergency pulpectomy.' },

      { day: 23, time: '09:00', endTime: '09:30', name: 'Ms. Zahrah binti Abdullah', phone: '+6012-345-6781', treatmentId: 'checkup', details: 'Follow-up Consultation & Vital Check', status: 'Completed', dentist: 'DZ', notes: 'Allergic to Penicillin. Monitor blood pressure closely. Previous check-up: 20 AUG 2024.' },
      { day: 23, time: '09:45', endTime: '10:15', name: 'Mr. Li Wei Tan', phone: '+60 16-789 1234', treatmentId: 'checkup', details: 'Routine Checkup & X-Ray', status: 'Completed', dentist: 'DZ', notes: 'No active caries detected. Plaque index recorded.' },
      { day: 23, time: '12:00', endTime: '12:30', name: 'Ms. Hannah Fatheehah', phone: '+60 14-264 8460', treatmentId: 'scaling', details: 'Follow-up Consultation & Vital Check', status: 'In Consultation', dentist: 'DZ', notes: 'Allergic to Penicillin. Routine scaling and consultation. Patient requested advice on sensitivity.' },
      { day: 23, time: '14:15', endTime: '14:45', name: 'Mr. Abdul Rahman', phone: '+60 17-746 8024', treatmentId: 'filling', details: 'Tooth Filling (Composite)', status: 'Waiting', dentist: 'DZ', notes: 'Complains of food trap at upper right premolar #14.' },
      { day: 23, time: '15:00', endTime: '15:30', name: 'Ms. Maria Chua', phone: '+60 15-135 7908', treatmentId: 'scaling', details: 'Scaling & Consultation', status: 'Scheduled', dentist: 'DZ', notes: 'Afternoon scaling session.' },

      { day: 24, time: '11:30', endTime: '12:00', name: 'Gregory Gray', phone: '+60 18-334 1928', treatmentId: 'checkup', details: 'Pre-surgery Blood Pressure Check', status: 'Scheduled', dentist: 'DZ', notes: 'Pre-op medical history review.' },
      { day: 24, time: '14:00', endTime: '14:30', name: 'Tory Lanes', phone: '+60 19-331 4482', treatmentId: 'scaling', details: 'Teeth Whitening Delivery', status: 'Scheduled', dentist: 'DZ', notes: 'Deliver bleaching trays and Carbamide Peroxide.' },

      { day: 25, time: '14:00', endTime: '16:00', name: 'Symposium', phone: 'National Forum', treatmentId: 'mos', details: 'Digital Dentistry Scanning', status: 'Scheduled', dentist: 'DZ', notes: 'Webinar on 3Shape digital impression workflows.' },

      { day: 28, time: '11:00', endTime: '12:30', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Quarterly Audit & Review', status: 'Scheduled', dentist: 'DZ', notes: 'Stocktake audit and clinical charts.' },
      { day: 28, time: '17:00', endTime: '17:30', name: 'Frederic Geissmann', phone: '+60 11-234 5678', treatmentId: 'checkup', details: 'Routine 6-Month Check', status: 'Scheduled', dentist: 'DZ', notes: 'Semi-annual routine dental inspection.' },

      { day: 29, time: '11:30', endTime: '12:30', name: 'Web Conference', phone: 'Virtual CME', treatmentId: 'checkup', details: 'Periodontal Splinting', status: 'Scheduled', dentist: 'DZ', notes: 'Web conference on fiber splint reinforcement.' },

      { day: 30, time: '10:00', endTime: '11:00', name: "Doctor's Meeting", phone: 'Clinical Event', treatmentId: 'mos', details: 'Monthly Closeout & Planning', status: 'Scheduled', dentist: 'DZ', notes: 'Month-end clinical targets review.' }
    ];

    monthSamples.forEach((item, index) => {
      const d = new Date(curYear, curMonth, item.day);
      appointments.push({
        id: 'seed-month-' + (index + 1),
        dateISO: toDateISO(d),
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
   * Builds a reminder object for a single appointment (BM WhatsApp template).
   * Kept here so the reminder queue derives from live appointments.
   */
  function buildReminderForAppt(appt, dateObj, status) {
    const first = String(appt.patientName || '').split(' ')[0] || 'Patient';
    const dateLabel = formatReadableDate(dateObj);
    const message =
      'Assalamualaikum ' + first +
      ', ini peringatan temujanji anda di Klinik Pergigian Sofea Taman Tas pada ' +
      dateLabel + ', jam ' + formatTime12h(appt.time) +
      '. Sila hadir 10 minit awal. Terima kasih.';
    return {
      id: 'rem-' + appt.id,
      appointmentId: appt.id,
      patientName: appt.patientName,
      phone: appt.phone,
      appointmentTime: appt.time,
      dateISO: appt.dateISO,
      message: message,
      status: status || 'Queued'
    };
  }

  const SEED_APPOINTMENTS = buildSeedAppointments();

  window.Clinic = window.Clinic || {};
  window.Clinic.TREATMENTS = TREATMENTS;
  window.Clinic.PATIENTS = PATIENTS;
  window.Clinic.APPOINTMENTS = SEED_APPOINTMENTS;
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
