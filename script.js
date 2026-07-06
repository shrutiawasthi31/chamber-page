// Shared local storage keys for login persistence.
const storageKeys = {
  rememberedEmail: "lexreasonRememberedEmail",
  activeUser: "lexreasonChamberUser",
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

function saveActiveUser(email) {
  localStorage.setItem(storageKeys.activeUser, email);
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

    const firebaseBridge = window.lexreasonFirebase;
    if (firebaseBridge?.enabled) {
      firebaseBridge
        .signInWithEmailPassword()
        .then((result) => {
          persistRememberedEmail(email.trim(), rememberMe);
          saveActiveUser(result.user.email || email.trim());
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          setLoadingState(loginButton, false);
          setError("formError", error.message || "Unable to sign in with Firebase.");
        });
      return;
    }

    setTimeout(() => {
      persistRememberedEmail(email.trim(), rememberMe);
      saveActiveUser(email.trim());
      window.location.href = "dashboard.html";
    }, 1200);
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
    localStorage.removeItem(storageKeys.activeUser);

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
document.addEventListener("DOMContentLoaded", () => {
  if (isDashboardPage()) {
    setupDashboard();
  } else {
    setupLoginForm();
  }
});
