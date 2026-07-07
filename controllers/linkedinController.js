import {
  buildLinkedInAuthorizationUrl,
  createOrGetUser,
  exchangeCodeForAccessToken,
  fetchLinkedInEmail,
  fetchLinkedInProfile,
  generateOauthState,
  normalizeLinkedInUser
} from "../services/linkedinService.js";
import { createAuthCookie, signAuthToken } from "../utils/jwt.js";

const oauthCookieName = process.env.LINKEDIN_STATE_COOKIE_NAME || "lexreason_linkedin_oauth_state";
const authCookieName = process.env.AUTH_COOKIE_NAME || "lexreason_token";

function getFrontendRedirectUrl() {
  return process.env.FRONTEND_URL || "http://localhost:3000";
}

function buildSuccessRedirectUrl(baseUrl, user, token) {
  const redirectUrl = new URL(baseUrl);
  redirectUrl.searchParams.set("provider", "linkedin");
  redirectUrl.searchParams.set("linkedin", "success");
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("email", user.email || "");
  redirectUrl.searchParams.set("name", user.name || "");
  return redirectUrl.toString();
}

function buildErrorRedirectUrl(baseUrl, reason, message) {
  const redirectUrl = new URL(baseUrl);
  redirectUrl.searchParams.set("provider", "linkedin");
  redirectUrl.searchParams.set("linkedin", "error");
  redirectUrl.searchParams.set("reason", reason);
  if (message) {
    redirectUrl.searchParams.set("message", message);
  }
  return redirectUrl.toString();
}

export function redirectToLinkedIn(_req, res) {
  const state = generateOauthState();
  const authUrl = buildLinkedInAuthorizationUrl(state);

  res.cookie(oauthCookieName, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 10,
    path: "/"
  });

  res.redirect(authUrl);
}

export async function handleLinkedInCallback(req, res, next) {
  const { code, state, error, error_description: errorDescription } = req.query;
  const storedState = req.cookies[oauthCookieName];
  const frontendUrl = getFrontendRedirectUrl();

  if (error) {
    const reason = error === "user_cancelled_login" || error === "access_denied" ? "cancelled" : "oauth_error";
    res.clearCookie(oauthCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    res.redirect(buildErrorRedirectUrl(frontendUrl, reason, errorDescription || error));
    return;
  }

  if (!code || !state || !storedState || state !== storedState) {
    res.clearCookie(oauthCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    res.redirect(buildErrorRedirectUrl(frontendUrl, "invalid_token", "Invalid LinkedIn OAuth state."));
    return;
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(String(code));
    const [profile, email] = await Promise.all([
      fetchLinkedInProfile(accessToken),
      fetchLinkedInEmail(accessToken)
    ]);

    const normalizedUser = normalizeLinkedInUser(profile, email);
    const appUser = await createOrGetUser(normalizedUser);
    const token = signAuthToken(appUser);

    res.clearCookie(oauthCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    res.cookie(authCookieName, token, createAuthCookie());
    res.redirect(buildSuccessRedirectUrl(frontendUrl, appUser, token));
  } catch (error) {
    const message = error.response?.data?.error_description || error.message || "LinkedIn sign-in failed.";
    res.clearCookie(oauthCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    res.redirect(buildErrorRedirectUrl(frontendUrl, "oauth_error", message));
  }
}

export function getCurrentUser(req, res) {
  res.status(200).json({
    authenticated: true,
    user: req.user
  });
}
