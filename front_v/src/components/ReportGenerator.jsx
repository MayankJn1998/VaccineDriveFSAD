import React, { useState, useEffect } from 'react';

const ReportGenerator = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Simulate fetching report data from an API
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const data = [
          { studentName: 'John Doe', vaccinationDate: '2024-02-01', vaccineName: 'Vaccine A', status: 'Vaccinated' },
          { studentName: 'Jane Smith', vaccinationDate: '2024-02-15', vaccineName: 'Vaccine B', status: 'Vaccinated' },
          { studentName: 'Bob Johnson', vaccinationDate: '2024-01-20', vaccineName: 'Vaccine A', status: 'Not Vaccinated' },
        ];
        setReportData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = filter
    ? reportData.filter(item => item.vaccineName.toLowerCase().includes(filter.toLowerCase()))
    : reportData;

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
            <th>Student Name</th>
            <th>Vaccination Date</th>
            <th>Vaccine Name</th>
            <th>Vaccination Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.studentName + item.vaccineName}>
              <td>{item.studentName}</td>
              <td>{item.vaccinationDate}</td>
              <td>{item.vaccineName}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Add download options here (CSV, Excel, PDF) */}
    </div>
  );
};

export default ReportGenerator;