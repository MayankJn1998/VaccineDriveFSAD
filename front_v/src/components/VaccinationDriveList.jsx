import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const VaccinationDriveList = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/schools/1/vaccination_drives', { // Assuming school ID 1
          headers: {
            'Authorization': token,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDrives(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrives();
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
            <tr key={drive.drive_id}>
              <td>{new Date(drive.drive_date).toLocaleDateString()}</td>
              <td>{drive.vaccine_name}</td>
              <td>{drive.available_doses}</td>
              <td>{drive.applicable_classes}</td>
              <td>
                <Link to={`/drives/${drive.drive_id}/edit`}>Edit</Link>
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