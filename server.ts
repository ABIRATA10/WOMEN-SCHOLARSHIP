import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import { Pool } from "pg";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { validatePassword } from "./src/utils/passwordValidator.js";

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
if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL environment variable is missing.");
  console.error("Please add your PostgreSQL connection string as a Secret named DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/dummy",
  ...(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') ? { ssl: { rejectUnauthorized: false } } : {})
});

const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("Skipping database initialization: DATABASE_URL is not set.");
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        fullName TEXT,
        phoneNumber TEXT,
        resetCode TEXT,
        resetCodeExpires BIGINT,
        password_hash TEXT,
        auth_provider TEXT DEFAULT 'email'
      )
    `);

    await pool.query(`
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
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id TEXT,
        scholarship_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, scholarship_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(scholarship_id) REFERENCES scholarships(id)
      )
    `);

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT,
        expires BIGINT
      )
    `);

    await pool.query(`
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
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

initDb();

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
app.get("/api/admin/dashboard", isAdmin, async (req, res) => {
  try {
    const totalStudents = (await pool.query("SELECT COUNT(*) as count FROM users")).rows[0] as { count: number };
    const totalScholarships = (await pool.query("SELECT COUNT(*) as count FROM scholarships")).rows[0] as { count: number };
    const totalBookmarks = (await pool.query("SELECT COUNT(*) as count FROM bookmarks")).rows[0] as { count: number };
    const totalApplications = (await pool.query("SELECT COUNT(*) as count FROM applications")).rows[0] as { count: number };
    
    const recentSignups = (await pool.query("SELECT fullName as name, email, 'N/A' as joined_date FROM users ORDER BY id DESC LIMIT 5")).rows;
    
    // Top 5 most matched scholarships (using bookmarks as proxy for matches for now)
    const topScholarships = (await pool.query(`
      SELECT s.name, COUNT(b.scholarship_id) as match_count 
      FROM scholarships s 
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id 
      GROUP BY s.id 
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
    const scholarships = (await pool.query("SELECT * FROM scholarships ORDER BY name ASC")).rows;
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.post("/api/admin/scholarships", isAdmin, async (req, res) => {
  const s = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query(`
      INSERT INTO scholarships (
        id, name, provider, amount_per_year, eligible_categories, eligible_states, 
        eligible_courses, max_family_income, gender, min_percentage, disability_required, 
        is_active, application_portal_url, deadline_month, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
    await pool.query(`
      UPDATE scholarships SET 
        name = $1, provider = $2, amount_per_year = $3, eligible_categories = $4, eligible_states = $5, 
        eligible_courses = $6, max_family_income = $7, gender = $8, min_percentage = $9, disability_required = $10, 
        is_active = $11, application_portal_url = $12, deadline_month = $13, description = $14
      WHERE id = $15
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
    await pool.query("DELETE FROM scholarships WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete scholarship" });
  }
});

app.get("/api/admin/students", isAdmin, async (req, res) => {
  try {
    const students = (await pool.query(`
      SELECT u.id, u.fullName as name, u.email, 
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
    await pool.query("DELETE FROM user_profiles WHERE user_id = $1", [req.params.id]);
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

app.get("/api/admin/analytics", isAdmin, async (req, res) => {
  try {
    const byCategory = (await pool.query("SELECT provider as name, COUNT(*) as value FROM scholarships GROUP BY provider")).rows;
    const topMatched = (await pool.query(`
      SELECT s.name, COUNT(b.scholarship_id) as value 
      FROM scholarships s 
      LEFT JOIN bookmarks b ON s.id = b.scholarship_id 
      GROUP BY s.id 
      ORDER BY value DESC 
      LIMIT 10
    `)).rows;
    const userDistribution = (await pool.query("SELECT state as name, COUNT(*) as value FROM user_profiles GROUP BY state")).rows;
    
    res.json({ byCategory, topMatched, userDistribution });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/admin/notices", isAdmin, async (req, res) => {
  try {
    const notices = (await pool.query("SELECT * FROM notices ORDER BY date DESC")).rows;
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

app.post("/api/admin/notices", isAdmin, async (req, res) => {
  const { title, body } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await pool.query("INSERT INTO notices (id, title, body) VALUES ($1, $2, $3)", [id, title, body]);
    res.json({ id, title, body });
  } catch (error) {
    res.status(500).json({ error: "Failed to add notice" });
  }
});

// Profile routes
app.get("/api/profile/:userId", async (req, res) => {
  try {
    const profile = (await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [req.params.userId])).rows[0];
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.post("/api/profile/:userId", async (req, res) => {
  const p = req.body;
  try {
    await pool.query(`
      INSERT INTO user_profiles (
        user_id, fullName, profileImageUrl, phoneNumber, age, gender, educationLevel, yearOfStudy,
        institution, fieldOfStudy, gpa, country, state, pincode, address, caste, incomeBracket,
        background, careerGoals, extracurriculars, awards, profileDeadline, languagesSpoken, volunteerExperience,
        profile_completion_percentage, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        fullName = EXCLUDED.fullName, profileImageUrl = EXCLUDED.profileImageUrl, phoneNumber = EXCLUDED.phoneNumber, age = EXCLUDED.age, gender = EXCLUDED.gender, educationLevel = EXCLUDED.educationLevel, yearOfStudy = EXCLUDED.yearOfStudy,
        institution = EXCLUDED.institution, fieldOfStudy = EXCLUDED.fieldOfStudy, gpa = EXCLUDED.gpa, country = EXCLUDED.country, state = EXCLUDED.state, pincode = EXCLUDED.pincode, address = EXCLUDED.address, caste = EXCLUDED.caste, incomeBracket = EXCLUDED.incomeBracket,
        background = EXCLUDED.background, careerGoals = EXCLUDED.careerGoals, extracurriculars = EXCLUDED.extracurriculars, awards = EXCLUDED.awards, profileDeadline = EXCLUDED.profileDeadline, languagesSpoken = EXCLUDED.languagesSpoken, volunteerExperience = EXCLUDED.volunteerExperience,
        profile_completion_percentage = EXCLUDED.profile_completion_percentage, last_updated = CURRENT_TIMESTAMP
    `, [
      req.params.userId, p.fullName, p.profileImageUrl, p.phoneNumber, p.age, p.gender, p.educationLevel, p.yearOfStudy,
      p.institution, p.fieldOfStudy, p.gpa, p.country, p.state, p.pincode, p.address, p.caste, p.incomeBracket,
      p.background, p.careerGoals, p.extracurriculars, p.awards, p.profileDeadline, p.languagesSpoken, p.volunteerExperience,
      p.profile_completion_percentage || 0
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// Notices for users
app.get("/api/scholarships", async (req, res) => {
  try {
    const scholarships = (await pool.query("SELECT * FROM scholarships")).rows;
    res.json(scholarships);
  } catch (error) {
    console.error("Failed to fetch scholarships:", error);
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

app.get("/api/notices", async (req, res) => {
  try {
    const notices = (await pool.query("SELECT * FROM notices ORDER BY date DESC LIMIT 5")).rows;
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

// API routes
app.post("/api/auth/send-verification", async (req, res) => {
  const { email } = req.body;
  
  // Check if user already exists
  const existingUser = (await pool.query("SELECT * FROM users WHERE email = $1", [email])).rows[0];
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  await pool.query(`
    INSERT INTO verification_codes (email, code, expires) VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires = EXCLUDED.expires
  `, [email, code, expires]);
  
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
  const verification = (await pool.query("SELECT * FROM verification_codes WHERE email = $1", [email])).rows[0] as any;
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
    await pool.query("INSERT INTO users (id, email, password_hash, auth_provider, fullName, phoneNumber) VALUES ($1, $2, $3, $4, $5, $6)", 
      [id, email, password_hash, 'email', fullName, phoneNumber]);
    
    // Clean up verification code
    await pool.query("DELETE FROM verification_codes WHERE email = $1", [email]);
    
    res.json({ id, email, fullName, phoneNumber });
  } catch (error: any) {
    if (error.message.includes("unique constraint")) {
      res.status(400).json({ error: "User already exists" });
    } else {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email])).rows[0] as any;
  
  if (user && user.password_hash) {
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      return res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullname,
        phoneNumber: user.phonenumber
      });
    }
  } else if (user && user.password) {
    // Legacy plain text fallback (optional, but good for existing demo users)
    if (password === user.password) {
      return res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullname,
        phoneNumber: user.phonenumber
      });
    }
  }
  
  res.status(401).json({ error: "Invalid email or password" });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email])).rows[0] as any;
  
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    const id = Math.random().toString(36).substr(2, 9);
    
    await pool.query("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)", [id, user.id, token, expires]);
    
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
  
  const resetRecord = (await pool.query("SELECT * FROM password_reset_tokens WHERE token = $1 AND used = 0 AND expires_at > $2", [token, Date.now()])).rows[0] as any;
  
  if (resetRecord) {
    const passValidation = validatePassword(newPassword);
    if (!passValidation.valid) {
      return res.status(400).json({ error: "Password does not meet requirements", details: passValidation.errors });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, resetRecord.user_id]);
    await pool.query("UPDATE password_reset_tokens SET used = 1 WHERE id = $1", [resetRecord.id]);
    
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
app.post("/api/reminders", async (req, res) => {
  const { userId, scholarshipId, scholarshipTitle, reminderTime } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  
  try {
    await pool.query("INSERT INTO reminders (id, userId, scholarshipId, scholarshipTitle, reminderTime) VALUES ($1, $2, $3, $4, $5)", [id, userId, scholarshipId, scholarshipTitle, reminderTime]);
    res.json({ id, userId, scholarshipId, scholarshipTitle, reminderTime });
  } catch (error) {
    console.error("Failed to save reminder:", error);
    res.status(500).json({ error: "Failed to save reminder" });
  }
});

app.get("/api/reminders/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const reminders = (await pool.query("SELECT * FROM reminders WHERE userId = $1 AND triggered = 0", [userId])).rows;
    res.json(reminders);
  } catch (error) {
    console.error("Failed to fetch reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/api/reminders/:id/trigger", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE reminders SET triggered = 1 WHERE id = $1", [id]);
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
    let dbUser = (await pool.query("SELECT * FROM users WHERE email = $1", [googleUser.email])).rows[0] as any;
    
    if (!dbUser) {
      const id = Math.random().toString(36).substr(2, 9);
      await pool.query("INSERT INTO users (id, email, fullname, auth_provider) VALUES ($1, $2, $3, $4)", [id, googleUser.email, googleUser.name, 'google']);
      dbUser = { id, email: googleUser.email, fullname: googleUser.name };
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
                  fullName: dbUser.fullname,
                  phoneNumber: dbUser.phonenumber || ''
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
