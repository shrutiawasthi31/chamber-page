import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import linkedinRoutes from "./routes/linkedin.js";
import { authenticateRequest } from "./middleware/auth.js";
import { clearAuthCookie } from "./utils/jwt.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed."));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/auth/linkedin", linkedinRoutes);

app.get("/api/me", authenticateRequest, (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie(process.env.AUTH_COOKIE_NAME || "lexreason_token", clearAuthCookie());
  res.status(200).json({ ok: true });
});

app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/dashboard.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error.";
  res.status(statusCode).json({ ok: false, message });
});

app.listen(port, () => {
  console.log(`LexReason backend running at http://localhost:${port}`);
});
