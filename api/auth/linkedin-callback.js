import {
  clearOauthStateCookie,
  getLinkedInConfig,
  readOauthStateFromRequest
} from "../_lib/linkedin.js";
import { createSessionCookie } from "../_lib/session.js";

export default async function handler(req, res) {
  const { code, state, error, error_description: errorDescription } = req.query;

  if (error) {
    res.status(400).send(`LinkedIn sign-in failed: ${errorDescription || error}`);
    return;
  }

  const cookieState = readOauthStateFromRequest(req);
  if (!code || !state || !cookieState || state !== cookieState) {
    res.status(400).send("Invalid LinkedIn OAuth callback state.");
    return;
  }

  try {
    const { clientId, clientSecret, redirectUri } = getLinkedInConfig();
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(await tokenResponse.text());
    }

    const tokenJson = await tokenResponse.json();
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error(await userInfoResponse.text());
    }

    const profile = await userInfoResponse.json();
    const user = {
      id: profile.sub,
      email: profile.email || "",
      name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim(),
      givenName: profile.given_name || "",
      familyName: profile.family_name || "",
      picture: profile.picture || ""
    };

    res.setHeader("Set-Cookie", [clearOauthStateCookie(), createSessionCookie(user)]);
    res.writeHead(302, { Location: "/dashboard.html" });
    res.end();
  } catch (authError) {
    res.status(500).send(`LinkedIn sign-in could not be completed. ${authError.message}`);
  }
}
