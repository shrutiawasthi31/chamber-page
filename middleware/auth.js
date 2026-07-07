import { verifyAuthToken } from "../utils/jwt.js";

function readTokenFromRequest(req) {
  const cookieName = process.env.AUTH_COOKIE_NAME || "lexreason_token";
  const authHeader = req.headers.authorization || "";

  if (req.cookies?.[cookieName]) {
    return req.cookies[cookieName];
  }

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return null;
}

export function authenticateRequest(req, _res, next) {
  try {
    const token = readTokenFromRequest(req);

    if (!token) {
      const error = new Error("Authentication required.");
      error.statusCode = 401;
      throw error;
    }

    req.user = verifyAuthToken(token);
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
}
