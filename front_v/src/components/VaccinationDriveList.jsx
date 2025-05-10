import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const VaccinationDriveList = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate fetching vaccination drives from an API
    const fetchData = async () => {
      try {
         await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = [
          { id: 1, date: '2024-03-10', vaccineName: 'Vaccine A', doses: 100, classes: 'Grades 5-7' },
          { id: 2, date: '2024-03-20', vaccineName: 'Vaccine B', doses: 150, classes: 'Grades 8-10' },
        ];
        setDrives(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading vaccination drives...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Vaccination Drives</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vaccine Name</th>
            <th>Available Doses</th>
            <th>Applicable Classes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drives.map((drive) => (
            <tr key={drive.id}>
              <td>{drive.date}</td>
              <td>{drive.vaccineName}</td>
              <td>{drive.doses}</td>
              <td>{drive.classes}</td>
              <td>
                <Link to={`/drives/${drive.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/drives/new">Add New Drive</Link>
    </div>
  );
};

export default VaccinationDriveList;