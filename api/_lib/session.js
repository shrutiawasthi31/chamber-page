import crypto from "node:crypto";

const sessionCookieName = "lexreason_session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing.");
  }

  return secret;
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signValue(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionCookie(user) {
  const payload = {
    user,
    exp: Date.now() + 1000 * 60 * 60 * 8
  };
  const encoded = encodePayload(payload);
  const signature = signValue(encoded);

  return `${sessionCookieName}=${encoded}.${signature}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=28800`;
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function readSessionFromRequest(req) {
  const header = req.headers.cookie || "";
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));

  if (!cookie) {
    return null;
  }

  const rawValue = cookie.slice(sessionCookieName.length + 1);
  const [encoded, signature] = rawValue.split(".");

  if (!encoded || !signature) {
    return null;
  }

  if (signValue(encoded) !== signature) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload?.user || !payload?.exp || payload.exp < Date.now()) {
    return null;
  }

  return payload.user;
}
