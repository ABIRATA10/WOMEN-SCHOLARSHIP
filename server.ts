import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const getRedirectUri = () => {
  const baseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${baseUrl}/auth/google/callback`;
};

// API routes
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

    const user = userInfo.data as any;

    // In a real app, you'd save this to a database.
    // Here we just send it back via postMessage to the parent window.
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                user: {
                  id: '${user.sub}',
                  email: '${user.email}',
                  fullName: '${user.name}'
                }
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
