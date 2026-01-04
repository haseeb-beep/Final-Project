import React, { useState } from "react";

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    pass: "",
    name: "",
    role: "patient",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("hm_users")) || [];

    // ===================== SIGN UP =====================
    if (isSignup) {
      const exists = users.find(
        (u) => u.email.toLowerCase() === formData.email.toLowerCase()
      );

      if (exists) {
        alert("Error: This Username/Email is already taken!");
        return;
      }

      const newUser = {
        id: "u" + Date.now(),
        name: formData.name,
        email: formData.email,
        pass: formData.pass,
        role: formData.role,
        history: "",
        vitals: {},
      };

      users.push(newUser);
      localStorage.setItem("hm_users", JSON.stringify(users));

      alert("Account created successfully! You can now login.");
      setIsSignup(false);
      return;
    }

    // ===================== LOGIN (BACKEND) =====================
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.pass, // backend expects "password"
        }),
      });

      const data = await res.json();

      if (data.ok) {
        onLoginSuccess(data.user); // backend user
      } else {
        alert(data.message || "Invalid Username or Password!");
      }
    } catch (err) {
      alert("Backend not reachable. Is server running on port 5000?");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="glass-panel p-5 rounded-4 shadow-lg auth-card animate-up"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h2 className="text-navy fw-bold mb-4 text-center">
          {isSignup ? "Create Account" : "Login"}
        </h2>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-3">
              <label className="small text-muted">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. John Doe"
                required
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          )}

          <div className="mb-3">
            <label className="small text-muted">Username / Email</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter email"
              required
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="small text-muted">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              required
              onChange={(e) =>
                setFormData({ ...formData, pass: e.target.value })
              }
            />
          </div>

          {isSignup && (
            <div className="mb-4">
              <label className="small text-muted">Register as:</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button className="btn btn-teal w-100 mb-3 py-2 fw-bold">
            {isSignup ? "Sign Up" : "Login"}
          </button>

          <p className="text-center mb-0 small">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <span
              className="text-teal fw-bold ms-2"
              style={{ cursor: "pointer" }}
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? "Login here" : "Register Now"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
