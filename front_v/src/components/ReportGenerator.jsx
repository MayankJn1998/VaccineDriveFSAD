import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';


const ReportGenerator = () => {
  const { schoolId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vaccineName: '',
    vaccinatedStatus: '',
    studentClass: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10
  });
  const [vaccineOptions, setVaccineOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch students with vaccination data
        const studentsResponse = await fetch(
          `http://localhost:5000/schools/1/students?include_vaccinations=true`, 
          {
            headers: { 'Authorization': token },
          }
        );
        
        if (!studentsResponse.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Fetch school data for class options
        const schoolResponse = await fetch(
          `http://localhost:5000/schools/1`,
          {
            headers: { 'Authorization': token },
          }
        );
        
        if (!schoolResponse.ok) throw new Error('Failed to fetch school data');
        const schoolData = await schoolResponse.json();
        setClassOptions(schoolData.classes.split(','));

        // Extract unique vaccine names from students' vaccinations
        const vaccines = new Set();
        studentsData.forEach(student => {
          student.vaccinations?.forEach(v => vaccines.add(v.vaccine_name));
        });
        setVaccineOptions(Array.from(vaccines));

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const filteredStudents = students.filter(student => {
    // Filter by vaccine name
    if (filters.vaccineName && 
        !student.vaccinations?.some(v => v.vaccine_name === filters.vaccineName)) {
      return false;
    }
    
    // Filter by vaccination status
    if (filters.vaccinatedStatus === 'vaccinated' && !student.vaccinations?.length) {
      return false;
    }
    if (filters.vaccinatedStatus === 'not_vaccinated' && student.vaccinations?.length) {
      return false;
    }
    
    // Filter by class
    if (filters.studentClass && student.student_class !== filters.studentClass) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        student.first_name.toLowerCase().includes(query) ||
        student.last_name.toLowerCase().includes(query) ||
        student.student_id.toString().includes(query)
      );
    }
    
    return true;
  });

  // Pagination logic
  const indexOfLastItem = pagination.currentPage * pagination.itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - pagination.itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / pagination.itemsPerPage);

  const paginate = (pageNumber) => setPagination(prev => ({ ...prev, currentPage: pageNumber }));

  const exportToCSV = () => {
    const data = filteredStudents.map(student => {
      const baseData = {
        'Student ID': student.student_id,
        'First Name': student.first_name,
        'Last Name': student.last_name,
        'Class': student.student_class,
        'Total Vaccinations': student.vaccinations?.length || 0
      };
      
      // Add vaccination details
      student.vaccinations?.forEach((v, i) => {
        baseData[`Vaccine ${i+1} Name`] = v.vaccine_name;
        baseData[`Vaccine ${i+1} Date`] = v.vaccination_date;
        baseData[`Vaccine ${i+1} Status`] = v.vaccinated_status ? 'Vaccinated' : 'Not Vaccinated';
      });
      
      return baseData;
    });
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `vaccination_report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportToExcel = () => {
    // For actual Excel export, you might want to use a library like xlsx
    // This is a simple CSV export with .xlsx extension
    exportToCSV(); // Using CSV as a simple alternative
    toast.info('For full Excel support, consider implementing the xlsx library');
  };

  /*const exportToPDF = () => {
    const doc = new jsPDF();
    const title = 'Vaccination Report';
    const date = new Date().toLocaleDateString();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 22);
    
    // Prepare data for the table
    const headers = [
      'ID',
      'Name',
      'Class',
      'Vaccine',
      'Date',
      'Status'
    ];
    
    const data = filteredStudents.flatMap(student => {
      if (student.vaccinations?.length) {
        return student.vaccinations.map(v => [
          student.student_id,
          `${student.first_name} ${student.last_name}`,
          student.student_class,
          v.vaccine_name,
          v.vaccination_date,
          v.vaccinated_status ? 'Vaccinated' : 'Not Vaccinated'
        ]);
      }
      return [[
        student.student_id,
        `${student.first_name} ${student.last_name}`,
        student.student_class,
        'N/A',
        'N/A',
        'Not Vaccinated'
      ]];
    });
    
    // Add table
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      }
    });
    
    doc.save(`vaccination_report_${new Date().toISOString().slice(0,10)}.pdf`);
  };*/

  const exportToPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Vaccination Report", 14, 15);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

  // Custom table drawing
  let startY = 30;
  const columnTitles = ["ID", "Name", "Class", "Vaccine", "Date", "Status"];
  const columnWidths = [15, 45, 20, 35, 25, 25];

  // Drawing column titles
  columnTitles.forEach((title, i) => {
    doc.text(title, 14 + columnWidths.slice(0, i).reduce((acc, v) => acc + v, 0), startY);
  });

  startY += 8;

  // Adding rows
  filteredStudents.forEach(student => {
    student.vaccinations.forEach(v => {
      doc.text(String(student.student_id), 14, startY);
      doc.text(`${student.first_name} ${student.last_name}`, 29, startY);
      doc.text(student.student_class, 74, startY);
      doc.text(v.vaccine_name, 94, startY);
      doc.text(v.vaccination_date, 129, startY);
      doc.text(v.vaccinated_status ? 'Vaccinated' : 'Not Vaccinated', 154, startY);
      startY += 8;
      
      // Check if we need a new page
      if (startY > 280) {
        doc.addPage();
        startY = 30;
      }
    });
  });

  doc.save(`vaccination_report_${new Date().toISOString().slice(0, 10)}.pdf`);
};



  if (loading) return <div className="p-4">Loading report data...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Vaccination Report</h2>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
            <select
              name="vaccineName"
              value={filters.vaccineName}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Vaccines</option>
              {vaccineOptions.map(vaccine => (
                <option key={vaccine} value={vaccine}>{vaccine}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccination Status</label>
            <select
              name="vaccinatedStatus"
              value={filters.vaccinatedStatus}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Statuses</option>
              <option value="vaccinated">Vaccinated</option>
              <option value="not_vaccinated">Not Vaccinated</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              name="studentClass"
              value={filters.studentClass}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Classes</option>
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <input
              type="text"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Search by name or ID"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Export to CSV
        </button>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Export to Excel
        </button>
        <button
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Export to PDF
        </button>
      </div>
      
      {/* Results Count */}
      <div className="mb-2 text-sm text-gray-600">
        Showing {filteredStudents.length} students ({currentItems.length} on this page)
      </div>
      
      {/* Report Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map(student => (
                  student.vaccinations?.length > 0 ? (
                    student.vaccinations.map((vaccination, idx) => (
                      <tr key={`${student.student_id}-${idx}`}>
                        {idx === 0 && (
                          <>
                            <td rowSpan={student.vaccinations.length} className="px-6 py-4 whitespace-nowrap">
                              {student.student_id}
                            </td>
                            <td rowSpan={student.vaccinations.length} className="px-6 py-4 whitespace-nowrap">
                              {student.first_name} {student.last_name}
                            </td>
                            <td rowSpan={student.vaccinations.length} className="px-6 py-4 whitespace-nowrap">
                              {student.student_class}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">{vaccination.vaccine_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(vaccination.vaccination_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vaccination.vaccinated_status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vaccination.vaccinated_status ? 'Vaccinated' : 'Not Vaccinated'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={student.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap">{student.student_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.student_class}</td>
                      <td className="px-6 py-4 whitespace-nowrap">N/A</td>
                      <td className="px-6 py-4 whitespace-nowrap">N/A</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Vaccinated
                        </span>
                      </td>
                    </tr>
                  )
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No students found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-700">
              Page {pagination.currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => paginate(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className={`px-3 py-1 rounded ${pagination.currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`px-3 py-1 rounded ${pagination.currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => paginate(Math.min(totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === totalPages}
              className={`px-3 py-1 rounded ${pagination.currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;