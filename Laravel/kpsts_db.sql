-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 01, 2026 at 03:26 PM
-- Server version: 8.0.30
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kpsts_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int UNSIGNED NOT NULL,
  `patient_id` int UNSIGNED NOT NULL,
  `dentist_id` int UNSIGNED NOT NULL,
  `treatment_id` int UNSIGNED NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('Scheduled','Waiting','In Progress','Completed','Canceled','No-Show','Past Scheduled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `patient_id`, `dentist_id`, `treatment_id`, `appointment_date`, `start_time`, `end_time`, `status`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 1, 2, '2026-10-28', '09:00:00', '09:30:00', 'Completed', 'Subgingival calculus thoroughly removed around anterior region. Patient advised on using soft bristle brush.', 1, '2026-11-01 13:35:48'),
(2, 2, 1, 3, '2026-10-29', '10:30:00', '11:00:00', 'Completed', 'Class I composite restoration placed on tooth 36 occlusal. Etched, bonded, cured, and occlusion adjusted.', 1, '2026-11-01 13:35:48'),
(3, 3, 2, 4, '2026-10-30', '14:00:00', '14:30:00', 'Completed', 'Simple extraction of mobile tooth 48. Hemostasis achieved.', 1, '2026-11-01 13:35:48'),
(4, 4, 1, 2, '2026-11-01', '09:30:00', '10:00:00', 'Completed', 'Supragingival scaling completed without complications.', 1, '2026-11-01 13:35:48'),
(5, 5, 1, 1, '2026-11-01', '10:30:00', '11:00:00', 'In Progress', 'Patient presented with intermittent pain on upper right quadrant. Periapical X-ray taken.', 1, '2026-11-01 13:35:48'),
(6, 6, 2, 9, '2026-11-01', '11:00:00', '11:45:00', 'Waiting', NULL, 1, '2026-11-01 13:35:48'),
(7, 1, 1, 5, '2026-11-02', '09:00:00', '10:00:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(8, 7, 1, 2, '2026-11-02', '10:30:00', '11:00:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(9, 8, 2, 6, '2026-11-02', '14:00:00', '15:00:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(10, 9, 1, 8, '2026-11-02', '15:30:00', '16:30:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(11, 10, 1, 3, '2026-11-04', '09:30:00', '10:00:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(12, 2, 1, 2, '2026-11-05', '11:00:00', '11:30:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(13, 3, 2, 1, '2026-11-06', '14:30:00', '15:00:00', 'Scheduled', NULL, 1, '2026-11-01 13:35:48'),
(19, 16, 1, 2, '2026-11-05', '10:00:00', '10:30:00', 'Scheduled', 'Testing true MVC persistence', 1, '2026-11-01 14:33:05'),
(20, 17, 1, 1, '2026-11-06', '09:30:00', '10:00:00', 'In Progress', 'Clinical evaluation complete. Prescribed analgesics.', 1, '2026-11-01 14:46:47'),
(22, 19, 1, 1, '2026-11-04', '10:30:00', '11:00:00', 'Scheduled', NULL, 1, '2026-11-01 15:01:37'),
(23, 20, 1, 1, '2026-11-04', '10:00:00', '10:30:00', 'Scheduled', NULL, 1, '2026-11-01 15:02:17');

-- --------------------------------------------------------

--
-- Table structure for table `clinic_settings`
--

CREATE TABLE `clinic_settings` (
  `setting_id` int UNSIGNED NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clinic_settings`
--

INSERT INTO `clinic_settings` (`setting_id`, `setting_key`, `setting_value`, `description`) VALUES
(1, 'clinic_open_time', '09:00', 'Clinic opening time'),
(2, 'clinic_close_time', '17:00', 'Clinic closing time'),
(3, 'break_start', '13:00', 'Lunch break start time'),
(4, 'break_end', '14:00', 'Lunch break end time'),
(5, 'phone_buffer_minutes', '60', 'Buffer time for phone bookings'),
(6, 'slot_interval_minutes', '30', 'Standard appointment slot granularity');

-- --------------------------------------------------------

--
-- Table structure for table `dentists`
--

CREATE TABLE `dentists` (
  `dentist_id` int UNSIGNED NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialisation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General Dentistry',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apc_expiry_date` date DEFAULT NULL,
  `apc_status` enum('valid','expiring','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valid',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dentists`
--

INSERT INTO `dentists` (`dentist_id`, `full_name`, `specialisation`, `phone`, `email`, `photo_path`, `apc_expiry_date`, `apc_status`, `created_at`) VALUES
(1, 'Dr. Zarith Sofia', 'Orthodontics & General', '+60 19-876 5432', 'dr.zarith@kpsts.com', 'assets/img/dentist-zar.jpg', '2026-12-31', 'valid', '2026-11-01 13:35:48'),
(2, 'Dr. Faizal bin Azman', 'Oral Surgery & Implants', '+60 17-654 3210', 'dr.faizal@kpsts.com', 'assets/img/dentist-faizal.jpg', '2026-11-20', 'expiring', '2026-11-01 13:35:48');

-- --------------------------------------------------------

--
-- Table structure for table `dentist_leave`
--

CREATE TABLE `dentist_leave` (
  `leave_id` int UNSIGNED NOT NULL,
  `dentist_id` int UNSIGNED NOT NULL,
  `leave_date` date NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_by` int UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dentist_leave`
--

INSERT INTO `dentist_leave` (`leave_id`, `dentist_id`, `leave_date`, `reason`, `created_by`, `created_at`) VALUES
(1, 2, '2026-11-15', 'Attending National Dental Surgery Conference in KL', 1, '2026-11-01 13:35:48');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_11_01_000001_create_dentists_table', 1),
(2, '2026_11_01_000002_create_users_table', 1),
(3, '2026_11_01_000003_create_patients_table', 1),
(4, '2026_11_01_000004_create_treatments_table', 1),
(5, '2026_11_01_000005_create_appointments_table', 1),
(6, '2026_11_01_000006_create_reminders_table', 1),
(7, '2026_11_01_000007_create_dentist_leave_table', 1),
(8, '2026_11_01_000008_create_clinic_settings_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int UNSIGNED NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `full_name`, `phone_number`, `email`, `created_at`) VALUES
(1, 'Aina Sofea Abdullah', '+60 12-345 6789', 'aina.sofea@example.com', '2026-11-01 13:35:48'),
(2, 'Tan Wei Ming', '+60 16-789 0123', 'weiming.tan@example.com', '2026-11-01 13:35:48'),
(3, 'Priya a/p Mohan', '+60 17-345 6789', 'priya.mohan@example.com', '2026-11-01 13:35:48'),
(4, 'Muhammad Faiz bin Harun', '+60 13-456 7890', 'faiz.harun@example.com', '2026-11-01 13:35:48'),
(5, 'Lee Siew Lan', '+60 19-331 4482', 'siewlan.lee@example.com', '2026-11-01 13:35:48'),
(6, 'Suresh a/l Krishnan', '+60 14-567 8901', 'suresh.k@example.com', '2026-11-01 13:35:48'),
(7, 'Siti Khadijah binti Rahman', '+60 18-901 2345', 'khadijah.rahman@example.com', '2026-11-01 13:35:48'),
(8, 'Chong Wei Lun', '+60 12-881 2938', 'weilun.chong@example.com', '2026-11-01 13:35:48'),
(9, 'Kavitha a/p Subramaniam', '+60 11-234 5678', 'kavitha.s@example.com', '2026-11-01 13:35:48'),
(10, 'Nurul Hidayah binti Ahmad', '+60 19-012 3456', 'nurul.hidayah@example.com', '2026-11-01 13:35:48'),
(16, 'Test MVC Patient', '+60 12-999 8888', NULL, '2026-11-01 14:31:50'),
(17, 'Nur Aisyah Test', '+60 19-888 7777', NULL, '2026-11-01 14:46:47'),
(19, 'hasnul', '999', NULL, '2026-11-01 15:01:10'),
(20, 'ff', '88', NULL, '2026-11-01 15:02:17');

-- --------------------------------------------------------

--
-- Table structure for table `reminders`
--

CREATE TABLE `reminders` (
  `reminder_id` int UNSIGNED NOT NULL,
  `appointment_id` int UNSIGNED NOT NULL,
  `patient_id` int UNSIGNED NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Pending','Sent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `sent_at` datetime DEFAULT NULL,
  `lang` enum('bm','en') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bm',
  `is_customized` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reminders`
--

INSERT INTO `reminders` (`reminder_id`, `appointment_id`, `patient_id`, `message`, `status`, `sent_at`, `lang`, `is_customized`, `created_at`) VALUES
(1, 7, 1, 'Peringatan Temujanji: Aina Sofea Abdullah di Klinik Pergigian Sofea Taman Tas pada Isnin, 02 Nov 2026 jam 09:00 AM (Teeth Whitening) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Sent', '2026-11-01 20:15:00', 'bm', 0, '2026-11-01 13:35:48'),
(2, 8, 7, 'Peringatan Temujanji: Siti Khadijah binti Rahman di Klinik Pergigian Sofea Taman Tas pada Isnin, 02 Nov 2026 jam 10:30 AM (Scaling & Polishing) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Sent', '2026-11-01 20:20:00', 'bm', 0, '2026-11-01 13:35:48'),
(3, 9, 8, 'Appointment Reminder: Chong Wei Lun at Klinik Pergigian Sofea Taman Tas on Monday, 02 Nov 2026 at 02:00 PM (Minor Oral Surgery) with Dr. Faizal bin Azman. Please reply Y to confirm.', 'Pending', NULL, 'en', 0, '2026-11-01 13:35:48'),
(4, 10, 9, 'Peringatan Temujanji: Kavitha a/p Subramaniam di Klinik Pergigian Sofea Taman Tas pada Isnin, 02 Nov 2026 jam 03:30 PM (Veneers) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 13:35:48'),
(5, 11, 10, 'Peringatan Temujanji: Nurul Hidayah binti Ahmad di Klinik Pergigian Sofea Taman Tas pada Rabu, 04 Nov 2026 jam 09:30 AM (Dental Fillings) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 13:35:48'),
(6, 12, 2, 'Peringatan Temujanji: Tan Wei Ming di Klinik Pergigian Sofea Taman Tas pada Khamis, 05 Nov 2026 jam 11:00 AM (Scaling & Polishing) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 13:35:48'),
(12, 19, 16, 'Peringatan Temujanji: Test MVC Patient di Klinik Pergigian Sofea Taman Tas pada Thursday, 05 Nov 2026 jam 10:00 AM (Scaling & Polishing) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 14:33:05'),
(13, 20, 17, 'Peringatan Temujanji: Nur Aisyah Test di Klinik Pergigian Sofea Taman Tas pada Friday, 06 Nov 2026 jam 09:30 AM (Check-up & Consultation) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Sent', '2026-11-01 22:48:34', 'bm', 0, '2026-11-01 14:46:47'),
(15, 22, 19, 'Peringatan Temujanji: hasnul di Klinik Pergigian Sofea Taman Tas pada Wednesday, 04 Nov 2026 jam 10:30 AM (Check-up & Consultation) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 15:01:37'),
(16, 23, 20, 'Peringatan Temujanji: ff di Klinik Pergigian Sofea Taman Tas pada Wednesday, 04 Nov 2026 jam 10:00 AM (Check-up & Consultation) bersama Dr. Zarith Sofia. Sila balas Y untuk sahkan.', 'Pending', NULL, 'bm', 0, '2026-11-01 15:02:17');

-- --------------------------------------------------------

--
-- Table structure for table `treatments`
--

CREATE TABLE `treatments` (
  `treatment_id` int UNSIGNED NOT NULL,
  `treatment_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_minutes` int NOT NULL DEFAULT '30'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `treatments`
--

INSERT INTO `treatments` (`treatment_id`, `treatment_name`, `duration_minutes`) VALUES
(1, 'Check-up & Consultation', 30),
(2, 'Scaling & Polishing', 30),
(3, 'Dental Fillings', 30),
(4, 'Tooth Extraction', 30),
(5, 'Teeth Whitening', 60),
(6, 'Minor Oral Surgery (MOS)', 60),
(7, 'Crowns & Dental Bridges', 60),
(8, 'Veneers', 60),
(9, 'Braces Consultation & Treatment', 45);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int UNSIGNED NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','dentist') COLLATE utf8mb4_unicode_ci NOT NULL,
  `dentist_id` int UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `role`, `dentist_id`, `is_active`, `created_at`) VALUES
(1, 'admin', '$2y$10$XnSadGKpmsQdz4uLAIZOIurqWDbtUngEnD5CXbHXUE24XAw65thKW', 'admin', NULL, 1, '2026-11-01 13:35:48'),
(2, 'drzarith', '$2y$10$3QkRqwpUMYxMgwZ.MiaZiu6Umb1upwr1ZY339ULZhPWopO9aOiXk2', 'dentist', 1, 1, '2026-11-01 13:35:48'),
(3, 'drfaizal', '$2y$10$H8nWRn25T3ugBDa0L/gjLOzMkMQ19gj9mZvZW8fSOuXlrXXhDNm2C', 'dentist', 2, 1, '2026-11-01 13:35:48');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `appointments_patient_id_foreign` (`patient_id`),
  ADD KEY `appointments_dentist_id_foreign` (`dentist_id`),
  ADD KEY `appointments_treatment_id_foreign` (`treatment_id`),
  ADD KEY `appointments_created_by_foreign` (`created_by`);

--
-- Indexes for table `clinic_settings`
--
ALTER TABLE `clinic_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `clinic_settings_setting_key_unique` (`setting_key`);

--
-- Indexes for table `dentists`
--
ALTER TABLE `dentists`
  ADD PRIMARY KEY (`dentist_id`);

--
-- Indexes for table `dentist_leave`
--
ALTER TABLE `dentist_leave`
  ADD PRIMARY KEY (`leave_id`),
  ADD UNIQUE KEY `uq_dentist_leave` (`dentist_id`,`leave_date`),
  ADD KEY `dentist_leave_created_by_foreign` (`created_by`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `patients_phone_number_unique` (`phone_number`);

--
-- Indexes for table `reminders`
--
ALTER TABLE `reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `reminders_appointment_id_foreign` (`appointment_id`),
  ADD KEY `reminders_patient_id_foreign` (`patient_id`);

--
-- Indexes for table `treatments`
--
ALTER TABLE `treatments`
  ADD PRIMARY KEY (`treatment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD KEY `users_dentist_id_foreign` (`dentist_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `clinic_settings`
--
ALTER TABLE `clinic_settings`
  MODIFY `setting_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `dentists`
--
ALTER TABLE `dentists`
  MODIFY `dentist_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dentist_leave`
--
ALTER TABLE `dentist_leave`
  MODIFY `leave_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `reminder_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `treatments`
--
ALTER TABLE `treatments`
  MODIFY `treatment_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_dentist_id_foreign` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`dentist_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_treatment_id_foreign` FOREIGN KEY (`treatment_id`) REFERENCES `treatments` (`treatment_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `dentist_leave`
--
ALTER TABLE `dentist_leave`
  ADD CONSTRAINT `dentist_leave_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `dentist_leave_dentist_id_foreign` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`dentist_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reminders`
--
ALTER TABLE `reminders`
  ADD CONSTRAINT `reminders_appointment_id_foreign` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reminders_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_dentist_id_foreign` FOREIGN KEY (`dentist_id`) REFERENCES `dentists` (`dentist_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
