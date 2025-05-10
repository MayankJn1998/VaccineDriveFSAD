import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const StudentForm = () => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams(); // Get student ID from URL

  useEffect(() => {
    if (id) {
      // If ID exists, fetch student data for editing
      setLoading(true);
      // Simulate fetching student data
      const fetchStudent = async () => {
        try{
          await new Promise(resolve => setTimeout(resolve, 500));
          const studentData = {id: id, name: 'John Doe', class: '10A', studentId: 'S001' };
          setName(studentData.name);
          setClassName(studentData.class);
          setStudentId(studentData.studentId);
        }
        catch(e){
          setError(e);
        }
        finally{
          setLoading(false);
        }

      }
      fetchStudent();

    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement form submission logic (e.g., API call to create or update)
    if (id) {
      //update
      console.log('update student', { id, name, className, studentId });
    } else {
      //add
      console.log('add student', { name, className, studentId });
    }

    // After successful submission, redirect
    navigate('/students');
  };

  if(loading){
    return <div>Loading Form...</div>
  }

  if(error){
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h2>{id ? 'Edit Student' : 'Add Student'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="className">Class:</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="studentId">Student ID:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <button type="submit">{id ? 'Update Student' : 'Add Student'}</button>
      </form>
    </div>
  );
};

export default StudentForm;
