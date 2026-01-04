import React, { useState } from "react";

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    pass: "",
    name: "",
    role: "patient",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        // ===================== SIGN UP (BACKEND) =====================
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.pass,
            role: formData.role,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Registration failed");
          return;
        }

        alert("Account created successfully! You can now login.");
        setIsSignup(false);
      } else {
        // ===================== LOGIN (BACKEND) =====================
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.pass,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Login failed");
          return;
        }

        if (data.ok) {
          console.log("LOGIN SUCCESS:", data.user);
          onLoginSuccess(data.user);
        } else {
          alert(data.message || "Invalid email or password");
        }
      }
    } catch (err) {
      console.error("AUTH ERROR:", err);
      alert("Backend not reachable. Make sure backend is running.");
    } finally {
      setIsLoading(false);
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

          <button
            className="btn btn-teal w-100 mb-3 py-2 fw-bold"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
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
