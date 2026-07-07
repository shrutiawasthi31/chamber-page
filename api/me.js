import { readSessionFromRequest } from "./_lib/session.js";

export default function handler(req, res) {
  const user = readSessionFromRequest(req);
  res.status(200).json({
    authenticated: Boolean(user),
    user
  });
}
