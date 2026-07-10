// Shared local storage keys for login persistence.
const storageKeys = {
  rememberedEmail: "lexreasonRememberedEmail",
  activeUser: "lexreasonChamberUser",
  linkedInJwt: "lexreasonLinkedInJwt",
  facebookAccessToken: "lexreasonFacebookAccessToken",
};

// Utility helpers for route and field validation.
function isDashboardPage() {
  return window.location.pathname.endsWith("dashboard.html");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Error message management for the login form.
function setError(elementId, message) {
  const target = document.getElementById(elementId);
  if (target) {
    target.textContent = message;
  }
}

function clearErrors() {
  ["emailError", "passwordError", "formError"].forEach((id) => setError(id, ""));
}

// Restore remembered email when the login page loads.
function preloadRememberedEmail() {
  const emailInput = document.getElementById("email");
  const rememberMe = document.getElementById("rememberMe");
  const storedEmail = localStorage.getItem(storageKeys.rememberedEmail);

  if (emailInput && rememberMe && storedEmail) {
    emailInput.value = storedEmail;
    rememberMe.checked = true;
  }
}

// Password visibility toggle behavior.
function setupPasswordToggle() {
  const toggle = document.getElementById("passwordToggle");
  const passwordInput = document.getElementById("password");

  if (!toggle || !passwordInput) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(isPassword));
    toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  });
}

// Visual loading state for async-style button actions.
function setLoadingState(button, loading) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-loading", loading);
  button.disabled = loading;
}

// Persistence helpers for chamber login state.
function persistRememberedEmail(email, shouldRemember) {
  if (shouldRemember) {
    localStorage.setItem(storageKeys.rememberedEmail, email);
  } else {
    localStorage.removeItem(storageKeys.rememberedEmail);
  }
}

function getStoredRole() {
  return sessionStorage.getItem("lexreasonSelectedRole") || localStorage.getItem("lexreasonSelectedRole") || "";
}

function persistSelectedRole(role, shouldRemember = true) {
  if (!role) {
    sessionStorage.removeItem("lexreasonSelectedRole");
    if (!shouldRemember) {
      localStorage.removeItem("lexreasonSelectedRole");
    }
    return;
  }

  sessionStorage.setItem("lexreasonSelectedRole", role);
  if (shouldRemember) {
    localStorage.setItem("lexreasonSelectedRole", role);
  }
}

function buildActiveUserPayload(identifier, role = getStoredRole()) {
  if (!identifier) {
    return null;
  }

  return {
    name: identifier,
    role: role || "Independent Litigator"
  };
}

function saveActiveUser(identifierOrPayload, role = getStoredRole()) {
  const payload =
    typeof identifierOrPayload === "string"
      ? buildActiveUserPayload(identifierOrPayload, role)
      : buildActiveUserPayload(
          identifierOrPayload?.name || identifierOrPayload?.email || identifierOrPayload?.displayName,
          identifierOrPayload?.role || role
        );

  if (!payload) {
    return;
  }

  localStorage.setItem(storageKeys.activeUser, JSON.stringify(payload));
}

function getActiveUser() {
  const storedUser = localStorage.getItem(storageKeys.activeUser);
  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser && typeof parsedUser === "object") {
      return {
        name: parsedUser.name || parsedUser.email || "LexReason User",
        role: parsedUser.role || getStoredRole() || "Independent Litigator"
      };
    }
  } catch (error) {
    return buildActiveUserPayload(storedUser, getStoredRole());
  }

  return buildActiveUserPayload(storedUser, getStoredRole());
}

async function waitForFirebaseBridge(timeoutMs = 2500) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const firebaseBridge = window.lexreasonFirebase;
    if (firebaseBridge && typeof firebaseBridge === "object") {
      return firebaseBridge;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return window.lexreasonFirebase || null;
}

async function getFirebaseAuthenticatedUser() {
  const firebaseBridge = await waitForFirebaseBridge();
  if (!firebaseBridge?.enabled || typeof firebaseBridge.getAuthenticatedUser !== "function") {
    return null;
  }

  try {
    return await firebaseBridge.getAuthenticatedUser();
  } catch (error) {
    console.error("Firebase session lookup failed", error);
    return null;
  }
}

function isGoogleRedirectPending() {
  const firebaseBridge = window.lexreasonFirebase;
  if (!firebaseBridge?.enabled || typeof firebaseBridge.isGoogleRedirectPending !== "function") {
    return false;
  }

  try {
    return firebaseBridge.isGoogleRedirectPending();
  } catch (error) {
    console.error("Google redirect state lookup failed", error);
    return false;
  }
}

function clearActiveUser() {
  localStorage.removeItem(storageKeys.activeUser);
  localStorage.removeItem(storageKeys.linkedInJwt);
  localStorage.removeItem(storageKeys.facebookAccessToken);
  localStorage.removeItem("lexreasonSelectedRole");
  sessionStorage.removeItem(storageKeys.activeUser);
  sessionStorage.removeItem(storageKeys.linkedInJwt);
  sessionStorage.removeItem(storageKeys.facebookAccessToken);
  sessionStorage.removeItem("lexreasonSelectedRole");
}

function getSessionUserIdentifier(user) {
  return user?.email || user?.name || "LinkedIn User";
}

function captureOauthRedirectState() {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider");

  if (provider !== "linkedin") {
    return;
  }

  if (params.get("linkedin") === "error") {
    return;
  }

  const email = params.get("email");
  const name = params.get("name");
  saveActiveUser({ name: email || name || "LinkedIn User", role: getStoredRole() });

  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

async function hydrateUserFromSession() {
  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    if (payload?.authenticated && payload.user) {
      saveActiveUser({
        name: getSessionUserIdentifier(payload.user),
        role: payload.user.role || getStoredRole()
      });
    }
  } catch (error) {
    console.error("Session lookup failed", error);
  }
}

async function enforceDashboardAccess() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return true;
  }

  const firebaseUser = await getFirebaseAuthenticatedUser();
  if (firebaseUser) {
    saveActiveUser({
      name: firebaseUser.displayName || firebaseUser.email || firebaseUser.phoneNumber || "Google User",
      role: getStoredRole()
    });
    return true;
  }

  if (isGoogleRedirectPending()) {
    return true;
  }

  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin"
    });

    if (!response.ok) {
      window.location.replace("index.html");
      return false;
    }

    const payload = await response.json();
    if (payload?.authenticated && payload.user) {
      saveActiveUser({
        name: getSessionUserIdentifier(payload.user),
        role: payload.user.role || getStoredRole()
      });
      return true;
    }
  } catch (error) {
    console.error("Dashboard session check failed", error);
  }

  window.location.replace("index.html");
  return false;
}

async function redirectAuthenticatedLogin() {
  if (getActiveUser()) {
    return;
  }

  const firebaseUser = await getFirebaseAuthenticatedUser();
  if (firebaseUser) {
    saveActiveUser({
      name: firebaseUser.displayName || firebaseUser.email || firebaseUser.phoneNumber || "Google User",
      role: getStoredRole()
    });
    window.location.replace("dashboard.html");
    return;
  }

  if (isGoogleRedirectPending()) {
    return;
  }

  try {
    const response = await fetch("/api/me", {
      credentials: "same-origin"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    if (payload?.authenticated && payload.user) {
      saveActiveUser({
        name: getSessionUserIdentifier(payload.user),
        role: payload.user.role || getStoredRole()
      });
      window.location.replace("dashboard.html");
    }
  } catch (error) {
    console.error("Login session check failed", error);
  }
}

// Main login form behavior with validation and redirect.
function setupLoginForm() {
  const form = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginButton");

  if (!form || !loginButton) {
    return;
  }

  preloadRememberedEmail();
  setupPasswordToggle();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();

    const email = document.getElementById("email")?.value ?? "";
    const password = document.getElementById("password")?.value ?? "";
    const role = document.getElementById("role")?.value ?? "";
    const rememberMe = document.getElementById("rememberMe")?.checked ?? false;

    let hasErrors = false;

    if (!email.trim()) {
      setError("emailError", "Please enter your chamber email.");
      hasErrors = true;
    } else if (!isValidEmail(email)) {
      setError("emailError", "Please enter a valid email address.");
      hasErrors = true;
    }

    if (!password.trim()) {
      setError("passwordError", "Please enter your password.");
      hasErrors = true;
    } else if (password.trim().length < 8) {
      setError("passwordError", "Password must be at least 8 characters long.");
      hasErrors = true;
    }

    if (hasErrors) {
      setError("formError", "Fix the highlighted fields and try again.");
      return;
    }

    setLoadingState(loginButton, true);
    window.setTimeout(() => {
      persistRememberedEmail(email.trim(), rememberMe);
      persistSelectedRole(role, rememberMe);
      saveActiveUser({ name: email.trim(), role });
      window.location.href = "dashboard.html";
    }, 500);
  });
}

// Logout handling for the dashboard page.
function setupDashboard() {
  const logoutButton = document.getElementById("logoutButton");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    setLoadingState(logoutButton, true);
    clearActiveUser();
    window.sessionStorage.clear();

    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } catch (error) {
      console.error("Session logout failed", error);
    }

    const firebaseBridge = window.lexreasonFirebase;
    if (firebaseBridge?.enabled && typeof firebaseBridge.signOut === "function") {
      try {
        await firebaseBridge.signOut();
      } catch (error) {
        console.error("Firebase logout failed", error);
      }
    }

    window.location.href = "index.html";
  });
}

// Bootstraps the correct page logic after the DOM is ready.
document.addEventListener("DOMContentLoaded", async () => {
  captureOauthRedirectState();

  await waitForFirebaseBridge();

  if (isDashboardPage()) {
    const canViewDashboard = await enforceDashboardAccess();
    if (!canViewDashboard) {
      return;
    }
    await hydrateUserFromSession();
    setupDashboard();
  } else {
    await redirectAuthenticatedLogin();
    setupLoginForm();
  }
});
