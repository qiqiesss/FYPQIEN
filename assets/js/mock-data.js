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
    const todayISO = toDateISO(today);
    const tomorrowISO = toDateISO(tomorrow);

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
