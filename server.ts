import express from "express";

import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { validatePassword } from "./src/utils/passwordValidator";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    !origin ||
    origin.endsWith('.vercel.app') ||
    origin.startsWith('http://localhost')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

// ─── EMAIL ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to: string, subject: string, text: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEMO EMAIL] To: ${to} | Subject: ${subject} | Text: ${text}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"MeritUs" <${process.env.EMAIL_USER}>`,
      to, subject, text
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

// ─── POSTGRESQL DATABASE ──────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const query = async (sql: string, params: any[] = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    client.release();
  }
};

const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        fullname TEXT,
        phonenumber TEXT,
        country TEXT,
        resetcode TEXT,
        resetcodeexpires BIGINT,
        password_hash TEXT,
        auth_provider TEXT DEFAULT 'email'
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        fullname TEXT,
        profileimageurl TEXT,
        phonenumber TEXT,
        age INTEGER,
        gender TEXT,
        educationlevel TEXT,
        yearofstudy TEXT,
        institution TEXT,
        fieldofstudy TEXT,
        gpa TEXT,
        country TEXT,
        state TEXT,
        pincode TEXT,
        address TEXT,
        caste TEXT,
        incomebracket TEXT,
        background TEXT,
        careergoals TEXT,
        extracurriculars TEXT,
        awards TEXT,
        profiledeadline TEXT,
        languagesspoken TEXT,
        volunteerexperience TEXT,
        profile_completion_percentage INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id TEXT PRIMARY KEY,
        name TEXT,
        provider TEXT,
        amount_per_year INTEGER,
        eligible_categories TEXT,
        eligible_states TEXT,
        eligible_courses TEXT,
        max_family_income INTEGER,
        gender TEXT,
        min_percentage INTEGER,
        disability_required INTEGER,
        is_active INTEGER DEFAULT 1,
        application_portal_url TEXT,
        deadline_month TEXT,
        description TEXT
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id TEXT,
        scholarship_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, scholarship_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        scholarship_id TEXT,
        status TEXT,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        token TEXT,
        expires_at BIGINT,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT,
        expires BIGINT
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        userid TEXT,
        scholarshipid TEXT,
        scholarshiptitle TEXT,
        remindertime TEXT,
        triggered INTEGER DEFAULT 0,
        FOREIGN KEY(userid) REFERENCES users(id)
      )
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

initDb();

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const getRedirectUri = () => {
  const baseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${baseUrl}/auth/google/callback`;
};

// ─── ADMIN MIDDLEWARE ─────────────────────────────────────────────────────────
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
  try {
    const totalStudents = (await query("SELECT COUNT(*) as count FROM users")).rows[0] as any;
    const totalScholarships = (await query("SELECT COUNT(*) as count FROM scholarships")).rows[0] as any;
    const totalBookmarks = (await query("SELECT COUNT(*) as count FROM bookmarks")).rows[0] as any;
    const totalApplications = (await query("SELECT COUNT(*) as count FROM applications")).rows[0] as any;
    const recentSignups = (await query("SELECT fullname as name, email, 'N/A' as joined_date FROM users ORDER BY id DESC LIMIT 5")).rows;
    const topScholarships = (await query(`
      SELECT s.name, COUNT(b.scholarship_id) as match_count
      FROM scholarships s
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id
      GROUP BY s.id, s.name
      ORDER BY match_count DESC
      LIMIT 5
    `)).rows;

    res.json({
      totalStudents: totalStudents.count,
      totalScholarships: totalScholarships.count,
      totalBookmarks: totalBookmarks.count,
      totalApplications: totalApplications.count,
      recentSignups,
      topScholarships
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

app.get("/api/admin/scholarships", isAdmin, async (req, res) => {
  try {
    const scholarships = (await query("SELECT * FROM scholarships ORDER BY name ASC")).rows;
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.post("/api/admin/scholarships", isAdmin, async (req, res) => {
  const s = req.body;
  const id = crypto.randomUUID();
  try {
    await query(`
      INSERT INTO scholarships (
        id, name, provider, amount_per_year, eligible_categories, eligible_states,
        eligible_courses, max_family_income, gender, min_percentage, disability_required,
        is_active, application_portal_url, deadline_month, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, [
      id, s.name, s.provider, s.amount_per_year, s.eligible_categories, s.eligible_states,
      s.eligible_courses, s.max_family_income, s.gender, s.min_percentage, s.disability_required ? 1 : 0,
      s.is_active ? 1 : 0, s.application_portal_url, s.deadline_month, s.description
    ]);
    res.json({ id, ...s });
  } catch (error) {
    res.status(500).json({ error: "Failed to add scholarship" });
  }
});

app.put("/api/admin/scholarships/:id", isAdmin, async (req, res) => {
  const s = req.body;
  try {
    await query(`
      UPDATE scholarships SET
        name=$1, provider=$2, amount_per_year=$3, eligible_categories=$4, eligible_states=$5,
        eligible_courses=$6, max_family_income=$7, gender=$8, min_percentage=$9, disability_required=$10,
        is_active=$11, application_portal_url=$12, deadline_month=$13, description=$14
      WHERE id=$15
    `, [
      s.name, s.provider, s.amount_per_year, s.eligible_categories, s.eligible_states,
      s.eligible_courses, s.max_family_income, s.gender, s.min_percentage, s.disability_required ? 1 : 0,
      s.is_active ? 1 : 0, s.application_portal_url, s.deadline_month, s.description, req.params.id
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update scholarship" });
  }
});

app.delete("/api/admin/scholarships/:id", isAdmin, async (req, res) => {
  try {
    await query("DELETE FROM scholarships WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete scholarship" });
  }
});

app.get("/api/admin/students", isAdmin, async (req, res) => {
  try {
    const students = (await query(`
      SELECT u.id, u.fullname as name, u.email,
             COALESCE(p.profile_completion_percentage, 0) as completion,
             'N/A' as joined_date, 'N/A' as last_login
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `)).rows;
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.delete("/api/admin/students/:id", isAdmin, async (req, res) => {
  try {
    await query("DELETE FROM user_profiles WHERE user_id=$1", [req.params.id]);
    await query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

app.get("/api/admin/analytics", isAdmin, async (req, res) => {
  try {
    const byCategory = (await query("SELECT provider as name, COUNT(*) as value FROM scholarships GROUP BY provider")).rows;
    const topMatched = (await query(`
      SELECT s.name, COUNT(b.scholarship_id) as value
      FROM scholarships s
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id
      GROUP BY s.id, s.name
      ORDER BY value DESC LIMIT 10
    `)).rows;
    const userDistribution = (await query("SELECT state as name, COUNT(*) as value FROM user_profiles GROUP BY state")).rows;
    res.json({ byCategory, topMatched, userDistribution });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/admin/notices", isAdmin, async (req, res) => {
  try {
    const notices = (await query("SELECT * FROM notices ORDER BY date DESC")).rows;
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

app.post("/api/admin/notices", isAdmin, async (req, res) => {
  const { title, body } = req.body;
  const id = crypto.randomUUID();
  try {
    await query("INSERT INTO notices (id, title, body) VALUES ($1,$2,$3)", [id, title, body]);
    res.json({ id, title, body });
  } catch (error) {
    res.status(500).json({ error: "Failed to add notice" });
  }
});

// ─── PROFILE ROUTES ───────────────────────────────────────────────────────────
app.get("/api/profile/:userId", async (req, res) => {
  try {
    const profile = (await query("SELECT * FROM user_profiles WHERE user_id=$1", [req.params.userId])).rows[0];
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/api/profile/:userId", async (req, res) => {
  const p = req.body;
  try {
    await query(`
      INSERT INTO user_profiles (
        user_id, fullname, profileimageurl, phonenumber, age, gender, educationlevel, yearofstudy,
        institution, fieldofstudy, gpa, country, state, pincode, address, caste, incomebracket,
        background, careergoals, extracurriculars, awards, profiledeadline, languagesspoken,
        volunteerexperience, profile_completion_percentage, last_updated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        fullname=EXCLUDED.fullname, profileimageurl=EXCLUDED.profileimageurl, phonenumber=EXCLUDED.phonenumber,
        age=EXCLUDED.age, gender=EXCLUDED.gender, educationlevel=EXCLUDED.educationlevel, yearofstudy=EXCLUDED.yearofstudy,
        institution=EXCLUDED.institution, fieldofstudy=EXCLUDED.fieldofstudy, gpa=EXCLUDED.gpa,
        country=EXCLUDED.country, state=EXCLUDED.state, pincode=EXCLUDED.pincode, address=EXCLUDED.address,
        caste=EXCLUDED.caste, incomebracket=EXCLUDED.incomebracket, background=EXCLUDED.background,
        careergoals=EXCLUDED.careergoals, extracurriculars=EXCLUDED.extracurriculars, awards=EXCLUDED.awards,
        profiledeadline=EXCLUDED.profiledeadline, languagesspoken=EXCLUDED.languagesspoken,
        volunteerexperience=EXCLUDED.volunteerexperience,
        profile_completion_percentage=EXCLUDED.profile_completion_percentage, last_updated=CURRENT_TIMESTAMP
    `, [
      req.params.userId, p.fullName, p.profileImageUrl, p.phoneNumber, p.age, p.gender,
      p.educationLevel, p.yearOfStudy, p.institution, p.fieldOfStudy, p.gpa, p.country,
      p.state, p.pincode, p.address, p.caste, p.incomeBracket, p.background, p.careerGoals,
      p.extracurriculars, p.awards, p.profileDeadline, p.languagesSpoken, p.volunteerExperience,
      p.profile_completion_percentage || 0
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
app.get("/api/scholarships", async (req, res) => {
  try {
    const scholarships = (await query("SELECT * FROM scholarships")).rows;
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.get("/api/notices", async (req, res) => {
  try {
    const notices = (await query("SELECT * FROM notices ORDER BY date DESC LIMIT 5")).rows;
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

app.post("/api/notifications/email", async (req, res) => {
  const { email, subject, text } = req.body;
  if (!email || !subject || !text) return res.status(400).json({ error: "Missing required fields" });
  try {
    await sendEmail(email, subject, text);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/auth/send-verification", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = (await query("SELECT id FROM users WHERE email=$1", [email])).rows[0];
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;

    await query(`
      INSERT INTO verification_codes (email, code, expires) VALUES ($1,$2,$3)
      ON CONFLICT (email) DO UPDATE SET code=EXCLUDED.code, expires=EXCLUDED.expires
    `, [email, code, expires]);

    await sendEmail(email, "Your MeritUs Verification Code",
      `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`);

    res.json({ message: "Verification code sent", demoCode: code });
  } catch (error) {
    console.error("Error in send-verification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, fullName, country, phoneNumber, code } = req.body;
  try {
    const verification = (await query("SELECT * FROM verification_codes WHERE email=$1", [email])).rows[0] as any;
    if (!verification || verification.code !== code || Number(verification.expires) < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    const passValidation = validatePassword(password);
    if (!passValidation.valid) {
      return res.status(400).json({ error: "Password does not meet requirements", details: passValidation.errors });
    }

    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 12);

    await query(
      "INSERT INTO users (id, email, password_hash, auth_provider, fullname, country, phonenumber) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [id, email, password_hash, 'email', fullName, country, phoneNumber]
    );

    await query("DELETE FROM verification_codes WHERE email=$1", [email]);

    sendEmail(email, "Welcome to MeritUs!",
      `Hi ${fullName},\n\nYour account has been created. Get ready to find the best scholarships!\n\nBest,\nThe MeritUs Team`
    ).catch(console.error);

    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ id, email, fullName, country, phoneNumber, token });
  } catch (error: any) {
    console.error("Error in signup:", error);
    if (error.code === '23505') {
      res.status(400).json({ error: "User already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = (await query("SELECT * FROM users WHERE email=$1", [email])).rows[0] as any;

    if (user?.password_hash) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (match) {
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ id: user.id, email: user.email, fullName: user.fullname, phoneNumber: user.phonenumber, country: user.country, token });
      }
    } else if (user?.password && password === user.password) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ id: user.id, email: user.email, fullName: user.fullname, phoneNumber: user.phonenumber, country: user.country, token });
    }

    res.status(401).json({ error: "Invalid email or password" });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: "Missing or invalid token" });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = (await query("SELECT * FROM users WHERE id=$1", [decoded.id])).rows[0] as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, fullName: user.fullname, phoneNumber: user.phonenumber });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = (await query("SELECT * FROM users WHERE email=$1", [email])).rows[0] as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;
    const id = crypto.randomUUID();

    await query("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1,$2,$3,$4)",
      [id, user.id, code, expires]);

    await sendEmail(email, "Reset Your MeritUs Password",
      `Your 6-digit reset code is:\n\n${code}\n\nExpires in 15 minutes.`);

    res.json({ message: "Reset code sent", demoCode: code });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = (await query("SELECT * FROM users WHERE email=$1", [email])).rows[0] as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetRecord = (await query(
      "SELECT * FROM password_reset_tokens WHERE user_id=$1 AND token=$2 AND used=0 AND expires_at>$3",
      [user.id, code, Date.now()]
    )).rows[0];

    if (resetRecord) res.json({ message: "Code verified successfully" });
    else res.status(400).json({ error: "Invalid or expired reset code" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = (await query("SELECT * FROM users WHERE email=$1", [email])).rows[0] as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const resetRecord = (await query(
      "SELECT * FROM password_reset_tokens WHERE user_id=$1 AND token=$2 AND used=0 AND expires_at>$3",
      [user.id, code, Date.now()]
    )).rows[0] as any;

    if (!resetRecord) return res.status(400).json({ error: "Invalid or expired reset code" });

    const passValidation = validatePassword(newPassword);
    if (!passValidation.valid) return res.status(400).json({ error: "Password does not meet requirements", details: passValidation.errors });

    const password_hash = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password_hash=$1 WHERE id=$2", [password_hash, resetRecord.user_id]);
    await query("UPDATE password_reset_tokens SET used=1 WHERE id=$1", [resetRecord.id]);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/google/url", (req, res) => {
  if (!process.env.APP_URL) return res.status(500).json({ error: "APP_URL is missing" });
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.status(500).json({ error: "Google credentials missing" });

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    redirect_uri: getRedirectUri(),
  });
  res.json({ url });
});

// ─── REMINDERS ────────────────────────────────────────────────────────────────
app.post("/api/reminders", async (req, res) => {
  const { userId, scholarshipId, scholarshipTitle, reminderTime } = req.body;
  const id = crypto.randomUUID();
  try {
    await query("INSERT INTO reminders (id, userid, scholarshipid, scholarshiptitle, remindertime) VALUES ($1,$2,$3,$4,$5)",
      [id, userId, scholarshipId, scholarshipTitle, reminderTime]);
    res.json({ id, userId, scholarshipId, scholarshipTitle, reminderTime });
  } catch (error) {
    res.status(500).json({ error: "Failed to save reminder" });
  }
});

app.get("/api/reminders/:userId", async (req, res) => {
  try {
    const reminders = (await query("SELECT * FROM reminders WHERE userid=$1 AND triggered=0", [req.params.userId])).rows;
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/api/reminders/:id/trigger", async (req, res) => {
  try {
    await query("UPDATE reminders SET triggered=1 WHERE id=$1", [req.params.id]);
    res.json({ message: "Reminder marked as triggered" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

// ─── GOOGLE OAUTH CALLBACK ────────────────────────────────────────────────────
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

  try {
    const { tokens } = await client.getToken({ code: code as string, redirect_uri: getRedirectUri() });
    client.setCredentials(tokens);

    const userInfo = await client.request({ url: "https://www.googleapis.com/oauth2/v3/userinfo" });
    const googleUser = userInfo.data as any;

    let dbUser = (await query("SELECT * FROM users WHERE email=$1", [googleUser.email])).rows[0] as any;

    if (!dbUser) {
      const id = crypto.randomUUID();
      await query("INSERT INTO users (id, email, fullname, auth_provider) VALUES ($1,$2,$3,$4)",
        [id, googleUser.email, googleUser.name, 'google']);
      dbUser = { id, email: googleUser.email, fullname: googleUser.name };
    }

    const jwtToken = jwt.sign({ id: dbUser.id, email: dbUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_AUTH_SUCCESS',
            user: ${JSON.stringify({
              id: dbUser.id,
              email: dbUser.email,
              fullName: dbUser.fullname,
              phoneNumber: dbUser.phonenumber || '',
              token: jwtToken
            })}
          }, '*');
          window.close();
        } else { window.location.href = '/'; }
      </script><p>Authentication successful. This window should close automatically.</p></body></html>
    `);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// ─── VITE / STATIC ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (_req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
