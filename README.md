# Klinik Pergigian Sofea Taman Tas (KPSTS) — Clinical Management System

A high-performance, responsive Dental Clinic Management & Appointment Scheduling Web Application designed for **Klinik Pergigian Sofea Taman Tas**, supporting seamless workflows between Front-Desk Administrative Staff and Dental Practitioners.

---

## 1. System Architecture & Tech Stack

- **Core Technologies**: Semantic HTML5, Vanilla JavaScript (ES6+), CSS3.
- **Styling Frameworks**:
  - **Bootstrap 5.3**: Used on Front-Desk scheduling, analytics modals, and WhatsApp queue management.
  - **Tailwind CSS**: Used on Dentist Monthly Calendar, Dentist Dashboard, and Clinical Profile views.
  - **Font Awesome 6 & Bootstrap Icons**: Vector iconography.
- **Client-Side Data Engine**:
  - Unified data store (`mock-data.js` & `app.js`) anchoring canonical appointments, treatment taxonomies, and Malaysian clinical profiles.
  - LocalStorage / SessionStorage hydration layer with automatic date-rollover reconciliation.

---

## 2. Role-Based Access Control (RBAC)

The application enforces strict separation of concerns between clinic roles:

| Role | Default Credentials | Permitted Pages | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin / Front Desk** | `admin` / `admin123` | `front-desk.html`<br>`reminders.html`<br>`past-records.html` | Schedule management, new bookings, date rescheduling, cancellations, capacity utilization metrics, WhatsApp reminders queue, and patient intake. |
| **Dentist** | `drzar` / `doctor123` | `home-dentist.html`<br>`dentist.html`<br>`dentist-profile.html`<br>`past-records.html` | Today's patient queue progression, monthly calendar overview, clinical notes & procedure checklist, allergy alerts, prescription pad generation, and leave scheduling. |

---

## 3. Key Modules & Functional Highlights

### Front Desk Scheduler (`front-desk.html` & `front-desk.js`)
- **Dual Views**: Seamless toggling between Single Day Timeline and 6-Day Monday–Saturday Week View.
- **Interactive Date Navigation**: Integrated HTML5 date picker, day-by-day stepper, and quick "Today" reset button.
- **Conflict Prevention Engine**:
  - Strict 30-to-60 minute duration calculation by procedure type.
  - Hard boundary enforcement: Blocks bookings ending after clinic closing time (18:00).
  - Clinic Lunch Break lockout (12:00 PM – 01:00 PM).
  - Mandatory 5-minute sanitization & cleaning buffers after procedures.
  - Scheduled Dentist Leave lockout: Blocks appointments when the doctor is on approved leave.
- **Auto-Scroll & "NOW" Indicator**: Dynamically calculates ongoing slot fraction and draws a live red timeline indicator line.
- **Autocomplete Patient Database**: Pre-fills patient contacts from `Clinic.PATIENTS` datalist.
- **Safe Cancellations**: Appointments are marked with `statusPill = 'Canceled'` rather than deleted, preserving full clinical audit history.
- **Real-Time Capacity Analytics**: Dynamically computes today's booked minutes, open capacity, and utilization percentage from data rather than DOM scraping.

### WhatsApp Reminders Queue (`reminders.html` & `reminders.js`)
- **Automated Tomorrow Filter**: Automatically isolates tomorrow's scheduled bookings for proactive reminder dispatches.
- **Bilingual WhatsApp Templates**: Instant toggle between Bahasa Melayu (BM) and English (EN) notification formats.
- **Direct Messaging (`wa.me`)**: Click-to-chat links with URL-encoded personalized messages for real WhatsApp Web/Desktop dispatch.
- **Error Recovery**: Dedicated `Failed` delivery state with instant `Retry` mechanism for gateway timeouts.
- **Batch Processing & Confirmation**: Multi-select row checkboxes and confirmation modal before executing batch dispatches.
- **Time Format Consistency**: Standardized 12-hour AM/PM format matching the rest of the application.

### Dentist Clinical Portal (`home-dentist.html` & `dentist.html`)
- **Real-Time Patient Queue**: Real-time status progression moving patients from `Waiting` → `In Consultation` → `Completed`.
- **Monthly Calendar Grid**: Full Sunday–Saturday grid with procedure color coding, responsive overflow badges (`+N more`), and overflow modal.
- **Clinical Safety & Allergy Banners**:
  - Automated detection of documented penicillin allergies.
  - Prominent alert banners warning against contraindicated Beta-lactams and Amoxicillin prescriptions.
  - Safe scaling task templates omitting contraindicated antibiotics.
- **Official Prescription Pad (`Print Rx`)**: MDC-compliant digital prescription pad with patient DOB, MMC license number, and dedicated print stylesheet (`@media print`).
- **Isolated Storage Architecture**: Doctor notes, task completions, and leave dates are stored in isolated keys (`kpst.v1.clinical_notes`, `kpst.v1.dentist_leave`), preventing front-desk appointment metadata or date fields from being overwritten.

### Past Records Archive (`past-records.html` & `past-records.js`)
- Directly queries live canonical appointments and saved clinical notes.
- Multi-column sortable table (Date, Patient Name, Procedure, Status).
- Date range filtering (Start Date to End Date) and full-text keyword search.
- Pagination (10 records per page) with empty-state indicators.
- One-click CSV export generating spreadsheet-compatible clinical audit archives.

### Dentist Profile (`dentist-profile.html` & `dentist-profile.js`)
- **Image Optimization**: Uploaded profile avatars are automatically downsampled using an HTML5 Canvas to a max of 300×300 pixels (JPEG 85% quality), preventing `localStorage` quota overflow.
- **Field Validation**: Persists contact edits with strict email and Malaysian phone format validation.
- **Schedule & Leave Management**: Displays weekly working hours and allows scheduling leave dates that block booking slots on the scheduler.

---

## 4. Prototype Limitations & Production Recommendations

### A. Malaysia Personal Data Protection Act 2010 (PDPA) Compliance
> [!WARNING]
> **Prototype Limitation**: Patient names, IC numbers, telephone numbers, and clinical treatment notes currently reside unencrypted inside client-side `localStorage` and `sessionStorage`.
- **Production Requirement**: Under Malaysia's **Personal Data Protection Act 2010 (Act 709)** and Malaysian Dental Council (MDC) guidelines, patient medical records constitute sensitive personal data.
- **Mandatory Production Architecture**:
  1. Replace local storage with a secure backend API (e.g., Node.js/Express, Laravel, or Django) protected by JWT/OAuth2 session tokens.
  2. Implement **AES-256 database encryption at rest** and **TLS 1.3 transit encryption** (HTTPS).
  3. Enforce **Role-Based Access Control (RBAC)** at the database level so front-desk staff cannot view confidential clinical diagnosis notes.
  4. Implement immutable audit logging tracking all access and modifications to patient records.

### B. Tailwind CSS CDN Usage
> [!NOTE]
> **Prototype Limitation**: `<script src="https://cdn.tailwindcss.com"></script>` is loaded in the browser header for rapid client-side prototyping and development flexibility.
- **Production Requirement**: The Tailwind CDN script executes a client-side JIT compiler in the browser, which causes a brief Flash of Unstyled Content (FOUC) and is not intended for high-traffic production environments.
- **Mandatory Production Architecture**: Pre-compile styles using Tailwind CSS CLI or PostCSS (`npm run build`) into a minified, purged static CSS file (e.g., `dist/output.css`) to eliminate external CDN dependencies and optimize initial load time.

### C. Framework Unification & Component Reusability
> [!TIP]
> The current prototype combines Bootstrap 5 (for front desk grid & modals) and Tailwind CSS (for dentist grid). In production, unifying into a single design system (or using Web Components / React / Vue) with a shared navigation sidebar loaded dynamically from a single template will reduce template duplication across HTML pages.

---

## 5. Local Setup & Testing

1. Clone or place the directory into your web root (e.g., `c:\laragon\www\FYPQIEN\`).
2. Start Apache or any local static web server (e.g., `npx serve .` or PHP built-in server `php -S localhost:8000`).
3. Open `http://localhost/FYPQIEN/index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
4. Log in using either **Admin** (`admin` / `admin123`) or **Dentist** (`drzar` / `doctor123`).
