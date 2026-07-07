import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.SESSION_SECRET || "change-me-in-env";

app.use(express.json());
app.use(
  session({
    name: "lexreason.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.get("/api/me", (req, res) => {
  const user = req.session.user || null;
  res.json({ authenticated: Boolean(user), user });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ ok: false, message: "Unable to log out right now." });
      return;
    }

    res.clearCookie("lexreason.sid");
    res.json({ ok: true });
  });
});

app.get("/auth/linkedin", (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res.status(500).send("Missing LinkedIn OAuth configuration. Add your .env values first.");
    return;
  }

  const state = crypto.randomBytes(24).toString("hex");
  req.session.linkedinOAuthState = state;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
});

app.get("/auth/linkedin/callback", async (req, res) => {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`LinkedIn sign-in failed: ${errorDescription || error}`);
    return;
  }

  if (!code || !state || state !== req.session.linkedinOAuthState) {
    res.status(400).send("Invalid LinkedIn OAuth callback state.");
    return;
  }

  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      })
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${details}`);
    }

    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;

    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      const details = await userInfoResponse.text();
      throw new Error(`Profile request failed (${userInfoResponse.status}): ${details}`);
    }

    const profile = await userInfoResponse.json();
    req.session.user = {
      id: profile.sub,
      email: profile.email || "",
      name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim(),
      givenName: profile.given_name || "",
      familyName: profile.family_name || "",
      picture: profile.picture || ""
    };

    delete req.session.linkedinOAuthState;
    res.redirect("/auth/linkedin/success");
  } catch (authError) {
    res.status(500).send(`LinkedIn sign-in could not be completed. ${authError.message}`);
  }
});

app.get("/auth/linkedin/success", (req, res) => {
  if (!req.session.user) {
    res.redirect("/");
    return;
  }

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Signing you in</title>
  </head>
  <body>
    <script>
      fetch("/api/me", { credentials: "same-origin" })
        .then((response) => response.json())
        .then((payload) => {
          if (payload.authenticated && payload.user) {
            localStorage.setItem("lexreasonChamberUser", payload.user.email || payload.user.name || "LinkedIn User");
          }
          window.location.replace("/dashboard.html");
        })
        .catch(() => {
          window.location.replace("/");
        });
    </script>
  </body>
</html>`);
});

app.get("/dashboard.html", (req, res, next) => {
  if (!req.session.user) {
    res.redirect("/");
    return;
  }

  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`LexReason Chamber running at http://localhost:${port}`);
});
