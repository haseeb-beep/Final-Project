import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage'; // Add this import!
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');

  // Load Seed Data and check session
  useEffect(() => {
    // This part replaces your db.init() from script.js
    if (!localStorage.getItem('hm_users')) {
      const initialUsers = [
        { id: 'u1', name: 'Admin', email: 'admin', pass: '123', role: 'admin' },
        { id: 'u2', name: 'Dr. Smith', email: 'doctor', pass: '123', role: 'doctor' },
        { id: 'u3', name: 'John Doe', email: 'patient', pass: '123', role: 'patient' }
      ];
      localStorage.setItem('hm_users', JSON.stringify(initialUsers));
    }

    const savedUser = localStorage.getItem('hm_currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('hm_currentUser', JSON.stringify(userData));
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('hm_currentUser');
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={logout} onNavigate={setCurrentPage} />

      {currentPage === 'landing' && <LandingPage onStart={() => setCurrentPage('login')} />}
      
      {currentPage === 'login' && <LoginPage onLoginSuccess={handleLogin} />}

      {currentPage === 'dashboard' && user && <Dashboard user={user} />}
    </div>
  );
}

export default App;