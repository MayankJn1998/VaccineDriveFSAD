import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Simulate fetching students from an API
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
        const data = [
          { id: 1, name: 'John Doe', class: '10A', studentId: 'S001', vaccinationStatus: 'Vaccinated' },
          { id: 2, name: 'Jane Smith', class: '10B', studentId: 'S002', vaccinationStatus: 'Not Vaccinated' },
          { id: 3, name: 'Bob Johnson', class: '11A', studentId: 'S003', vaccinationStatus: 'Vaccinated' },
        ];
        setStudents(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.class.toLowerCase().includes(search.toLowerCase()) ||
    student.studentId.toLowerCase().includes(search.toLowerCase()) ||
    student.vaccinationStatus.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div>Loading student list...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Student List</h2>
      <input
        type="text"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Student ID</th>
            <th>Vaccination Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{student.class}</td>
              <td>{student.studentId}</td>
              <td>{student.vaccinationStatus}</td>
              <td>
                <Link to={`/students/${student.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/students/new">Add New Student</Link>
    </div>
  );
};

export default StudentList;