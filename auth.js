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

document.addEventListener("DOMContentLoaded", () => {
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
    setMessage("formError", "");
    setButtonLoading(linkedinAuthButton, true);
    window.location.href = "/auth/linkedin";
  });
});
