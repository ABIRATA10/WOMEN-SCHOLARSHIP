import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Database setup
const db = new Database("database.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    fullName TEXT,
    phoneNumber TEXT,
    resetCode TEXT,
    resetCodeExpires INTEGER
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

// API routes
app.post("/api/auth/send-verification", (req, res) => {
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
  
  console.log(`[DEMO] Verification code for ${email}: ${code}`);
  res.json({ message: "Verification code sent", demoCode: code });
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password, fullName, phoneNumber, code } = req.body;
  
  // Verify code
  const verification = db.prepare("SELECT * FROM verification_codes WHERE email = ?").get(email) as any;
  if (!verification || verification.code !== code || verification.expires < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
  }

  const id = Math.random().toString(36).substr(2, 9);
  
  try {
    const stmt = db.prepare("INSERT INTO users (id, email, password, fullName, phoneNumber) VALUES (?, ?, ?, ?, ?)");
    stmt.run(id, email, password, fullName, phoneNumber);
    
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

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
  
  if (user) {
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber
    });
  } else {
    res.status(401).json({ error: "Invalid email or password" });
  }
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    db.prepare("UPDATE users SET resetCode = ?, resetCodeExpires = ? WHERE email = ?").run(code, expires, email);
    
    // In a real app, send email here. For demo, we log it.
    console.log(`[DEMO] Reset code for ${email}: ${code}`);
    
    res.json({ message: "Reset code sent", demoCode: code }); // Sending demoCode for easier testing in this environment
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (user && user.resetCode === code && user.resetCodeExpires > Date.now()) {
    db.prepare("UPDATE users SET password = ?, resetCode = NULL, resetCodeExpires = NULL WHERE email = ?").run(newPassword, email);
    res.json({ message: "Password reset successfully" });
  } else {
    res.status(400).json({ error: "Invalid or expired reset code" });
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
      db.prepare("INSERT INTO users (id, email, fullName) VALUES (?, ?, ?)")
        .run(id, googleUser.email, googleUser.name);
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
