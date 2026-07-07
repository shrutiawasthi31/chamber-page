import crypto from "node:crypto";

const oauthStateCookieName = "lexreason_oauth_state";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing.`);
  }

  return value;
}

export function getLinkedInConfig() {
  return {
    clientId: getRequiredEnv("LINKEDIN_CLIENT_ID"),
    clientSecret: getRequiredEnv("LINKEDIN_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("LINKEDIN_REDIRECT_URI")
  };
}

export function createOauthState() {
  return crypto.randomBytes(24).toString("hex");
}

export function createOauthStateCookie(state) {
  return `${oauthStateCookieName}=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`;
}

export function clearOauthStateCookie() {
  return `${oauthStateCookieName}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function readOauthStateFromRequest(req) {
  const header = req.headers.cookie || "";
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${oauthStateCookieName}=`));

  return cookie ? cookie.slice(oauthStateCookieName.length + 1) : null;
}
