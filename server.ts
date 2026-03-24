import cors from "cors";
import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { fileURLToPath } from "url";
import { validatePassword } from "./src/utils/passwordValidator.js";
import { Resend } from "resend";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ["DATABASE_URL"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin);
    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// OPTIONS must come BEFORE app.use(cors())
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^[0-9]{7,15}$/.test(phone);
const generateToken = (payload: object) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const initDb = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, auth_provider TEXT, fullName TEXT, phoneNumber TEXT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY, fullName TEXT, state TEXT, profile_completion_percentage INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS scholarships (id TEXT PRIMARY KEY, name TEXT, provider TEXT, amount_per_year INTEGER)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS verification_codes (email TEXT PRIMARY KEY, code TEXT NOT NULL, expires BIGINT NOT NULL)`);
    console.log("✅ DB ready");
  } catch (err) {
    console.error("❌ DB init failed", err);
    process.exit(1);
  }
};

await initDb();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to: string, subject: string, text: string) => {
  if (!process.env.RESEND_API_KEY) throw new Error("Email service is not configured");
  const { error } = await resend.emails.send({
    from: "MeritUs <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
  if (error) throw new Error(error.message);
};

app.get("/api/health", asyncHandler(async (_req, res) => {
  await pool.query("SELECT 1");
  res.status(200).json({ success: true, message: "Server is healthy" });
}));

app.post("/api/auth/send-verification", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !isValidEmail(email))
    return res.status(400).json({ success: false, message: "Valid email is required" });

  const existingUser = (await pool.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
  if (existingUser) return res.status(409).json({ success: false, message: "User already exists with this email" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000;

  await pool.query(
    `INSERT INTO verification_codes (email, code, expires) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires = EXCLUDED.expires`,
    [email, code, expires]
  );

  await sendEmail(email, "MeritUs Verification Code", `Your verification code is: ${code}\nThis code will expire in 15 minutes.`);

  res.status(200).json({ success: true, message: "Verification code sent successfully" });
}));

app.post("/api/auth/signup", asyncHandler(async (req, res) => {
  const { email, password, code, fullName, phoneNumber } = req.body;

  if (!email || typeof email !== "string" || !isValidEmail(email))
    return res.status(400).json({ success: false, message: "Valid email is required" });
  if (!password || typeof password !== "string")
    return res.status(400).json({ success: false, message: "Password is required" });
  if (!code || typeof code !== "string")
    return res.status(400).json({ success: false, message: "Verification code is required" });
  if (fullName && typeof fullName !== "string")
    return res.status(400).json({ success: false, message: "Full name must be a string" });
  if (phoneNumber && (typeof phoneNumber !== "string" || !isValidPhone(phoneNumber)))
    return res.status(400).json({ success: false, message: "Phone number must contain 7 to 15 digits" });

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) return res.status(400).json({ success: false, ...passwordValidation });

  const existingUser = (await pool.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
  if (existingUser) return res.status(409).json({ success: false, message: "User already exists with this email" });

  const record = (await pool.query("SELECT * FROM verification_codes WHERE email = $1", [email])).rows[0];
  if (!record) return res.status(400).json({ success: false, message: "No verification code found for this email" });
  if (record.expires < Date.now()) {
    await pool.query("DELETE FROM verification_codes WHERE email = $1", [email]);
    return res.status(400).json({ success: false, message: "Verification code expired" });
  }
  if (record.code !== code) return res.status(400).json({ success: false, message: "Invalid verification code" });

  const hash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  await pool.query("BEGIN");
  try {
    await pool.query(`INSERT INTO users (id, email, password_hash, auth_provider, fullName, phoneNumber) VALUES ($1, $2, $3, $4, $5, $6)`, [id, email, hash, "email", fullName || null, phoneNumber || null]);
    await pool.query(`INSERT INTO user_profiles (user_id, fullName, state, profile_completion_percentage) VALUES ($1, $2, $3, $4)`, [id, fullName || null, null, fullName ? 20 : 0]);
    await pool.query("DELETE FROM verification_codes WHERE email = $1", [email]);
    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }

  const token = generateToken({ id, email });
  res.status(201).json({ success: true, message: "Account created successfully", user: { id, email, fullName: fullName || null, phoneNumber: phoneNumber || null }, token });
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== "string" || !isValidEmail(email))
    return res.status(400).json({ success: false, message: "Valid email is required" });
  if (!password || typeof password !== "string")
    return res.status(400).json({ success: false, message: "Password is required" });

  const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email])).rows[0];
  if (!user || !user.password_hash) return res.status(401).json({ success: false, message: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ success: false, message: "Invalid email or password" });

  const token = generateToken({ id: user.id, email: user.email });
  res.status(200).json({ success: true, message: "Login successful", token, user: { id: user.id, email: user.email, fullName: user.fullname || user.fullName || null, phoneNumber: user.phonenumber || user.phoneNumber || null } });
}));

app.get("/api/profile/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = (await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [id])).rows[0];
  res.status(200).json({ success: true, profile: data || null });
}));

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

let client: OAuth2Client | null = null;
if (googleClientId && googleClientSecret && googleRedirectUri) {
  client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);
} else {
  console.warn("⚠️ Google OAuth env vars are incomplete.");
}

app.get("/api/auth/google/url", (req, res) => {
  if (!client) return res.status(500).json({ success: false, message: "Google OAuth is not configured" });
  const url = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: ["openid", "profile", "email"] });
  res.status(200).json({ success: true, url });
});

if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server error:", err);
  if (err?.message?.startsWith("CORS blocked")) return res.status(403).json({ success: false, message: err.message });
  if (err?.code === "23505") return res.status(409).json({ success: false, message: "Duplicate entry" });
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => { console.log(`🚀 Server running on ${PORT}`); });
