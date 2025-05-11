import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
//import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportGenerator = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can adjust this
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/schools/1/vaccinations?page=${currentPage}&limit=${itemsPerPage}`, { // Assuming school ID 1 and backend supports pagination
          headers: {
            'Authorization': token,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReportData(data.items); // Assuming the backend returns data in an 'items' array
        setTotalPages(Math.ceil(data.total / itemsPerPage)); // Assuming the backend returns total count
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [currentPage, itemsPerPage]);

  const filteredData = filter
    ? reportData.filter(item => item.vaccine_name.toLowerCase().includes(filter.toLowerCase()))
    : reportData;

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const downloadCSV = () => {
    const csvData = [
      ["Student ID", "Vaccination Date", "Vaccine Name", "Vaccinated Status"],
      ...filteredData.map(item => [
        item.student_id,
        new Date(item.vaccination_date).toLocaleDateString(),
        item.vaccine_name,
        item.vaccinated_status ? 'Yes' : 'No',
      ]),
    ];
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'vaccination_report.csv');
  };

  const downloadExcel = () => {
    const excelData = [
      ["Student ID", "Vaccination Date", "Vaccine Name", "Vaccinated Status"],
      ...filteredData.map(item => [
        item.student_id,
        new Date(item.vaccination_date).toLocaleDateString(),
        item.vaccine_name,
        item.vaccinated_status ? 'Yes' : 'No',
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vaccination Report');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, 'vaccination_report.xlsx');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Student ID', 'Vaccination Date', 'Vaccine Name', 'Vaccinated Status']],
      body: filteredData.map(item => [
        item.student_id,
        new Date(item.vaccination_date).toLocaleDateString(),
        item.vaccine_name,
        item.vaccinated_status ? 'Yes' : 'No',
      ]),
    });
    doc.save('vaccination_report.pdf');
  };

  if (loading) {
    return <div>Loading report...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Vaccination Report</h2>
      <input
        type="text"
        placeholder="Filter by vaccine name..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Vaccination Date</th>
            <th>Vaccine Name</th>
            <th>Vaccination Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.vaccination_id}>
              <td>{item.student_id}</td>
              <td>{new Date(item.vaccination_date).toLocaleDateString()}</td>
              <td>{item.vaccine_name}</td>
              <td>{item.vaccinated_status ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span>{currentPage} / {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}

      <div className="download-options">
        <button onClick={downloadCSV}>Download CSV</button>
        <button onClick={downloadExcel}>Download Excel</button>
        <button onClick={downloadPDF}>Download PDF</button>
      </div>
    </div>
  );
};

export default ReportGenerator;