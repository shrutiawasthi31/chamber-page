import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
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
    "&scope=public_profile"
  );
}

function getFriendlyAuthError(error, providerName) {
  if (error?.code === "auth/operation-not-allowed") {
    return `${providerName} sign-in is not enabled in Firebase yet.`;
  }

  if (error?.code === "auth/popup-closed-by-user") {
    return `${providerName} sign-in was cancelled.`;
  }

  return error?.message || `${providerName} sign-in failed.`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("dashboard.html")) return;

  const settings = window.firebaseSettings?.firebaseConfig;
  if (!hasFirebaseConfig(settings)) {
    window.lexreasonFirebase = { enabled: false };
    return;
  }

  const app = initializeApp(settings);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  const googleAuthButton = document.getElementById("googleAuthButton");
  const facebookAuthButton = document.getElementById("facebookAuthButton");
  const linkedinAuthButton = document.getElementById("linkedinAuthButton");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  googleAuthButton?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      saveUserAndRedirect(result.user.email || result.user.phoneNumber || "Google User");
    } catch (error) {
      setMessage("formError", getFriendlyAuthError(error, "Google"));
    }
  });

  facebookAuthButton?.addEventListener("click", () => {
    const facebookLoginUrl = getFacebookLoginUrl();

    if (!facebookLoginUrl) {
      setMessage("formError", "Facebook App ID is missing from configuration.");
      return;
    }

    window.location.href = facebookLoginUrl;
  });

  linkedinAuthButton?.addEventListener("click", () => {
    setMessage(
      "formError",
      "LinkedIn sign-in needs additional Firebase Identity Platform or custom OAuth setup before it can work."
    );
  });

  window.lexreasonFirebase = {
    enabled: true,
    signInWithEmailPassword() {
      return signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value.trim());
    }
  };
});
