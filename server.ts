import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import cors from "cors";
import { validatePassword } from "./src/utils/passwordValidator";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ✅ FINAL CORS FIX (NO MORE BLOCKING)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-email"],
  credentials: true
}));

app.options("*", cors());

app.use(express.json());

// ✅ ROOT ROUTE (FIXES "NOT FOUND")
app.get("/", (req, res) => {
  res.send("✅ MeritUs Backend is Running");
});

// ─── EMAIL ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to: string, subject: string, text: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEMO EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"MeritUs" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
  } catch (error) {
    console.error("Email error:", error);
  }
};

// ─── DATABASE ──────────────────────────────────────────────────
const dbPath = process.env.DATABASE_PATH || 'database.sqlite';
let db: Database.Database | null = null;

function getDb() {
  if (!db) db = new Database(dbPath);
  return db;
}

const pool = {
  query: async (sql: string, params: any[] = []) => {
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
    const database = getDb();

    if (isSelect) {
      return { rows: database.prepare(sqliteSql).all(...params) };
    } else {
      const info = database.prepare(sqliteSql).run(...params);
      return { rows: [], rowCount: info.changes };
    }
  }
};

// ─── INIT DB ───────────────────────────────────────────────────
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      fullName TEXT,
      phoneNumber TEXT,
      country TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT PRIMARY KEY,
      code TEXT,
      expires BIGINT
    )
  `);

  console.log("✅ DB Ready");
})();

// ─── AUTH ─────────────────────────────────────────────────────
app.post("/api/auth/send-verification", async (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000;

  await pool.query(`
    INSERT INTO verification_codes (email, code, expires)
    VALUES ($1,$2,$3)
    ON CONFLICT(email) DO UPDATE SET code=$2, expires=$3
  `, [email, code, expires]);

  await sendEmail(email, "Verification Code", `Code: ${code}`);

  res.json({ message: "Code sent", demoCode: code });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, fullName, country, phoneNumber, code } = req.body;

  try {
    const verification = (await pool.query(
      "SELECT * FROM verification_codes WHERE email = $1",
      [email]
    )).rows[0] as any;

    if (!verification || verification.code !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (id,email,password_hash,fullName,country,phoneNumber) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, email, password_hash, fullName, country, phoneNumber]
    );

    const token = jwt.sign({ id, email }, JWT_SECRET);

    res.json({ id, email, fullName, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = (await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  )).rows[0] as any;

  if (!user) return res.status(401).json({ error: "Invalid user" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

  res.json({ id: user.id, email: user.email, token });
});

// ─── START SERVER ──────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
