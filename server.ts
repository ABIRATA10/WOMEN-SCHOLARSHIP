import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { validatePassword } from "./src/utils/passwordValidator";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
      to,
      subject,
      text
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

// Database setup
const db = new Database("database.sqlite");

try { db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email'"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    phoneNumber TEXT,
    resetCode TEXT,
    resetCodeExpires INTEGER,
    password_hash TEXT,
    auth_provider TEXT DEFAULT 'email'
  )
`);

db.exec(`DROP TABLE IF EXISTS user_profiles`);
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    fullName TEXT,
    profileImageUrl TEXT,
    phoneNumber TEXT,
    age INTEGER,
    gender TEXT,
    educationLevel TEXT,
    yearOfStudy TEXT,
    institution TEXT,
    fieldOfStudy TEXT,
    gpa TEXT,
    country TEXT,
    state TEXT,
    pincode TEXT,
    address TEXT,
    caste TEXT,
    incomeBracket TEXT,
    background TEXT,
    careerGoals TEXT,
    extracurriculars TEXT,
    awards TEXT,
    profileDeadline TEXT,
    languagesSpoken TEXT,
    volunteerExperience TEXT,
    profile_completion_percentage INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

db.exec(`
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

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id TEXT,
    scholarship_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, scholarship_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    scholarship_id TEXT,
    status TEXT,
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT,
    body TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    token TEXT,
    expires_at INTEGER,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    email TEXT PRIMARY KEY,
    code TEXT,
    expires INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    userId TEXT,
    scholarshipId TEXT,
    scholarshipTitle TEXT,
    reminderTime TEXT,
    triggered INTEGER DEFAULT 0,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const getRedirectUri = () => {
  const baseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${baseUrl}/auth/google/callback`;
};

// Admin middleware
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
  const userEmail = req.headers['x-user-email'] as string; // Simple auth for demo, in real app use session/token
  
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// Admin routes
app.get("/api/admin/dashboard", isAdmin, (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const totalScholarships = db.prepare("SELECT COUNT(*) as count FROM scholarships").get() as { count: number };
    const totalBookmarks = db.prepare("SELECT COUNT(*) as count FROM bookmarks").get() as { count: number };
    const totalApplications = db.prepare("SELECT COUNT(*) as count FROM applications").get() as { count: number };
    
    const recentSignups = db.prepare("SELECT fullName as name, email, 'N/A' as joined_date FROM users ORDER BY rowid DESC LIMIT 5").all();
    
    // Top 5 most matched scholarships (using bookmarks as proxy for matches for now)
    const topScholarships = db.prepare(`
      SELECT s.name, COUNT(b.scholarship_id) as match_count 
      FROM scholarships s 
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id 
      GROUP BY s.id 
      ORDER BY match_count DESC 
      LIMIT 5
    `).all();

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

app.get("/api/admin/scholarships", isAdmin, (req, res) => {
  try {
    const scholarships = db.prepare("SELECT * FROM scholarships ORDER BY name ASC").all();
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.post("/api/admin/scholarships", isAdmin, (req, res) => {
  const s = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    db.prepare(`
      INSERT INTO scholarships (
        id, name, provider, amount_per_year, eligible_categories, eligible_states, 
        eligible_courses, max_family_income, gender, min_percentage, disability_required, 
        is_active, application_portal_url, deadline_month, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, s.name, s.provider, s.amount_per_year, s.eligible_categories, s.eligible_states,
      s.eligible_courses, s.max_family_income, s.gender, s.min_percentage, s.disability_required ? 1 : 0,
      s.is_active ? 1 : 0, s.application_portal_url, s.deadline_month, s.description
    );
    res.json({ id, ...s });
  } catch (error) {
    res.status(500).json({ error: "Failed to add scholarship" });
  }
});

app.put("/api/admin/scholarships/:id", isAdmin, (req, res) => {
  const s = req.body;
  try {
    db.prepare(`
      UPDATE scholarships SET 
        name = ?, provider = ?, amount_per_year = ?, eligible_categories = ?, eligible_states = ?, 
        eligible_courses = ?, max_family_income = ?, gender = ?, min_percentage = ?, disability_required = ?, 
        is_active = ?, application_portal_url = ?, deadline_month = ?, description = ?
      WHERE id = ?
    `).run(
      s.name, s.provider, s.amount_per_year, s.eligible_categories, s.eligible_states,
      s.eligible_courses, s.max_family_income, s.gender, s.min_percentage, s.disability_required ? 1 : 0,
      s.is_active ? 1 : 0, s.application_portal_url, s.deadline_month, s.description, req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update scholarship" });
  }
});

app.delete("/api/admin/scholarships/:id", isAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM scholarships WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete scholarship" });
  }
});

app.get("/api/admin/students", isAdmin, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT u.id, u.fullName as name, u.email, 
             COALESCE(p.profile_completion_percentage, 0) as completion,
             'N/A' as joined_date, 'N/A' as last_login
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `).all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.delete("/api/admin/students/:id", isAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    db.prepare("DELETE FROM user_profiles WHERE user_id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

app.get("/api/admin/analytics", isAdmin, (req, res) => {
  try {
    const byCategory = db.prepare("SELECT provider as name, COUNT(*) as value FROM scholarships GROUP BY provider").all();
    const topMatched = db.prepare(`
      SELECT s.name, COUNT(b.scholarship_id) as value 
      FROM scholarships s 
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id 
      GROUP BY s.id 
      ORDER BY value DESC 
      LIMIT 10
    `).all();
    const userDistribution = db.prepare("SELECT state as name, COUNT(*) as value FROM user_profiles GROUP BY state").all();
    
    res.json({ byCategory, topMatched, userDistribution });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/admin/notices", isAdmin, (req, res) => {
  try {
    const notices = db.prepare("SELECT * FROM notices ORDER BY date DESC").all();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

app.post("/api/admin/notices", isAdmin, (req, res) => {
  const { title, body } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    db.prepare("INSERT INTO notices (id, title, body) VALUES (?, ?, ?)").run(id, title, body);
    res.json({ id, title, body });
  } catch (error) {
    res.status(500).json({ error: "Failed to add notice" });
  }
});

// Profile routes
app.get("/api/profile/:userId", (req, res) => {
  try {
    const profile = db.prepare("SELECT * FROM user_profiles WHERE user_id = ?").get(req.params.userId);
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/api/profile/:userId", (req, res) => {
  const p = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO user_profiles (
        user_id, fullName, profileImageUrl, phoneNumber, age, gender, educationLevel, yearOfStudy,
        institution, fieldOfStudy, gpa, country, state, pincode, address, caste, incomeBracket,
        background, careerGoals, extracurriculars, awards, profileDeadline, languagesSpoken, volunteerExperience,
        profile_completion_percentage, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      req.params.userId, p.fullName, p.profileImageUrl, p.phoneNumber, p.age, p.gender, p.educationLevel, p.yearOfStudy,
      p.institution, p.fieldOfStudy, p.gpa, p.country, p.state, p.pincode, p.address, p.caste, p.incomeBracket,
      p.background, p.careerGoals, p.extracurriculars, p.awards, p.profileDeadline, p.languagesSpoken, p.volunteerExperience,
      p.profile_completion_percentage || 0
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Notices for users
app.get("/api/scholarships", (req, res) => {
  try {
    const scholarships = db.prepare("SELECT * FROM scholarships").all();
    res.json(scholarships);
  } catch (error) {
    console.error("Failed to fetch scholarships:", error);
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.get("/api/notices", (req, res) => {
  try {
    const notices = db.prepare("SELECT * FROM notices ORDER BY date DESC LIMIT 5").all();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

// API routes
app.post("/api/auth/send-verification", async (req, res) => {
  const { email } = req.body;
  
  // Check if user already exists
  const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  db.prepare("INSERT OR REPLACE INTO verification_codes (email, code, expires) VALUES (?, ?, ?)")
    .run(email, code, expires);
  
  await sendEmail(
    email,
    "Your MeritUs Verification Code",
    `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`
  );
  
  res.json({ message: "Verification code sent", demoCode: code });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, fullName, phoneNumber, code } = req.body;
  
  // Verify code
  const verification = db.prepare("SELECT * FROM verification_codes WHERE email = ?").get(email) as any;
  if (!verification || verification.code !== code || verification.expires < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
  }

  const passValidation = validatePassword(password);
  if (!passValidation.valid) {
    return res.status(400).json({ error: "Password does not meet requirements", details: passValidation.errors });
  }

  const id = Math.random().toString(36).substr(2, 9);
  const password_hash = await bcrypt.hash(password, 12);
  
  try {
    const stmt = db.prepare("INSERT INTO users (id, email, password_hash, auth_provider, fullName, phoneNumber) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(id, email, password_hash, 'email', fullName, phoneNumber);
    
    // Clean up verification code
    db.prepare("DELETE FROM verification_codes WHERE email = ?").run(email);
    
    res.json({ id, email, fullName, phoneNumber });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "User already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user && user.password_hash) {
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      return res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });
    }
  } else if (user && user.password) {
    // Legacy plain text fallback (optional, but good for existing demo users)
    if (password === user.password) {
      return res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber
      });
    }
  }
  
  res.status(401).json({ error: "Invalid email or password" });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const id = Math.random().toString(36).substr(2, 9);
    
    db.prepare("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)").run(id, user.id, token, expires);
    
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendEmail(
      email,
      "Reset Your MeritUs Password",
      `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.`
    );
    
    res.json({ message: "Reset link sent", demoToken: token }); // Sending demoToken for easier testing in this environment
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  const resetRecord = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?").get(token, Date.now()) as any;
  
  if (resetRecord) {
    const passValidation = validatePassword(newPassword);
    if (!passValidation.valid) {
      return res.status(400).json({ error: "Password does not meet requirements", details: passValidation.errors });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, resetRecord.user_id);
    db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(resetRecord.id);
    
    res.json({ message: "Password reset successfully" });
  } else {
    res.status(400).json({ error: "Invalid or expired reset token" });
  }
});

app.get("/api/auth/google/url", (req, res) => {
  const redirectUri = getRedirectUri();
  console.log("Generating Auth URL with redirect_uri:", redirectUri);
  
  if (!process.env.APP_URL) {
    return res.status(500).json({ error: "APP_URL environment variable is missing. This is required for Google Auth." });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Google Client ID or Secret is missing in environment variables." });
  }

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    redirect_uri: redirectUri,
  });
  res.json({ url });
});

// Reminder endpoints
app.post("/api/reminders", (req, res) => {
  const { userId, scholarshipId, scholarshipTitle, reminderTime } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  
  try {
    const stmt = db.prepare("INSERT INTO reminders (id, userId, scholarshipId, scholarshipTitle, reminderTime) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, userId, scholarshipId, scholarshipTitle, reminderTime);
    res.json({ id, userId, scholarshipId, scholarshipTitle, reminderTime });
  } catch (error) {
    console.error("Failed to save reminder:", error);
    res.status(500).json({ error: "Failed to save reminder" });
  }
});

app.get("/api/reminders/:userId", (req, res) => {
  const { userId } = req.params;
  try {
    const reminders = db.prepare("SELECT * FROM reminders WHERE userId = ? AND triggered = 0").all(userId);
    res.json(reminders);
  } catch (error) {
    console.error("Failed to fetch reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/api/reminders/:id/trigger", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE reminders SET triggered = 1 WHERE id = ?").run(id);
    res.json({ message: "Reminder marked as triggered" });
  } catch (error) {
    console.error("Failed to update reminder:", error);
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const redirectUri = getRedirectUri();

  if (!code) {
    return res.status(400).send("No code provided");
  }

  console.log("Handling callback with code and redirect_uri:", redirectUri);

  try {
    const { tokens } = await client.getToken({
      code: code as string,
      redirect_uri: redirectUri,
    });
    client.setCredentials(tokens);

    const userInfo = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const googleUser = userInfo.data as any;

    // Persist user to database if they don't exist
    let dbUser = db.prepare("SELECT * FROM users WHERE email = ?").get(googleUser.email) as any;
    
    if (!dbUser) {
      const id = Math.random().toString(36).substr(2, 9);
      db.prepare("INSERT INTO users (id, email, fullName, auth_provider) VALUES (?, ?, ?, ?)")
        .run(id, googleUser.email, googleUser.name, 'google');
      dbUser = { id, email: googleUser.email, fullName: googleUser.name };
    }

    // Send user back via postMessage to the parent window.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                user: ${JSON.stringify({
                  id: dbUser.id,
                  email: dbUser.email,
                  fullName: dbUser.fullName,
                  phoneNumber: dbUser.phoneNumber || ''
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
