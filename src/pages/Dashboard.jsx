import React, { useEffect, useMemo, useState } from "react";

const USERS_KEY = "hm_users";
const APPTS_KEY = "hm_appts";

const safeParse = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const Dashboard = ({ user, onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [appts, setAppts] = useState([]);

  const [showAddModal, setShowAddModal] = useState(null); // "doctor" | "patient" | null

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === user?.id);
    return found || user;
  }, [users, user]);

  useEffect(() => {
    const storedUsers = safeParse(USERS_KEY, []);
    const storedAppts = safeParse(APPTS_KEY, []);
    setUsers(storedUsers);
    setAppts(storedAppts);
  }, []);

  useEffect(() => {
    if (typeof onUserUpdate === "function" && currentUser?.id) {
      onUserUpdate(currentUser);
    }
  }, [currentUser, onUserUpdate]);

  const saveData = (newUsers, newAppts) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
    localStorage.setItem(APPTS_KEY, JSON.stringify(newAppts));
    setUsers(newUsers);
    setAppts(newAppts);
  };

    const handleAddUser = (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();

    if (users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase())) {
      alert("Error: A user with this email/username already exists!");
      return;
    }

    const newUser = {
      id: "u" + Date.now(),
      name: e.target.name.value.trim(),
      email,
      pass: e.target.pass.value,
      role: showAddModal,
      spec: e.target.spec?.value?.trim() || "",
      history: [],
      vitals: {},
    };

    saveData([...users, newUser], appts);
    setShowAddModal(null);
  };

  const deleteUser = (id) => {
    if (id === "u1" || id === "u2") return alert("Protected System Account.");

    const target = users.find((u) => u.id === id);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to remove ${target.name}?`)) return;

    const cleanedAppts = appts.filter((a) => a.docId !== id && a.patId !== id);
    const cleanedUsers = users.filter((u) => u.id !== id);
    saveData(cleanedUsers, cleanedAppts);
  };
  return (
    <div className="container mt-5 pt-4">
      {currentUser?.role === "admin" && (
        <div className="animate-up">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-navy">System Administration</h2>
            <div>
              <button className="btn btn-teal me-2" onClick={() => setShowAddModal("doctor")}>
                + Add Doctor
              </button>
              <button className="btn btn-outline-teal" onClick={() => setShowAddModal("patient")}>
                + Add Patient
              </button>
            </div>
          </div>

          <div className="row g-4">
            {["doctor", "patient"].map((role) => (
              <div className="col-md-6" key={role}>
                <div className="glass-panel p-4 rounded-4 shadow-sm h-100">
                  <h5 className="text-capitalize mb-3">{role}s Management</h5>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>User/Email</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter((u) => u.role === role).map((u) => (
                          <tr key={u.id}>
                            <td>
                              {u.name}
                              {u.role === "doctor" && u.spec && (
                                <div className="small text-muted">{u.spec}</div>
                              )}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="btn btn-sm btn-link text-danger"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="modal-backdrop d-flex align-items-center justify-content-center">
          <div className="glass-panel p-4 rounded-4 shadow-lg" style={{ width: "400px" }}>
            <h5 className="mb-4">Register New {showAddModal.toUpperCase()}</h5>
            <form onSubmit={handleAddUser}>
              <input name="name" className="form-control mb-3" placeholder="Full Name" required />
              <input name="email" className="form-control mb-3" placeholder="Username/Email" required />
              <input name="pass" type="password" className="form-control mb-3" placeholder="Password" required />
              {showAddModal === "doctor" && (
                <input name="spec" className="form-control mb-3" placeholder="Medical Specialty" required />
              )}
              <button className="btn btn-teal w-100 mb-2">Create Account</button>
              <button className="btn btn-light w-100" type="button" onClick={() => setShowAddModal(null)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
