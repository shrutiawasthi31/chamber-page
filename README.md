# LexReason Chamber Login

A production-ready login module for **LexReason Chamber**, designed as a premium legal AI experience with a polished split-screen layout, responsive UI, client-side validation, Firebase-ready login paths, and a LinkedIn OAuth flow backed by a small Node server.

## Project Overview

This project delivers a complete login experience for LexReason Chamber using HTML5, CSS3, vanilla JavaScript, and a lightweight Node/Express server for LinkedIn sign-in.

## Features

- Premium white-and-gold legal-tech visual design
- Responsive split-screen layout for desktop, tablet, and mobile
- Branded hero panel with chamber imagery and product messaging
- Accessible sign-in form with semantic markup and keyboard-friendly controls
- Email validation and password length validation
- Show and hide password toggle
- Remember Me persistence using `localStorage`
- Mock login success flow with loading state
- Dashboard page with logout action
- Firebase-ready email and password sign-in
- Firebase-ready phone number sign-in with OTP and reCAPTCHA container
- Smooth fade-in, hover interactions, and polished button states
- GitHub Actions workflow for validation
- LinkedIn OAuth sign-in using a Node/Express backend

## Folder Structure

```text
chamber-page/
├── index.html
├── dashboard.html
├── style.css
├── script.js
├── auth.js
├── firebase-config.js
├── README.md
├── .htmlhintrc
├── .stylelintrc.json
├── assets/
│   ├── logo.png
│   ├── chamber-background.jpg
│   └── icons/
└── .github/
    └── workflows/
        └── ci.yml
```

## Installation

1. Clone the repository.
2. Open the project folder in VS Code or any editor.
3. Make sure the files remain in the root exactly as committed.

## Run Locally

You can run the project in either of these simple ways:

### Option 1: Open directly

Double-click `index.html` and it will open in your browser.

### Option 2: Use VS Code Live Server

1. Open the folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html`.
4. Click **Open with Live Server**.

### Option 3: Run LinkedIn sign-in locally

To use LinkedIn login without Firebase, run the app through the included Node server:

1. Create `.env` from `.env.example`.
2. Fill in:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
   - `LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback`
   - `SESSION_SECRET` with any long random string
3. In your LinkedIn developer app, add this authorized redirect URL:
   - `http://localhost:3000/auth/linkedin/callback`
4. Install dependencies:

```bash
npm install
```

5. Start the local server:

```bash
npm start
```

6. Open:

```text
http://localhost:3000
```

## Firebase Authentication Setup

To enable real Firebase authentication for email and phone number:

1. Create a Firebase project and add a web app.
2. In Firebase Console, open `Authentication`.
3. Enable:
   - `Email/Password`
   - `Phone`
4. Copy your Firebase web app credentials into `firebase-config.js`.
5. For phone sign-in, make sure your domain is authorized in Firebase and keep the reCAPTCHA container visible.

If `firebase-config.js` is still empty, the project keeps using the current mock login flow for the main button.

## Production Deployment

This project now uses a split deployment:

- Frontend: GitHub Pages
- Backend: Render

GitHub Pages hosts the static LexReason UI. Render hosts the Express backend required for LinkedIn OAuth.

### 1. Prepare Production URLs

Choose your final production URLs first. Current project values:

- Frontend: `https://shrutiawasthi31.github.io/chamber-page`
- Backend: `https://chamber-page-2.onrender.com`

### 2. Update Frontend Runtime Config

Edit [firebase-config.js](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/firebase-config.js:1) and replace:

```js
https://chamber-page-2.onrender.com
```

with your real Render backend URL.

This is what the GitHub Pages frontend will use for:

- `GET /health`
- `GET /auth/linkedin`

### 3. Configure LinkedIn Redirect URI

In LinkedIn Developer Portal, set the production OAuth callback to:

```text
https://chamber-page-2.onrender.com/auth/linkedin/callback
```

Then set the backend env var:

```text
LINKEDIN_REDIRECT_URI=https://chamber-page-2.onrender.com/auth/linkedin/callback
```

The LinkedIn callback must point to Render, not GitHub Pages, because GitHub Pages cannot run the OAuth token exchange.

### 4. Configure Render Backend

This repository includes [render.yaml](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/render.yaml:1) with:

- `autoDeploy: false`
- `healthCheckPath: /health`
- required environment variable keys

On Render:

1. Create a new **Web Service**
2. Connect your GitHub repository
3. Let Render detect `render.yaml`
4. Fill in all `sync: false` env vars
5. Save without deploying automatically
6. Trigger the first manual deploy when ready

Production Render environment values should look like:

```text
NODE_ENV=production
FRONTEND_URL=https://shrutiawasthi31.github.io/chamber-page
FRONTEND_SUCCESS_URL=https://shrutiawasthi31.github.io/chamber-page
CORS_ORIGIN=https://shrutiawasthi31.github.io/chamber-page
LINKEDIN_REDIRECT_URI=https://chamber-page-2.onrender.com/auth/linkedin/callback
```

Also set:

- `JWT_SECRET`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 5. Configure Firebase For Production

In Firebase Console:

1. Open Authentication
2. Add your GitHub Pages domain to **Authorized domains**
3. Keep Google and Email/Password providers enabled
4. Verify your production frontend URL is allowed

Without this, Google sign-in can fail with an unauthorized domain error.

### 6. Configure GitHub Pages Frontend

This repository now includes a manual workflow:

- [.github/workflows/deploy-pages.yml](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/.github/workflows/deploy-pages.yml:1)

It deploys only the static frontend files and runs only when manually started from GitHub Actions.

To enable it:

1. Push the repository to GitHub
2. Open **Settings > Pages**
3. Set **Source** to **GitHub Actions**
4. Open the **Actions** tab
5. Run **Deploy Frontend To GitHub Pages** manually

This satisfies the requirement to prepare deployment without deploying automatically.

### 7. Update Local Environment Template

Use [.env.example](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/.env.example:1) as the template for both local and production values.

Important production variables:

```text
FRONTEND_URL=https://shrutiawasthi31.github.io/chamber-page
FRONTEND_SUCCESS_URL=https://shrutiawasthi31.github.io/chamber-page
CORS_ORIGIN=https://shrutiawasthi31.github.io/chamber-page
RENDER_EXTERNAL_URL=https://chamber-page-2.onrender.com
LINKEDIN_REDIRECT_URI=https://chamber-page-2.onrender.com/auth/linkedin/callback
```

### 8. Deploy Order

Use this order to avoid broken OAuth:

1. Create the Render backend service
2. Copy the real Render URL
3. Update `firebase-config.js` with that Render URL
4. Set LinkedIn production redirect URI to the Render callback URL
5. Add Render environment variables
6. Deploy Render manually
7. Enable GitHub Pages
8. Run the manual GitHub Pages workflow
9. Test Google login on GitHub Pages
10. Test LinkedIn login from GitHub Pages to Render

### 9. What Changes For Each Platform

GitHub Pages handles:

- `index.html`
- `dashboard.html`
- `unauthorized.html`
- `style.css`
- `script.js`
- `auth.js`
- `firebase-config.js`
- `assets/`

Render handles:

- Express server in [server.js](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/server.js:1)
- LinkedIn OAuth routes
- JWT creation
- Firebase Admin user lookup and creation

### 10. Final Production Checklist

Before going live, verify:

1. `firebase-config.js` points to `https://chamber-page-2.onrender.com`
2. Render `CORS_ORIGIN` exactly matches `https://shrutiawasthi31.github.io/chamber-page`
3. `LINKEDIN_REDIRECT_URI` exactly matches `https://chamber-page-2.onrender.com/auth/linkedin/callback`
4. Firebase Authorized Domains includes `shrutiawasthi31.github.io`
5. GitHub Pages is configured to use GitHub Actions
6. Render backend `/health` responds successfully
7. LinkedIn login opens from the GitHub Pages site and returns to the frontend correctly

## CI Pipeline Explanation

The GitHub Actions workflow runs on every push to `main`.

It performs these steps:

1. Checks out the repository
2. Installs HTML and CSS validation tools
3. Validates all `.html` files using `htmlhint`
4. Validates all `.css` files using `stylelint`
5. Checks JavaScript syntax using `node --check`
6. Validates the backend entry file `server.js`

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub
- GitHub Actions
- Node.js
- Express

## Screenshots

Add project screenshots here after deployment:

- `screenshots/login-page.png`
- `screenshots/dashboard-page.png`

## Future Improvements

- Production session store instead of in-memory sessions
- Password recovery workflow
- Phone authentication integration
- Multi-role chamber access
- Protected dashboard sessions
- Dark mode option

## Beginner-Friendly Push and Deploy Steps

### 1. Initialize Git

If Git is not already initialized, run:

```bash
git init
```

This tells Git to start tracking the project files.

### 2. Add the project files

```bash
git add .
```

This stages all files so they are ready to be saved in a commit.

### 3. Create your first commit

```bash
git commit -m "Build LexReason Chamber login module"
```

A commit is a saved checkpoint of your work.

### 4. Connect to your GitHub repository

```bash
git remote add origin https://github.com/shrutiawasthi31/chamber-page.git
```

This links your local project to your GitHub repository.

If the remote already exists, update it with:

```bash
git remote set-url origin https://github.com/shrutiawasthi31/chamber-page.git
```

### 5. Push to GitHub

```bash
git branch -M main
git push -u origin main
```

This sends your local project to GitHub and makes `main` the primary branch.

### 6. Verify the GitHub Action

1. Open your repository on GitHub.
2. Click the **Actions** tab.
3. Open the latest workflow run.
4. Confirm that the validation steps passed.
5. Confirm that the deploy step also passed.

This proves that the project is tested and deployment-ready.

### 7. Deploy Frontend And Backend Manually

1. Manually deploy the Render backend.
2. Manually run the GitHub Pages workflow.
3. Verify the frontend can reach the Render backend.

## How to Explain This to a Mentor

You can present it like this:

1. The project is a static production-style login module built using core web technologies.
2. The UI is responsive and accessible, so it works across desktop and mobile layouts.
3. Validation is handled in JavaScript before login is allowed.
4. The login flow redirects to a separate dashboard page.
5. GitHub Actions validates HTML, CSS, and JavaScript automatically on every push.
6. If the checks pass, the same workflow deploys the project to GitHub Pages.
7. This means the project is not only designed, but also tested and continuously deployed.
