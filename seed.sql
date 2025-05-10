-- 1. Clear existing data (optional)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE vaccinations;
TRUNCATE TABLE vaccination_drives;
TRUNCATE TABLE students;
TRUNCATE TABLE schools;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. Insert schools
INSERT INTO schools (school_name) VALUES
('Springfield Elementary'),
('Shelbyville High'),
('Evergreen Academy'),
('Maplewood International'),
('Oakridge Public School');

-- 3. Insert students
INSERT INTO students (school_id, first_name, last_name) VALUES
(1, 'Bart', 'Simpson'),
(1, 'Lisa', 'Simpson'),
(1, 'Milhouse', 'Van Houten'),
(2, 'Jessica', 'Lovejoy'),
(2, 'Database', 'Admin'),
(3, 'Martin', 'Prince'),
(3, 'Sherri', 'Mackleberry'),
(4, 'Terri', 'Mackleberry'),
(5, 'Nelson', 'Muntz'),
(5, 'Ralph', 'Wiggum');

-- 4. Insert vaccination drives
INSERT INTO vaccination_drives (school_id, drive_date, vaccine_name, available_doses, applicable_classes) VALUES
(1, '2023-11-15', 'Polio Vaccine', 200, '1-5'),
(1, '2023-11-20', 'MMR', 150, '1-12'),
(2, '2023-11-17', 'Hepatitis B', 100, '6-12'),
(3, '2023-11-22', 'Tetanus', 80, '9-12'),
(4, '2023-11-25', 'Flu Shot', 300, 'All'),
(5, '2023-11-30', 'COVID-19 Booster', 250, 'All');

-- 5. Insert vaccination records
INSERT INTO vaccinations (student_id, drive_id, vaccine_name, vaccination_date, vaccinated_status) VALUES
(1, 1, 'Polio Vaccine', '2023-11-15', TRUE),
(2, 1, 'Polio Vaccine', '2023-11-15', TRUE),
(3, 1, 'Polio Vaccine', '2023-11-15', FALSE),
(4, 3, 'Hepatitis B', '2023-11-17', TRUE),
(5, 3, 'Hepatitis B', '2023-11-17', TRUE),
(6, 4, 'Tetanus', '2023-11-22', TRUE),
(7, 2, 'MMR', '2023-11-20', FALSE),
(8, 5, 'Flu Shot', '2023-11-25', TRUE),
(9, 6, 'COVID-19 Booster', '2023-11-30', FALSE),
(10, 6, 'COVID-19 Booster', '2023-11-30', TRUE);

-- 6. Verify data
SELECT s.school_name, COUNT(st.student_id) AS students 
FROM schools s
LEFT JOIN students st ON s.school_id = st.school_id
GROUP BY s.school_name;

SELECT vd.drive_date, vd.vaccine_name, COUNT(v.vaccination_id) AS vaccinations_administered
FROM vaccination_drives vd
LEFT JOIN vaccinations v ON vd.drive_id = v.drive_id
GROUP BY vd.drive_id;