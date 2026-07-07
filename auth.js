import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

function hasFirebaseConfig(config) {
  return Boolean(config && config.apiKey && config.authDomain && config.projectId && config.appId);
}

function setMessage(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getLinkedInBackendUrl() {
  const configuredUrl = window.firebaseSettings?.authRuntime?.linkedinBackendUrl;
  return (configuredUrl || "http://localhost:5000").replace(/\/$/, "");
}

function showToast(title, message, variant = "error") {
  const toastRegion = document.getElementById("toastRegion");
  if (!toastRegion) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${variant}`;
  toast.innerHTML = `<p class="toast__title">${title}</p><p class="toast__body">${message}</p>`;
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

function showLinkedInRetry(message) {
  const assist = document.getElementById("linkedinAssist");
  const assistMessage = document.getElementById("linkedinAssistMessage");
  if (!assist || !assistMessage) {
    return;
  }

  assist.hidden = false;
  assistMessage.textContent = message;
}

function hideLinkedInRetry() {
  const assist = document.getElementById("linkedinAssist");
  const assistMessage = document.getElementById("linkedinAssistMessage");
  if (!assist || !assistMessage) {
    return;
  }

  assist.hidden = true;
  assistMessage.textContent = "";
}

function redirectToUnauthorized(reason) {
  window.location.href = `unauthorized.html?reason=${encodeURIComponent(reason)}`;
}

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error("Invalid token structure.");
  }

  const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(window.atob(padded));
}

function handleLinkedInAuthResult() {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider");
  const status = params.get("linkedin");

  if (provider !== "linkedin" || !status) {
    return false;
  }

  if (status === "error") {
    const reason = params.get("reason");
    const message = params.get("message");

    if (reason === "cancelled") {
      setMessage("formError", "LinkedIn sign-in was cancelled.");
      showToast("LinkedIn Cancelled", "You can retry LinkedIn sign-in whenever you're ready.");
      showLinkedInRetry("LinkedIn sign-in was cancelled before completion.");
    } else if (reason === "invalid_token") {
      redirectToUnauthorized("invalid");
      return true;
    } else if (reason === "expired_token") {
      redirectToUnauthorized("expired");
      return true;
    } else {
      const gracefulMessage = message || "LinkedIn sign-in could not be completed. Please try again.";
      setMessage("formError", gracefulMessage);
      showToast("LinkedIn Unavailable", gracefulMessage);
      showLinkedInRetry("We were able to return you safely to login. You can retry once the connection is stable.");
    }

    window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}`);
    return true;
  }

  const token = params.get("token");
  const email = params.get("email");
  const name = params.get("name");

  if (!token) {
    redirectToUnauthorized("invalid");
    return true;
  }

  try {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      redirectToUnauthorized("expired");
      return true;
    }

    localStorage.setItem("lexreasonLinkedInJwt", token);
    showToast("LinkedIn Connected", "Your LexReason session is ready.", "success");
    saveUserAndRedirect(email || name || payload.email || payload.name || "LinkedIn User");
    return true;
  } catch (error) {
    redirectToUnauthorized("invalid");
    return true;
  }
}

function saveUserAndRedirect(identifier) {
  localStorage.setItem("lexreasonChamberUser", identifier);
  window.location.href = "dashboard.html";
}

function setButtonLoading(button, loading) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-loading", loading);
  button.disabled = loading;
}

function getFacebookLoginUrl() {
  const facebookAppId = window.firebaseSettings?.facebookAppId;
  const redirectUri = `${window.location.origin}${window.location.pathname}`;

  if (!facebookAppId) {
    return null;
  }

  return (
    "https://www.facebook.com/v20.0/dialog/oauth" +
    "?client_id=" +
    facebookAppId +
    "&redirect_uri=" +
    encodeURIComponent(redirectUri) +
    "&scope=public_profile" +
    "&response_type=token"
  );
}

function getFacebookAccessTokenFromHash() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

function getFriendlyAuthError(error, providerName) {
  if (error?.code === "auth/operation-not-allowed") {
    return `${providerName} sign-in is not enabled in Firebase yet.`;
  }

  if (error?.code === "auth/unauthorized-domain") {
    return "This domain is not authorized for Firebase authentication yet.";
  }

  if (error?.code === "auth/popup-closed-by-user") {
    return `${providerName} sign-in was cancelled.`;
  }

  if (error?.code === "auth/invalid-credential" && providerName === "LinkedIn") {
    return "LinkedIn sign-in is configured incorrectly. Check the LinkedIn provider setup in Firebase Identity Platform.";
  }

  return error?.message || `${providerName} sign-in failed.`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function beginLinkedInLogin(linkedinAuthButton) {
  setMessage("formError", "");
  hideLinkedInRetry();
  setButtonLoading(linkedinAuthButton, true);
  const backendUrl = getLinkedInBackendUrl();

  try {
    const healthResponse = await fetchWithTimeout(`${backendUrl}/health`, {
      method: "GET"
    });

    if (healthResponse.status === 401 || healthResponse.status === 403) {
      redirectToUnauthorized("invalid");
      return;
    }

    if (!healthResponse.ok) {
      throw new Error("LinkedIn backend is unavailable.");
    }

    window.location.href = `${backendUrl}/auth/linkedin`;
  } catch (error) {
    setButtonLoading(linkedinAuthButton, false);

    if (error.name === "AbortError") {
      setMessage("formError", "LinkedIn login is taking too long. Please try again.");
      showToast("Network Timeout", "LinkedIn login timed out before the backend responded.");
      showLinkedInRetry("The backend did not respond in time. Retry when your connection is stable.");
      return;
    }

    const gracefulMessage = "LinkedIn login is unavailable because the backend is offline.";
    setMessage("formError", gracefulMessage);
    showToast("Backend Offline", "Start the LinkedIn backend or verify the production backend URL.");
    showLinkedInRetry(`LexReason could not reach the LinkedIn backend at ${backendUrl}.`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (handleLinkedInAuthResult()) {
    return;
  }

  const facebookAccessToken = getFacebookAccessTokenFromHash();
  if (facebookAccessToken && !window.location.pathname.endsWith("dashboard.html")) {
    localStorage.setItem("lexreasonFacebookAccessToken", facebookAccessToken);
    saveUserAndRedirect("Facebook User");
    return;
  }

  const settings = window.firebaseSettings?.firebaseConfig;
  if (!hasFirebaseConfig(settings)) {
    window.lexreasonFirebase = { enabled: false };
    return;
  }

  const app = initializeApp(settings);
  const auth = getAuth(app);
  const isDashboard = window.location.pathname.endsWith("dashboard.html");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  window.lexreasonFirebase = {
    enabled: true,
    signInWithEmailPassword() {
      return signInWithEmailAndPassword(auth, emailInput?.value.trim() || "", passwordInput?.value.trim() || "");
    },
    signOut() {
      return signOut(auth);
    }
  };

  if (isDashboard) {
    return;
  }

  const googleProvider = new GoogleAuthProvider();
  const googleAuthButton = document.getElementById("googleAuthButton");
  const facebookAuthButton = document.getElementById("facebookAuthButton");
  const linkedinAuthButton = document.getElementById("linkedinAuthButton");
  const linkedinRetryButton = document.getElementById("linkedinRetryButton");

  googleAuthButton?.addEventListener("click", async () => {
    setMessage("formError", "");
    setButtonLoading(googleAuthButton, true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      saveUserAndRedirect(result.user.email || result.user.phoneNumber || "Google User");
    } catch (error) {
      setMessage("formError", getFriendlyAuthError(error, "Google"));
    } finally {
      setButtonLoading(googleAuthButton, false);
    }
  });

  facebookAuthButton?.addEventListener("click", () => {
    setMessage("formError", "");
    const facebookLoginUrl = getFacebookLoginUrl();

    if (!facebookLoginUrl) {
      setMessage("formError", "Facebook App ID is missing from configuration.");
      return;
    }

    window.location.href = facebookLoginUrl;
  });

  linkedinAuthButton?.addEventListener("click", async () => {
    await beginLinkedInLogin(linkedinAuthButton);
  });

  linkedinRetryButton?.addEventListener("click", async () => {
    if (!linkedinAuthButton) {
      return;
    }

    await beginLinkedInLogin(linkedinAuthButton);
  });
});
