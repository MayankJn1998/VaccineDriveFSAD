import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const BulkImportStudents = ({ schoolId }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapping, setMapping] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    student_class: ''
  });
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = useCallback((file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          console.error('CSV parsing errors:', results.errors);
          return;
        }

        if (results.data.length === 0) {
          toast.warning('CSV file is empty');
          return;
        }

        setHeaders(Object.keys(results.data[0]));
        setPreviewData(results.data.slice(0, 5)); // Show first 5 rows as preview
      },
      error: (error) => {
        toast.error('Error parsing CSV file');
        console.error('CSV parsing error:', error);
      }
    });
  }, []);

  const handleMappingChange = (e) => {
    const { name, value } = e.target;
    setMapping(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/schools/1/students/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': token,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk upload failed');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.count} students`);
      navigate('/students');
    } catch (error) {
      console.error('Bulk import error:', error);
      toast.error(error.message || 'Failed to import students');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      ['first_name', 'last_name', 'date_of_birth', 'gender', 'contact_number', 'student_class'],
      ['John', 'Doe', '2005-03-15', 'Male', '1234567890', '10'],
      ['Jane', 'Smith', '2006-07-22', 'Female', '0987654321', '9']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Bulk Import Students</h2>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Step 1: Download Template</h3>
          <p className="text-gray-600 mb-4">
            Download our CSV template to ensure your file has the correct format.
          </p>
          <button
            onClick={downloadTemplate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Download Template
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Step 2: Upload CSV File</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              {file ? file.name : 'No file selected'}
            </p>
          </div>
        </div>

        {previewData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Step 3: Verify Data</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 text-sm text-gray-500 border">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-sm text-gray-500">
                Showing first {previewData.length} rows of your CSV file
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/students')}
            className="mr-4 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded text-white ${!file || isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </span>
            ) : (
              'Import Students'
            )}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>CSV file must include headers in the first row</li>
                <li>Date format must be YYYY-MM-DD (e.g., 2005-03-15)</li>
                <li>Maximum file size is 5MB</li>
                <li>Duplicate students will be skipped</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportStudents;