import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  // Default role is 'patient', but it can now be 'doctor' or 'admin'
  const [formData, setFormData] = useState({ email: '', pass: '', name: '', role: 'patient' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('hm_users')) || [];

    if (isSignup) {
      // 🛑 DUPLICATE CHECK
      const exists = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (exists) {
        return alert("Error: This Username/Email is already taken!");
      }

      const newUser = { 
        ...formData, 
        id: 'u' + Date.now(),
        history: '', 
        vitals: {} 
      };
      
      users.push(newUser);
      localStorage.setItem('hm_users', JSON.stringify(users));
      alert("Account created successfully! You can now login.");
      setIsSignup(false);
    } else {
      // Find user matching both email and password
      const user = users.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase() && 
        u.pass === formData.pass
      );

      if (user) {
        // This sends the user object (with the 'admin' role) to App.jsx
        onLoginSuccess(user);
      } else {
        alert("Invalid Username or Password!");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-panel p-5 rounded-4 shadow-lg auth-card animate-up" style={{maxWidth: '400px', width: '100%'}}>
        <h2 className="text-navy fw-bold mb-4 text-center">
            {isSignup ? 'Create Account' : 'Login'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-3">
              <label className="small text-muted">Full Name</label>
              <input type="text" placeholder="e.g. John Doe" className="form-control" 
                onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
          )}
          
          <div className="mb-3">
            <label className="small text-muted">Username / Email</label>
            <input type="text" placeholder="Enter username" className="form-control" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>

          <div className="mb-3">
            <label className="small text-muted">Password</label>
            <input type="password" placeholder="••••••••" className="form-control" 
              onChange={(e) => setFormData({...formData, pass: e.target.value})} required />
          </div>
          
          {isSignup && (
            <div className="mb-4">
              <label className="small text-muted">Register as:</label>
              <select 
                className="form-select" 
                value={formData.role} // Binds the selection to state
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option> {/* Added Admin Option here */}
              </select>
            </div>
          )}

          <button className="btn btn-teal w-100 mb-3 py-2 fw-bold">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>
          
          <p className="text-center mb-0 small">
            {isSignup ? "Already have an account?" : "Don't have an account?"} 
            <span className="text-teal fw-bold ms-2" style={{cursor:'pointer'}} onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? 'Login here' : 'Register Now'}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;