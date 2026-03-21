import cors from "cors";
import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { validatePassword } from "./src/utils/passwordValidator.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ================= DB =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ================= MIDDLEWARE =================
app.use(cors({
  origin: true,
  credentials: true,
}));
app.options("*", cors());
app.use(express.json());

// ================= INIT DB =================
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password_hash TEXT,
        auth_provider TEXT,
        fullName TEXT,
        phoneNumber TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        fullName TEXT,
        state TEXT,
        profile_completion_percentage INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id TEXT PRIMARY KEY,
        name TEXT,
        provider TEXT,
        amount_per_year INTEGER
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT,
        expires BIGINT
      )
    `);

    console.log("✅ DB ready");
  } catch (err) {
    console.error("❌ DB init failed", err);
    process.exit(1);
  }
};

await initDb();

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = (to: string, subject: string, text: string) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
};

// ================= AUTH =================
app.post("/api/auth/send-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    await pool.query(
      `INSERT INTO verification_codes (email, code, expires)
       VALUES ($1,$2,$3)
       ON CONFLICT (email)
       DO UPDATE SET code=$2, expires=$3`,
      [email, code, expires]
    );

    await sendEmail(email, "Verification Code", `Code: ${code}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, code } = req.body;

    const record = (
      await pool.query("SELECT * FROM verification_codes WHERE email=$1", [email])
    ).rows[0];

    if (!record || record.code !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    const valid = validatePassword(password);
    if (!valid.valid) {
      return res.status(400).json(valid);
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO users (id,email,password_hash,auth_provider)
       VALUES ($1,$2,$3,'email')`,
      [id, email, hash]
    );

    res.json({ id, email });
  } catch (err) {
    res.status(500).json({ error: "signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = (
      await pool.query("SELECT * FROM users WHERE email=$1", [email])
    ).rows[0];

    if (!user) return res.status(401).json({ error: "invalid" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "invalid" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token });
  } catch {
    res.status(500).json({ error: "login failed" });
  }
});

// ================= PROFILE =================
app.get("/api/profile/:id", async (req, res) => {
  const data = (
    await pool.query("SELECT * FROM user_profiles WHERE user_id=$1", [req.params.id])
  ).rows[0];

  res.json(data || null);
});

// ================= GOOGLE =================
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.get("/api/auth/google/url", (req, res) => {
  const url = client.generateAuthUrl({
    scope: ["profile", "email"],
  });

  res.json({ url });
});

// ================= VITE =================
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (_, res) => {
    res.sendFile(path.resolve("dist/index.html"));
  });
}

// ================= START =================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
