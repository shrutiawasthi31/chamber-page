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

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.endsWith("dashboard.html")) return;

  const settings = window.firebaseSettings?.firebaseConfig;
  if (!hasFirebaseConfig(settings)) {
    window.lexreasonFirebase = { enabled: false };
    return;
  }

  const app = initializeApp(settings);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const googleAuthButton = document.getElementById("googleAuthButton");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  googleAuthButton?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      saveUserAndRedirect(result.user.email || result.user.phoneNumber || "Google User");
    } catch (error) {
      setMessage("formError", error.message || "Google sign-in failed.");
    }
  });

  window.lexreasonFirebase = {
    enabled: true,
    signInWithEmailPassword() {
      return signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value.trim());
    }
  };
});
