# Abhinavas Eye Care IP Management - Auto Deployment Guide

This project includes automated deployment pipelines so that whenever you push commits to GitHub, the web application is automatically built, verified, and deployed without any manual intervention.

---

## 1. Automated GitHub Actions Deployment (Included)

The repository is configured with a GitHub Actions workflow located at:
`.github/workflows/deploy.yml`

### How It Works
1. Every time you push code to the `main` or `master` branch (e.g. directly from git push or your code repository), GitHub Actions automatically triggers.
2. The workflow:
   - Checks out the latest commit.
   - Installs all dependencies (`npm install`).
   - Runs TypeScript validation (`npm run lint`).
   - Compiles the production application (`npm run build`).
   - Automatically deploys the production bundle to **GitHub Pages** (or your configured hosting target).

### Enabling GitHub Pages on your GitHub Repo
1. Go to your GitHub repository -> **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
3. Now, whenever you push, GitHub Pages will automatically update with your live web app URL (e.g., `https://<username>.github.io/<repo-name>/`).

---

## 2. Zero-Config Vercel & Netlify Deployment (Included)

Configuration files `vercel.json` and `netlify.toml` are already present in the project root:

- **Vercel**:
  - Connect your repository in [vercel.com](https://vercel.com).
  - Vercel automatically detects the Vite configuration and deploys on every push.
  - SPA routing is already configured in `vercel.json`.

- **Netlify**:
  - Connect your repository in [netlify.com](https://netlify.com).
  - Netlify automatically deploys every branch push.
  - SPA routing redirects are configured in `netlify.toml`.

---

## 3. Local / LAN Server Deployment

For running in a hospital local area network (LAN) on an internal server:
```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Serve via preview or local static web server
npm run preview -- --port 3000 --host 0.0.0.0
```
The workstation will be accessible across all connected hospital client PCs at `http://<server-ip>:3000`.
