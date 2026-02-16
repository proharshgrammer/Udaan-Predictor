# Deployment Guide for Render

This guide outlines the steps to deploy the backend of the Predictor application to **Render**.

## 1. Create a New Web Service
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.

## 2. Configure Service Settings
- **Name**: `predictor-backend` (or your preferred name)
- **Region**: Choose the one closest to your users (e.g., Singapore for India).
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: `server` (Important! Since your backend code is in the `server` folder)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

## 3. Environment Variables
You must set the following environment variables in the **Environment** tab on Render:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String from Neon | `postgres://user:pass@ep-xyz.region.aws.neon.tech/dbname?sslmode=require` |
| `REDIS_URL` | Redis Connection String from Upstash | `rediss://default:pass@region.upstash.io:6379` |
| `PORT` | Render sets this automatically, but good to have. | `10000` |
| `JWT_SECRET` | Secret key for JWT authentication | `your-secret-key-here` |
| `CRON_SECRET` | Secret key for securing the cron endpoint | `a-very-long-random-string` |
| `FRONTEND_URL` | URL of your deployed frontend (Vercel) | `https://your-frontend.vercel.app` |

## 4. Cron Job Setup (Cron-job.org)
Since Render's free tier spins down after inactivity, we use an external service to keep it awake and trigger tasks.

1. Go to [cron-job.org](https://cron-job.org/) and create an account.
2. Click **Create Cronjob**.
3. **Title**: `Predictor Sync`
4. **URL**: `https://your-render-service-name.onrender.com/api/cron/sync`
5. **Execution Schedule**: Every 10 minutes (or as needed).
6. **Headers**:
   - Key: `x-cron-secret`
   - Value: `The value you set for CRON_SECRET env var`
7. Save the job.

**Note**: This cron job will:
- Trigger any background logic defined in `/api/cron/sync`.

## 5. Frontend Deployment (Vercel)

1. Push your code to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New** -> **Project**.
3. Import your repository.
4. **Framework Preset**: Vite
5. **Root Directory**: `client` (Click Edit regarding "Root Directory" if needed and select `client`).
6. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://your-render-service-name.onrender.com/api` (The URL from Step 2 + `/api`)
7. Click **Deploy**.

### Connecting Frontend & Backend
- Ensure your Backend (Render) has `FRONTEND_URL` set to your new Vercel domain (e.g. `https://predictor-frontend.vercel.app`).
- Ensure your Frontend (Vercel) has `VITE_API_URL` set to your Render backend URL.

