import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterVaccination, setFilterVaccination] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [vaccineDrives, setVaccineDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch students
        const studentsResponse = await fetch('http://localhost:5000/schools/1/students', {
          headers: { 'Authorization': token },
        });
        if (!studentsResponse.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
        
        // Fetch school classes
        const schoolResponse = await fetch('http://localhost:5000/schools/1', {
          headers: { 'Authorization': token },
        });
        if (!schoolResponse.ok) throw new Error('Failed to fetch school data');
        const schoolData = await schoolResponse.json();
        setAvailableClasses(schoolData.classes.split(','));

        // Fetch vaccination drives
        const drivesResponse = await fetch('http://localhost:5000/schools/1/drives', {
          headers: { 'Authorization': token },
        });
        if (!drivesResponse.ok) throw new Error('Failed to fetch drives');
        const drivesData = await drivesResponse.json();
        setVaccineDrives(drivesData);
        
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toString().includes(searchTerm);
    
    const matchesClass = filterClass ? student.student_class === filterClass : true;
    
    const matchesVaccination = filterVaccination ? 
      (filterVaccination === 'vaccinated' ? 
        student.vaccinations && student.vaccinations.length > 0 :
        student.vaccinations && student.vaccinations.length === 0) : true;
    
    return matchesSearch && matchesClass && matchesVaccination;
  });

  const handleMarkVaccinated = async (studentId) => {
    if (!selectedDrive) {
      alert('Please select a vaccination drive first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/schools/1/students/${studentId}/vaccinate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ drive_id: selectedDrive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as vaccinated');
      }

      // Refresh the student list
      const updatedResponse = await fetch('http://localhost:5000/schools/1/students', {
        headers: { 'Authorization': token },
      });
      const updatedData = await updatedResponse.json();
      setStudents(updatedData);
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <div>Loading student list...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container">
      <h2>Student List</h2>
      
      {/* Search and Filters */}
      <div className="filters mb-4">
        <div className="row">
          <div className="col-md-3">
            <input
              type="text"
              placeholder="Search by name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="form-control"
            >
              <option value="">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              value={filterVaccination}
              onChange={(e) => setFilterVaccination(e.target.value)}
              className="form-control"
            >
              <option value="">All Vaccination</option>
              <option value="vaccinated">Vaccinated</option>
              <option value="not_vaccinated">Not Vaccinated</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              value={selectedDrive}
              onChange={(e) => setSelectedDrive(e.target.value)}
              className="form-control"
            >
              <option value="">Select Vaccination Drive</option>
              {vaccineDrives.map(drive => (
                <option key={drive.drive_id} value={drive.drive_id}>
                  {drive.vaccine_name} ({drive.drive_date})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <Link to="/students/new" className="btn btn-primary">Add Student</Link>
            <Link to="/students/bulk" className="btn btn-secondary ml-2">Bulk Import</Link>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Class</th>
            <th>Vaccination Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map(student => (
            <tr key={student.student_id}>
              <td>{student.student_id}</td>
              <td>{student.first_name} {student.last_name}</td>
              <td>{student.student_class}</td>
              <td>
                {student.vaccinations && student.vaccinations.length > 0 ? (
                  <span className="text-success">
                    Vaccinated ({student.vaccinations.map(v => v.vaccine_name).join(', ')})
                  </span>
                ) : (
                  <span className="text-danger">Not Vaccinated</span>
                )}
              </td>
              <td>
                <Link 
                  to={`/students/${student.student_id}/edit`} 
                  className="btn btn-sm btn-info mr-2"
                >
                  Edit
                </Link>
                {selectedDrive && (
                  <button
                    onClick={() => handleMarkVaccinated(student.student_id)}
                    className="btn btn-sm btn-success"
                    disabled={student.vaccinations && 
                      student.vaccinations.some(v => v.drive_id === parseInt(selectedDrive))}
                  >
                    {student.vaccinations && 
                    student.vaccinations.some(v => v.drive_id === parseInt(selectedDrive)) ?
                    'Already Vaccinated' : 'Mark Vaccinated'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;