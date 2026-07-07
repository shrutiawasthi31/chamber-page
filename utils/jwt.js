import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error("JWT_SECRET is required.");
    error.statusCode = 500;
    throw error;
  }

  return secret;
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture || "",
      provider: user.provider || "linkedin",
      linkedinId: user.linkedinId || ""
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "lexreason"
    }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: "lexreason"
  });
}

export function createAuthCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8
  };
}

export function clearAuthCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  };
}
