import React, { useEffect, useMemo, useState } from "react";

const Dashboard = ({ user, onUserUpdate }) => {
  // Developed by abdulrehman-o3 - Dashboard Logic and State Management
  const [users, setUsers] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  // admin modals
  const [showAddModal, setShowAddModal] = useState(null); // "doctor" | "patient" | null

  // doctor modal
  const [selectedAppt, setSelectedAppt] = useState(null); // appointment object or null

  // patient booking form
  const [bookingDoctorId, setBookingDoctorId] = useState("");
  const [bookingDateTime, setBookingDateTime] = useState("");

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.id === user?.id);
    return found || user;
  }, [users, user]);

  // ===================== API FETCH =====================
  // Fetches initial data for users and appointments to populate the dashboard
  // Handles loading states and error logging
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const resUsers = await fetch("/api/users");
      const dataUsers = await resUsers.json();
      if (dataUsers.ok) setUsers(dataUsers.users);

      // 2. Fetch Appointments
      const resAppts = await fetch("/api/appointments");
      const dataAppts = await resAppts.json();
      if (dataAppts.ok) setAppts(dataAppts.appointments);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync back to parent if needed
  useEffect(() => {
    if (typeof onUserUpdate === "function" && currentUser?.id) {
      onUserUpdate(currentUser);
    }
  }, [currentUser, onUserUpdate]);


  // ===================== ACTIONS =====================

  // ADMIN: ADD USER
  const handleAddUser = async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const name = e.target.name.value.trim();
    const pass = e.target.pass.value;
    const spec = e.target.spec?.value?.trim() || "";

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password: pass, role: showAddModal, spec
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(`${showAddModal} added!`);
        setShowAddModal(null);
        fetchData();
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      alert("Error adding user");
    }
  };

  // ADMIN: DELETE USER
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch {
      alert("Error deleting");
    }
  };

  // PATIENT: BOOK APPT
  // Developed by abdulrehman-o3 - Patient Booking Module
  // Handles appointment booking logic and validation
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingDoctorId || !bookingDateTime) return alert("Fill all fields");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: bookingDoctorId,
          patId: currentUser.id,
          datetime: bookingDateTime
        })
      });
      const data = await res.json();
      if (data.ok) {
        alert("Booked successfully!");
        setBookingDoctorId("");
        setBookingDateTime("");
        fetchData();
      } else {
        alert(data.message || "Booking failed");
      }
    } catch (err) {
      alert("Connection error");
    }
  };

  // PATIENT: CANCEL APPT
  const cancelAppointment = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: "PUT" });
      if (res.ok) fetchData();
    } catch {
      alert("Error cancelling");
    }
  };

  // DOCTOR: DIAGNOSIS
  // Developed by abdulrehman-o3 - Doctor Diagnosis Module
  // Handles diagnosis form submission and record keeping
  const handleDiagnosis = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: currentUser.id,
          bp: e.target.bp.value,
          heartRate: e.target.hr.value,
          temp: e.target.temp.value,
          weight: e.target.weight.value,
          comments: e.target.comments.value
        })
      });
      if (res.ok) {
        alert("Saved!");
        setSelectedAppt(null);
        fetchData();
      } else {
        alert("Failed to save record");
      }
    } catch (err) {
      alert("Error saving record");
    }
  };

  // ===================== DERIVED DATA =====================
  const doctors = useMemo(() => users.filter((u) => u.role === "doctor"), [users]);

  const myPatientAppts = useMemo(() => {
    if (!currentUser?.id) return [];
    return appts.filter((a) => a.patId === currentUser.id);
  }, [appts, currentUser]);

  const myDoctorPending = useMemo(() => {
    if (!currentUser?.id) return [];
    return appts
      .filter((a) => a.docId === currentUser.id && a.status === "Pending")
      .sort((a, b) => (a.datetime > b.datetime ? 1 : -1));
  }, [appts, currentUser]);

  const myDoctorCompleted = useMemo(() => {
    if (!currentUser?.id) return [];
    return appts
      .filter((a) => a.docId === currentUser.id && a.status === "Completed")
      .sort((a, b) => (a.datetime > b.datetime ? -1 : 1));
  }, [appts, currentUser]);

  const myPatientCompleted = useMemo(() => {
    if (!currentUser?.id) return [];
    return appts
      .filter((a) => a.patId === currentUser.id && a.status === "Completed")
      .sort((a, b) => (a.datetime > b.datetime ? -1 : 1));
  }, [appts, currentUser]);


  return (
    <div className="container mt-5 pt-4">
      {/* ---------------- ADMIN VIEW ---------------- */}
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
                        {users
                          .filter((u) => u.role === role)
                          .map((u) => (
                            <tr key={u.id}>
                              <td>
                                {u.name}
                                {u.role === "doctor" && u.spec ? (
                                  <div className="small text-muted">{u.spec}</div>
                                ) : null}
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
                        {users.filter((u) => u.role === role).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-muted">
                              No {role}s yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="small text-muted mt-2">
                    Deleting a user will also remove their related appointments.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- DOCTOR VIEW ---------------- */}
      {/* Developed by abdulrehman-o3 - Doctor Dashboard View */}
      {currentUser?.role === "doctor" && (
        <div className="row g-4">
          <div className="col-12">
            <h3 className="text-navy mb-3">Patient Queue</h3>
            <div className="glass-panel p-4 rounded-4">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date/Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDoctorPending.map((a) => (
                      <tr key={a.id}>
                        <td>{a.patName}</td>
                        <td>{new Date(a.datetime).toLocaleString()}</td>
                        <td><span className="badge bg-warning">Pending</span></td>
                        <td>
                          <button
                            className="btn btn-sm btn-teal"
                            onClick={() => setSelectedAppt(a)}
                          >
                            Start Diagnosis
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myDoctorPending.length === 0 && (
                      <tr><td colSpan={4} className="text-muted">No pending appointments.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12">
            <h4 className="text-navy mb-3">Completed Appointments</h4>
            <div className="glass-panel p-4 rounded-4">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date/Time</th>
                      <th>Vitals</th>
                      <th>Prescription / Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDoctorCompleted.map((a) => (
                      <tr key={a.id}>
                        <td>{a.patName}</td>
                        <td>{new Date(a.datetime).toLocaleString()}</td>
                        <td className="small">
                          {a.record ? (
                            <>
                              BP: {a.record.bp} <br />
                              HR: {a.record.heartRate} <br />
                              Temp: {a.record.temp} <br />
                              Weight: {a.record.weight}
                            </>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="small">
                          {a.record?.comments || <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PATIENT VIEW ---------------- */}
      {/* Developed by abdulrehman-o3 - Patient Dashboard View */}
      {currentUser?.role === "patient" && (
        <div className="row g-4">
          <div className="col-md-5">
            <div className="info-card bg-teal-gradient text-white p-4 rounded-4 shadow mb-4">
              <h5>My Latest Appointment Vitals</h5>
              {/* Simplified view: getting last appt record */}
              {myPatientCompleted.length > 0 && myPatientCompleted[0].record ? (
                <ul className="list-unstyled small mb-0">
                  <li>BP: {myPatientCompleted[0].record.bp}</li>
                  <li>Heart Rate: {myPatientCompleted[0].record.heartRate}</li>
                  <li>Temp: {myPatientCompleted[0].record.temp}</li>
                  <li>Weight: {myPatientCompleted[0].record.weight}</li>
                  <li className="mt-2 text-white-50">Dr. {myPatientCompleted[0].docName}</li>
                </ul>
              ) : <p>No records yet.</p>}
            </div>

            <div className="glass-panel p-4 rounded-4 shadow-sm">
              <h5 className="text-navy mb-3">Book Appointment</h5>
              <form onSubmit={handleBookAppointment}>
                <label className="small mb-1">Select Doctor</label>
                <select
                  className="form-select mb-3"
                  value={bookingDoctorId}
                  onChange={(e) => setBookingDoctorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.spec ? `(${d.spec})` : ""}
                    </option>
                  ))}
                </select>

                <label className="small mb-1">Select Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control mb-3"
                  value={bookingDateTime}
                  onChange={(e) => setBookingDateTime(e.target.value)}
                  required
                />

                <button className="btn btn-teal w-100">Book Now</button>
              </form>
            </div>
          </div>

          <div className="col-md-7">
            <div className="glass-panel p-4 rounded-4 h-100">
              <h5 className="text-navy mb-3">My Appointments</h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPatientAppts.map((a) => (
                      <tr key={a.id}>
                        <td>{a.docName} <small className="text-muted">{a.docSpec}</small></td>
                        <td>{new Date(a.datetime).toLocaleDateString()}</td>
                        <td>
                          {a.status === "Pending" && <span className="badge bg-warning">Pending</span>}
                          {a.status === "Completed" && <span className="badge bg-success">Completed</span>}
                          {a.status === "Cancelled" && <span className="badge bg-secondary">Cancelled</span>}
                        </td>
                        <td>
                          {a.status === "Pending" && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => cancelAppointment(a.id)}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DOCTOR MODAL: DIAGNOSIS FORM ---------------- */}
      {selectedAppt && (
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.6)", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2000 }}>
          <div className="glass-panel p-4 rounded-4 shadow-lg animate-up" style={{ maxWidth: "600px", width: "90%" }}>
            <h4 className="text-navy mb-1">Clinical Checkup</h4>
            <div className="small text-muted mb-3">
              Patient: <strong>{selectedAppt.patName}</strong>
            </div>

            <form onSubmit={handleDiagnosis}>
              <div className="row g-3">
                <div className="col-md-6"><label className="small">Blood Pressure</label><input name="bp" className="form-control" required /></div>
                <div className="col-md-6"><label className="small">Heart Rate</label><input name="hr" className="form-control" required /></div>
                <div className="col-md-6"><label className="small">Temp</label><input name="temp" className="form-control" required /></div>
                <div className="col-md-6"><label className="small">Weight</label><input name="weight" className="form-control" required /></div>
                <div className="col-12"><label className="small">Comments</label><textarea name="comments" rows="3" className="form-control" required /></div>
              </div>
              <div className="mt-4 d-flex gap-2">
                <button className="btn btn-teal flex-grow-1">Save + Complete</button>
                <button className="btn btn-light" type="button" onClick={() => setSelectedAppt(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- ADMIN MODAL: ADD USER ---------------- */}
      {showAddModal && (
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.6)", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 2000 }}>
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
              <button className="btn btn-light w-100" type="button" onClick={() => setShowAddModal(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;