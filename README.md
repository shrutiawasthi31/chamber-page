# LexReason Chamber Login

A production-ready static login module for **LexReason Chamber**, designed as a premium legal AI experience with a polished split-screen layout, responsive UI, client-side validation, a mock dashboard flow, and automated CI/CD using GitHub Actions and GitHub Pages.

## Project Overview

This project delivers a complete login experience for LexReason Chamber using only HTML5, CSS3, and vanilla JavaScript. It is designed to work by opening `index.html` directly in a browser or by running a lightweight local server such as VS Code Live Server.

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
- GitHub Actions workflow for validation and deployment
- GitHub Pages deployment using official non-deprecated actions

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

## GitHub Pages Deployment

After pushing to GitHub, the workflow automatically validates and deploys the project to GitHub Pages.

Expected live URL format:

```text
https://shrutiawasthi31.github.io/chamber-page/
```

## CI Pipeline Explanation

The GitHub Actions workflow runs on every push to `main`.

It performs these steps:

1. Checks out the repository
2. Installs HTML and CSS validation tools
3. Validates all `.html` files using `htmlhint`
4. Validates all `.css` files using `stylelint`
5. Checks JavaScript syntax using `node --check`
6. If validation succeeds, uploads the project as a Pages artifact
7. Deploys the site to GitHub Pages

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub
- GitHub Actions
- GitHub Pages

## Screenshots

Add project screenshots here after deployment:

- `screenshots/login-page.png`
- `screenshots/dashboard-page.png`

## Future Improvements

- Real authentication with a backend
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

### 7. Enable GitHub Pages

1. Open your repository on GitHub.
2. Go to **Settings**.
3. Click **Pages** in the left sidebar.
4. Under **Build and deployment**, choose **GitHub Actions**.

Because this project already includes a Pages deployment workflow, GitHub Pages should use that workflow directly.

### 8. Access the deployed website

Once deployment finishes, open:

```text
https://shrutiawasthi31.github.io/chamber-page/
```

If it does not appear immediately, wait one or two minutes and refresh.

## How to Explain This to a Mentor

You can present it like this:

1. The project is a static production-style login module built using core web technologies.
2. The UI is responsive and accessible, so it works across desktop and mobile layouts.
3. Validation is handled in JavaScript before login is allowed.
4. The login flow redirects to a separate dashboard page.
5. GitHub Actions validates HTML, CSS, and JavaScript automatically on every push.
6. If the checks pass, the same workflow deploys the project to GitHub Pages.
7. This means the project is not only designed, but also tested and continuously deployed.
