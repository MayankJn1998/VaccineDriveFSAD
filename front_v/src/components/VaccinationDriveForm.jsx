import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const VaccinationDriveForm = () => {
  const [date, setDate] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [doses, setDoses] = useState('');
  const [classes, setClasses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchDrive = async()=>{
        try{
          await new Promise(resolve => setTimeout(resolve, 500));
          const driveData = {id: id, date: '2024-03-10', vaccineName:'Vaccine A', doses: 100, classes: 'Grades 5-7' };
          setDate(driveData.date);
          setVaccineName(driveData.vaccineName);
          setDoses(driveData.doses);
          setClasses(driveData.classes);
        }
        catch(e){
          setError(e);
        }
        finally{
          setLoading(false);
        }
      }
      fetchDrive();
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement form submission (e.g., API call)
    if(id){
      console.log('update drive', {id, date, vaccineName, doses, classes});
    }
    else{
      console.log('add drive', { date, vaccineName, doses, classes });
    }
    navigate('/drives');
  };

  if(loading){
    return <div>Loading form...</div>
  }

  if(error){
    return <div>{error.message}</div>
  }

  return (
    <div>
      <h2>{id ? 'Edit Vaccination Drive' : 'Add Vaccination Drive'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="vaccineName">Vaccine Name:</label>
          <input
            type="text"
            id="vaccineName"
            value={vaccineName}
            onChange={(e) => setVaccineName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="doses">Available Doses:</label>
          <input
            type="number"
            id="doses"
            value={doses}
            onChange={(e) => setDoses(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="classes">Applicable Classes:</label>
          <input
            type="text"
            id="classes"
            value={classes}
            onChange={(e) => setClasses(e.target.value)}
            required
          />
        </div>
        <button type="submit">{id? 'Update Drive' : 'Add Drive'}</button>
      </form>
    </div>
  );
};

export default VaccinationDriveForm;