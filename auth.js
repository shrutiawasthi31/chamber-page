import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
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
  const phoneAuthButton = document.getElementById("phoneAuthButton");
  const sendOtpButton = document.getElementById("sendOtpButton");
  const verifyOtpButton = document.getElementById("verifyOtpButton");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  let confirmationResult = null;
  let recaptchaVerifier = null;

  function ensureRecaptcha() {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });
    }
    return recaptchaVerifier;
  }

  googleAuthButton?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      saveUserAndRedirect(result.user.email || result.user.phoneNumber || "Google User");
    } catch (error) {
      setMessage("formError", error.message || "Google sign-in failed.");
    }
  });

  sendOtpButton?.addEventListener("click", async () => {
    try {
      const phoneNumber = document.getElementById("phoneNumber")?.value?.trim() || "";
      setMessage("phoneError", "");
      if (!phoneNumber.startsWith("+")) {
        setMessage("phoneError", "Use country code format, for example +91XXXXXXXXXX.");
        return;
      }
      confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, ensureRecaptcha());
      setMessage("phoneError", "OTP sent successfully.");
    } catch (error) {
      setMessage("phoneError", error.message || "Unable to send OTP right now.");
    }
  });

  verifyOtpButton?.addEventListener("click", async () => {
    try {
      const otpCode = document.getElementById("otpCode")?.value?.trim() || "";
      setMessage("otpError", "");
      if (!confirmationResult) {
        setMessage("otpError", "Send OTP first.");
        return;
      }
      const result = await confirmationResult.confirm(otpCode);
      saveUserAndRedirect(result.user.phoneNumber || "Phone User");
    } catch (error) {
      setMessage("otpError", error.message || "Invalid OTP.");
    }
  });

  window.lexreasonFirebase = {
    enabled: true,
    signInWithEmailPassword() {
      return signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value.trim());
    }
  };
});
