# Cloudflare Pages Deployment Guide

## Automatic Deployment via GitHub

### Option 1: Cloudflare Pages Dashboard (Recommended)

1. **Login to Cloudflare**:
   - Go to https://dash.cloudflare.com/
   - Navigate to "Pages" in the sidebar

2. **Create New Project**:
   - Click "Create a project"
   - Select "Connect to Git"
   - Choose "GitHub" and authorize Cloudflare

3. **Select Repository**:
   - Find and select: `lalitnayyar/AIAgenticCourse`
   - Click "Begin setup"

4. **Configure Build Settings**:
   ```
   Project name: personal-ai-learning-portal
   Production branch: main
   Root directory: (leave empty - files are in repository root)
   Framework preset: Create React App
   Build command: npm run build
   Build output directory: build
   ```

5. **Environment Variables** (if needed):
   - No environment variables required for this project

6. **Deploy**:
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy your app

### Option 2: Wrangler CLI

1. **Install Wrangler**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Deploy to Pages**:
   ```bash
   wrangler pages deploy build --project-name=personal-ai-learning-portal
   ```

## Manual Deployment

### Build and Upload

1. **Build Production Version**:
   ```bash
   cd c:\cognigy\aiag\learning-portal
   npm run build
   ```

2. **Upload Build Folder**:
   - Go to Cloudflare Pages dashboard
   - Click "Upload assets"
   - Drag and drop the `build` folder
   - Set project name: `personal-ai-learning-portal`

## Configuration Files

### _redirects (for SPA routing)
```
/*    /index.html   200
```
This file ensures React Router works correctly on Cloudflare Pages.

### wrangler.toml (for CLI deployment)
```toml
name = "personal-ai-learning-portal"
compatibility_date = "2023-12-01"

[env.production]
name = "personal-ai-learning-portal"
```

## Post-Deployment Steps

### 1. Custom Domain (Optional)
- In Cloudflare Pages dashboard
- Go to your project settings
- Click "Custom domains"
- Add your domain (e.g., `ailearning.yourdomain.com`)

### 2. HTTPS Configuration
- Cloudflare automatically provides SSL/TLS
- Your app will be available at: `https://personal-ai-learning-portal.pages.dev`

### 3. Performance Optimization
- Enable Cloudflare's CDN (automatic)
- Configure caching rules if needed
- Enable compression (automatic)

## Expected URLs

After deployment, your app will be available at:
- **Primary**: `https://personal-ai-learning-portal.pages.dev`
- **Custom domain** (if configured): `https://your-custom-domain.com`

## Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Routing Issues
- Ensure `_redirects` file is in the `public` folder
- Check that all routes are client-side (React Router)

### Performance Issues
- Verify build optimization
- Check Cloudflare analytics for bottlenecks
- Enable additional Cloudflare features if needed

## Automatic Updates

Once connected to GitHub:
- Every push to `main` branch triggers automatic deployment
- Build logs available in Cloudflare Pages dashboard
- Rollback available if deployment fails

## Security Features

Cloudflare Pages provides:
- DDoS protection
- Web Application Firewall (WAF)
- Bot protection
- SSL/TLS encryption
- Global CDN

Your Personal AI Learning Portal will be deployed with enterprise-grade security and performance!
