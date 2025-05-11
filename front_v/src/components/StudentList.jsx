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
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentVaccinations, setStudentVaccinations] = useState([]);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch students with vaccination data
        const studentsResponse = await fetch('http://localhost:5000/schools/1/students?include_vaccinations=true', {
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

  const fetchStudentVaccinations = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/schools/1/students/${studentId}/vaccinations`,
        { headers: { 'Authorization': token } }
      );
      if (!response.ok) throw new Error('Failed to fetch vaccinations');
      const data = await response.json();
      setStudentVaccinations(data);
    } catch (err) {
      setError(err);
    }
  };

  const handleViewVaccinations = (student) => {
    setSelectedStudent(student);
    fetchStudentVaccinations(student.student_id);
    setShowVaccinationModal(true);
  };

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
      setNotification({ type: 'error', message: 'Please select a vaccination drive first' });
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

      const result = await response.json();
      setNotification({ type: 'success', message: result.message });

      // Refresh the student list
      const updatedResponse = await fetch('http://localhost:5000/schools/1/students?include_vaccinations=true', {
        headers: { 'Authorization': token },
      });
      const updatedData = await updatedResponse.json();
      setStudents(updatedData);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  if (loading) return <div className="p-4">Loading student list...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Student List</h2>
      
      {notification && (
        <div className={`mb-4 p-4 rounded ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination</label>
            <select
              value={filterVaccination}
              onChange={(e) => setFilterVaccination(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Students</option>
              <option value="vaccinated">Vaccinated</option>
              <option value="not_vaccinated">Not Vaccinated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drive</label>
            <select
              value={selectedDrive}
              onChange={(e) => setSelectedDrive(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select Drive</option>
              {vaccineDrives.map(drive => (
                <option key={drive.drive_id} value={drive.drive_id}>
                  {drive.vaccine_name} ({new Date(drive.drive_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <Link 
              to="/students/new" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Student
            </Link>
            <Link 
              to="/students/bulk" 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Bulk Import
            </Link>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccinations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <tr key={student.student_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{student.student_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.student_class}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.vaccinations?.length > 0 ? (
                      <span className="text-green-600">
                        {student.vaccinations.length} vaccine(s)
                      </span>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                    <Link
                      to={`/students/${student.student_id}/edit`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleViewVaccinations(student)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      View Vaccines
                    </button>
                    {selectedDrive && (
                      <button
                        onClick={() => handleMarkVaccinated(student.student_id)}
                        className={`${
                          student.vaccinations?.some(v => v.drive_id === parseInt(selectedDrive)) ?
                          'text-gray-400 cursor-not-allowed' : 'text-green-500 hover:text-green-700'
                        }`}
                        disabled={student.vaccinations?.some(v => v.drive_id === parseInt(selectedDrive))}
                      >
                        {student.vaccinations?.some(v => v.drive_id === parseInt(selectedDrive)) ?
                          'Vaccinated' : 'Mark Vaccinated'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vaccination Modal */}
      {showVaccinationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Vaccination Records for {selectedStudent.first_name} {selectedStudent.last_name}
            </h3>
            
            {studentVaccinations.length > 0 ? (
              <table className="min-w-full mb-4">
                <thead>
                  <tr>
                    <th className="text-left">Vaccine</th>
                    <th className="text-left">Drive Date</th>
                    <th className="text-left">Vaccination Date</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentVaccinations.map(vaccination => (
                    <tr key={vaccination.vaccination_id}>
                      <td>{vaccination.vaccine_name}</td>
                      <td>
                        {vaccination.drive?.drive_date ? 
                          new Date(vaccination.drive.drive_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>{new Date(vaccination.vaccination_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs ${
                          vaccination.vaccinated_status ? 
                            'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vaccination.vaccinated_status ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 mb-4">No vaccination records found for this student.</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowVaccinationModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;