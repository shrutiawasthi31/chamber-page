import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const googleRedirectStorageKey = "lexreasonGoogleRedirectPending";
const selectedRoleStorageKey = "lexreasonSelectedRole";

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
  const selectedRole =
    sessionStorage.getItem(selectedRoleStorageKey) ||
    localStorage.getItem(selectedRoleStorageKey) ||
    "Independent Litigator";
  localStorage.setItem(
    "lexreasonChamberUser",
    JSON.stringify({
      name: identifier,
      role: selectedRole
    })
  );
  clearGoogleRedirectPending();
  window.location.replace("dashboard.html");
}

function persistSelectedRoleFromForm() {
  const role = document.getElementById("role")?.value?.trim();
  if (!role) {
    return;
  }

  sessionStorage.setItem(selectedRoleStorageKey, role);
  localStorage.setItem(selectedRoleStorageKey, role);
}

function waitForFirebaseUser(auth, timeoutMs = 1200) {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      resolve(user || null);
    });

    window.setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      unsubscribe();
      resolve(auth.currentUser || null);
    }, timeoutMs);
  });
}

function setButtonLoading(button, loading) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-loading", loading);
  button.disabled = loading;
}

function markGoogleRedirectPending() {
  sessionStorage.setItem(googleRedirectStorageKey, "true");
  localStorage.setItem(googleRedirectStorageKey, "true");
}

function clearGoogleRedirectPending() {
  sessionStorage.removeItem(googleRedirectStorageKey);
  localStorage.removeItem(googleRedirectStorageKey);
}

function isGoogleRedirectPending() {
  return (
    sessionStorage.getItem(googleRedirectStorageKey) === "true" ||
    localStorage.getItem(googleRedirectStorageKey) === "true"
  );
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
  if (error?.code === "auth/popup-blocked") {
    return "Your browser blocked the Google sign-in popup. Please allow popups and try again.";
  }

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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
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
      setMessage("formError", "LinkedIn backend is waking up. Please try again in a moment.");
      showToast("Backend Waking Up", "Render can take a few seconds to respond after idling.");
      showLinkedInRetry("The backend may still be starting. Retry LinkedIn login in a few seconds.");
      return;
    }

    const gracefulMessage = "LinkedIn login is unavailable because the backend is offline.";
    setMessage("formError", gracefulMessage);
    showToast("Backend Offline", "Start the LinkedIn backend or verify the production backend URL.");
    showLinkedInRetry(`LexReason could not reach the LinkedIn backend at ${backendUrl}.`);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
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
    isGoogleRedirectPending,
    async getAuthenticatedUser() {
      const user = await waitForFirebaseUser(auth, isGoogleRedirectPending() ? 5000 : 1800);
      return user
        ? {
            email: user.email,
            phoneNumber: user.phoneNumber,
            displayName: user.displayName
          }
        : null;
    },
    signOut() {
      return signOut(auth);
    }
  };

  if (isDashboard) {
    const firebaseUser = await waitForFirebaseUser(auth, isGoogleRedirectPending() ? 5000 : 1800);
    if (firebaseUser) {
      clearGoogleRedirectPending();
      localStorage.setItem(
        "lexreasonChamberUser",
        JSON.stringify({
          name: firebaseUser.displayName || firebaseUser.email || firebaseUser.phoneNumber || "Google User",
          role:
            sessionStorage.getItem(selectedRoleStorageKey) ||
            localStorage.getItem(selectedRoleStorageKey) ||
            "Independent Litigator"
        })
      );
    }
    return;
  }

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account"
  });
  const googleAuthButton = document.getElementById("googleAuthButton");
  const facebookAuthButton = document.getElementById("facebookAuthButton");
  const linkedinAuthButton = document.getElementById("linkedinAuthButton");
  const linkedinRetryButton = document.getElementById("linkedinRetryButton");

  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        clearGoogleRedirectPending();
        saveUserAndRedirect(result.user.email || result.user.phoneNumber || result.user.displayName || "Google User");
        return;
      }

      if (isGoogleRedirectPending()) {
        const firebaseUser = await waitForFirebaseUser(auth, 5000);
        if (firebaseUser) {
          clearGoogleRedirectPending();
          saveUserAndRedirect(
            firebaseUser.email || firebaseUser.phoneNumber || firebaseUser.displayName || "Google User"
          );
          return;
        }
      }

      clearGoogleRedirectPending();
    })
    .catch((error) => {
      clearGoogleRedirectPending();
      setMessage("formError", getFriendlyAuthError(error, "Google"));
    });

  googleAuthButton?.addEventListener("click", async () => {
    setMessage("formError", "");
    persistSelectedRoleFromForm();
    setButtonLoading(googleAuthButton, true);

    try {
      await signOut(auth).catch(() => {});
      const result = await signInWithPopup(auth, googleProvider);
      saveUserAndRedirect(result.user.email || result.user.phoneNumber || result.user.displayName || "Google User");
    } catch (error) {
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/popup-closed-by-user") {
        try {
          markGoogleRedirectPending();
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          clearGoogleRedirectPending();
          setMessage("formError", getFriendlyAuthError(redirectError, "Google"));
          setButtonLoading(googleAuthButton, false);
          return;
        }
      }

      clearGoogleRedirectPending();
      setMessage("formError", getFriendlyAuthError(error, "Google"));
      setButtonLoading(googleAuthButton, false);
    }
  });

  facebookAuthButton?.addEventListener("click", () => {
    setMessage("formError", "");
    persistSelectedRoleFromForm();
    const facebookLoginUrl = getFacebookLoginUrl();

    if (!facebookLoginUrl) {
      setMessage("formError", "Facebook App ID is missing from configuration.");
      return;
    }

    window.location.href = facebookLoginUrl;
  });

  linkedinAuthButton?.addEventListener("click", async () => {
    persistSelectedRoleFromForm();
    await beginLinkedInLogin(linkedinAuthButton);
  });

  linkedinRetryButton?.addEventListener("click", async () => {
    if (!linkedinAuthButton) {
      return;
    }

    persistSelectedRoleFromForm();
    await beginLinkedInLogin(linkedinAuthButton);
  });
});
