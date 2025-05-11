# VaccineDriveFSAD

# School Vaccination Management System - Frontend

This repository contains the frontend code for a School Vaccination Management System. Built with React, it provides an interface for school administrators to manage student records, vaccination drives, and generate reports.

## Key Features

* **Authentication:** Secure login for administrators.
* **Dashboard:** Overview of key vaccination statistics and upcoming drives.
* **Student Management:**
    * View, search, and filter student records.
    * Add and edit individual student details.
    * Bulk import students from CSV files.
* **Vaccination Drive Management:**
    * View upcoming and past vaccination drives.
    * Create and edit vaccination drive schedules.
* **Reporting:** Generate and export reports on student vaccination data (CSV, Excel, PDF).

## Technologies Used

* React
* React Router DOM
* Fetch API
* `localStorage`
* `papaparse`
* `file-saver`
* `jspdf` and `jspdf-autotable`
* `react-toastify`

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Endpoint:**
    * Locate API calls within the component files (e.g., `Dashboard.jsx`, `StudentList.jsx`).
    * Ensure the API endpoint URL in these calls points to the correct backend server.

4. Run flask application by:
   ```bash
    python .\app.py

5.  **Start the development server:**
    ```bash
    npm run dev


    This will run the application in development mode, usually accessible at `http://localhost:3000`.

## Important Notes

* This is the frontend part of the application. A backend API is required for data persistence and authentication.
* The login functionality (`Login.jsx`) simulates authentication or relies on an external API for actual user verification.
* Ensure the backend API is running and accessible before using this frontend application.