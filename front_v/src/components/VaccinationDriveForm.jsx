import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const VaccinationDriveForm = () => {
  const [driveDate, setDriveDate] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [availableDoses, setAvailableDoses] = useState('');
  const [applicableClasses, setApplicableClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchDrive = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/schools/1/vaccination_drives/${id}`, { // Assuming school ID 1
            headers: {
              'Authorization': token,
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setDriveDate(data.drive_date);
          setVaccineName(data.vaccine_name);
          setAvailableDoses(data.available_doses);
          setApplicableClasses(data.applicable_classes);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDrive();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const driveData = {
      drive_date: driveDate,
      vaccine_name: vaccineName,
      available_doses: parseInt(availableDoses),
      applicable_classes: applicableClasses,
    };

    try {
      const token = localStorage.getItem('token');
      const method = id ? 'PUT' : 'POST';
      const url = id ? `http://localhost:5000/schools/1/vaccination_drives/${id}` : 'http://localhost:5000/schools/1/vaccination_drives'; // Assuming school ID 1

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(driveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      navigate('/drives');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading form...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>{id ? 'Edit Vaccination Drive' : 'Add Vaccination Drive'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="driveDate">Date:</label>
          <input type="date" id="driveDate" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="vaccineName">Vaccine Name:</label>
          <input type="text" id="vaccineName" value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="availableDoses">Available Doses:</label>
          <input type="number" id="availableDoses" value={availableDoses} onChange={(e) => setAvailableDoses(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="applicableClasses">Applicable Classes:</label>
          <input type="text" id="applicableClasses" value={applicableClasses} onChange={(e) => setApplicableClasses(e.target.value)} required />
        </div>
        <button type="submit">{id ? 'Update Drive' : 'Add Drive'}</button>
      </form>
    </div>
  );
};

export default VaccinationDriveForm;