import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const exportData = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        console.log("Connecting to database...");

        const [users] = await pool.query("SELECT * FROM users");
        const [appointments] = await pool.query("SELECT * FROM appointments");

        // Check if medical_records table exists before querying (to avoid crash if not yet created)
        let medical_records = [];
        try {
            const [rows] = await pool.query("SELECT * FROM medical_records");
            medical_records = rows;
        } catch (err) {
            console.log("Medical records table might not exist yet, skipping.");
        }

        const data = {
            timestamp: new Date().toISOString(),
            users,
            appointments,
            medical_records
        };

        await fs.writeFile('db_dump.json', JSON.stringify(data, null, 2));
        console.log("✅ Data exported to backend/db_dump.json");

        await pool.end();
    } catch (err) {
        console.error("❌ Export failed:", err);
    }
};

exportData();
