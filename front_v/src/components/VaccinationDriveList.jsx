import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const VaccinationDriveList = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [today] = useState(new Date().toISOString().split('T')[0]); // Get current date in YYYY-MM-DD format

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/schools/1/drives', {
          headers: {
            'Authorization': token,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Sort drives by date (newest first)
        const sortedDrives = data.sort((a, b) => 
          new Date(b.drive_date) - new Date(a.drive_date)
        );
        setDrives(sortedDrives);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrives();
  }, []);

  // Function to check if a drive is in the past
  const isPastDrive = (driveDate) => {
    return new Date(driveDate) < new Date(today);
  };

  if (loading) {
    return <div className="p-4">Loading vaccination drives...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Vaccination Drives</h2>
        <Link 
          to="/drives/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Drive
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Doses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable Classes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drives.map((drive) => {
              const isPast = isPastDrive(drive.drive_date);
              return (
                <tr key={drive.drive_id} className={isPast ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(drive.drive_date).toLocaleDateString()}
                    {isPast && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Past
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{drive.vaccine_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{drive.available_doses}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{drive.applicable_classes}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isPast ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Upcoming
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isPast ? (
                      <span className="text-gray-400">Editing disabled</span>
                    ) : (
                      <Link
                        to={`/drives/${drive.drive_id}/edit`}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VaccinationDriveList;