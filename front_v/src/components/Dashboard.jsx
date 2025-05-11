import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_students: 0,
    vaccinated_students: 0,
    upcoming_drives: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/schools/1/dashboard', { // Assuming a single school with ID 1 for now
          headers: {
            'Authorization': token,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total Students: {dashboardData.total_students}</p>
      <p>
        Vaccinated Students: {dashboardData.vaccinated_students} (
        {dashboardData.vaccinated_percentage ? dashboardData.vaccinated_percentage.toFixed(2) : '0'}
        %)
      </p>
      <div>
        <h3>Upcoming Vaccination Drives</h3>
        {dashboardData.upcoming_drives && dashboardData.upcoming_drives.length > 0 ? (
          <ul>
            {dashboardData.upcoming_drives.map((drive) => (
              <li key={drive.drive_id}>
                Date: {new Date(drive.drive_date).toLocaleDateString()}, Vaccine: {drive.vaccine_name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming drives scheduled.</p>
        )}
      </div>
      <Link to="/students">Manage Students</Link> |<Link to="/drives">Manage Drives</Link> |
      <Link to="/reports">Generate Reports</Link>
    </div>
  );
};

export default Dashboard;