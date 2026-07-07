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

## Live Deployment

Because LinkedIn sign-in now depends on a Node server, this project should be deployed to a runtime host such as Render, Railway, or another Node hosting platform. GitHub Pages cannot run the backend required for LinkedIn OAuth.

This repository includes [render.yaml](/Users/shrutismac/Documents/Codex/2026-07-02/lexreason-https-www-figma-com-proto/work/chamber-page/render.yaml:1) for easy Render deployment.

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

### 7. Deploy to Render

1. Push this repository to GitHub.
2. Create a new Render Web Service from the repo.
3. Render will detect `render.yaml`.
4. Add environment variables:
   - `SESSION_SECRET`
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
   - `LINKEDIN_REDIRECT_URI`
5. Set the production LinkedIn redirect URL in the LinkedIn developer console to:

```text
https://your-render-service.onrender.com/auth/linkedin/callback
```

### 8. Access the deployed website

Open your Render service URL after deployment finishes.

## How to Explain This to a Mentor

You can present it like this:

1. The project is a static production-style login module built using core web technologies.
2. The UI is responsive and accessible, so it works across desktop and mobile layouts.
3. Validation is handled in JavaScript before login is allowed.
4. The login flow redirects to a separate dashboard page.
5. GitHub Actions validates HTML, CSS, and JavaScript automatically on every push.
6. If the checks pass, the same workflow deploys the project to GitHub Pages.
7. This means the project is not only designed, but also tested and continuously deployed.
