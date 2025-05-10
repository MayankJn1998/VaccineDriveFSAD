import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    vaccinatedStudents: 0,
    upcomingDrives: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate fetching dashboard data from an API
    const fetchData = async () => {
      try {
        // Replace with your actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
        const data = {
          totalStudents: 1000,
          vaccinatedStudents: 600,
          upcomingDrives: [
            { id: 1, date: '2024-03-10', vaccine: 'Vaccine A' },
            { id: 2, date: '2024-03-20', vaccine: 'Vaccine B' },
          ],
        };
        setDashboardData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      <p>Total Students: {dashboardData.totalStudents}</p>
      <p>
        Vaccinated Students: {dashboardData.vaccinatedStudents} (
        {(
          (dashboardData.vaccinatedStudents / dashboardData.totalStudents) *
          100
        ).toFixed(2)}
        %)
      </p>
      <div>
        <h3>Upcoming Vaccination Drives</h3>
        {dashboardData.upcomingDrives.length > 0 ? (
          <ul>
            {dashboardData.upcomingDrives.map((drive) => (
              <li key={drive.id}>
                Date: {drive.date}, Vaccine: {drive.vaccine}
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
