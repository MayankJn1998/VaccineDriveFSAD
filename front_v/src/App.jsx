// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import VaccinationDriveList from './components/VaccinationDriveList';
import VaccinationDriveForm from './components/VaccinationDriveForm';
import ReportGenerator from './components/ReportGenerator';
import BulkImportStudents from './components/BulkImportStudents';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token')); // Check for token
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if logged in and on login page
    if (isLoggedIn && window.location.pathname === '/login') {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token'); // Remove token on logout
    navigate('/login');
  };

  return (
    <div className="App">
      {isLoggedIn && <button onClick={handleLogout}>Logout</button>}
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Login onLogin={handleLogin} />} />
        <Route path="/students" element={isLoggedIn ? <StudentList /> : <Login onLogin={handleLogin} />} />
        <Route path="/students/new" element={isLoggedIn ? <StudentForm /> : <Login onLogin={handleLogin} />} />
        <Route path="/students/:id/edit" element={isLoggedIn ? <StudentForm /> : <Login onLogin={handleLogin} />} />
        <Route path="/students/bulk" element={isLoggedIn ? <BulkImportStudents /> : <Login onLogin={handleLogin} />} />
        <Route path="/drives" element={isLoggedIn ? <VaccinationDriveList /> : <Login onLogin={handleLogin} />} />
        <Route path="/drives/new" element={isLoggedIn ? <VaccinationDriveForm /> : <Login onLogin={handleLogin} />} />
        <Route path="/drives/:id/edit" element={isLoggedIn ? <VaccinationDriveForm /> : <Login onLogin={handleLogin} />} />
        <Route path="/reports" element={isLoggedIn ? <ReportGenerator /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login onLogin={handleLogin} />} />
      </Routes>
    </div>
  );
};

export default App;
