# VintraXX Admin Panel Deployment Guide

## Prerequisites
- Node.js 18+
- Access to the backend API at `https://api.vintraxx.com`
- Admin user seeded in the database

## Admin Credentials
- **Email**: `podolskyidanylo@hotmail.com`
- **Password**: `home@1344`

## Local Development
```bash
cd vintraxxAdmin
npm install
npm run dev
```
The app runs at `http://localhost:3002` by default.

## Production Build
```bash
npm run build
npm start
```

## Environment Variables
Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=https://api.vintraxx.com/api/v1/admin
```

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push the `vintraxxAdmin` folder to a Git repository
2. Connect to Vercel and import the project
3. Set the environment variable `NEXT_PUBLIC_API_URL`
4. Deploy

### Option 2: Netlify
1. Push to Git
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Set environment variables

### Option 3: PM2 on Server
```bash
npm run build
pm2 start npm --name "vintraxx-admin" -- start
```

### Option 4: Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## DNS Configuration
Point `admin.vintraxx.com` to your deployment.

## Backend Requirements
Ensure the backend has:
1. Admin routes registered at `/api/v1/admin/*`
2. CORS configured for `admin.vintraxx.com`
3. Admin user seeded (run `npx ts-node src/scripts/seed-admin.ts` in vintraxxBackend)

## Features
- **Dashboard**: Overview stats, recent scans
- **Dealers**: Manage dealer accounts
- **Regular Users**: Manage regular user accounts
- **History**: View all scan history with pagination
- **Settings**: Change admin email/password
- **Backup**: Download full database backup
- **Dark/Light Mode**: Theme toggle
