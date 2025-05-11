import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

/*  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement authentication logic here (e.g., API call)
    if (username && password) {
      // Simulate successful login
      localStorage.setItem('token', 'school_admin_token'); // Store a token
      navigate('dashboard'); // Redirect to dashboard
    } else {
      alert('Please enter username and password');
    }
  };*/

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username && password) {
      try {
        // Simulate API call
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          navigate('/dashboard', { replace: true }); // Use replace to prevent going back to login
          window.location.reload(); // Only if absolutely necessary
        } else {
          alert('Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    } else {
      alert('Please enter username and password');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
