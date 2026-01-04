import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

/** Allow frontend dev server */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

/** JSON body parser */
app.use(express.json({ limit: "1mb" }));

/** MySQL pool */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "healthmate",
  waitForConnections: true,
  connectionLimit: 10,
});

/** Health check (API + DB) */
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, message: "API OK", db: "connected" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "DB connection failed", error: e.message });
  }
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

/** Register (Doctors, Patients, Admins) */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, spec } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, message: "name, email, password are required" });
    }

    const safeRole = ["admin", "doctor", "patient"].includes(role) ? role : "patient";

    // Check if email exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, message: "Email already exists" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // INSERT: Note using 'password' column as per user schema, storing the hash there.
    // Also inserting 'spec' if provided (mainly for doctors).
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, spec) VALUES (?, ?, ?, ?, ?)",
      [name, email, password_hash, safeRole, spec || null]
    );

    return res.status(201).json({
      ok: true,
      message: "User registered",
      user: { id: result.insertId, name, email, role: safeRole, spec },
    });
  } catch (e) {
    console.error("Register Error:", e);
    return res.status(500).json({ ok: false, message: "Server error", error: e.message });
  }
});

/** Login */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "email and password are required" });
    }

    // SELECT using 'password' column
    const [rows] = await pool.query(
      "SELECT id, name, email, role, password, spec FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password); // Compare against hash stored in 'password' column

    if (!match) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    return res.json({
      ok: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role, spec: user.spec },
    });
  } catch (e) {
    console.error("Login Error:", e);
    return res.status(500).json({ ok: false, message: "Server error", error: e.message });
  }
});

// ============================================================================
// USERS MANAGEMENT (For Admin Dashboard)
// ============================================================================

/** Get All Users */
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, spec, created_at FROM users ORDER BY id DESC");
    return res.json({ ok: true, users: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to fetch users", error: e.message });
  }
});

/** Delete User */
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ ok: true, message: "User deleted" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to delete user", error: e.message });
  }
});

// ============================================================================
// APPOINTMENTS (Basic Structure)
// ============================================================================

/** Get Appointments (All or by User) */
app.get("/api/appointments", async (req, res) => {
  try {
    const query = `
      SELECT a.*, 
             u1.name as docName, u1.spec as docSpec, 
             u2.name as patName,
             mr.bp, mr.heart_rate, mr.temp, mr.weight, mr.comments
      FROM appointments a
      LEFT JOIN users u1 ON a.doc_id = u1.id
      LEFT JOIN users u2 ON a.pat_id = u2.id
      LEFT JOIN medical_records mr ON a.id = mr.appointment_id
      ORDER BY a.datetime DESC
    `;
    const [rows] = await pool.query(query);

    // Transform formatting to match frontend expectation where needed
    const formatted = rows.map(r => ({
      id: r.id,
      docId: r.doc_id,
      patId: r.pat_id,
      datetime: r.datetime,
      status: r.status,
      docName: r.docName,
      docSpec: r.docSpec,
      patName: r.patName,
      record: r.bp ? { // If medical record exists
        bp: r.bp,
        heartRate: r.heart_rate,
        temp: r.temp,
        weight: r.weight,
        comments: r.comments
      } : null
    }));

    return res.json({ ok: true, appointments: formatted });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to fetch appointments", error: e.message });
  }
});

/** Book Appointment */
app.post("/api/appointments", async (req, res) => {
  try {
    const { docId, patId, datetime } = req.body;
    await pool.query(
      "INSERT INTO appointments (doc_id, pat_id, datetime, status) VALUES (?, ?, ?, 'Pending')",
      [docId, patId, datetime]
    );
    return res.json({ ok: true, message: "Appointment booked" });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Failed to book", error: e.message });
  }
});

/** Cancel Appointment */
app.put("/api/appointments/:id/cancel", async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/** Complete Appointment (medical record) */
app.post("/api/appointments/:id/complete", async (req, res) => {
  try {
    const apptId = req.params.id;
    const { docId, bp, heartRate, temp, weight, comments } = req.body;

    // 1. Insert Medical Record
    await pool.query(
      "INSERT INTO medical_records (appointment_id, doctor_id, bp, heart_rate, temp, weight, comments) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [apptId, docId, bp, heartRate, temp, weight, comments]
    );

    // 2. Update Appointment Status
    await pool.query("UPDATE appointments SET status = 'Completed' WHERE id = ?", [apptId]);

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend running on http://localhost:${process.env.PORT || 5000}`);
});
