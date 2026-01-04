import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("landing");

  useEffect(() => {
    // ✅ Only restore session (do not force seed users if you're using backend login)
    const savedUser = localStorage.getItem("hm_currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage("dashboard");
    }
  }, []);

  const handleLogin = (userData) => {
    // ✅ Save session
    localStorage.setItem("hm_currentUser", JSON.stringify(userData));
    setUser(userData);
    setCurrentPage("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("hm_currentUser");
    setUser(null);
    setCurrentPage("landing");
  };

  // ✅ Safety: if user somehow goes dashboard without being logged in
  useEffect(() => {
    if (currentPage === "dashboard" && !user) {
      setCurrentPage("login");
    }
  }, [currentPage, user]);

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={logout} onNavigate={setCurrentPage} />

      {currentPage === "landing" && (
        <LandingPage onStart={() => setCurrentPage("login")} />
      )}

      {currentPage === "login" && <LoginPage onLoginSuccess={handleLogin} />}

      {currentPage === "dashboard" && user && <Dashboard user={user} />}
    </div>
  );
}

export default App;
