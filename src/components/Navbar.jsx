import React from 'react';
import logo from '../assets/logo1.png'; // This looks for your logo in assets

const Navbar = ({ user, onLogout, onNavigate }) => {
  // Developed by abdulrehman-o3 - Navbar Component Logic
  // Handles navigation and responsive layout for the application
  return (
    <nav className="navbar navbar-expand-lg fixed-top shadow-sm bg-white">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center" href="#" onClick={() => onNavigate('landing')}>
          <img src={logo} alt="Logo" height="40" className="me-2" />
          <span className="fw-bold text-teal">HealthMate</span>
        </a>

        <div className="ms-auto">
          {!user ? (
            <button className="btn btn-teal btn-sm" onClick={() => onNavigate('login')}>
              Login / Sign Up
            </button>
          ) : (
            <div className="d-flex align-items-center">
              <span className="me-3 text-dark small">Hi, {user.name}</span>
              <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;