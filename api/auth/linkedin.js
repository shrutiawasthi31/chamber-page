import { createOauthState, createOauthStateCookie, getLinkedInConfig } from "../_lib/linkedin.js";

export default function handler(_req, res) {
  try {
    const { clientId, redirectUri } = getLinkedInConfig();
    const state = createOauthState();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "openid profile email",
      state
    });

    res.setHeader("Set-Cookie", createOauthStateCookie(state));
    res.writeHead(302, {
      Location: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    });
    res.end();
  } catch (error) {
    res.status(500).send(error.message);
  }
}
